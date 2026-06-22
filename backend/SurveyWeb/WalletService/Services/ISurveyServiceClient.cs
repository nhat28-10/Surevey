namespace WalletService.Services;

public interface ISurveyServiceClient
{
    Task<bool> IsCampaignOwnerAsync(int campaignId, int customerId);
    Task MarkCampaignPaidAsync(MarkCampaignPaidSurveyRequest request);
}

public class MarkCampaignPaidSurveyRequest
{
    public int CampaignId { get; set; }
    public int PaymentId { get; set; }
    public decimal RewardBudget { get; set; }
    public decimal PlatformFeeAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public int AnswerCount { get; set; }
    public decimal UnitPricePerAnswer { get; set; }
}
