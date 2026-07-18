# SureVey Testing Guide

Use the ApiGateway Swagger UI unless debugging an individual service:

```text
https://<api-gateway-domain>/swagger
```

For local testing:

```text
http://localhost:5088/swagger
```

Select the service document from the Swagger dropdown:

- `UserService API`
- `SurveyService API`
- `WalletService API`

Use the Authorize button with:

```text
Bearer <jwt-token>
```

## Setup Checks

1. Confirm all health endpoints return `200 OK`.
2. Confirm Gateway Swagger loads all 3 documents.
3. Confirm the same `Jwt` and `InternalService:ApiKey` values are configured across services.
4. Confirm migrations have been applied.

## Account Flow

1. Register or login a Customer in `UserService`.
2. Register or login a Collaborator in `UserService`.
3. Login Admin in `UserService`.
4. Save the JWT token for each role.

## Campaign Payment Flow

Use the Customer token unless a step says Admin.

1. Customer creates a campaign in `SurveyService`.
2. Customer creates campaign payment in `WalletService`.
3. Customer uploads `proofImageUrl` in `WalletService`.
4. Admin approves payment in `WalletService`.
5. Customer submits campaign for review in `SurveyService`.
6. Admin approves campaign in `SurveyService`.

Expected results:

- Campaign starts as draft or pending payment according to existing business rules.
- Payment proof changes the payment to verification state.
- Admin payment approval marks the campaign as paid and escrowed.
- Admin campaign approval makes the campaign available for collaborators.

## Participation Flow

Use the Collaborator token unless a step says Customer.

1. Collaborator views available surveys in `SurveyService`.
2. Collaborator accepts a campaign.
3. Collaborator submits proof or confirmation code.
4. Customer approves the submission.
5. Collaborator checks wallet in `WalletService`.

Expected results:

- Collaborator can only submit for accepted campaigns.
- Approved submission rewards the collaborator wallet once.
- Re-approving the same submission must not duplicate rewards.

## Withdrawal Flow

Use the Collaborator token unless a step says Admin.

1. Collaborator requests withdrawal in `WalletService`.
2. Admin approves withdrawal.
3. Admin marks withdrawal paid.

Optional rejection check:

1. Collaborator requests another withdrawal.
2. Admin rejects withdrawal.

Expected results:

- Withdrawal request moves balance from available to pending.
- Approve keeps amount pending.
- Mark paid removes amount from pending.
- Reject returns amount to available.
- Repeat approve/reject/mark-paid calls should not duplicate balance changes.

## Authorization Checklist

- Customer cannot create payment for another customer's campaign.
- Customer cannot submit proof for another customer's payment.
- Collaborator cannot access admin payment, campaign, or withdrawal routes.
- Customer cannot access admin payment or withdrawal routes.
- Admin can approve and reject payments.
- Admin can approve, reject, and mark withdrawals paid.
- Internal routes require `X-Internal-Service-Key`.

## Debug Swagger URLs

- UserService: `https://<user-service-domain>/swagger`
- SurveyService: `https://<survey-service-domain>/swagger`
- WalletService: `https://<wallet-service-domain>/swagger`

Gateway Swagger JSON:

- `/user/swagger/v1/swagger.json`
- `/survey/swagger/v1/swagger.json`
- `/wallet/swagger/v1/swagger.json`
