using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SurveyService.Services;

namespace SurveyService.Controllers;

[ApiController]
[Authorize(Roles = "Collaborator")]
[Route("api/surveys")]
public class SurveysController : ApiControllerBase
{
    private readonly ISurveyFlowService _surveyFlowService;

    public SurveysController(ISurveyFlowService surveyFlowService)
    {
        _surveyFlowService = surveyFlowService;
    }

    [HttpGet("available")]
    public async Task<IActionResult> Available()
    {
        try { return Ok(await _surveyFlowService.GetAvailableSurveysAsync()); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }
}
