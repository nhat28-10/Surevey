using Microsoft.EntityFrameworkCore;
using WalletService.Data;
using WalletService.DTOs;
using WalletService.Enums;
using WalletService.Models;

namespace WalletService.Services;

public class WalletFlowService : IWalletFlowService
{
    private const string CampaignReference = "CAMPAIGN";
    private const string SubmissionReference = "SUBMISSION";
    private readonly WalletDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;

    public WalletFlowService(WalletDbContext dbContext, ICurrentUserService currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
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

    private static ApiException BadRequest(string message) => new(StatusCodes.Status400BadRequest, message);
    private static ApiException NotFound(string message) => new(StatusCodes.Status404NotFound, message);
}
