# ONO — Requirements Traceability Matrix

| Field | Value |
| --- | --- |
| Document | Requirements Traceability Matrix |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — nothing approved, implemented or verified |
| Coverage | 145 functional requirements + 12 non-functional requirements |

---

## 1. Reading this matrix

| Column | Meaning |
| --- | --- |
| `Requirement` | Permanent identifier |
| `Description` | Short statement; full text lives in the owning document |
| `Module` | Owning module (`M01`–`M23`) |
| `Workflow` | Primary workflow in `BUSINESS_WORKFLOW_CATALOG.md` |
| `Roles` | Roles that exercise the requirement (abbreviated from the role catalogue) |
| `Entities` | Primary data entities |
| `Security` | Security requirement(s) that govern it |
| `Phase` | Delivering phase |
| `Acceptance` | Acceptance criteria identifier |
| `Status` | Always `Recorded` in this stage |

Role abbreviations: `PLAT-ADMIN`, `PLAT-SUPPORT`, `OWNER`, `ORG-ADMIN`, `GM`,
`SALES-MGR`, `SALES-REP`, `MKT-MGR`, `FIN-MGR`, `ACCT`, `OPS-MGR`, `INV-OFF`,
`PRC-OFF`, `PM`, `PM-MEMBER`, `HR-MGR`, `SUP-AGENT`, `AUDITOR`.

---

## 2. Platform, organisation and access

| Requirement | Description | Module | Workflow | Roles | Entities | Security | Phase | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-PLT-001 | Platform console separate from tenant UI | M01 | WF-IAM-04 | PLAT-ADMIN | ENT-SupportGrant | SEC-002 | PH-05 | AC-PLT-001 | Recorded |
| REQ-PLT-002 | Tenant provision, suspend, archive | M01 | WF-ORG-01 | PLAT-ADMIN | ENT-Tenant | SEC-001 | PH-24 | AC-PLT-002 | Recorded |
| REQ-PLT-003 | Plans, entitlements, usage limits | M01 | WF-ORG-01 | PLAT-ADMIN, OWNER | ENT-Plan, ENT-Entitlement | SEC-003 | PH-24 | AC-PLT-003 | Recorded |
| REQ-PLT-004 | Platform health and admin audit | M01, M20 | WF-INT-03 | PLAT-ADMIN | ENT-SystemEvent, ENT-AuditEvent | SEC-006 | PH-10 | AC-PLT-004 | Recorded |
| REQ-PLT-005 | Feature flags and per-tenant rollout | M01 | WF-IND-02 | PLAT-ADMIN | ENT-FeatureFlag | SEC-003 | PH-24 | AC-PLT-005 | Recorded |
| REQ-PLT-006 | Time-boxed, audited support access | M01, M20 | WF-IAM-04 | PLAT-ADMIN, PLAT-SUPPORT | ENT-SupportGrant | SEC-003 | PH-24 | AC-PLT-006 | Recorded |
| REQ-ORG-001 | Guided organisation onboarding | M02 | WF-ORG-01 | OWNER, ORG-ADMIN | ENT-Tenant | SEC-001 | PH-05 | AC-ORG-001 | Recorded |
| REQ-ORG-002 | Branches and operating locations | M02 | WF-ORG-02 | ORG-ADMIN | ENT-Branch | SEC-002 | PH-05 | AC-ORG-002 | Recorded |
| REQ-ORG-003 | Departments and teams | M02 | WF-ORG-02 | ORG-ADMIN | ENT-Department, ENT-Team | SEC-002 | PH-05 | AC-ORG-003 | Recorded |
| REQ-ORG-004 | Locale, currency, fiscal, branding settings | M02 | WF-ORG-02 | ORG-ADMIN | ENT-TenantSetting | SEC-002 | PH-05 | AC-ORG-004 | Recorded |
| REQ-ORG-005 | Multi-industry organisation support | M02, M04 | WF-IND-02 | ORG-ADMIN | ENT-TenantIndustry | SEC-002 | PH-24 | AC-ORG-005 | Recorded |
| REQ-ORG-006 | Organisation-level audit trail | M20 | all | ORG-ADMIN, AUDITOR | ENT-AuditEvent | SEC-006 | PH-10 | AC-ORG-006 | Recorded |
| REQ-IAM-001 | Application opens on authentication | M03 | WF-IAM-01 | all | ENT-Session | SEC-002 | PH-05 | AC-IAM-001 | Recorded |
| REQ-IAM-002 | Sign-in methods with MFA readiness | M03 | WF-IAM-01 | all | ENT-Credential, ENT-Session | SEC-002 | PH-05 | AC-IAM-002 | Recorded |
| REQ-IAM-003 | Secure session management | M03 | WF-IAM-01 | all | ENT-Session | SEC-002 | PH-05 | AC-IAM-003 | Recorded |
| REQ-IAM-004 | Invitations and membership lifecycle | M03 | WF-IAM-01, WF-IAM-03 | ORG-ADMIN | ENT-Membership, ENT-Invitation | SEC-003 | PH-05 | AC-IAM-004 | Recorded |
| REQ-IAM-005 | Role catalogue and custom roles | M03 | WF-IAM-02 | ORG-ADMIN | ENT-Role, ENT-RolePermission | SEC-003 | PH-05 | AC-IAM-005 | Recorded |
| REQ-IAM-006 | Server-side permission enforcement | M03 | all | all | ENT-Permission | SEC-002 | PH-05 | AC-IAM-006 | Recorded |
| REQ-IAM-007 | Data scopes: tenant, branch, dept, own | M03 | all | all | ENT-DataScope | SEC-001 | PH-05 | AC-IAM-007 | Recorded |
| REQ-IAM-008 | Multi-role users and separation of duties | M03, M21 | WF-IAM-02, WF-SAL-03 | ORG-ADMIN, GM | ENT-RoleAssignment | SEC-003 | PH-09 | AC-IAM-008 | Recorded |
| REQ-IND-001 | Searchable industry catalogue | M04 | WF-IND-01 | ORG-ADMIN | ENT-Industry | SEC-002 | PH-24 | AC-IND-001 | Recorded |
| REQ-IND-002 | Industry and sub-industry selection | M04 | WF-IND-02 | ORG-ADMIN | ENT-TenantIndustry | SEC-002 | PH-24 | AC-IND-002 | Recorded |
| REQ-IND-003 | Custom industry capture and review | M04 | WF-IND-01 | ORG-ADMIN, PLAT-ADMIN | ENT-CustomIndustryRequest | SEC-003 | PH-24 | AC-IND-003 | Recorded |
| REQ-IND-004 | Industry profiles drive configuration | M04 | WF-IND-02 | ORG-ADMIN | ENT-IndustryProfile | SEC-003 | PH-24 | AC-IND-004 | Recorded |
| REQ-IND-005 | Bounded custom fields | M04 | WF-ORG-01 | ORG-ADMIN | ENT-CustomField | SEC-005 | PH-08 | AC-IND-005 | Recorded |
| REQ-IND-006 | Reviewed industry extension mechanism | M04 | — | PLAT-ADMIN | ENT-Extension | SEC-003 | PH-24 | AC-IND-006 | Recorded |

