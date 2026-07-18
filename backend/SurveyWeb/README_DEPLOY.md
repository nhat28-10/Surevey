# SurveyWeb Deployment Guide

## Target

Deploy 4 Docker-compatible web services:

- `UserService`
- `SurveyService`
- `WalletService`
- `ApiGateway`

Tester entrypoint:

```text
https://<api-gateway-domain>/swagger
```

## Local Run

Run from `backend/SurveyWeb` in 4 terminals:

```powershell
dotnet run --project UserService\UserService.csproj --launch-profile http
dotnet run --project SurveyService\SurveyService.csproj --launch-profile http
dotnet run --project WalletService\WalletService.csproj --launch-profile http
dotnet run --project ApiGateway\ApiGateway.csproj --launch-profile http
```

Local URLs:

- UserService: `http://localhost:5178`
- SurveyService: `http://localhost:5159`
- WalletService: `http://localhost:5258`
- ApiGateway: `http://localhost:5088`

Local Gateway Swagger:

```text
http://localhost:5088/swagger
```

Health checks:

- `http://localhost:5178/health`
- `http://localhost:5159/health`
- `http://localhost:5258/health`
- `http://localhost:5088/health`

## PostgreSQL Online

Create a PostgreSQL database on Neon or another hosted provider. Copy the pooled or direct connection string and set it as an environment variable.

Single shared database option:

```text
ConnectionStrings__DefaultConnection=Host=...;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true
```

Separate database option:

```text
ConnectionStrings__DefaultConnection=<user-db-connection-string>
ConnectionStrings__SurveyServiceConnection=<survey-db-connection-string>
ConnectionStrings__WalletServiceConnection=<wallet-db-connection-string>
```

`SurveyService` and `WalletService` fall back to `ConnectionStrings__DefaultConnection` if their service-specific connection string is not set.

## Common Env

Set on every service:

```text
ASPNETCORE_ENVIRONMENT=Production
ENABLE_SWAGGER=true
Jwt__Key=replace-with-long-secret-at-least-32-characters
Jwt__Issuer=SureVey
Jwt__Audience=SureVey
InternalService__ApiKey=replace-with-internal-api-key
Cors__AllowedOrigins__0=http://localhost:3000
Cors__AllowedOrigins__1=https://replace-frontend-domain
```

Render normally provides `PORT`. The apps also respect `ASPNETCORE_URLS`.

## Deploy Order

1. Deploy `UserService`.
2. Deploy `SurveyService`.
3. Deploy `WalletService`.
4. Deploy `ApiGateway`.

After deploying the first 3 services, copy their public URLs into `ApiGateway` env variables.

## Dockerfile Paths

Build from `backend/SurveyWeb`:

```powershell
docker build -f UserService/Dockerfile -t surveyweb-user-service .
docker build -f SurveyService/Dockerfile -t surveyweb-survey-service .
docker build -f WalletService/Dockerfile -t surveyweb-wallet-service .
docker build -f ApiGateway/Dockerfile -t surveyweb-api-gateway .
```

Render service Dockerfile paths:

- `UserService/Dockerfile`
- `SurveyService/Dockerfile`
- `WalletService/Dockerfile`
- `ApiGateway/Dockerfile`

## Service Env

UserService:

```text
ConnectionStrings__DefaultConnection=<user-postgres-connection-string>
Authentication__Google__ClientId=<google-client-id>
Authentication__Google__ClientSecret=<google-client-secret>
```

SurveyService:

```text
ConnectionStrings__DefaultConnection=<survey-postgres-connection-string>
ServiceUrls__WalletService=https://<wallet-service-domain>
```

WalletService:

```text
ConnectionStrings__DefaultConnection=<wallet-postgres-connection-string>
ServiceUrls__SurveyService=https://<survey-service-domain>
ManualPayment__BankName=<bank-name>
ManualPayment__BankAccountName=<bank-account-name>
ManualPayment__BankAccountNumber=<bank-account-number>
ManualPayment__QrImageUrl=<qr-image-url>
```

ApiGateway:

```text
ServiceUrls__UserService=https://<user-service-domain>
ServiceUrls__SurveyService=https://<survey-service-domain>
ServiceUrls__WalletService=https://<wallet-service-domain>
```

## Migration

Install or update EF CLI if needed:

```powershell
dotnet tool install --global dotnet-ef
dotnet tool update --global dotnet-ef
```

Run migrations from `backend/SurveyWeb` after setting the correct connection string env for each service:

```powershell
dotnet ef database update --project UserService --startup-project UserService
dotnet ef database update --project SurveyService --startup-project SurveyService
dotnet ef database update --project WalletService --startup-project WalletService
```

Do not rely on production startup to run migrations automatically.

## Swagger

Each service exposes Swagger when `ENABLE_SWAGGER=true`:

- UserService: `https://<user-service-domain>/swagger`
- SurveyService: `https://<survey-service-domain>/swagger`
- WalletService: `https://<wallet-service-domain>/swagger`

Gateway Swagger:

```text
https://<api-gateway-domain>/swagger
```

Gateway proxied Swagger JSON:

- `https://<api-gateway-domain>/user/swagger/v1/swagger.json`
- `https://<api-gateway-domain>/survey/swagger/v1/swagger.json`
- `https://<api-gateway-domain>/wallet/swagger/v1/swagger.json`

The Gateway forwards the `Authorization` header to downstream services. Use the Swagger Authorize button with:

```text
Bearer <jwt-token>
```

## Final Checklist

- All 4 services return `200 OK` from `/health`.
- User/Survey/Wallet service Swagger pages load when `ENABLE_SWAGGER=true`.
- ApiGateway `/swagger` dropdown shows `UserService API`, `SurveyService API`, and `WalletService API`.
- ApiGateway env points to public service URLs, not localhost.
- JWT settings and internal service API key match across services.
- Migrations have been run against the deployed PostgreSQL database.
