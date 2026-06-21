using SurveyService.Enums;

namespace SurveyService.Models;

public class Participation
{
    public int Id { get; set; }
    public int CampaignId { get; set; }
    public int CollaboratorId { get; set; }
    public ParticipationStatus Status { get; set; } = ParticipationStatus.ACCEPTED;
    public DateTime AcceptedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Campaign? Campaign { get; set; }
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