---

## 3. CRM, sales and marketing

| Requirement | Description | Module | Workflow | Roles | Entities | Security | Phase | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-CRM-001 | Lead capture with source tracking | M05 | WF-CRM-01 | SALES-REP, SALES-MGR | ENT-Lead, ENT-LeadSource | SEC-002 | PH-11 | AC-CRM-001 | Recorded |
| REQ-CRM-002 | Contacts and companies | M05 | WF-CRM-01 | SALES-REP, SALES-MGR | ENT-Contact, ENT-Company | SEC-004 | PH-11 | AC-CRM-002 | Recorded |
| REQ-CRM-003 | Activities, follow-ups, communications | M05 | WF-CRM-04 | SALES-REP | ENT-Activity, ENT-Communication | SEC-004 | PH-11 | AC-CRM-003 | Recorded |
| REQ-CRM-004 | Duplicate detection and merge | M05 | WF-CRM-03 | SALES-MGR | ENT-DuplicateCandidate | SEC-006 | PH-11 | AC-CRM-004 | Recorded |
| REQ-CRM-005 | Lead ownership and assignment | M05 | WF-CRM-01 | SALES-MGR | ENT-Lead, ENT-DataScope | SEC-003 | PH-11 | AC-CRM-005 | Recorded |
| REQ-CRM-006 | Atomic lead conversion | M05, M06 | WF-CRM-02 | SALES-REP | ENT-Lead, ENT-Contact, ENT-Opportunity | SEC-002 | PH-11 | AC-CRM-006 | Recorded |
| REQ-CRM-007 | Segments and pipeline views | M05 | WF-SAL-01 | SALES-MGR | ENT-Segment | SEC-002 | PH-11 | AC-CRM-007 | Recorded |
| REQ-SAL-001 | Opportunities and pipeline stages | M06 | WF-SAL-01 | SALES-REP, SALES-MGR | ENT-Opportunity, ENT-PipelineStage | SEC-002 | PH-12 | AC-SAL-001 | Recorded |
| REQ-SAL-002 | Product catalogue and price books | M06 | WF-SAL-02 | SALES-MGR, FIN-MGR | ENT-Product, ENT-PriceBook | SEC-003 | PH-12 | AC-SAL-002 | Recorded |
| REQ-SAL-003 | Server-computed quotations with versions | M06 | WF-SAL-02 | SALES-REP, SALES-MGR | ENT-Quotation, ENT-QuotationLine | SEC-005 | PH-12 | AC-SAL-003 | Recorded |
| REQ-SAL-004 | Contracts and approvals | M06 | WF-SAL-04 | SALES-MGR, GM | ENT-Contract | SEC-006 | PH-12 | AC-SAL-004 | Recorded |
| REQ-SAL-005 | Orders and fulfilment handoff | M06 | WF-SAL-02 | SALES-MGR, OPS-MGR | ENT-SalesOrder | SEC-002 | PH-12 | AC-SAL-005 | Recorded |
| REQ-SAL-006 | Discount guardrails and approval | M06, M21 | WF-SAL-03 | SALES-MGR, GM | ENT-DiscountPolicy | SEC-003 | PH-12 | AC-SAL-006 | Recorded |
| REQ-SAL-007 | Sales performance reporting | M06, M16 | WF-BI-02 | SALES-MGR, GM | ENT-Metric | SEC-002 | PH-17 | AC-SAL-007 | Recorded |
| REQ-MKT-001 | Campaign management | M07 | WF-MKT-01 | MKT-MGR | ENT-Campaign | SEC-003 | PH-12 | AC-MKT-001 | Recorded |
| REQ-MKT-002 | Lead acquisition and attribution | M07 | WF-MKT-01 | MKT-MGR | ENT-CampaignTouch, ENT-Attribution | SEC-004 | PH-12 | AC-MKT-002 | Recorded |
| REQ-MKT-003 | Campaign performance and acquisition cost | M07, M16 | WF-BI-02 | MKT-MGR, GM | ENT-Metric | SEC-002 | PH-17 | AC-MKT-003 | Recorded |
| REQ-MKT-004 | Consent and contactability enforcement | M07 | WF-MKT-02 | MKT-MGR | ENT-Consent | SEC-004 | PH-12 | AC-MKT-004 | Recorded |
| REQ-MKT-005 | Campaign metrics into BI registry | M07, M16 | WF-BI-01 | MKT-MGR | ENT-Metric | SEC-002 | PH-17 | AC-MKT-005 | Recorded |

