# ONO — Data Architecture Plan

| Field | Value |
| --- | --- |
| Document | Data Architecture Plan |
| Stage | 2 — Architecture and technical contracts |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — logical data architecture; **no schema, table or migration is created** |
| Scope | Data domains, ownership, planes, lineage, lifecycle, retention and reproducibility |
| Supersedes | Extends `DATABASE_AND_DATA_DOMAIN_PLAN.md` (Stage 1). The Stage 1 entity catalogue remains the entity list; this document adds domain ownership and data-plane separation |
| Related | `MODULE_DEPENDENCY_MAP.md`, `TENANCY_AND_AUTHORIZATION_ARCHITECTURE.md`, `API_AND_EVENT_CONTRACTS.md` |

---

## 1. Purpose

The Stage 1 database plan answered "which entities exist?". This document answers
four harder questions:

1. **Who owns each domain** — one writer, one authority.
2. **Which data plane it lives in** — operational truth is not mixed with derived
   analytics, training data, model artefacts or inference results.
3. **How data moves and is traced** — lineage from source to metric to model to
   recommendation.
4. **How it is corrected, retained and deleted** — without destroying auditability.

**Explicit non-goal:** this is not a physical schema. Column types, indexes and
migrations are PH-08. No `prisma/schema.prisma` change is authorised here.

---

## 2. Data principles

| ID | Principle | Consequence |
| --- | --- | --- |
| DA-01 | One writer per entity | Only the owning module mutates its tables (`MD-06`) |
| DA-02 | Tenant is structural | `tenantId` on every tenant-owned row; no global business tables |
| DA-03 | Operational truth is never edited by analytics | Analytics computes from source; it does not write back |
| DA-04 | Derived data is reproducible | A metric, dataset or prediction can be traced to source versions |
| DA-05 | Immutable financial and audit history | Correction by reversal or new event |
| DA-06 | Events carry facts, not payload dumps | Consumers fetch authorized detail |
| DA-07 | Personal data is minimised | Collect only what the workflow requires |
| DA-08 | Classification is per field | Drives masking, export, logging and retention |
| DA-09 | Deletion is evidenced | Counts, scope and time are retained without the content |
| DA-10 | Backups are not a query surface | Restore is controlled and audited |
| DA-11 | Model artefacts are content-addressed | Hash identifies exactly what was served |
| DA-12 | No cross-tenant pooling without governance | `OD-026` is unresolved; default is tenant-scoped |

---

## 3. The six data planes

| Plane | Purpose | Contents | Store | Write authority | Rebuildable? |
| --- | --- | --- | --- | --- | --- |
| **P1 Operational** | System of record | Tenants, identity, CRM, sales, finance, inventory, procurement, projects, workforce, support, documents, configuration | PostgreSQL primary | Owning module services only | No — it is the source of truth |
| **P2 Derived analytics** | Trusted calculations | Metric definitions and values, dashboards, reports, quality snapshots, freshness | PostgreSQL (materialised), later replica/OLAP | Metric/calculation services only | Yes — from P1 + definitions |
| **P3 Training data** | Reproducible model inputs | Dataset snapshots, feature definitions, manifests, checks | Object storage + registry tables | Data pipeline only | Yes — from P1/P2 + snapshot manifest |
| **P4 Model artefacts** | What was trained and approved | Weights/artefacts, model cards, evaluation reports | Object storage + registry tables | Registry only | No — artefact is the record |
| **P5 Inference results** | What was predicted and decided | Predictions, evidence, insights, recommendations, approvals, outcomes | PostgreSQL | Inference/decision services only | Partly — predictions can be recomputed; decisions are historical facts |
| **P6 Governance** | Evidence and control | Audit, access events, outbox, idempotency, retention, lineage, marketplace governance | PostgreSQL append-only + separate access path | Write-once services; no application updates | No |

### 3.1 Plane rules

