namespace SurveyService.Services;

public interface IWalletServiceClient
{
    Task EscrowCampaignAsync(EscrowCampaignWalletRequest request);
    Task<CampaignPaymentStatusWalletResponse> GetCampaignPaymentStatusAsync(int campaignId, int customerId);
    Task<PayRewardWalletResponse> PayRewardAsync(PayRewardWalletRequest request);
    Task RefundCampaignAsync(int campaignId, RefundCampaignWalletRequest request);
}
