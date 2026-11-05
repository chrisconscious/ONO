# ONO Project Architecture Document

**Document status:** combines the current application architecture with the
recorded product vision. Sections explicitly marked **Proposed** or **Future**
are not claims of implementation or approval.

## 1. Product purpose and vision

ONO is intended to give small and mid-market organisations one multi-tenant
workspace for customer relationships and the operational processes that connect
sales, finance, procurement, inventory, projects, support, and management
insight. The target is a configurable universal core, with declarative industry
profiles rather than tenant-supplied executable code.

The working assumptions in the prior product brief are SMB/mid-market
organisations (roughly 5–500 users), a small delivery team, English-first
experience, responsive web, reliable internet, and a staged launch. These are
assumptions to validate with a product owner and pilot customers, not binding
market facts.

### Product principles

1. Tenant and actor identity come from a verified session and membership, never
   from untrusted client-supplied tenant IDs.
2. Server-side policy is authoritative; hiding UI controls is not security.
3. Operational source records remain separate from analytics and predictions.
4. Business rules and authorized people, not AI, decide permissions, money, and
   state transitions.
5. Every important action should be attributable and reviewable.
6. Financial totals, inventory balances, and status changes are computed and
   guarded on the server.
7. Industry differences should be declarative and bounded; no tenant code is
   executed.
8. A feature is not complete merely because a page or schema exists; workflow,
   server rules, persistence, authorization, error states, and tests matter.

## 2. Current architecture

The repository is a Next.js modular monolith with:

- Next.js App Router for pages, server rendering, and API route handlers.
- React components for shared shell, resource lists/forms, dashboards, CRM,
  administration and domain screens.
- TypeScript/Zod for application code and request validation.
- `src/server/services/` for business/application services.
- Prisma and PostgreSQL for persistence.
- Vitest unit tests.

There is no separately deployed API service or worker documented in the
repository. There is no general queue, object storage, email service, payment
provider or third-party integration adapter. CRM automation's protected sweep
route is not a bundled scheduler.

### Current request path

```text
Browser request
  -> Next.js page or API handler
  -> session from ono_session
  -> active workspace/membership resolution
  -> request parsing and Zod validation
  -> server permission check
  -> service and Prisma/PostgreSQL operation
  -> response or server-rendered result
```

`requireTenantApi` rejects unauthenticated callers, missing active membership,
suspended/closed workspaces, and missing permissions. Its active tenant is
resolved from session/workspace context. Do not add code that accepts a tenant
ID in a body/header as authority.

### Data boundaries

Current persistence is a PostgreSQL operational database. The broader
architecture proposal separates:

| Plane | Proposed responsibility | Current status |
| --- | --- | --- |
| Operational records | Tenants, members, CRM, sales, finance, inventory, projects, support | Implemented subset in PostgreSQL. |
| Analytics | Registered/versioned metrics and snapshots | Only basic server-side summaries exist. |
| Training data | Approved snapshots and feature definitions | Not implemented. |
| Model artefacts | Versioned models/model cards | Not implemented. |
| Predictions/inference | Provenanced predictions and evidence | Not implemented as a platform; CRM baselines are stored with records. |
| Governance/audit | Audit, retention, access and lineage | Audit records exist; broader governance is proposed. |

## 3. Tenant, identity and permission model

`User` identities can have tenant `Membership` records. Tenant roles and their
permissions are assigned through role/permission relations. A separate
platform-admin role exists. An active workspace is selected from the current
actor's memberships; server guards must verify it for each protected operation.

The intended authorization sequence is:

```text
session -> tenant membership -> tenant status -> permission
        -> record scope -> domain state -> separation of duties
```

Current code implements session, membership/workspace, permission, and
application-level state checks to varying feature depth. Database row-level
security, complete separation-of-duties policies, generalized record scopes,
platform-wide compliance controls, and formal authorization probes are
proposals until verified in source, migrations, tests, and deployment.

## 4. Product module map and implementation status

The recorded product scope has 23 modules. The table distinguishes current code
from intended scope.