| ID | Rule |
| --- | --- |
| PL-01 | P2 never writes P1. A metric cannot "fix" a source record. |
| PL-02 | P3 is immutable once published. A new window is a new dataset version. |
| PL-03 | P4 is write-once per version; a model artefact is never overwritten. |
| PL-04 | P5 always records model version, dataset version and `asOf`. |
| PL-05 | P6 is append-only for the application role; no `UPDATE`/`DELETE` grants. |
| PL-06 | P1 and P5 are tenant-scoped; P3/P4 may be tenant-scoped or tenant-neutral only with governance approval. |
| PL-07 | P6 access is itself audited where it contains sensitive evidence. |
| PL-08 | A plane boundary is a trust boundary, not a folder convention. |

---

## 4. Data domains

Twenty domains. "Owner" is the only module allowed to write. "Consumers" are
anticipated readers, not permission grants.

| ID | Domain | Owner | Plane | Representative entities | Tenant scope | Sensitivity | Key relationships | Main consumers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DOM-01 | Tenant & organisation | M02 | P1 | Tenant, TenantSetting, Branch, Department, Team, Plan, Entitlement | Tenant | internal / confidential | Tenant → branches, departments, teams; plan → entitlements | All modules, M01, M16 |
| DOM-02 | Identity & access | M03 | P1/P6 | User, Credential, Session, Membership, Invitation, Role, RolePermission, RoleAssignment, DataScope, SupportGrant | Tenant + platform | confidential / **secret** (credentials) | User ↔ membership ↔ tenant; membership → roles → scopes | M01, M02, every entry point, M20 |
| DOM-03 | Industry & configuration | M04 | P1 | Industry, IndustryProfile, ProfileVersion, TenantIndustry, CustomIndustryRequest, CustomField, FieldSet, TerminologyOverride, WorkflowVariant, Extension, FeatureFlag | Platform catalogue + tenant selection | internal | Industry → profile; tenant → industries; profile → modules/metrics | M02, all modules, M16 |
| DOM-04 | CRM | M05 | P1 | Lead, LeadSource, Contact, Company, Activity, Communication, DuplicateCandidate, Segment, Consent | Tenant | confidential / restricted (personal data) | Company → contacts; lead → conversion; contact → consent | M06, M07, M13, M16, M18 |
| DOM-05 | Marketing | M07 | P1 | Campaign, CampaignTouch, Attribution, Audience | Tenant | confidential | Campaign → touches → attribution → conversion | M05, M06, M16 |
| DOM-06 | Catalogue & pricing | M06 | P1 | Product, ProductVariant, PriceBook, PriceListItem, DiscountPolicy | Tenant | internal / confidential (pricing) | Product → variant; price book → items; product → stock | M08, M09, M10, M16 |
| DOM-07 | Sales & commercial | M06 | P1 | Opportunity, PipelineStage, Quotation, QuotationLine, Contract, SalesOrder, SalesOrderLine | Tenant | confidential | Opportunity → quotation → order; order → invoice (event) | M05, M08, M09, M11, M16, M18 |
| DOM-08 | Finance | M08 | P1/P6 | Account, FiscalPeriod, TaxCode, Invoice, InvoiceLine, Payment, PaymentAllocation, Expense, Budget, Bill, JournalEntry, JournalLine, FinancialReport | Tenant | **restricted** | Invoice → allocation; bill → match; journal lines balance | M06, M09, M10, M11, M16, M20 |
| DOM-09 | Inventory | M09 | P1 | Warehouse, StockLocation, StockMovement, StockLevel, StockCount, StockCountLine, ReorderRule | Tenant / branch | internal / confidential (cost) | Product → movement; movement → level; count → variance | M08, M10, M11, M16 |
| DOM-10 | Procurement | M10 | P1 | Supplier, PurchaseRequest, PurchaseRequestLine, PurchaseOrder, PurchaseOrderLine, GoodsReceipt, MatchResult | Tenant | confidential | Supplier → PO → receipt → match → bill | M08, M09, M16 |
| DOM-11 | Projects & operations | M11 | P1 | Project, Deliverable, Task, Milestone, Assignment, ProjectCost, RecurringWorkflow, SiteAssignment | Tenant | confidential | Project → task/milestone; assignment → capacity; milestone → invoice | M08, M12, M16 |
| DOM-12 | Workforce | M12 | P1 | Employee, Position, Capacity | Tenant | **restricted** (HR fields) | Employee → position; employee → capacity/assignment | M11, M16 |
| DOM-13 | Customer support | M13 | P1 | Case, SlaPolicy, ServiceRecord, Article, Feedback | Tenant | confidential | Case → contact/company; case → SLA; case → feedback | M05, M14, M16, M18 |
| DOM-14 | Documents & communications | M14 | P1 + object storage | Document, Attachment, Notification, TimelineEntry | Tenant | confidential / restricted | Document → attachment → record; notification → user | All modules, M20 |
| DOM-15 | Strategy & performance | M15 | P1 | Objective, Kpi, Risk, Review | Tenant | confidential | Objective → metric; KPI → metric; review → period | M02, M16 |
| DOM-16 | Audit, approvals & platform operations | M20, M21, M19 | P1/P6 | AuditEvent, AccessEvent, SystemEvent, ApprovalPolicy, ApprovalRequest, ApprovalDecision, Escalation, Job, JobRun, Integration, IntegrationCredential, Webhook, EventOutbox, IdempotencyKey, RetentionPolicy | Tenant + platform | restricted / **secret** (credentials) | Audit → actor/target; approval → subject version; job → tenant | M01, all modules, M18 |
| DOM-17 | Analytics & metrics | M16 | P2 | Metric, MetricValue, Dashboard, Report, DataQualitySnapshot, Comparison, DrillPath, Evidence | Tenant (definitions platform) | internal / confidential | Metric → values; dashboard → metrics; report → filters | M15, M17, M18, M23 |
| DOM-18 | ML datasets & model artefacts | M17 | P3/P4 | Dataset, Feature, DataCheck, ModelRun, ModelVersion, ModelMonitor | Tenant or governed global | restricted | Dataset → features; run → model version; version → artefact hash | M18, M20 |
| DOM-19 | Inference, decisions & outcomes | M18 | P5 | Prediction, InferenceRun, Insight, Recommendation, ActionExecution, Outcome | Tenant | confidential / restricted | Prediction → evidence; recommendation → approval; action → outcome | M16, M17, M21, M20 |
| DOM-20 | Marketplace governance | M23 | P6 (separate) | Participation, AggregationRelease, AccessGrant, PurposeBinding | Governed aggregate | internal (aggregated only) | Participation → release → access grant | Marketplace only |

