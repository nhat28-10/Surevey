using Microsoft.AspNetCore.Mvc;
using WalletService.Services;

namespace WalletService.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected IActionResult HandleApiException(ApiException ex)
    {
        return StatusCode(ex.StatusCode, new { message = ex.Message });
    }
}
