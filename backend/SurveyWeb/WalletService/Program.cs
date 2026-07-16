using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using WalletService.Data;
using WalletService.Services;

Environment.SetEnvironmentVariable("DOTNET_hostBuilder__reloadConfigOnChange", "false");

var builder = WebApplication.CreateBuilder(args);

var port = builder.Configuration["PORT"];
if (!string.IsNullOrWhiteSpace(port) && string.IsNullOrWhiteSpace(builder.Configuration["ASPNETCORE_URLS"]))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddDbContext<WalletDbContext>(options =>
    options.UseNpgsql(ResolvePostgresConnectionString(
        builder.Configuration,
        "WalletServiceConnection",
        "DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendLocal", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?.Where(origin => !string.IsNullOrWhiteSpace(origin))
            .ToArray();

        policy.WithOrigins(allowedOrigins is { Length: > 0 }
                ? allowedOrigins
                : [
                    "http://localhost:3000",
                    "http://localhost:5173",
                    "http://localhost:5080",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:5173",
                    "http://127.0.0.1:5080"
                ])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtKey = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(jwtKey)
    };
});

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IWalletFlowService, WalletFlowService>();
builder.Services.AddHttpClient<ISurveyServiceClient, SurveyServiceClient>((serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var baseUrl = configuration["ServiceUrls:SurveyService"]
        ?? configuration["Services:SurveyServiceBaseUrl"];
    if (!string.IsNullOrWhiteSpace(baseUrl))
    {
        client.BaseAddress = new Uri(baseUrl);
    }
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "WalletService API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<WalletDbContext>();
    dbContext.Database.Migrate();
}

app.UseCors("AllowFrontendLocal");

if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("ENABLE_SWAGGER"))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "WalletService API V1");
        c.RoutePrefix = "swagger";
    });
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "WalletService API V1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
app.Run();

static string ResolvePostgresConnectionString(IConfiguration configuration, params string[] connectionNames)
{
    foreach (var name in connectionNames)
    {
        var value = configuration.GetConnectionString(name);
        if (!string.IsNullOrWhiteSpace(value) && !IsPlaceholderConnectionString(value))
        {
            return NormalizePostgresConnectionString(value);
        }
    }

    var databaseUrl = configuration["DATABASE_URL"] ?? configuration["POSTGRES_URL"];
    if (!string.IsNullOrWhiteSpace(databaseUrl) && !IsPlaceholderConnectionString(databaseUrl))
    {
        return NormalizePostgresConnectionString(databaseUrl);
    }

    throw new InvalidOperationException(
        $"Missing valid database connection string. Set ConnectionStrings__{connectionNames[0]} or DATABASE_URL with a real Neon/Postgres value, not a placeholder.");
}

static string NormalizePostgresConnectionString(string connectionString)
{
    var value = connectionString.Trim().Trim('"', '\'').Trim().Trim('<', '>');
    var postgresUrlIndex = IndexOfPostgresUrl(value);
    if (postgresUrlIndex > 0)
    {
        value = value[postgresUrlIndex..].Split(' ', '\r', '\n', '\t')[0].Trim().Trim('"', '\'').Trim('<', '>');
    }

    if (!value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
        && !value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            return new NpgsqlConnectionStringBuilder(value).ConnectionString;
        }
        catch (ArgumentException ex)
        {
            throw new InvalidOperationException(
                "Invalid Postgres connection string. Use Neon/.NET format like 'Host=...;Database=...;Username=...;Password=...' or URL format 'postgresql://user:password@host/database?sslmode=require'.",
                ex);
        }
    }

    var uri = new Uri(value);
    var userInfo = uri.UserInfo.Split(':', 2);
    var builder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
        Username = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(0) ?? ""),
        Password = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(1) ?? "")
    };

    foreach (var pair in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
    {
        var parts = pair.Split('=', 2);
        if (parts.Length == 2 && parts[0].Equals("sslmode", StringComparison.OrdinalIgnoreCase)
            && Enum.TryParse<SslMode>(Uri.UnescapeDataString(parts[1]), true, out var sslMode))
        {
            builder.SslMode = sslMode;
        }
    }

    return builder.ConnectionString;
}

static bool IsPlaceholderConnectionString(string value)
{
    var trimmed = value.Trim().Trim('"', '\'');
    return trimmed.Length == 0
        || trimmed.Equals("<NEON_CONNECTION_STRING>", StringComparison.OrdinalIgnoreCase)
        || trimmed.Equals("<DATABASE_URL>", StringComparison.OrdinalIgnoreCase)
        || trimmed.Equals("NEON_CONNECTION_STRING", StringComparison.OrdinalIgnoreCase)
        || trimmed.Equals("DATABASE_URL", StringComparison.OrdinalIgnoreCase);
}

static int IndexOfPostgresUrl(string value)
{
    var postgresIndex = value.IndexOf("postgres://", StringComparison.OrdinalIgnoreCase);
    var postgresqlIndex = value.IndexOf("postgresql://", StringComparison.OrdinalIgnoreCase);

    if (postgresIndex < 0) return postgresqlIndex;
    if (postgresqlIndex < 0) return postgresIndex;
    return Math.Min(postgresIndex, postgresqlIndex);
}
