using SurveyService.Enums;

namespace SurveyService.DTOs;

public class ReviewSubmissionResponse
{
    public int SubmissionId { get; set; }
    public SubmissionStatus SubmissionStatus { get; set; }
    public ParticipationStatus ParticipationStatus { get; set; }
    public CampaignStatus CampaignStatus { get; set; }
    public int ApprovedResponses { get; set; }
    public string Message { get; set; } = string.Empty;
}
