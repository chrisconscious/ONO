# ONO — System Architecture Plan

| Field | Value |
| --- | --- |
| Document | System Architecture Plan |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — every decision below is **proposed**, not approved |
| Requirements | `REQ-SEC-*`, `REQ-INT-*`, `REQ-OPS-*`, `NFR-*` |

---

## 1. Architectural principles

| ID | Principle | Consequence |
| --- | --- | --- |
| AP-1 | Modular monolith first | One deployable application with enforced internal boundaries |
| AP-2 | Boundaries are explicit, not aspirational | Feature slices with public entry points; no deep imports |
| AP-3 | Tenancy is structural | Enforced in the data-access layer, tested continuously |
| AP-4 | Contracts before code | Validated input/output at every boundary |
| AP-5 | Deterministic core, probabilistic edge | Rules decide money, permissions and compliance |
| AP-6 | Intelligence is a service, not a scatter of prompts | One inference orchestrator, one evidence format |
| AP-7 | Async for anything slow or external | Jobs for imports, reports, integrations, model runs |
| AP-8 | Observability from day one | Correlation IDs across request, job, integration and inference |
| AP-9 | Reversible by default | Feature flags, additive migrations, no destructive defaults |
| AP-10 | No premature distribution | Split a service only when a documented constraint demands it |

### 1.1 Why a modular monolith (ADR-001)

- Small team, broad domain: distribution would multiply operational cost without
  proven need.
- Transactions matter: quote → order → invoice spans modules and needs atomicity.
- Authorisation is uniform: one policy layer is safer than several.
- The ML service is the **one** justified extraction (different runtime, different
  scaling profile, different dependency risk).

Extraction triggers (any one justifies revisiting): sustained CPU-bound ML load,
independent scaling requirement, team split by ownership, or a regulatory
requirement for isolation.

---

## 2. System context

```
                         ┌──────────────────────────────┐
                         │        ONO Web Client        │
                         │  Next.js App Router + React  │
                         └──────────────┬───────────────┘
                                        │ HTTPS
                         ┌──────────────▼───────────────┐
                         │      ONO Application         │
                         │  ┌────────────────────────┐  │
                         │  │ Presentation (RSC/UI)  │  │
                         │  ├────────────────────────┤  │
                         │  │ Route handlers / actions│ │
                         │  ├────────────────────────┤  │
                         │  │ Services (business)    │  │
                         │  ├────────────────────────┤  │
                         │  │ Repositories (data)    │  │
                         │  ├────────────────────────┤  │
                         │  │ Jobs / Integrations    │  │
                         │  └────────────────────────┘  │
                         └───┬─────────┬─────────┬──────┘
                             │         │         │
              ┌──────────────▼──┐  ┌───▼─────┐  ┌▼─────────────────┐
              │  PostgreSQL     │  │ Object  │  │ Python ML service│
              │  (system of     │  │ storage │  │ (planned, PH-19+)│
              │   record)       │  │ (docs)  │  │ FastAPI          │
              └─────────────────┘  └─────────┘  └──────────────────┘
                             │
              ┌──────────────▼──────────────────────────────┐
              │ External systems: email, payments (recorded  │
              │ only), accounting, messaging, AI providers   │
              └─────────────────────────────────────────────┘
```

---

## 3. Layer model

| Layer | Responsibility | May depend on | Must not depend on |
| --- | --- | --- | --- |
| Presentation | Rendering, layout, client interaction | Feature public API, shared UI | Repositories, Prisma, secrets |
| Transport | Route handlers, server actions, webhooks | Services, validation | UI components |
| Application / services | Business rules, orchestration, transactions | Repositories, domain, policy | React, `next/*` request objects |
| Domain | Entities, value objects, invariants, state machines | Nothing external | Framework, database |
| Data access | Queries, persistence, tenant guard | Prisma client, domain types | UI, services (no reverse dependency) |
| Infrastructure | Jobs, email, storage, integrations, ML client | Config, logging | UI |

### 3.1 Dependency rules

