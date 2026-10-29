# ONO — System Architecture

| Field | Value |
| --- | --- |
| Document | System Architecture |
| Stage | 2 — Architecture and technical contracts |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — architecture described, not implemented |
| Supersedes | Extends `SYSTEM_ARCHITECTURE_PLAN.md` (Stage 1). That document remains as the Stage 1 record; this is the Stage 2 authority |
| Decisions | `ADR-001`–`ADR-036` in `ARCHITECTURE_DECISION_RECORDS.md` |
| Code | None written in this stage. No packages installed, no migrations, no services deployed |

---

## 1. Purpose and scope

This document defines **how ONO is built**: its runtime units, logical components,
boundaries, dependency rules and quality attributes. It covers the whole planned
platform — CRM, sales, marketing, finance, inventory, procurement, projects,
workforce, support, documents, strategy, BI, ML, inference, SaaS administration
and the future governed marketplace — not a subset.

It does **not** define screens (`UI_UX_DESIGN_REQUIREMENTS.md`), requirement
statements (`REQUIREMENTS_TRACEABILITY_MATRIX.md`) or the physical schema
(`DATA_ARCHITECTURE_PLAN.md` defines domains only; the schema is PH-08).

**Naming:** the product is **ONO**. Stage 2 instructions referred to "ClickIT"
again; that is recorded as conflict `CF-11` and changes nothing.

---

## 2. Architectural principles

Principles are the rules that survive changing circumstances. Each is testable.

| ID | Principle | How it is enforced | Status |
| --- | --- | --- | --- |
| AP-01 | Modular monolith first, extraction only on evidence | Feature slices, enforced dependency rules, documented extraction triggers | `Approved` (owner directive) |
| AP-02 | Schema-first | Domain and contracts reviewed before dependent code | `Approved` (owner directive) |
| AP-03 | Tenant isolation is structural | Repository guard on every tenant-owned query + RLS defence + isolation probes | `Approved` (owner directive) |
| AP-04 | Explicit, default-deny authorization | Single policy module; every entry point evaluates | `Approved` (owner directive) |
| AP-05 | Reliable business data | Transactions, constraints, idempotency, immutable financial/audit records | `Approved` (owner directive) |
| AP-06 | Controlled AI integration | AI uses the actor's scope, cannot bypass rules or execute unapproved actions | `Approved` (owner directive) |
| AP-07 | Incremental delivery | Module contracts allow independent build, test and later replacement | `Approved` (owner directive) |
| AP-08 | No arbitrary tenant code | Configuration is declarative data validated against schemas | `Approved` (owner directive) |
| AP-09 | Deterministic before probabilistic | Rules decide money, permissions, compliance; models only inform | `Recorded` (`EPI-8`) |
| AP-10 | Observability is part of the feature | Correlation ID, structured logs, health checks from PH-03 | `Proposed` |
| AP-11 | Reversibility | Additive migrations, feature flags, documented rollback | `Proposed` |
| AP-12 | Honest degradation | Missing or stale data is labelled, never presented as current | `Proposed` |

### 2.1 What "modular monolith" means here, precisely

One deployable codebase, **two runtime processes** from the same source:

1. **Web process** — serves requests (pages, server actions, route handlers).
2. **Worker process** — runs scheduled and asynchronous work.

Plus, from PH-19 and only if `OD-007` justifies it, a **third runtime**: a Python
ML service. That is the single extraction the architecture anticipates.

Modularity is enforced by *import direction*, not by process boundaries. A module
that cannot be imported wrongly does not need a network hop.

---

## 3. System context

