# ONO — Project Status

| Field | Value |
| --- | --- |
| Project | **ONO** — AI-Powered Integrated Business Intelligence & Management Platform |
| Stage | **2 — Architecture and technical contracts** |
| Stage status | **Documentation complete. Awaiting product-owner review.** |
| Implementation status | **Not authorised. Not started.** |
| Date | 2026-10-26 |
| Next permitted action | Product-owner review of the Stage 2 set, then explicit instruction for Stage 3 |

---

## 1. Where the project stands

| Question | Answer |
| --- | --- |
| Is Stage 1 complete? | Yes — 16 documents committed and pushed |
| Is Stage 2 complete? | Yes — 11 new documents plus 2 updated registers, documentation only |
| Is any requirement approved? | No |
| Has any feature been implemented? | No |
| Does code exist? | Yes — the pre-Stage-1 application scaffold only; unchanged in Stage 2 |
| Has Stage 3 started? | No |
| Is the product named ClickIT? | **No. The product is ONO.** The Stage 2 brief repeated the wrong name; recorded as `CF-11` |
| Is compliance claimed? | **No.** No control is implemented or assessed |

---

## 2. Stage 2 deliverables

All files are in `docs/`. "New" means created in Stage 2; "updated" means the
Stage 1 file was extended without losing its original content.

| # | Document | Status | Purpose |
| --- | --- | --- | --- |
| 1 | `SYSTEM_ARCHITECTURE.md` | New | Runtime units, layers, CMP-01–CMP-22, request lifecycle, trade-offs, phase map |
| 2 | `ARCHITECTURE_DECISION_RECORDS.md` | New | 36 ADRs with status, alternatives, consequences and phase |
| 3 | `TECHNOLOGY_STACK_EVALUATION.md` | New | Criteria, verified baseline, candidates, selections, deferrals, exit paths |
| 4 | `MODULE_DEPENDENCY_MAP.md` | New | M01–M23 ownership, dependency classes, graph, cycle register, enforcement |
| 5 | `API_AND_EVENT_CONTRACTS.md` | New | REST, errors, pagination, idempotency, events, BI/ML/inference contracts |
| 6 | `DATA_ARCHITECTURE_PLAN.md` | New | DOM-01–DOM-20, six data planes, lineage, retention, correction, reproducibility |
| 7 | `TENANCY_AND_AUTHORIZATION_ARCHITECTURE.md` | New | Isolation, identity, 12-step decision, scopes, SoD, enforcement points, platform boundary |
| 8 | `INDUSTRY_CONFIGURATION_ARCHITECTURE.md` | New | Catalogue, profile schema, resolution, custom industries, fields, variants, extensions |
| 9 | `AI_ML_INFERENCE_ARCHITECTURE.md` | New | Analytics, ML, registry, serving, orchestration, decisions, assistant, authority |
| 10 | `RELIABILITY_AND_OBSERVABILITY_PLAN.md` | New | SLOs, failure domains, logs, metrics, traces, alerts, degradation, backup, recovery |
| 11 | `ARCHITECTURE_IMPLEMENTATION_SEQUENCE.md` | New | 26-phase mapping, prerequisites, decision gates, tests, risks, Stage 3 readiness |
| 12 | `OPEN_DECISIONS_AND_ASSUMPTIONS.md` | Updated | Preserved Stage 1 IDs; added `OD-037`–`OD-046`, `CF-11`–`CF-12`, `RISK-016`–`RISK-025` |
| 13 | `PROJECT_STATUS.md` | Updated | This file |

**No other file was required to change.** `README.md` was updated only to index
the new documents. `DEVELOPMENT_ROADMAP.md` received one wording correction to
PH-02 (ADR range) and remains the authority for phase definitions.

---

## 3. Architecture decisions

| Status | Count | IDs |
| --- | --- | --- |
| `Approved` | 4 | `ADR-001`, `ADR-016`, `ADR-029`, `ADR-033` |
| `Proposed` | 30 | Remaining Stage 1 and Stage 2 records |
| `Requires approval` | 2 | `ADR-004` (auth provider), `ADR-036` (hosting topology) |
| `Unresolved` | 0 | — |
| `Rejected` | 0 | — |
| **Total** | **36** | — |

The four approvals are directions from the product owner, not architecture
self-approval:

- `ADR-001` — modular monolith as the starting architecture.
- `ADR-016` — one server-side, default-deny policy module.
- `ADR-029` — no executable tenant configuration.
- `ADR-033` — AI may never exceed the requesting actor's authority.

Two further **product/market decisions** are recorded in
`OPEN_DECISIONS_AND_ASSUMPTIONS.md` §6 but are not ADRs: universal industry
coverage through core plus custom path, and a future governed marketplace with no
identifiable-record access.

**Approval of a principle does not approve the mechanism.** Every mechanism
remains `Proposed` until separately accepted.

---

## 4. What the architecture fixes

