# ONO — Technology Stack Evaluation

| Field | Value |
| --- | --- |
| Document | Technology Stack Evaluation |
| Stage | 2 — Architecture and technical contracts |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — proposed choices, not installed and not approved |
| Scope | Evaluation criteria, candidates, trade-offs and proposed selections for every layer |
| Excludes | Installation, configuration, dependency changes, deployment, benchmark results |
| Related | `TECHNOLOGY_STACK_AND_GOVERNANCE.md` (what is actually installed), `ARCHITECTURE_DECISION_RECORDS.md` |

---

## 1. How these evaluations were made

Candidates were assessed against the criteria below. Weights reflect ONO's actual
constraints — a small team, transaction-heavy business workflows, strict tenancy,
and a long product life — not general popularity.

| ID | Criterion | Weight | What it means here |
| --- | --- | --- | --- |
| C-1 | Fit to requirements | 25% | Supports the 145 functional requirements without workarounds |
| C-2 | Security and isolation | 20% | Tenant enforcement, auth, audit, least privilege are achievable |
| C-3 | Operational cost | 15% | One to three engineers can run it |
| C-4 | Type safety and contracts | 10% | Schema-first development is enforceable |
| C-5 | Ecosystem and longevity | 10% | Maintained release line, hiring pool, commercial licence |
| C-6 | Performance at target scale | 10% | 1,000 tenants / 100,000 users (`NFR-004`) |
| C-7 | Exit path and lock-in | 10% | Data and code can move without a rewrite |

**Rule:** a technology is never selected because it is fashionable, and a
candidate is never presented as installed unless it is verified in
`TECHNOLOGY_STACK_AND_GOVERNANCE.md`.

**Status vocabulary** for this document:

| Status | Meaning |
| --- | --- |
| `Verified present` | Inspected in the repository and builds cleanly |
| `Selected (proposed)` | Recommended by architecture; awaiting ADR acceptance |
| `Conditional` | Adopted only if a named decision or measurement says so |
| `Deferred` | Valid candidate, deliberately not adopted now |
| `Rejected (v1)` | Considered and declined for v1, with a reason and revisit trigger |

---

## 2. Verified baseline

Only these are present today. Everything else in this document is a proposal.

| Layer | Present | Version | Evidence |
| --- | --- | --- | --- |
| Runtime | Node.js | 24.22.1 | `node --version` |
| Package manager | npm | 11.19.1 | `package-lock.json` |
| Framework | Next.js | 16.4.3 | `package.json` |
| UI | React / React DOM | 19.3.1 | `package.json` |
| Language | TypeScript (strict) | 5.9.3 | `tsconfig.json` |
| Styling | Tailwind CSS | 4.3.3 | `globals.css`, `postcss.config.mjs` |
| Data toolkit | Prisma CLI + client | 6.19.3 | `schema.prisma` |
| Validation | Zod | 4.6.7 | `src/lib/configuration/env.ts` |
| Lint | ESLint + `eslint-config-next` | 9.39.5 / 16.4.3 | `eslint.config.mjs` |

Absent: database, migrations, auth provider, component library, test runner, CI,
object storage, job runner, observability, Python, FastAPI. See
`TECHNOLOGY_STACK_AND_GOVERNANCE.md` §2.6.

---

## 3. Frontend

### 3.1 Proposed selection

| Concern | Proposed choice | Status | ADR |
| --- | --- | --- | --- |
| Framework | Next.js App Router | `Verified present` | ADR-017 |
| UI runtime | React 19 with Server Components | `Verified present` | ADR-017 |
| Language | TypeScript strict, no `any` | `Verified present` | — |
| Styling | Tailwind CSS with design tokens | `Verified present` | — |
| Components | shadcn/ui pattern: owned source, Radix primitives | `Selected (proposed)` — `OD-006` | — |
| Routing | Route groups: `(auth)`, `(tenant)`, `(platform-admin)` | `Selected (proposed)` | ADR-017 |
| Reads | Server-side service calls in RSC | `Selected (proposed)` | ADR-017 |
| Mutations | Server actions; `/api/v1` for external clients | `Selected (proposed)` | ADR-018, ADR-020 |
| Forms | Native form + server action + shared Zod schema | `Selected (proposed)` | ADR-018, ADR-019 |
| List state | URL search params (cursor, filters, sort) | `Selected (proposed)` | ADR-022 |
| Client state | Local component state only; no global store in v1 | `Selected (proposed)` | ADR-017 |
| Charts | Small wrapper over an accessible chart library, chosen at PH-18 | `Deferred` | — |
| i18n | Externalised strings; English v1 (`OD-031`) | `Selected (proposed)` | — |

