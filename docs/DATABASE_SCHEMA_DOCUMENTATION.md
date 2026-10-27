# ONO Database Schema Documentation

The Prisma schema in `prisma/schema.prisma` is authoritative. This document
groups the current schema by domain; it is an orientation guide, not a
replacement for field definitions, relation options, indexes, or constraints in
the schema.

## Database technology and client

- Database provider: PostgreSQL.
- ORM: Prisma 6.
- Schema: `prisma/schema.prisma`.
- Client singleton: `src/lib/database/prisma.ts`.
- Migration history: `prisma/migrations/`.

The environment variable `DATABASE_URL` supplies the database connection.
Migration files being present does not establish that they have been applied to
your local or production database. Verify the target database and migration
status before making schema changes.

## Domain groups

| Domain | Representative models |
| --- | --- |
| Tenant and organization | `Tenant`, `Branch`, `Department`, `OrganizationSetting`, `Membership`, `Invitation` |
| Identity and audit | `User`, `Session`, `SessionsTenantJoin`, `AuditLog`, `IdempotencyRecord` |
| Industry configuration | `IndustryCatalogue`, `CustomIndustry` |
| CRM | `LeadSource`, `Lead`, `Company`, `Contact`, `Activity`, `FollowUp` |
| Sales | `Pipeline`, `Opportunity`, `Proposal`, `Quotation`, `SalesOrder`, `Campaign`, `DocumentCounter` |
| Inventory and procurement | `Product`, `Warehouse`, `StockItem`, `StockMovement`, `Supplier`, `PurchaseOrder` |
| Finance | `Invoice`, `Payment`, `Expense` |
| Project and workforce | `Project`, `Task`, `Milestone`, `Employee`, `AttendanceRecord`, `LeaveRequest` |
| Workflow and service | `Approval`, `ApprovalStep`, `WorkflowRule`, `WorkflowRun`, `Handover`, `SupportTicket` |
| Analytics and integrations | `Kpi`, `AiInsight`, `IntegrationConfig` |
| Subscription and billing | `Subscription`, `PlanDefinition`, `BillingInvoice`, `PaymentAttempt`, `PaymentEventLog`, `UsageRecord` |
| Platform marketing | `Testimonial` |
| Data governance | `DataCategory`, `ProcessingPurpose`, `ProcessingActivity`, `ConsentRecord`, `RetentionPolicy`, `LegalHold`, `DeletionRequest`, `DeletionStep`, `ExportJob`, `AiDataUseApproval`, `MarketplaceProduct`, `MarketplaceApprovalDecision`, `DataSharingArrangement`, `DataIncident` |

The schema also defines enums for lifecycle states, roles, permissions-related
domain distinctions, billing, workflows, and governance. Read enum definitions
in the Prisma schema before adding or changing status values.

## Tenancy and relationships

Most business records are associated with a tenant and use `tenantId` for
scoping. The schema also includes platform-wide or identity-level records, such
as users and public testimonials, which do not follow the same ownership
pattern. Confirm each model's relations before assuming it is tenant-owned.

Tenant isolation is an application responsibility as well as a schema concern:
API handlers/services must scope queries using the trusted, server-derived
tenant context. A foreign key does not replace authorization checks.

## Migrations and schema changes

The repository includes versioned migration directories covering initial
multi-tenant structure and later workflow, subscription/billing, governance,
idempotency, and testimonial changes. Use migration files and the Prisma schema
to understand the exact SQL history.

For a schema change:

1. Review the current model, its relations, indexes, and affected services.
2. Update `prisma/schema.prisma`.
3. Generate and review a migration against a configured development database.
4. Test data access and tenant isolation.
5. Apply migrations only to the intended environment using the approved
   deployment procedure.

`npm run db:push` synchronizes a schema directly and does not create migration
history; avoid using it as a substitute for reviewed migrations in shared
environments.

## Useful commands

```powershell
npm run db:generate
npm run db:migrate
npm run db:studio
```

These commands depend on a valid local `DATABASE_URL` where required. Do not
include connection strings or real data in committed documentation.
