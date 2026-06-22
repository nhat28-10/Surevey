# SureSurvey Backend Testing Guide

## 1. Services

UserService:

- URL: http://localhost:xxxx/swagger

SurveyService:

- URL: http://localhost:xxxx/swagger

WalletService:

- URL: http://localhost:xxxx/swagger

## 2. Test Accounts

Admin:

- Email: admin@suresurvey.local
- Password: Admin@123

Customer:

- Email: customer@suresurvey.local
- Password: Customer@123

Collaborator:

- Email: collaborator@suresurvey.local
- Password: Collaborator@123

## 3. Main Test Flow

1. Login as Customer.
2. Create campaign.
3. Create campaign payment.
4. Submit payment proof.
5. Login as Admin.
6. Approve payment.
7. Login as Customer.
8. Submit campaign for review.
9. Login as Admin.
10. Approve campaign.
11. Login as Collaborator.
12. Accept campaign.
13. Submit proof.
14. Login as Customer.
15. Approve submission.
16. Login as Collaborator.
17. Check wallet balance.
18. Create withdrawal request.
19. Login as Admin.
20. Approve and mark-paid withdrawal.

## 4. Expected Result

- Campaign only becomes reviewable/active after payment is verified.
- Platform fee is 20%.
- Reward is only paid once per approved submission.
- Withdrawal does not duplicate balance when APIs are called multiple times.