### 3.2 Why RSC-first

Dashboards and record pages are read-heavy. Rendering them on the server:

- keeps data access and authorization in one place;
- avoids shipping query logic and large payloads to the browser;
- makes the permission projection authoritative before HTML exists;
- reduces the client state surface to genuine interactions.

Cost: the team must understand the server/client boundary, and third-party
components that assume browser APIs need client wrappers. This is accepted
(`ADR-017`).

### 3.3 Why not a client-rendered SPA

| Criterion | RSC-first | SPA + REST |
| --- | --- | --- |
| First meaningful paint | Server HTML | Requires JS + fetch waterfall |
| Authorization location | Server only | Server plus client filtering temptation |
| Data over-fetch | Controlled by the server | Often over-fetches |
| Offline capability | Not supported either way | Not supported without extra work |
| Team familiarity | Modern Next.js | Broad, but duplicates logic |

An SPA would add a second data-access path without removing the server one. It is
`Rejected (v1)` for the product UI; `/api/v1` still exists for integrations.

### 3.4 Component system

`shadcn/ui` is proposed because components are copied into the repository and
owned, rather than imported from a versioned component package. This matters for
accessibility fixes, design tokens and long-term control. It is not installed and
`OD-006` must confirm it at PH-04. A fully custom system is `Deferred`; a
vendor UI kit with runtime theming is `Rejected (v1)` because it fights Tailwind 4
tokens and accessibility ownership.

### 3.5 Frontend state rules

| State type | Where it lives | Example |
| --- | --- | --- |
| Server data | Server render / server cache | Invoice detail, dashboard values |
| List position and filters | URL | `?status=open&cursor=...` |
| Form draft | Component state | Unsaved quotation line |
| Dialog/panel visibility | Component state | Approval drawer |
| Permission affordances | Server-provided `can` map | Hide "Approve" button |
| Cross-page client state | None in v1 | — |

No global client store is adopted in v1. If one becomes necessary, it requires an
ADR and must not become a second source of business truth.

---

## 4. Backend

### 4.1 Options evaluated

| Option | Benefits | Costs | Verdict |
| --- | --- | --- | --- |
| A. Next.js server only (route handlers + server actions) | One deploy, native transaction/UI cohesion, lowest ops | Long jobs unsafe in request path; coarse scaling | **Chosen with a worker** |
| B. Dedicated backend framework (NestJS/Fastify/Django) | Clear API boundary, independent scaling, team split | Second deploy, duplicate auth/tenancy, more ops, more contracts | `Rejected (v1)`; revisit trigger below |
| C. Hybrid: Next.js UI + separate API from day one | Strong separation | Highest complexity for a small team; transactional UI flows need chatty APIs | `Rejected (v1)` |
| D. Serverless functions per feature | Elastic, low idle cost | Cold starts, connection pooling, tenant context, transaction boundaries | `Rejected (v1)` |

**Selection: A plus a separately launched worker process from the same codebase**
(`ADR-015`). The web process and worker share services, repositories, schema and
contracts. This is a process split, not a service split.

### 4.2 Extraction trigger for a dedicated backend

A dedicated backend becomes justified only if at least one is true and is recorded
as an ADR:

1. Public partner APIs require independent scaling or a separate release cadence.
2. The team splits by ownership and a single deploy becomes a coordination cost.
3. A regulatory requirement demands network isolation of the API tier.
4. Measured request/worker contention cannot be solved by process scaling.

To keep extraction cheap: services never import `next/*` or React; contracts are
HTTP-shaped; dependencies point inward (`DEP-01`).

