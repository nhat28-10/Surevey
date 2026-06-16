using System.ComponentModel.DataAnnotations;

namespace SurveyService.DTOs;

public class RejectSubmissionRequest
{
    [Required]
    [MaxLength(1000)]
    public string RejectReason { get; set; } = string.Empty;
}
