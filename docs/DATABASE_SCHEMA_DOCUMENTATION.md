# ONO Database Schema Documentation

`prisma/schema.prisma` and checked-in migrations are authoritative. This guide
is an index and domain explanation; use the schema for exact field attributes,
defaults, relation cardinality, indexes, unique constraints and delete actions.

## 1. Database setup

- Provider: PostgreSQL.
- ORM/client: Prisma 6.19.3.
- Connection variable: `DATABASE_URL`.
- Migration history:
  1. `20261027152254_init_core_schema`
  2. `20261027155425_part2_testimonials_inventory`
  3. `20261027181000_crm_intelligence`
- Generate client with `npm run db:generate`; apply local migrations with
  `npm run db:migrate`.
- Avoid `db:push` for shared or production databases. Back up and review a
  migration before deployment.

The current schema contains **44 models** and **17 enums**.

## 2. Domain model map

| Domain | Models | Purpose |
| --- | --- | --- |
| Tenant and access | `Tenant`, `User`, `Session`, `Membership`, `Invitation`, `Role`, `Permission`, `RolePermission`, `RoleAssignment`, `Branch` | Organisations, identities, sessions, memberships, invitations, access assignments and branches. |
| Industry configuration | `Industry`, `TenantIndustry`, `CustomIndustry` | Catalogue, tenant selection and private custom-industry requests. |
| CRM | `Lead`, `Contact`, `Company`, `Opportunity`, `CrmActivity`, `OpportunityStageEvent` | Customer/prospect records, interactions and stage history. |
| Sales | `Product`, `Quotation`, `QuotationLine`, `SalesOrder`, `SalesOrderLine` | Products and commercial documents/lines. |
| Finance | `Invoice`, `InvoiceLine`, `Payment`, `Expense` | Receivables, payment records and expenses; not a full ledger. |
| Procurement | `Supplier`, `PurchaseOrder`, `PurchaseOrderLine` | Suppliers and purchase orders. |
| Inventory | `Warehouse`, `StockMovement` | Warehouse locations and stock ledger movements. |
| Projects and support | `Project`, `Milestone`, `Task`, `SupportCase` | Work, milestones, tasks and support cases. |
| Files and governance | `Document`, `AuditLog`, `PlatformSetting` | File metadata, audit records and platform settings. `Document` is not a storage service. |
| Testimonials | `Testimonial` | Consent, moderation and publication lifecycle. |
| CRM automation | `Notification`, `AutomationWorkflow`, `AutomationRun` | In-app notifications and bounded CRM automation definitions/executions. |

## 3. Model inventory and scalar fields

The following inventory lists every scalar field and Prisma type. `?` denotes
nullable/optional fields; relation fields and model attributes are described
from the schema directly and are not repeated in this compact inventory.

