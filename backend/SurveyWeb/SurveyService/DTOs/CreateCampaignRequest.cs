using System.ComponentModel.DataAnnotations;
using SurveyService.Enums;

namespace SurveyService.DTOs;

public class CreateCampaignRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Instruction { get; set; } = string.Empty;

    public CampaignType CampaignType { get; set; } = CampaignType.GOOGLE_FORM;

    [MaxLength(1000)]
    public string? GoogleFormUrl { get; set; }

    [Range(0, double.MaxValue)]
    public decimal RewardPerResponse { get; set; }

    [Range(1, int.MaxValue)]
    public int TargetResponses { get; set; }

    [Range(1, int.MaxValue)]
    public int AnswerCount { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal UnitPricePerAnswer { get; set; }

    public DateTime Deadline { get; set; }

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    public bool SubmitForReview { get; set; }
}
