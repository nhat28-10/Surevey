using System.ComponentModel.DataAnnotations;
using WalletService.Enums;

namespace WalletService.DTOs;

public class CampaignQuoteRequest
{
    [Range(1, int.MaxValue)]
    public int TargetResponses { get; set; }

    [Range(1, int.MaxValue)]
    public int AnswerCount { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal UnitPricePerAnswer { get; set; }
}

public class CampaignQuoteResponse
{
    public int TargetResponses { get; set; }
    public int AnswerCount { get; set; }
    public decimal UnitPricePerAnswer { get; set; }
    public decimal RewardPerResponse { get; set; }
    public decimal RewardBudget { get; set; }
    public decimal PlatformFeeRate { get; set; }
    public decimal PlatformFeeAmount { get; set; }
    public decimal TotalAmount { get; set; }
}

public class CreateCampaignPaymentRequest : CampaignQuoteRequest
{
    [MaxLength(1000)]
    public string? CustomerNote { get; set; }
}

public class CampaignPaymentDto
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
    public CampaignPaymentStatus Status { get; set; }
    public int? VerifiedByAdminId { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SubmitPaymentProofRequest
{
    [Required]
    [MaxLength(1000)]
    public string ProofImageUrl { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? CustomerNote { get; set; }
}

public class RejectPaymentRequest
{
    [Required]
    [MaxLength(1000)]
    public string RejectReason { get; set; } = string.Empty;
}

public class AdminRevenueSummaryDto
{
    public decimal TotalPaidAmount { get; set; }
    public decimal TotalRewardBudget { get; set; }
    public decimal TotalPlatformFeeAmount { get; set; }
    public int PaidPaymentCount { get; set; }
    public int PendingVerifyPaymentCount { get; set; }
}

public class CampaignPaymentStatusResponse
{
    public int CampaignId { get; set; }
    public int CustomerId { get; set; }
    public bool HasPaidPayment { get; set; }
    public int? PaymentId { get; set; }
    public CampaignPaymentStatus? Status { get; set; }
    public decimal? RewardBudget { get; set; }
}
