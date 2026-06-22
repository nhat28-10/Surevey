using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SurveyService.DTOs;
using SurveyService.Services;

namespace SurveyService.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/campaigns")]
public class AdminCampaignsController : ApiControllerBase
{
    private readonly ISurveyFlowService _surveyFlowService;

    public AdminCampaignsController(ISurveyFlowService surveyFlowService)
    {
        _surveyFlowService = surveyFlowService;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> Pending()
    {
        try { return Ok(await _surveyFlowService.GetPendingCampaignsAsync()); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }

    [HttpPost("{campaignId:int}/approve")]
    public async Task<IActionResult> Approve(int campaignId)
    {
        try { return Ok(await _surveyFlowService.ApproveCampaignAsync(campaignId)); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }

    [HttpPost("{campaignId:int}/reject")]
    public async Task<IActionResult> Reject(int campaignId, [FromBody] RejectCampaignRequest request)
    {
        try { return Ok(await _surveyFlowService.RejectCampaignAsync(campaignId, request)); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }
}