| Model | Scalar fields and Prisma types |
| --- | --- |
| `Tenant` | `id String`, `name String`, `slug String`, `status TenantStatus`, `industry String?`, `settings Json?`, `createdAt DateTime`, `updatedAt DateTime` |
| `User` | `id String`, `email String`, `name String?`, `passwordHash String?`, `role UserRole`, `tenantId String?`, `lastLoginAt DateTime?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Session` | `id String`, `userId String`, `tokenHash String`, `expiresAt DateTime`, `userAgent String?`, `ipAddress String?`, `createdAt DateTime`, `revokedAt DateTime?` |
| `Membership` | `id String`, `tenantId String`, `userId String`, `status MembershipStatus`, `joinedAt DateTime`, `expiresAt DateTime?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Invitation` | `id String`, `tenantId String`, `email String`, `roleId String?`, `tokenHash String`, `status InvitationStatus`, `expiresAt DateTime`, `invitedBy String?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Role` | `id String`, `tenantId String`, `name String`, `description String?`, `isSystem Boolean`, `createdAt DateTime`, `updatedAt DateTime` |
| `Permission` | `id String`, `tenantId String?`, `code String`, `resource String`, `action String`, `description String?`, `createdAt DateTime` |
| `RolePermission` | `id String`, `tenantId String`, `roleId String`, `permissionId String`, `createdAt DateTime` |
| `RoleAssignment` | `id String`, `membershipId String`, `roleId String`, `createdAt DateTime` |
| `Branch` | `id String`, `tenantId String`, `name String`, `code String?`, `address Json?`, `isActive Boolean`, `createdAt DateTime`, `updatedAt DateTime` |
| `Industry` | `id String`, `slug String`, `name String`, `parentId String?`, `description String?`, `status IndustryStatus`, `source IndustrySource`, `version Int`, `createdAt DateTime`, `updatedAt DateTime` |
| `TenantIndustry` | `id String`, `tenantId String`, `industryId String`, `isPrimary Boolean`, `createdAt DateTime` |
| `CustomIndustry` | `id String`, `tenantId String`, `name String`, `description String?`, `status String`, `reviewedBy String?`, `reviewedAt DateTime?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Lead` | `id String`, `tenantId String`, `firstName String`, `lastName String`, `email String?`, `phone String?`, `companyName String?`, `jobTitle String?`, `industry String?`, `source String?`, `status LeadStatus`, `ownerId String?`, `estimatedValue Decimal?`, `currency String`, `expectedConversionDate DateTime?`, `lastContactedAt DateTime?`, `qualifiedAt DateTime?`, `convertedAt DateTime?`, `convertedContactId String?`, `convertedCompanyId String?`, `convertedOpportunityId String?`, `lostReason String?`, `notes String?`, `score Int?`, `scoreMethod String?`, `scoreFactors Json?`, `scoreSampleSize Int`, `scoreUpdatedAt DateTime?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Contact` | `id String`, `tenantId String`, `firstName String`, `lastName String`, `email String?`, `phone String?`, `title String?`, `status String`, `ownerId String?`, `companyId String?`, `notes String?`, `lastContactedAt DateTime?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Company` | `id String`, `tenantId String`, `name String`, `website String?`, `phone String?`, `email String?`, `industry String?`, `size String?`, `status String`, `ownerId String?`, `notes String?`, `lastInteractionAt DateTime?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Opportunity` | `id String`, `tenantId String`, `name String`, `companyId String?`, `stage OpportunityStage`, `amount Decimal?`, `currency String`, `probability Int`, `winProbability Int?`, `probabilityMethod String?`, `probabilityFactors Json?`, `probabilityUpdatedAt DateTime?`, `expectedCloseDate DateTime?`, `ownerId String?`, `description String?`, `nextStep String?`, `lostReason String?`, `wonReason String?`, `stageChangedAt DateTime`, `lastActivityAt DateTime?`, `closedAt DateTime?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Product` | `id String`, `tenantId String`, `name String`, `sku String?`, `description String?`, `type String`, `price Decimal?`, `currency String`, `isActive Boolean`, `createdAt DateTime`, `updatedAt DateTime` |
| `Quotation` | `id String`, `tenantId String`, `opportunityId String?`, `quoteNumber String`, `status String`, `validUntil DateTime?`, `subtotal Decimal`, `tax Decimal`, `total Decimal`, `currency String`, `notes String?`, `createdAt DateTime`, `updatedAt DateTime` |
| `QuotationLine` | `id String`, `quotationId String`, `productId String?`, `description String`, `quantity Decimal`, `unitPrice Decimal`, `total Decimal`, `createdAt DateTime` |
| `SalesOrder` | `id String`, `tenantId String`, `quotationId String?`, `orderNumber String`, `status String`, `orderDate DateTime`, `subtotal Decimal`, `tax Decimal`, `total Decimal`, `currency String`, `createdAt DateTime`, `updatedAt DateTime` |
| `SalesOrderLine` | `id String`, `salesOrderId String`, `productId String?`, `description String`, `quantity Decimal`, `unitPrice Decimal`, `total Decimal`, `createdAt DateTime` |
| `Task` | `id String`, `tenantId String`, `title String`, `description String?`, `status TaskStatus`, `priority String`, `assigneeId String?`, `dueDate DateTime?`, `completedAt DateTime?`, `outcome String?`, `relatedType String?`, `relatedId String?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Invoice` | `id String`, `tenantId String`, `salesOrderId String?`, `invoiceNumber String`, `status InvoiceStatus`, `issueDate DateTime`, `dueDate DateTime?`, `subtotal Decimal`, `tax Decimal`, `total Decimal`, `amountPaid Decimal`, `balance Decimal`, `currency String`, `notes String?`, `createdAt DateTime`, `updatedAt DateTime` |
| `InvoiceLine` | `id String`, `invoiceId String`, `description String`, `quantity Decimal`, `unitPrice Decimal`, `total Decimal`, `createdAt DateTime` |
| `Payment` | `id String`, `tenantId String`, `invoiceId String`, `amount Decimal`, `currency String`, `paymentMethod String?`, `reference String?`, `paidAt DateTime`, `notes String?`, `createdAt DateTime` |
| `Expense` | `id String`, `tenantId String`, `description String`, `amount Decimal`, `currency String`, `category String?`, `vendor String?`, `expenseDate DateTime`, `status String`, `receiptUrl String?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Supplier` | `id String`, `tenantId String`, `name String`, `email String?`, `phone String?`, `address Json?`, `isActive Boolean`, `createdAt DateTime`, `updatedAt DateTime` |
| `PurchaseOrder` | `id String`, `tenantId String`, `supplierId String`, `poNumber String`, `status String`, `orderDate DateTime`, `expectedDate DateTime?`, `subtotal Decimal`, `tax Decimal`, `total Decimal`, `currency String`, `notes String?`, `createdAt DateTime`, `updatedAt DateTime` |
| `PurchaseOrderLine` | `id String`, `purchaseOrderId String`, `productId String?`, `description String`, `quantity Decimal`, `unitPrice Decimal`, `total Decimal`, `createdAt DateTime` |
| `Project` | `id String`, `tenantId String`, `name String`, `description String?`, `status String`, `startDate DateTime?`, `endDate DateTime?`, `budget Decimal?`, `currency String`, `createdAt DateTime`, `updatedAt DateTime` |
| `Milestone` | `id String`, `projectId String`, `name String`, `description String?`, `dueDate DateTime?`, `status String`, `completedAt DateTime?`, `createdAt DateTime`, `updatedAt DateTime` |
| `SupportCase` | `id String`, `tenantId String`, `subject String`, `description String?`, `status String`, `priority String`, `assignedTo String?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Document` | `id String`, `tenantId String`, `name String`, `fileName String`, `mimeType String?`, `size Int?`, `storageKey String`, `uploadedBy String?`, `relatedType String?`, `relatedId String?`, `createdAt DateTime` |
| `AuditLog` | `id String`, `tenantId String?`, `userId String?`, `action AuditAction`, `resource String`, `resourceId String?`, `ipAddress String?`, `userAgent String?`, `metadata Json?`, `createdAt DateTime` |
| `Testimonial` | `id String`, `tenantId String?`, `submittedById String?`, `authorName String`, `authorTitle String?`, `company String?`, `quote String`, `rating Int`, `status TestimonialStatus`, `consentToPublish Boolean`, `consentName Boolean`, `consentTitle Boolean`, `consentCompany Boolean`, `rejectionReason String?`, `moderationNotes String?`, `isFeatured Boolean`, `displayOrder Int`, `publishedAt DateTime?`, `archivedAt DateTime?`, `reviewedById String?`, `reviewedAt DateTime?`, `createdAt DateTime`, `updatedAt DateTime` |
| `Warehouse` | `id String`, `tenantId String`, `name String`, `code String?`, `address Json?`, `isActive Boolean`, `createdAt DateTime`, `updatedAt DateTime` |
| `StockMovement` | `id String`, `tenantId String`, `productId String?`, `warehouseId String`, `type StockMovementType`, `quantity Decimal`, `unitCost Decimal?`, `reason String`, `reference String?`, `createdById String?`, `createdAt DateTime` |
| `PlatformSetting` | `key String`, `value Json`, `description String?`, `updatedById String?`, `createdAt DateTime`, `updatedAt DateTime` |
| `CrmActivity` | `id String`, `tenantId String`, `type CrmActivityType`, `subject String`, `body String?`, `source String`, `occurredAt DateTime`, `userId String?`, `leadId String?`, `contactId String?`, `companyId String?`, `opportunityId String?`, `taskId String?`, `metadata Json?`, `createdAt DateTime` |
| `OpportunityStageEvent` | `id String`, `tenantId String`, `opportunityId String`, `fromStage OpportunityStage?`, `toStage OpportunityStage`, `amount Decimal?`, `probability Int?`, `actorId String?`, `source String`, `createdAt DateTime` |
| `Notification` | `id String`, `tenantId String`, `userId String`, `type NotificationType`, `title String`, `body String?`, `href String?`, `readAt DateTime?`, `createdAt DateTime` |
| `AutomationWorkflow` | `id String`, `tenantId String`, `name String`, `description String?`, `trigger AutomationTriggerType`, `conditions Json`, `actions Json`, `isActive Boolean`, `createdById String?`, `updatedById String?`, `lastRunAt DateTime?`, `createdAt DateTime`, `updatedAt DateTime` |
| `AutomationRun` | `id String`, `tenantId String`, `workflowId String`, `actorId String?`, `status AutomationRunStatus`, `trigger AutomationTriggerType`, `idempotencyKey String`, `attempts Int`, `summary Json?`, `error String?`, `startedAt DateTime`, `finishedAt DateTime?` |

