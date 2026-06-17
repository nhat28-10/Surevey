namespace WalletService.DTOs;

public class WalletDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal AvailableBalance { get; set; }
    public decimal PendingBalance { get; set; }
    public decimal EscrowBalance { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
