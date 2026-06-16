using SurveyService.Enums;

namespace SurveyService.DTOs;

public class SubmissionDto
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
    public SubmissionStatus Status { get; set; }
    public string? RejectReason { get; set; }
    public int? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public CampaignDto? Campaign { get; set; }
}