### 4.3 Backend building blocks

| Concern | Proposed mechanism | Status |
| --- | --- | --- |
| HTTP boundary | Route handlers under `src/app/api/v1` | `Selected (proposed)` |
| UI mutations | Server actions | `Selected (proposed)` |
| Validation | Zod schemas in `src/lib/contracts` / feature contracts | `Selected (proposed)` |
| Business logic | Services in `src/server/services/<module>` | `Selected (proposed)` |
| Transactions | One service call = one transaction | `Selected (proposed)` |
| Authorization | Single policy module `src/lib/permissions` | `Selected (proposed)` |
| Errors | RFC 9457 Problem Details + stable codes | `Selected (proposed)` |
| Background work | Database-backed job table + worker | `Selected (proposed)` |
| Events | Transactional outbox | `Selected (proposed)` |
| Audit | Same-transaction append-only insert | `Selected (proposed)` |

---

## 5. Database and data access

### 5.1 Relational store

| Candidate | Strengths | Weaknesses for ONO | Verdict |
| --- | --- | --- | --- |
| PostgreSQL 16+ | Exact numerics, JSONB, RLS, partial/expression indexes, mature ops, open licence | Requires operational competence; RLS/pooling care | **Selected (proposed)** — `OD-002` |
| MySQL 8 | Popular, managed everywhere | Weaker JSON indexing, weaker RLS story | Rejected (v1) |
| SQL Server | Strong tooling, familiar to finance teams | Licensing and ops cost | Rejected (v1) |
| MongoDB | Flexible documents | Cross-module transactions and financial integrity suffer | Rejected (v1) |

PostgreSQL is the only plausible system of record for quote → order → invoice,
PO → receipt → bill → payment, and stock movement reconciliation.

### 5.2 Data access

| Candidate | Strengths | Weaknesses | Verdict |
| --- | --- | --- | --- |
| Prisma 6 | Type-safe, migration workflow, already installed | Complex reporting and some bulk operations need raw SQL | **Selected (proposed)** — `OD-004` |
| Kysely | Excellent SQL control, type-safe query builder | Weaker migration/ownership workflow, more hand-written SQL | Deferred |
| Drizzle | Lightweight, SQL-like, good types | Younger migration and tooling ecosystem | Deferred |
| Raw SQL everywhere | Maximum control | Loses type safety and boundary discipline | Rejected (v1) |

**Boundary:** Prisma for transactional reads/writes and migrations; hand-written,
parameterised SQL only inside repositories for reporting/aggregation. Prisma
imports are confined to `src/lib/database` and `src/server/repositories`
(`DEP-03`).

### 5.3 Migrations

| Rule | Mechanism |
| --- | --- |
| Version control | Prisma Migrate; every migration committed and reviewed |
| Additive first | add → backfill → switch reads → remove old |
| Destructive change | Requires backup, rollback plan and named reviewer |
| Drift | Schema diff check in CI; drift is a release blocker |
| Production | `migrate deploy` in the release step after pre-flight checks |
| Rollback | Forward-fix preferred; restore only for data-loss incidents |

These implement `MIG-1`–`MIG-8` from `DATABASE_AND_DATA_DOMAIN_PLAN.md` §9.

### 5.4 Analytics store

Same PostgreSQL at first; read replica from PH-16; materialised metric values;
no warehouse until measured query cost justifies it (`ADR-027`, `OD-040`). A
columnar warehouse is `Deferred`, not rejected permanently.

---

## 6. Authentication and sessions

### 6.1 Requirements that constrain the choice

Server-verified identity, immediate revocation, MFA for privileged roles,
invitation flow, enterprise SSO readiness, no vendor-owned user table as the
source of truth, and tenant membership independent of the identity provider.

### 6.2 Candidate classes

| Option | Strengths | Costs / risks | Status |
| --- | --- | --- | --- |
| Managed identity provider | MFA, SSO, recovery, lower security surface | Lock-in, per-MAU cost, data residency, user table ownership | Candidate — `OD-003` |
| Self-hosted auth library | Control, no per-user fee, local data | More operational and security responsibility | Candidate — `OD-003` |
| Custom auth implementation | Full control | Highest risk; not justified | `Rejected (v1)` |

