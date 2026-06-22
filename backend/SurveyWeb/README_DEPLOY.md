# SurveyWeb Deploy Notes

## Local Run

Run these from `backend/SurveyWeb` in four terminals:

```powershell
dotnet run --project UserService\UserService.csproj --launch-profile http
dotnet run --project SurveyService\SurveyService.csproj --launch-profile http
dotnet run --project WalletService\WalletService.csproj --launch-profile http
dotnet run --project ApiGateway\ApiGateway.csproj --launch-profile http
```

Local URLs from the current `launchSettings.json` files:

- UserService: `http://localhost:5178`
- SurveyService: `http://localhost:5159`
- WalletService: `http://localhost:5258`
- ApiGateway: `http://localhost:5088`

The gateway local fallback in `ApiGateway/appsettings.Development.json` matches those service ports.

## ApiGateway Environment Variables

Set these in production or any non-development deployment:

```text
ServiceUrls__UserService=https://<user-service-domain>
ServiceUrls__SurveyService=https://<survey-service-domain>
ServiceUrls__WalletService=https://<wallet-service-domain>
```

Optional CORS origins for frontend deployments:

```text
Cors__AllowedOrigins__0=https://<frontend-domain>
Cors__AllowedOrigins__1=http://localhost:3000
Cors__AllowedOrigins__2=http://localhost:5173
```

For platforms that provide a dynamic port, set `PORT`. If the platform uses ASP.NET Core conventions, `ASPNETCORE_URLS` also works.

## Deploy Services

Deploy each backend service separately and keep its own required environment variables and database settings:

- `UserService/UserService.csproj`
- `SurveyService/SurveyService.csproj`
- `WalletService/WalletService.csproj`

After each service is deployed, verify its debug Swagger if exposed:

- UserService: `https://<user-service-domain>/swagger`
- SurveyService: `https://<survey-service-domain>/swagger`
- WalletService: `https://<wallet-service-domain>/swagger`

## Deploy ApiGateway

Build the gateway container from the solution root:

```powershell
docker build -f ApiGateway/Dockerfile -t surveyweb-api-gateway .
```

Run locally with deployed or local service URLs:

```powershell
docker run --rm -p 8080:8080 `
  -e PORT=8080 `
  -e ServiceUrls__UserService=http://host.docker.internal:5178 `
  -e ServiceUrls__SurveyService=http://host.docker.internal:5159 `
  -e ServiceUrls__WalletService=http://host.docker.internal:5258 `
  surveyweb-api-gateway
```

For production, deploy `ApiGateway/Dockerfile` and set the three `ServiceUrls__...` variables to the deployed service domains. Do not rely on localhost in production.

## Gateway Swagger

Use one Swagger UI after deploy:

```text
https://<gateway-domain>/swagger
```

The gateway exposes service Swagger JSON through:

- `https://<gateway-domain>/user/swagger/v1/swagger.json`
- `https://<gateway-domain>/survey/swagger/v1/swagger.json`
- `https://<gateway-domain>/wallet/swagger/v1/swagger.json`

JWT Bearer tokens entered in Swagger Authorize are sent as the `Authorization` header and are forwarded by the gateway to the downstream services.

## Health Check

```text
GET https://<gateway-domain>/health
```

Expected response: `200 OK`.
