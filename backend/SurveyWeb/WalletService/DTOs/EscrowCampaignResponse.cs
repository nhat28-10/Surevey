namespace WalletService.DTOs;

public class EscrowCampaignResponse
{
    public int CampaignId { get; set; }
    public int CustomerId { get; set; }
    public decimal TotalBudget { get; set; }
    public decimal RemainingAmount { get; set; }
    public bool AlreadyEscrowed { get; set; }
    public string Message { get; set; } = string.Empty;
}
