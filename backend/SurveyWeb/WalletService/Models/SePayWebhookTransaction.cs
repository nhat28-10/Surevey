namespace WalletService.Models;

public class SePayWebhookTransaction
{
    public int Id { get; set; }
    public long SePayTransactionId { get; set; }
    public int? CampaignPaymentId { get; set; }
    public string? PaymentCode { get; set; }
    public string Gateway { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string? SubAccount { get; set; }
    public string? Code { get; set; }
    public string Content { get; set; } = string.Empty;
    public string TransferType { get; set; } = string.Empty;
    public decimal TransferAmount { get; set; }
    public decimal? Accumulated { get; set; }
    public string? ReferenceCode { get; set; }
    public DateTime? TransactionDate { get; set; }
    public string RawPayload { get; set; } = string.Empty;
    public string ProcessingStatus { get; set; } = "RECEIVED";
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
