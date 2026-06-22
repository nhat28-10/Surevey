using WalletService.DTOs;

namespace WalletService.Services;

public interface IWalletFlowService
{
    Task<WalletDto> GetMyWalletAsync();
    Task<IReadOnlyList<WalletTransactionDto>> GetMyTransactionsAsync();
    Task<AdminTopupResponse> AdminTopupAsync(int userId, AdminTopupRequest request);
    CampaignQuoteResponse GetCampaignQuote(CampaignQuoteRequest request);
    Task<CampaignPaymentDto> CreateCampaignPaymentAsync(int campaignId, CreateCampaignPaymentRequest request);
    Task<CampaignPaymentDto> SubmitPaymentProofAsync(int paymentId, SubmitPaymentProofRequest request);
    Task<IReadOnlyList<CampaignPaymentDto>> GetAdminPaymentsAsync(Enums.CampaignPaymentStatus? status);
    Task<CampaignPaymentDto> GetAdminPaymentAsync(int paymentId);
    Task<CampaignPaymentDto> ApprovePaymentAsync(int paymentId);
    Task<CampaignPaymentDto> RejectPaymentAsync(int paymentId, RejectPaymentRequest request);
    Task<AdminRevenueSummaryDto> GetAdminRevenueSummaryAsync();
    Task<CampaignPaymentStatusResponse> GetCampaignPaymentStatusAsync(int campaignId, int customerId);
    Task<EscrowCampaignResponse> EscrowCampaignAsync(EscrowCampaignRequest request);
    Task<PayRewardResponse> PayRewardAsync(PayRewardRequest request);
    Task<RefundCampaignResponse> RefundCampaignAsync(int campaignId, RefundCampaignRequest request);
}
