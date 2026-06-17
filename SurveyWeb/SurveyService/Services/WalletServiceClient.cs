using System.Net;
using System.Text.Json;

namespace SurveyService.Services;

public class WalletServiceClient : IWalletServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public WalletServiceClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task EscrowCampaignAsync(EscrowCampaignWalletRequest request)
    {
        await PostAsync("api/internal/wallets/campaigns/escrow", request);
    }

    public async Task<PayRewardWalletResponse> PayRewardAsync(PayRewardWalletRequest request)
    {
        return await PostAsync<PayRewardWalletResponse>("api/internal/wallets/submissions/reward", request);
    }

    public async Task RefundCampaignAsync(int campaignId, RefundCampaignWalletRequest request)
    {
        await PostAsync($"api/internal/wallets/campaigns/{campaignId}/refund", request);
    }

    private async Task PostAsync<TRequest>(string path, TRequest request)
    {
        AddInternalKey();
        var response = await _httpClient.PostAsJsonAsync(path, request);
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var message = await ReadErrorMessageAsync(response);
        var statusCode = response.StatusCode == HttpStatusCode.NotFound
            ? StatusCodes.Status404NotFound
            : StatusCodes.Status400BadRequest;
        throw new ApiException(statusCode, $"WalletService error: {message}");
    }

    private async Task<TResponse> PostAsync<TResponse>(string path, object request)
    {
        AddInternalKey();
        var response = await _httpClient.PostAsJsonAsync(path, request);
        if (response.IsSuccessStatusCode)
        {
            var result = await response.Content.ReadFromJsonAsync<TResponse>();
            return result ?? Activator.CreateInstance<TResponse>();
        }

        var message = await ReadErrorMessageAsync(response);
        var statusCode = response.StatusCode == HttpStatusCode.NotFound
            ? StatusCodes.Status404NotFound
            : StatusCodes.Status400BadRequest;
        throw new ApiException(statusCode, $"WalletService error: {message}");
    }

    private void AddInternalKey()
    {
        const string headerName = "X-Internal-Service-Key";
        _httpClient.DefaultRequestHeaders.Remove(headerName);
        _httpClient.DefaultRequestHeaders.Add(headerName, _configuration["InternalService:ApiKey"]);
    }

    private static async Task<string> ReadErrorMessageAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        if (string.IsNullOrWhiteSpace(body))
        {
            return response.ReasonPhrase ?? "Unknown error";
        }

        try
        {
            using var document = JsonDocument.Parse(body);
            if (document.RootElement.TryGetProperty("message", out var message))
            {
                return message.GetString() ?? body;
            }
        }
        catch (JsonException)
        {
            return body;
        }

        return body;
    }
}
