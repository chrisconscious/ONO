# ONO — Database and Data Domain Plan

| Field | Value |
| --- | --- |
| Document | Database and Data Domain Plan |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — **no migrations are created or applied in this stage** |
| Requirements | `REQ-DATA-001` … `REQ-DATA-005`, `REQ-SEC-001` |

---

## 1. Data principles

| ID | Principle | Consequence |
| --- | --- | --- |
| DB-1 | Schema-first | The data model is reviewed before code depends on it |
| DB-2 | Tenant column on every tenant-owned table | No exceptions, including join tables with tenant-owned meaning |
| DB-3 | Immutable financial and audit history | Correction by reversal or new event, never destructive update |
| DB-4 | Explicit state machines | Status values are constrained, not free text |
| DB-5 | Money is exact | `decimal(19,4)` or integer minor units; never floating point |
| DB-6 | Time is UTC | Display timezone comes from tenant/branch configuration |
| DB-7 | Currency is explicit | A currency code accompanies every monetary amount |
| DB-8 | Soft delete only where justified | Financial and audit records are never hard-deleted |
| DB-9 | Bounded customisation | Custom fields are validated JSON, not arbitrary schema changes |
| DB-10 | Reviewed migrations | No drift, no unreviewed production DDL |

---

## 2. Current schema state (verified 2026-10-26)

`prisma/schema.prisma` contains only:

| Model | Purpose | Notes |
| --- | --- | --- |
| `Tenant` | Customer organisation | `id`, `name`, `slug` (unique), timestamps, mapped to `tenants` |
| `User` | Person | `id`, `email` (unique), `name`, `passwordHash`, `role`, nullable `tenantId`, timestamps, mapped to `users` |
| `UserRole` | Enum | `PLATFORM_ADMIN`, `TENANT_ADMIN`, `MEMBER` |

**Status:** illustrative only. No migration exists, no database is connected, no
data exists. This model is expected to be substantially revised in PH-08 and is
**not** a committed design.

Known issues to resolve in PH-08:

| Issue | Why it matters |
| --- | --- |
| `User.tenantId` on the user row | Users may belong to multiple tenants; membership must be its own entity |
| `passwordHash` on `User` | Couples identity to one auth mechanism; provider choice undecided |
| Single `role` enum | Cannot express multiple roles, custom roles or scopes |
| No `Membership` | Cannot model invitations, suspension or per-tenant roles |
| No audit table | Cannot satisfy `REQ-SEC-006` |

---

## 3. Domain map

```
Identity & Tenancy        Organisation            Industry
 Tenant ◄── Membership ──► User                    Industry
   │  └── Invitation       Branch                   IndustryProfile
   │                       Department               TenantIndustry
   ├── Role ── RolePermission                      CustomIndustryRequest
   ├── DataScope                                   CustomField
   └── AuditEvent

CRM                       Sales                    Marketing
 Lead ─► Contact           Opportunity              Campaign
 Company                   Quotation ─► SalesOrder  CampaignTouch
 Activity                  PriceBook               Consent
 Segment                   Contract

Finance                   Inventory                Procurement
 Account                   Product                  Supplier
 Invoice ─► Payment        Warehouse                PurchaseRequest
 Expense                   StockMovement            PurchaseOrder
 Budget                    StockCount               Bill ─► MatchResult
 FiscalPeriod              ReorderRule
 TaxCode

Projects                  Workforce                Support
 Project ─► Task           Employee                 Case
 Deliverable               Position                 SlaPolicy
 Milestone                 Capacity                 Feedback
 ProjectCost               SiteAssignment

Documents                 Strategy                 Intelligence
 Document                  Objective                Metric ─► MetricValue
 Attachment                Kpi                      Dashboard
 Notification              Risk                     Report
 TimelineEntry             Review                   InferenceRun ─► Evidence
                                                     Recommendation ─► Outcome
```

---

## 4. Entity catalogue

### 4.1 Identity, tenancy and organisation

