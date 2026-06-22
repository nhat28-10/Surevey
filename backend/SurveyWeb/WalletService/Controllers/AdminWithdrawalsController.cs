using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WalletService.DTOs;
using WalletService.Enums;
using WalletService.Services;

namespace WalletService.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/withdrawals")]
public class AdminWithdrawalsController : ApiControllerBase
{
    private readonly IWalletFlowService _walletFlowService;

    public AdminWithdrawalsController(IWalletFlowService walletFlowService)
    {
        _walletFlowService = walletFlowService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<WithdrawalDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWithdrawals([FromQuery] WithdrawalStatus? status)
    {
        try
        {
            return Ok(await _walletFlowService.GetAdminWithdrawalsAsync(status));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [HttpPost("{id:int}/approve")]
    [ProducesResponseType(typeof(WithdrawalDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Approve(int id, [FromBody] ReviewWithdrawalRequest request)
    {
        try
        {
            return Ok(await _walletFlowService.ApproveWithdrawalAsync(id, request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [HttpPost("{id:int}/reject")]
    [ProducesResponseType(typeof(WithdrawalDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Reject(int id, [FromBody] ReviewWithdrawalRequest request)
    {
        try
        {
            return Ok(await _walletFlowService.RejectWithdrawalAsync(id, request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [HttpPost("{id:int}/mark-paid")]
    [ProducesResponseType(typeof(WithdrawalDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkPaid(int id, [FromBody] ReviewWithdrawalRequest request)
    {
        try
        {
            return Ok(await _walletFlowService.MarkWithdrawalPaidAsync(id, request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }
}
