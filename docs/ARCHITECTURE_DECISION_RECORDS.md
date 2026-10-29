# ONO — Architecture Decision Records

| Field | Value |
| --- | --- |
| Document | Architecture Decision Records |
| Stage | 2 — Architecture and technical contracts |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — 36 decisions: 4 owner-approved ADRs, 30 proposed, 2 requiring approval |
| Relationship | Extends the 14 proposed ADRs in `SYSTEM_ARCHITECTURE_PLAN.md` §14; IDs are preserved, never renumbered |

---

## 1. Status vocabulary

Stage 1 used requirement statuses (`Proposed`, `Recorded`, `Needs clarification`,
`Approved`, `Implemented`, `Verified`). Architecture decisions use a narrower set:

| Status | Meaning | Who can set it |
| --- | --- | --- |
| `Approved` | Explicitly directed by the product owner in a stage instruction | Product owner only |
| `Proposed` | Recommended by architecture, technically validated, awaiting acceptance | Architecture |
| `Requires approval` | Blocked on a specific `OD-*` business or vendor choice | Product owner |
| `Unresolved` | Cannot be decided yet because required information does not exist | Nobody yet |
| `Superseded` | Replaced by a later ADR; ID retained | Architecture, with reason |
| `Rejected` | Considered and declined; ID retained | Product owner or architecture |

**Nothing in this document is `Implemented`.** Implementation status belongs to
code, not to decisions.

### 1.1 What "approved" does and does not mean

Four ADRs are `Approved` because the product owner stated them as directives
across the Stage 1 and Stage 2 instructions, not because architecture prefers
them: `ADR-001`, `ADR-016`, `ADR-029`, `ADR-033`. Two further product/market
decisions are recorded in `OPEN_DECISIONS_AND_ASSUMPTIONS.md` §6 but are not
ADRs. Approval of a *principle* does not approve the *mechanism* chosen to
satisfy it — mechanisms remain `Proposed` unless stated otherwise.

---

## 2. Decision summary

| ADR | Decision | Status | Phase |
| --- | --- | --- | --- |
| ADR-001 | Modular monolith as the starting architecture | `Approved` | PH-02 |
| ADR-002 | PostgreSQL as primary relational store | `Proposed` | PH-08 |
| ADR-003 | Prisma as ORM, SQL for reporting | `Proposed` | PH-08 |
| ADR-004 | Authentication provider selection | `Requires approval` | PH-05 |
| ADR-005 | Database-backed, revocable sessions | `Proposed` | PH-05 |
| ADR-006 | Shared schema tenancy with repository guard and RLS defence | `Proposed` | PH-08 |
| ADR-007 | Custom fields stored as validated JSONB | `Proposed` | PH-08 |
| ADR-008 | Hybrid materialised + on-read metric calculation | `Proposed` | PH-17 |
| ADR-009 | Python ML service only if justified | `Proposed` | PH-19 |
| ADR-010 | Durable database-backed job queue | `Proposed` | PH-10 |
| ADR-011 | S3-compatible object storage | `Proposed` | PH-10 |
| ADR-012 | Pluggable AI provider with deterministic fallback | `Proposed` | PH-22 |
| ADR-013 | SQL views and registered queries for reporting | `Proposed` | PH-17 |
| ADR-014 | Shared-schema multi-tenancy model | `Proposed` | PH-08 |
| ADR-015 | Next.js server + worker; no separate backend framework in v1 | `Proposed` | PH-03 |
| ADR-016 | Single server-side policy module, default deny | `Approved` | PH-05 |
| ADR-017 | RSC-first rendering with client islands | `Proposed` | PH-06 |
| ADR-018 | Server actions for mutations, shared Zod schemas | `Proposed` | PH-09 |
| ADR-019 | Zod as the single contract-validation mechanism | `Proposed` | PH-09 |
| ADR-020 | REST-style JSON API at `/api/v1`, major version in path | `Proposed` | PH-09 |
| ADR-021 | RFC 9457 Problem Details for API errors | `Proposed` | PH-09 |
| ADR-022 | Keyset pagination with allow-listed sort and filter | `Proposed` | PH-09 |
| ADR-023 | Idempotency keys on unsafe mutating endpoints | `Proposed` | PH-09 |
| ADR-024 | Transactional outbox instead of a message broker | `Proposed` | PH-10 |
| ADR-025 | Append-only audit written in the business transaction | `Proposed` | PH-10 |
| ADR-026 | Five-level data classification | `Proposed` | PH-05 |
| ADR-027 | Analytics on a read replica before any warehouse | `Proposed` | PH-16 |
| ADR-028 | Database-backed feature flags, no vendor in v1 | `Proposed` | PH-24 |
| ADR-029 | No executable tenant configuration | `Approved` | PH-08 |
| ADR-030 | Declarative, versioned, schema-validated industry profiles | `Proposed` | PH-24 |
| ADR-031 | Database registry + object storage for model artefacts | `Proposed` | PH-20 |
| ADR-032 | Batch-first inference; synchronous only where justified | `Proposed` | PH-21 |
| ADR-033 | AI may never exceed the requesting actor's authority | `Approved` | PH-22 |
| ADR-034 | Allow-listed, schema-validated AI tool execution | `Proposed` | PH-23 |
| ADR-035 | Marketplace isolated from operational data paths | `Proposed` | Post-PH-26 |
| ADR-036 | Hosting provider and environment topology | `Requires approval` | PH-26 |

