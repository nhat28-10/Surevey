using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SurveyService.DTOs;
using SurveyService.Services;

namespace SurveyService.Controllers;

[ApiController]
[Authorize]
[Route("api/campaigns")]
public class CampaignsController : ApiControllerBase
{
    private readonly ISurveyFlowService _surveyFlowService;

    public CampaignsController(ISurveyFlowService surveyFlowService)
    {
        _surveyFlowService = surveyFlowService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCampaignRequest request)
    {
        try { return Ok(await _surveyFlowService.CreateCampaignAsync(request)); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }

    [HttpGet("my")]
    public async Task<IActionResult> MyCampaigns()
    {
        try { return Ok(await _surveyFlowService.GetMyCampaignsAsync()); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }

    [HttpGet("{campaignId:int}")]
    public async Task<IActionResult> Get(int campaignId)
    {
        try { return Ok(await _surveyFlowService.GetCampaignAsync(campaignId)); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }

    [HttpPost("{campaignId:int}/submit-review")]
    public async Task<IActionResult> SubmitReview(int campaignId)
    {
        try { return Ok(await _surveyFlowService.SubmitCampaignForReviewAsync(campaignId)); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }

    [HttpGet("{campaignId:int}/submissions")]
    public async Task<IActionResult> Submissions(int campaignId)
    {
        try { return Ok(await _surveyFlowService.GetCampaignSubmissionsAsync(campaignId)); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }

    [HttpPost("{campaignId:int}/accept")]
    public async Task<IActionResult> Accept(int campaignId)
    {
        try { return Ok(await _surveyFlowService.AcceptCampaignAsync(campaignId)); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }
}