### 4.1 Domain rules

| ID | Rule |
| --- | --- |
| DM-01 | A domain has exactly one owning module. Shared entities (e.g. Product) are owned once and referenced elsewhere. |
| DM-02 | Identity data is global to a user but membership and roles are tenant-scoped. |
| DM-03 | Configuration is data, not code; profiles and overrides are versioned (`ADR-029`, `ADR-030`). |
| DM-04 | Financial and audit domains are append-only where Stage 1 requires it. |
| DM-05 | Derived domains (17–19) never become the source of an operational fact. |
| DM-06 | A domain may be empty because a tenant disabled the module; that is not an error. |
| DM-07 | Industry extensions add entities inside their owning domain, never a new cross-cutting domain. |
| DM-08 | Marketplace data is not a join target for operational queries. |

---

## 5. Identity, tenancy and scope

| Concern | Rule |
| --- | --- |
| Tenant root | Every tenant-owned table carries a non-null `tenantId`; the tenant is the isolation root |
| User identity | A `User` is global; access exists only through a `Membership` |
| Membership | Unique `(tenantId, userId)`; status controls access; suspension revokes sessions |
| Roles | System roles are platform-defined; custom roles are tenant-owned and cannot exceed template ceilings |
| Scope | Stored per assignment; evaluated on every read/write; never cached beyond a short TTL |
| Platform staff | No implicit tenant access; support grant required and audited in the tenant log |
| Cross-tenant references | Never valid; a foreign key that could cross tenants must include `tenantId` in the constraint |
| Tenant deletion | Controlled lifecycle; export before purge; audit evidence retained |

Detailed enforcement: `TENANCY_AND_AUTHORIZATION_ARCHITECTURE.md`.

---

## 6. Data classification