| Area | Recorded direction | Status |
| --- | --- | --- |
| Topology | One codebase, web process + worker process; Python ML service conditional | Proposed (`ADR-001` approved as principle) |
| Database | PostgreSQL primary; read replica before any warehouse | Proposed |
| Data access | Prisma for transactional work; reviewed SQL for reporting | Proposed |
| Tenancy | Shared schema, mandatory tenant predicate, RLS as defence in depth | Proposed |
| Authorization | One policy module; 12-step decision; default deny | Approved principle |
| API | `/api/v1`, Problem Details, keyset pagination, idempotency | Proposed |
| Events | Transactional outbox; at-least-once; consumer ledger | Proposed |
| Audit | Append-only, written in the business transaction | Proposed |
| Frontend | RSC-first; server actions; client islands | Proposed |
| Industry config | Declarative, versioned, schema-validated; no executable code | Approved principle |
| AI/ML | Batch-first; pinned models; evidence; human approval; no execution authority | Approved principle |
| Marketplace | Isolated, governed, aggregated only; not built | Proposed; separate programme |

---

## 5. What Stage 2 deliberately did not do

| Not done | Reason |
| --- | --- |
| No application code | Stage 2 is architecture and contracts |
| No migrations or schema changes | PH-08 |
| No package installation | Technology choices are proposals |
| No API implementation | PH-09 |
| No UI screens | PH-04 onward |
| No model training or inference | PH-19 onward |
| No deployment or infrastructure | PH-26 |
| No Stage 3 work | Not authorised |
| No compliance certification | Requires legal and control assessment |
| No marketplace build | Not approved |

The repository's application scaffold is unchanged from commit `4f14249`. The
only Stage 2 changes are Markdown documents.

---

## 6. Repository state (verified at Stage 2 close)

| Area | State |
| --- | --- |
| Branch | `main`, tracking `origin/main` |
| Stage 1 baseline | `b5d6bcf` — "docs: record repository state after scaffold" |
| Stage 2 changes | Documentation only, uncommitted at the time of writing |
| Application code | Unchanged |
| Database | No instance, no `DATABASE_URL`, no migrations |
| Authentication | Absent |
| Tests | None |
| CI/CD | None |
| Verified commands | `typecheck`, `lint`, `build` are re-run before the Stage 2 commit; no application code changed |

Full technology detail: `TECHNOLOGY_STACK_AND_GOVERNANCE.md` and
`TECHNOLOGY_STACK_EVALUATION.md`.

---

## 7. Requirement status summary

| Status | Count |
| --- | --- |
| `Proposed` | 0 |
| `Recorded` | 145 functional + 12 non-functional |
| `Needs clarification` | 0 (open questions remain `OD-*`) |
| `Approved` | **0** |
| `Implemented` | **0** |
| `Verified` | **0** |
| `Withdrawn` | 0 |

**Nothing is approved, implemented or verified.** Architecture documentation is
not requirement approval.

---

## 8. Decisions recorded from the product owner

| Decision | Date | Where recorded |
| --- | --- | --- |
| Product name is **ONO**; "ClickIT" is retired | 2026-10-26 | Master spec; `CF-07`, `CF-11` |
| Stage 1 is documentation and planning only | 2026-10-26 | This document |
| Stage 2 is architecture and contracts only | 2026-10-26 | This document |
| No public marketing website inside the application | 2026-10-26 | Master spec §6.2 |
| TypeScript primary; PostgreSQL proposed | 2026-10-26 | Master spec §10, technology governance |
| 26-phase roadmap names accepted | 2026-10-26 | Roadmap §1 |
| Modular monolith (`ADR-001`) | 2026-10-26 | ADR register |
| One server-side policy module (`ADR-016`) | 2026-10-26 | ADR register |
| No executable tenant configuration (`ADR-029`) | 2026-10-26 | ADR register |
| AI cannot exceed actor authority (`ADR-033`) | 2026-10-26 | ADR register |
| Universal industry coverage via core + custom path | 2026-10-26 | `OPEN_DECISIONS...` §6 |
| Future marketplace: aggregated only, separate programme | 2026-10-26 | `OPEN_DECISIONS...` §6 |

---

## 9. Unresolved items requiring the product owner

### 9.1 Blocking a Stage 3 start

| ID | Item | Blocks |
| --- | --- | --- |
| `OD-003` | Authentication provider and session model | PH-05 |
| `OD-010`, `OD-011` | Test tooling, CI/CD and environments | PH-03 |
| `OD-002`, `OD-004` | Database and ORM/SQL boundary | PH-08 |
| `OD-001` | Pilot market and industries | PH-04 |
| `OD-006`, `OD-031` | Component system and v1 language | PH-04 |
| REC-01…REC-05 (`CF-06`) | Roadmap adjustments | Phase planning |

### 9.2 Required before the named phase