**Counts:** `Approved` 4 (ADR-001, ADR-016, ADR-029, ADR-033); `Proposed` 30;
`Requires approval` 2 (ADR-004, ADR-036); `Unresolved` 0; `Rejected` 0. Total 36.
Two further product/market decisions are recorded in
`OPEN_DECISIONS_AND_ASSUMPTIONS.md` §6 but are not ADRs.

---

## 3. Records

### ADR-001 — Modular monolith as the starting architecture

**Status:** `Approved` (owner directive, Stage 2 §4A and §5)
**Context:** Broad domain, small team, transaction-heavy workflows across
modules, one uniform authorization model needed.
**Decision:** One codebase, two runtime processes (web, worker). Modules are
enforced by import direction, not network boundaries. A separate Python ML
service is the only anticipated extraction.
**Alternatives:** Microservices per module (rejected: operational cost, distributed
transactions); single-process only (rejected: long jobs block requests);
serverless functions per feature (rejected: cold starts, tenancy context,
transaction boundaries).
**Consequences:** Must invest in lint-enforced boundaries; scaling is coarse until
extraction; extraction triggers must be documented (they are, in
`SYSTEM_ARCHITECTURE.md` §4 and §9).
**Phase:** PH-02. **Owner:** Architecture.

### ADR-002 — PostgreSQL as primary relational store

**Status:** `Proposed`
**Context:** Strong relational integrity, JSONB for bounded custom fields, row
security, mature operational tooling, exact numerics for money.
**Decision:** PostgreSQL 16+ as the single system of record for all operational,
audit, analytics-metadata and inference-record data.
**Alternatives:** MySQL (weaker JSON and RLS story); SQL Server (licensing, ops
cost); document databases (lose transactional integrity across modules).
**Consequences:** Requires managed instance or equivalent operational skill; RLS
becomes available as defence in depth; partitioning strategy needed for
`audit_event`, `stock_movement`, `metric_value`, `prediction`.
**Phase:** PH-08. **Open decision:** `OD-002`.

### ADR-003 — Prisma as ORM, SQL for reporting

**Status:** `Proposed`
**Context:** TypeScript-first team, schema drift risk, need for reviewed
migrations, and reporting queries that exceed ORM ergonomics.
**Decision:** Prisma for transactional reads/writes and migrations; hand-written
parameterised SQL inside repositories for reporting, aggregation and
performance-critical paths.
**Alternatives:** Kysely (better SQL control, weaker migration story); Drizzle
(smaller ecosystem, less mature tooling); raw SQL everywhere (loses type safety).
**Consequences:** Two query styles to govern; a documented boundary is required
(Prisma for OLTP, SQL only in repositories, always parameterised); RLS integration
must be validated against connection pooling (`RISK-018`).
**Phase:** PH-08. **Open decision:** `OD-004`.

### ADR-004 — Authentication provider selection