```
                         ┌───────────────────────────────────────────┐
                         │              ONO Web Client               │
                         │   Next.js App Router · React · TS · TW    │
                         └────────────────────┬──────────────────────┘
                                              │ HTTPS
                         ┌────────────────────▼──────────────────────┐
                         │        Edge: TLS · WAF · rate limit        │
                         └────────────────────┬──────────────────────┘
                                              │
        ┌─────────────────────────────────────▼─────────────────────────────────────┐
        │                          ONO APPLICATION (U1 + U2)                        │
        │                                                                            │
        │  Presentation (RSC / client islands)                                       │
        │  Transport (route handlers, server actions)                                │
        │  Application services (business rules, transactions)                       │
        │  Domain (entities, invariants, state machines)                             │
        │  Data access (tenant-guarded repositories)                                 │
        │  Infrastructure adapters (mail, storage, AI, ML client, notifications)     │
        │  Cross-cutting (auth, permissions, validation, config, observability)      │
        └───┬───────────────┬────────────────┬────────────────┬─────────────────────┘
            │               │                │                │
     ┌──────▼──────┐ ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────────────┐
     │ PostgreSQL  │ │  Object     │  │ ML service  │  │ External providers  │
     │ primary +   │ │  storage    │  │ (Python,    │  │ email · AI ·        │
     │ read replica│ │ (documents, │  │  conditional│  │ accounting ·        │
     │ (U3)        │ │  exports)   │  │  PH-19+)    │  │ messaging           │
     └─────────────┘ └─────────────┘  └─────────────┘  └─────────────────────┘
```

No component above is deployed today. Provider selection is deliberately open
(`OD-011`, `OD-022`); this document does not assume a cloud vendor.

---

## 4. Runtime units

| ID | Unit | What runs | Scaling model | Phase |
| --- | --- | --- | --- | --- |
| U1 | Web process | Next.js server: RSC rendering, server actions, `/api/v1/*` route handlers | Horizontal, stateless | PH-05 |
| U2 | Worker process | Same codebase, different entrypoint: scheduled jobs, outbox dispatch, metric materialisation, batch scoring, report generation, imports | Horizontal by queue/lease, not per-tenant | PH-10 |
| U3 | PostgreSQL primary | System of record | Vertical first, then read replica | PH-08 |
| U3b | PostgreSQL read replica | Analytics reads, exports, heavy reports | Read-only | PH-16 |
| U4 | Object storage | Documents, exports, model artefacts, dataset snapshots | Managed | PH-10 |
| U5 | ML service | Python/FastAPI: feature materialisation, training orchestration, serving | Conditional (`OD-007`), PH-19 | PH-19 |
| U6 | Edge proxy | TLS, WAF, rate limiting, request IDs | Managed | PH-26 (basic from PH-03 locally) |
| U7 | Observability pipeline | Log/metric/trace collection | Managed or self-hosted (`OD-012`) | PH-10 |

**Why U1 and U2 are separate processes from day one:** a report export or a
metric backfill must never consume the request's event loop. Separating them is
cheap now and expensive later. They share code, schema and contracts — this is
not a service split.

---

## 5. Layered architecture

| Layer | Path (target) | Responsibility | May import | Must never import |
| --- | --- | --- | --- | --- |
| Presentation | `src/app/` route groups (`auth`, `tenant`, `platform-admin`), `src/features/*/components` | Render, interact, client state | Feature public API, `src/components` | Repositories, Prisma, services internals, env |
| Transport | `src/app/api/v1/**`, server actions in features | HTTP boundary: parse, validate, authorize, delegate | Services, `src/lib/validation` | UI components, Prisma |
| Application | `src/server/services/<module>` | Business rules, orchestration, transaction boundary | Repositories, domain, policy, adapters | React, `next/*` request objects |
| Domain | `src/server/domain/<module>` | Entities, value objects, invariants, state machines | Pure TypeScript only | Framework, database, network |
| Data access | `src/server/repositories/<module>`, `src/lib/database` | Queries, persistence, tenant guard | Prisma, domain types | Services, UI |
| Adapters | `src/server/adapters/*` | Outbound I/O: mail, storage, AI, ML, payments(recorded) | Config, logging | Domain logic |
| Cross-cutting | `src/lib/{auth,permissions,validation,configuration,observability,contracts}` | Identity, policy, schemas, config, telemetry | — | Feature code |
| Jobs | `src/server/jobs/*` | Scheduled and async handlers | Services, repositories | React |

