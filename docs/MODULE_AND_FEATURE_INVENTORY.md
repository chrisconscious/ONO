# ONO — Module and Feature Inventory

| Field | Value |
| --- | --- |
| Document | Module and Feature Inventory |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` |
| Scope | Complete intended product scope. Omission of a module is a defect in this document. |

---

## 1. Module map

| ID | Module | Type | Feature location | Primary phase |
| --- | --- | --- | --- | --- |
| M01 | Platform Administration (SaaS) | Platform | `src/features/platform` *(to be created)* | PH-05, PH-24 |
| M02 | Organisation & Tenancy | Core | `src/features/organisation` *(to be created)* | PH-05 |
| M03 | Identity & Access Management | Core | `src/lib/auth`, `src/lib/permissions` | PH-05 |
| M04 | Industry Configuration | Core | `src/features/industry` *(to be created)* | PH-05, PH-24 |
| M05 | CRM | Core | `src/features/crm` | PH-11 |
| M06 | Sales & Commercial | Core | `src/features/sales` | PH-12 |
| M07 | Marketing | Core | `src/features/marketing` *(to be created)* | PH-12 |
| M08 | Finance | Core | `src/features/finance` | PH-13 |
| M09 | Inventory | Core | `src/features/inventory` | PH-14 |
| M10 | Procurement | Core | `src/features/procurement` | PH-14 |
| M11 | Projects & Operations | Core | `src/features/projects` | PH-15 |
| M12 | Workforce & HR | Core | `src/features/workforce` | PH-15 |
| M13 | Customer Support | Core | `src/features/support` *(to be created)* | PH-15 |
| M14 | Documents & Communication | Core | `src/features/documents` *(to be created)* | PH-10, PH-15 |
| M15 | Strategy & Performance | Core | `src/features/strategy` *(to be created)* | PH-16 |
| M16 | Business Intelligence | Core | `src/features/analytics` | PH-16–PH-18 |
| M17 | AI & Machine Learning | Core | `src/features/ai-insights` | PH-19–PH-21 |
| M18 | Inference Intelligence Engine | Core | `src/features/ai-insights` | PH-22 |
| M19 | Integrations & Jobs | Platform | `src/server/jobs`, `src/features/integrations` *(to be created)* | PH-10, PH-24 |
| M20 | Audit & Compliance | Platform | `src/features/audit` *(to be created)* | PH-10 |
| M21 | Approvals & Workflow Engine | Core | `src/features/workflows` *(to be created)* | PH-09 |
| M22 | Data Quality & Governance | Core | `src/features/data-quality` *(to be created)* | PH-16 |
| M23 | Data Marketplace (future) | Future | Not started | Post-PH-26 |

**Structural gap recorded:** the repository scaffold contains feature folders for
`ai-insights`, `analytics`, `crm`, `finance`, `inventory`, `procurement`,
`projects`, `sales`, `workforce` only. Nine modules above have no folder yet.
Creating them is part of PH-04/PH-05, not this stage.

---

## 2. M01 — Platform Administration (SaaS)

**Purpose:** operate ONO as a business: tenants, plans, entitlements, platform
health, support access — without granting blanket access to tenant data.

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Tenant registry | Provision, suspend, reactivate, archive; tenant metadata and status | `ENT-Tenant`, `ENT-TenantPlan` | `REQ-PLT-001`, `REQ-PLT-002` |
| Plans & entitlements | Plans, module entitlements, seat limits, usage quotas | `ENT-Plan`, `ENT-Entitlement`, `ENT-UsageRecord` | `REQ-PLT-003` |
| Feature rollout | Flags, gradual release, per-tenant overrides | `ENT-FeatureFlag` | `REQ-PLT-005` |
| Support access | Time-boxed, reason-bound, tenant-approved access with full audit | `ENT-SupportGrant` | `REQ-PLT-006` |
| Platform health | Job status, error rates, queue depth, integration health | `ENT-SystemEvent` | `REQ-PLT-004` |

- **Permissions:** `PERM-TENANT.MANAGE`, `PERM-PLAN.MANAGE`, `PERM-FLAG.MANAGE`, `PERM-SUPPORT-GRANT.ISSUE`.
- **Dependencies:** M02 (tenancy), M03 (identity), M20 (audit).
- **Boundary rule:** platform administrators do not receive implicit access to
  tenant business records. Any access requires an explicit, audited grant
  (`REQ-PLT-006`, `REQ-SEC-003`).

## 3. M02 — Organisation & Tenancy

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Onboarding | Guided setup: organisation, industry, branches, currency, fiscal year, first admin | `ENT-Tenant` | `REQ-ORG-001` |
| Branches & locations | Hierarchy of operating sites, address, timezone | `ENT-Branch` | `REQ-ORG-002` |
| Departments & teams | Reporting structure, team membership | `ENT-Department`, `ENT-Team` | `REQ-ORG-003` |
| Organisation settings | Locale, currency, timezone, fiscal calendar, branding, terminology | `ENT-TenantSetting` | `REQ-ORG-004` |
| Multi-industry setup | One or more industries with weights/purpose | `ENT-TenantIndustry` | `REQ-ORG-005` |
| Tenant audit | Organisation-level activity history | `ENT-AuditEvent` | `REQ-ORG-006` |

- **Permissions:** `PERM-ORG.UPDATE`, `PERM-BRANCH.MANAGE`, `PERM-DEPARTMENT.MANAGE`, `PERM-SETTING.MANAGE`.
- **Dependencies:** M01, M03, M04.
- **Constraint:** an organisation always has exactly one owner-level account set
  at onboarding; ownership transfer is an audited operation.

## 4. M03 — Identity & Access Management

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Authentication | Sign-in, sign-out, password reset, optional SSO, MFA readiness | `ENT-Credential`, `ENT-Session` | `REQ-IAM-001`, `REQ-IAM-002`, `REQ-IAM-003` |
| Membership | Invitations, acceptance, suspension, removal | `ENT-Membership`, `ENT-Invitation` | `REQ-IAM-004` |
| Roles | System roles, custom roles, role composition | `ENT-Role`, `ENT-RolePermission` | `REQ-IAM-005` |
| Authorisation | Server-side permission checks, default deny | `ENT-Permission` | `REQ-IAM-006` |
| Scopes | Tenant, branch, department, ownership, sensitivity | `ENT-DataScope` | `REQ-IAM-007` |
| Multi-role & separation of duties | Multiple roles per user, conflicting-role rules, approval thresholds | `ENT-RoleAssignment` | `REQ-IAM-008` |

- **Permissions:** `PERM-USER.INVITE`, `PERM-ROLE.MANAGE`, `PERM-MEMBERSHIP.SUSPEND`, `PERM-SESSION.REVOKE`.
- **Dependencies:** M02, M20.
- **Detail:** `ROLES_AND_PERMISSION_MODEL.md`.

## 5. M04 — Industry Configuration

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Industry catalogue | Searchable, hierarchical catalogue of industries and sub-industries | `ENT-Industry` | `REQ-IND-001` |
| Selection | Multi-select industries and activities for mixed businesses | `ENT-TenantIndustry` | `REQ-IND-002` |
| Custom industry intake | "Other" path, free-text name and description, review queue | `ENT-CustomIndustryRequest` | `REQ-IND-003` |
| Industry profiles | Module set, terminology, metrics, workflow variants, defaults | `ENT-IndustryProfile` | `REQ-IND-004` |
| Custom fields | Bounded tenant-defined fields with types and validation | `ENT-CustomField` | `REQ-IND-005` |
| Extension mechanism | Reviewed, versioned industry extensions | `ENT-Extension` | `REQ-IND-006` |

- **Permissions:** `PERM-INDUSTRY.SELECT`, `PERM-PROFILE.APPLY`, `PERM-CUSTOM-FIELD.MANAGE`, `PERM-CUSTOM-INDUSTRY.REVIEW` (platform).
- **Dependencies:** M02, M03.
- **Detail:** `INDUSTRY_ADAPTATION_SPECIFICATION.md`.

## 6. M05 — CRM

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Leads | Capture, source, status, qualification, assignment | `ENT-Lead`, `ENT-LeadSource` | `REQ-CRM-001`, `REQ-CRM-005` |
| Contacts | People, communication details, consent flags | `ENT-Contact` | `REQ-CRM-002` |
| Companies | Organisations, relationships, hierarchy | `ENT-Company` | `REQ-CRM-002` |
| Activities | Calls, meetings, notes, tasks, follow-up dates | `ENT-Activity` | `REQ-CRM-003` |
| Communications | Email/logged messages, direction, outcome | `ENT-Communication` | `REQ-CRM-003` |
| Deduplication | Match rules, merge, survivorship, audit | `ENT-DuplicateCandidate` | `REQ-CRM-004` |
| Conversion | Lead → contact + company + opportunity | `ENT-ConversionRecord` | `REQ-CRM-006` |
| Segmentation | Lists, tags, saved filters, pipeline views | `ENT-Segment` | `REQ-CRM-007` |

- **Permissions:** `PERM-LEAD.*`, `PERM-CONTACT.*`, `PERM-COMPANY.*`, `PERM-ACTIVITY.*`, `PERM-SEGMENT.*` (`.VIEW`, `.CREATE`, `.UPDATE`, `.DELETE`, `.EXPORT`).
- **Dependencies:** M03 (ownership/scopes), M06 (conversion), M14 (communications).
- **Key rule:** deleting a contact with linked financial records is blocked; archive instead.

## 7. M06 — Sales & Commercial

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Opportunities | Stages, probability, value, owner, close date | `ENT-Opportunity`, `ENT-PipelineStage` | `REQ-SAL-001` |
| Catalogue & pricing | Products/services, price books, currency, tax category | `ENT-Product`, `ENT-PriceBook`, `ENT-PriceListItem` | `REQ-SAL-002` |
| Quotations | Draft, versions, line items, totals, expiry, send | `ENT-Quotation` | `REQ-SAL-003` |
| Contracts | Terms, renewal, approval, linkage to orders | `ENT-Contract` | `REQ-SAL-004` |
| Orders | Conversion from accepted quote, fulfilment handoff | `ENT-SalesOrder` | `REQ-SAL-005` |
| Pricing guardrails | Discount limits, approval thresholds, margin floors | `ENT-DiscountPolicy` | `REQ-SAL-006` |
| Performance | Win rate, cycle time, forecast accuracy, rep performance | `MET-*` set | `REQ-SAL-007` |

- **Permissions:** `PERM-OPPORTUNITY.*`, `PERM-QUOTATION.*`, `PERM-CONTRACT.APPROVE`, `PERM-ORDER.*`, `PERM-PRICING.OVERRIDE`.
- **Dependencies:** M05, M08, M09, M21.
- **Key rule:** a quotation total is computed by the pricing service, never by the client.

## 8. M07 — Marketing

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Campaigns | Objective, channel, budget, schedule, owner | `ENT-Campaign` | `REQ-MKT-001` |
| Lead acquisition | Landing capture, imports, UTM/source tracking | `ENT-LeadSource`, `ENT-CampaignTouch` | `REQ-MKT-002` |
| Attribution | First/last/multi-touch models, declared and configurable | `ENT-Attribution` | `REQ-MKT-002` |
| Performance | Spend, cost per lead, cost per acquisition, return | `MET-*` set | `REQ-MKT-003` |
| Consent & contactability | Opt-in/opt-out, channel consent, suppression lists | `ENT-Consent` | `REQ-MKT-004` |
| Analytics handoff | Campaign metrics into BI registry | `ENT-Metric` links | `REQ-MKT-005` |

- **Permissions:** `PERM-CAMPAIGN.*`, `PERM-CONSENT.MANAGE`, `PERM-ATTRIBUTION.CONFIGURE`.
- **Dependencies:** M05, M16.
- **Key rule:** no campaign send to a contact without a recorded lawful basis and consent state.

## 9. M08 — Finance

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Accounting configuration | Chart of accounts, fiscal year, currency, tax codes | `ENT-Account`, `ENT-FiscalPeriod`, `ENT-TaxCode` | `REQ-FIN-001` |
| Invoices & receivables | Issue, due dates, aging, credit notes | `ENT-Invoice`, `ENT-InvoiceLine` | `REQ-FIN-002` |
| Payments | Receipts, allocations, partial payments, reconciliation | `ENT-Payment`, `ENT-PaymentAllocation` | `REQ-FIN-003` |
| Expenses | Claims, categories, receipts, approval | `ENT-Expense` | `REQ-FIN-004` |
| Budgets | Period budgets, actuals, variance | `ENT-Budget` | `REQ-FIN-005` |
| Payables | Supplier bills, due dates, payment runs (recorded, not initiated) | `ENT-Bill` | `REQ-FIN-006` |
| Reporting | Cash flow, P&L, balance position, period close | `ENT-FinancialReport` | `REQ-FIN-007` |
| Tax | Configurable rates and treatment per jurisdiction | `ENT-TaxCode` | `REQ-FIN-008` |

- **Permissions:** `PERM-INVOICE.*`, `PERM-PAYMENT.*`, `PERM-EXPENSE.APPROVE`, `PERM-BUDGET.MANAGE`, `PERM-JOURNAL.POST`, `PERM-REPORT.EXPORT`.
- **Dependencies:** M06, M10, M21, M20.
- **Key rule:** posted financial records are immutable; correction is by reversing entry.
- **Disclaimer:** ONO does not claim statutory compliance in any jurisdiction
  until a qualified reviewer confirms it (`REQ-FIN-008`, `OD-018`).

## 10. M09 — Inventory

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Products & SKUs | Variants, units, barcodes, categories | `ENT-Product`, `ENT-ProductVariant` | `REQ-INV-001` |
| Warehouses | Locations, bins, transfers | `ENT-Warehouse`, `ENT-StockLocation` | `REQ-INV-002` |
| Stock movements | Receipts, issues, transfers, adjustments, valuation method | `ENT-StockMovement` | `REQ-INV-003` |
| Reorder | Min/max levels, lead times, alerts, suggested quantities | `ENT-ReorderRule` | `REQ-INV-004` |
| Counts | Cycle counts, variance approval, audit | `ENT-StockCount` | `REQ-INV-005` |
| Analytics | Turnover, days of cover, dead stock, shrinkage | `MET-*` set | `REQ-INV-006` |

- **Permissions:** `PERM-PRODUCT.*`, `PERM-STOCK.ADJUST`, `PERM-STOCKCOUNT.APPROVE`, `PERM-WAREHOUSE.MANAGE`.
- **Dependencies:** M08 (valuation), M10 (receiving), M11 (consumption).
- **Key rule:** stock quantity never changes without a movement record naming the actor and reason.

## 11. M10 — Procurement

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Suppliers | Registry, contacts, terms, documents, performance history | `ENT-Supplier` | `REQ-PRC-001` |
| Purchase requests | Requester, justification, budget check, approval | `ENT-PurchaseRequest` | `REQ-PRC-002` |
| Purchase orders | Issue, amend, cancel, receiving | `ENT-PurchaseOrder` | `REQ-PRC-003` |
| Three-way match | PO vs receipt vs supplier bill | `ENT-MatchResult` | `REQ-PRC-004` |
| Supplier analytics | Price variance, on-time delivery, quality | `MET-*` set | `REQ-PRC-005` |
| Procure-to-pay | End-to-end workflow with exceptions | `ENT-ProcurementCase` | `REQ-PRC-006` |

- **Permissions:** `PERM-SUPPLIER.*`, `PERM-PURCHASEREQUEST.APPROVE`, `PERM-PURCHASEORDER.*`, `PERM-BILL.MATCH`.
- **Dependencies:** M08, M09, M21.
- **Key rule:** an order above the approval threshold cannot be issued without a recorded approver.

## 12. M11 — Projects & Operations

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Projects | Scope, client link, dates, status, budget | `ENT-Project` | `REQ-PRJ-001` |
| Deliverables | Outputs, acceptance, sign-off | `ENT-Deliverable` | `REQ-PRJ-001` |
| Tasks & milestones | Assignment, dependencies, progress, due dates | `ENT-Task`, `ENT-Milestone` | `REQ-PRJ-002` |
| Resourcing | Allocation, utilisation, conflicts | `ENT-Assignment` | `REQ-PRJ-003` |
| Costing | Budget vs actual, margin, time and material tracking | `ENT-ProjectCost` | `REQ-PRJ-004` |
| Recurring operations | Schedules, runbooks, checklists | `ENT-RecurringWorkflow` | `REQ-PRJ-005` |
| Reporting | Status, risk, profitability, delays | `MET-*` set | `REQ-PRJ-006` |

- **Permissions:** `PERM-PROJECT.*`, `PERM-TASK.*`, `PERM-TIMESHEET.APPROVE`, `PERM-PROJECT.BUDGET`.
- **Dependencies:** M05/M06 (client/order), M12 (people), M08 (cost).
- **Key rule:** a project cannot be marked complete with unapproved deliverables.

## 13. M12 — Workforce & HR

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Employee records | Employment details, status, branch, department | `ENT-Employee` | `REQ-WFM-001` |
| Responsibilities | Job role, duties, reporting line | `ENT-Position` | `REQ-WFM-002` |
| Allocation | Availability, assignment, capacity | `ENT-Capacity` | `REQ-WFM-003` |
| Reporting | Utilisation, headcount, overtime indicators | `MET-*` set | `REQ-WFM-004` |
| Field operations | Site assignments, travel, shift coverage | `ENT-SiteAssignment` | `REQ-WFM-005` |

- **Permissions:** `PERM-EMPLOYEE.*`, `PERM-CAPACITY.MANAGE`, `PERM-EMPLOYEE.SENSITIVE.VIEW`.
- **Dependencies:** M02, M11, M16.
- **Key rule:** employee sensitive fields are separately permissioned from ordinary directory data.

## 14. M13 — Customer Support

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Cases | Intake, classification, priority, assignment, status | `ENT-Case` | `REQ-SUP-001` |
| SLA | Targets, timers, breach escalation | `ENT-SlaPolicy` | `REQ-SUP-002` |
| Service history | Cases and interactions per customer | `ENT-ServiceRecord` | `REQ-SUP-003` |
| Knowledge base | Internal articles linked to cases | `ENT-Article` | `REQ-SUP-004` |
| Satisfaction | Feedback capture, retention signals | `ENT-Feedback` | `REQ-SUP-005` |

- **Permissions:** `PERM-CASE.*`, `PERM-SLA.MANAGE`, `PERM-ARTICLE.*`, `PERM-FEEDBACK.VIEW`.
- **Dependencies:** M05, M14, M16.
- **Key rule:** resolving a case requires a resolution note; reopening preserves history.

## 15. M14 — Documents & Communication

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Documents | Upload, versions, metadata, preview | `ENT-Document` | `REQ-DOC-001` |
| Attachments | Link documents to any record type | `ENT-Attachment` | `REQ-DOC-002` |
| Notifications | In-app and email, preferences, digests | `ENT-Notification` | `REQ-DOC-003` |
| Retention | Policies, legal hold, scheduled deletion | `ENT-RetentionPolicy` | `REQ-DOC-004` |
| Timeline | Unified communication and activity history | `ENT-TimelineEntry` | `REQ-DOC-005` |

- **Permissions:** `PERM-DOCUMENT.*`, `PERM-NOTIFICATION.PREFERENCE`, `PERM-RETENTION.MANAGE`.
- **Dependencies:** M19 (storage), M20 (audit).
- **Key rule:** document downloads are permission-checked and audited; signed URLs are short-lived.

## 16. M15 — Strategy & Performance

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Objectives | Company/department objectives and targets | `ENT-Objective` | `REQ-STR-001` |
| KPIs | Metric binding, owners, thresholds | `ENT-Kpi` | `REQ-STR-002` |
| Risks | Register, likelihood, impact, mitigation, owner | `ENT-Risk` | `REQ-STR-003` |
| Reviews | Periodic performance review cycle and notes | `ENT-Review` | `REQ-STR-004` |
| Management reporting | Pack generation from registered metrics | `ENT-ReportPack` | `REQ-STR-005` |

- **Permissions:** `PERM-OBJECTIVE.*`, `PERM-KPI.*`, `PERM-RISK.*`, `PERM-REVIEW.MANAGE`.
- **Dependencies:** M16 (metrics), M02 (departments).
- **Key rule:** a KPI must bind to a registered metric; free-text KPI values are not permitted.

## 17. M16 — Business Intelligence

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Metric registry | Canonical definitions, owner, formula, source, frequency | `ENT-Metric` | `REQ-BI-001` |
| Calculation service | Single implementation per metric, cached with freshness | `ENT-MetricValue` | `REQ-BI-002` |
| Dashboards | Role-aware layouts, widgets, saved views | `ENT-Dashboard` | `REQ-BI-003` |
| Reports & exports | Scheduled and on-demand, permission-aware | `ENT-Report` | `REQ-BI-004` |
| Drill-down | Navigate from aggregate to source records | `ENT-DrillPath` | `REQ-BI-005` |
| Freshness & quality | Last-updated, completeness, exception counts | `ENT-DataQualitySnapshot` | `REQ-BI-006` |
| Comparison | Period, cohort, branch, benchmark | `ENT-Comparison` | `REQ-BI-007` |
| Explainability | Evidence links attached to insight cards | `ENT-Evidence` | `REQ-BI-008` |

- **Permissions:** `PERM-DASHBOARD.*`, `PERM-REPORT.*`, `PERM-METRIC.MANAGE`, `PERM-EXPORT.RUN`.
- **Dependencies:** all record modules, M22.
- **Key rule:** dashboards may not compute a KPI locally; they read registered metrics.

## 18. M17 — AI & Machine Learning

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Datasets & features | Versioned datasets, feature definitions, windows | `ENT-Dataset`, `ENT-Feature` | `REQ-ML-001` |
| Validation | Schema, range, leakage and label-quality checks | `ENT-DataCheck` | `REQ-ML-002` |
| Training & evaluation | Baselines, training runs, holdout metrics, calibration | `ENT-ModelRun` | `REQ-ML-003` |
| Model registry | Versioning, approval, deployment state | `ENT-ModelVersion` | `REQ-ML-004` |
| Serving | Validated input, version pinning, timeouts, structured output | `ENT-Prediction` | `REQ-ML-005` |
| Monitoring | Drift, quality decay, retraining triggers | `ENT-ModelMonitor` | `REQ-ML-006` |

- **Permissions:** `PERM-MODEL.VIEW`, `PERM-MODEL.TRAIN`, `PERM-MODEL.PROMOTE`, `PERM-PREDICTION.RUN`.
- **Dependencies:** M16, M22, M19.
- **Key rule:** no model is "production" without recorded evaluation against a
  baseline on held-out data (`REQ-ML-003`).

## 19. M18 — Inference Intelligence Engine

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Orchestration | Assemble authorised context; call rules, analytics, models | `ENT-InferenceRun` | `REQ-INF-001` |
| Rule evaluation | Deterministic business rules before ML | `ENT-RuleEvaluation` | `REQ-INF-002` |
| Evidence assembly | Provenance for every claim | `ENT-Evidence` | `REQ-INF-003` |
| Uncertainty | Confidence bands, ranges, assumptions | `ENT-Uncertainty` | `REQ-INF-004` |
| Recommendations | Candidate actions, ranking, impact, constraints | `ENT-Recommendation` | `REQ-INF-005` |
| Controlled execution | Allow-listed actions after approval | `ENT-ActionExecution` | `REQ-INF-006` |
| Outcome tracking | Baseline, result, feedback to models | `ENT-Outcome` | `REQ-INF-007` |

- **Permissions:** `PERM-INSIGHT.VIEW`, `PERM-RECOMMENDATION.APPROVE`, `PERM-ACTION.EXECUTE`, `PERM-OUTCOME.RECORD`.
- **Dependencies:** M16, M17, M21, M20.
- **Detail:** `AI_ML_INFERENCE_SPECIFICATION.md`.

## 20. M19 — Integrations & Jobs

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Integration registry | Connections, scopes, status, owner | `ENT-Integration` | `REQ-INT-001` |
| Credentials vault | Encrypted secrets, rotation, access log | `ENT-IntegrationCredential` | `REQ-INT-001`, `REQ-SEC-008` |
| Background jobs | Scheduled, retried, idempotent, observable | `ENT-Job`, `ENT-JobRun` | `REQ-INT-002` |
| Webhooks & events | Signed delivery, replay, failure handling | `ENT-Webhook`, `ENT-Event` | `REQ-INT-003` |
| Import/export | CSV import with mapping and validation; exports | `ENT-ImportJob` | `REQ-INT-004` |
| Resilience | Timeouts, circuit breaking, rate limits, dead-letter | `ENT-IntegrationLog` | `REQ-INT-005` |

- **Permissions:** `PERM-INTEGRATION.MANAGE`, `PERM-JOB.VIEW`, `PERM-IMPORT.RUN`, `PERM-EXPORT.RUN`.
- **Dependencies:** M01, M20, M22.

## 21. M20 — Audit & Compliance

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Audit log | Append-only events: actor, action, target, before/after, reason | `ENT-AuditEvent` | `REQ-SEC-006`, `REQ-ORG-006` |
| Access log | Sensitive record reads and exports | `ENT-AccessEvent` | `REQ-SEC-004` |
| Retention controls | Policy application and evidence of deletion | `ENT-RetentionPolicy` | `REQ-DATA-005`, `REQ-DOC-004` |
| Compliance evidence | Exportable records for review | `ENT-ComplianceExport` | `REQ-DATA-005` |

- **Permissions:** `PERM-AUDIT.VIEW`, `PERM-AUDIT.EXPORT`.
- **Dependencies:** all modules.
- **Key rule:** audit events are immutable and tenant-visible only to authorised roles.

## 22. M21 — Approvals & Workflow Engine

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Approval policies | Threshold, role, sequential/parallel, delegation | `ENT-ApprovalPolicy` | `REQ-IAM-008`, `REQ-INF-005` |
| Approval requests | Subject record, requested action, evidence | `ENT-ApprovalRequest` | `REQ-INF-005` |
| Decisions | Approve, reject, request change, with reason | `ENT-ApprovalDecision` | `REQ-INF-006` |
| Escalation | Timeouts, reminders, escalation path | `ENT-Escalation` | `REQ-PLT-004` |
| State machines | Explicit lifecycle per record type | `ENT-WorkflowState` | `REQ-DATA-003` |

- **Permissions:** `PERM-APPROVAL.DECIDE`, `PERM-POLICY.MANAGE`.
- **Dependencies:** M03, M20.
- **Key rule:** an approver cannot approve their own request where policy forbids it.

## 23. M22 — Data Quality & Governance

| Submodule | Capabilities | Key entities | Requirements |
| --- | --- | --- | --- |
| Quality rules | Required fields, ranges, referential checks, timeliness | `ENT-QualityRule` | `REQ-DATA-004` |
| Exceptions | Queue, ownership, resolution, SLA | `ENT-QualityException` | `REQ-DATA-004` |
| Lineage | Source → transform → metric provenance | `ENT-Lineage` | `REQ-BI-001` |
| Retention & deletion | Classification-driven lifecycle | `ENT-RetentionPolicy` | `REQ-DATA-005` |
| Export | Tenant data export in a documented format | `ENT-ExportPackage` | `REQ-DATA-005` |

- **Permissions:** `PERM-QUALITY.MANAGE`, `PERM-DATA.EXPORT`, `PERM-DATA.DELETE`.
- **Dependencies:** M16, M20.

## 24. M23 — Data Marketplace (future)

**Status:** not designed for implementation. Governed separately.

| Submodule | Capabilities | Requirements |
| --- | --- | --- |
| Participation | Explicit opt-in, legal basis, revocable | `REQ-MDP-001` |
| Aggregation | k-anonymity thresholds, suppression, re-identification defence | `REQ-MDP-002` |
| Access | Buyer eligibility, purpose binding, audit | `REQ-MDP-003` |
| Prohibited | Sale or exposure of identifiable tenant records | Permanent boundary |

- **Dependencies:** mature M16, M17, M20, M22 plus legal review.
- **Phase:** post-PH-26 as a separate programme (`OD-025`).

---

## 25. Cross-module dependency summary

| Depends on | Required by |
| --- | --- |
| M02 Organisation | every tenant module |
| M03 Identity & Access | every screen, API, job and AI tool |
| M21 Approvals | finance, procurement, sales discounts, inference actions |
| M20 Audit | every consequential operation |
| M16 Metrics | BI, strategy, AI, dashboards, recommendations |
| M22 Data quality | metrics, ML datasets, dashboards |
| M19 Jobs/Integrations | imports, notifications, scheduled reports, model runs |

## 26. Recorded structural gaps

| Gap | Impact | Resolution phase |
| --- | --- | --- |
| Nine modules have no feature folder | Cannot begin feature work without structure | PH-04/PH-05 |
| No module entitlement model | Cannot gate plans | PH-24 |
| No approval engine | Blocks finance/procurement correctness | PH-09 |
| No metric registry | Blocks BI and AI | PH-16 |
| No audit store | Blocks compliance claims | PH-10 |
| Scaffold landing page at `/` | Conflicts with authentication-first | PH-05 |

## 27. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial complete module inventory (23 modules). |