---

## 4. Finance, inventory and procurement

| Requirement | Description | Module | Workflow | Roles | Entities | Security | Phase | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-FIN-001 | Chart of accounts and fiscal configuration | M08 | WF-FIN-04 | FIN-MGR, ACCT | ENT-Account, ENT-FiscalPeriod | SEC-006 | PH-13 | AC-FIN-001 | Recorded |
| REQ-FIN-002 | Invoices and receivables, immutable when posted | M08 | WF-FIN-01 | ACCT, FIN-MGR | ENT-Invoice, ENT-InvoiceLine | SEC-006 | PH-13 | AC-FIN-002 | Recorded |
| REQ-FIN-003 | Payments, allocation and reconciliation | M08 | WF-FIN-02 | ACCT | ENT-Payment, ENT-PaymentAllocation | SEC-006 | PH-13 | AC-FIN-003 | Recorded |
| REQ-FIN-004 | Expenses with approval | M08, M21 | WF-FIN-03 | ACCT, FIN-MGR | ENT-Expense | SEC-003 | PH-13 | AC-FIN-004 | Recorded |
| REQ-FIN-005 | Budgets and variance | M08 | WF-FIN-04 | FIN-MGR, GM | ENT-Budget | SEC-002 | PH-13 | AC-FIN-005 | Recorded |
| REQ-FIN-006 | Supplier bills and payables | M08, M10 | WF-PRC-03 | ACCT | ENT-Bill | SEC-006 | PH-13 | AC-FIN-006 | Recorded |
| REQ-FIN-007 | Cash flow and financial statements | M08 | WF-FIN-04 | FIN-MGR, OWNER | ENT-FinancialReport, ENT-JournalEntry | SEC-004 | PH-13 | AC-FIN-007 | Recorded |
| REQ-FIN-008 | Tenant-confirmed tax configuration | M08 | WF-FIN-01 | FIN-MGR | ENT-TaxCode | SEC-006 | PH-13 | AC-FIN-008 | Recorded |
| REQ-INV-001 | Products, variants and SKUs | M09 | WF-INV-01 | INV-OFF | ENT-Product, ENT-ProductVariant | SEC-002 | PH-14 | AC-INV-001 | Recorded |
| REQ-INV-002 | Warehouses and stock locations | M09 | WF-INV-01 | INV-OFF, OPS-MGR | ENT-Warehouse, ENT-StockLocation | SEC-002 | PH-14 | AC-INV-002 | Recorded |
| REQ-INV-003 | Movements with valuation | M09 | WF-INV-01 | INV-OFF | ENT-StockMovement, ENT-StockLevel | SEC-006 | PH-14 | AC-INV-003 | Recorded |
| REQ-INV-004 | Reorder rules and alerts | M09 | WF-INV-03 | INV-OFF, PRC-OFF | ENT-ReorderRule | SEC-002 | PH-14 | AC-INV-004 | Recorded |
| REQ-INV-005 | Counts and approved adjustments | M09 | WF-INV-02 | INV-OFF, OPS-MGR | ENT-StockCount, ENT-StockCountLine | SEC-003 | PH-14 | AC-INV-005 | Recorded |
| REQ-INV-006 | Inventory analytics | M09, M16 | WF-BI-02 | OPS-MGR | ENT-Metric | SEC-002 | PH-17 | AC-INV-006 | Recorded |
| REQ-PRC-001 | Supplier registry and qualification | M10 | WF-PRC-01 | PRC-OFF | ENT-Supplier | SEC-004 | PH-14 | AC-PRC-001 | Recorded |
| REQ-PRC-002 | Purchase requests with approval | M10, M21 | WF-PRC-01 | PRC-OFF, OPS-MGR | ENT-PurchaseRequest | SEC-003 | PH-14 | AC-PRC-002 | Recorded |
| REQ-PRC-003 | Purchase orders and receiving | M10, M09 | WF-PRC-02 | PRC-OFF, INV-OFF | ENT-PurchaseOrder, ENT-GoodsReceipt | SEC-005 | PH-14 | AC-PRC-003 | Recorded |
| REQ-PRC-004 | Three-way match before payment | M10, M08 | WF-PRC-03 | ACCT, PRC-OFF | ENT-MatchResult | SEC-006 | PH-14 | AC-PRC-004 | Recorded |
| REQ-PRC-005 | Supplier performance analytics | M10, M16 | WF-BI-02 | PRC-OFF, OPS-MGR | ENT-Metric | SEC-002 | PH-17 | AC-PRC-005 | Recorded |
| REQ-PRC-006 | End-to-end procure-to-pay | M10 | WF-PRC-01..03 | PRC-OFF, ACCT | ENT-ProcurementCase | SEC-006 | PH-14 | AC-PRC-006 | Recorded |