**Status:** `Requires approval`
**Context:** Identity is the root of every authorization decision. Vendors differ
in session model, MFA, enterprise SSO, data residency and lock-in.
**Decision:** Not yet made. Requirements are fixed: server-verified sessions,
immediate revocation, MFA for privileged roles, invitation flow, no vendor-owned
user table as the source of truth.
**Alternatives:** Managed identity provider; self-hosted provider library;
custom implementation (discouraged).
**Consequences:** Blocks PH-05. Whatever is chosen must allow a local
`user`/`membership` model to remain authoritative for tenancy and roles.
**Phase:** PH-05. **Open decision:** `OD-003` — **blocking**.

### ADR-005 — Database-backed, revocable sessions

**Status:** `Proposed`
**Context:** Suspension and role changes must take effect immediately; stateless
tokens cannot be revoked without a denylist that reintroduces state.
**Decision:** Sessions stored server-side, referenced by an opaque `HttpOnly`,
`Secure`, `SameSite=Lax` cookie; rotation on sign-in and privilege change;
revocation cascades from membership suspension in the same transaction.
**Alternatives:** JWT-only stateless sessions (fast, but revocation is
best-effort); short-lived tokens plus refresh (more moving parts).
**Consequences:** One database lookup per request (cacheable per request only);
session table becomes a retention concern (30 days after expiry).
**Phase:** PH-05.

### ADR-006 — Shared schema tenancy with repository guard and RLS defence

**Status:** `Proposed`
**Context:** 1,000 tenants target; migration fan-out must stay manageable;
isolation failure is catastrophic (`RISK-001`).
**Decision:** Single database, single schema, `tenant_id` on every tenant-owned
table. Enforcement in three independent layers: (1) session-derived tenant
context, (2) repository guard that injects and asserts the tenant predicate,
(3) PostgreSQL row-level security as defence in depth. Plus automated cross-tenant
probes in CI.
**Alternatives:** Schema per tenant (migration fan-out, connection pressure);
database per tenant (cost, cross-tenant reporting complexity); RLS alone
(insufficient — RLS does not cover application-level scope or job context).
**Consequences:** Guard discipline is critical; RLS adds operational complexity
with pooling and must be validated (`RISK-018`); queries without a tenant
predicate are defects, even in platform code.
**Phase:** PH-08. **Open decision:** `OD-037` (RLS in v1 or later).

### ADR-007 — Custom fields stored as validated JSONB

**Status:** `Proposed`
**Context:** Tenants need industry-specific fields; unbounded schema changes per
tenant are unacceptable.
**Decision:** A `custom_field` definition table plus a single validated JSONB
column per entity (e.g. `custom_fields`). Validation against a JSON Schema
derived from field definitions; indexes added explicitly for fields an industry
profile marks as searchable.
**Alternatives:** EAV tables (query complexity, weak typing); per-tenant columns
(migration explosion); separate custom-field store (join cost, consistency risk).
**Consequences:** Weaker default indexing; reporting on custom fields requires
declared indexes; field definitions and values must be versioned together.
**Phase:** PH-08. **Open decision:** `OD-005`, `OD-015`.

### ADR-008 — Hybrid materialised + on-read metric calculation

**Status:** `Proposed`
**Context:** Dashboards must answer in seconds over 24 months of data without
recomputing everything per view; some metrics must be exact at request time.
**Decision:** Metrics declare a `calculation_mode`: `materialised` (scheduled
refresh with recorded freshness) or `on_read` (computed at request against
indexed sources). Both go through the same registered definition.
**Alternatives:** Pure on-read (simple, slow at scale); pure materialised (stale,
storage heavy).
**Consequences:** Two code paths per metric family; freshness must be displayed;
invalidation on source write; materialisation runs in the worker.
**Phase:** PH-17.

### ADR-009 — Python ML service only if justified

**Status:** `Proposed`
**Context:** Python has the ML ecosystem; a second runtime has real operational
cost.
**Decision:** Start with TypeScript statistics for descriptive and simple
forecasting work. Introduce a Python/FastAPI service (U5) only when a documented
use case requires libraries or compute not reasonably available in Node.
**Alternatives:** Python from day one (premature); never Python (limits model
quality).
**Consequences:** `OD-007` must be answered before PH-19; the ML client contract
must exist regardless so the decision stays reversible.
**Phase:** PH-19.

