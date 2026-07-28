namespace SurveyService.DTOs;

using SurveyService.Enums;

public class AvailableSurveyDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Instruction { get; set; } = string.Empty;
    public string? GoogleFormUrl { get; set; }
    public decimal RewardPerResponse { get; set; }
    public int TargetResponses { get; set; }
    public int ApprovedResponses { get; set; }
    public int RemainingSlots { get; set; }
    public DateTime Deadline { get; set; }
    public string Category { get; set; } = string.Empty;
    public int? MyParticipationId { get; set; }
    public ParticipationStatus? MyParticipationStatus { get; set; }
}