---

## 5. Projects, workforce, support, documents, strategy

| Requirement | Description | Module | Workflow | Roles | Entities | Security | Phase | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-PRJ-001 | Projects and deliverables | M11 | WF-PRJ-01 | PM, GM | ENT-Project, ENT-Deliverable | SEC-002 | PH-15 | AC-PRJ-001 | Recorded |
| REQ-PRJ-002 | Tasks, milestones and dependencies | M11 | WF-PRJ-02 | PM, PM-MEMBER | ENT-Task, ENT-Milestone | SEC-002 | PH-15 | AC-PRJ-002 | Recorded |
| REQ-PRJ-003 | Resource assignment and utilisation | M11, M12 | WF-WFM-02 | PM | ENT-Assignment | SEC-002 | PH-15 | AC-PRJ-003 | Recorded |
| REQ-PRJ-004 | Project budget, cost and profitability | M11, M08 | WF-PRJ-03 | PM, FIN-MGR | ENT-ProjectCost | SEC-004 | PH-15 | AC-PRJ-004 | Recorded |
| REQ-PRJ-005 | Recurring operational workflows | M11 | WF-PRJ-02 | PM, OPS-MGR | ENT-RecurringWorkflow | SEC-002 | PH-15 | AC-PRJ-005 | Recorded |
| REQ-PRJ-006 | Project status reporting and approvals | M11, M16 | WF-BI-02 | PM, GM | ENT-Metric | SEC-002 | PH-18 | AC-PRJ-006 | Recorded |
| REQ-WFM-001 | Employee records and status | M12 | WF-WFM-01 | HR-MGR | ENT-Employee | SEC-004 | PH-15 | AC-WFM-001 | Recorded |
| REQ-WFM-002 | Positions and responsibilities | M12 | WF-WFM-01 | HR-MGR | ENT-Position | SEC-004 | PH-15 | AC-WFM-002 | Recorded |
| REQ-WFM-003 | Capacity and allocation | M12, M11 | WF-WFM-02 | HR-MGR, PM | ENT-Capacity | SEC-002 | PH-15 | AC-WFM-003 | Recorded |
| REQ-WFM-004 | Workforce reporting with sensitive controls | M12, M16 | WF-BI-02 | HR-MGR, GM | ENT-Metric | SEC-004 | PH-18 | AC-WFM-004 | Recorded |
| REQ-WFM-005 | Site and field assignments | M12 | WF-WFM-02 | HR-MGR, OPS-MGR | ENT-SiteAssignment | SEC-004 | PH-15 | AC-WFM-005 | Recorded |
| REQ-SUP-001 | Case intake, assignment and resolution | M13 | WF-SUP-01 | SUP-AGENT | ENT-Case | SEC-002 | PH-15 | AC-SUP-001 | Recorded |
| REQ-SUP-002 | SLA tracking and escalation | M13 | WF-SUP-02 | SUP-AGENT, GM | ENT-SlaPolicy | SEC-006 | PH-15 | AC-SUP-002 | Recorded |
| REQ-SUP-003 | Service history per customer | M13, M05 | WF-SUP-01 | SUP-AGENT | ENT-ServiceRecord | SEC-004 | PH-15 | AC-SUP-003 | Recorded |
| REQ-SUP-004 | Internal knowledge base | M13 | WF-SUP-01 | SUP-AGENT | ENT-Article | SEC-004 | PH-15 | AC-SUP-004 | Recorded |
| REQ-SUP-005 | Satisfaction and retention signals | M13, M16 | WF-BI-02 | SUP-AGENT, GM | ENT-Feedback | SEC-004 | PH-18 | AC-SUP-005 | Recorded |
| REQ-DOC-001 | Document storage and versioning | M14 | WF-INT-02 | all | ENT-Document | SEC-004 | PH-10 | AC-DOC-001 | Recorded |
| REQ-DOC-002 | Attachments on any record | M14 | WF-INT-02 | all | ENT-Attachment | SEC-004 | PH-10 | AC-DOC-002 | Recorded |
| REQ-DOC-003 | In-app and email notifications | M14 | WF-SUP-02 | all | ENT-Notification | SEC-004 | PH-10 | AC-DOC-003 | Recorded |
| REQ-DOC-004 | Retention and deletion controls | M14, M20 | — | ORG-ADMIN, AUDITOR | ENT-RetentionPolicy | SEC-004 | PH-10 | AC-DOC-004 | Recorded |
| REQ-DOC-005 | Unified communication timeline | M14 | WF-CRM-04 | SALES-REP, SUP-AGENT | ENT-TimelineEntry | SEC-004 | PH-10 | AC-DOC-005 | Recorded |
| REQ-STR-001 | Objectives and targets | M15 | WF-STR-01 | OWNER, GM | ENT-Objective | SEC-002 | PH-18 | AC-STR-001 | Recorded |
| REQ-STR-002 | KPIs bound to registered metrics | M15, M16 | WF-STR-01 | GM, FIN-MGR | ENT-Kpi, ENT-Metric | SEC-002 | PH-18 | AC-STR-002 | Recorded |
| REQ-STR-003 | Risk register | M15 | WF-STR-02 | GM, OWNER | ENT-Risk | SEC-002 | PH-18 | AC-STR-003 | Recorded |
| REQ-STR-004 | Performance review cycles | M15 | WF-STR-01 | GM, HR-MGR | ENT-Review | SEC-002 | PH-18 | AC-STR-004 | Recorded |
| REQ-STR-005 | Management reporting packs | M15, M16 | WF-BI-02 | OWNER, GM | ENT-ReportPack | SEC-004 | PH-18 | AC-STR-005 | Recorded |