| Entity | Key fields | Relationships | Notes |
| --- | --- | --- | --- |
| `ENT-Tenant` | id, name, slug, status, planId, timezone, currency, locale | has memberships, branches, settings | Isolation root |
| `ENT-TenantSetting` | tenantId, key, value (typed) | belongs to tenant | Versioned; audited |
| `ENT-User` | id, email, name, status | has memberships, sessions | Global identity, not tenant-bound |
| `ENT-Membership` | id, tenantId, userId, status, joinedAt | user ↔ tenant | Unique (tenantId, userId) |
| `ENT-Invitation` | id, tenantId, email, roleId, tokenHash, expiresAt, status | tenant | Single use |
| `ENT-Role` | id, tenantId?, code, name, isSystem, version | has rolePermissions | System roles have null tenantId |
| `ENT-RolePermission` | roleId, permission | role | Unique pair |
| `ENT-RoleAssignment` | membershipId, roleId, scopeType, scopeId | membership | Multiple per membership |
| `ENT-DataScope` | membershipId, type, targetId | membership | tenant/branch/department/team/own |
| `ENT-Session` | id, userId, tenantId, expiresAt, revokedAt, ip, userAgent | user | Revocable |
| `ENT-Branch` | id, tenantId, name, timezone, address, status | tenant | Archive, never delete |
| `ENT-Department` | id, tenantId, parentId, name, status | tenant | Self-referencing hierarchy |
| `ENT-Team` | id, tenantId, departmentId, name | department | Assignment target |
| `ENT-SupportGrant` | id, tenantId, issuedBy, approvedBy, scope, reason, expiresAt | tenant | Platform access only |

### 4.2 Industry and configuration

| Entity | Key fields | Notes |
| --- | --- | --- |
| `ENT-Industry` | id, slug, name, parentId, status, version, synonyms[] | Catalogue |
| `ENT-IndustryProfile` | id, industryId, version, config (JSON), status | Declarative configuration |
| `ENT-ProfileVersion` | profileId, version, diff, publishedAt, publishedBy | Audit trail |
| `ENT-TenantIndustry` | tenantId, industryId, isPrimary, selectedAt | Multi-industry support |
| `ENT-CustomIndustryRequest` | id, tenantId, name, description, activities, status | Review queue |
| `ENT-CustomField` | id, tenantId, entityType, key, label, dataType, required, options, status | Bounded |
| `ENT-FieldSet` | id, tenantId, name, entityTypes[] | Grouping |
| `ENT-TerminologyOverride` | tenantId, key, label, locale | Display only |
| `ENT-WorkflowVariant` | id, domain, recordType, code, config, status | Approved variants |
| `ENT-Extension` | id, code, industryId, enabledFor[], version | Feature-flagged |
| `ENT-FeatureFlag` | id, key, scope, tenantId?, enabled, rollout | Rollout control |

### 4.3 CRM, sales, marketing

| Entity | Key fields | Notes |
| --- | --- | --- |
| `ENT-Lead` | id, tenantId, ownerId, sourceId, status, companyName, contactName, email, phone | Scoped to owner |
| `ENT-LeadSource` | id, tenantId, name, channel, campaignId? | Attribution origin |
| `ENT-Contact` | id, tenantId, ownerId, companyId?, firstName, lastName, email, phone, consentState | PII; restricted export |
| `ENT-Company` | id, tenantId, ownerId, name, domain, industryId?, parentId? | Hierarchy |
| `ENT-Activity` | id, tenantId, type, subject, dueAt, completedAt, ownerId, relatedType, relatedId | Polymorphic link by explicit type |
| `ENT-Communication` | id, tenantId, contactId, channel, direction, occurredAt, summary | No raw message bodies by default |
| `ENT-DuplicateCandidate` | id, tenantId, entityType, leftId, rightId, score, status | Merge review |
| `ENT-Segment` | id, tenantId, name, definition (JSON), ownerId | Saved filter |
| `ENT-Opportunity` | id, tenantId, companyId, contactId, ownerId, stageId, amount, currency, probability, expectedCloseAt, status | Pipeline |
| `ENT-PipelineStage` | id, tenantId, name, order, probability, isClosed | Configurable |
| `ENT-Product` | id, tenantId, sku, name, type, unit, taxCodeId?, status | Shared with inventory |
| `ENT-PriceBook` | id, tenantId, name, currency, status | |
| `ENT-PriceListItem` | priceBookId, productId, unitPrice, minQty | |
| `ENT-Quotation` | id, tenantId, opportunityId, number, version, status, currency, subtotal, taxTotal, total, validUntil | Immutable once issued |
| `ENT-QuotationLine` | quotationId, productId, description, qty, unitPrice, discount, taxRate, lineTotal | |
| `ENT-Contract` | id, tenantId, companyId, startDate, endDate, value, currency, status, renewalType | |
| `ENT-SalesOrder` | id, tenantId, quotationId?, companyId, number, status, total | Fulfilment link |
| `ENT-DiscountPolicy` | id, tenantId, scope, thresholdPct, approverRoleId | Approval boundary |
| `ENT-Campaign` | id, tenantId, name, channel, budget, currency, startAt, endAt, status | |
| `ENT-CampaignTouch` | id, tenantId, campaignId, contactId?, leadId?, occurredAt, type | Attribution input |
| `ENT-Attribution` | id, tenantId, model, conversionType, conversionId, touchIds[], weight | Declared model |
| `ENT-Consent` | id, tenantId, contactId, channel, basis, status, changedAt, source | Never deleted |

