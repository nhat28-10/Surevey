using SurveyService.Enums;

namespace SurveyService.Models;

public class Submission
{
    public int Id { get; set; }
    public int CampaignId { get; set; }
    public int ParticipationId { get; set; }
    public int CollaboratorId { get; set; }
    public string ConfirmationCode { get; set; } = string.Empty;
    public string? ProofImageUrl { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Note { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.PENDING;
    public string? RejectReason { get; set; }
    public int? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime? RewardPaidAt { get; set; }
    public string? RewardTransactionReference { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Campaign? Campaign { get; set; }
    public Participation? Participation { get; set; }
}