## 4. Enum inventory

| Enum | Values |
| --- | --- |
| `UserRole` | `PLATFORM_ADMIN`, `TENANT_ADMIN`, `MEMBER` |
| `TenantStatus` | `PROVISIONING`, `ACTIVE`, `SUSPENDED`, `CLOSING`, `CLOSED` |
| `MembershipStatus` | `INVITED`, `ACTIVE`, `SUSPENDED`, `REMOVED`, `EXPIRED` |
| `InvitationStatus` | `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED` |
| `IndustryStatus` | `PUBLISHED`, `PROVISIONAL`, `DEPRECATED` |
| `IndustrySource` | `CURATED`, `CUSTOM_PROMOTED` |
| `AuditAction` | `CREATE`, `READ`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `INVITE`, `ASSIGN_ROLE`, `REVOKE_ACCESS`, `APPROVE`, `REJECT`, `EXPORT`, `SUSPEND`, `ACTIVATE` |
| `TestimonialStatus` | `PENDING`, `CHANGES_REQUESTED`, `APPROVED`, `REJECTED`, `ARCHIVED` |
| `StockMovementType` | `IN`, `OUT`, `ADJUSTMENT` |
| `LeadStatus` | `NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`, `CONVERTED`, `LOST` |
| `OpportunityStage` | `PROSPECTING`, `QUALIFICATION`, `PROPOSAL`, `NEGOTIATION`, `CLOSED_WON`, `CLOSED_LOST` |
| `TaskStatus` | `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`, `CANCELLED` |
| `CrmActivityType` | `NOTE`, `CALL`, `MEETING`, `EMAIL`, `TASK`, `STATUS_CHANGE`, `STAGE_CHANGE`, `CONVERSION`, `SYSTEM` |
| `AutomationTriggerType` | `LEAD_CREATED`, `LEAD_STATUS_CHANGED`, `LEAD_ASSIGNED`, `LEAD_INACTIVE`, `OPPORTUNITY_CREATED`, `OPPORTUNITY_STAGE_CHANGED`, `OPPORTUNITY_WON`, `OPPORTUNITY_STALLED`, `TASK_OVERDUE` |
| `AutomationRunStatus` | `SUCCEEDED`, `FAILED`, `SKIPPED` |
| `NotificationType` | `INFO`, `TASK`, `LEAD`, `OPPORTUNITY`, `AUTOMATION` |
| `InvoiceStatus` | `DRAFT`, `SENT`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `VOID`, `WRITTEN_OFF` |