### 5.1 Dependency rules (enforceable)

| ID | Rule | Enforcement |
| --- | --- | --- |
| DEP-01 | Import direction is one-way: presentation → transport → application → domain/data | ESLint `no-restricted-imports` + review (PH-03) |
| DEP-02 | A feature exposes `index.ts`; cross-feature imports use only that | Lint rule + PR checklist |
| DEP-03 | Prisma appears only in repositories and `src/lib/database` | Lint `no-restricted-imports` |
| DEP-04 | `src/lib/permissions` is the only place an authorization decision is made | Review + single exported entrypoint |
| DEP-05 | No `any`; `unknown` at boundaries then validate | `tsc` + ESLint |
| DEP-06 | No feature-to-feature cycles | `dependency-cruiser` or equivalent in CI |
| DEP-07 | Domain layer has zero runtime dependencies | Lint on `src/server/domain` |

These rules exist in documentation only until PH-03 wires the tooling.

---

## 6. Logical components

22 logical components. "Monolith" means in-process module; it does **not** mean
"one folder" or "no boundary".

| ID | Component | Responsibility | Runtime | Phase |
| --- | --- | --- | --- | --- |
| CMP-01 | Authentication & sessions | Identity proof, session issue/rotation/revocation, MFA readiness, recovery | U1 | PH-05 |
| CMP-02 | Organisation & tenancy | Tenant lifecycle, branches, departments, teams, settings, entitlements | U1/U2 | PH-05 |
| CMP-03 | Authorization & policy | Permission + scope + state + separation-of-duties evaluation | U1/U2 | PH-05 |
| CMP-04 | Core business modules | CRM, sales, marketing, finance, inventory, procurement, projects, workforce, support, documents, strategy | U1/U2 | PH-11–15 |
| CMP-05 | Rules & workflow orchestration | State machines, approval routing, thresholds, escalation | U1/U2 | PH-09 |
| CMP-06 | API & integration layer | Route handlers, webhooks, contracts, error model, idempotency | U1 | PH-09 |
| CMP-07 | Operational database | PostgreSQL system of record, constraints, transactions | U3 | PH-08 |
| CMP-08 | Audit & event recording | Append-only audit, transactional outbox, event dispatch | U1/U2 | PH-10 |
| CMP-09 | Background jobs | Scheduling, retries, dead-letter, leases, idempotent handlers | U2 | PH-10 |
| CMP-10 | File & document services | Upload validation, storage, versioning, signed access | U1/U2 + U4 | PH-10 |
| CMP-11 | Notifications | In-app and email delivery, preferences, digests, templates | U1/U2 | PH-10 |
| CMP-12 | BI & analytics | Metric registry, calculation, materialisation, reports, drill-down | U1/U2 + U3/U3b | PH-16–18 |
| CMP-13 | Data preparation & features | Dataset snapshots, feature definitions, validation, parity | U2 (+U5) | PH-19 |
| CMP-14 | ML training & evaluation | Baselines, runs, metrics, calibration, bias review | U5 (or U2) | PH-20 |
| CMP-15 | Model registry | Versioning, approval state, artefact references, model cards | U5 + U3 | PH-20 |
| CMP-16 | Model serving | Validated requests, pinned versions, latency limits, structured output | U5 (or U1) | PH-21 |
| CMP-17 | Inference orchestration | Authorized context, rules→analytics→models, evidence assembly | U1/U2 | PH-22 |
| CMP-18 | Decision & recommendations | Options, expected effect, ranking, approval binding, outcomes | U1/U2 | PH-22 |
| CMP-19 | AI assistant & tool execution | Natural-language interface, allow-listed tools, no ambient authority | U1 | PH-23 |
| CMP-20 | SaaS administration | Plans, entitlements, feature flags, support grants, tenant provisioning | U1 | PH-24 |
| CMP-21 | Observability | Logs, metrics, traces, health, alerts, audit-adjacent signals | All | PH-10 |
| CMP-22 | Governed data marketplace | Aggregation, k-anonymity, purpose binding, separate access path | Not built | Post-PH-26 |