### 4.4 Finance

| Entity | Key fields | Notes |
| --- | --- | --- |
| `ENT-Account` | id, tenantId, code, name, type, parentId, isPostable | Chart of accounts |
| `ENT-FiscalPeriod` | id, tenantId, name, startDate, endDate, status | close/lock |
| `ENT-TaxCode` | id, tenantId, code, rate, jurisdiction, status | Tenant-confirmed |
| `ENT-Invoice` | id, tenantId, number, companyId, orderId?, status, issueDate, dueDate, currency, subtotal, taxTotal, total, balance | Immutable after issue |
| `ENT-InvoiceLine` | invoiceId, description, qty, unitPrice, taxCodeId, lineTotal | |
| `ENT-Payment` | id, tenantId, number, receivedAt, amount, currency, method, status | |
| `ENT-PaymentAllocation` | paymentId, invoiceId, amount | Sum ≤ payment and ≤ invoice balance |
| `ENT-Expense` | id, tenantId, claimantId, categoryId, amount, currency, incurredAt, status, receiptDocumentId? | |
| `ENT-Budget` | id, tenantId, departmentId?, periodId, accountId?, amount, currency | Variance source |
| `ENT-Bill` | id, tenantId, supplierId, number, receivedAt, dueDate, amount, currency, status | Payables |
| `ENT-JournalEntry` | id, tenantId, periodId, reference, postedAt, postedBy, status | Immutable when posted |
| `ENT-JournalLine` | entryId, accountId, debit, credit, currency | Debits = credits |
| `ENT-FinancialReport` | id, tenantId, type, periodId, generatedAt, parameters | Snapshot |

### 4.5 Inventory and procurement

| Entity | Key fields | Notes |
| --- | --- | --- |
| `ENT-ProductVariant` | id, productId, sku, attributes (JSON), barcode | |
| `ENT-Warehouse` | id, tenantId, branchId, name, address, status | |
| `ENT-StockLocation` | id, warehouseId, code, type | Bin/shelf |
| `ENT-StockMovement` | id, tenantId, productId, variantId?, locationId, type, quantity, unitCost, referenceType, referenceId, reason, occurredAt, actorId | Append-only |
| `ENT-StockLevel` | tenantId, productId, variantId, locationId, quantityOnHand, quantityReserved | Derived/materialised |
| `ENT-StockCount` | id, tenantId, locationId, status, countedAt, approvedBy | |
| `ENT-StockCountLine` | countId, productId, expectedQty, countedQty, variance, reason | |
| `ENT-ReorderRule` | id, tenantId, productId, locationId, minQty, maxQty, leadTimeDays | |
| `ENT-Supplier` | id, tenantId, name, terms, currency, status, rating | |
| `ENT-PurchaseRequest` | id, tenantId, requesterId, departmentId, justification, status | |
| `ENT-PurchaseRequestLine` | requestId, productId?, description, qty, estimatedUnitCost | |
| `ENT-PurchaseOrder` | id, tenantId, supplierId, number, status, currency, total, issuedAt | Versioned on amend |
| `ENT-PurchaseOrderLine` | orderId, productId?, description, qty, unitCost, receivedQty | |
| `ENT-GoodsReceipt` | id, tenantId, purchaseOrderId, receivedAt, receivedBy, status | |
| `ENT-MatchResult` | id, tenantId, billId, orderId, status, varianceAmount, resolvedBy | Three-way match |