## 5. Relationships and integrity

The schema models tenant ownership across business records; user-to-tenant
access is represented by memberships and role assignments rather than trusting
the top-level user role for tenant permission. Important relation groups:

- Tenant to users, memberships, roles, permissions, branches and domain records.
- Membership to user, tenant and one or more role assignments.
- Role to permission assignments through `RolePermission`.
- Lead conversion references to created contacts, companies and opportunities.
- Company/opportunity and product/document-line relations.
- Quotation to quotation lines and optional opportunity; sales order to order
  lines and optional quotation; invoice to invoice lines and payments.
- Supplier to purchase orders; project to milestones; warehouse/product to stock
  movements.
- CRM activity and stage events to tenant and their related records.
- Automation workflow to its run history; notifications to tenant/user.

Read `@relation`, `onDelete`, `@@unique`, `@@index`, `@unique` and defaults in
the schema before changing data lifecycle or assuming cascade behaviour.

## 6. Data integrity and sensitive behaviour

- Tenant scoping is enforced in application services and route context. Do not
  query tenant rows using a client-provided tenant ID.
- Sessions persist a token hash, not the browser token.
- `Decimal` represents currency and quantities. Preserve precision through
  calculations and serialization.
- Invoice balances, payment limits and document line totals have server-side
  rules; confirm service logic before changing their fields.
- Stock movements and payment records are operational history; use reversal or
  compensating workflows rather than deleting history.
- Testimonial public projection is consent-sensitive; do not make internal
  moderation fields public.
- JSON fields (`settings`, `metadata`, workflow conditions/actions, scoring
  factors) need schema validation at their write boundary.
- `Document.storageKey` is metadata; no current storage implementation makes
  that key downloadable.

## 7. Migrations and schema change process

1. Update `schema.prisma` and generate a migration with Prisma.
2. Inspect migration SQL for destructive changes, locks, data conversion and
   nullability.
3. Update affected services, validators, seed data, tests and documentation.
4. Test migration and rollback/recovery assumptions on disposable data.
5. Back up before production changes; apply via a controlled release.

Never edit a deployed migration to change its meaning. A changed schema alone
does not mean its application workflow is implemented.
