using System.ComponentModel.DataAnnotations;

namespace WalletService.DTOs;

public class AdminTopupRequest
{
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }
}
