using Microsoft.EntityFrameworkCore;
using SurveyService.Data;
using SurveyService.DTOs;
using SurveyService.Enums;
using SurveyService.Models;

namespace SurveyService.Services;

public class SurveyFlowService : ISurveyFlowService
{
    private readonly SurveyDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;
    private readonly IWalletServiceClient _walletServiceClient;

    public SurveyFlowService(SurveyDbContext dbContext, ICurrentUserService currentUser, IWalletServiceClient walletServiceClient)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _walletServiceClient = walletServiceClient;
    }

    public async Task<CampaignDto> CreateCampaignAsync(CreateCampaignRequest request)
    {
        RequireRole("Customer");
        ValidateCampaignRequest(request);

        var now = DateTime.UtcNow;
        var calculatedRewardPerResponse = request.AnswerCount * request.UnitPricePerAnswer;
        var rewardBudget = request.TargetResponses * calculatedRewardPerResponse;
        var platformFeeAmount = rewardBudget * 0.20m;
        var campaign = new Campaign
        {
            CustomerId = _currentUser.UserId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Instruction = request.Instruction.Trim(),
            CampaignType = request.CampaignType,
            GoogleFormUrl = string.IsNullOrWhiteSpace(request.GoogleFormUrl) ? null : request.GoogleFormUrl.Trim(),
            ConfirmationCode = GenerateConfirmationCode(),
            RewardPerResponse = calculatedRewardPerResponse,
            TargetResponses = request.TargetResponses,
            AnswerCount = request.AnswerCount,
            UnitPricePerAnswer = request.UnitPricePerAnswer,
            RewardBudget = rewardBudget,
            PlatformFeeAmount = platformFeeAmount,
            TotalAmount = rewardBudget + platformFeeAmount,
            Deadline = request.Deadline.ToUniversalTime(),
            Category = request.Category.Trim(),
            Status = CampaignStatus.DRAFT,
            PaymentStatus = CampaignPaymentStatus.PAYMENT_PENDING,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Campaigns.Add(campaign);
        await _dbContext.SaveChangesAsync();

        if (request.SubmitForReview)
        {
            return await SubmitCampaignForReviewAsync(campaign.Id);
        }

        return ToCampaignDto(campaign);
    }

    public async Task<IReadOnlyList<CampaignDto>> GetMyCampaignsAsync()
    {
        RequireRole("Customer");
        var customerId = _currentUser.UserId;

        return await _dbContext.Campaigns
            .Where(c => c.CustomerId == customerId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => ToCampaignDto(c))
            .ToListAsync();
    }

    public async Task<CampaignDto> GetCampaignAsync(int campaignId)
    {
        var campaign = await FindCampaignAsync(campaignId);

        if (_currentUser.Role == "Customer" && campaign.CustomerId != _currentUser.UserId)
        {
            throw Forbidden("You can only view your own campaigns.");
        }

        if (_currentUser.Role == "Collaborator" && campaign.Status != CampaignStatus.ACTIVE)
        {
            throw Forbidden("Collaborators can only view active campaigns.");
        }

        return ToCampaignDto(campaign);
    }

    public async Task<CampaignOwnershipDto> CheckCampaignOwnershipAsync(int campaignId, int customerId)
    {
        var campaign = await FindCampaignAsync(campaignId);
        return new CampaignOwnershipDto
        {
            CampaignId = campaign.Id,
            CustomerId = customerId,
            IsOwner = campaign.CustomerId == customerId
        };
    }

    public async Task<CampaignDto> SubmitCampaignForReviewAsync(int campaignId)
    {
        RequireRole("Customer");
        var campaign = await FindCampaignAsync(campaignId);
        EnsureCampaignOwner(campaign);

        if (campaign.Status is not (CampaignStatus.DRAFT or CampaignStatus.REJECTED))
        {
            throw BadRequest("Only draft or rejected campaigns can be submitted for review.");
        }

        if (campaign.Deadline <= DateTime.UtcNow)
        {
            throw BadRequest("Campaign deadline must be in the future before submitting for review.");
        }

        if (!campaign.IsEscrowed)
        {
            if (campaign.PaymentStatus != CampaignPaymentStatus.PAID)
            {
                throw BadRequest("Campaign payment must be verified before submitting for review.");
            }
        }

        campaign.Status = CampaignStatus.PENDING_REVIEW;
        campaign.RejectReason = null;
        campaign.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return ToCampaignDto(campaign);
    }

    public async Task<CampaignDto> MarkCampaignPaidAsync(int campaignId, MarkCampaignPaidRequest request)
    {
        ValidateMarkCampaignPaidRequest(request);
        var campaign = await FindCampaignAsync(campaignId);
        var now = DateTime.UtcNow;
        var rewardPerResponse = request.AnswerCount * request.UnitPricePerAnswer;
        var expectedRewardBudget = campaign.TargetResponses * rewardPerResponse;
        if (campaign.PaymentStatus == CampaignPaymentStatus.PAID
            && campaign.PaymentId.HasValue
            && campaign.PaymentId.Value != request.PaymentId)
        {
            throw BadRequest("Campaign was already marked paid by another payment.");
        }

        if (request.RewardBudget != expectedRewardBudget)
        {
            throw BadRequest("RewardBudget must equal campaign TargetResponses * AnswerCount * UnitPricePerAnswer.");
        }

        campaign.PaymentStatus = CampaignPaymentStatus.PAID;
        campaign.PaymentId = request.PaymentId;
        campaign.RewardBudget = request.RewardBudget;
        campaign.PlatformFeeAmount = request.PlatformFeeAmount;
        campaign.TotalAmount = request.TotalAmount;
        campaign.AnswerCount = request.AnswerCount;
        campaign.UnitPricePerAnswer = request.UnitPricePerAnswer;
        campaign.RewardPerResponse = rewardPerResponse;
        campaign.IsEscrowed = true;
        campaign.EscrowedAt ??= now;
        if (campaign.Status is CampaignStatus.DRAFT or CampaignStatus.PENDING_REVIEW)
        {
            campaign.Status = CampaignStatus.ACTIVE;
            campaign.RejectReason = null;
        }
        campaign.UpdatedAt = now;

        await _dbContext.SaveChangesAsync();
        return ToCampaignDto(campaign);
    }

    public async Task<IReadOnlyList<SubmissionDto>> GetCampaignSubmissionsAsync(int campaignId)
    {
        RequireRole("Customer");
        var campaign = await FindCampaignAsync(campaignId);
        EnsureCampaignOwner(campaign);

        return await _dbContext.Submissions
            .Where(s => s.CampaignId == campaignId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => ToSubmissionDto(s, null))
            .ToListAsync();
    }

    public async Task<SubmissionDto> GetSubmissionAsync(int submissionId)
    {
        RequireRole("Customer");
        var submission = await _dbContext.Submissions
            .Include(s => s.Campaign)
            .FirstOrDefaultAsync(s => s.Id == submissionId)
            ?? throw NotFound("Submission was not found.");

        EnsureCampaignOwner(submission.Campaign!);
        return ToSubmissionDto(submission, submission.Campaign);
    }

    public async Task<ReviewSubmissionResponse> ApproveSubmissionAsync(int submissionId)
    {
        RequireRole("Customer");
        var submission = await FindSubmissionWithCampaignAndParticipationAsync(submissionId);
        EnsureCampaignOwner(submission.Campaign!);

        if (submission.Status == SubmissionStatus.REJECTED)
        {
            throw BadRequest("Rejected submissions cannot be approved directly.");
        }

        var wasAlreadyApproved = submission.Status == SubmissionStatus.APPROVED;
        var now = DateTime.UtcNow;

        PayRewardWalletResponse? rewardResponse = null;
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        submission.Status = SubmissionStatus.APPROVED;
        submission.RejectReason = null;
        submission.ReviewedByUserId = _currentUser.UserId;
        submission.ReviewedAt = now;
        submission.UpdatedAt = now;

        submission.Participation!.Status = ParticipationStatus.APPROVED;
        submission.Participation.UpdatedAt = now;

        if (!wasAlreadyApproved)
        {
            submission.Campaign!.ApprovedResponses += 1;
        }

        if (submission.Campaign!.ApprovedResponses >= submission.Campaign.TargetResponses)
        {
            submission.Campaign.Status = CampaignStatus.COMPLETED;
        }

        submission.Campaign.UpdatedAt = now;

        if (!wasAlreadyApproved && submission.RewardPaidAt == null)
        {
            rewardResponse = await _walletServiceClient.PayRewardAsync(new PayRewardWalletRequest
            {
                CampaignId = submission.Campaign!.Id,
                SubmissionId = submission.Id,
                CustomerId = submission.Campaign.CustomerId,
                CollaboratorId = submission.CollaboratorId,
                RewardAmount = submission.Campaign.RewardPerResponse,
                Description = $"Reward for submission {submission.Id}"
            });
            submission.RewardPaidAt = DateTime.UtcNow;
            submission.RewardTransactionReference = rewardResponse.TransactionReference;
        }

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return new ReviewSubmissionResponse
        {
            SubmissionId = submission.Id,
            SubmissionStatus = submission.Status,
            ParticipationStatus = submission.Participation.Status,
            CampaignStatus = submission.Campaign.Status,
            ApprovedResponses = submission.Campaign.ApprovedResponses,
            Message = rewardResponse?.AlreadyPaid == true
                ? "Submission approved successfully. Reward was already paid before."
                : "Submission approved successfully. Reward paid to collaborator wallet."
        };
    }

    public async Task<ReviewSubmissionResponse> RejectSubmissionAsync(int submissionId, RejectSubmissionRequest request)
    {
        RequireRole("Customer");
        if (string.IsNullOrWhiteSpace(request.RejectReason))
        {
            throw BadRequest("Reject reason is required.");
        }

        var submission = await FindSubmissionWithCampaignAndParticipationAsync(submissionId);
        EnsureCampaignOwner(submission.Campaign!);

        var now = DateTime.UtcNow;
        submission.Status = SubmissionStatus.REJECTED;
        submission.RejectReason = request.RejectReason.Trim();
        submission.ReviewedByUserId = _currentUser.UserId;
        submission.ReviewedAt = now;
        submission.UpdatedAt = now;

        submission.Participation!.Status = ParticipationStatus.REJECTED;
        submission.Participation.UpdatedAt = now;

        await _dbContext.SaveChangesAsync();

        return new ReviewSubmissionResponse
        {
            SubmissionId = submission.Id,
            SubmissionStatus = submission.Status,
            ParticipationStatus = submission.Participation.Status,
            CampaignStatus = submission.Campaign!.Status,
            ApprovedResponses = submission.Campaign.ApprovedResponses,
            Message = "Submission rejected successfully."
        };
    }

    public async Task<IReadOnlyList<CampaignDto>> GetPendingCampaignsAsync()
    {
        RequireRole("Admin");

        return await _dbContext.Campaigns
            .Where(c => c.Status == CampaignStatus.PENDING_REVIEW)
            .OrderBy(c => c.CreatedAt)
            .Select(c => ToCampaignDto(c))
            .ToListAsync();
    }

    public async Task<CampaignDto> ApproveCampaignAsync(int campaignId)
    {
        RequireRole("Admin");
        var campaign = await FindCampaignAsync(campaignId);

        if (campaign.Status != CampaignStatus.PENDING_REVIEW)
        {
            throw BadRequest("Only pending review campaigns can be approved.");
        }

        if (campaign.Deadline <= DateTime.UtcNow)
        {
            throw BadRequest("Campaign deadline has already passed.");
        }

        campaign.Status = CampaignStatus.ACTIVE;
        campaign.RejectReason = null;
        campaign.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return ToCampaignDto(campaign);
    }

    public async Task<CampaignDto> RejectCampaignAsync(int campaignId, RejectCampaignRequest request)
    {
        RequireRole("Admin");
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw BadRequest("Reject reason is required.");
        }

        var campaign = await FindCampaignAsync(campaignId);
        if (campaign.Status != CampaignStatus.PENDING_REVIEW)
        {
            throw BadRequest("Only pending review campaigns can be rejected.");
        }

        if (campaign.IsEscrowed)
        {
            await _walletServiceClient.RefundCampaignAsync(campaign.Id, new RefundCampaignWalletRequest
            {
                CustomerId = campaign.CustomerId,
                Description = $"Refund escrow for rejected campaign {campaign.Id}"
            });
        }

        campaign.Status = CampaignStatus.REJECTED;
        campaign.RejectReason = request.Reason.Trim();
        campaign.IsEscrowed = false;
        campaign.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return ToCampaignDto(campaign);
    }

    public async Task<IReadOnlyList<AvailableSurveyDto>> GetAvailableSurveysAsync()
    {
        RequireRole("Collaborator");
        var now = DateTime.UtcNow;

        return await _dbContext.Campaigns
            .Where(c => c.Status == CampaignStatus.ACTIVE
                && c.Deadline > now
                && c.ApprovedResponses < c.TargetResponses)
            .OrderBy(c => c.Deadline)
            .Select(c => new AvailableSurveyDto
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                Instruction = c.Instruction,
                GoogleFormUrl = c.GoogleFormUrl,
                RewardPerResponse = c.RewardPerResponse,
                TargetResponses = c.TargetResponses,
                ApprovedResponses = c.ApprovedResponses,
                RemainingSlots = c.TargetResponses - c.ApprovedResponses,
                Deadline = c.Deadline,
                Category = c.Category
            })
            .ToListAsync();
    }

    public async Task<ParticipationDto> AcceptCampaignAsync(int campaignId)
    {
        RequireRole("Collaborator");
        var campaign = await FindCampaignAsync(campaignId);

        if (campaign.Status != CampaignStatus.ACTIVE)
        {
            throw BadRequest("Only active campaigns can be accepted.");
        }

        if (campaign.Deadline <= DateTime.UtcNow)
        {
            throw BadRequest("Campaign deadline has already passed.");
        }

        if (campaign.ApprovedResponses >= campaign.TargetResponses)
        {
            throw BadRequest("Campaign already reached its target responses.");
        }

        var collaboratorId = _currentUser.UserId;
        var alreadyAccepted = await _dbContext.Participations
            .AnyAsync(p => p.CampaignId == campaignId && p.CollaboratorId == collaboratorId);

        if (alreadyAccepted)
        {
            throw BadRequest("You have already accepted this campaign.");
        }

        var now = DateTime.UtcNow;
        var participation = new Participation
        {
            CampaignId = campaignId,
            CollaboratorId = collaboratorId,
            Status = ParticipationStatus.ACCEPTED,
            AcceptedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Participations.Add(participation);
        await _dbContext.SaveChangesAsync();

        participation.Campaign = campaign;
        return ToParticipationDto(participation, campaign);
    }

    public async Task<IReadOnlyList<ParticipationDto>> GetMyParticipationsAsync()
    {
        RequireRole("Collaborator");
        var collaboratorId = _currentUser.UserId;

        return await _dbContext.Participations
            .Include(p => p.Campaign)
            .Where(p => p.CollaboratorId == collaboratorId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => ToParticipationDto(p, p.Campaign))
            .ToListAsync();
    }

    public async Task<SubmissionDto> SubmitParticipationAsync(int participationId, SubmitSubmissionRequest request)
    {
        RequireRole("Collaborator");
        var collaboratorId = _currentUser.UserId;
        var participation = await _dbContext.Participations
            .Include(p => p.Campaign)
            .FirstOrDefaultAsync(p => p.Id == participationId)
            ?? throw NotFound("Participation was not found.");

        if (participation.CollaboratorId != collaboratorId)
        {
            throw Forbidden("You can only submit your own participation.");
        }

        var campaign = participation.Campaign!;
        if (campaign.Status != CampaignStatus.ACTIVE)
        {
            throw BadRequest("Campaign is not active.");
        }

        if (campaign.Deadline <= DateTime.UtcNow)
        {
            throw BadRequest("Campaign deadline has already passed.");
        }

        var confirmationCode = request.ConfirmationCode?.Trim() ?? string.Empty;
        if (campaign.CampaignType == CampaignType.GOOGLE_FORM)
        {
            if (string.IsNullOrWhiteSpace(confirmationCode))
            {
                throw BadRequest("Confirmation code is required for Google Form campaigns.");
            }

            if (!string.Equals(confirmationCode, campaign.ConfirmationCode, StringComparison.OrdinalIgnoreCase))
            {
                throw BadRequest("Confirmation code is invalid.");
            }
        }

        var hasBlockingSubmission = await _dbContext.Submissions.AnyAsync(s =>
            s.ParticipationId == participationId
            && (s.Status == SubmissionStatus.PENDING || s.Status == SubmissionStatus.APPROVED));

        if (hasBlockingSubmission)
        {
            throw BadRequest("This participation already has a pending or approved submission.");
        }

        var now = DateTime.UtcNow;
        var submission = new Submission
        {
            CampaignId = campaign.Id,
            ParticipationId = participation.Id,
            CollaboratorId = collaboratorId,
            ConfirmationCode = confirmationCode,
            ProofImageUrl = string.IsNullOrWhiteSpace(request.ProofImageUrl) ? null : request.ProofImageUrl.Trim(),
            ContactEmail = string.IsNullOrWhiteSpace(request.ContactEmail) ? null : request.ContactEmail.Trim(),
            ContactPhone = string.IsNullOrWhiteSpace(request.ContactPhone) ? null : request.ContactPhone.Trim(),
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Status = SubmissionStatus.PENDING,
            CreatedAt = now,
            UpdatedAt = now
        };

        participation.Status = ParticipationStatus.SUBMITTED;
        participation.SubmittedAt = now;
        participation.UpdatedAt = now;

        _dbContext.Submissions.Add(submission);
        await _dbContext.SaveChangesAsync();

        return ToSubmissionDto(submission, campaign);
    }

    private static void ValidateCampaignRequest(CreateCampaignRequest request)
    {
        if (request.CampaignType == CampaignType.INTERNAL_FORM)
        {
            throw BadRequest("Internal Form Builder is not implemented in this phase.");
        }

        if (request.CampaignType == CampaignType.GOOGLE_FORM && string.IsNullOrWhiteSpace(request.GoogleFormUrl))
        {
            throw BadRequest("GoogleFormUrl is required for Google Form campaigns.");
        }

        if (request.Deadline.ToUniversalTime() <= DateTime.UtcNow)
        {
            throw BadRequest("Campaign deadline must be in the future.");
        }

        if (request.AnswerCount <= 0)
        {
            throw BadRequest("AnswerCount must be greater than 0.");
        }

        if (request.UnitPricePerAnswer <= 0)
        {
            throw BadRequest("UnitPricePerAnswer must be greater than 0.");
        }

        var calculatedRewardPerResponse = request.AnswerCount * request.UnitPricePerAnswer;
        if (request.RewardPerResponse > 0 && request.RewardPerResponse != calculatedRewardPerResponse)
        {
            throw BadRequest("RewardPerResponse must equal AnswerCount * UnitPricePerAnswer.");
        }
    }

    private static void ValidateMarkCampaignPaidRequest(MarkCampaignPaidRequest request)
    {
        if (request.PaymentId <= 0)
        {
            throw BadRequest("PaymentId must be greater than 0.");
        }

        if (request.AnswerCount <= 0)
        {
            throw BadRequest("AnswerCount must be greater than 0.");
        }

        if (request.UnitPricePerAnswer <= 0)
        {
            throw BadRequest("UnitPricePerAnswer must be greater than 0.");
        }

        if (request.RewardBudget <= 0 || request.TotalAmount <= 0)
        {
            throw BadRequest("Payment amounts must be greater than 0.");
        }
    }

    private async Task<Campaign> FindCampaignAsync(int campaignId)
    {
        return await _dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId)
            ?? throw NotFound("Campaign was not found.");
    }

    private async Task<Submission> FindSubmissionWithCampaignAndParticipationAsync(int submissionId)
    {
        return await _dbContext.Submissions
            .Include(s => s.Campaign)
            .Include(s => s.Participation)
            .FirstOrDefaultAsync(s => s.Id == submissionId)
            ?? throw NotFound("Submission was not found.");
    }

    private void EnsureCampaignOwner(Campaign campaign)
    {
        if (campaign.CustomerId != _currentUser.UserId)
        {
            throw Forbidden("You can only access submissions for your own campaign.");
        }
    }

    private void RequireRole(string role)
    {
        if (_currentUser.Role != role)
        {
            throw Forbidden($"Only {role} can perform this action.");
        }
    }

    private static string GenerateConfirmationCode()
    {
        return Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
    }

    private static CampaignDto ToCampaignDto(Campaign campaign)
    {
        return new CampaignDto
        {
            Id = campaign.Id,
            CustomerId = campaign.CustomerId,
            Title = campaign.Title,
            Description = campaign.Description,
            Instruction = campaign.Instruction,
            CampaignType = campaign.CampaignType,
            GoogleFormUrl = campaign.GoogleFormUrl,
            ConfirmationCode = campaign.ConfirmationCode,
            RewardPerResponse = campaign.RewardPerResponse,
            TargetResponses = campaign.TargetResponses,
            ApprovedResponses = campaign.ApprovedResponses,
            Deadline = campaign.Deadline,
            Category = campaign.Category,
            Status = campaign.Status,
            RejectReason = campaign.RejectReason,
            IsEscrowed = campaign.IsEscrowed,
            EscrowedAt = campaign.EscrowedAt,
            PaymentStatus = campaign.PaymentStatus,
            PaymentId = campaign.PaymentId,
            RewardBudget = campaign.RewardBudget,
            PlatformFeeAmount = campaign.PlatformFeeAmount,
            TotalAmount = campaign.TotalAmount,
            AnswerCount = campaign.AnswerCount,
            UnitPricePerAnswer = campaign.UnitPricePerAnswer,
            CreatedAt = campaign.CreatedAt,
            UpdatedAt = campaign.UpdatedAt
        };
    }

    private static ParticipationDto ToParticipationDto(Participation participation, Campaign? campaign)
    {
        return new ParticipationDto
        {
            Id = participation.Id,
            CampaignId = participation.CampaignId,
            CollaboratorId = participation.CollaboratorId,
            Status = participation.Status,
            AcceptedAt = participation.AcceptedAt,
            SubmittedAt = participation.SubmittedAt,
            CreatedAt = participation.CreatedAt,
            UpdatedAt = participation.UpdatedAt,
            Campaign = campaign == null ? null : ToCampaignDto(campaign)
        };
    }

    private static SubmissionDto ToSubmissionDto(Submission submission, Campaign? campaign)
    {
        return new SubmissionDto
        {
            Id = submission.Id,
            CampaignId = submission.CampaignId,
            ParticipationId = submission.ParticipationId,
            CollaboratorId = submission.CollaboratorId,
            ConfirmationCode = submission.ConfirmationCode,
            ProofImageUrl = submission.ProofImageUrl,
            ContactEmail = submission.ContactEmail,
            ContactPhone = submission.ContactPhone,
            Note = submission.Note,
            Status = submission.Status,
            RejectReason = submission.RejectReason,
            ReviewedByUserId = submission.ReviewedByUserId,
            ReviewedAt = submission.ReviewedAt,
            RewardPaidAt = submission.RewardPaidAt,
            RewardTransactionReference = submission.RewardTransactionReference,
            CreatedAt = submission.CreatedAt,
            UpdatedAt = submission.UpdatedAt,
            Campaign = campaign == null ? null : ToCampaignDto(campaign)
        };
    }

    private static ApiException BadRequest(string message)
    {
        return new ApiException(StatusCodes.Status400BadRequest, message);
    }

    private static ApiException Forbidden(string message)
    {
        return new ApiException(StatusCodes.Status403Forbidden, message);
    }

    private static ApiException NotFound(string message)
    {
        return new ApiException(StatusCodes.Status404NotFound, message);
    }
}
