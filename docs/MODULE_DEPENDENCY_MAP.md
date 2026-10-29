# ONO — Module Dependency Map

| Field | Value |
| --- | --- |
| Document | Module Dependency Map |
| Stage | 2 — Architecture and technical contracts |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — dependency rules, not implemented |
| Scope | Ownership, allowed interactions, dependency direction, cycle prevention |
| Related | `SYSTEM_ARCHITECTURE.md` §5, `MODULE_AND_FEATURE_INVENTORY.md`, `DATA_ARCHITECTURE_PLAN.md` |

---

## 1. Why this document exists

A modular monolith fails in one of two ways: modules become a tangle, or they
become a distributed system inside one process. This map prevents both by fixing:

1. **who owns each kind of data** (one writer per entity);
2. **which direction code may depend** (a directed acyclic graph);
3. **how modules communicate** (service call, query contract, event, shared kernel);
4. **which cycles are known** and how they are broken.

The map is about **code dependencies**, not business relationships. Two modules
may exchange information in both directions while their code remains acyclic —
one direction uses an event or a consumer-owned read model.

---

## 2. Module ownership

| ID | Module | Owns (data domains) | Primary CMP | Phase |
| --- | --- | --- | --- | --- |
| M01 | Platform Administration | Plans, entitlements, support grants, platform flags, platform health | CMP-20 | PH-05, PH-24 |
| M02 | Organisation & Tenancy | Tenant, settings, branches, departments, teams, onboarding state | CMP-02 | PH-05 |
| M03 | Identity & Access Management | Users, credentials, sessions, memberships, invitations, roles, assignments, scopes | CMP-01, CMP-03 | PH-05 |
| M04 | Industry Configuration | Industry catalogue, profiles, tenant industry, custom industry requests, custom fields, terminology, workflow variants, extensions | CMP-02 (config) | PH-05, PH-24 |
| M05 | CRM | Leads, contacts, companies, activities, communications, duplicate candidates, segments, consent | CMP-04 | PH-11 |
| M06 | Sales & Commercial | Opportunities, pipelines, catalogue, price books, quotations, contracts, orders, discount policies | CMP-04 | PH-12 |
| M07 | Marketing | Campaigns, touches, attribution, audiences | CMP-04 | PH-12 |
| M08 | Finance | Accounts, periods, tax codes, invoices, payments, allocations, expenses, budgets, bills, journals, financial reports | CMP-04 | PH-13 |
| M09 | Inventory | Warehouses, locations, movements, levels, counts, reorder rules, valuation inputs | CMP-04 | PH-14 |
| M10 | Procurement | Suppliers, requests, purchase orders, receipts, three-way match | CMP-04 | PH-14 |
| M11 | Projects & Operations | Projects, deliverables, tasks, milestones, assignments, costs, recurring work, site assignments | CMP-04 | PH-15 |
| M12 | Workforce & HR | Employees, positions, capacity, sensitive HR fields | CMP-04 | PH-15 |
| M13 | Customer Support | Cases, SLA policies, service records, articles, feedback | CMP-04 | PH-15 |
| M14 | Documents & Communication | Documents, attachments, notifications, timeline entries | CMP-10, CMP-11 | PH-10, PH-15 |
| M15 | Strategy & Performance | Objectives, KPIs, risks, reviews | CMP-04, CMP-12 | PH-16 |
| M16 | Business Intelligence | Metric registry, metric values, dashboards, reports, drill paths, freshness, comparison | CMP-12 | PH-16–18 |
| M17 | AI & ML | Datasets, features, data checks, training runs, model versions, predictions, monitoring | CMP-13–16 | PH-19–21 |
| M18 | Inference Intelligence | Inference runs, evidence, insights, recommendations, outcomes, action executions | CMP-17–19 | PH-22–23 |
| M19 | Integrations & Jobs | Integration registry, credentials, jobs, job runs, webhooks, imports/exports | CMP-09 | PH-10, PH-24 |
| M20 | Audit & Compliance | Audit events, access events, system events, retention policy, compliance exports | CMP-08, CMP-21 | PH-10 |
| M21 | Approvals & Workflow | Approval policies, requests, decisions, escalations, workflow state definitions | CMP-05 | PH-09 |
| M22 | Data Quality & Governance | Quality rules, exceptions, lineage, data-quality snapshots, tenant export packages | CMP-12 (governance) | PH-16 |
| M23 | Data Marketplace (future) | Participation, aggregation releases, access grants, purpose bindings | CMP-22 | Post-PH-26 |

