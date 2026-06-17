using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SurveyService.DTOs;
using SurveyService.Services;

namespace SurveyService.Controllers;

[ApiController]
[Authorize(Roles = "Collaborator")]
public class ParticipationsController : ApiControllerBase
{
    private readonly ISurveyFlowService _surveyFlowService;

    public ParticipationsController(ISurveyFlowService surveyFlowService)
    {
        _surveyFlowService = surveyFlowService;
    }

    [HttpGet("api/me/participations")]
    public async Task<IActionResult> MyParticipations()
    {
        try { return Ok(await _surveyFlowService.GetMyParticipationsAsync()); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }

    [HttpPost("api/participations/{participationId:int}/submissions")]
    public async Task<IActionResult> Submit(int participationId, [FromBody] SubmitSubmissionRequest request)
    {
        try { return Ok(await _surveyFlowService.SubmitParticipationAsync(participationId, request)); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }
}
