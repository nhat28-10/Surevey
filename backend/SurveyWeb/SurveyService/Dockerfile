FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["SurveyService/SurveyService.csproj", "SurveyService/"]
RUN dotnet restore "SurveyService/SurveyService.csproj"

COPY . .
RUN dotnet publish "SurveyService/SurveyService.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "SurveyService.dll"]