### 4.6 Projects, workforce, support

| Entity | Key fields | Notes |
| --- | --- | --- |
| `ENT-Project` | id, tenantId, clientCompanyId?, name, status, startDate, endDate, budget, currency, managerId | |
| `ENT-Deliverable` | id, projectId, name, dueAt, status, acceptedAt | |
| `ENT-Task` | id, tenantId, projectId, title, assigneeId?, status, dueAt, priority | |
| `ENT-Milestone` | id, projectId, name, dueAt, status | |
| `ENT-Assignment` | id, tenantId, projectId, employeeId, allocationPct, startDate, endDate | |
| `ENT-ProjectCost` | id, tenantId, projectId, type, amount, currency, incurredAt | |
| `ENT-RecurringWorkflow` | id, tenantId, template, schedule, ownerId, status | Operational cadence |
| `ENT-Employee` | id, tenantId, userId?, firstName, lastName, branchId, departmentId, positionId?, status, startDate | Sensitive fields separated |
| `ENT-Position` | id, tenantId, title, level, departmentId | |
| `ENT-Capacity` | id, tenantId, employeeId, weekStart, availableHours, allocatedHours | |
| `ENT-SiteAssignment` | id, tenantId, employeeId, siteName, startAt, endAt | |
| `ENT-Case` | id, tenantId, companyId?, contactId?, subject, priority, status, assigneeId, slaPolicyId?, resolvedAt | |
| `ENT-SlaPolicy` | id, tenantId, priority, responseMins, resolutionMins, escalationPath | |
| `ENT-ServiceRecord` | id, tenantId, companyId, caseId?, summary, occurredAt | |
| `ENT-Article` | id, tenantId, title, body, tags[], status | Internal KB |
| `ENT-Feedback` | id, tenantId, caseId, score, comment, submittedAt | |

### 4.7 Documents, strategy, intelligence

| Entity | Key fields | Notes |
| --- | --- | --- |
| `ENT-Document` | id, tenantId, ownerId, name, mimeType, size, storageKey, version, sensitivity | Object storage reference |
| `ENT-Attachment` | id, tenantId, documentId, entityType, entityId | Explicit type, no free-form table names |
| `ENT-Notification` | id, tenantId, userId, type, payload (JSON), readAt | |
| `ENT-TimelineEntry` | id, tenantId, entityType, entityId, kind, actorId, occurredAt, summary | Unified history |
| `ENT-RetentionPolicy` | id, tenantId?, entityType, retentionDays, action, legalHold | |
| `ENT-Objective` | id, tenantId, departmentId?, name, targetMetricId?, targetValue, periodId, status | |
| `ENT-Kpi` | id, tenantId, name, metricId, ownerId, thresholds (JSON) | Must bind a metric |
| `ENT-Risk` | id, tenantId, title, likelihood, impact, ownerId, mitigation, status | |
| `ENT-Review` | id, tenantId, periodId, type, participants[], notes | |
| `ENT-Metric` | id, tenantId?, code, name, definition, formula, source, granularity, unit, ownerId, version, status | Registry |
| `ENT-MetricValue` | metricId, tenantId, periodStart, periodEnd, dimensionKey, value, computedAt, freshness | Materialised |
| `ENT-Dashboard` | id, tenantId, name, ownerId, layout (JSON), visibility | |
| `ENT-Report` | id, tenantId, name, type, parameters, schedule, ownerId | |
| `ENT-DataQualitySnapshot` | id, tenantId, entityType, ruleId, passed, failedCount, capturedAt | |
| `ENT-Evidence` | id, tenantId, entityType, entityId, metricId?, description, capturedAt | Links claim → record |
| `ENT-Insight` | id, tenantId, type, severity, title, summary, status, publishedAt | |
| `ENT-InferenceRun` | id, tenantId, purpose, inputScope (JSON), modelVersions, durationMs, outcome | |
| `ENT-Recommendation` | id, tenantId, insightId, actionType, rationale, expectedImpact, confidence, status | |
| `ENT-ApprovalRequest` | id, tenantId, subjectType, subjectId, subjectVersion, policyId, status | |
| `ENT-ApprovalDecision` | requestId, approverId, decision, reason, decidedAt | Immutable |
| `ENT-ActionExecution` | id, tenantId, recommendationId, actionType, status, executedAt, result | Allow-listed |
| `ENT-Outcome` | id, tenantId, recommendationId, baseline, result, method, measuredAt | Feedback loop |