| ID | Module | Current status |
| --- | --- | --- |
| M01 | Platform administration (SaaS) | Partial: tenant/user/settings/testimonial administration; no full plans, entitlements, feature-flag or support-grant platform. |
| M02 | Organisation and tenancy | Partial: tenants, memberships and workspace settings; no complete onboarding/invitation flow. |
| M03 | Identity and access management | Core implemented: sessions, roles, permissions and workspace guards; reset/MFA/invitation features are not established as shipped. |
| M04 | Industry configuration | Foundation only; full versioned declarative industry profiles and bounded overrides are future work. |
| M05 | CRM | Implemented core workflows, pipeline, timelines, conversion, search, scoring baseline, copilot and bounded automation. |
| M06 | Sales and commercial | Opportunities, quotations, sales orders and lines; no full contracts/pricing platform. |
| M07 | Marketing | Not implemented. |
| M08 | Finance | Partial: invoices, payments and expenses; no general ledger, period close, bank reconciliation or gateway. |
| M09 | Inventory | Implemented core products, warehouses and stock movements; no barcode or transfer document. |
| M10 | Procurement | Implemented core suppliers and purchase orders; no approval chain or supplier portal. |
| M11 | Projects and operations | Projects/tasks implemented; milestones are schema-only. |
| M12 | Workforce and HR | Not implemented. |
| M13 | Customer support | Basic support-case CRUD; no SLA, inbox, customer linkage or chat. |
| M14 | Documents and communication | File/document storage and communication delivery not implemented. |
| M15 | Strategy and performance | Not implemented. |
| M16 | Business intelligence | Basic server-side analytics; no metric registry/report builder/export scheduler. |
| M17 | AI and machine learning | No training/serving; only explainable deterministic/statistical CRM baselines. |
| M18 | Inference intelligence engine | No general inference/decision layer; deterministic CRM copilot is partial. |
| M19 | Integrations and jobs | No general external integrations, worker, or durable queue. |
| M20 | Audit and compliance | Audit log functionality exists; broader compliance/retention/export controls are incomplete. |
| M21 | Approvals and workflow engine | No general approval engine; only bounded CRM automation. |
| M22 | Data quality and governance | Some CRM quality indicators; no general governance module. |
| M23 | Data marketplace (future) | Not started; requires separate legal, privacy and governance approval. |

## 5. Core business workflows

### Identity and workspace

1. User signs in; server validates credentials and creates a database-backed
   session.
2. The actor's active tenant membership and role permissions are loaded.
3. The workspace shell shows permitted navigation. Protected APIs repeat all
   authorization checks.
4. A workspace switch chooses only a tenant to which the actor has an active
   membership.

Current limitations: no complete invite acceptance, email delivery, MFA, or
password reset workflow is documented as implemented.

### CRM to sale

1. A tenant records a lead and assigns an owner/source/status.
2. Server-side CRM logic validates permitted updates and produces activity
   history and baseline scoring as applicable.
3. A qualified lead can be converted into contact/company/opportunity records;
   the operation is permission-checked and guarded against invalid state.
4. Opportunity stage changes create stage history. Pipeline/insights render
   server-calculated per-currency summaries and baseline forecasts.
5. Quotations/orders manage document lines and server-calculated totals.

No email/calendar synchronization, outbound messaging, trained lead model, or
external sales integration is implied by this workflow.

### Finance, procurement and inventory

- Invoices contain line items and a server-maintained balance/status; payments
  are recorded and overpayment/unsafe edits are guarded.
- Expenses are records, not a complete accounting ledger.
- Suppliers and purchase orders are represented; no configured approval chain.
- Inventory is derived from stock movements. Movement history is intended to be
  immutable, and application guards prevent invalid stock results.
- ONO records payment information; it does not initiate money movement.

### CRM automation and copilot

CRM automation uses bounded trigger types, limited conditions/actions, run
history, and idempotency. Time-based work depends on a protected sweep endpoint
being called by an operator or external scheduler. It is not a general-purpose
workflow engine.

The deterministic copilot can answer bounded questions from authorized records
with evidence and limitations. Optional provider integration is disabled by
default and has not been live-provider verified. Copilot output does not execute
actions.

### Testimonials

Submissions record publication and identity consent separately. The public
projection returns approved, published, consented content and masks name/title/
company without the corresponding consent. It omits internal identifiers and
moderation notes. Withdrawing publication consent removes public eligibility.

## 6. Proposed future architecture

The recorded long-term direction is a modular monolith, potentially with a
separate worker process when required. Extraction to a separate backend or
Python ML service is conditional on measured needs, not a current deployment
fact.

Proposed future components include:

- Durable job processing and transactional outbox with idempotent consumers.
- Object storage for private documents, signed access, retention and malware
  scanning.
- Integration configuration, webhook validation/signing, external ID mapping,
  sync cursors and reconciliation.
- Versioned industry catalogue and effective tenant configuration; tenant
  configuration remains declarative and cannot execute code.
- Registered analytics metrics and derived snapshots kept separate from OLTP.
- If justified, dataset and feature pipelines, evaluated models, model registry,
  pinned serving versions, evidence-based inference and human-approved
  recommendations.
- Append-only audit and data lineage, with operational logs kept separate.

These are architectural proposals only unless matching source/schema/tests are
present and verified.

## 7. Intelligence and AI authority

The proposal separates six responsibilities: deterministic analytics (what is
true), ML estimates (what may happen), model serving, inference/explanation,
decision/recommendation, and authorized human action. A higher layer may
consume lower-layer evidence; a model/LLM may not set permissions, invent
authoritative financial metrics, change business state, or bypass approvals.
Predictions must carry uncertainty, model/version provenance and freshness.
Cross-tenant training and data marketplace use require separate consent,
governance and legal approval.

Current reality: descriptive summaries, rule/statistical CRM baselines, and a
bounded copilot; no model training, model registry, serving system, or decision
engine.

