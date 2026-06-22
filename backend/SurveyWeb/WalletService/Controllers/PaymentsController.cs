using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WalletService.DTOs;
using WalletService.Services;

namespace WalletService.Controllers;

[ApiController]
public class PaymentsController : ApiControllerBase
{
    private readonly IWalletFlowService _walletFlowService;

    public PaymentsController(IWalletFlowService walletFlowService)
    {
        _walletFlowService = walletFlowService;
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("api/payments/campaign-quote")]
    [ProducesResponseType(typeof(CampaignQuoteResponse), StatusCodes.Status200OK)]
    public IActionResult GetCampaignQuote([FromBody] CampaignQuoteRequest request)
    {
        try
        {
            return Ok(_walletFlowService.GetCampaignQuote(request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("api/campaigns/{campaignId:int}/payments")]
    [ProducesResponseType(typeof(CampaignPaymentDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateCampaignPayment(int campaignId, [FromBody] CreateCampaignPaymentRequest request)
    {
        try
        {
            return Ok(await _walletFlowService.CreateCampaignPaymentAsync(campaignId, request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("api/payments/{paymentId:int}/proof")]
    [ProducesResponseType(typeof(CampaignPaymentDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SubmitPaymentProof(int paymentId, [FromBody] SubmitPaymentProofRequest request)
    {
        try
        {
            return Ok(await _walletFlowService.SubmitPaymentProofAsync(paymentId, request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }
}
