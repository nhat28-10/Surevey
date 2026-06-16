using SurveyService.Enums;

namespace SurveyService.DTOs;

public class ParticipationDto
{
    public int Id { get; set; }
    public int CampaignId { get; set; }
    public int CollaboratorId { get; set; }
    public ParticipationStatus Status { get; set; }
    public DateTime AcceptedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public CampaignDto? Campaign { get; set; }
}