No provider is selected. The architecture requires that whichever is chosen:

1. keeps a local `user` + `membership` model authoritative for tenancy and roles;
2. issues a server-verifiable session;
3. supports immediate session revocation on suspension;
4. supports MFA enforcement per tenant policy;
5. does not make the vendor the only place a user can be disabled.

**Sessions:** database-backed, opaque cookie, `HttpOnly`, `Secure`,
`SameSite=Lax`, rotation on sign-in and privilege change (`ADR-005`, `OD-024`).
Stateless JWT-only sessions are `Rejected (v1)` because revocation becomes
best-effort.

---

## 7. Asynchronous work, storage and notifications

### 7.1 Background jobs

| Option | Strengths | Weaknesses | Verdict |
| --- | --- | --- | --- |
| Database-backed queue | No new infrastructure, transactional with business data, observable | Polling latency, primary-database load | **Selected (proposed)** — `OD-008` |
| Managed queue (SQS/Cloud Tasks) | Elastic, decoupled | Extra vendor, separate semantics, local emulation | Deferred until volume justifies |
| Redis-backed queue | Fast, familiar | Another stateful service; durability tuning | Deferred |
| In-request async work | No infrastructure | Requests time out; work is lost on deploy | Rejected (v1) |

Mechanism: `job` table with status, attempts, `runAfter`, lease/heartbeat, last
error and dead-letter state; `FOR UPDATE SKIP LOCKED`; bounded concurrency;
exponential backoff; idempotency keys (`ADR-010`).

### 7.2 Object storage

S3-compatible API is the contract, not a provider. Private buckets,
tenant-namespaced non-guessable keys, short-lived signed URLs, malware scanning
before download, lifecycle rules (`ADR-011`, `OD-009`).

### 7.3 Notifications

In-app notifications are rows; email is an adapter behind an interface. No
provider selected; provider must support bounce/complaint handling and a
tenant-scoped sender identity. SMS is deferred.

---

## 8. AI and ML

### 8.1 Split of responsibilities

| Responsibility | Where | Why |
| --- | --- | --- |
| Rules, approvals, limits | TypeScript core | Deterministic, transactional, auditable |
| Metric calculation | TypeScript core + SQL | Must reconcile to source records |
| Simple statistics / baselines | TypeScript in worker | Avoids a second runtime for v1 |
| Feature materialisation, training, evaluation | Python service (conditional) | Ecosystem and compute profile |
| Model serving | Python service (conditional) or worker batch | Isolation and scaling |
| Orchestration, evidence, recommendations | TypeScript core | Must use actor scope and policy |
| Assistant and tools | TypeScript core | Authorization boundary |

### 8.2 ML runtime candidates

| Option | Benefits | Costs | Verdict |
| --- | --- | --- | --- |
| Python + FastAPI service | Ecosystem, reproducibility, separate scaling | Second runtime, deploy, auth, monitoring | **Conditional** — `OD-007`, `ADR-009` |
| TypeScript-only statistics | One runtime, simpler ops | Limited libraries for advanced models | Default until a use case demands more |
| Managed ML platform | Less ops, registry/serving included | Cost, lock-in, data residency | Deferred |
| Notebook-only workflow | Fast experimentation | Not reproducible, not auditable | Rejected (v1) |

**Condition for Python:** a use case requires libraries or compute that are not
reasonably available in Node, or serving latency/throughput demands isolation.
The HTTP contract is defined regardless, so the decision stays reversible.

FastAPI + Pydantic is proposed for the service because typed request/response
models and OpenAPI generation match the contract-first rule. It is not installed.

### 8.3 AI provider

Pluggable `AiProvider` interface, one approved provider initially, no silent
fallback to another provider, deterministic fallback to rules + analytics
(`ADR-012`, `OD-027`). Provider selection is blocked on data-processing terms,
residency and no-training commitments.

---

## 9. Infrastructure

No provider, region, account or credential exists. The following are requirements,
not selections.

