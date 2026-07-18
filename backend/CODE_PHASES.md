# CODE_PHASES.md

## Purpose

This document defines the recommended coding phases for the SureVey MVP backend.

The project should be developed step by step based on the core demo flow:

Customer creates campaign
→ Admin approves campaign
→ Collaborator accepts survey
→ Collaborator submits proof/result
→ Customer reviews submission
→ Collaborator receives reward

Do not build advanced features before this flow works end-to-end.

---

# Phase 0: Project Setup and Stability

## Goal

Make sure every developer can run the backend locally.

## Backend Tasks

- Verify `.NET SDK` is installed.
- Verify PostgreSQL connection works.
- Create `appsettings.example.json`.
- Keep `appsettings.Development.json` local only.
- Ensure database migrations can run.
- Ensure Swagger starts successfully.
- Seed required roles:
  - Admin
  - Customer
  - Collaborator

- Seed or document how to create an Admin account.

## Commands

```bash
dotnet restore
dotnet build
dotnet ef database update
dotnet run
```

## Done When

- Project builds successfully.
- Database migration runs successfully.
- Swagger is accessible.
- App can connect to PostgreSQL.
- Roles are seeded correctly.

---

# Phase 1: Auth and User/Profile

## Goal

Users can register, login, and access APIs based on role.

## Backend Modules

- Auth
- Users/Profile

## Backend Tasks

### Auth

- Register user.
- Login user.
- Generate JWT token.
- Get current authenticated user.
- Add authentication middleware.
- Add role-based authorization.

### User/Profile

- Get current user profile.
- Update profile.
- Store basic user information.
- Support account status:
  - Active
  - Locked

## Suggested APIs

```http
POST /auth/register
POST /auth/login
GET /auth/me

GET /users/me
PUT /users/me/profile
```

## Done When

- Customer can register and login.
- Collaborator can register and login.
- Admin can login.
- JWT authentication works.
- Role-based access works.
- Users cannot access APIs from another role.

---

# Phase 2: Campaign and Admin Moderation

## Goal

Customer can create a Google Form campaign, and Admin can approve or reject it.

## Backend Modules

- Campaigns
- Admin/Moderation

## Backend Tasks

### Campaign

- Create campaign.
- Save campaign as draft.
- Submit campaign for review.
- Generate confirmation code.
- Store Google Form URL.
- Store campaign targeting fields.
- Manage campaign statuses:
  - Draft
  - PendingReview
  - Active
  - Rejected
  - Paused
  - Completed
  - Cancelled
  - Expired

### Admin/Moderation

- List pending campaigns.
- View campaign detail.
- Approve campaign.
- Reject campaign with reason.
- Keep basic audit log if possible.

## Suggested APIs

```http
POST /campaigns
GET /campaigns
GET /campaigns/{id}
PUT /campaigns/{id}
POST /campaigns/{id}/submit-review

GET /admin/campaigns/pending
POST /admin/campaigns/{id}/approve
POST /admin/campaigns/{id}/reject
```

## Done When

- Customer can create a Google Form campaign.
- Campaign can move from Draft to PendingReview.
- Admin can approve a campaign.
- Approved campaign becomes Active.
- Admin can reject a campaign with reason.
- Rejected campaign does not appear to Collaborators.

---

# Phase 3: Participation and Submission

## Goal

Collaborator can accept an active campaign and submit proof/result.

## Backend Modules

- Participation
- Submission

## Backend Tasks

### Participation

- List active campaigns for Collaborators.
- Check campaign deadline.
- Check remaining slots.
- Check basic targeting rules.
- Prevent duplicate acceptance.
- Create participation record.
- List current user's participations.

### Submission

- Submit confirmation code.
- Upload or store proof image URL if supported.
- Validate confirmation code.
- Prevent duplicate submission.
- Customer can list submissions by campaign.
- Customer can approve submission.
- Customer can reject submission with reason.
- Update campaign progress after approval.

## Suggested APIs

```http
GET /surveys/available
POST /campaigns/{id}/accept
GET /me/participations

POST /participations/{id}/submissions
GET /campaigns/{id}/submissions
GET /submissions/{id}
POST /submissions/{id}/approve
POST /submissions/{id}/reject
```

## Done When

- Collaborator can see only Active campaigns.
- Collaborator can accept a campaign.
- Collaborator cannot accept the same campaign twice.
- Collaborator can submit confirmation code/proof.
- Submission status becomes Pending.
- Customer can approve or reject submission.
- Rejected submission stores rejection reason.

---

# Phase 4: Wallet and Reward

## Goal

Collaborator receives reward when submission is approved.