---

## 6. Business intelligence

| Requirement | Description | Module | Workflow | Roles | Entities | Security | Phase | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-BI-001 | Canonical metric definition registry | M16 | WF-BI-01 | FIN-MGR, GM | ENT-Metric | SEC-006 | PH-17 | AC-BI-001 | Recorded |
| REQ-BI-002 | Single calculation path per metric | M16 | WF-BI-01 | all | ENT-MetricValue | SEC-002 | PH-17 | AC-BI-002 | Recorded |
| REQ-BI-003 | Role-aware dashboards | M16 | WF-BI-02 | all | ENT-Dashboard | SEC-002 | PH-18 | AC-BI-003 | Recorded |
| REQ-BI-004 | Permission-aware reports and exports | M16 | WF-BI-02 | GM, FIN-MGR, AUDITOR | ENT-Report | SEC-004 | PH-18 | AC-BI-004 | Recorded |
| REQ-BI-005 | Drill-down to source records | M16 | WF-BI-02 | GM, AUDITOR | ENT-DrillPath | SEC-001 | PH-18 | AC-BI-005 | Recorded |
| REQ-BI-006 | Data freshness and quality indicators | M16, M22 | WF-BI-02 | all | ENT-DataQualitySnapshot | SEC-002 | PH-18 | AC-BI-006 | Recorded |
| REQ-BI-007 | Trend and comparison analysis | M16 | WF-BI-02 | GM, FIN-MGR | ENT-Comparison | SEC-002 | PH-18 | AC-BI-007 | Recorded |
| REQ-BI-008 | Evidence links on every insight | M16, M18 | WF-INF-01 | all | ENT-Evidence | SEC-002 | PH-22 | AC-BI-008 | Recorded |

