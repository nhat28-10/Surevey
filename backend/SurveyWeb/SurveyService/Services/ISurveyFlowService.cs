using SurveyService.DTOs;

namespace SurveyService.Services;

public interface ISurveyFlowService
{
    Task<CampaignDto> CreateCampaignAsync(CreateCampaignRequest request);
    Task<IReadOnlyList<CampaignDto>> GetMyCampaignsAsync();
    Task<CampaignDto> GetCampaignAsync(int campaignId);
    Task<CampaignDto> SubmitCampaignForReviewAsync(int campaignId);
    Task<CampaignDto> MarkCampaignPaidAsync(int campaignId, MarkCampaignPaidRequest request);
    Task<IReadOnlyList<SubmissionDto>> GetCampaignSubmissionsAsync(int campaignId);
    Task<SubmissionDto> GetSubmissionAsync(int submissionId);
    Task<ReviewSubmissionResponse> ApproveSubmissionAsync(int submissionId);
    Task<ReviewSubmissionResponse> RejectSubmissionAsync(int submissionId, RejectSubmissionRequest request);
    Task<IReadOnlyList<CampaignDto>> GetPendingCampaignsAsync();
    Task<CampaignDto> ApproveCampaignAsync(int campaignId);
    Task<CampaignDto> RejectCampaignAsync(int campaignId, RejectCampaignRequest request);
    Task<IReadOnlyList<AvailableSurveyDto>> GetAvailableSurveysAsync();
    Task<ParticipationDto> AcceptCampaignAsync(int campaignId);
    Task<IReadOnlyList<ParticipationDto>> GetMyParticipationsAsync();
    Task<SubmissionDto> SubmitParticipationAsync(int participationId, SubmitSubmissionRequest request);
}
