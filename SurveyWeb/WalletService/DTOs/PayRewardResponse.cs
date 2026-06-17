namespace WalletService.DTOs;

public class PayRewardResponse
{
    public int CampaignId { get; set; }
    public int SubmissionId { get; set; }
    public int CollaboratorId { get; set; }
    public decimal RewardAmount { get; set; }
    public decimal CollaboratorBalanceAfter { get; set; }
    public bool AlreadyPaid { get; set; }
    public string TransactionReference { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
