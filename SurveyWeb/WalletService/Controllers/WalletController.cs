using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WalletService.Services;

namespace WalletService.Controllers;

[ApiController]
[Authorize(Roles = "Customer,Collaborator,Admin")]
[Route("api/wallet")]
public class WalletController : ApiControllerBase
{
    private readonly IWalletFlowService _walletFlowService;

    public WalletController(IWalletFlowService walletFlowService)
    {
        _walletFlowService = walletFlowService;
    }

    [HttpGet]
    public async Task<IActionResult> GetWallet()
    {
        try
        {
            return Ok(await _walletFlowService.GetMyWalletAsync());
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions()
    {
        try
        {
            return Ok(await _walletFlowService.GetMyTransactionsAsync());
        }
        catch (ApiException ex)
        {
            return HandleApiException(ex);
        }
    }
}