---

## 7. ML, inference and decision

| Requirement | Description | Module | Workflow | Roles | Entities | Security | Phase | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-ML-001 | Versioned datasets and features | M17 | WF-ML-01 | PLAT-ADMIN | ENT-Dataset, ENT-Feature | SEC-004 | PH-19 | AC-ML-001 | Recorded |
| REQ-ML-002 | Validation and leakage prevention | M17 | WF-ML-01 | PLAT-ADMIN | ENT-DataCheck | SEC-004 | PH-19 | AC-ML-002 | Recorded |
| REQ-ML-003 | Baselines, training and evaluation | M17 | WF-ML-01 | PLAT-ADMIN | ENT-ModelRun | SEC-006 | PH-20 | AC-ML-003 | Recorded |
| REQ-ML-004 | Model versioning and registry | M17 | WF-ML-01 | PLAT-ADMIN | ENT-ModelVersion | SEC-006 | PH-20 | AC-ML-004 | Recorded |
| REQ-ML-005 | Validated, authorised model serving | M17 | WF-ML-01 | all | ENT-Prediction | SEC-002 | PH-21 | AC-ML-005 | Recorded |
| REQ-ML-006 | Drift and quality monitoring | M17 | WF-ML-02 | PLAT-ADMIN | ENT-ModelMonitor | SEC-006 | PH-21 | AC-ML-006 | Recorded |
| REQ-INF-001 | Authorised context assembly and orchestration | M18 | WF-INF-01 | all | ENT-InferenceRun | SEC-001 | PH-22 | AC-INF-001 | Recorded |
| REQ-INF-002 | Deterministic rules before models | M18 | WF-INF-01 | GM, FIN-MGR | ENT-RuleEvaluation | SEC-003 | PH-22 | AC-INF-002 | Recorded |
| REQ-INF-003 | Evidence and provenance for claims | M18 | WF-INF-01 | all | ENT-Evidence | SEC-002 | PH-22 | AC-INF-003 | Recorded |
| REQ-INF-004 | Explicit uncertainty representation | M18 | WF-INF-01 | all | ENT-Uncertainty | SEC-002 | PH-22 | AC-INF-004 | Recorded |
| REQ-INF-005 | Ranked recommendations with approval | M18, M21 | WF-INF-02 | GM, FIN-MGR | ENT-Recommendation | SEC-003 | PH-22 | AC-INF-005 | Recorded |
| REQ-INF-006 | Only allow-listed actions execute | M18 | WF-INF-02 | GM | ENT-ActionExecution | SEC-003 | PH-22 | AC-INF-006 | Recorded |
| REQ-INF-007 | Outcome measurement and feedback | M18 | WF-INF-03 | GM, FIN-MGR | ENT-Outcome | SEC-006 | PH-23 | AC-INF-007 | Recorded |

---

## 8. Integrations, marketplace, data governance