**Single-writer rule:** only the owning module writes its entities. Other modules
read through a published query contract, a consumer-owned projection, or an event.
No module performs an `UPDATE` on another module's tables.

---

## 3. Dependency classes

| Class | Direction | Mechanism | When allowed |
| --- | --- | --- | --- |
| **K — Kernel** | Everyone → kernel | Imported types and functions | Identity context, audit writer, policy evaluation, validation, config, observability |
| **S — Synchronous command** | Caller → callee service | In-process service interface | Caller needs a result before continuing and the callee owns the state |
| **Q — Query contract** | Consumer → producer | Read-only interface / published view | Consumer needs reference data; producer remains authoritative |
| **E — Event** | Producer → consumer | Transactional outbox | Consumer can proceed asynchronously; reverse flow is needed |
| **P — Projection** | Consumer owns a copy | Event-fed read model | Consumer needs fast local reads without owning truth |
| **F — Forbidden** | — | Deep import, direct table write, shared mutable state | Never |

### 3.1 Hard rules

| ID | Rule |
| --- | --- |
| MD-01 | Code dependencies form a DAG. A cycle is a build failure, not a discussion. |
| MD-02 | A module exposes exactly one public entrypoint (`src/features/<module>/index.ts` or `src/server/services/<module>/index.ts`). |
| MD-03 | Cross-module imports use the public entrypoint only. Deep imports are prohibited (`DEP-02`). |
| MD-04 | Kernel modules (M03 identity/policy, M20 audit, M19 job registration) never import business modules. |
| MD-05 | A business module never imports another module's repository or Prisma model. |
| MD-06 | A module never writes another module's tables, including in a "temporary" migration. |
| MD-07 | Reverse information flow uses an event or a consumer-owned projection, not a reverse code dependency. |
| MD-08 | Shared types live in `src/lib/contracts`; they contain no business logic and no database access. |
| MD-09 | `src/lib/permissions` is called, never reimplemented (`DEP-04`). |
| MD-10 | Shared UI components never import services or repositories (`DEP-05`). |
| MD-11 | Industry configuration changes module availability, never dependency direction. |
| MD-12 | A new cross-module dependency requires a PR note stating the class (S/Q/E/P) and why a kernel or event is insufficient. |

---

## 4. Dependency graph

