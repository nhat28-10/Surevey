using System.Net;
using System.Text.Json;

namespace WalletService.Services;

public class SurveyServiceClient : ISurveyServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public SurveyServiceClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<bool> IsCampaignOwnerAsync(int campaignId, int customerId)
    {
        AddInternalKey();
        var response = await _httpClient.GetAsync($"api/internal/campaigns/{campaignId}/ownership?customerId={customerId}");
        if (response.IsSuccessStatusCode)
        {
            var result = await response.Content.ReadFromJsonAsync<CampaignOwnershipSurveyResponse>();
            return result?.IsOwner == true;
        }

        var message = await ReadErrorMessageAsync(response);
        var statusCode = response.StatusCode == HttpStatusCode.NotFound
            ? StatusCodes.Status404NotFound
            : StatusCodes.Status400BadRequest;
        throw new ApiException(statusCode, $"SurveyService error: {message}");
    }

    public async Task MarkCampaignPaidAsync(MarkCampaignPaidSurveyRequest request)
    {
        AddInternalKey();
        var response = await _httpClient.PostAsJsonAsync($"api/internal/campaigns/{request.CampaignId}/mark-paid", new
        {
            request.PaymentId,
            request.RewardBudget,
            request.PlatformFeeAmount,
            request.TotalAmount,
            request.AnswerCount,
            request.UnitPricePerAnswer
        });

        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var message = await ReadErrorMessageAsync(response);
        var statusCode = response.StatusCode == HttpStatusCode.NotFound
            ? StatusCodes.Status404NotFound
            : StatusCodes.Status400BadRequest;
        throw new ApiException(statusCode, $"SurveyService error: {message}");
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

public class CampaignOwnershipSurveyResponse
{
    public int CampaignId { get; set; }
    public int CustomerId { get; set; }
    public bool IsOwner { get; set; }
}