### ADR-010 — Durable database-backed job queue

**Status:** `Proposed`
**Context:** Jobs must survive deploys, be observable, and be idempotent. A
managed broker adds a dependency before volume justifies it.
**Decision:** A `job` table with status, attempts, `run_after`, lease/heartbeat,
last error, and a dead-letter state. Worker process polls with `FOR UPDATE SKIP
LOCKED`, bounded concurrency, exponential backoff, and idempotency keys.
**Alternatives:** Managed queue (better at high volume, extra cost and vendor);
Redis-based (fast, extra infrastructure, weaker durability guarantees).
**Consequences:** Polling latency (sub-second acceptable); queue throughput is
bounded by database capacity; revisit at PH-24 (`OD-038`).
**Phase:** PH-10. **Open decision:** `OD-008`.

### ADR-011 — S3-compatible object storage

**Status:** `Proposed`
**Context:** Documents, exports and model artefacts do not belong in the
relational database.
**Decision:** S3-compatible API as the storage contract, accessed only through a
storage adapter; private buckets; tenant-namespaced keys; short-lived signed URLs.
**Alternatives:** Provider-proprietary API (lock-in); database blobs (backup and
performance cost); local filesystem (not horizontally scalable).
**Consequences:** Provider choice deferred (`OD-009`); malware scanning and
lifecycle rules must be configured before documents are downloadable.
**Phase:** PH-10.

### ADR-012 — Pluggable AI provider with deterministic fallback

**Status:** `Proposed`
**Context:** Provider terms, pricing and availability change; sensitive data
cannot be sent to unapproved providers.
**Decision:** An internal `AiProvider` interface with one approved implementation
initially. No provider is called without an approved data-processing basis.
Fallback is **deterministic** (rules + analytics + templated language), never a
silent switch to another provider.
**Alternatives:** Hard-code one vendor (cheap, brittle); multi-provider routing
now (premature, compliance risk).
**Consequences:** Adds a thin abstraction; requires `OD-027` before any external
call; the assistant degrades visibly when unavailable.
**Phase:** PH-22.

### ADR-013 — SQL views and registered queries for reporting

**Status:** `Proposed`
**Context:** Complex reporting in ORM code becomes unreadable and slow; ad hoc
SQL in components is ungoverned.
**Decision:** Reporting queries live in repositories as named, reviewed SQL
(views, materialised views, or registered parameterised queries), never inline in
UI or services.
**Alternatives:** ORM-only reporting (readability and performance); BI tool
against the primary database (contention, access control risk).
**Consequences:** SQL review becomes part of the PR checklist; view definitions
are versioned with migrations.
**Phase:** PH-17.

### ADR-014 — Shared-schema multi-tenancy model

**Status:** `Proposed`
**Context:** See ADR-006. This record fixes the *model*; ADR-006 fixes the
*enforcement*.
**Decision:** Shared database, shared schema, `tenant_id` discriminator,
composite indexes leading with `tenant_id`, composite uniqueness per tenant.
**Alternatives:** Schema-per-tenant; database-per-tenant; hybrid by plan tier.
**Consequences:** Any missing predicate is a cross-tenant defect; per-tenant
restore requires logical export, not database restore; noisy-neighbour risk needs
query budgets.
**Phase:** PH-08.

### ADR-015 — Next.js server + worker; no separate backend framework in v1

**Status:** `Proposed`
**Context:** The Stage 2 brief requires an explicit evaluation rather than a
default.
**Decision:** Core application operations run in Next.js route handlers and server
actions, with a separate worker process for asynchronous work. Services avoid
`next/*` imports so a dedicated backend remains possible.
**Alternatives:** NestJS/Fastify backend now (clear separation, but second
deploy, duplicate auth, more ops); serverless per route (cold starts, transaction
and tenant-context friction).
**Consequences:** Coarser scaling; framework coupling mitigated by DEP rules;
extraction path documented.
**Phase:** PH-03.

### ADR-016 — Single server-side policy module, default deny