```
                         ┌──────────────────────────────────────────┐
                         │  KERNEL (no business dependencies)        │
                         │  M03 identity + policy   M20 audit        │
                         │  M19 job registration    shared contracts │
                         └───────────────▲──────────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
   ┌────┴─────┐                    ┌─────┴─────┐                    ┌─────┴─────┐
   │ M04      │◄───────────────────│ M02       │───────────────────►│ M01       │
   │ Industry │  apply profile     │ Tenancy   │  tenant lifecycle  │ Platform  │
   └────┬─────┘                    └─────┬─────┘                    └─────┬─────┘
        │                                │                                │
        │                                │                                │
        │        ┌───────────────────────┴───────────────────────┐        │
        │        │                                               │        │
   ┌────▼────┐ ┌─▼─────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐│        │
   │ M14     │ │ M21   │   │ M05 CRM │──►│ M06     │   │ M07     ││        │
   │ Docs    │ │ Flow  │   │         │   │ Sales   │   │Marketing││        │
   └────┬────┘ └───┬───┘   └────┬────┘   └────┬────┘   └────┬────┘│        │
        │          │            │             │             │     │        │
        │          │            │  ┌──────────┴─────────────┘     │        │
        │          │            │  │                              │        │
        │          │       ┌────▼──▼───┐   ┌─────────┐   ┌────────▼─────┐  │
        │          │       │ M08      │◄──│ M09     │◄──│ M10          │  │
        │          │       │ Finance  │   │Inventory│   │ Procurement  │  │
        │          │       └────▲─────┘   └────▲────┘   └──────┬───────┘  │
        │          │            │              │               │          │
        │          │       ┌────┴─────┐   ┌────┴─────┐   ┌─────┴───────┐  │
        │          │       │ M11      │──►│ M12      │   │ M13 Support │  │
        │          │       │ Projects │   │Workforce │   │             │  │
        │          │       └────┬─────┘   └──────────┘   └─────┬───────┘  │
        │          │            │                              │          │
        │          │            │        ┌─────────────────────┘          │
        │          │            │        │                                │
        │          │       ┌────▼────────▼────┐   ┌──────────────┐        │
        │          │       │ M16 BI / metrics  │◄──│ M15 Strategy │        │
        │          │       └────┬───────┬──────┘   └──────────────┘        │
        │          │            │       │                                 │
        │          │       ┌────▼───┐   │   ┌──────────────┐              │
        │          │       │ M22    │   └──►│ M17 ML       │              │
        │          │       │Quality │──────►│              │              │
        │          │       └────────┘       └──────┬───────┘              │
        │          │                               │                      │
        │          │                        ┌──────▼───────┐              │
        │          │                        │ M18 Inference│              │
        │          │                        └──────┬───────┘              │
        │          │                               │                      │
        └──────────┴───────────────────────────────┴──────────────────────┘
                                   M23 Marketplace (isolated, post-PH-26)
```

**Reading the graph:** an arrow points from a consumer to a provider. M05 → M06
means sales may call CRM query contracts. Finance does not point at sales or
procurement: it consumes their confirmed documents through event-fed projections.
Intelligence points at business data; business data never points at intelligence.

### 4.1 Layer placement

| Layer | Modules | May depend on |
| --- | --- | --- |
| L0 Kernel | M03 (identity/policy), M20 (audit), shared contracts | Nothing business-specific |
| L1 Foundation | M02 (tenancy), M04 (industry), M01 (platform) | L0; M01 additionally M02 |
| L2 Shared business services | M14 (documents), M21 (approvals), M19 (jobs) | L0, L1 |
| L3 Commercial | M05, M06, M07 | L0–L2 |
| L4 Operations | M08, M09, M10, M11, M12, M13 | L0–L3 |
| L5 Intelligence | M15, M16, M22, M17, M18 | L0–L4 |
| L6 Future | M23 | Governed exports only |

Modules within a layer may depend on each other **only in the direction shown**:
M05 → M06; M09 → M08; M10 → M09, M08; M11 → M12, M08; M13 → M05.

---

## 5. Allowed interactions by module

