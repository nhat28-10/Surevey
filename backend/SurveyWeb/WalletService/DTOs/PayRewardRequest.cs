using System.ComponentModel.DataAnnotations;

namespace WalletService.DTOs;

public class PayRewardRequest
{
    public int CampaignId { get; set; }
    public int SubmissionId { get; set; }
    public int CustomerId { get; set; }
    public int CollaboratorId { get; set; }
    [Range(0.01, double.MaxValue)]
    public decimal RewardAmount { get; set; }
    [MaxLength(1000)]
    public string? Description { get; set; }
}