| ID | Item | Phase |
| --- | --- | --- |
| `OD-005`, `OD-015`, `OD-037` | Custom fields, limits, RLS | PH-08 |
| `OD-016`, `OD-017`, `OD-019`, `OD-024` | Workflow variants, approvals, permission exposure, sessions | PH-05/09 |
| `OD-008`, `OD-009`, `OD-012`, `OD-021`, `OD-023`, `OD-043` | Jobs, storage, observability, backup, retention, scanning | PH-10 |
| `OD-039`, `OD-044`, `OD-045`, `OD-046` | Replay, export, deprecation, idempotency | PH-09/10/18 |
| `OD-007`, `OD-026`, `OD-041`, `OD-042` | ML runtime, pooling, synchronous serving, registry | PH-19–21 |
| `OD-027`, `OD-028`, `OD-029` | AI provider, measurement, opt-out | PH-22 |
| `OD-013`, `OD-014`, `OD-020` | Catalogue curation, custom-industry visibility, support grants | PH-24 |
| `OD-018`, `OD-022`, `OD-033`, `OD-034` | Legal scope, residency, roles, sub-processors | PH-05/26 |
| `OD-035` | Special-category data scope | PH-05 (constrains PH-15) |
| `OD-038`, `OD-040` | Broker and warehouse thresholds | PH-24/16 |

### 9.3 Non-blocking but consequential

| ID | Item |
| --- | --- |
| `OD-025` | Marketplace programme (deferred) |
| `OD-030` | Dark mode |
| `OD-032` | PDF fidelity |
| `OD-036` | Multi-currency |

Full register: `OPEN_DECISIONS_AND_ASSUMPTIONS.md`.

---

## 10. Known deviations between the repository and the target vision

| ID | Deviation | Severity | Planned resolution |
| --- | --- | --- | --- |
| `CF-01` | `/` serves a landing page; target is authentication-first | High | PH-05 |
| `CF-02` | `User.tenantId` models one tenant per user | High | PH-08 (`Membership`) |
| `CF-03` | Single `role` enum; target is multi-role with scopes | High | PH-08 |
| `CF-04` | Nine modules lack feature folders | Medium | PH-04/PH-05 |
| — | No authentication, no authorization engine | Critical | PH-05 |
| — | No tests, no CI | High | PH-03 |
| — | No audit store | High | PH-10 |
| — | No metric registry | High | PH-16/PH-17 |
| — | Prisma schema unmigrated, no database | Expected | PH-08 |
| — | Environment file not created locally | Low | Developer setup |

---

## 11. Architecture risks needing early attention

| ID | Risk | Why it matters now |
| --- | --- | --- |
| `RISK-001` | Cross-tenant leakage | The single most damaging failure mode; design precedes features |
| `RISK-002` | Scope explosion | 23 modules with a small team; phase discipline is the control |
| `RISK-003` | Metric drift | Trust collapses if dashboards disagree |
| `RISK-005` | Financial correctness | Immutability and reconciliation designed before finance UI |
| `RISK-011` | Unsupported compliance claims | No claim without legal review and evidence |
| `RISK-012` | Long time to value | Vertical slices and strict gates |
| `RISK-016` | Duplicate effects from at-least-once events | Consumer ledger and idempotent handlers |
| `RISK-017` | Module boundary erosion | Lint, graph checks and one public entrypoint |
| `RISK-018` | RLS and connection pooling | Transaction-scoped tenant variable and tests |
| `RISK-025` | Marketplace boundary erosion | Separate credentials, aggregates only |

---

## 12. Stage 3 readiness

Stage 3 is **not started and not authorised**.

| Condition | State |
| --- | --- |
| Stage 2 documents reviewed | Pending product-owner review |
| ADR statuses honest | Yes |
| Blocking decisions identified | Yes — §9.1 |
| Contracts agreed | Proposed; awaiting review |
| Tenancy design reviewed | Proposed; security review pending |
| Module map accepted | Proposed |
| Data architecture accepted | Proposed |
| Phase sequence accepted | Proposed |
| Implementation authorised | **No** |

If authorised, Stage 3 should start with **PH-03 (repository and development
infrastructure)** or **PH-05 (identity, organisation and access)** after `OD-003`
is closed. Starting a domain module before tenancy, audit and contracts exist
guarantees rework.

---

## 13. Next permitted action

1. Product owner reviews the Stage 2 documentation set.
2. Product owner answers the blocking decisions in §9.1.
3. Product owner gives **explicit** instruction to begin Stage 3 — or corrects
   anything in this set first.

Until then: no Stage 3, no implementation code, no migrations, no UI
implementation, no model training, no inference engine, no deployment.

---

## 14. Change log

| Date | Change | By |
| --- | --- | --- |
| 2026-10-26 | Stage 1 baseline created: 16 documents | Documentation |
| 2026-10-26 | Product name corrected from ClickIT to ONO throughout | Documentation |
| 2026-10-26 | Scaffold committed as `4f14249`; Stage 1 docs as `80c79ea`; status fix `b5d6bcf` | Documentation |
| 2026-10-26 | Stage 2 complete: 11 new architecture documents, 2 updated registers, 36 ADRs, 46 open decisions, 12 conflicts, 25 risks. No code. | Documentation |