| Module | May call synchronously (S/Q) | Publishes (E) | Consumes (E/P) | Must not call |
| --- | --- | --- | --- | --- |
| M01 Platform | M02 tenant lifecycle, M03 support grants | `platform.tenant.*`, `platform.plan.changed` | `billing.*` (future), `audit.*` | Tenant business modules |
| M02 Tenancy | M03 membership creation, M04 profile application | `org.tenant.provisioned`, `org.setting.changed` | `platform.plan.changed` | Any business module |
| M03 Identity | M20 audit | `identity.membership.*`, `identity.session.revoked` | — | Business modules |
| M04 Industry | — (schema/read only) | `industry.profile.published`, `industry.selection.changed` | `org.tenant.provisioned` | Business modules |
| M05 CRM | M14 documents, M06 opportunity creation | `crm.lead.created`, `crm.lead.converted`, `crm.contact.merged` | `sales.order.confirmed` (for customer history) | M08 Finance |
| M06 Sales | M05 query, M14, M21 approvals | `sales.opportunity.stage_changed`, `sales.quotation.approved`, `sales.order.confirmed` | `finance.credit.changed` (projection) | M08 write, M09 write |
| M07 Marketing | M05 query, M14 | `marketing.campaign.launched`, `marketing.attribution.recorded` | `sales.order.confirmed` | M08 Finance |
| M08 Finance | M21 approvals, M14 | `finance.invoice.issued`, `finance.payment.recorded`, `finance.journal.posted` | `sales.order.confirmed`, `procurement.receipt.recorded`, `inventory.movement.recorded` | M06/M09/M10 write |
| M09 Inventory | M08 posting service, M14 | `inventory.movement.recorded`, `inventory.level.changed` | `procurement.receipt.recorded`, `sales.order.confirmed` | M10/M11 write |
| M10 Procurement | M08 posting service, M09 movement service, M21 approvals | `procurement.purchase_order.approved`, `procurement.receipt.recorded`, `procurement.match.completed` | `sales.order.confirmed` (demand signal) | M06 write |
| M11 Projects | M12 workforce query, M08 posting service, M14 | `projects.milestone.completed`, `projects.cost.recorded` | `sales.order.confirmed`, `finance.invoice.issued` | M05/M06 write |
| M12 Workforce | M02 org query, M14 | `workforce.capacity.changed`, `workforce.assignment.changed` | `projects.task.assigned` | M08 write |
| M13 Support | M05 query, M14 | `support.case.resolved`, `support.sla.breached` | `sales.order.confirmed` | M06 write |
| M14 Documents | M19 storage, M20 audit | `documents.document.uploaded`, `documents.deleted` | — | Business modules |
| M15 Strategy | M16 metrics, M02 departments | `strategy.objective.updated` | `analytics.metric.recalculated` | Record modules (write) |
| M16 BI | M22 quality, record-module query contracts | `analytics.metric.recalculated`, `analytics.report.generated` | Domain events for materialisation | Record modules (write) |
| M17 ML | M16 metrics, M22, M19, M20 | `ml.dataset.published`, `ml.model.approved`, `ml.predictions.ready` | `analytics.metric.recalculated` | M18 decisions, business writes |
| M18 Inference | M16, M17, M21, M03 policy, M14 | `inference.recommendation.created`, `inference.action.proposed` | `approval.decision.recorded`, `ml.model.approved` | Business writes, policy override |
| M19 Jobs | M20, module job handlers (registered) | `platform.job.failed` | `*` job requests | Business modules (import) |
| M20 Audit | — | `audit.event.recorded` | All audit writes | Any business module |
| M21 Approvals | M03 policy, M20 | `approval.requested`, `approval.decision.recorded` | Business module approval requests | Business modules (except typed subject refs) |
| M22 Quality | M20, shared metric schema | `quality.exception.raised`, `quality.snapshot.recorded` | Domain events | Record modules (write) |
| M23 Marketplace | Governed export only | — | `analytics.metric.recalculated` (aggregated only) | Operational tables at request time |

**Event consumption does not create a code dependency.** A consumer owns its
projection tables and rebuilds them from events.

---

## 6. Cross-module flows and directions

Each flow names the initiating module, the synchronous steps and the asynchronous
completion. This is where most accidental cycles appear.