**Status:** `Approved` (owner directive, Stage 2 §4D)
**Context:** Authorization scattered across handlers is the most common source of
privilege bugs.
**Decision:** One module (`src/lib/permissions`) exposes the only authorization
entrypoint. Every page, route handler, server action, job, export, file access and
AI tool call evaluates: session → tenant → entitlement → permission → scope →
state → separation of duties. Absence of a grant is denial.
**Alternatives:** Per-module checks (drift); database-only enforcement
(insufficient for scopes and state); UI-only (explicitly rejected by the brief).
**Consequences:** Policy module becomes a critical, heavily tested component;
must be fast enough for per-request use; denial reasons are logged with codes.
**Phase:** PH-05. **Detail:** `TENANCY_AND_AUTHORIZATION_ARCHITECTURE.md`.

### ADR-017 — RSC-first rendering with client islands

**Status:** `Proposed`
**Context:** Dashboards are read-heavy and data-dense; shipping data-fetching
JavaScript for every screen wastes bandwidth and leaks logic to the client.
**Decision:** React Server Components for pages and data reads; client components
only where interaction requires them. List state in the URL. No global client
store in v1.
**Alternatives:** SPA with client fetching (simpler mental model, worse first
paint, more exposed logic); hybrid per-team choice (inconsistency).
**Consequences:** Team must understand the server/client boundary; some
third-party components require client wrappers; testing needs both RSC and
browser coverage.
**Phase:** PH-06.

### ADR-018 — Server actions for mutations, shared Zod schemas

**Status:** `Proposed`
**Context:** Form-heavy business application; duplicated client and server
validation is a recurring defect source.
**Decision:** Mutations from the UI use server actions. Each action validates
input with a shared Zod schema, authorizes, calls one service, returns a typed
result. Route handlers are used for programmatic clients, webhooks and streaming
responses. No form library in v1 beyond React primitives.
**Alternatives:** REST-only from the client (more glue, token handling); tRPC
(nice DX, another abstraction, weaker fit for webhooks); heavy form library
(premature).
**Consequences:** Server actions need explicit CSRF/origin consideration; error
shape must be consistent; progressive enhancement is a bonus, not a requirement.
**Phase:** PH-09.

### ADR-019 — Zod as the single contract-validation mechanism

**Status:** `Proposed`
**Context:** Zod is already installed and used for environment configuration.
Multiple validation libraries would fragment contracts.
**Decision:** Zod schemas are the single source of truth for input validation at
every boundary, and are reused to derive TypeScript types. Business invariants
that require database state remain in services, not schemas.
**Alternatives:** Yup/Valibot (no benefit here); JSON Schema only (weaker TS
inference); manual validation (rejected at Stage 1).
**Consequences:** Schemas live in `src/lib/contracts` or colocated with the
feature; large schemas must be composed, not duplicated; runtime cost is
acceptable at the boundary.
**Phase:** PH-09.

### ADR-020 — REST-style JSON API at `/api/v1`, major version in path

**Status:** `Proposed`
**Context:** Integrations, webhooks and future partners need a stable contract;
the UI mostly uses server actions.
**Decision:** Resource-oriented JSON endpoints under `/api/v1`, plural nouns,
HTTP verbs, major version in the path, additive minor changes within a version.
**Alternatives:** GraphQL (over-fetch flexibility, but complexity and authz
granularity cost); tRPC (TypeScript-only, poor fit for external consumers);
unversioned API (breaks integrations).
**Consequences:** Must define deprecation policy (`OD-045`); duplicated surface
with server actions must share the same service layer.
**Phase:** PH-09.

### ADR-021 — RFC 9457 Problem Details for API errors

**Status:** `Proposed`
**Context:** Inconsistent error shapes make integrations fragile and leak
internals.
**Decision:** Errors use Problem Details fields (`type`, `title`, `status`,
`detail`, `instance`) plus ONO extensions: stable `code`, `correlationId`, and
optional field-level `errors[]`. Client messages are plain language; internals
stay in logs.
**Alternatives:** Custom envelope (fine but reinvents a standard); bare HTTP
status (no machine-readable detail).
**Consequences:** Error catalog must be maintained; codes are permanent once
published.
**Phase:** PH-09.

