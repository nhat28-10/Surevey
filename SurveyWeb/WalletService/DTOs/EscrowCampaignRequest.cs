using System.ComponentModel.DataAnnotations;

namespace WalletService.DTOs;

public class EscrowCampaignRequest
{
    public int CampaignId { get; set; }
    public int CustomerId { get; set; }
    [Range(0.01, double.MaxValue)]
    public decimal RewardPerResponse { get; set; }
    [Range(1, int.MaxValue)]
    public int TargetResponses { get; set; }
    [MaxLength(1000)]
    public string? Description { get; set; }
}
