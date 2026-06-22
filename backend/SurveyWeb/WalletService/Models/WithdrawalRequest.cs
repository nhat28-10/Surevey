using WalletService.Enums;

namespace WalletService.Models;

public class WithdrawalRequest
{
    public int Id { get; set; }
    public int CollaboratorId { get; set; }
    public int WalletId { get; set; }
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccountName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.PENDING;
    public string? AdminNote { get; set; }
    public string? RejectReason { get; set; }
    public DateTime RequestedAt { get; set; }
    public int? ReviewedByAdminId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime? PaidAt { get; set; }

    public Wallet? Wallet { get; set; }
}