### 4.8 AI/ML and platform operations

| Entity | Key fields | Notes |
| --- | --- | --- |
| `ENT-Dataset` | id, tenantId?, name, version, schema, windowStart, windowEnd, hash | Versioned |
| `ENT-Feature` | id, datasetId, name, definition, dtype, source, leakageRisk | |
| `ENT-DataCheck` | id, datasetId, type, status, findings | |
| `ENT-ModelRun` | id, modelKey, datasetId, hyperparams, metrics, startedAt, finishedAt | Training |
| `ENT-ModelVersion` | id, modelKey, version, artifactKey, status, approvedBy | Registry |
| `ENT-Prediction` | id, tenantId, modelVersionId, inputHash, output (JSON), confidence, servedAt | |
| `ENT-ModelMonitor` | id, modelVersionId, metric, value, window, capturedAt | Drift |
| `ENT-Integration` | id, tenantId, provider, status, scopes[], ownerId | |
| `ENT-IntegrationCredential` | id, integrationId, encryptedValue, rotatedAt | Encrypted, never logged |
| `ENT-Job` / `ENT-JobRun` | id, key, schedule, status, attempts, lastError | Jobs |
| `ENT-Webhook` | id, tenantId, url, secretHash, events[], status | |
| `ENT-Event` | id, tenantId, type, payload, occurredAt | Outbox |
| `ENT-AuditEvent` | id, tenantId, actorId, action, targetType, targetId, before, after, reason, correlationId, occurredAt | Append-only |
| `ENT-AccessEvent` | id, tenantId, actorId, resourceType, resourceId, purpose, occurredAt | Sensitive reads/exports |
| `ENT-SystemEvent` | id, tenantId?, type, severity, payload, occurredAt | Platform health |

---

## 5. Key relationships and cardinalities

| Relationship | Cardinality | Rule |
| --- | --- | --- |
| Tenant → Membership | 1 : N | Membership is the only path from user to tenant data |
| Membership → RoleAssignment | 1 : N | Multiple roles allowed |
| Tenant → Branch | 1 : N | Branch archive keeps records |
| Company → Contact | 1 : N | Contact may exist without company |
| Opportunity → Quotation | 1 : N | Multiple versions, one accepted |
| Quotation → SalesOrder | 1 : 0..1 | Order immutable reference to accepted quote |
| SalesOrder → Invoice | 1 : N | Partial billing allowed |
| Invoice → PaymentAllocation | 1 : N | Sum of allocations ≤ invoice balance |
| PurchaseOrder → GoodsReceipt | 1 : N | Partial receipts |
| Bill → MatchResult | 1 : 1 | Match required before payment approval |
| Project → Task | 1 : N | Task belongs to exactly one project |
| Metric → MetricValue | 1 : N | Dimensioned by period and scope |
| Insight → Recommendation | 1 : N | Multiple candidate actions |
| Recommendation → ApprovalRequest | 1 : 1 | Version-bound |
| Recommendation → Outcome | 1 : 0..1 | Measured once per window |

---

## 6. Identifiers, timestamps and conventions

