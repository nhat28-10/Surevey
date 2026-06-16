using SurveyService.Enums;

namespace SurveyService.DTOs;

public class CampaignDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Instruction { get; set; } = string.Empty;
    public CampaignType CampaignType { get; set; }
    public string? GoogleFormUrl { get; set; }
    public string ConfirmationCode { get; set; } = string.Empty;
    public decimal RewardPerResponse { get; set; }
    public int TargetResponses { get; set; }
    public int ApprovedResponses { get; set; }
    public DateTime Deadline { get; set; }
    public string Category { get; set; } = string.Empty;
    public CampaignStatus Status { get; set; }
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
