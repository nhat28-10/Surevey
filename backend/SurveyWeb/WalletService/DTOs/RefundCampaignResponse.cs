namespace WalletService.DTOs;

public class RefundCampaignResponse
{
    public int CampaignId { get; set; }
    public int CustomerId { get; set; }
    public decimal RefundedAmount { get; set; }
    public decimal CustomerBalanceAfter { get; set; }
    public bool AlreadyRefunded { get; set; }
    public string Message { get; set; } = string.Empty;
}