| Concern | Requirement | Candidate approach | Status |
| --- | --- | --- | --- |
| Environments | Local, test, staging, production, separately credentialed | Managed container platform + managed PostgreSQL | `Requires approval` — `OD-011` |
| CI/CD | Typecheck, lint, build, tests, migration check, secret scan, dependency audit | GitHub Actions | `Selected (proposed)` — `OD-011` |
| Secrets | Managed store per environment; no secrets in source or logs | Platform secret manager | `Requires approval` |
| Compute | Stateless web + worker; health checks; rolling deploy | Containers or equivalent | `Requires approval` — ADR-036 |
| Database | Managed PostgreSQL, PITR, read replica later | Managed service | `Requires approval` — `OD-002`, `OD-021` |
| Object storage | S3-compatible, private, versioned, lifecycle rules | Managed bucket | `Selected (proposed)` — `OD-009` |
| Observability | Structured logs, metrics, traces, alerts | Managed vendor initially (`OD-012`) | `Selected (proposed)` |
| Backups | Encrypted, automated, restore-tested quarterly | Provider snapshots + logical export | `Requires approval` — `OD-021` |
| CDN/WAF | TLS, WAF, rate limiting, request IDs | Edge provider | `Requires approval` |

**Residency** (`OD-022`) and **sub-processors** (`OD-034`) are unresolved and
constrain provider choice. No architecture claim depends on a specific vendor.

---

## 10. Testing and quality tooling

| Layer | Proposed tool | Status | Why |
| --- | --- | --- | --- |
| Unit / integration | Vitest | `Selected (proposed)` — `OD-010` | Fast, TS-native, works with Next |
| End-to-end | Playwright | `Selected (proposed)` — `OD-010` | Multi-browser, accessibility checks |
| Component/a11y | Testing Library + axe | `Selected (proposed)` | Behaviour over implementation |
| Contract | Schema fixtures + route tests | `Selected (proposed)` | Proves validation and error shape |
| Isolation | Custom cross-tenant probes | Required | `NFR-008`, `RISK-001` |
| Load | k6 or equivalent at PH-25 | Deferred | No target environment yet |
| Dependency audit | `npm audit` + advisory review | Required | `REQ-SEC-008` context |
| Secret scanning | CI secret scanner | Required | `RISK-014` |

Jest + Cypress is `Deferred`; it is viable but does not offer an advantage over
the proposed pair. Test tooling is not installed and cannot run today.

---

## 11. Decision matrix

| ID | Decision | Choice | Status | ADR / OD |
| --- | --- | --- | --- | --- |
| TECH-01 | UI framework | Next.js App Router + React 19 | `Verified present` | ADR-017 |
| TECH-02 | Language | TypeScript strict | `Verified present` | — |
| TECH-03 | Styling | Tailwind CSS 4 tokens | `Verified present` | — |
| TECH-04 | Component source | shadcn/ui pattern, owned | `Selected (proposed)` | `OD-006` |
| TECH-05 | Rendering | RSC-first, client islands | `Selected (proposed)` | ADR-017 |
| TECH-06 | Mutation transport | Server actions + `/api/v1` | `Selected (proposed)` | ADR-018, ADR-020 |
| TECH-07 | Validation | Zod | `Selected (proposed)` | ADR-019 |
| TECH-08 | Backend topology | Next.js + worker, no separate framework | `Selected (proposed)` | ADR-015 |
| TECH-09 | Database | PostgreSQL 16+ | `Selected (proposed)` | ADR-002, `OD-002` |
| TECH-10 | ORM | Prisma + repository SQL | `Selected (proposed)` | ADR-003, `OD-004` |
| TECH-11 | Migrations | Prisma Migrate, reviewed | `Selected (proposed)` | ADR-003 |
| TECH-12 | Authentication | Provider not selected; DB-backed sessions | `Requires approval` | ADR-004, `OD-003` |
| TECH-13 | Jobs | Database-backed queue | `Selected (proposed)` | ADR-010, `OD-008` |
| TECH-14 | Events | Transactional outbox | `Selected (proposed)` | ADR-024 |
| TECH-15 | Storage | S3-compatible | `Selected (proposed)` | ADR-011, `OD-009` |
| TECH-16 | Analytics | PostgreSQL + read replica, no warehouse yet | `Selected (proposed)` | ADR-027, `OD-040` |
| TECH-17 | ML runtime | TypeScript first, Python conditional | `Conditional` | ADR-009, `OD-007` |
| TECH-18 | Model registry | Database + object storage | `Selected (proposed)` | ADR-031, `OD-042` |
| TECH-19 | AI provider | Pluggable, one approved, deterministic fallback | `Selected (proposed)` | ADR-012, `OD-027` |
| TECH-20 | CI | GitHub Actions | `Selected (proposed)` | `OD-011` |
| TECH-21 | Hosting | Not selected | `Requires approval` | ADR-036, `OD-011`, `OD-022` |
| TECH-22 | Observability | Managed initially | `Selected (proposed)` | `OD-012` |
| TECH-23 | Tests | Vitest + Playwright | `Selected (proposed)` | `OD-010` |
| TECH-24 | Feature flags | Database-backed | `Selected (proposed)` | ADR-028 |