### ADR-022 — Keyset pagination with allow-listed sort and filter

**Status:** `Proposed`
**Context:** Offset pagination degrades on large tenant tables and produces
unstable pages; arbitrary sort/filter parameters invite unindexed scans.
**Decision:** Cursor (keyset) pagination on indexed columns; default page size
with a hard maximum; sort and filter fields are allow-listed per resource;
unknown parameters are rejected.
**Alternatives:** Offset/limit (simple, degrades); exhaustive search API (cost and
abuse risk).
**Consequences:** UI must carry a cursor; "jump to page N" is not supported;
counts may be approximate and must be labelled.
**Phase:** PH-09.

### ADR-023 — Idempotency keys on unsafe mutating endpoints

**Status:** `Proposed`
**Context:** Retries, double-clicks and network timeouts duplicate business
effects (double invoices, duplicate payments).
**Decision:** Unsafe mutating endpoints accept `Idempotency-Key`; the key,
request hash, response and status are persisted per tenant with a retention
window; replay returns the original result.
**Alternatives:** Client-side dedupe only (untrusted); database unique constraints
alone (insufficient for multi-step operations).
**Consequences:** One extra table and write per mutation; retention window is an
open decision (`OD-046`); not applied to trivially idempotent reads.
**Phase:** PH-09.

### ADR-024 — Transactional outbox instead of a message broker

**Status:** `Proposed`
**Context:** Domain events are needed for analytics, notifications and workflow
decoupling, but a broker adds a component the team does not yet need.
**Decision:** Events are written to an `event_outbox` table in the same
transaction as the business change. The worker dispatches them at-least-once;
handlers are idempotent via a processed-event ledger.
**Alternatives:** Broker (Kafka/RabbitMQ/SQS) now (operational cost, premature);
synchronous in-request side effects (fragile, slow); database triggers (hidden
logic).
**Consequences:** At-least-once semantics must be handled everywhere; dispatch
latency is seconds not milliseconds; revisit at measured volume (`OD-038`).
**Phase:** PH-10.

### ADR-025 — Append-only audit written in the business transaction

**Status:** `Proposed`
**Context:** Async audit loses events on crash; application-role deletes destroy
evidence.
**Decision:** Audit rows are inserted inside the same transaction as the change.
The application database role has `INSERT`/`SELECT` on the audit table but no
`UPDATE`/`DELETE`. Correction is a new event referencing the prior one.
**Alternatives:** Async audit pipeline (throughput benefit, integrity loss);
external audit service (added dependency, still needs local correlation).
**Consequences:** Slight write amplification; high-volume tables need
partitioning; support access writes to the tenant's audit stream.
**Phase:** PH-10.

### ADR-026 — Five-level data classification

**Status:** `Proposed`
**Context:** Not all records need the same handling; classification drives
masking, export, logging and retention. Stage 1 defined five labels; credentials
need a class that is never assigned to business records.
**Decision:** `public`, `internal`, `confidential`, `restricted`, `secret`.
`secret` is reserved for credentials, keys and tokens and is never a business
record class. Each entity field declares a class; classes map to masking, export
permission, audit-on-read, and retention rules.
**Alternatives:** Four levels without `secret` (loses explicit credential
handling); three levels (loses distinction between business-confidential and
legally sensitive); per-field manual policy (inconsistent).
**Consequences:** Classification must be reviewed per module; misclassification
is a security defect; drives `REQ-SEC-004`. This reconciles the Stage 1 five-label
model in `SECURITY_PRIVACY_AND_COMPLIANCE_REQUIREMENTS.md` §6.1 with the Stage 2
architecture (`CF-12`).
**Phase:** PH-05.

### ADR-027 — Analytics on a read replica before any warehouse

**Status:** `Proposed`
**Context:** Heavy reporting on the primary database risks transactional
performance; a warehouse is premature.
**Decision:** Materialised views and registered queries initially; introduce a
read replica at PH-16 for analytics and exports; consider an OLAP store only when
measured query cost justifies it.
**Alternatives:** Warehouse from day one (cost, ETL complexity); primary-only
(contention); per-dashboard caches (inconsistent truth).
**Consequences:** Replica lag must be surfaced as freshness; replica is
read-only; promotion/replica failure needs a defined degraded mode.
**Phase:** PH-16. **Open decision:** `OD-040`.

