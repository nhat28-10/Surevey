using System.ComponentModel.DataAnnotations;

namespace SurveyService.DTOs;

public class RejectCampaignRequest
{
    [Required]
    [MaxLength(1000)]
    public string Reason { get; set; } = string.Empty;
}