| ID | Rule |
| --- | --- |
| DEP-1 | Features expose a single `index.ts` public surface; cross-feature imports use it only. |
| DEP-2 | `src/server/services` never imports React or `next/server` request types. |
| DEP-3 | Prisma is imported only in `src/server/repositories` and `src/lib/database`. |
| DEP-4 | `src/lib/permissions` is the only authority for authorisation decisions. |
| DEP-5 | Shared UI components contain no data fetching. |
| DEP-6 | Circular dependencies between features are prohibited; promote shared logic to `src/lib` or `src/server`. |

---

## 4. Component inventory

| Component | Responsibility | Location | Phase |
| --- | --- | --- | --- |
| App shell | Layout, navigation, tenant context | `src/app/(tenant)` | PH-06 |
| Auth screens | Sign-in, reset, invitation acceptance | `src/app/(auth)` | PH-05 |
| Platform console | Tenant and plan administration | `src/app/(platform-admin)` | PH-05/24 |
| Route handlers | HTTP boundary, validation, authorisation | `src/app/api` | PH-09 |
| Policy engine | Permission + scope evaluation | `src/lib/permissions` | PH-05 |
| Validation schemas | Contract validation | `src/lib/validation` | PH-05+ |
| Repositories | Tenant-scoped persistence | `src/server/repositories` | PH-08 |
| Services | Business operations and transactions | `src/server/services` | PH-09 |
| Job runner | Scheduled and async work | `src/server/jobs` | PH-10 |
| Integration gateway | External adapters, retries, credentials | `src/features/integrations` | PH-10 |
| Audit writer | Append-only event recording | `src/features/audit` | PH-10 |
| Metrics registry | Definitions and calculation | `src/features/analytics` | PH-16 |
| Inference orchestrator | Context, rules, models, evidence, recommendations | `src/features/ai-insights` | PH-22 |
| ML client | Contract to the Python service | `src/server/services/ml` | PH-21 |
| ML service | Training, serving, evaluation | Separate repo/service | PH-19–21 |
| Object storage adapter | Documents and exports | `src/server/services/storage` | PH-10 |
| Notification service | In-app and email delivery | `src/server/services/notifications` | PH-10 |

---

## 5. Request lifecycle

```
Request
  → Edge/proxy (TLS, rate limit)
  → Next.js route handler / RSC
  → Session resolution (identity + tenant)
  → Zod validation of input
  → Authorisation (permission + scope)
  → Service call (transaction boundary)
      → Repository (tenant guard applied)
      → Domain invariants
      → Audit append
  → Response mapped to permitted fields
  → Structured log with correlation ID
```

| ID | Rule |
| --- | --- |
| RL-1 | Tenant and actor are resolved from the session, never from request data. |
| RL-2 | Input is validated before any service call. |
| RL-3 | Response serialisation excludes fields the actor may not see. |
| RL-4 | Errors expose a stable code and correlation ID, never internals. |
| RL-5 | Every state-changing operation is idempotency-aware where retries are possible. |

---

## 6. Tenancy architecture

### 6.1 Chosen data model (ADR-014, proposed)

Shared database, shared schema, `tenant_id` on every tenant-owned table.

| Alternative | Why not (for v1) |
| --- | --- |
| Schema per tenant | Migration fan-out and connection pressure at 1,000 tenants |
| Database per tenant | Operational cost and cross-tenant reporting complexity |
| Row-level security only | Useful defence in depth, but cannot replace application policy |

### 6.2 Enforcement layers

| Layer | Control |
| --- | --- |
| Session | Tenant derived from authenticated membership |
| Service | Every service method requires an actor context |
| Repository | Base repository injects and asserts tenant predicate |
| Database | Proposed defence-in-depth: row-level security policies where supported |
| Tests | Automated cross-tenant probes for every repository |
| Jobs | Explicit tenant context, never a global scan without a tenant loop |
| Exports | Scope filtered at query time, re-checked at delivery |
| AI tools | Context assembler only retrieves within the actor's scope |

| ID | Rule |
| --- | --- |
| TEN-1 | A query without a tenant predicate is a defect, even in platform code. |
| TEN-2 | Cross-tenant identifiers are treated as not found. |
| TEN-3 | Aggregations must not reveal the existence of another tenant's records. |
| TEN-4 | Tenant deletion is a controlled, audited lifecycle, not a cascade from a request. |

