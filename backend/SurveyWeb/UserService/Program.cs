using System.Text;
using Microsoft.AspNetCore.Authentication.OAuth.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using UserService;
using UserService.Models;
using UserService.Repositories;
using UserService.Services;
using Microsoft.AspNetCore.Authentication;

Environment.SetEnvironmentVariable("DOTNET_hostBuilder__reloadConfigOnChange", "false");

var builder = WebApplication.CreateBuilder(args);

var port = builder.Configuration["PORT"];
if (!string.IsNullOrWhiteSpace(port) && string.IsNullOrWhiteSpace(builder.Configuration["ASPNETCORE_URLS"]))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// ── Swagger với JWT Bearer ──────────────────────────────────────────
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "UserService API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập: Bearer {token}"
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

builder.Services.AddControllers();

// ── Database ────────────────────────────────────────────────────────
builder.Services.AddDbContext<MyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddMemoryCache();


// ── CORS ────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowMVC", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?.Where(origin => !string.IsNullOrWhiteSpace(origin))
            .ToArray();

        policy.WithOrigins(allowedOrigins is { Length: > 0 }
                ? allowedOrigins
                : ["http://localhost:5080"])
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// ── JWT Authentication ───────────────────────────────────────────────
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
})
// ── Google OAuth ─────────────────────────────────────────────────────
.AddGoogle(options =>
{
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
    options.Scope.Add("profile");
    options.ClaimActions.MapJsonKey("urn:google:picture", "picture", "url");
    options.SaveTokens = true;
});

builder.Services.AddAuthorization();

// ── Dependency Injection ─────────────────────────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService.Services.UserService>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<OtpService>();

var app = builder.Build();

// ── Seed roles ───────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MyDbContext>();
    dbContext.SeedRoles();
    SeedAdminAccount(dbContext, app.Configuration);
}

app.UseCors("AllowMVC");

if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("ENABLE_SWAGGER"))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "UserService API V1");
        c.RoutePrefix = "swagger";
    });
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "UserService API V1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
app.Run();

static void SeedAdminAccount(MyDbContext dbContext, IConfiguration configuration)
{
    var email = FirstConfiguredValue(configuration, "SeedAdmin:Email", "SEED_ADMIN_EMAIL");
    var password = FirstConfiguredValue(configuration, "SeedAdmin:Password", "SEED_ADMIN_PASSWORD");

    if (string.IsNullOrWhiteSpace(email) && string.IsNullOrWhiteSpace(password))
    {
        return;
    }

    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
    {
        throw new InvalidOperationException("SeedAdmin requires both Email and Password.");
    }

    var adminRole = dbContext.Roles.FirstOrDefault(role => role.RoleName == "Admin")
        ?? throw new InvalidOperationException("Admin role has not been seeded.");

    var normalizedEmail = email.Trim().ToLowerInvariant();
    var user = dbContext.Users.FirstOrDefault(existing => existing.Email == normalizedEmail);
    var resetPassword = configuration.GetValue<bool>("SeedAdmin:ResetPassword")
        || configuration.GetValue<bool>("SEED_ADMIN_RESET_PASSWORD");

    if (user == null)
    {
        var requestedUserName = FirstConfiguredValue(configuration, "SeedAdmin:UserName", "SEED_ADMIN_USERNAME");
        var userName = BuildUniqueAdminUserName(dbContext, requestedUserName, normalizedEmail);
        var fullName = FirstConfiguredValue(configuration, "SeedAdmin:FullName", "SEED_ADMIN_FULL_NAME")
            ?? "System Admin";

        dbContext.Users.Add(new User
        {
            UserName = userName,
            Email = normalizedEmail,
            Password = BCrypt.Net.BCrypt.HashPassword(password),
            FullName = fullName.Trim(),
            RoleId = adminRole.RoleId,
            Role = adminRole
        });
    }
    else
    {
        user.RoleId = adminRole.RoleId;
        if (string.IsNullOrWhiteSpace(user.Password) || resetPassword)
        {
            user.Password = BCrypt.Net.BCrypt.HashPassword(password);
        }
    }

    dbContext.SaveChanges();
}

static string? FirstConfiguredValue(IConfiguration configuration, params string[] keys)
{
    foreach (var key in keys)
    {
        var value = configuration[key];
        if (!string.IsNullOrWhiteSpace(value))
        {
            return value;
        }
    }

    return null;
}

static string BuildUniqueAdminUserName(MyDbContext dbContext, string? requestedUserName, string email)
{
    var baseUserName = string.IsNullOrWhiteSpace(requestedUserName)
        ? email.Split('@')[0]
        : requestedUserName.Trim();

    baseUserName = baseUserName.Length > 40 ? baseUserName[..40] : baseUserName;
    var userName = baseUserName;
    var suffix = 1;

    while (dbContext.Users.Any(user => user.UserName == userName))
    {
        var suffixText = $"_{suffix++}";
        var maxBaseLength = Math.Max(1, 50 - suffixText.Length);
        var trimmedBase = baseUserName.Length > maxBaseLength ? baseUserName[..maxBaseLength] : baseUserName;
        userName = $"{trimmedBase}{suffixText}";
    }

    return userName;
}