Canonical labels (five, reconciling Stage 1 and Stage 2 — `CF-12`):

| Label | Examples | Masking | Export | Audit on read | Notes |
| --- | --- | --- | --- | --- | --- |
| `public` | Help text, published industry descriptions | None | Allowed | No | No tenant data |
| `internal` | Aggregated operational counts, configuration keys | None | Permission | No | Still tenant-scoped |
| `confidential` | Customer records, contracts, pricing, cases | List masking where configured | Permission + log | Sensitive reads | Most business data |
| `restricted` | Financial postings, employee sensitive fields, recommendations with personal evidence | Masked by default | Explicit grant + re-auth where configured | Yes | Higher control |
| `secret` | Credentials, API keys, tokens | Never displayed | Never | Yes (metadata only) | Never a business record class |

| Rule | Detail |
| --- | --- |
| CL-01 | Classification is declared per field, not per table only |
| CL-02 | The highest field class determines the record's effective class |
| CL-03 | Logs never contain `confidential`, `restricted` or `secret` content |
| CL-04 | Analytics output inherits the highest class of its inputs unless aggregated and suppressed |
| CL-05 | Model training data must not exceed the classification approved for the use case |
| CL-06 | Misclassification is a security defect, not a documentation issue |

---

## 7. Data lineage

### 7.1 Lineage model

Lineage is recorded as directed edges from a produced artefact to its inputs and
transform version. It is metadata, not a copy of the data.

```
Operational record (P1)
   └── event / change
        └── metric definition vN + metric value (P2)
             ├── dashboard / report (P2)
             ├── dataset snapshot vN (P3)
             │     └── feature set vN → training run vN
             │           └── model version vN (P4)
             └── inference run (P5)
                   ├── prediction + evidence
                   ├── recommendation vN
                   ├── approval decision
                   └── action → outcome
```

### 7.2 Lineage requirements

| ID | Requirement |
| --- | --- |
| LIN-01 | A metric value records metric ID, metric version, period, dimensions, computation time and source snapshot boundary |
| LIN-02 | A dataset records its source queries/events, window, row count, schema and content hash |
| LIN-03 | A model version records dataset version, feature versions, training code version, hyperparameters and artefact hash |
| LIN-04 | A prediction records model version, dataset version, `asOf`, input hash and serving time |
| LIN-05 | A recommendation records every evidence reference and the model/metric versions used |
| LIN-06 | An outcome records the pre-registered baseline, window and measurement method |
| LIN-07 | Lineage can be traversed in both directions: "where did this number come from?" and "what used this record?" |
| LIN-08 | Lineage survives correction: a superseded value keeps its lineage and points to its replacement |

### 7.3 Lineage example

A dashboard shows gross margin of 31.4% for September:

1. `MetricValue` row: `MET-GROSS-MARGIN`, version 3, period 2026-09, branch `br_01`.
2. Metric definition version 3 defines formula and sources.
3. Sources are invoice lines and inventory movements within the tenant and period.
4. The materialisation run records the source high-water mark and completion time.
5. If the value is disputed, the drill path opens the contributing records under
   the viewer's own scope.

No layer is allowed to present the number without its period, scope, metric
version and freshness (`AP-12`).

---

## 8. Analytics data (P2)

| Concern | Rule |
| --- | --- |
| Metric registry | One definition per metric code; versioned; owner assigned |
| Calculation modes | `materialised` or `on_read`, declared per metric (`ADR-008`) |
| Materialisation | Worker process; tenant-scoped; records freshness and source boundary |
| Read replica | Introduced at PH-16 for heavy reads; lag surfaced as freshness (`ADR-027`) |
| Dashboards | Read metric values; never compute a KPI locally (`AC-17-01`) |
| Drill-down | Re-authorizes each record; aggregates never reveal denied rows |
| Suppression | Small cohorts are suppressed, not zeroed |
| Snapshots | Report/export snapshots record metric versions and filters |
| Warehouse | Deferred until measured need (`OD-040`) |

---

## 9. Training data (P3) and model artefacts (P4)

### 9.1 Datasets

