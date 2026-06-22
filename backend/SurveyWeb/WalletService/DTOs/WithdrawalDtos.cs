using System.ComponentModel.DataAnnotations;
using WalletService.Enums;

namespace WalletService.DTOs;

public class CreateWithdrawalRequest
{
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(120)]
    public string BankName { get; set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public string BankAccountName { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string BankAccountNumber { get; set; } = string.Empty;
}

public class WithdrawalDto
{
    public int Id { get; set; }
    public int CollaboratorId { get; set; }
    public int WalletId { get; set; }
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccountName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public WithdrawalStatus Status { get; set; }
    public string? AdminNote { get; set; }
    public string? RejectReason { get; set; }
    public DateTime RequestedAt { get; set; }
    public int? ReviewedByAdminId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime? PaidAt { get; set; }
}

public class ReviewWithdrawalRequest
{
    [MaxLength(1000)]
    public string? AdminNote { get; set; }

    [MaxLength(1000)]
    public string? RejectReason { get; set; }
}