| Requirement | Description | Module | Workflow | Roles | Entities | Security | Phase | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-INT-001 | Integration registry and encrypted credentials | M19 | WF-INT-01 | ORG-ADMIN | ENT-Integration, ENT-IntegrationCredential | SEC-008 | PH-24 | AC-INT-001 | Recorded |
| REQ-INT-002 | Durable, observable background jobs | M19 | WF-INT-02 | PLAT-ADMIN | ENT-Job, ENT-JobRun | SEC-006 | PH-10 | AC-INT-002 | Recorded |
| REQ-INT-003 | Signed webhooks and event contracts | M19 | WF-INT-03 | ORG-ADMIN | ENT-Webhook, ENT-Event | SEC-005 | PH-24 | AC-INT-003 | Recorded |
| REQ-INT-004 | Import and export tooling | M19 | WF-INT-02 | ORG-ADMIN | ENT-ImportJob | SEC-004 | PH-24 | AC-INT-004 | Recorded |
| REQ-INT-005 | Timeouts, retries and failure isolation | M19 | WF-INT-03 | PLAT-ADMIN | ENT-IntegrationLog | SEC-006 | PH-24 | AC-INT-005 | Recorded |
| REQ-MDP-001 | Governed participation and legal basis | M23 | — | OWNER | ENT-MarketplaceConsent | SEC-004 | Post-26 | AC-MDP-001 | Recorded |
| REQ-MDP-002 | Aggregation and re-identification protection | M23 | — | PLAT-ADMIN | ENT-AggregateDataset | SEC-004 | Post-26 | AC-MDP-002 | Recorded |
| REQ-MDP-003 | Marketplace access controls and audit | M23 | — | PLAT-ADMIN | ENT-MarketplaceAccess | SEC-006 | Post-26 | AC-MDP-003 | Recorded |
| REQ-DATA-001 | Schema-first modelling and reviewed migrations | all | — | PLAT-ADMIN | all | SEC-006 | PH-08 | AC-DATA-001 | Recorded |
| REQ-DATA-002 | Tenant ownership on every tenant table | all | — | all | all | SEC-001 | PH-08 | AC-DATA-002 | Recorded |
| REQ-DATA-003 | Referential integrity and state constraints | all | — | all | ENT-WorkflowState | SEC-005 | PH-08 | AC-DATA-003 | Recorded |
| REQ-DATA-004 | Quality rules and exception handling | M22 | — | ORG-ADMIN | ENT-QualityRule, ENT-QualityException | SEC-002 | PH-16 | AC-DATA-004 | Recorded |
| REQ-DATA-005 | Retention, export and deletion | M22, M20 | — | ORG-ADMIN, AUDITOR | ENT-RetentionPolicy, ENT-ExportPackage | SEC-004 | PH-10 | AC-DATA-005 | Recorded |

---

## 9. Security, operations and UX

| Requirement | Description | Module | Workflow | Roles | Entities | Security | Phase | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-SEC-001 | Structural tenant isolation | all | all | all | all | SEC-001 | PH-05 | AC-SEC-001 | Recorded |
| REQ-SEC-002 | Server-side authorisation everywhere | all | all | all | ENT-Permission | SEC-002 | PH-09 | AC-SEC-002 | Recorded |
| REQ-SEC-003 | Least privilege and default deny | M03 | all | all | ENT-RolePermission | SEC-003 | PH-05 | AC-SEC-003 | Recorded |
| REQ-SEC-004 | Sensitive data classification and protection | M20 | — | AUDITOR | ENT-AccessEvent | SEC-004 | PH-10 | AC-SEC-004 | Recorded |
| REQ-SEC-005 | Input validation and output safety | all | all | all | — | SEC-005 | PH-09 | AC-SEC-005 | Recorded |
| REQ-SEC-006 | Immutable audit of critical operations | M20 | all | AUDITOR | ENT-AuditEvent | SEC-006 | PH-10 | AC-SEC-006 | Recorded |
| REQ-SEC-007 | AI prompt-injection and tool defences | M18 | WF-INF-01 | all | ENT-InferenceRun | SEC-007 | PH-22 | AC-SEC-007 | Recorded |
| REQ-SEC-008 | Secrets management, no secrets in source | M19 | WF-INT-01 | PLAT-ADMIN | ENT-IntegrationCredential | SEC-008 | PH-03 | AC-SEC-008 | Recorded |
| REQ-OPS-001 | Automated test coverage of critical paths | all | — | — | — | SEC-006 | PH-03 | AC-OPS-001 | Recorded |
| REQ-OPS-002 | CI/CD with migration gates | all | — | — | — | SEC-006 | PH-03 | AC-OPS-002 | Recorded |
| REQ-OPS-003 | Backups and tested restore | all | — | PLAT-ADMIN | — | SEC-006 | PH-26 | AC-OPS-003 | Recorded |
| REQ-OPS-004 | Monitoring, logging and alerting | all | — | PLAT-ADMIN | ENT-SystemEvent | SEC-006 | PH-10 | AC-OPS-004 | Recorded |
| REQ-OPS-005 | Incident response and runbooks | all | — | PLAT-ADMIN | — | SEC-006 | PH-26 | AC-OPS-005 | Recorded |
| REQ-UX-001 | Navy/blue design language and tokens | all | — | — | — | SEC-005 | PH-04 | AC-UX-001 | Recorded |
| REQ-UX-002 | Authentication-first entry | M03 | WF-IAM-01 | all | — | SEC-002 | PH-05 | AC-UX-002 | Recorded |
| REQ-UX-003 | WCAG 2.2 AA accessibility | all | — | — | — | — | PH-07 | AC-UX-003 | Recorded |
| REQ-UX-004 | Complete screen inventory per module | all | — | — | — | — | PH-04 | AC-UX-004 | Recorded |
| REQ-UX-005 | Loading, empty, error, success, disabled states | all | — | — | — | — | PH-07 | AC-UX-005 | Recorded |
| REQ-UX-006 | Responsive layouts from 360 px | all | — | — | — | — | PH-06 | AC-UX-006 | Recorded |
| REQ-UX-007 | Contextual, skippable onboarding | M02 | WF-ORG-01 | all | — | — | PH-05 | AC-UX-007 | Recorded |