| Flow | Steps | Direction rule |
| --- | --- | --- |
| Lead → opportunity → quote → order | M05 converts lead and calls M06 `createOpportunity`; M06 owns quote/order | M05 → M06 only |
| Order → invoice | M06 confirms order and emits `sales.order.confirmed`; M08 projects the order and issues the invoice on user action | M08 consumes event; no synchronous M06 call |
| Quote discount approval | M06 requests M21 approval; M21 returns a decision; M06 applies the state change | M06 → M21 |
| PO → receipt → bill → payment | M10 approves PO via M21, receives goods via M09 movement service, M08 records bill and payment; match result owned by M10 | M10 → M09, M08, M21 |
| Stock adjustment | M09 records movement and calls M08 for valuation posting | M09 → M08 |
| Project → invoice | M11 records billable milestones and emits `projects.milestone.completed`; M08 creates a draft invoice | M08 consumes event |
| Support → customer history | M13 queries M05 contact/company read contract | M13 → M05 |
| Workforce → project | M11 queries M12 capacity and assignment contract; M12 emits capacity changes | M11 → M12 |
| CRM dashboards | M16 consumes domain events and reads registered metrics; never writes CRM | M16 → read only |
| ML dataset build | M17 reads metrics and authorised domain snapshots via M16 + export contracts | M17 → M16/M22 |
| Inference | M18 reads metrics, calls M17 serving, evaluates M21 policy, assembles evidence | M18 → M16, M17, M21 |
| Assistant tool call | M18/M19 tool invokes a module service under the actor's policy context | Tool → module command/query with actor context |
| Marketplace | Separate pipeline reads governed aggregates only | M23 ↛ operational tables |

### 6.1 Transaction boundaries across modules

| Situation | Rule |
| --- | --- |
| Same-module write | One transaction, one audit append, optional outbox append |
| Cross-module synchronous command | Caller owns the transaction only if both modules share the same database transaction boundary and the callee participates explicitly; otherwise the callee commits and the caller records a compensating state |
| Cross-module event | Producer commits its change + outbox atomically; consumer processes idempotently later |
| Approval | Approval decision is its own transaction; the subject module applies the approved transition in a second transaction bound to the approval version |
| Financial posting | Posting is a finance transaction; source module keeps its own state and references the journal |
| Notifications | Always asynchronous; never part of the business transaction |

**Default:** do not span transactions across modules. Use a state machine
(`pending_posting` → `posted` / `failed`) and an idempotent handler. Distributed
transactions are not used.

---

## 7. Circular-dependency register

The following are the cycles that naturally appear in this domain. Each has a
required resolution; none may be resolved by "just importing it".