---

## 7. Authentication and session architecture (ADR-004, ADR-005 — proposed)

| Concern | Proposed approach |
| --- | --- |
| Provider | Select after evaluating requirements (`OD-003`); no lock-in to a vendor-specific data model |
| Session | Server-verified session cookie, `HttpOnly`, `Secure`, `SameSite=Lax`, rotation on privilege change |
| Storage | Database-backed sessions preferred over stateless tokens so revocation is immediate |
| MFA | Available for privileged roles; enforceable per tenant policy |
| Recovery | Time-limited, single-use, audited |
| Revocation | Membership suspension revokes all sessions in the same transaction |
| Re-authentication | Required for sensitive actions (role change, exports, payment approval) |

| ID | Rule |
| --- | --- |
| AUTH-1 | The application opens on authentication; no unauthenticated product surface. |
| AUTH-2 | Identity is never trusted from a header or query parameter. |
| AUTH-3 | Session fixation is prevented by rotation at sign-in and privilege change. |
| AUTH-4 | Failed attempts are rate-limited and logged. |

---

## 8. Background jobs

| Concern | Proposed design |
| --- | --- |
| Execution | Durable queue with at-least-once delivery; handlers idempotent |
| Scheduling | Cron-like schedules defined in code, tenant-aware |
| Context | Each job carries tenant, actor/service identity, correlation ID |
| Retries | Bounded exponential backoff; dead-letter queue |
| Observability | Job status, duration, failures exposed in platform health |
| Safety | No unbounded tenant-wide scans without paging and rate control |

---

## 9. Integrations

| Concern | Design |
| --- | --- |
| Contract | Adapter per system, normalised internal events |
| Credentials | Encrypted at rest, never logged, rotated, least privilege |
| Resilience | Timeouts, circuit breaking, rate-limit respect, dead-letter |
| Inbound | Signed webhooks, replay protection, idempotent handling |
| Outbound | Event-driven with retry and delivery status |
| Isolation | One failing integration cannot block unrelated tenants |

---

## 10. ML service boundary (ADR-009 — proposed)

```
ONO app ──HTTP/JSON (validated)──► ML service
   │                                  │
   ├─ dataset export (versioned) ────► training
   ├─ feature request ───────────────► serving
   └─ prediction + metadata ◄─────────┘
```

| Concern | Rule |
| --- | --- |
| Contract | Versioned request/response schemas; no free-form payloads |
| Identity | Service credential plus the originating actor's scope reference |
| Data | Only the tenant's authorised dataset; no shared training on tenant data without an explicit governance decision |
| Timeouts | Hard limits; the application degrades to "unavailable", never blocks a page |
| Provenance | Every response carries model ID, version, dataset version and timestamp |
| Fallback | Deterministic rules and descriptive analytics must still work if ML is down |

**Constraint:** a separate Python service is only adopted if `OD-007` concludes it
is justified. In-process statistical methods remain valid for v1 if they meet
quality requirements.

---

## 11. Performance and caching

| Concern | Approach |
| --- | --- |
| Metrics | Precomputed/materialised aggregates with recorded freshness (ADR-008) |
| Dashboards | Read from metric store, not raw joins at request time |
| Lists | Keyset pagination; no unbounded result sets |
| Caching | Tenant-scoped keys only; no cross-tenant cache entries |
| Invalidation | Versioned metric keys; invalidation on source write |
| Heavy work | Offloaded to jobs with progress reporting |

---

## 12. Observability

| Signal | Content |
| --- | --- |
| Logs | Structured JSON, correlation ID, tenant ID hash, actor ID, outcome |
| Metrics | Request latency, error rate, job success, queue depth, inference latency |
| Traces | Request → service → repository → integration → inference |
| Alerts | Error budget burn, job failures, SLA breaches, drift, backup failure |
| Audit | Separate immutable business-event stream, not mixed with operational logs |

**Rule:** operational logs never contain business record contents, credentials,
tokens or personal data beyond identifiers.

---

## 13. Environments and topology (proposed)

