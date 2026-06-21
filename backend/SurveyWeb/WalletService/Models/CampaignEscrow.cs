using WalletService.Enums;

namespace WalletService.Models;

public class CampaignEscrow
{
    public int Id { get; set; }
    public int CampaignId { get; set; }
    public int CustomerId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public CampaignEscrowStatus Status { get; set; } = CampaignEscrowStatus.ACTIVE;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
