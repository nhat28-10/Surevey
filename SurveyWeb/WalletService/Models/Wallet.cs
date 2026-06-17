namespace WalletService.Models;

public class Wallet
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal AvailableBalance { get; set; }
    public decimal PendingBalance { get; set; }
    public decimal EscrowBalance { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
}
