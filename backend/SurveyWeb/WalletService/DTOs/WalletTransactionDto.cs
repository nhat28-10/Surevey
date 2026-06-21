using WalletService.Enums;

namespace WalletService.DTOs;

public class WalletTransactionDto
{
    public int Id { get; set; }
    public int WalletId { get; set; }
    public int UserId { get; set; }
    public WalletTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}
