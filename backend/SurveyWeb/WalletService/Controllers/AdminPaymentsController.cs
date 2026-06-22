using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WalletService.DTOs;
using WalletService.Enums;
using WalletService.Services;

namespace WalletService.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminPaymentsController : ApiControllerBase
{
    private readonly IWalletFlowService _walletFlowService;

    public AdminPaymentsController(IWalletFlowService walletFlowService)
    {
        _walletFlowService = walletFlowService;
    }

    [HttpGet("payments")]
    [ProducesResponseType(typeof(IReadOnlyList<CampaignPaymentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPayments([FromQuery] CampaignPaymentStatus? status)
    {
        try
        {
            return Ok(await _walletFlowService.GetAdminPaymentsAsync(status));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [HttpGet("payments/{paymentId:int}")]
    [ProducesResponseType(typeof(CampaignPaymentDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPayment(int paymentId)
    {
        try
        {
            return Ok(await _walletFlowService.GetAdminPaymentAsync(paymentId));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [HttpPost("payments/{paymentId:int}/approve")]
    [ProducesResponseType(typeof(CampaignPaymentDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ApprovePayment(int paymentId)
    {
        try
        {
            return Ok(await _walletFlowService.ApprovePaymentAsync(paymentId));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [HttpPost("payments/{paymentId:int}/reject")]
    [ProducesResponseType(typeof(CampaignPaymentDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> RejectPayment(int paymentId, [FromBody] RejectPaymentRequest request)
    {
        try
        {
            return Ok(await _walletFlowService.RejectPaymentAsync(paymentId, request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [HttpGet("revenue-summary")]
    [ProducesResponseType(typeof(AdminRevenueSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRevenueSummary()
    {
        try
        {
            return Ok(await _walletFlowService.GetAdminRevenueSummaryAsync());
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }
}
