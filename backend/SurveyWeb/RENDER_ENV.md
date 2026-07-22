# Render Backend Environment Template

This file is a safe deployment template for the backend services only. Do not paste real secrets into this repository. Configure real values in each Render Web Service's Environment tab.

All commands and paths below assume the repository root contains `backend/SurveyWeb`.

## Common Render Setup

Create four Render Web Services using Docker.

Use these common environment variables on every backend service:

```text
ASPNETCORE_ENVIRONMENT=Production
ENABLE_SWAGGER=true
PORT=10000
Jwt__Key=<CHANGE_ME_LONG_SECRET>
Jwt__Issuer=SureVey
Jwt__Audience=SureVey
InternalService__ApiKey=<CHANGE_ME_INTERNAL_API_KEY>
```

Render normally injects `PORT` automatically. Setting `PORT=10000` explicitly is safe when using Render's default web-service port. Each service's `Program.cs` reads `PORT` and binds to `http://0.0.0.0:{PORT}` when `ASPNETCORE_URLS` is not set.

Optional variables that may be useful on browser-facing services:

```text
Cors__AllowedOrigins__0=https://<frontend-domain>
AllowedHosts=*
ASPNETCORE_URLS=http://0.0.0.0:10000
```

`ASPNETCORE_URLS` is optional. If set, it overrides the `PORT` binding logic.

## UserService

Render configuration:

```text
Root Directory: backend/SurveyWeb
Dockerfile Path: UserService/Dockerfile
Docker Context Directory: .
```

Required environment variables:

```text
ASPNETCORE_ENVIRONMENT=Production
ENABLE_SWAGGER=true
PORT=10000
ConnectionStrings__DefaultConnection=<NEON_CONNECTION_STRING>
Jwt__Key=<CHANGE_ME_LONG_SECRET>
Jwt__Issuer=SureVey
Jwt__Audience=SureVey
InternalService__ApiKey=<CHANGE_ME_INTERNAL_API_KEY>
Authentication__Google__ClientId=<GOOGLE_CLIENT_ID_OR_DUMMY>
Authentication__Google__ClientSecret=<GOOGLE_CLIENT_SECRET_OR_DUMMY>
```

Optional environment variables:

```text
Cors__AllowedOrigins__0=https://<frontend-domain>
AllowedHosts=*
ASPNETCORE_URLS=http://0.0.0.0:10000
Jwt__ExpireMinutes=60
```

Health and Swagger URLs:

```text
https://<user-service>.onrender.com/health
https://<user-service>.onrender.com/swagger
https://<user-service>.onrender.com/swagger/v1/swagger.json
```

## SurveyService

Render configuration:

```text
Root Directory: backend/SurveyWeb
Dockerfile Path: SurveyService/Dockerfile
Docker Context Directory: .
```

Required environment variables:

```text
ASPNETCORE_ENVIRONMENT=Production
ENABLE_SWAGGER=true
PORT=10000
ConnectionStrings__SurveyServiceConnection=<NEON_CONNECTION_STRING>
ServiceUrls__WalletService=https://<wallet-service>.onrender.com
Jwt__Key=<CHANGE_ME_LONG_SECRET>
Jwt__Issuer=SureVey
Jwt__Audience=SureVey
InternalService__ApiKey=<CHANGE_ME_INTERNAL_API_KEY>
```

Optional environment variables:

```text
ConnectionStrings__DefaultConnection=<NEON_CONNECTION_STRING>
Cors__AllowedOrigins__0=https://<frontend-domain>
AllowedHosts=*
ASPNETCORE_URLS=http://0.0.0.0:10000
Jwt__ExpireMinutes=60
Services__WalletServiceBaseUrl=https://<wallet-service>.onrender.com
```

`Services__WalletServiceBaseUrl` is a legacy fallback. Prefer `ServiceUrls__WalletService`.

Health and Swagger URLs:

```text
https://<survey-service>.onrender.com/health
https://<survey-service>.onrender.com/swagger
https://<survey-service>.onrender.com/swagger/v1/swagger.json
```

## WalletService

Render configuration:

```text
Root Directory: backend/SurveyWeb
Dockerfile Path: WalletService/Dockerfile
Docker Context Directory: .
```

Required environment variables:

```text
ASPNETCORE_ENVIRONMENT=Production
ENABLE_SWAGGER=true
PORT=10000
ConnectionStrings__WalletServiceConnection=<NEON_CONNECTION_STRING>
ServiceUrls__SurveyService=https://<survey-service>.onrender.com
Jwt__Key=<CHANGE_ME_LONG_SECRET>
Jwt__Issuer=SureVey
Jwt__Audience=SureVey
InternalService__ApiKey=<CHANGE_ME_INTERNAL_API_KEY>
ManualPayment__BankName=<BANK_NAME>
ManualPayment__BankAccountName=<BANK_ACCOUNT_NAME>
ManualPayment__BankAccountNumber=<BANK_ACCOUNT_NUMBER>
ManualPayment__QrImageUrl=<QR_IMAGE_URL_OR_EMPTY>
SePay__BankShortName=<VIETQR_BANK_SHORT_NAME>
SePay__WebhookApiKey=<CHANGE_ME_SEPAY_WEBHOOK_API_KEY>
SePay__WebhookSecret=
SePay__RequireExactAmount=true
SePay__RequireAccountMatch=true
```

