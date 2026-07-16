using System.Text.Json.Nodes;
using Microsoft.OpenApi.Models;
using Yarp.ReverseProxy.Configuration;

Environment.SetEnvironmentVariable("DOTNET_hostBuilder__reloadConfigOnChange", "false");

var builder = WebApplication.CreateBuilder(args);

var port = builder.Configuration["PORT"];
if (!string.IsNullOrWhiteSpace(port) && string.IsNullOrWhiteSpace(builder.Configuration["ASPNETCORE_URLS"]))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("gateway", new OpenApiInfo
    {
        Title = "SurveyWeb ApiGateway",
        Version = "gateway"
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {token}"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
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

var services = new[]
{
    new GatewayService("user", "UserService", "UserService API", builder.Configuration["ServiceUrls:UserService"]),
    new GatewayService("survey", "SurveyService", "SurveyService API", builder.Configuration["ServiceUrls:SurveyService"]),
    new GatewayService("wallet", "WalletService", "WalletService API", builder.Configuration["ServiceUrls:WalletService"])
};

foreach (var service in services)
{
    if (string.IsNullOrWhiteSpace(service.BaseUrl))
    {
        throw new InvalidOperationException(
            $"Missing ServiceUrls:{service.Name}. Set environment variable ServiceUrls__{service.Name}.");
    }
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("GatewayCors", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
            ?.Where(origin => !string.IsNullOrWhiteSpace(origin))
            .ToArray();

        if (allowedOrigins is { Length: > 0 })
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else
        {
            policy.AllowAnyHeader()
                .AllowAnyMethod()
                .SetIsOriginAllowed(origin => Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                    && (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                        || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)));
        }
    });
});

builder.Services.AddHttpClient("swagger");
builder.Services.AddReverseProxy()
    .LoadFromMemory(CreateRoutes(services), CreateClusters(services));

var app = builder.Build();

app.UseCors("GatewayCors");

if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("ENABLE_SWAGGER"))
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.RoutePrefix = "swagger";
        options.SwaggerEndpoint("/user/swagger/v1/swagger.json", "UserService API");
        options.SwaggerEndpoint("/survey/swagger/v1/swagger.json", "SurveyService API");
        options.SwaggerEndpoint("/wallet/swagger/v1/swagger.json", "WalletService API");
    });
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

foreach (var service in services)
{
    app.MapGet($"/{service.Prefix}/swagger/v1/swagger.json", async (
        IHttpClientFactory httpClientFactory,
        CancellationToken cancellationToken) =>
    {
        var client = httpClientFactory.CreateClient("swagger");
        var swaggerUrl = new Uri(new Uri(service.BaseUrl!.TrimEnd('/') + "/"), "swagger/v1/swagger.json");
        using var response = await client.GetAsync(swaggerUrl, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return Results.Problem(
                title: $"{service.Name} Swagger is unavailable",
                detail: $"GET {swaggerUrl} returned {(int)response.StatusCode} {response.ReasonPhrase}",
                statusCode: StatusCodes.Status502BadGateway);
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var document = await JsonNode.ParseAsync(stream, cancellationToken: cancellationToken);
        if (document is null)
        {
            return Results.Problem(
                title: $"{service.Name} Swagger returned an empty document",
                statusCode: StatusCodes.Status502BadGateway);
        }

        document["servers"] = new JsonArray(new JsonObject { ["url"] = $"/{service.Prefix}" });
        return Results.Json(document);
    });
}

app.MapReverseProxy();
app.Run();

static IReadOnlyList<RouteConfig> CreateRoutes(IEnumerable<GatewayService> services)
{
    return services.Select(service => new RouteConfig
    {
        RouteId = $"{service.Name}-route",
        ClusterId = service.Name,
        Match = new RouteMatch
        {
            Path = $"/{service.Prefix}/{{**catch-all}}"
        },
        Transforms =
        [
            new Dictionary<string, string>
            {
                ["PathRemovePrefix"] = $"/{service.Prefix}"
            }
        ]
    }).ToArray();
}

static IReadOnlyList<ClusterConfig> CreateClusters(IEnumerable<GatewayService> services)
{
    return services.Select(service => new ClusterConfig
    {
        ClusterId = service.Name,
        Destinations = new Dictionary<string, DestinationConfig>
        {
            [$"{service.Name}-destination"] = new()
            {
                Address = service.BaseUrl!.TrimEnd('/') + "/"
            }
        }
    }).ToArray();
}

internal sealed record GatewayService(string Prefix, string Name, string DisplayName, string? BaseUrl);