| Convention | Rule |
| --- | --- |
| Primary keys | `cuid()` strings, non-guessable, stable |
| Human numbers | Separate `number` field, tenant-configurable pattern |
| Timestamps | `createdAt`, `updatedAt` UTC; `occurredAt` for business time |
| Soft delete | `deletedAt` only on entities where archival is legitimate (contacts, drafts) |
| Status | Constrained enums or lookup tables, never free text |
| Table naming | `snake_case` plural via `@@map` |
| Field naming | `camelCase` in Prisma, `snake_case` in SQL |
| Enums | Upper snake case |
| Booleans | Prefixed `is`/`has` |
| Money | `Decimal` + `currency` |
| JSON | Only for bounded, validated structures (custom fields, configs, payloads) |

---

## 7. Integrity requirements

| ID | Requirement | Enforcement |
| --- | --- | --- |
| INT-1 | Every tenant-owned row has a non-null `tenantId` | NOT NULL + composite indexes |
| INT-2 | Uniqueness is per tenant, not global (e.g. invoice number) | Composite unique index |
| INT-3 | Foreign keys are enforced | FK constraints, no orphan rows |
| INT-4 | Payment allocations never exceed balances | Service transaction + check |
| INT-5 | Journal entries balance | Service + database check where feasible |
| INT-6 | Stock quantity equals sum of movements | Derived + reconciliation job |
| INT-7 | State transitions are validated | Service layer + allowed-transition table |
| INT-8 | Audit events are append-only | No UPDATE/DELETE grants to app role |
| INT-9 | Posted financial records are immutable | No update path in repository layer |
| INT-10 | Referenced documents cannot be deleted while attached | FK + service check |

---

## 8. Indexing and performance strategy

| Need | Approach |
| --- | --- |
| Tenant-first queries | Leading `tenantId` in composite indexes |
| List views | Index on `(tenantId, status, updatedAt)` per entity |
| Search | Trigram or full-text indexes on names/emails, added per measured need |
| Reporting | Materialised metric values; SQL views for BI |
| Time series | `(tenantId, periodStart)` on `MetricValue` |
| Large tables | Partition candidates: `AuditEvent`, `StockMovement`, `MetricValue`, `Prediction` |
| Pagination | Keyset pagination on indexed sort columns |

---

## 9. Migration principles

| ID | Principle |
| --- | --- |
| MIG-1 | No migration is created in PH-01. |
| MIG-2 | Every migration is reviewed by a second person and named descriptively. |
| MIG-3 | Migrations are additive first: add → backfill → switch reads → remove old. |
| MIG-4 | Destructive changes require a documented backup and rollback plan. |
| MIG-5 | Enum changes are additive; removal requires a data migration. |
| MIG-6 | Production migrations run in a release step with a pre-flight check. |
| MIG-7 | Schema drift between environments is a release blocker. |
| MIG-8 | Seed data is synthetic and never mixed with tenant data. |

---

## 10. Retention, export and deletion

| Data class | Default retention (proposed) | Deletion |
| --- | --- | --- |
| Financial records | 7 years or jurisdiction minimum | Never hard-deleted while retention applies |
| Audit events | 7 years | Append-only; archived after |
| CRM contacts | Tenant policy (default 3 years after last activity) | Anonymise on request where lawful |
| Marketing consent | Life of relationship + 2 years | Never deleted while relied upon |
| Documents | Per policy; legal hold overrides | Soft delete then purge |
| ML datasets | Per model lifecycle policy | Versioned; purge with provenance record |
| Operational logs | 90 days | Rotated |
| Session records | 30 days after expiry | Purged |

| ID | Requirement |
| --- | --- |
| RET-1 | Deletion requests are executable per tenant and per data subject where legally required. |
| RET-2 | Deletion produces evidence (counts, timestamps, scope) without retaining the deleted content. |
| RET-3 | Legal hold suspends deletion and is itself audited. |
| RET-4 | Tenant offboarding exports data in a documented machine-readable format before purge. |

---

## 11. Open data decisions

| ID | Question |
| --- | --- |
| `OD-002` | Confirm PostgreSQL as primary store |
| `OD-004` | Confirm Prisma, and the SQL boundary for reporting |
| `OD-005` | Custom field storage: JSONB vs typed side tables |
| `OD-021` | Backup retention and RPO/RTO commitments |
| `OD-022` | Multi-region or single-region; data residency commitments |
| `OD-023` | Audit retention period by jurisdiction |

## 12. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial domain plan; no migrations created. |
