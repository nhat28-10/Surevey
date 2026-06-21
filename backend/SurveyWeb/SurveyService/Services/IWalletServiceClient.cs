namespace SurveyService.Services;

public interface IWalletServiceClient
{
    Task EscrowCampaignAsync(EscrowCampaignWalletRequest request);
    Task<PayRewardWalletResponse> PayRewardAsync(PayRewardWalletRequest request);
    Task RefundCampaignAsync(int campaignId, RefundCampaignWalletRequest request);
}