### ADR-028 — Database-backed feature flags, no vendor in v1

**Status:** `Proposed`
**Context:** Industry profiles, extensions and phased rollout all need gating;
a vendor introduces a runtime dependency on the request path.
**Decision:** Flags stored in the database with tenant/plan scope, evaluated by a
cached resolver with short TTL and explicit invalidation.
**Alternatives:** Environment variables (no per-tenant control); SaaS flag vendor
(nice UI, request-path dependency, cost).
**Consequences:** Flag evaluation must be fast and tenant-scoped; flags are
audited when changed; stale cache must fail closed for security-relevant flags.
**Phase:** PH-24.

### ADR-029 — No executable tenant configuration

**Status:** `Approved` (owner directive, Stage 2 §10 and §8)
**Context:** Tenant-supplied scripts or expressions would create an unbounded
attack surface and make behaviour unreviewable.
**Decision:** Tenant configuration is data only — labels, selections, field
definitions, thresholds, approved workflow variant choice. No scripting, no
expression language, no tenant-authored SQL, no uploaded code.
**Alternatives:** Sandboxed script runtime (rejected: security, performance,
supportability); template DSL (deferred, see `OD-016`); no configuration at all
(rejected: violates industry requirement).
**Consequences:** Some rare industry needs require an engineering extension
(correct outcome); configuration validation must be strict; migration of
configuration versions must be supported.
**Phase:** PH-08.

### ADR-030 — Declarative, versioned, schema-validated industry profiles

**Status:** `Proposed`
**Context:** Profiles must be reviewable, diffable and safe; tenants must be able
to inspect what changed.
**Decision:** Each profile version is an immutable JSON document validated
against a profile JSON Schema, stored with a version and changelog. Tenant
selection resolves to an `EffectiveTenantConfig` computed from: platform
defaults → industry profile(s) → tenant overrides → entitlements.
**Alternatives:** Code-based profiles (fast to build, unreviewable by product);
database rows per setting (hard to diff); per-tenant forks (drift).
**Consequences:** Resolution order must be deterministic and testable; conflicts
(metric parameters, terminology) require explicit tenant choice; profile upgrades
are opt-in with impact preview.
**Phase:** PH-24.

### ADR-031 — Database registry + object storage for model artefacts

**Status:** `Proposed`
**Context:** Models need versioning, approval state, metrics and artefact
references without adopting an ML platform.
**Decision:** Registry tables hold model key, version, dataset reference,
metrics, status, approver, model card; artefacts live in object storage keyed by
content hash.
**Alternatives:** MLflow or similar (useful, extra service); git-LFS only (no
approval workflow); artefact in database (size, backup cost).
**Consequences:** Registry lifecycle must be enforced in code; artefact integrity
verifiable by hash; promotion is a separate authorized action (`SOD-5`).
**Phase:** PH-20. **Open decision:** `OD-042`.

### ADR-032 — Batch-first inference; synchronous only where justified

**Status:** `Proposed`
**Context:** Most business predictions (churn, collections risk, demand) tolerate
hourly or daily latency; synchronous serving adds cost and failure modes.
**Decision:** Default execution is scheduled batch scoring into a prediction
store. Synchronous serving is introduced only for use cases where a user is
waiting and the model is fast, small and stable.
**Alternatives:** Synchronous everything (cost, latency, availability coupling);
batch only (excludes interactive insight).
**Consequences:** UI must read precomputed predictions with timestamps; real-time
use cases require an explicit decision per case (`OD-041`); freshness labels are
mandatory.
**Phase:** PH-21.

### ADR-033 — AI may never exceed the requesting actor's authority

**Status:** `Approved` (owner directive, Stage 2 §6F and §11)
**Context:** An assistant with ambient authority is a privilege-escalation path
and a data-exfiltration path.
**Decision:** Every AI call executes as the requesting actor: same tenant, same
permissions, same scopes. Context retrieval uses the same repositories and policy
as the UI. A tool call cannot widen scope, and the AI has no credentials of its
own.
**Alternatives:** Service-account AI with post-filtering (rejected: leakage risk);
separate AI data store (rejected: duplication and drift).
**Consequences:** Some cross-cutting analysis is impossible for low-privilege
users — correct behaviour; prompt-injection defences are mandatory; every tool
invocation is logged.
**Phase:** PH-22.