| ID | Apparent cycle | Why it appears | Required resolution |
| --- | --- | --- | --- |
| `CDR-01` | M02 ↔ M03 (tenancy ↔ identity) | Onboarding creates the owner membership; identity needs tenant context | M02 calls M03 `createMembership`; M03 receives `tenantId` and never calls M02 services. Tenant existence is enforced by FK, not a service call. |
| `CDR-02` | M01 ↔ M02 (platform ↔ tenancy) | Platform provisions tenants; tenancy needs plan entitlements | M01 orchestrates M02 lifecycle; plan/entitlement data is exposed through a shared entitlement contract. M02/M03 read entitlements, never M01 internals. |
| `CDR-03` | M02 ↔ M04 (tenancy ↔ industry) | Onboarding applies a profile; profile needs tenant selection | M02 orchestrates; M04 receives tenant context and writes only its own tables. M04 emits `industry.selection.changed`; it never calls M02. |
| `CDR-04` | M05 ↔ M06 (CRM ↔ sales) | Conversion creates opportunities; sales needs customer data | M05 → M06 command for conversion; M06 reads M05 via query contract. M05 never imports M06 repositories. |
| `CDR-05` | M06 ↔ M08 (sales ↔ finance) | Orders produce invoices; finance needs order data; sales needs credit status | M06 emits `sales.order.confirmed`; M08 projects it. Credit exposure is published by M08 as a read model. No synchronous reverse write. |
| `CDR-06` | M08 ↔ M09 (finance ↔ inventory) | Movements have valuation; finance needs stock evidence | M09 → M08 posting command; M08 never calls M09 to mutate stock. Inventory value is a finance projection, not a reverse write. |
| `CDR-07` | M08 ↔ M10 (finance ↔ procurement) | Bills and POs reference each other | M10 → M08 for bill/payment posting; M08 consumes `procurement.*` events for matching context. |
| `CDR-08` | M09 ↔ M10 (inventory ↔ procurement) | Receiving changes stock; stock availability drives purchasing | M10 → M09 movement command; M09 publishes `inventory.level.changed`; M10 consumes it for reorder suggestions. |
| `CDR-09` | M11 ↔ M12 (projects ↔ workforce) | Projects need people; capacity needs project allocations | M11 → M12 query/assignment; M12 emits capacity changes. M12 never imports M11. |
| `CDR-10` | M16 ↔ M22 (BI ↔ quality) | Metrics need quality status; quality rules need metric definitions | Metric definition schema moves to the shared kernel (`src/lib/metrics`); M16 and M22 both depend on the schema, not each other. M22 publishes quality snapshots; M16 consumes. |
| `CDR-11` | M16 ↔ M17 (BI ↔ ML) | ML consumes metrics; BI displays predictions | M17 → M16 for metric definitions and dataset inputs; M16 displays predictions through M17's published read model. No reverse code import. |
| `CDR-12` | M17 ↔ M18 (ML ↔ inference) | Inference calls models; model monitoring uses inference outcomes | M18 → M17 serving contract; M17 consumes `inference.outcome.recorded` for monitoring. Outcome flow is an event, not a call. |
| `CDR-13` | M20 ↔ every module (audit) | Every module writes audit; audit displays target data | M20 exposes a write-only audit contract and a tenant-scoped read API. It imports no business module; audit payloads carry IDs and snapshots, not live object references. |
| `CDR-14` | M21 ↔ business modules (approvals) | Approvals need subject data; modules need approval state | M21 stores a typed subject reference and an immutable snapshot supplied by the caller. Modules query M21 for decision state. M21 never imports a business module. |
| `CDR-15` | M23 ↔ M16/M17 (marketplace) | Marketplace needs aggregates; analytics must not depend on marketplace | M23 consumes governed, aggregated exports produced by a separate pipeline. No operational module imports M23, and M23 never queries operational tables at request time. |

### 7.1 Cycle prevention in CI

| Control | Tool / location | Phase |
| --- | --- | --- |
| Import direction | ESLint `no-restricted-imports`, path rules | PH-03 |
| Feature cycles | `dependency-cruiser` or equivalent graph check | PH-03 |
| Deep imports | Lint rule on `src/features/*/index.ts` | PH-03 |
| Repository/table ownership | Review checklist + schema ownership file | PH-08 |
| Cross-module write detection | Repository ownership test: each table has one writer module | PH-08 |
| Contract tests | Each S/Q interface has a contract test | PH-09 |

---

## 8. Data ownership and read access

| Data | Owner (write) | Read access | Never |
| --- | --- | --- | --- |
| Tenant, branch, department | M02 | M01, M03, all modules via tenant context | Direct table reads outside repositories |
| User, membership, role, scope | M03 | M02 (provisioning), M20 (audit display) | Business modules writing roles |
| Industry profile, custom field | M04 | M02 onboarding, all modules via effective config | Tenant-authored executable logic |
| Leads, contacts, companies | M05 | M06, M07, M13, M16 | M08 writing CRM |
| Opportunities, quotes, orders | M06 | M05 (history), M08 (projection), M16 | M08 mutating order state |
| Invoices, payments, journals | M08 | M11 (billing view), M16, M20 | Any module editing posted entries |
| Stock movements, levels | M09 | M10, M11, M16 | M08 writing stock |
| POs, receipts, match | M10 | M08, M09, M16 | M09 writing POs |
| Projects, tasks | M11 | M12, M16, M08 (billing) | M12 writing projects |
| Employee sensitive data | M12 | M11 (assignment only), M20 (audit) | Broad tenant-wide reads |
| Cases, SLA | M13 | M05 (history), M16 | M06 writing cases |
| Documents | M14 | Linked record's permission | Unscoped download |
| Metrics, dashboards | M16 | M15, M17, M18 | Business modules writing metric values |
| Datasets, models | M17 | M18, M20 | Business modules writing model state |
| Recommendations, outcomes | M18 | M16 (display), M17 (monitoring) | M18 executing without approval |
| Audit | M20 | Authorised tenant roles | Any update/delete |
| Marketplace records | M23 | Governance roles only | Operational joins |