| Rule | Detail |
| --- | --- |
| Versioning | Immutable; new window or schema = new version |
| Hash | Content hash over the manifest and data files |
| Manifest | Source, window, row count, schema, feature list, exclusions, class distribution |
| Tenant scope | A dataset belongs to one tenant unless a governance decision permits pooling |
| Personal data | Minimised; identifiers replaced with internal keys |
| Labels | Explicitly defined, with derivation time and leakage check |
| Validation | Schema, range, missingness, leakage, label quality (`ENT-DataCheck`) |
| Minimum data | Enforced before training (`AI_ML...` §2.3) |
| Deletion | Purge with a provenance record; a deleted dataset cannot be silently recreated with the same version |

### 9.2 Model artefacts

| Rule | Detail |
| --- | --- |
| Content addressed | Artefact key includes the hash; overwrite is prohibited |
| Registry state | `proposed → data_ready → trained → evaluated → approved → deployed → monitored → retired` |
| Model card | Intended use, limitations, prohibited use, metrics by segment, owner |
| Approval | Separate from training (`SOD-5`) |
| Serving pin | A deployed model version is explicit; "latest" is prohibited |
| Retirement | Dependent insights are re-labelled; artefact retained per policy |

---

## 10. Inference results, decisions and outcomes (P5)

| Entity | Nature | Provenance | Retention |
| --- | --- | --- | --- |
| `Prediction` | Derived estimate | Model version, dataset version, `asOf`, input hash | Per model lifecycle; purge with provenance |
| `InferenceRun` | Execution record | Input scope, versions, duration, outcome | Audit retention |
| `Insight` | Published interpretation | Evidence refs, period, confidence | Business retention |
| `Recommendation` | Proposed action | Evidence, expected impact, confidence, assumptions | Business retention |
| `ApprovalRequest` / `Decision` | Human authority | Approver, version, reason, timestamp | Audit retention; immutable |
| `ActionExecution` | What actually ran | Recommendation version, approver, result | Audit retention |
| `Outcome` | Did it work | Baseline, window, method, confounders | Retained for model governance |

**Rules:** a prediction is never presented as a fact; a recommendation is never
presented as executed; an outcome is never presented as causal without a declared
method; an approval is always bound to the version it approved.

---

## 11. Audit, events and platform operations (P6)

| Concern | Rule |
| --- | --- |
| Audit | Append-only, written in the business transaction (`ADR-025`) |
| Outbox | Same transaction as the business change; dispatched at-least-once |
| Idempotency | Key + request hash + response; tenant-scoped; expiry per `OD-046` |
| Jobs | Status, attempts, lease, error, dead-letter; tenant context on every unit of work |
| Integration credentials | Encrypted, never logged, never returned, rotation recorded |
| Access events | Sensitive reads/exports recorded with purpose where configured |
| Retention | Policy-driven; legal hold suspends deletion and is itself audited |
| Lineage | Metadata edges; not a duplicate of the data |
| Marketplace | Separate schema/access path; no operational joins |

---

## 12. Key relationships and cardinalities

| Relationship | Cardinality | Integrity rule |
| --- | --- | --- |
| Tenant → Membership | 1 : N | A user reaches tenant data only through an active membership |
| Membership → RoleAssignment | 1 : N | Multiple roles allowed; effective grants are the union intersected with scope |
| Tenant → Branch | 1 : N | Archive, never delete |
| Company → Contact | 1 : N | Contact may exist without a company |
| Lead → Opportunity | 1 : 0..1 | Conversion is atomic; source lead retained |
| Opportunity → Quotation | 1 : N | Multiple versions; one accepted |
| Quotation → SalesOrder | 1 : 0..1 | Order references the accepted version |
| SalesOrder → Invoice | 1 : N | Partial billing allowed |
| Invoice → PaymentAllocation | 1 : N | Sum ≤ invoice balance |
| PurchaseOrder → GoodsReceipt | 1 : N | Partial receipts |
| Bill → MatchResult | 1 : 1 | Match required before payment approval |
| Project → Task | 1 : N | Task belongs to one project |
| Metric → MetricValue | 1 : N | Dimensioned by period and scope |
| Dataset → ModelVersion | 1 : N | A version may train multiple models; each records the dataset version |
| ModelVersion → Prediction | 1 : N | Every prediction names the version |
| Recommendation → ApprovalRequest | 1 : 1 | Version-bound |
| Recommendation → Outcome | 1 : 0..1 | Measured once per window |

