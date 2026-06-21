using SurveyService.Enums;

namespace SurveyService.Models;

public class Campaign
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Instruction { get; set; } = string.Empty;
    public CampaignType CampaignType { get; set; } = CampaignType.GOOGLE_FORM;
    public string? GoogleFormUrl { get; set; }
    public string ConfirmationCode { get; set; } = string.Empty;
    public decimal RewardPerResponse { get; set; }
    public int TargetResponses { get; set; }
    public int ApprovedResponses { get; set; }
    public DateTime Deadline { get; set; }
    public string Category { get; set; } = string.Empty;
    public CampaignStatus Status { get; set; } = CampaignStatus.DRAFT;
    public string? RejectReason { get; set; }
    public bool IsEscrowed { get; set; }
    public DateTime? EscrowedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Participation> Participations { get; set; } = new List<Participation>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
