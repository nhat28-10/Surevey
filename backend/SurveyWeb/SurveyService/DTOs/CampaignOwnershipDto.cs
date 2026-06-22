namespace SurveyService.DTOs;

public class CampaignOwnershipDto
{
    public int CampaignId { get; set; }
    public int CustomerId { get; set; }
    public bool IsOwner { get; set; }
}
