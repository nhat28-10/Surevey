using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WalletService.DTOs;
using WalletService.Services;

namespace WalletService.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/wallets")]
public class AdminWalletsController : ApiControllerBase
{
    private readonly IWalletFlowService _walletFlowService;

    public AdminWalletsController(IWalletFlowService walletFlowService)
    {
        _walletFlowService = walletFlowService;
    }

    [HttpPost("{userId:int}/topup")]
    public async Task<IActionResult> Topup(int userId, [FromBody] AdminTopupRequest request)
    {
        try
        {
            return Ok(await _walletFlowService.AdminTopupAsync(userId, request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }
}