---

## 13. Retention and deletion

### 13.1 Retention (proposed; requires approval)

| Data class | Default | Authority |
| --- | --- | --- |
| Financial records | 7 years or jurisdiction minimum | `OD-023` |
| Audit events | 7 years | `OD-023` |
| CRM contacts | Tenant policy; default 3 years after last activity | Tenant |
| Consent | Life of relationship + 2 years | Legal review |
| Documents | Per policy; legal hold overrides | Tenant + law |
| Operational logs | 90 days | Operations |
| Session records | 30 days after expiry | Security |
| Predictions | Model lifecycle; default 24 months | Model owner |
| Recommendations/outcomes | 3 years after outcome | Product |
| Datasets | Model lifecycle + 1 year | Data governance |
| Model artefacts | Life of model + 3 years | Model governance |
| Marketplace aggregates | Per marketplace policy | Separate programme |

### 13.2 Deletion

| ID | Rule |
| --- | --- |
| DEL-01 | A deletion request is scoped, authorized and audited |
| DEL-02 | Deletion evidence records counts, scope, timestamp and actor — never the deleted content |
| DEL-03 | Financial and audit records are not hard-deleted while retention applies |
| DEL-04 | Legal hold suspends deletion and is itself audited |
| DEL-05 | Derived data (metrics, predictions) is purged or recomputed when its source is deleted; lineage records the event |
| DEL-06 | Backups expire on schedule; a restored backup must re-apply deletion records before serving traffic |
| DEL-07 | Tenant offboarding exports data in a documented machine-readable format before purge |
| DEL-08 | Deletion of a dataset or model does not erase the audit trail of its use |

### 13.3 Correction

| Situation | Correct approach | Forbidden |
| --- | --- | --- |
| Wrong invoice amount, not posted | Edit within the draft state, audit the change | Silent overwrite |
| Posted financial error | Reversal + corrected entry | Update posted row |
| Wrong customer detail | Update with before/after audit | Delete and recreate |
| Wrong metric formula | New metric version; recompute; old values retain version | Mutating old values |
| Wrong dataset | New dataset version | Overwriting the old snapshot |
| Bad model | Suspend/retire; new version | Editing the deployed artefact |
| Wrong recommendation | New recommendation; mark prior as superseded | Rewriting history |
| Bad approval | New decision/revocation with reason | Deleting the decision |

---

## 14. Reproducibility

| Artefact | Required to reproduce |
| --- | --- |
| Metric value | Metric version, source boundary, period, dimensions, computation code version |
| Dataset | Source manifest, window, schema, feature versions, hash, extraction code version |
| Training run | Dataset version, hyperparameters, seed, code version, environment image, metrics |
| Model artefact | Content hash, framework version, model card |
| Prediction | Model version, dataset version, `asOf`, validated input hash |
| Inference run | Input scope, retrieved evidence IDs, rules version, model versions, prompt/template version |
| Recommendation | Evidence refs, ranking inputs, confidence, assumptions |
| Outcome | Baseline definition, measurement window, method, data snapshot |

**Rule:** if it cannot be reproduced from recorded references, it is not a
governed result. It may still be shown as a labelled estimate, never as audited truth.

---

## 15. Data quality and freshness

| Concern | Rule |
| --- | --- |
| Quality rules | Required fields, ranges, referential checks, timeliness, duplicates |
| Exception queue | Owned, prioritised, with resolution notes |
| Freshness | Every derived value carries `computedAt`, `asOf`, `isStale` |
| Stale presentation | A stale value is labelled; it is never shown as current (`AP-12`) |
| Completeness | Dashboards show coverage/exception counts, not just totals |
| Lineage | A metric must resolve to sources or it is not published |
| Insufficient data | A first-class state for analytics and ML, not an error to hide |

---

