FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["WalletService/WalletService.csproj", "WalletService/"]
RUN dotnet restore "WalletService/WalletService.csproj"

COPY . .
RUN dotnet publish "WalletService/WalletService.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "WalletService.dll"]