### ADR-034 — Allow-listed, schema-validated AI tool execution

**Status:** `Proposed`
**Context:** Tool calling is the mechanism by which an AI could change business
data.
**Decision:** Tools are declared per use case and role, with Zod input schemas,
explicit permission requirements, and a classification of `read`/`propose`/
`execute`. v1 exposes only `read` and `propose`; `execute` requires human
approval bound to a recommendation version.
**Alternatives:** Free-form function calling (unbounded); no tools (assistant
becomes a text generator with no value).
**Consequences:** Tool surface must be reviewed like an API; arguments are
untrusted input; execution is audited with arguments hash and result status.
**Phase:** PH-23.

### ADR-035 — Marketplace isolated from operational data paths

**Status:** `Proposed` (deferred programme)
**Context:** A future marketplace must never become a route to identifiable
tenant records.
**Decision:** Marketplace aggregation runs as a separate pipeline with its own
access path, its own credentials, explicit participation records and k-anonymity
thresholds. It never queries operational tables directly at request time.
**Alternatives:** Reuse the analytics service (tempting, but collapses the
boundary); third-party broker (loses governance).
**Consequences:** Requires legal basis and a separate governance decision
(`OD-025`); no design work beyond this record until approved.
**Phase:** Post-PH-26.

### ADR-036 — Hosting provider and environment topology

**Status:** `Requires approval`
**Context:** The architecture must not assume a vendor. No credentials, regions or
services have been selected.
**Decision:** Not made. Requirements are fixed: managed PostgreSQL, object
storage, container or equivalent compute, secret store, private networking,
per-environment isolation, automated backups with tested restore.
**Alternatives:** Major cloud provider; regional provider; self-hosted.
**Consequences:** Blocks PH-26 and constrains PH-03 (CI) and PH-10 (storage,
jobs). Data residency (`OD-022`) must be decided with it.
**Phase:** PH-26. **Open decisions:** `OD-011`, `OD-022`.

---

## 4. Changes from Stage 1

| ADR | Stage 1 status | Stage 2 status | Reason |
| --- | --- | --- | --- |
| ADR-001 | `Proposed` | `Approved` | Stage 2 instruction directs a modular monolith unless justified |
| ADR-016 | — (new) | `Approved` | Stage 2 §4D directs explicit, default-deny, server-side authorization |
| ADR-029 | — (new) | `Approved` | Stage 2 §10 forbids unrestricted custom logic in tenant configuration |
| ADR-033 | — (new) | `Approved` | Stage 2 §6F forbids AI bypassing authorization |
| ADR-002…014 | `Proposed` | `Proposed` | Unchanged; still awaiting explicit acceptance |
| ADR-015, 017–028, 030–032, 034–035 | — (new) | `Proposed` | Required by Stage 2 §5–§13 |
| ADR-036 | — (new) | `Requires approval` | Provider selection is a business decision |

No Stage 1 ADR was withdrawn, renumbered or silently re-scoped.

---

## 5. Decisions that must be settled before Stage 3

Stage 3 is repository and development infrastructure (PH-03). It needs only:

| Decision | Why it blocks Stage 3 | Default if unanswered |
| --- | --- | --- |
| `OD-010` test tooling | CI must run a real test command | Vitest + Playwright proposed |
| `OD-011` CI platform | Pipelines must exist somewhere | GitHub Actions proposed |
| ADR-015 backend topology | Determines repo layout and build scripts | Next.js + worker |
| ADR-019 validation | Determines where contract schemas live | Zod |
| ADR-020/021/022/023 conventions | Determines lint/contract scaffolding | As recorded |

Everything else (auth provider, database, ORM, RLS, storage, ML runtime) is
needed later, not for Stage 3.

---

## 6. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Stage 2 ADR set: 14 Stage 1 records preserved, 22 new records added, 4 owner-approved. |
