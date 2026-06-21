using Microsoft.AspNetCore.Mvc;
using SurveyService.Services;

namespace SurveyService.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected IActionResult HandleApiException(ApiException ex)
    {
        return StatusCode(ex.StatusCode, new { message = ex.Message });
    }
}