---

## 9. Industry configuration and dependencies

Industry profiles change **which modules are available**, not **how modules
depend on each other**:

- A profile may disable M07 Marketing for a tenant; it may not remove the
  dependency edge M07 → M05.
- A profile may enable M11 Projects for a construction tenant; the M11 → M12/M08
  edges remain the same.
- A custom industry receives the universal core plus inferred modules. It never
  receives a new dependency edge or a new module without an engineering extension.
- An extension is bounded inside its owning module and declares its dependencies
  explicitly (`IND-EXT-1`–`IND-EXT-5`).
- A disabled module's data is retained and its events stop being produced; consumers
  must tolerate absence.

---

## 10. Ownership of cross-cutting concerns

| Concern | Owner | Everyone else |
| --- | --- | --- |
| Identity context | M03 | Reads the actor context; never constructs one |
| Permission decision | M03 (`src/lib/permissions`) | Calls the policy function; never branches on roles |
| Tenant context | M02/M03 | Receives it from the session; never from request input |
| Audit append | M20 | Calls `audit.record` inside the transaction |
| Event outbox | M20/CMP-08 | Appends through the outbox API |
| Job registration | M19 | Registers a handler; never starts an ad-hoc timer in a request |
| Object storage | M14/M19 | Uses the storage adapter; never calls a vendor SDK directly |
| Metric definition | M16/shared kernel | Reads; never redefines a formula |
| Approval policy | M21 | Requests a decision; never implements its own threshold logic |
| Feature flags | M01 | Reads through the cached resolver |
| Effective configuration | M04 | Reads the resolved config; never parses raw profile JSON |

---

## 11. Testing the map

| Test | What it proves | Phase |
| --- | --- | --- |
| Dependency graph check | No cycles, no deep imports | PH-03 |
| Table-writer test | One writing module per table | PH-08 |
| Cross-tenant probe | No module bypasses tenant scope | PH-08 |
| Contract tests | S/Q interfaces accept and return documented shapes | PH-09 |
| Event idempotency test | Duplicate delivery does not duplicate effects | PH-10 |
| Workflow end-to-end | Quote → order → invoice; PO → receipt → bill → payment | PH-12–14 |
| Disabled-module test | Consumers tolerate an absent module | PH-24 |
| Extension boundary test | Extension cannot write outside its module | PH-24 |

---

## 12. Phase impact

| Phase | Dependency work |
| --- | --- |
| PH-02 | This map accepted; cycle register reviewed |
| PH-03 | Lint/graph enforcement wired |
| PH-05 | M02, M03, M04 boundaries proven |
| PH-08 | Table ownership and FK rules |
| PH-09 | M21 and contract tests |
| PH-10 | M19, M20, M14 infrastructure boundaries |
| PH-11–15 | Domain module boundaries added one at a time |
| PH-16–18 | M16, M22 metric ownership |
| PH-19–21 | M17 pipeline and serving contracts |
| PH-22–23 | M18 orchestration and tool boundaries |
| PH-24 | M01 entitlements, M04 profiles, M23 design-only isolation |
| PH-25 | Full graph and isolation verification |

---

## 13. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Stage 2 module ownership, dependency classes, graph, cycle register and enforcement rules. No code. |