### 6.1 Deployment classification

| Class | Components | Rationale |
| --- | --- | --- |
| In monolith, web process | CMP-01, CMP-02, CMP-03, CMP-06, CMP-19, CMP-20 | Request-scoped, low latency, tight transactional coupling |
| In monolith, worker process | CMP-08 dispatch, CMP-09, CMP-11 delivery, CMP-12 materialisation, CMP-13 | Long or scheduled work must not block requests |
| In monolith, both | CMP-04, CMP-05, CMP-17, CMP-18, CMP-21 | Same logic, different triggers |
| Separate runtime | CMP-07, CMP-10 storage, U5 ML components (CMP-14/15/16) | Database and object storage are inherently separate; ML has a different dependency and scaling profile |
| Deferred / not built | CMP-22 | Separate governance programme |

**Explicitly rejected for v1:** one service per module. Eighteen services would
multiply deploy, auth, tracing and transactional complexity for a system whose
defining operations (quote → order → invoice; PO → receipt → bill → payment) are
transactional.

---

## 7. Request lifecycle

```
Incoming request
  → Edge (TLS, WAF, rate limit, X-Request-Id if absent)
  → Next.js: RSC page | server action | /api/v1 route handler
  → Session resolution        (CMP-01: identity + active tenant membership)
  → Input parsing + Zod       (src/lib/validation — reject before work)
  → Authorization             (CMP-03: entitlement → permission → scope → state → SoD)
  → Application service       (CMP-04/05: one transaction boundary)
       ├── Repository        (tenant guard asserts tenantId, CMP-07)
       ├── Domain invariants (state machine, totals, balances)
       ├── Audit append      (CMP-08, same transaction)
       └── Outbox append     (CMP-08, same transaction)
  → Response mapping          (only permitted fields; no internals)
  → Structured log + trace    (CMP-21, correlation ID)
```

| ID | Rule |
| --- | --- |
| RL-01 | Tenant and actor come from the session; never from body, query or headers |
| RL-02 | Validation precedes authorization, so malformed input cannot probe policy |
| RL-03 | Authorization precedes data access, so denied records are never loaded |
| RL-04 | One service call = one transaction = one audit append |
| RL-05 | Audit and outbox writes commit with the business change or not at all |
| RL-06 | Responses are projections, not database rows |
| RL-07 | Errors expose a stable code + correlation ID; internals stay in logs |

---

## 8. Server/client boundary (frontend architecture)

| Concern | Decision | ADR |
| --- | --- | --- |
| Rendering | React Server Components by default; client components only for interactivity | ADR-017 |
| Data reads | Server-side service call inside RSC; no client fetch for first paint | ADR-017 |
| Mutations | Server actions for form flows; `/api/v1` route handlers for programmatic clients and webhooks | ADR-015, ADR-020 |
| Validation | Shared Zod schema used by client (ergonomics) and server (authority) | ADR-019 |
| Forms | Server actions + `useActionState`-style state; no heavy form library in v1 | ADR-018 |
| State | URL/search params for list state; server cache for reads; minimal client state (dialogs, drafts) | ADR-017 |
| Authorization in UI | Server returns a `can` map for affordances only; enforcement is server-side | ADR-016 |
| Money/derived values | Computed server-side; client renders, never recalculates totals | ADR-016 |
| Caching | Tag-based, tenant-scoped keys; invalidate on mutation | ADR-023 |
| Errors | Typed result union from actions; Problem Details from API | ADR-021 |

**Hard rule:** the client may hide a control it believes is forbidden. It may
never be the reason an operation is forbidden.

---

## 9. Backend topology decision

Evaluated: (a) Next.js server capabilities only, (b) dedicated backend framework,
(c) hybrid.

**Chosen: (a) with a worker process, structured so (c) is possible later.**

