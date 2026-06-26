# SurveyWeb Migration Guide

Run migrations manually. The services do not run database updates automatically during production startup.

Install or update EF CLI:

```powershell
dotnet tool install --global dotnet-ef
dotnet tool update --global dotnet-ef
```

From `backend/SurveyWeb`, set the target service connection string, then run:

```powershell
dotnet ef database update --project UserService --startup-project UserService
dotnet ef database update --project SurveyService --startup-project SurveyService
dotnet ef database update --project WalletService --startup-project WalletService
```

For a single shared PostgreSQL database, use:

```text
ConnectionStrings__DefaultConnection=<postgres-connection-string>
```

For separate databases, use:

```text
ConnectionStrings__DefaultConnection=<user-db-connection-string>
ConnectionStrings__SurveyServiceConnection=<survey-db-connection-string>
ConnectionStrings__WalletServiceConnection=<wallet-db-connection-string>
```
