# AGENTS.md

## Project Overview

This repository is for the SureSurvey MVP backend, built with ASP.NET Core/.NET and PostgreSQL.

The project should be developed as a modular monolith, not as real microservices. Keep one backend application, but organize code by modules/services.

Core MVP flow:

Customer creates campaign
→ Admin approves campaign
→ Collaborator sees active campaign
→ Collaborator accepts survey
→ Collaborator submits proof/result
→ Customer approves/rejects submission
→ Collaborator receives reward in wallet

## Tech Stack

- Backend: ASP.NET Core / .NET
- Database: PostgreSQL
- ORM: Entity Framework Core
- Auth: JWT-based authentication
- API docs/testing: Swagger
- Architecture: Modular monolith

## Local Development Commands

Run these commands from the backend project folder:

```bash
dotnet restore
dotnet build
dotnet ef database update
dotnet run
```

Use PostgreSQL connection settings from `appsettings.Development.json`.

Do not commit real secrets, passwords, JWT keys, Google OAuth secrets, or production connection strings.

## Module Priorities

Build the MVP in this order:

1. Auth and User/Profile
2. Campaign
3. Admin/Moderation
4. Participation
5. Submission
6. Wallet/Transaction
7. Withdrawal basic
8. Internal Form Builder
9. Notification basic

Do not start advanced features before the core MVP flow works.

## Coding Rules

- Keep controllers thin.
- Put business logic in services.
- Use DTOs for request and response models.
- Do not expose entity models directly if DTOs are available.
- Use enums for fixed statuses and roles.
- Keep naming consistent: Customer, Collaborator, Admin.
- Prefer clear, simple code over over-engineered patterns.
- Do not convert this project into real microservices.
- Do not add new external packages unless necessary.

## Database Rules

- Use Entity Framework Core migrations for schema changes.
- After changing entities, create a migration.
- Do not manually edit generated migration files unless needed.
- Use PostgreSQL-compatible types and conventions.
- Seed required roles: Admin, Customer, Collaborator.

## Status Values

Campaign statuses:

- Draft
- PendingReview
- Active
- Rejected
- Paused
- Completed
- Cancelled
- Expired

Submission statuses:

- Pending
- Approved
- Rejected
- ResubmissionRequired

Participation statuses:

- Accepted
- InProgress
- Submitted
- Approved
- Rejected
- Cancelled

Withdrawal statuses:

- Pending
- Approved
- Rejected
- Paid

## MVP Scope

Must have:

- Register/login
- Role-based authorization
- Customer creates Google Form campaign
- Admin approves/rejects campaign
- Collaborator views active campaigns
- Collaborator accepts campaign
- Collaborator submits confirmation code/proof
- Customer approves/rejects submission
- Wallet balance updates after approved submission

Do not build first:

- Real payment gateway
- Chat realtime
- Advanced analytics
- Advanced anti-fraud
- Complex internal form logic
- Mobile app
- Rating/reputation system

## Before Finishing a Task

Always run:

```bash
dotnet build
```

If the task changes database entities, also run:

```bash
dotnet ef database update
```

When possible, verify the changed API in Swagger.

## Response Style for Codex

When making changes:

- Briefly explain what files were changed.
- Mention any migration created.
- Mention any command that should be run.
- Do not make unrelated refactors.
- If unsure about a business rule, ask before implementing.