| Criterion | Next.js-only | Dedicated backend | Chosen (a + worker) |
| --- | --- | --- | --- |
| Transactional cohesion with UI | Native | Requires contracts and duplication | Native |
| Operational cost | Lowest | Highest (second deploy, auth, tracing) | Low |
| Long-running work | Unsafe in request handlers | Better | Solved by worker process |
| Independent scaling | Coarse | Fine | Sufficient to 1,000 tenants |
| ML in Python | Requires separate service anyway | Same | Already planned as U5 |
| Migration cost if needed | Moderate | — | Contracts already HTTP-shaped |

A dedicated backend (NestJS, Fastify, Django) is **not** adopted in v1. It would be
adopted only if `OD-011`/PH-24 produce a documented requirement (for example
public partner APIs with independent scaling, or a team split). The extraction
path is: keep services free of `next/*` imports (DEP-01, RL rules) so they can be
hosted elsewhere.

---

## 10. Data architecture summary

Detailed in `DATA_ARCHITECTURE_PLAN.md`. Six data planes, deliberately separated:

| Plane | Contents | Store | Writable by |
| --- | --- | --- | --- |
| P1 Operational (OLTP) | Tenants, users, CRM, finance, inventory, projects, support | PostgreSQL primary | Application services only |
| P2 Derived analytics | Metric values, snapshots, freshness, drill metadata | PostgreSQL (materialised), later replica/OLAP | Calculation and materialisation services only |
| P3 Training | Dataset snapshots, feature definitions, manifests | Object storage + registry tables | Pipeline only |
| P4 Model artefacts | Trained artefacts, model cards | Object storage | Registry only |
| P5 Inference results | Predictions, insights, recommendations, decisions, outcomes | PostgreSQL | Inference/decision services only |
| P6 Governance & audit | Audit events, access events, outbox, retention, lineage | PostgreSQL (append-only) | Write-once services; no app-level updates |

Rules: operational data is never edited by analytics; analytics never reads
across tenants; P3/P4 never contain raw personal data beyond what the approved
dataset declares; P5 always carries model/version provenance.

---

## 11. Industry configuration (summary)

Detailed in `INDUSTRY_CONFIGURATION_ARCHITECTURE.md`.

The universal core carries no `if (industry === ...)` branches. Industry
behaviour is **declarative data** resolved into an effective configuration:

```
Industry catalogue (published, versioned)
        │
        ├── Industry profile (modules, terminology, metrics, workflows, fields, roles)
        │
Tenant selection(s) ──► Effective Tenant Configuration (resolved, cached, auditable)
        │
        └── Tenant overrides (bounded: labels, optional modules within entitlement,
                               custom fields, workflow variant choice)
```

A tenant whose industry is not in the catalogue receives a **provisional
profile**: universal core plus inferred modules, fully usable immediately. No
tenant is ever blocked, and no tenant-supplied code is ever executed (`AP-08`).

---

## 12. Intelligence architecture (summary)

Detailed in `AI_ML_INFERENCE_ARCHITECTURE.md`. Six distinct responsibilities, and
the authority of each is unambiguous:

| Component | Authority | Never does |
| --- | --- | --- |
| Business rules | Final on permissions, approvals, limits, transitions | Change because a model suggests it |
| Analytics | Final on metric values | Invent values or read outside scope |
| ML training/eval | Final on model quality claims | Decide policy or business rules |
| Model serving | Final on prediction + uncertainty | Write to source records |
| Inference orchestration | Assembles evidence and explanation | Execute actions or widen scope |
| Decision layer | Ranks options, binds approvals | Act without an authorized human |

**The LLM is never authoritative for a number, a permission or a state change.**
It may phrase an explanation whose numbers come from the analytics layer and
whose evidence comes from the retrieval layer.

---

## 13. Security architecture (summary)

Detailed in `TENANCY_AND_AUTHORIZATION_ARCHITECTURE.md`.

