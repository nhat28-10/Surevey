using WalletService.Enums;

namespace WalletService.Models;

public class CampaignPayment
{
    public int Id { get; set; }
    public int CampaignId { get; set; }
    public int CustomerId { get; set; }
    public string PaymentCode { get; set; } = string.Empty;
    public int TargetResponses { get; set; }
    public int AnswerCount { get; set; }
    public decimal UnitPricePerAnswer { get; set; }
    public decimal RewardPerResponse { get; set; }
    public decimal RewardBudget { get; set; }
    public decimal PlatformFeeRate { get; set; }
    public decimal PlatformFeeAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccountName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string? QrImageUrl { get; set; }
    public string TransferContent { get; set; } = string.Empty;
    public string? ProofImageUrl { get; set; }
    public string? CustomerNote { get; set; }
    public CampaignPaymentStatus Status { get; set; } = CampaignPaymentStatus.PENDING;
    public int? VerifiedByAdminId { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
