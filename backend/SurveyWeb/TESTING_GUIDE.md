# SureSurvey Backend Testing Guide

## Scope

This guide stabilizes the MVP backend before tester handoff. It covers:

- UserService auth and role tokens
- SurveyService campaign, participation, submission, and campaign payment status
- WalletService manual campaign payment, escrow/reward, and withdrawal

## Local Setup

Run from `backend/SurveyWeb`.

1. Configure local settings from each service's `appsettings.example.json`.
2. Use the same `Jwt` and `InternalService:ApiKey` values across services.
3. Start PostgreSQL on the configured port, usually `127.0.0.1:5434`.
4. Apply migrations:

```bash
dotnet ef database update --project UserService --startup-project UserService
dotnet ef database update --project SurveyService --startup-project SurveyService
dotnet ef database update --project WalletService --startup-project WalletService
```

5. Verify build:

```bash
dotnet build SurveyWeb.sln
```

## Run Services

Open one terminal per service:

```bash
dotnet run --project UserService
dotnet run --project SurveyService
dotnet run --project WalletService
```

Default local URLs from `launchSettings.json`:

- UserService: check its Swagger URL from console output
- SurveyService: `https://localhost:7148` or `http://localhost:5159`
- WalletService: `https://localhost:7074` or `http://localhost:5258`

Swagger is served at each service root in Development.

## Enum and Swagger Checks

Confirm enum values appear as strings in request/response JSON:

- Campaign status: `DRAFT`, `PENDING_REVIEW`, `ACTIVE`, `REJECTED`, `PAUSED`, `COMPLETED`, `CANCELLED`, `EXPIRED`
- Survey payment status: `UNPAID`, `PAYMENT_PENDING`, `PAYMENT_VERIFYING`, `PAID`, `PAYMENT_REJECTED`
- Campaign payment status: `PENDING`, `PENDING_VERIFY`, `PAID`, `REJECTED`, `CANCELLED`
- Withdrawal status: `PENDING`, `APPROVED`, `REJECTED`, `PAID`

Swagger should show DTO schemas for:

- `CampaignQuoteRequest`, `CreateCampaignPaymentRequest`, `SubmitPaymentProofRequest`, `RejectPaymentRequest`
- `CreateWithdrawalRequest`, `ReviewWithdrawalRequest`
- `MarkCampaignPaidRequest` on the internal SurveyService route

## Manual Campaign Payment Flow

Use a Customer token unless noted.

1. Create campaign in SurveyService:

```http
POST /api/campaigns
```

Required fields include `answerCount`, `unitPricePerAnswer`, and `targetResponses`. `rewardPerResponse` may be `0` or must equal `answerCount * unitPricePerAnswer`.

Expected:

- `status = DRAFT`
- `paymentStatus = PAYMENT_PENDING`
- `rewardPerResponse`, `rewardBudget`, `platformFeeAmount`, `totalAmount` are calculated by backend

2. Create payment in WalletService:

```http
POST /api/campaigns/{campaignId}/payments
```

Expected:

- Only the campaign owner can create it
- Response contains bank info, QR URL, `transferContent`, and backend-calculated totals

3. Submit payment proof:

```http
POST /api/payments/{paymentId}/proof
```

Expected:

- Only the payment owner can submit proof
- Status changes to `PENDING_VERIFY`

4. Admin approve payment:

```http
POST /api/admin/payments/{paymentId}/approve
```

Expected:

- Only Admin can approve
- WalletService creates or reuses campaign escrow from `rewardBudget`
- WalletService records `CUSTOMER_PAYMENT` and `PLATFORM_FEE`
- SurveyService campaign is marked `paymentStatus = PAID`, `isEscrowed = true`

5. Submit campaign for review:

```http
POST /api/campaigns/{campaignId}/submit-review
```

Expected:

- Before payment is verified: `400 Campaign payment must be verified before submitting for review.`
- After payment is verified: status becomes `PENDING_REVIEW`

6. Admin campaign review in SurveyService:

```http
GET /api/admin/campaigns/pending
POST /api/admin/campaigns/{campaignId}/approve
POST /api/admin/campaigns/{campaignId}/reject
```

## Participation and Reward Flow

Use a Collaborator token unless noted.

1. List active campaigns:

```http
GET /api/surveys/available
```

2. Accept campaign:

```http
POST /api/campaigns/{campaignId}/accept
```

3. Submit proof/confirmation code:

```http
POST /api/participations/{participationId}/submit
```

4. Customer approves submission:

```http
POST /api/submissions/{submissionId}/approve
```

Expected:

- Collaborator wallet `AvailableBalance` increases by `RewardPerResponse`
- Re-approving the same submission does not pay reward again

## Withdrawal Flow

Use a Collaborator token unless noted.

1. Create withdrawal:

```http
POST /api/withdrawals
```

Expected:

- Only collaborator can create
- Amount cannot exceed wallet `AvailableBalance`
- Amount moves from `AvailableBalance` to `PendingBalance`
- Wallet transaction `WITHDRAWAL` is created with withdrawal reference

2. List my withdrawals:

```http
GET /api/withdrawals/me
```

3. Admin list/filter withdrawals:

```http
GET /api/admin/withdrawals
GET /api/admin/withdrawals?status=PENDING
```

4. Admin approve:

```http
POST /api/admin/withdrawals/{id}/approve
```

Expected:

- Status becomes `APPROVED`
- Pending balance is unchanged
- Calling again does not change balances

5. Admin reject:

```http
POST /api/admin/withdrawals/{id}/reject
```

Expected:

- Status becomes `REJECTED`
- Amount moves from `PendingBalance` back to `AvailableBalance`
- Wallet transaction `WITHDRAWAL_REJECTED` is created
- Calling again does not refund again

6. Admin mark paid:

```http
POST /api/admin/withdrawals/{id}/mark-paid
```

Expected:

- Only `APPROVED` withdrawal can be marked paid
- Status becomes `PAID`
- Amount is removed from `PendingBalance`
- Calling again does not subtract again

## Authorization Checklist

- Customer cannot create payment for another customer's campaign
- Customer cannot submit proof for another customer's payment
- Collaborator cannot access admin payment or withdrawal routes
- Customer cannot access admin payment or withdrawal routes
- Admin can approve/reject payments
- Admin can approve/reject/mark-paid withdrawals
- Internal routes require `X-Internal-Service-Key`

## Idempotency Checklist

- Approve a `PAID` campaign payment twice: no duplicate escrow or payment transactions
- Approve an already-approved submission twice: no duplicate reward payment
- Reject a withdrawal twice: no duplicate refund to available balance
- Mark a withdrawal paid twice: no duplicate pending-balance subtraction

## Migration Commands

```bash
dotnet ef database update --project UserService --startup-project UserService
dotnet ef database update --project SurveyService --startup-project SurveyService
dotnet ef database update --project WalletService --startup-project WalletService
```

## Known Notes

- Manual campaign payment does not integrate a real payment gateway.
- Withdrawal does not integrate a real bank transfer.
- Internal Form Builder, Notification, and API Gateway are outside this stabilization pass.
