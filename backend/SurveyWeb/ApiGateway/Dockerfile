FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["SurveyWeb.sln", "./"]
COPY ["ApiGateway/ApiGateway.csproj", "ApiGateway/"]
COPY ["UserService/UserService.csproj", "UserService/"]
COPY ["SurveyService/SurveyService.csproj", "SurveyService/"]
COPY ["WalletService/WalletService.csproj", "WalletService/"]
RUN dotnet restore "ApiGateway/ApiGateway.csproj"

COPY . .
RUN dotnet publish "ApiGateway/ApiGateway.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "ApiGateway.dll"]