## Backend Modules

- Wallet
- Transaction

## Backend Tasks

- Create wallet automatically when user registers.
- Get wallet balance.
- Get transaction history.
- Add Admin manual top-up for testing.
- Add reward transaction when submission is approved.
- Prevent double reward for the same submission.
- Store transaction types:
  - AdminTopUp
  - CampaignEscrow
  - RewardPaid
  - Refund
  - Withdrawal
  - WithdrawalRejected

## Suggested APIs

```http
GET /wallet
GET /wallet/transactions

POST /admin/wallets/{userId}/topup
```

## Done When

- User wallet exists.
- Wallet balance can be viewed.
- Transaction history can be viewed.
- When Customer approves a submission, Collaborator receives reward.
- The same submission cannot reward twice.

---

# Phase 5: Withdrawal Basic

## Goal

Collaborator can request withdrawal, and Admin can approve or reject manually.

## Backend Modules

- Withdrawal
- Wallet/Transaction

## Backend Tasks

- Collaborator creates withdrawal request.
- Validate available balance.
- Validate minimum withdrawal amount if configured.
- List current user's withdrawal requests.
- Admin lists all pending withdrawals.
- Admin approves withdrawal.
- Admin rejects withdrawal with reason.
- Create transaction log after approval or rejection.

## Suggested APIs

```http
POST /withdrawals
GET /withdrawals/me

GET /admin/withdrawals
POST /admin/withdrawals/{id}/approve
POST /admin/withdrawals/{id}/reject
```

## Done When

- Collaborator can request withdrawal.
- Admin can approve withdrawal.
- Admin can reject withdrawal with reason.
- Wallet and transaction history update correctly.

---

# Phase 6: Internal Form Builder Basic

## Goal

Customer can create survey questions directly on the website.

## Important Note

Do this phase only after the Google Form flow works end-to-end.

## Backend Modules

- Forms
- Campaigns
- Submissions

## Backend Tasks

- Add campaign type:
  - GoogleForm
  - InternalForm

- Create survey questions.
- Update survey questions.
- Delete survey questions.
- Create question options.
- Reorder questions if needed.
- Get campaign form.
- Collaborator submits internal form answers.
- Customer views internal form responses.

## Supported Question Types for MVP

- ShortText
- Paragraph
- SingleChoice
- MultipleChoice
- Rating
- YesNo

## Suggested APIs

```http
POST /campaigns/{campaignId}/questions
PUT /questions/{id}
DELETE /questions/{id}

POST /questions/{id}/options
GET /campaigns/{campaignId}/form
POST /campaigns/{campaignId}/answers
```

## Done When

- Customer can create basic internal form questions.
- Collaborator can answer internal form campaign.
- Answers are saved into the database.
- Customer can view submitted answers.

---

# Phase 7: Polish, Validation, and Demo Readiness

## Goal

Make the MVP stable enough for demo.

## Backend Tasks

- Add validation for all important request DTOs.
- Standardize error response format.
- Add pagination for list APIs if needed.
- Add search/filter for campaigns and submissions if needed.
- Add basic dashboard counts.
- Review role-based authorization.
- Review status transition rules.
- Remove unused code.
- Ensure no secrets are committed.
- Ensure migrations are clean.

## Suggested Checks

```bash
dotnet build
dotnet ef database update
dotnet run
```

## Done When

- Core flow works from start to finish.
- Swagger APIs are testable.
- No critical runtime errors.
- Database can be recreated from migrations.
- Demo data can be seeded or created manually.

---

# Recommended Build Order

Use this exact order when asking Codex to implement features:

1. Complete Auth and User/Profile.
2. Add Campaign entity and APIs.
3. Add Customer Google Form campaign creation.
4. Add Admin campaign approval/rejection.
5. Add Collaborator available campaign list.
6. Add campaign acceptance.
7. Add proof/confirmation code submission.
8. Add Customer submission review.
9. Add Wallet and reward logic.
10. Add Withdrawal basic.
11. Add Internal Form Builder basic.
12. Polish and stabilize.

---

# Do Not Build First

Do not implement these before the MVP core flow works:

- Real payment gateway
- Chat realtime
- Advanced analytics
- Complex notification center
- Advanced anti-fraud
- Complex form branching logic
- Rating/reputation system
- Mobile app
- Real microservices

---

# Rule for Codex

When implementing a phase:

- Do not modify unrelated modules.
- Keep changes small and focused.
- Add migration if entities change.
- Run `dotnet build` after coding.
- Mention changed files.
- Mention new migration name if created.
- Mention APIs added or changed.
- Ask before changing business rules.