## 8. Recorded decisions and unresolved assumptions

### Approved principles in the recorded ADR set

The prior architecture decision register labels these owner-directed principles
as approved: modular monolith as the starting point (ADR-001), one
server-side/default-deny policy module (ADR-016), no executable tenant
configuration (ADR-029), and AI must not exceed the requesting actor's
authority (ADR-033). This does **not** make every proposed implementation detail
approved.

### Proposed/conditional technical choices

The 36-record ADR register included proposals for PostgreSQL, Prisma, database
sessions, shared-schema tenancy and RLS defence, JSONB custom fields, hybrid
analytics, conditional Python ML, durable jobs, S3-compatible storage, a
pluggable AI provider, SQL reporting, Next.js plus worker, RSC-first rendering,
server actions/Zod, versioned REST, Problem Details, pagination/idempotency,
transactional outbox, append-only audit, data classification, read replicas,
feature flags, versioned industry profiles, model registry, batch-first
inference, controlled AI tools, marketplace isolation, and hosting topology.
Many are proposals, not code. Authentication provider and hosting topology
require explicit choice.

### Open product/operations decisions

The prior decision register contains OD-001 through OD-046. Major open themes:

- Launch market, pilot businesses, jurisdiction, languages, dark mode and PDF
  expectations.
- Authentication provider, PostgreSQL/RLS and connection-pooling model,
  Prisma/reporting boundary, component system, queue, storage, CI/CD and
  observability.
- Industry catalogue ownership, custom-industry visibility, custom-field
  limits, workflow variants, tenant permission DSL and support-grant approval.
- Approval thresholds, multi-currency reporting, backups/RPO/RTO, data
  residency, retention, session lifetime, controller/processor roles,
  subprocessors, regulated/special-category data, AI provider terms, model
  registry, cross-tenant training, inference latency, outcome windows, and
  tenant AI opt-out.
- Broker/warehouse thresholds, outbox retention, file scanning, asynchronous
  export threshold, API deprecation window, and idempotency retention.

The recommendations in the former register are recommendations only. Product
owner/legal/security approval is required before treating them as policy.

## 9. Product roadmap (recorded sequence, gates still apply)

The recorded 26-phase sequence is a planning baseline, not a promise of
completion:

| Phase | Theme | Gate |
| --- | --- | --- |
| 01–02 | Product requirements; architecture and technical contracts | Product/design approval |
| 03–04 | Repository/development infrastructure; UI/UX and screen design | Working pipeline; design approval |
| 05–07 | Authentication/tenancy/access; application shell; shared components | Security, usability, component verification |
| 08–10 | Database integrity; APIs/business rules; shared infrastructure | Migration, contract, reliability verification |
| 11–15 | CRM; sales/marketing; finance; inventory/procurement; projects/workforce/support | Per-module acceptance and financial integrity |
| 16–18 | Data quality/analytics model; metrics; dashboards/reports | Data correctness and acceptance |
| 19–21 | ML data; models/evaluation; serving | Pipeline and model evaluation gates |
| 22–23 | Inference/decision layer; assistant and controlled automation | Safety and governance verification |
| 24 | Integrations, SaaS administration and industry configuration | Integration verification |
| 25–26 | Full-system verification; production deployment and handover | Release candidate and launch approval |

The former roadmap explicitly says a phase is complete only when its gate is
met. Reassess phase order and acceptance against the current implementation.

## 10. Quality, security and product risks

Proposed quality goals include tenant isolation, financial correctness,
accessible and responsive screens, reliable migrations/backups, observable
failures, safe exports, measurable analytics freshness, and human governance of
AI. Prior risk themes include cross-tenant leakage, scope expansion, metric
drift, over-trusted AI, financial defects, untyped custom fields, approval
bypass, reporting load, weak industry profiles, insufficient ML data,
unsupported compliance claims, migration quality, secret leakage, duplicate
event effects, module-boundary erosion, and RLS/pooling interactions.

These risks need validation and tracked mitigations; this document does not
assert that every control exists. Legal, privacy, data retention and launch
jurisdiction require qualified review.

## 11. Requirements and UI design baseline

Prior planning recorded 23 modules, 145 functional requirements, and 12
proposed non-functional requirements. They are a requirements baseline, not a
verification result or blanket approval. The prior design baseline specified
authentication-first entry, role-aware navigation, list/detail/create/edit
screens, permission-aware empty/loading/error states, responsive layouts,
visible keyboard focus, reduced-motion support, and WCAG 2.2 AA as a target.
Current UI implementation has accessible patterns in selected screens; do not
claim whole-product conformance without an audit.

## 12. Source of truth

For implementation: inspect `src/` and run the relevant checks. For persisted
data: inspect `prisma/schema.prisma` and reviewed migrations. For package/runtime
versions: use `package.json`. This document preserves the product/architecture
context; where this overview and current code differ, current verified code
determines what is shipped.