## 16. Indexing, partitioning and performance

| Need | Approach |
| --- | --- |
| Tenant-first access | Leading `tenantId` in composite indexes |
| Lists | `(tenantId, status, updatedAt)` per entity, plus keyset sort columns |
| Search | Trigram/full-text per measured need; never a default across all tables |
| Time series | `(tenantId, metricId, periodStart)` |
| Audit/outbox | Partition by time; retain according to policy |
| Stock movements | Partition by tenant/time when volume requires |
| Predictions | Partition by tenant/model/time when volume requires |
| JSONB | Only declared custom fields are indexed; no generic GIN on every payload |
| Reporting | Materialised views / registered queries; read replica at PH-16 |
| Large exports | Async job; streaming; never a single unbounded query |

---

## 17. Multi-tenancy and isolation

| Layer | Control |
| --- | --- |
| Schema | Shared schema; `tenantId` discriminator on every tenant-owned table |
| Composite keys | Uniqueness and foreign keys include `tenantId` where a cross-tenant reference is possible |
| Repository | Mandatory tenant predicate; a query without one is a defect |
| Database | RLS proposed as defence in depth (`OD-037`); validated against pooling (`RISK-018`) |
| Jobs | Explicit tenant context per unit of work; no global scan without paging |
| Caches | Tenant-namespaced keys; no shared entries |
| Object storage | Tenant-prefixed, non-guessable keys |
| Analytics | Scope-filtered; suppressed small cohorts |
| Backups | Whole-database; per-tenant restore is a logical export, not a database restore |
| Marketplace | Separate access path; no operational credentials |

---

## 18. Marketplace data (future, DOM-20)

Not designed for implementation. Governance constraints only:

| Constraint | Rule |
| --- | --- |
| Participation | Explicit opt-in, legal basis recorded, revocable |
| Data | Aggregated, suppressed, non-identifiable; no record-level export |
| k-anonymity | Minimum cohort threshold; suppression, not rounding to a small number |
| Purpose binding | Each access grant names a permitted purpose |
| Access | Separate credentials and separate schema; no operational joins at request time |
| Audit | Every query and release is audited |
| Prohibition | No sale or exposure of identifiable tenant or personal data, ever (`PR-10`) |
| Approval | Separate programme and legal review (`OD-025`) |

---

## 19. Phase mapping

| Phase | Data work |
| --- | --- |
| PH-02 | This plan accepted; domain ownership agreed |
| PH-05 | DOM-01/02/03 foundation; classification labels |
| PH-08 | Physical schema, constraints, tenant guard, RLS decision |
| PH-09 | Transaction boundaries and audit/outbox |
| PH-10 | P6 operations, storage, jobs |
| PH-11–15 | P1 domain tables one module at a time |
| PH-16 | P2 analytics schema, lineage, quality |
| PH-17–18 | Metric store, reports, freshness |
| PH-19 | P3 datasets and features |
| PH-20 | P4 registry and artefacts |
| PH-21 | P5 predictions |
| PH-22–23 | P5 recommendations, decisions, outcomes |
| PH-24 | DOM-03 profiles, entitlements, DOM-20 design only |
| PH-25–26 | Restore drills, retention verification, launch |

---

## 20. Open decisions

| ID | Question | Affects |
| --- | --- | --- |
| `OD-002` | PostgreSQL confirmation | Whole plan |
| `OD-004` | Prisma and SQL boundary | P1/P2 access |
| `OD-005` | Custom field storage | DOM-03 |
| `OD-015` | Custom field limits | DOM-03 |
| `OD-021` | Backup retention, RPO/RTO | P1/P6 |
| `OD-023` | Audit/financial retention | P1/P6 |
| `OD-026` | Cross-tenant pooled training | P3 |
| `OD-037` | RLS in v1 or later | P1 isolation |
| `OD-039` | Outbox retention/replay | P6 |
| `OD-040` | Warehouse/OLAP introduction | P2 |
| `OD-046` | Idempotency retention | P6 |

---

## 21. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Stage 2 data architecture: 20 domains, six planes, lineage, retention, deletion, correction, reproducibility. No schema created. |
