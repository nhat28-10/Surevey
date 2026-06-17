namespace WalletService.DTOs;

public class AdminTopupResponse
{
    public WalletDto Wallet { get; set; } = new();
    public WalletTransactionDto Transaction { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}