Optional environment variables:

```text
ConnectionStrings__DefaultConnection=<NEON_CONNECTION_STRING>
Cors__AllowedOrigins__0=https://<frontend-domain>
AllowedHosts=*
ASPNETCORE_URLS=http://0.0.0.0:10000
Jwt__ExpireMinutes=60
Services__SurveyServiceBaseUrl=https://<survey-service>.onrender.com
```

`Services__SurveyServiceBaseUrl` is a legacy fallback. Prefer `ServiceUrls__SurveyService`.

Health and Swagger URLs:

```text
https://<wallet-service>.onrender.com/health
https://<wallet-service>.onrender.com/swagger
https://<wallet-service>.onrender.com/swagger/v1/swagger.json
```

## ApiGateway

Render configuration:

```text
Root Directory: backend/SurveyWeb
Dockerfile Path: ApiGateway/Dockerfile
Docker Context Directory: .
```

Required environment variables:

```text
ASPNETCORE_ENVIRONMENT=Production
ENABLE_SWAGGER=true
PORT=10000
Jwt__Key=<CHANGE_ME_LONG_SECRET>
Jwt__Issuer=SureVey
Jwt__Audience=SureVey
InternalService__ApiKey=<CHANGE_ME_INTERNAL_API_KEY>
ServiceUrls__UserService=https://<user-service>.onrender.com
ServiceUrls__SurveyService=https://<survey-service>.onrender.com
ServiceUrls__WalletService=https://<wallet-service>.onrender.com
```

Optional environment variables:

```text
Cors__AllowedOrigins__0=https://<frontend-domain>
AllowedHosts=*
ASPNETCORE_URLS=http://0.0.0.0:10000
```

Health and Swagger URLs:

```text
https://<api-gateway>.onrender.com/health
https://<api-gateway>.onrender.com/swagger
https://<api-gateway>.onrender.com/user/swagger/v1/swagger.json
https://<api-gateway>.onrender.com/survey/swagger/v1/swagger.json
https://<api-gateway>.onrender.com/wallet/swagger/v1/swagger.json
```

The gateway proxies application traffic using these prefixes:

```text
https://<api-gateway>.onrender.com/user
https://<api-gateway>.onrender.com/survey
https://<api-gateway>.onrender.com/wallet
```

## Environment Variable Names Found

The services use .NET configuration binding, so nested configuration keys become environment variables with double underscores.

UserService:

```text
PORT
ASPNETCORE_URLS
ENABLE_SWAGGER
ConnectionStrings__DefaultConnection
Jwt__Key
Jwt__Issuer
Jwt__Audience
Jwt__ExpireMinutes
Authentication__Google__ClientId
Authentication__Google__ClientSecret
Cors__AllowedOrigins__0
AllowedHosts
```

SurveyService:

```text
PORT
ASPNETCORE_URLS
ENABLE_SWAGGER
ConnectionStrings__SurveyServiceConnection
ConnectionStrings__DefaultConnection
ServiceUrls__WalletService
Services__WalletServiceBaseUrl
Jwt__Key
Jwt__Issuer
Jwt__Audience
Jwt__ExpireMinutes
InternalService__ApiKey
Cors__AllowedOrigins__0
AllowedHosts
```

WalletService:

```text
PORT
ASPNETCORE_URLS
ENABLE_SWAGGER
ConnectionStrings__WalletServiceConnection
ConnectionStrings__DefaultConnection
ServiceUrls__SurveyService
Services__SurveyServiceBaseUrl
Jwt__Key
Jwt__Issuer
Jwt__Audience
Jwt__ExpireMinutes
InternalService__ApiKey
ManualPayment__BankName
ManualPayment__BankAccountName
ManualPayment__BankAccountNumber
ManualPayment__QrImageUrl
SePay__BankShortName
SePay__WebhookApiKey
SePay__WebhookSecret
SePay__RequireExactAmount
SePay__RequireAccountMatch
Cors__AllowedOrigins__0
AllowedHosts
```

ApiGateway:

```text
PORT
ASPNETCORE_URLS
ENABLE_SWAGGER
ServiceUrls__UserService
ServiceUrls__SurveyService
ServiceUrls__WalletService
Cors__AllowedOrigins__0
AllowedHosts
```

## Notes

- Keep `Jwt__Key` and `InternalService__ApiKey` identical across services.
- Use real database/API/secret values only in Render, never in committed files.
- Run EF Core migrations against the production database separately; service startup does not apply migrations.
- `SurveyService` and `WalletService` call each other using `InternalService__ApiKey`; mismatched keys will break internal endpoints.