| Boundary | Control |
| --- | --- |
| Network | TLS, WAF, rate limits at edge |
| Application entry | Session → tenant → entitlement → permission → scope → state → SoD |
| Data access | Repository tenant guard (mandatory) + RLS as defence (`OD-037`) |
| Background jobs | Explicit service identity + tenant context per unit of work |
| Files | Private storage, short-lived signed access, permission inherited from record |
| Analytics | Scope-filtered queries; suppressed aggregates; export auditing |
| AI tools | Allow-listed, schema-validated, actor-scoped, no ambient credentials |
| Secrets | Managed store, per environment, never in source or logs |
| Audit | Append-only, tenant-visible, separate from operational logs |

---

## 14. Reliability posture

Detailed in `RELIABILITY_AND_OBSERVABILITY_PLAN.md`.

| Failure | Behaviour |
| --- | --- |
| Database unavailable | Fail closed; explicit error with correlation ID; no cached write success |
| ML service unavailable | Degrade to rules + analytics; label predictions as unavailable; core unaffected |
| AI provider unavailable | Assistant disabled with clear message; no fallback to unapproved provider |
| Integration down | Tenant-scoped failure, retries with cap, dead-letter; other tenants unaffected |
| Analytics stale | Show freshness and stale banner; never present stale as current |
| Job failure | Bounded retry, then dead-letter with owner and reason |
| Partial import | Reported as partial with row-level reasons |

---

## 15. Trade-offs accepted

| Trade-off | Chosen | Rejected alternative | Cost accepted |
| --- | --- | --- | --- |
| Deployment | Modular monolith (2 processes) | Microservices per module | Coarser scaling; needs discipline |
| Rendering | RSC-first | SPA + REST everywhere | Team must learn server/client boundaries |
| Mutations | Server actions + `/api/v1` | GraphQL / tRPC | No unified client type generation |
| Events | Transactional outbox, no broker | Kafka/RabbitMQ now | Dispatcher is our code; ceiling exists |
| Custom fields | Validated JSONB | EAV tables | Weaker per-field indexing |
| Tenancy | Shared schema + guard (+RLS) | Schema or DB per tenant | Guard discipline is critical |
| Analytics | Same PostgreSQL first | Warehouse now | Contention risk; mitigated by replica |
| ML | Batch-first, separate service only if justified | Real-time serving for all use cases | Some predictions are not instantaneous |

Each trade-off has an ADR and an extraction or reversal trigger.

---

## 16. What this architecture deliberately does not decide

| Open item | Why not now | Needed by |
| --- | --- | --- |
| Authentication provider | Vendor choice with security and lock-in implications | PH-05 (`OD-003`) |
| Hosting provider and region | No provider selected; residency unresolved | PH-26 (`OD-011`, `OD-022`) |
| RLS in v1 vs later | Security value vs operational cost | PH-08 (`OD-037`) |
| Broker adoption threshold | Depends on measured outbox throughput | PH-24 (`OD-038`) |
| Warehouse/OLAP introduction | Depends on measured query cost | PH-16 (`OD-040`) |
| Real-time vs batch inference per use case | Depends on use case value | PH-21 (`OD-041`) |
| Marketplace governance | Separate programme with legal basis | Post-PH-26 |

---

## 17. Component-to-phase map

| Phase | Components touched |
| --- | --- |
| PH-02 | All boundaries, ADRs, contracts |
| PH-03 | AP-10 tooling, DEP-01…07 enforcement, CI |
| PH-05 | CMP-01, CMP-02, CMP-03, CMP-20 (boundary) |
| PH-06–07 | Presentation layer, design system |
| PH-08 | CMP-07, tenancy guard, constraints |
| PH-09 | CMP-05, CMP-06, contract enforcement |
| PH-10 | CMP-08, CMP-09, CMP-10, CMP-11, CMP-21 |
| PH-11–15 | CMP-04 module by module |
| PH-16–18 | CMP-12 |
| PH-19–21 | CMP-13, CMP-14, CMP-15, CMP-16 |
| PH-22–23 | CMP-17, CMP-18, CMP-19 |
| PH-24 | CMP-20, CMP-22 (design only) |
| PH-25–26 | All — verification and deployment |

---

## 18. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Stage 2 architecture baseline: runtime units, layers, 22 components, boundaries, trade-offs. No implementation. |