| Environment | Purpose | Data |
| --- | --- | --- |
| Local | Development | Synthetic, disposable database |
| Test | Automated verification | Ephemeral, seeded per run |
| Staging | Pre-production validation | Anonymised or synthetic |
| Production | Customer workloads | Real tenant data, isolated credentials |

| Concern | Proposal |
| --- | --- |
| Hosting | Managed container platform + managed PostgreSQL |
| CDN/proxy | TLS termination, WAF, rate limiting |
| Secrets | Managed secret store per environment |
| Backups | Automated, encrypted, restore-tested (`REQ-OPS-003`) |
| Release | Migration → health check → deploy → smoke test → monitored rollout |

---

## 14. Architecture decisions requiring approval

| ID | Decision | Proposal | Status |
| --- | --- | --- | --- |
| ADR-001 | Architecture style | Modular monolith | `Proposed` |
| ADR-002 | Primary database | PostgreSQL 16+ | `Proposed` |
| ADR-003 | ORM / query layer | Prisma, with SQL for reporting | `Proposed` |
| ADR-004 | Authentication provider | Vendor-neutral selection in PH-05 | `Proposed` |
| ADR-005 | Session strategy | DB-backed sessions with immediate revocation | `Proposed` |
| ADR-006 | Tenant isolation | Shared schema + repository guard + RLS defence | `Proposed` |
| ADR-007 | Custom field storage | JSONB with schema validation, indexed selectively | `Proposed` |
| ADR-008 | Metric calculation | Hybrid materialised + on-read | `Proposed` |
| ADR-009 | ML runtime | Separate Python service only if justified | `Proposed` |
| ADR-010 | Job runner | Durable queue with idempotent handlers | `Proposed` |
| ADR-011 | Document storage | S3-compatible object storage | `Proposed` |
| ADR-012 | AI provider strategy | Pluggable providers, deterministic fallback | `Proposed` |
| ADR-013 | Reporting queries | SQL views for BI after PH-16 | `Proposed` |
| ADR-014 | Multi-tenancy model | Shared schema | `Proposed` |

No ADR is approved. Each requires a written decision recorded in
`OPEN_DECISIONS_AND_ASSUMPTIONS.md` and, once accepted, an entry in
`docs/decisions/`.

---

## 15. Architecture risks

| ID | Risk | Impact | Mitigation |
| --- | --- | --- | --- |
| `RISK-001` | Tenant isolation defect | Catastrophic | Repository guard, RLS, automated probes, review checklist |
| `RISK-002` | Modular monolith degrades into a tangle | Slower delivery | Enforced boundaries, dependency lint, feature entry points |
| `RISK-003` | Metric definitions drift between dashboards | Loss of trust | Registry-only calculation, review gate on changes |
| `RISK-004` | Over-broad AI context assembly | Data leakage | Scope-bound retrieval, tool allow-list, logging |
| `RISK-005` | Premature service extraction | Operational overhead | Documented extraction triggers |
| `RISK-006` | Custom fields become an untyped dumping ground | Data quality collapse | Type constraints, limits, validation, reports on usage |
| `RISK-007` | Approval bypass under pressure | Fraud/audit failure | Server-side enforcement, self-approval blocks, audit |
| `RISK-008` | Reporting queries overload primary database | Availability | Read replica or analytics store decision before scale |

---

## 16. Phase mapping

| Phase | Architecture work |
| --- | --- |
| PH-02 | Confirm ADRs, contracts, boundary rules |
| PH-03 | Repo conventions, CI, test harness |
| PH-04 | Design system and screen inventory |
| PH-05 | Auth, tenancy, policy engine, platform boundary |
| PH-06 | App shell and navigation |
| PH-08 | Schema, migrations, tenant guard |
| PH-09 | APIs, services, rules |
| PH-10 | Jobs, audit, notifications, storage, integrations |
| PH-16 | Metric registry and data model |
| PH-19–21 | ML pipeline, models, serving |
| PH-22 | Inference engine and decision layer |
| PH-25–26 | Hardening, deployment, handover |

## 17. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial architecture plan and proposed ADR set. |
