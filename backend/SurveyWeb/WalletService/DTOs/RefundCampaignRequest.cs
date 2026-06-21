using System.ComponentModel.DataAnnotations;

namespace WalletService.DTOs;

public class RefundCampaignRequest
{
    public int CustomerId { get; set; }
    [MaxLength(1000)]
    public string? Description { get; set; }
}
