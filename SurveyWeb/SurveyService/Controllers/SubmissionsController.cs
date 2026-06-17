using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SurveyService.DTOs;
using SurveyService.Services;

namespace SurveyService.Controllers;

[ApiController]
[Authorize(Roles = "Customer")]
[Route("api/submissions")]
public class SubmissionsController : ApiControllerBase
{
    private readonly ISurveyFlowService _surveyFlowService;

    public SubmissionsController(ISurveyFlowService surveyFlowService)
    {
        _surveyFlowService = surveyFlowService;
    }

    [HttpGet("{submissionId:int}")]
    public async Task<IActionResult> Get(int submissionId)
    {
        try { return Ok(await _surveyFlowService.GetSubmissionAsync(submissionId)); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }

    [HttpPost("{submissionId:int}/approve")]
    public async Task<IActionResult> Approve(int submissionId)
    {
        try { return Ok(await _surveyFlowService.ApproveSubmissionAsync(submissionId)); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }

    [HttpPost("{submissionId:int}/reject")]
    public async Task<IActionResult> Reject(int submissionId, [FromBody] RejectSubmissionRequest request)
    {
        try { return Ok(await _surveyFlowService.RejectSubmissionAsync(submissionId, request)); }
        catch (ApiException ex) { return HandleApiException(ex); }
    }
}
