using Microsoft.AspNetCore.Mvc;
using WalletService.DTOs;
using WalletService.Services;

namespace WalletService.Controllers;

[ApiController]
[Route("api/internal/wallets")]
public class InternalWalletsController : ApiControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IWalletFlowService _walletFlowService;

    public InternalWalletsController(IConfiguration configuration, IWalletFlowService walletFlowService)
    {
        _configuration = configuration;
        _walletFlowService = walletFlowService;
    }

    [HttpPost("campaigns/escrow")]
    public async Task<IActionResult> EscrowCampaign([FromBody] EscrowCampaignRequest request)
    {
        var unauthorized = ValidateInternalKey();
        if (unauthorized != null) return unauthorized;

        try
        {
            return Ok(await _walletFlowService.EscrowCampaignAsync(request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [HttpPost("submissions/reward")]
    public async Task<IActionResult> PayReward([FromBody] PayRewardRequest request)
    {
        var unauthorized = ValidateInternalKey();
        if (unauthorized != null) return unauthorized;

        try
        {
            return Ok(await _walletFlowService.PayRewardAsync(request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [HttpPost("campaigns/{campaignId:int}/refund")]
    public async Task<IActionResult> RefundCampaign(int campaignId, [FromBody] RefundCampaignRequest request)
    {
        var unauthorized = ValidateInternalKey();
        if (unauthorized != null) return unauthorized;

        try
        {
            return Ok(await _walletFlowService.RefundCampaignAsync(campaignId, request));
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    private IActionResult? ValidateInternalKey()
    {
        var expectedKey = _configuration["InternalService:ApiKey"];
        var providedKey = Request.Headers["X-Internal-Service-Key"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(expectedKey) || providedKey != expectedKey)
        {
            return Unauthorized(new { message = "Invalid internal service key." });
        }

        return null;
    }
}