---

## 12. Rejected and deferred summary

| Technology / approach | Verdict | Reason | Revisit trigger |
| --- | --- | --- | --- |
| Microservices per module | Rejected (v1) | Operational cost, distributed transactions | Measured scaling or team split |
| GraphQL | Rejected (v1) | Authorization granularity and complexity | External client demand with proven need |
| tRPC | Rejected (v1) | TypeScript-only; poor external fit | Internal-only API if `/api/v1` becomes a burden |
| Kafka / RabbitMQ | Deferred | No volume yet; outbox suffices | `OD-038` threshold reached |
| Redis | Deferred | Extra stateful service; cache/queue not yet needed | Measured latency or queue contention |
| Warehouse / OLAP | Deferred | Replica + materialisation first | `OD-040` threshold |
| Managed ML platform | Deferred | Cost and data-residency constraints | Model volume or compliance need |
| Client-rendered SPA | Rejected (v1) | Duplicate data path, worse first paint | Offline requirement changes |
| Custom auth | Rejected (v1) | Security risk without compensating benefit | Never, unless no viable provider |
| Notebook-only ML | Rejected (v1) | Not reproducible or auditable | Never for production models |

---

## 13. Lock-in and exit paths

| Choice | Lock-in risk | Exit path |
| --- | --- | --- |
| Next.js | Medium — framework-specific rendering | Services keep `next/*` out; API contracts are HTTP |
| PostgreSQL | Low — open, portable | Standard SQL; Prisma schema can be dumped |
| Prisma | Medium — schema and client coupling | Repository boundary isolates it; SQL is portable |
| Object storage | Low — S3 API is a de facto standard | Adapter interface; keys are provider-neutral |
| AI provider | Medium — model behaviour and terms | `AiProvider` interface; no provider-specific prompts in services |
| Managed observability | Low–medium — query language and agent | Structured logs are vendor-neutral |
| Identity provider | High — user lifecycle and tokens | Local `user`/`membership` remain authoritative |

---

## 14. Open decisions affecting technology

| ID | Question | Blocks |
| --- | --- | --- |
| `OD-002` | PostgreSQL confirmation | PH-08 |
| `OD-003` | Authentication provider and session model | PH-05 |
| `OD-004` | Prisma and reporting SQL boundary | PH-08 |
| `OD-006` | Component system | PH-04 |
| `OD-007` | Python ML service justification | PH-19 |
| `OD-008` | Job technology | PH-10 |
| `OD-009` | Object storage provider | PH-10 |
| `OD-010` | Test tooling | PH-03 |
| `OD-011` | CI/CD platform and environments | PH-03 |
| `OD-012` | Observability stack | PH-10 |
| `OD-037` | Row-level security in v1 or later | PH-08 |
| `OD-038` | Broker adoption threshold | PH-24 |
| `OD-040` | Warehouse/OLAP trigger | PH-16 |
| `OD-041` | Real-time inference use cases | PH-21 |
| `OD-042` | Model registry build vs managed | PH-20 |

---

## 15. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Stage 2 technology evaluation: criteria, candidates, selections, deferrals and exit paths. No installation. |
