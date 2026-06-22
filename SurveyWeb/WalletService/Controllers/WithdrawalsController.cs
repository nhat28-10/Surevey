using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WalletService.DTOs;
using WalletService.Services;

namespace WalletService.Controllers;

[ApiController]
[Authorize(Roles = "Collaborator")]
[Route("api/withdrawals")]
public class WithdrawalsController : ApiControllerBase
{
    private readonly IWalletFlowService _walletFlowService;

    public WithdrawalsController(IWalletFlowService walletFlowService)
    {
        _walletFlowService = walletFlowService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWithdrawalRequest request)
    {
        try
        {
            return Ok(await _walletFlowService.CreateWithdrawalAsync(request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [HttpGet("me")]
    public async Task<IActionResult> MyWithdrawals()
    {
        try
        {
            return Ok(await _walletFlowService.GetMyWithdrawalsAsync());
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }
}