---

## 10. Non-functional requirements

| Requirement | Description | Module | Workflow | Roles | Entities | Security | Phase | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFR-001 | p95 < 2.5 s interactive response at 1,000 users | all | — | all | — | — | PH-25 | AC-NFR-001 | Recorded |
| NFR-002 | p95 < 4 s dashboard over 24 months | M16 | WF-BI-02 | all | ENT-MetricValue | — | PH-25 | AC-NFR-002 | Recorded |
| NFR-003 | 99.9% monthly availability | all | — | all | — | — | PH-26 | AC-NFR-003 | Recorded |
| NFR-004 | 1,000 tenants / 100,000 users without redesign | all | — | all | — | — | PH-25 | AC-NFR-004 | Recorded |
| NFR-005 | RPO 15 min / RTO 4 h | all | — | PLAT-ADMIN | — | SEC-006 | PH-26 | AC-NFR-005 | Recorded |
| NFR-006 | WCAG 2.2 AA conformance | all | — | all | — | — | PH-25 | AC-NFR-006 | Recorded |
| NFR-007 | Current and previous browser versions; 360 px | all | — | all | — | — | PH-25 | AC-NFR-007 | Recorded |
| NFR-008 | No cross-tenant read or write path | all | — | all | — | SEC-001 | PH-25 | AC-NFR-008 | Recorded |
| NFR-009 | 100% audit coverage of critical changes | M20 | all | AUDITOR | ENT-AuditEvent | SEC-006 | PH-25 | AC-NFR-009 | Recorded |
| NFR-010 | Correlation ID across request, job, integration, inference | all | all | PLAT-ADMIN | ENT-SystemEvent | SEC-006 | PH-10 | AC-NFR-010 | Recorded |
| NFR-011 | Strict TypeScript, no `any`, enforced boundaries | all | — | — | — | — | PH-03 | AC-NFR-011 | Recorded |
| NFR-012 | Multi-currency, timezone and locale readiness | all | — | all | ENT-TenantSetting | — | PH-05 | AC-NFR-012 | Recorded |

---

## 11. Coverage checks

| Check | Result |
| --- | --- |
| Every functional requirement has a module | Yes — 145/145 |
| Every functional requirement has a phase | Yes — 145/145 |
| Every functional requirement has acceptance criteria | Yes — 145/145 |
| Every requirement has a security reference | 138/145 (7 are non-security UX/ops items) |
| Every module in `MODULE_AND_FEATURE_INVENTORY.md` appears | Yes — M01–M23 |
| Every workflow in `BUSINESS_WORKFLOW_CATALOG.md` is referenced | Yes |
| Approved requirements | 0 |
| Implemented requirements | 0 |
| Verified requirements | 0 |

## 12. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial matrix covering 145 FR + 12 NFR. |
