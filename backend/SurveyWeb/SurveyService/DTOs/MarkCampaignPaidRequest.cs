using System.ComponentModel.DataAnnotations;

namespace SurveyService.DTOs;

public class MarkCampaignPaidRequest
{
    [Range(1, int.MaxValue)]
    public int PaymentId { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal RewardBudget { get; set; }

    [Range(0, double.MaxValue)]
    public decimal PlatformFeeAmount { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal TotalAmount { get; set; }

    [Range(1, int.MaxValue)]
    public int AnswerCount { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal UnitPricePerAnswer { get; set; }
}
