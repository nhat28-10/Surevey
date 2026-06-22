namespace SurveyService.Services;

public class EscrowCampaignWalletRequest
{
    public int CampaignId { get; set; }
    public int CustomerId { get; set; }
    public decimal RewardPerResponse { get; set; }
    public int TargetResponses { get; set; }
    public string? Description { get; set; }
}

public class PayRewardWalletRequest
{
    public int CampaignId { get; set; }
    public int SubmissionId { get; set; }
    public int CustomerId { get; set; }
    public int CollaboratorId { get; set; }
    public decimal RewardAmount { get; set; }
    public string? Description { get; set; }
}

public class CampaignPaymentStatusWalletResponse
{
    public int CampaignId { get; set; }
    public int CustomerId { get; set; }
    public bool HasPaidPayment { get; set; }
    public int? PaymentId { get; set; }
    public string? Status { get; set; }
    public decimal? RewardBudget { get; set; }
}

public class PayRewardWalletResponse
{
    public bool AlreadyPaid { get; set; }
    public string TransactionReference { get; set; } = string.Empty;
}

public class RefundCampaignWalletRequest
{
    public int CustomerId { get; set; }
    public string? Description { get; set; }
}
