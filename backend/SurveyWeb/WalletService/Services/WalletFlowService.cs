using System.Globalization;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using WalletService.Data;
using WalletService.DTOs;
using WalletService.Enums;
using WalletService.Models;

namespace WalletService.Services;

public class WalletFlowService : IWalletFlowService
{
    private const string CampaignReference = "CAMPAIGN";
    private const string PaymentReference = "PAYMENT";
    private const string SubmissionReference = "SUBMISSION";
    private const string WithdrawalReference = "WITHDRAWAL";
    private const decimal PlatformFeeRate = 0.20m;
    private readonly WalletDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;
    private readonly IConfiguration _configuration;
    private readonly ISurveyServiceClient _surveyServiceClient;

    public WalletFlowService(
        WalletDbContext dbContext,
        ICurrentUserService currentUser,
        IConfiguration configuration,
        ISurveyServiceClient surveyServiceClient)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _configuration = configuration;
        _surveyServiceClient = surveyServiceClient;
    }

    public async Task<WalletDto> GetMyWalletAsync()
    {
        var wallet = await GetOrCreateWalletAsync(_currentUser.UserId);
        await _dbContext.SaveChangesAsync();
        return ToWalletDto(wallet);
    }

    public async Task<IReadOnlyList<WalletTransactionDto>> GetMyTransactionsAsync()
    {
        var userId = _currentUser.UserId;
        return await _dbContext.WalletTransactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => ToTransactionDto(t))
            .ToListAsync();
    }

    public async Task<WithdrawalDto> CreateWithdrawalAsync(CreateWithdrawalRequest request)
    {
        RequireRole("Collaborator");
        EnsurePositive(request.Amount);
        ValidateBankInfo(request.BankName, request.BankAccountName, request.BankAccountNumber);

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        var wallet = await GetOrCreateWalletAsync(_currentUser.UserId);
        if (wallet.AvailableBalance < request.Amount)
        {
            throw BadRequest("Wallet available balance is not enough for this withdrawal.");
        }

        var now = DateTime.UtcNow;
        wallet.AvailableBalance -= request.Amount;
        wallet.PendingBalance += request.Amount;
        wallet.UpdatedAt = now;

        var withdrawal = new WithdrawalRequest
        {
            CollaboratorId = _currentUser.UserId,
            Wallet = wallet,
            WalletId = wallet.Id,
            Amount = request.Amount,
            BankName = request.BankName.Trim(),
            BankAccountName = request.BankAccountName.Trim(),
            BankAccountNumber = request.BankAccountNumber.Trim(),
            Status = WithdrawalStatus.PENDING,
            RequestedAt = now
        };

        _dbContext.WithdrawalRequests.Add(withdrawal);
        await _dbContext.SaveChangesAsync();

        AddTransaction(wallet, WalletTransactionType.WITHDRAWAL, -request.Amount,
            WithdrawalReference, withdrawal.Id.ToString(), $"Withdrawal request {withdrawal.Id} created.");

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return ToWithdrawalDto(withdrawal);
    }

    public async Task<IReadOnlyList<WithdrawalDto>> GetMyWithdrawalsAsync()
    {
        RequireRole("Collaborator");
        var collaboratorId = _currentUser.UserId;

        return await _dbContext.WithdrawalRequests
            .Where(w => w.CollaboratorId == collaboratorId)
            .OrderByDescending(w => w.RequestedAt)
            .Select(w => ToWithdrawalDto(w))
            .ToListAsync();
    }

    public async Task<AdminTopupResponse> AdminTopupAsync(int userId, AdminTopupRequest request)
    {
        RequireRole("Admin");
        EnsurePositive(request.Amount);

        var wallet = await GetOrCreateWalletAsync(userId);
        wallet.AvailableBalance += request.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        var transaction = AddTransaction(wallet, WalletTransactionType.ADMIN_TOPUP, request.Amount,
            null, null, request.Description);

        await _dbContext.SaveChangesAsync();

        return new AdminTopupResponse
        {
            Wallet = ToWalletDto(wallet),
            Transaction = ToTransactionDto(transaction),
            Message = "Top-up completed successfully."
        };
    }

    public async Task<IReadOnlyList<WithdrawalDto>> GetAdminWithdrawalsAsync(WithdrawalStatus? status)
    {
        RequireRole("Admin");
        var query = _dbContext.WithdrawalRequests.AsQueryable();
        if (status.HasValue)
        {
            query = query.Where(w => w.Status == status.Value);
        }

        return await query
            .OrderByDescending(w => w.RequestedAt)
            .Select(w => ToWithdrawalDto(w))
            .ToListAsync();
    }

    public async Task<WithdrawalDto> ApproveWithdrawalAsync(int withdrawalId, ReviewWithdrawalRequest request)
    {
        RequireRole("Admin");
        var withdrawal = await FindWithdrawalAsync(withdrawalId);

        if (withdrawal.Status is WithdrawalStatus.APPROVED or WithdrawalStatus.PAID)
        {
            return ToWithdrawalDto(withdrawal);
        }

        if (withdrawal.Status == WithdrawalStatus.REJECTED)
        {
            throw BadRequest("Rejected withdrawals cannot be approved.");
        }

        withdrawal.Status = WithdrawalStatus.APPROVED;
        withdrawal.AdminNote = NullIfWhiteSpace(request.AdminNote);
        withdrawal.ReviewedByAdminId = _currentUser.UserId;
        withdrawal.ReviewedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return ToWithdrawalDto(withdrawal);
    }

    public async Task<WithdrawalDto> RejectWithdrawalAsync(int withdrawalId, ReviewWithdrawalRequest request)
    {
        RequireRole("Admin");
        var withdrawal = await FindWithdrawalAsync(withdrawalId);

        if (withdrawal.Status == WithdrawalStatus.REJECTED)
        {
            return ToWithdrawalDto(withdrawal);
        }

        if (withdrawal.Status == WithdrawalStatus.PAID)
        {
            throw BadRequest("Paid withdrawals cannot be rejected.");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        var wallet = await GetWalletByIdAsync(withdrawal.WalletId);
        var referenceId = withdrawal.Id.ToString();
        var rejectedTransactionExists = await _dbContext.WalletTransactions.AnyAsync(t =>
            t.Type == WalletTransactionType.WITHDRAWAL_REJECTED
            && t.ReferenceType == WithdrawalReference
            && t.ReferenceId == referenceId);

        if (!rejectedTransactionExists)
        {
            if (wallet.PendingBalance < withdrawal.Amount)
            {
                throw BadRequest("Wallet pending balance is not enough to reject this withdrawal.");
            }

            wallet.PendingBalance -= withdrawal.Amount;
            wallet.AvailableBalance += withdrawal.Amount;
            wallet.UpdatedAt = DateTime.UtcNow;
            AddTransaction(wallet, WalletTransactionType.WITHDRAWAL_REJECTED, withdrawal.Amount,
                WithdrawalReference, referenceId, $"Withdrawal request {withdrawal.Id} rejected.");
        }

        withdrawal.Status = WithdrawalStatus.REJECTED;
        withdrawal.AdminNote = NullIfWhiteSpace(request.AdminNote);
        withdrawal.RejectReason = NullIfWhiteSpace(request.RejectReason) ?? withdrawal.AdminNote;
        withdrawal.ReviewedByAdminId = _currentUser.UserId;
        withdrawal.ReviewedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return ToWithdrawalDto(withdrawal);
    }

    public async Task<WithdrawalDto> MarkWithdrawalPaidAsync(int withdrawalId, ReviewWithdrawalRequest request)
    {
        RequireRole("Admin");
        var withdrawal = await FindWithdrawalAsync(withdrawalId);

        if (withdrawal.Status == WithdrawalStatus.PAID)
        {
            return ToWithdrawalDto(withdrawal);
        }

        if (withdrawal.Status != WithdrawalStatus.APPROVED)
        {
            throw BadRequest("Only approved withdrawals can be marked as paid.");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        var wallet = await GetWalletByIdAsync(withdrawal.WalletId);
        if (wallet.PendingBalance < withdrawal.Amount)
        {
            throw BadRequest("Wallet pending balance is not enough to mark this withdrawal as paid.");
        }

        wallet.PendingBalance -= withdrawal.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        withdrawal.Status = WithdrawalStatus.PAID;
        withdrawal.AdminNote = NullIfWhiteSpace(request.AdminNote) ?? withdrawal.AdminNote;
        withdrawal.ReviewedByAdminId ??= _currentUser.UserId;
        withdrawal.ReviewedAt ??= DateTime.UtcNow;
        withdrawal.PaidAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return ToWithdrawalDto(withdrawal);
    }

    public CampaignQuoteResponse GetCampaignQuote(CampaignQuoteRequest request)
    {
        ValidateQuoteRequest(request);
        return CalculateQuote(request.TargetResponses, request.AnswerCount, request.UnitPricePerAnswer);
    }

    public async Task<CampaignPaymentDto> CreateCampaignPaymentAsync(int campaignId, CreateCampaignPaymentRequest request)
    {
        RequireRole("Customer");
        ValidateQuoteRequest(request);

        var customerId = _currentUser.UserId;
        if (!await _surveyServiceClient.IsCampaignOwnerAsync(campaignId, customerId))
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "You can only create payments for your own campaign.");
        }

        var existingPayment = await _dbContext.CampaignPayments
            .Where(p => p.CampaignId == campaignId && p.CustomerId == customerId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(p => p.Status != CampaignPaymentStatus.CANCELLED && p.Status != CampaignPaymentStatus.REJECTED);

        if (existingPayment != null)
        {
            if (existingPayment.Status == CampaignPaymentStatus.PAID)
            {
                return ToCampaignPaymentDto(existingPayment);
            }

            RefreshPendingPaymentBankInfo(existingPayment);
            await _dbContext.SaveChangesAsync();
            return ToCampaignPaymentDto(existingPayment);
        }

        var quote = CalculateQuote(request.TargetResponses, request.AnswerCount, request.UnitPricePerAnswer);
        var now = DateTime.UtcNow;
        var paymentCode = await GeneratePaymentCodeAsync();
        var transferContent = BuildTransferContent(paymentCode);
        var bankName = _configuration["SePay:BankShortName"] ?? _configuration["ManualPayment:BankName"] ?? "CONFIGURE_BANK_NAME";
        var bankAccountName = _configuration["ManualPayment:BankAccountName"] ?? "CONFIGURE_BANK_ACCOUNT_NAME";
        var bankAccountNumber = _configuration["ManualPayment:BankAccountNumber"] ?? "CONFIGURE_BANK_ACCOUNT_NUMBER";
        var payment = new CampaignPayment
        {
            CampaignId = campaignId,
            CustomerId = customerId,
            PaymentCode = paymentCode,
            TargetResponses = request.TargetResponses,
            AnswerCount = request.AnswerCount,
            UnitPricePerAnswer = request.UnitPricePerAnswer,
            RewardPerResponse = quote.RewardPerResponse,
            RewardBudget = quote.RewardBudget,
            PlatformFeeRate = quote.PlatformFeeRate,
            PlatformFeeAmount = quote.PlatformFeeAmount,
            TotalAmount = quote.TotalAmount,
            BankName = bankName,
            BankAccountName = bankAccountName,
            BankAccountNumber = bankAccountNumber,
            QrImageUrl = BuildQrImageUrl(bankName, bankAccountName, bankAccountNumber, quote.TotalAmount, transferContent),
            TransferContent = transferContent,
            CustomerNote = NullIfWhiteSpace(request.CustomerNote),
            Status = CampaignPaymentStatus.PENDING,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.CampaignPayments.Add(payment);
        await _dbContext.SaveChangesAsync();

        return ToCampaignPaymentDto(payment);
    }

    public async Task<CampaignPaymentDto> GetMyCampaignPaymentAsync(int paymentId)
    {
        RequireRole("Customer");
        var payment = await FindCampaignPaymentAsync(paymentId);
        if (payment.CustomerId != _currentUser.UserId)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "You can only view your own payment.");
        }

        return ToCampaignPaymentDto(payment);
    }

    public async Task<CampaignPaymentDto> SubmitPaymentProofAsync(int paymentId, SubmitPaymentProofRequest request)
    {
        RequireRole("Customer");
        if (string.IsNullOrWhiteSpace(request.ProofImageUrl))
        {
            throw BadRequest("ProofImageUrl is required.");
        }

        var payment = await FindCampaignPaymentAsync(paymentId);
        if (payment.CustomerId != _currentUser.UserId)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "You can only submit proof for your own payment.");
        }

        if (payment.Status == CampaignPaymentStatus.PAID)
        {
            return ToCampaignPaymentDto(payment);
        }

        if (payment.Status is CampaignPaymentStatus.REJECTED or CampaignPaymentStatus.CANCELLED)
        {
            throw BadRequest("Rejected or cancelled payments cannot be updated.");
        }

        payment.ProofImageUrl = request.ProofImageUrl.Trim();
        payment.CustomerNote = NullIfWhiteSpace(request.CustomerNote) ?? payment.CustomerNote;
        payment.Status = CampaignPaymentStatus.PENDING_VERIFY;
        payment.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return ToCampaignPaymentDto(payment);
    }

    public async Task<IReadOnlyList<CampaignPaymentDto>> GetAdminPaymentsAsync(CampaignPaymentStatus? status)
    {
        RequireRole("Admin");

        var query = _dbContext.CampaignPayments.AsQueryable();
        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => ToCampaignPaymentDto(p))
            .ToListAsync();
    }

    public async Task<CampaignPaymentDto> GetAdminPaymentAsync(int paymentId)
    {
        RequireRole("Admin");
        return ToCampaignPaymentDto(await FindCampaignPaymentAsync(paymentId));
    }

    public async Task<CampaignPaymentDto> ApprovePaymentAsync(int paymentId)
    {
        RequireRole("Admin");
        var payment = await FindCampaignPaymentAsync(paymentId);

        if (payment.Status == CampaignPaymentStatus.PAID)
        {
            await NotifyCampaignPaidAsync(payment);
            return ToCampaignPaymentDto(payment);
        }

        if (payment.Status != CampaignPaymentStatus.PENDING_VERIFY)
        {
            throw BadRequest("Only payments pending verification can be approved.");
        }

        return ToCampaignPaymentDto(await ConfirmCampaignPaymentAsync(
            payment,
            _currentUser.UserId,
            $"Manual payment for campaign {payment.CampaignId}"));
    }

    public async Task<CampaignPaymentDto> RejectPaymentAsync(int paymentId, RejectPaymentRequest request)
    {
        RequireRole("Admin");
        if (string.IsNullOrWhiteSpace(request.RejectReason))
        {
            throw BadRequest("Reject reason is required.");
        }

        var payment = await FindCampaignPaymentAsync(paymentId);
        if (payment.Status == CampaignPaymentStatus.PAID)
        {
            throw BadRequest("Paid payments cannot be rejected.");
        }

        payment.Status = CampaignPaymentStatus.REJECTED;
        payment.VerifiedByAdminId = _currentUser.UserId;
        payment.VerifiedAt = DateTime.UtcNow;
        payment.RejectReason = request.RejectReason.Trim();
        payment.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return ToCampaignPaymentDto(payment);
    }

    public async Task<SePayWebhookProcessResult> ProcessSePayWebhookAsync(SePayWebhookRequest request, string rawPayload)
    {
        if (request.Id <= 0)
        {
            throw BadRequest("SePay transaction id is required.");
        }

        var now = DateTime.UtcNow;
        var webhookLog = await _dbContext.SePayWebhookTransactions
            .FirstOrDefaultAsync(t => t.SePayTransactionId == request.Id);

        if (webhookLog == null)
        {
            webhookLog = new SePayWebhookTransaction
            {
                SePayTransactionId = request.Id,
                Gateway = TrimTo(request.Gateway, 120),
                AccountNumber = TrimTo(request.AccountNumber, 80),
                SubAccount = NullIfWhiteSpace(TrimTo(request.SubAccount, 80)),
                Code = NullIfWhiteSpace(TrimTo(request.Code, 80)),
                Content = TrimTo(request.Content, 1000),
                TransferType = TrimTo(request.TransferType, 12),
                TransferAmount = request.TransferAmount,
                Accumulated = request.Accumulated,
                ReferenceCode = NullIfWhiteSpace(TrimTo(request.ReferenceCode, 120)),
                TransactionDate = ParseSePayTransactionDate(request.TransactionDate),
                RawPayload = TrimTo(rawPayload, 8000),
                ProcessingStatus = "RECEIVED",
                CreatedAt = now,
                UpdatedAt = now
            };
            _dbContext.SePayWebhookTransactions.Add(webhookLog);

            try
            {
                await _dbContext.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                webhookLog = await _dbContext.SePayWebhookTransactions
                    .FirstAsync(t => t.SePayTransactionId == request.Id);
            }
        }

        if (webhookLog.ProcessingStatus is "PAID" or "IGNORED")
        {
            return new SePayWebhookProcessResult
            {
                Processed = false,
                PaymentConfirmed = webhookLog.ProcessingStatus == "PAID",
                PaymentId = webhookLog.CampaignPaymentId,
                Message = "SePay transaction was already processed."
            };
        }

        var paymentCode = ResolvePaymentCode(request);
        webhookLog.PaymentCode = paymentCode;
        webhookLog.UpdatedAt = now;

        if (!string.Equals(request.TransferType, "in", StringComparison.OrdinalIgnoreCase))
        {
            MarkWebhookIgnored(webhookLog, "Only inbound transfers are processed.");
            await _dbContext.SaveChangesAsync();
            return IgnoredWebhookResult(webhookLog);
        }

        if (string.IsNullOrWhiteSpace(paymentCode))
        {
            MarkWebhookIgnored(webhookLog, "No payment code was found in the SePay payload.");
            await _dbContext.SaveChangesAsync();
            return IgnoredWebhookResult(webhookLog);
        }

        var payment = await _dbContext.CampaignPayments
            .FirstOrDefaultAsync(p => p.PaymentCode == paymentCode);

        if (payment == null)
        {
            MarkWebhookIgnored(webhookLog, $"Payment code '{paymentCode}' was not found.");
            await _dbContext.SaveChangesAsync();
            return IgnoredWebhookResult(webhookLog);
        }

        webhookLog.CampaignPaymentId = payment.Id;

        if (!AccountMatches(request.AccountNumber, payment.BankAccountNumber))
        {
            MarkWebhookFailed(webhookLog, "SePay account number does not match the payment bank account.");
            await _dbContext.SaveChangesAsync();
            return FailedWebhookResult(webhookLog);
        }

        if (!AmountMatches(request.TransferAmount, payment.TotalAmount))
        {
            MarkWebhookFailed(webhookLog, $"Transfer amount {request.TransferAmount:0.##} does not match expected {payment.TotalAmount:0.##}.");
            await _dbContext.SaveChangesAsync();
            return FailedWebhookResult(webhookLog);
        }

        if (payment.Status == CampaignPaymentStatus.PAID)
        {
            webhookLog.ProcessingStatus = "PAID";
            webhookLog.ErrorMessage = null;
            webhookLog.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            await NotifyCampaignPaidAsync(payment);
            return new SePayWebhookProcessResult
            {
                Processed = false,
                PaymentConfirmed = true,
                PaymentId = payment.Id,
                Message = "Campaign payment was already confirmed."
            };
        }

        if (payment.Status is CampaignPaymentStatus.REJECTED or CampaignPaymentStatus.CANCELLED)
        {
            MarkWebhookFailed(webhookLog, "Matched payment is rejected or cancelled.");
            await _dbContext.SaveChangesAsync();
            return FailedWebhookResult(webhookLog);
        }

        await ConfirmCampaignPaymentAsync(payment, null, $"SePay transaction {request.Id} for campaign {payment.CampaignId}");
        webhookLog.ProcessingStatus = "PAID";
        webhookLog.ErrorMessage = null;
        webhookLog.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return new SePayWebhookProcessResult
        {
            Processed = true,
            PaymentConfirmed = true,
            PaymentId = payment.Id,
            Message = "Campaign payment confirmed from SePay webhook."
        };
    }

    public async Task<AdminRevenueSummaryDto> GetAdminRevenueSummaryAsync()
    {
        RequireRole("Admin");

        return new AdminRevenueSummaryDto
        {
            TotalPaidAmount = await _dbContext.CampaignPayments
                .Where(p => p.Status == CampaignPaymentStatus.PAID)
                .SumAsync(p => p.TotalAmount),
            TotalRewardBudget = await _dbContext.CampaignPayments
                .Where(p => p.Status == CampaignPaymentStatus.PAID)
                .SumAsync(p => p.RewardBudget),
            TotalPlatformFeeAmount = await _dbContext.CampaignPayments
                .Where(p => p.Status == CampaignPaymentStatus.PAID)
                .SumAsync(p => p.PlatformFeeAmount),
            PaidPaymentCount = await _dbContext.CampaignPayments.CountAsync(p => p.Status == CampaignPaymentStatus.PAID),
            PendingVerifyPaymentCount = await _dbContext.CampaignPayments.CountAsync(p => p.Status == CampaignPaymentStatus.PENDING_VERIFY)
        };
    }

    public async Task<CampaignPaymentStatusResponse> GetCampaignPaymentStatusAsync(int campaignId, int customerId)
    {
        var payment = await _dbContext.CampaignPayments
            .Where(p => p.CampaignId == campaignId && p.CustomerId == customerId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        return new CampaignPaymentStatusResponse
        {
            CampaignId = campaignId,
            CustomerId = customerId,
            HasPaidPayment = payment?.Status == CampaignPaymentStatus.PAID,
            PaymentId = payment?.Id,
            Status = payment?.Status,
            RewardBudget = payment?.RewardBudget
        };
    }

    public async Task<EscrowCampaignResponse> EscrowCampaignAsync(EscrowCampaignRequest request)
    {
        EnsurePositive(request.RewardPerResponse);
        if (request.TargetResponses <= 0)
        {
            throw BadRequest("TargetResponses must be greater than 0.");
        }

        var existingEscrow = await _dbContext.CampaignEscrows.FirstOrDefaultAsync(e => e.CampaignId == request.CampaignId);
        if (existingEscrow != null)
        {
            return new EscrowCampaignResponse
            {
                CampaignId = existingEscrow.CampaignId,
                CustomerId = existingEscrow.CustomerId,
                TotalBudget = existingEscrow.TotalAmount,
                RemainingAmount = existingEscrow.RemainingAmount,
                AlreadyEscrowed = true,
                Message = "Campaign escrow already exists."
            };
        }

        var totalBudget = request.RewardPerResponse * request.TargetResponses;
        EnsurePositive(totalBudget);

        var wallet = await GetOrCreateWalletAsync(request.CustomerId);
        if (wallet.AvailableBalance < totalBudget)
        {
            throw BadRequest("Customer wallet does not have enough available balance for campaign escrow.");
        }

        var now = DateTime.UtcNow;
        wallet.AvailableBalance -= totalBudget;
        wallet.EscrowBalance += totalBudget;
        wallet.UpdatedAt = now;

        var escrow = new CampaignEscrow
        {
            CampaignId = request.CampaignId,
            CustomerId = request.CustomerId,
            TotalAmount = totalBudget,
            RemainingAmount = totalBudget,
            Status = CampaignEscrowStatus.ACTIVE,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.CampaignEscrows.Add(escrow);
        AddTransaction(wallet, WalletTransactionType.CAMPAIGN_ESCROW, -totalBudget,
            CampaignReference, request.CampaignId.ToString(), request.Description);

        await _dbContext.SaveChangesAsync();

        return new EscrowCampaignResponse
        {
            CampaignId = request.CampaignId,
            CustomerId = request.CustomerId,
            TotalBudget = totalBudget,
            RemainingAmount = totalBudget,
            AlreadyEscrowed = false,
            Message = "Campaign escrow created successfully."
        };
    }

    public async Task<PayRewardResponse> PayRewardAsync(PayRewardRequest request)
    {
        EnsurePositive(request.RewardAmount);
        var referenceId = request.SubmissionId.ToString();

        var existingReward = await _dbContext.WalletTransactions.FirstOrDefaultAsync(t =>
            t.Type == WalletTransactionType.REWARD_PAID
            && t.ReferenceType == SubmissionReference
            && t.ReferenceId == referenceId);

        if (existingReward != null)
        {
            return new PayRewardResponse
            {
                CampaignId = request.CampaignId,
                SubmissionId = request.SubmissionId,
                CollaboratorId = request.CollaboratorId,
                RewardAmount = existingReward.Amount,
                CollaboratorBalanceAfter = existingReward.BalanceAfter,
                AlreadyPaid = true,
                TransactionReference = referenceId,
                Message = "Reward was already paid for this submission."
            };
        }

        var escrow = await _dbContext.CampaignEscrows.FirstOrDefaultAsync(e =>
            e.CampaignId == request.CampaignId && e.CustomerId == request.CustomerId)
            ?? throw NotFound("Campaign escrow was not found.");

        if (escrow.Status != CampaignEscrowStatus.ACTIVE)
        {
            throw BadRequest("Campaign escrow is not active.");
        }

        if (escrow.RemainingAmount < request.RewardAmount)
        {
            throw BadRequest("Campaign escrow does not have enough remaining amount.");
        }

        var customerWallet = await GetOrCreateWalletAsync(request.CustomerId);
        var collaboratorWallet = await GetOrCreateWalletAsync(request.CollaboratorId);

        if (customerWallet.EscrowBalance < request.RewardAmount)
        {
            throw BadRequest("Customer escrow balance is not enough to pay reward.");
        }

        var now = DateTime.UtcNow;
        escrow.RemainingAmount -= request.RewardAmount;
        escrow.UpdatedAt = now;
        if (escrow.RemainingAmount == 0)
        {
            escrow.Status = CampaignEscrowStatus.COMPLETED;
        }

        customerWallet.EscrowBalance -= request.RewardAmount;
        customerWallet.UpdatedAt = now;
        collaboratorWallet.AvailableBalance += request.RewardAmount;
        collaboratorWallet.UpdatedAt = now;

        var transaction = AddTransaction(collaboratorWallet, WalletTransactionType.REWARD_PAID, request.RewardAmount,
            SubmissionReference, referenceId, request.Description);

        await _dbContext.SaveChangesAsync();

        return new PayRewardResponse
        {
            CampaignId = request.CampaignId,
            SubmissionId = request.SubmissionId,
            CollaboratorId = request.CollaboratorId,
            RewardAmount = request.RewardAmount,
            CollaboratorBalanceAfter = transaction.BalanceAfter,
            AlreadyPaid = false,
            TransactionReference = referenceId,
            Message = "Reward paid successfully."
        };
    }

    public async Task<RefundCampaignResponse> RefundCampaignAsync(int campaignId, RefundCampaignRequest request)
    {
        var escrow = await _dbContext.CampaignEscrows.FirstOrDefaultAsync(e =>
            e.CampaignId == campaignId && e.CustomerId == request.CustomerId)
            ?? throw NotFound("Campaign escrow was not found.");

        if (escrow.Status == CampaignEscrowStatus.REFUNDED)
        {
            var wallet = await GetOrCreateWalletAsync(request.CustomerId);
            return new RefundCampaignResponse
            {
                CampaignId = campaignId,
                CustomerId = request.CustomerId,
                RefundedAmount = 0,
                CustomerBalanceAfter = wallet.AvailableBalance,
                AlreadyRefunded = true,
                Message = "Campaign escrow was already refunded."
            };
        }

        var refundAmount = escrow.RemainingAmount;
        var customerWallet = await GetOrCreateWalletAsync(request.CustomerId);
        if (refundAmount > customerWallet.EscrowBalance)
        {
            throw BadRequest("Customer escrow balance is less than remaining escrow amount.");
        }

        customerWallet.EscrowBalance -= refundAmount;
        customerWallet.AvailableBalance += refundAmount;
        customerWallet.UpdatedAt = DateTime.UtcNow;

        escrow.RemainingAmount = 0;
        escrow.Status = CampaignEscrowStatus.REFUNDED;
        escrow.UpdatedAt = DateTime.UtcNow;

        AddTransaction(customerWallet, WalletTransactionType.REFUND, refundAmount,
            CampaignReference, campaignId.ToString(), request.Description);

        await _dbContext.SaveChangesAsync();

        return new RefundCampaignResponse
        {
            CampaignId = campaignId,
            CustomerId = request.CustomerId,
            RefundedAmount = refundAmount,
            CustomerBalanceAfter = customerWallet.AvailableBalance,
            AlreadyRefunded = false,
            Message = "Campaign escrow refunded successfully."
        };
    }

    private async Task<CampaignPayment> ConfirmCampaignPaymentAsync(CampaignPayment payment, int? verifiedByAdminId, string customerPaymentDescription)
    {
        if (payment.Status == CampaignPaymentStatus.PAID)
        {
            await NotifyCampaignPaidAsync(payment);
            return payment;
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        var now = DateTime.UtcNow;
        var customerWallet = await GetOrCreateWalletAsync(payment.CustomerId);

        var escrow = await _dbContext.CampaignEscrows.FirstOrDefaultAsync(e => e.CampaignId == payment.CampaignId);
        if (escrow == null)
        {
            escrow = new CampaignEscrow
            {
                CampaignId = payment.CampaignId,
                CustomerId = payment.CustomerId,
                TotalAmount = payment.RewardBudget,
                RemainingAmount = payment.RewardBudget,
                Status = CampaignEscrowStatus.ACTIVE,
                CreatedAt = now,
                UpdatedAt = now
            };
            _dbContext.CampaignEscrows.Add(escrow);
            customerWallet.EscrowBalance += payment.RewardBudget;
            customerWallet.UpdatedAt = now;
        }
        else if (escrow.Status != CampaignEscrowStatus.ACTIVE)
        {
            escrow.Status = CampaignEscrowStatus.ACTIVE;
            escrow.UpdatedAt = now;
        }

        AddTransactionIfMissing(customerWallet, WalletTransactionType.CUSTOMER_PAYMENT, payment.TotalAmount,
            PaymentReference, payment.Id.ToString(), customerPaymentDescription);
        AddTransactionIfMissing(customerWallet, WalletTransactionType.PLATFORM_FEE, payment.PlatformFeeAmount,
            PaymentReference, payment.Id.ToString(), $"Platform fee for campaign {payment.CampaignId}");

        payment.Status = CampaignPaymentStatus.PAID;
        payment.VerifiedByAdminId = verifiedByAdminId;
        payment.VerifiedAt = now;
        payment.RejectReason = null;
        payment.UpdatedAt = now;

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();
        await NotifyCampaignPaidAsync(payment);

        return payment;
    }

    private async Task<Wallet> GetOrCreateWalletAsync(int userId)
    {
        var wallet = await _dbContext.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet != null)
        {
            return wallet;
        }

        var now = DateTime.UtcNow;
        wallet = new Wallet
        {
            UserId = userId,
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.Wallets.Add(wallet);
        return wallet;
    }

    private async Task<Wallet> GetWalletByIdAsync(int walletId)
    {
        return await _dbContext.Wallets.FirstOrDefaultAsync(w => w.Id == walletId)
            ?? throw NotFound("Wallet was not found.");
    }

    private async Task<CampaignPayment> FindCampaignPaymentAsync(int paymentId)
    {
        return await _dbContext.CampaignPayments.FirstOrDefaultAsync(p => p.Id == paymentId)
            ?? throw NotFound("Campaign payment was not found.");
    }

    private async Task<WithdrawalRequest> FindWithdrawalAsync(int withdrawalId)
    {
        return await _dbContext.WithdrawalRequests.FirstOrDefaultAsync(w => w.Id == withdrawalId)
            ?? throw NotFound("Withdrawal request was not found.");
    }

    private async Task NotifyCampaignPaidAsync(CampaignPayment payment)
    {
        await _surveyServiceClient.MarkCampaignPaidAsync(new MarkCampaignPaidSurveyRequest
        {
            CampaignId = payment.CampaignId,
            PaymentId = payment.Id,
            RewardBudget = payment.RewardBudget,
            PlatformFeeAmount = payment.PlatformFeeAmount,
            TotalAmount = payment.TotalAmount,
            AnswerCount = payment.AnswerCount,
            UnitPricePerAnswer = payment.UnitPricePerAnswer
        });
    }

    private WalletTransaction AddTransaction(Wallet wallet, WalletTransactionType type, decimal amount,
        string? referenceType, string? referenceId, string? description)
    {
        var transaction = new WalletTransaction
        {
            Wallet = wallet,
            WalletId = wallet.Id,
            UserId = wallet.UserId,
            Type = type,
            Amount = amount,
            BalanceAfter = wallet.AvailableBalance,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.WalletTransactions.Add(transaction);
        return transaction;
    }

    private WalletTransaction? AddTransactionIfMissing(Wallet wallet, WalletTransactionType type, decimal amount,
        string referenceType, string referenceId, string description)
    {
        var existingTransaction = _dbContext.WalletTransactions.FirstOrDefault(t =>
            t.Type == type && t.ReferenceType == referenceType && t.ReferenceId == referenceId);
        if (existingTransaction != null)
        {
            return null;
        }

        return AddTransaction(wallet, type, amount, referenceType, referenceId, description);
    }

    private void RequireRole(string role)
    {
        if (_currentUser.Role != role)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, $"Only {role} can perform this action.");
        }
    }

    private static void EnsurePositive(decimal amount)
    {
        if (amount <= 0)
        {
            throw BadRequest("Amount must be greater than 0.");
        }
    }

    private static void ValidateQuoteRequest(CampaignQuoteRequest request)
    {
        if (request.TargetResponses <= 0)
        {
            throw BadRequest("TargetResponses must be greater than 0.");
        }

        if (request.AnswerCount <= 0)
        {
            throw BadRequest("AnswerCount must be greater than 0.");
        }

        EnsurePositive(request.UnitPricePerAnswer);
    }

    private static void ValidateBankInfo(string bankName, string bankAccountName, string bankAccountNumber)
    {
        if (string.IsNullOrWhiteSpace(bankName))
        {
            throw BadRequest("BankName is required.");
        }

        if (string.IsNullOrWhiteSpace(bankAccountName))
        {
            throw BadRequest("BankAccountName is required.");
        }

        if (string.IsNullOrWhiteSpace(bankAccountNumber))
        {
            throw BadRequest("BankAccountNumber is required.");
        }
    }

    private static CampaignQuoteResponse CalculateQuote(int targetResponses, int answerCount, decimal unitPricePerAnswer)
    {
        var rewardPerResponse = answerCount * unitPricePerAnswer;
        var rewardBudget = targetResponses * rewardPerResponse;
        var platformFeeAmount = rewardBudget * PlatformFeeRate;

        return new CampaignQuoteResponse
        {
            TargetResponses = targetResponses,
            AnswerCount = answerCount,
            UnitPricePerAnswer = unitPricePerAnswer,
            RewardPerResponse = rewardPerResponse,
            RewardBudget = rewardBudget,
            PlatformFeeRate = PlatformFeeRate,
            PlatformFeeAmount = platformFeeAmount,
            TotalAmount = rewardBudget + platformFeeAmount
        };
    }

    private static string BuildTransferContent(string paymentCode)
    {
        return $"SUREVEY {paymentCode}";
    }

    private async Task<string> GeneratePaymentCodeAsync()
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var code = $"CMP{RandomNumberGenerator.GetHexString(8)}";
            var exists = await _dbContext.CampaignPayments.AnyAsync(p => p.PaymentCode == code);
            if (!exists)
            {
                return code;
            }
        }

        throw BadRequest("Could not generate a unique payment code. Please try again.");
    }

    private static bool IsCurrentPaymentCodeFormat(string paymentCode)
    {
        return Regex.IsMatch(paymentCode, @"^CMP[A-F0-9]{8}$", RegexOptions.IgnoreCase);
    }

    private void RefreshPendingPaymentBankInfo(CampaignPayment payment)
    {
        var bankName = _configuration["SePay:BankShortName"] ?? _configuration["ManualPayment:BankName"] ?? payment.BankName;
        var bankAccountName = _configuration["ManualPayment:BankAccountName"] ?? payment.BankAccountName;
        var bankAccountNumber = _configuration["ManualPayment:BankAccountNumber"] ?? payment.BankAccountNumber;

        payment.BankName = bankName;
        payment.BankAccountName = bankAccountName;
        payment.BankAccountNumber = bankAccountNumber;
        payment.TransferContent = BuildTransferContent(payment.PaymentCode);
        payment.QrImageUrl = BuildQrImageUrl(bankName, bankAccountName, bankAccountNumber, payment.TotalAmount, payment.TransferContent);
        payment.UpdatedAt = DateTime.UtcNow;
    }

    private string BuildQrImageUrl(string bankName, string bankAccountName, string bankAccountNumber, decimal amount, string transferContent)
    {
        var configuredQr = NullIfWhiteSpace(_configuration["ManualPayment:QrImageUrl"]);
        if (configuredQr != null)
        {
            return configuredQr;
        }

        var bank = Uri.EscapeDataString(bankName);
        var account = Uri.EscapeDataString(bankAccountNumber);
        var holder = Uri.EscapeDataString(bankAccountName);
        var description = Uri.EscapeDataString(transferContent);
        var roundedAmount = decimal.Round(amount, 0, MidpointRounding.AwayFromZero);

        return $"https://vietqr.app/img?acc={account}&bank={bank}&amount={roundedAmount:0}&des={description}&template=compact&showinfo=true&fullacc=true&holder={holder}";
    }

    private static string ResolvePaymentCode(SePayWebhookRequest request)
    {
        var directCode = NullIfWhiteSpace(request.Code);
        if (directCode != null)
        {
            return directCode.ToUpperInvariant();
        }

        var content = request.Content ?? string.Empty;
        var match = Regex.Match(content, @"\bCMP[A-Z0-9]{8,37}\b", RegexOptions.IgnoreCase);
        return match.Success ? match.Value.ToUpperInvariant() : string.Empty;
    }

    private bool AccountMatches(string actualAccountNumber, string expectedAccountNumber)
    {
        var requireMatch = _configuration.GetValue("SePay:RequireAccountMatch", true);
        if (!requireMatch)
        {
            return true;
        }

        return string.Equals(NormalizeAccountNumber(actualAccountNumber), NormalizeAccountNumber(expectedAccountNumber), StringComparison.Ordinal);
    }

    private bool AmountMatches(decimal actualAmount, decimal expectedAmount)
    {
        var requireExactAmount = _configuration.GetValue("SePay:RequireExactAmount", true);
        return requireExactAmount
            ? decimal.Round(actualAmount, 0) == decimal.Round(expectedAmount, 0)
            : actualAmount >= expectedAmount;
    }

    private static string NormalizeAccountNumber(string value)
    {
        return new string((value ?? string.Empty).Where(char.IsDigit).ToArray());
    }

    private static DateTime? ParseSePayTransactionDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (DateTime.TryParseExact(value.Trim(), "yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeLocal, out var date))
        {
            return date.ToUniversalTime();
        }

        return DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out date)
            ? date.ToUniversalTime()
            : null;
    }

    private static string TrimTo(string? value, int maxLength)
    {
        var trimmed = value?.Trim() ?? string.Empty;
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        return ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
    }

    private static void MarkWebhookIgnored(SePayWebhookTransaction transaction, string reason)
    {
        transaction.ProcessingStatus = "IGNORED";
        transaction.ErrorMessage = TrimTo(reason, 1000);
        transaction.UpdatedAt = DateTime.UtcNow;
    }

    private static void MarkWebhookFailed(SePayWebhookTransaction transaction, string reason)
    {
        transaction.ProcessingStatus = "FAILED";
        transaction.ErrorMessage = TrimTo(reason, 1000);
        transaction.UpdatedAt = DateTime.UtcNow;
    }

    private static SePayWebhookProcessResult IgnoredWebhookResult(SePayWebhookTransaction transaction)
    {
        return new SePayWebhookProcessResult
        {
            Processed = true,
            PaymentConfirmed = false,
            PaymentId = transaction.CampaignPaymentId,
            Message = transaction.ErrorMessage ?? "SePay transaction ignored."
        };
    }

    private static SePayWebhookProcessResult FailedWebhookResult(SePayWebhookTransaction transaction)
    {
        return new SePayWebhookProcessResult
        {
            Processed = true,
            PaymentConfirmed = false,
            PaymentId = transaction.CampaignPaymentId,
            Message = transaction.ErrorMessage ?? "SePay transaction failed validation."
        };
    }

    private static string? NullIfWhiteSpace(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static WalletDto ToWalletDto(Wallet wallet)
    {
        return new WalletDto
        {
            Id = wallet.Id,
            UserId = wallet.UserId,
            AvailableBalance = wallet.AvailableBalance,
            PendingBalance = wallet.PendingBalance,
            EscrowBalance = wallet.EscrowBalance,
            CreatedAt = wallet.CreatedAt,
            UpdatedAt = wallet.UpdatedAt
        };
    }

    private static WalletTransactionDto ToTransactionDto(WalletTransaction transaction)
    {
        return new WalletTransactionDto
        {
            Id = transaction.Id,
            WalletId = transaction.WalletId,
            UserId = transaction.UserId,
            Type = transaction.Type,
            Amount = transaction.Amount,
            BalanceAfter = transaction.BalanceAfter,
            ReferenceType = transaction.ReferenceType,
            ReferenceId = transaction.ReferenceId,
            Description = transaction.Description,
            CreatedAt = transaction.CreatedAt
        };
    }

    private static CampaignPaymentDto ToCampaignPaymentDto(CampaignPayment payment)
    {
        return new CampaignPaymentDto
        {
            Id = payment.Id,
            CampaignId = payment.CampaignId,
            CustomerId = payment.CustomerId,
            PaymentCode = payment.PaymentCode,
            TargetResponses = payment.TargetResponses,
            AnswerCount = payment.AnswerCount,
            UnitPricePerAnswer = payment.UnitPricePerAnswer,
            RewardPerResponse = payment.RewardPerResponse,
            RewardBudget = payment.RewardBudget,
            PlatformFeeRate = payment.PlatformFeeRate,
            PlatformFeeAmount = payment.PlatformFeeAmount,
            TotalAmount = payment.TotalAmount,
            BankName = payment.BankName,
            BankAccountName = payment.BankAccountName,
            BankAccountNumber = payment.BankAccountNumber,
            QrImageUrl = payment.QrImageUrl,
            TransferContent = payment.TransferContent,
            ProofImageUrl = payment.ProofImageUrl,
            CustomerNote = payment.CustomerNote,
            Status = payment.Status,
            VerifiedByAdminId = payment.VerifiedByAdminId,
            VerifiedAt = payment.VerifiedAt,
            RejectReason = payment.RejectReason,
            CreatedAt = payment.CreatedAt,
            UpdatedAt = payment.UpdatedAt
        };
    }

    private static WithdrawalDto ToWithdrawalDto(WithdrawalRequest withdrawal)
    {
        return new WithdrawalDto
        {
            Id = withdrawal.Id,
            CollaboratorId = withdrawal.CollaboratorId,
            WalletId = withdrawal.WalletId,
            Amount = withdrawal.Amount,
            BankName = withdrawal.BankName,
            BankAccountName = withdrawal.BankAccountName,
            BankAccountNumber = withdrawal.BankAccountNumber,
            Status = withdrawal.Status,
            AdminNote = withdrawal.AdminNote,
            RejectReason = withdrawal.RejectReason,
            RequestedAt = withdrawal.RequestedAt,
            ReviewedByAdminId = withdrawal.ReviewedByAdminId,
            ReviewedAt = withdrawal.ReviewedAt,
            PaidAt = withdrawal.PaidAt
        };
    }

    private static ApiException BadRequest(string message) => new(StatusCodes.Status400BadRequest, message);
    private static ApiException NotFound(string message) => new(StatusCodes.Status404NotFound, message);
}
