using System.ComponentModel.DataAnnotations;

namespace SurveyService.DTOs;

public class SubmitSubmissionRequest
{
    [MaxLength(32)]
    public string? ConfirmationCode { get; set; }

    [MaxLength(1000)]
    public string? ProofImageUrl { get; set; }

    [MaxLength(200)]
    public string? ContactEmail { get; set; }

    [MaxLength(30)]
    public string? ContactPhone { get; set; }

    [MaxLength(2000)]
    public string? Note { get; set; }
}
