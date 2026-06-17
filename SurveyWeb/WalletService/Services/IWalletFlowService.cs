using WalletService.DTOs;

namespace WalletService.Services;

public interface IWalletFlowService
{
    Task<WalletDto> GetMyWalletAsync();
    Task<IReadOnlyList<WalletTransactionDto>> GetMyTransactionsAsync();
    Task<AdminTopupResponse> AdminTopupAsync(int userId, AdminTopupRequest request);
    Task<EscrowCampaignResponse> EscrowCampaignAsync(EscrowCampaignRequest request);
    Task<PayRewardResponse> PayRewardAsync(PayRewardRequest request);
    Task<RefundCampaignResponse> RefundCampaignAsync(int campaignId, RefundCampaignRequest request);
}
