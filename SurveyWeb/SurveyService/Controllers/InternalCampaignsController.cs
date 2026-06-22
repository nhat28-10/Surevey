using Microsoft.AspNetCore.Mvc;
using SurveyService.DTOs;
using SurveyService.Services;

namespace SurveyService.Controllers;

[ApiController]
[Route("api/internal/campaigns")]
public class InternalCampaignsController : ApiControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ISurveyFlowService _surveyFlowService;

    public InternalCampaignsController(IConfiguration configuration, ISurveyFlowService surveyFlowService)
    {
        _configuration = configuration;
        _surveyFlowService = surveyFlowService;
    }

    [HttpPost("{campaignId:int}/mark-paid")]
    public async Task<IActionResult> MarkPaid(int campaignId, [FromBody] MarkCampaignPaidRequest request)
    {
        var unauthorized = ValidateInternalKey();
        if (unauthorized != null) return unauthorized;

        try
        {
            return Ok(await _surveyFlowService.MarkCampaignPaidAsync(campaignId, request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    private IActionResult? ValidateInternalKey()
    {
        var expectedKey = _configuration["InternalService:ApiKey"];
        var providedKey = Request.Headers["X-Internal-Service-Key"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(expectedKey) || providedKey != expectedKey)
        {
            return Unauthorized(new { message = "Invalid internal service key." });
        }

        return null;
    }
}
