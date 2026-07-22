using WalletService.DTOs;

namespace WalletService.Services;

public interface IWalletFlowService
{
    Task<WalletDto> GetMyWalletAsync();
    Task<IReadOnlyList<WalletTransactionDto>> GetMyTransactionsAsync();
    Task<WithdrawalDto> CreateWithdrawalAsync(CreateWithdrawalRequest request);
    Task<IReadOnlyList<WithdrawalDto>> GetMyWithdrawalsAsync();
    Task<AdminTopupResponse> AdminTopupAsync(int userId, AdminTopupRequest request);
    Task<IReadOnlyList<WithdrawalDto>> GetAdminWithdrawalsAsync(Enums.WithdrawalStatus? status);
    Task<WithdrawalDto> ApproveWithdrawalAsync(int withdrawalId, ReviewWithdrawalRequest request);
    Task<WithdrawalDto> RejectWithdrawalAsync(int withdrawalId, ReviewWithdrawalRequest request);
    Task<WithdrawalDto> MarkWithdrawalPaidAsync(int withdrawalId, ReviewWithdrawalRequest request);
    CampaignQuoteResponse GetCampaignQuote(CampaignQuoteRequest request);
    Task<CampaignPaymentDto> CreateCampaignPaymentAsync(int campaignId, CreateCampaignPaymentRequest request);
    Task<CampaignPaymentDto> GetMyCampaignPaymentAsync(int paymentId);
    Task<CampaignPaymentDto> SubmitPaymentProofAsync(int paymentId, SubmitPaymentProofRequest request);
    Task<IReadOnlyList<CampaignPaymentDto>> GetAdminPaymentsAsync(Enums.CampaignPaymentStatus? status);
    Task<CampaignPaymentDto> GetAdminPaymentAsync(int paymentId);
    Task<CampaignPaymentDto> ApprovePaymentAsync(int paymentId);
    Task<CampaignPaymentDto> RejectPaymentAsync(int paymentId, RejectPaymentRequest request);
    Task<SePayWebhookProcessResult> ProcessSePayWebhookAsync(SePayWebhookRequest request, string rawPayload);
    Task<AdminRevenueSummaryDto> GetAdminRevenueSummaryAsync();
    Task<CampaignPaymentStatusResponse> GetCampaignPaymentStatusAsync(int campaignId, int customerId);
    Task<EscrowCampaignResponse> EscrowCampaignAsync(EscrowCampaignRequest request);
    Task<PayRewardResponse> PayRewardAsync(PayRewardRequest request);
    Task<RefundCampaignResponse> RefundCampaignAsync(int campaignId, RefundCampaignRequest request);
}
