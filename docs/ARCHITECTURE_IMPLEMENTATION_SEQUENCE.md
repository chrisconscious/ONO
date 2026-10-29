# ONO — Architecture Implementation Sequence

| Field | Value |
| --- | --- |
| Document | Architecture Implementation Sequence |
| Stage | 2 — Architecture and technical contracts |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — sequencing plan only. No phase is authorised or started |
| Scope | How the 26 phases consume the Stage 2 architecture, in what order, with which gates |
| Related | `DEVELOPMENT_ROADMAP.md` (phase definitions), `SYSTEM_ARCHITECTURE.md`, `ARCHITECTURE_DECISION_RECORDS.md`, `OPEN_DECISIONS_AND_ASSUMPTIONS.md` |

---

## 1. Purpose

The Stage 1 roadmap defines **what** each phase delivers. This document defines
**how the architecture is consumed** by those phases:

1. which architecture artefacts a phase depends on;
2. which decisions must be closed before it starts;
3. which interfaces must exist before dependent work begins;
4. what evidence proves the phase is complete;
5. which risks are specific to the sequencing;
6. what Stage 3 may safely start with.

It does not replace the roadmap, renumber phases, or authorise implementation.

---

## 2. Sequencing rules

| ID | Rule |
| --- | --- |
| SEQ-01 | A phase starts only when its prerequisite phases have passed their gate. |
| SEQ-02 | A blocking `OD-*` must be closed before the phase it blocks. |
| SEQ-03 | Architecture decisions may be `Proposed` during design, but must be accepted before the code depends on them. |
| SEQ-04 | Cross-cutting controls (tenancy, authorization, audit) are built before the modules that rely on them. |
| SEQ-05 | Each domain module ships as a vertical slice: schema, service, API, UI, tests and audit. |
| SEQ-06 | Intelligence phases consume stable metrics and domain events; they do not define business truth. |
| SEQ-07 | A phase gate is evidence-based: tests, review and a written acceptance, not a status claim. |
| SEQ-08 | No phase may disable a control to meet a date. |
| SEQ-09 | A phase may be split for delivery, but the gate is not passed until the full acceptance is met. |
| SEQ-10 | The 26-phase list is retained as instructed; `REC-01`–`REC-05` remain open and would adjust sequencing, not architecture. |

---

## 3. Sequence at a glance

| Phase | Objective | Prerequisites | Architecture inputs | Decisions needed | Exit evidence |
| --- | --- | --- | --- | --- | --- |
| PH-01 | Requirements baseline | — | Stage 1 set | Product scope (`OD-001`) | Requirements review |
| PH-02 | Architecture and contracts | PH-01 | This Stage 2 set | ADR acceptance; blocking ODs identified | Design approval |
| PH-03 | Repository and infrastructure | PH-02 | `TECHNOLOGY_STACK_EVALUATION.md`, reliability plan | `OD-010`, `OD-011` | CI pipeline green |
| PH-04 | Design system and screens | PH-01, PH-02 | `UI_UX_DESIGN_REQUIREMENTS.md`, industry config | `OD-006`, `OD-030`, `OD-031` | Design approval |
| PH-05 | Authentication, organisation and access | PH-02, PH-03 | `TENANCY_AND_AUTHORIZATION_ARCHITECTURE.md` | `OD-003` **blocking**, `OD-024`, `OD-019` | Security verification |
| PH-06 | Application shell and navigation | PH-04, PH-05 | Architecture §8, tenancy §11 | — | Usability verification |
| PH-07 | Shared frontend components | PH-04, PH-06 | Component inventory | `OD-006` | Component verification |
| PH-08 | Database schema and integrity | PH-05 | `DATA_ARCHITECTURE_PLAN.md` | `OD-002`, `OD-004`, `OD-005`, `OD-015`, `OD-037` | Migration review |
| PH-09 | Backend APIs and business rules | PH-08 | `API_AND_EVENT_CONTRACTS.md`, module map | `OD-017`, `OD-016`, `OD-045`, `OD-046` | Contract verification |
| PH-10 | Shared infrastructure services | PH-08, PH-09 | `MODULE_DEPENDENCY_MAP.md`, reliability plan | `OD-008`, `OD-009`, `OD-012`, `OD-021`, `OD-023`, `OD-039` | Reliability verification |
| PH-11 | CRM | PH-09, PH-10 | Domain ownership, events | — | Module acceptance |
| PH-12 | Sales and marketing | PH-11 | Event contracts, approval model | `OD-017` | Module acceptance |
| PH-13 | Finance | PH-12 | Data plan, audit, approvals | `OD-032`, `OD-036` | Financial integrity |
| PH-14 | Inventory and procurement | PH-13 | Event contracts, SoD | `OD-017` | Module acceptance |
| PH-15 | Projects, workforce and support | PH-13 | Scope model, sensitive data | `OD-035` | Module acceptance |
| PH-16 | Data quality and analytics model | PH-13–15 | `DATA_ARCHITECTURE_PLAN.md` P2 | `OD-040` | Data verification |
| PH-17 | Metrics and analytics services | PH-16 | Metric contract, freshness | — | Metric correctness |
| PH-18 | Dashboards, reports, drill-down | PH-17 | BI contracts | `OD-044` | Acceptance |
| PH-19 | ML data pipelines and features | PH-16, PH-17 | `AI_ML_INFERENCE_ARCHITECTURE.md` §5 | `OD-007`, `OD-026` | Pipeline verification |
| PH-20 | ML models and evaluation | PH-19 | Registry, evaluation gate | `OD-042` | Evaluation gate |
| PH-21 | Model serving and inference services | PH-20 | Serving contract, degradation | `OD-041` | Serving verification |
| PH-22 | Inference engine and decisions | PH-21, PH-18 | Orchestration, evidence, authority | `OD-027`, `OD-028`, `OD-029` | Safety verification |
| PH-23 | Assistant, workflows, automation | PH-22 | Tool contract, `ADR-033/034` | `OD-029` | Governance verification |
| PH-24 | Integrations, SaaS admin, industry config | PH-10, PH-15 | Industry configuration architecture | `OD-013`, `OD-014`, `OD-020` | Integration verification |
| PH-25 | Full-system verification | PH-01–24 | All Stage 2 documents | `OD-038` review | Release candidate |
| PH-26 | Production deployment and handover | PH-25 | Reliability plan, infrastructure | `OD-011`, `OD-021`, `OD-022` | Launch approval |

---

## 4. Detailed sequencing

### 4.1 Foundation — PH-01 to PH-04

| Phase | Architecture work | Interfaces produced | Risks | Acceptance |
| --- | --- | --- | --- | --- |
| PH-01 | Review requirements against the architecture; record conflicts | Requirement IDs, traceability rows | Scope expansion (`RISK-002`); industry claims without coverage (`RISK-009`) | Every requirement has an ID, status and owner |
| PH-02 | Accept ADRs; confirm module boundaries, contracts, tenancy, data planes | ADR set; contract conventions; dependency rules | Unapproved ADRs treated as approved; boundary erosion | Design approval with explicit status per ADR |
| PH-03 | Wire lint/graph rules, CI gates, logging skeleton, health endpoint | Build/test pipeline; import rules; structured log format | Pipeline added after code (`RISK-012`); secret leakage (`RISK-014`) | A failing check blocks merge |
| PH-04 | Translate architecture into screens and states | Screen inventory; component spec; accessibility criteria | Design promises capability the architecture forbids | Design approval per group |

**Sequencing note:** PH-02 does not require every ADR to be accepted. It requires
that each ADR's status is honest and that no phase starts on an unaccepted
decision it depends on.

### 4.2 Identity and tenancy — PH-05

| Item | Detail |
| --- | --- |
| Must exist before | Session resolution, membership model, policy module, role templates, scope predicates, audit append |
| Must not be deferred | Tenant guard, default deny, existence hiding, session revocation |
| Interfaces | `ActorContext`, `Decision`, `ScopePredicate`, `audit.record`, `can` projection |
| Tests | Cross-tenant probes, role × permission matrix, scope matrix, session revocation |
| Risks | Provider lock-in (`OD-003`), scope complexity, small-tenant SoD conflicts |
| Gate evidence | Security review sign-off + automated isolation tests |

**Blocking:** `OD-003` must be closed. If the provider choice slips, the phase
cannot start; a temporary custom auth implementation is not an acceptable
workaround (`TECH-12`).

### 4.3 Shell and components — PH-06 to PH-07

| Item | Detail |
| --- | --- |
| Depends on | Server-provided `can` map, tenant context, navigation entitlements |
| Architecture rule | The client never decides permission; components render decisions |
| Tests | Empty-module state, denied affordance, keyboard and screen-reader paths |
| Risk | A component that assumes a module exists breaks for another industry |
| Gate | Component verification with accessibility checks |

### 4.4 Data foundation — PH-08

| Item | Detail |
| --- | --- |
| Must exist | Tenant columns, composite keys, migration workflow, backup, RLS decision |
| Architecture inputs | `DATA_ARCHITECTURE_PLAN.md` domains and planes |
| Tests | Migration up/down, tenant guard, FK integrity, RLS with pooling |
| Risks | JSONB performance (`RISK-006`), RLS/pooling (`RISK-018`), destructive migration |
| Gate | Migration review with rollback evidence |

**Rule:** the physical schema follows domain ownership. A table without a clear
owning module is a design defect, not a migration convenience.

### 4.5 Platform services — PH-09 to PH-10

| Item | Detail |
| --- | --- |
| PH-09 | API conventions, error model, idempotency, validation, audit/outbox hooks, approval routing |
| PH-10 | Jobs, outbox dispatch, documents, notifications, observability |
| Interfaces | `/api/v1` contract, event envelope, job registration, signed file access |
| Tests | Contract fixtures, duplicate event, idempotency replay, dead-letter, restore |
| Risks | At-least-once duplicates (`RISK-016`), outbox backlog, storage misconfiguration |
| Gate | Contract verification (PH-09) and reliability verification (PH-10) |

**Sequencing note:** outbox and audit are built before any business module
publishes events. Retrofitting them is a rewrite of every write path.

### 4.6 Domain modules — PH-11 to PH-15

| Phase | Module | Critical dependency | Financial/audit note |
| --- | --- | --- | --- |
| PH-11 | CRM | Identity, documents, events | Personal data classification |
| PH-12 | Sales and marketing | CRM query, approvals, catalogue | Discount approval boundary |
| PH-13 | Finance | Sales/procurement events, approvals | Immutable postings, reconciliation |
| PH-14 | Inventory and procurement | Finance posting, movement events | Three-way match, stock valuation |
| PH-15 | Projects, workforce, support | Finance posting, scope model | Sensitive HR fields, SLA |

Each phase produces: tables owned by the module, service interfaces, API routes,
UI screens, permissions, audit events, domain events, tests and a module
acceptance record.

**Ordering reason:** CRM → sales → finance → inventory/procurement → projects
follows the dependency graph. Reversing finance before sales would force
projections that have no source events.

### 4.7 Analytics — PH-16 to PH-18

| Phase | Deliverable | Must not do |
| --- | --- | --- |
| PH-16 | Quality rules, lineage, analytics schema, freshness | Write back to operational tables |
| PH-17 | Metric registry, calculation, materialisation, versioning | Let a dashboard compute a local KPI |
| PH-18 | Dashboards, reports, drill-down, exports | Expose a denied row through an aggregate |

**Sequencing note:** analytics starts only after the operational domains that
feed its first metrics exist. A metric with no source is a mock, not a metric.

### 4.8 ML — PH-19 to PH-21

| Phase | Deliverable | Gate |
| --- | --- | --- |
| PH-19 | Datasets, features, leakage checks, parity tests | Pipeline verification |
| PH-20 | Baselines, training, evaluation, registry, model cards | Model beats baseline on held-out data |
| PH-21 | Batch serving, pinned versions, timeouts, fallback | Serving verification |

**Rules:**

- No model without a dataset manifest and a named baseline.
- No deployment without registry approval (`SOD-5`).
- No "latest" model in production.
- ML unavailability never blocks a core workflow.

### 4.9 Intelligence — PH-22 to PH-23

| Phase | Deliverable | Gate evidence |
| --- | --- | --- |
| PH-22 | Inference orchestration, evidence, recommendations, outcomes | Every claim resolves to evidence; scope isolation test |
| PH-23 | Assistant, allow-listed tools, controlled automation | Adversarial injection test; tool authority test |

**Hard boundaries:**

- The engine proposes; humans approve; authorized executors act.
- Financial and permission-changing tools are not exposed.
- A tenant can disable AI without losing core function.

### 4.10 Platform and integrations — PH-24

| Item | Detail |
| --- | --- |
| Deliverable | Plans, entitlements, feature flags, support grants, tenant provisioning, integrations, industry catalogue curation |
| Architecture inputs | `INDUSTRY_CONFIGURATION_ARCHITECTURE.md`, platform boundary |
| Tests | Support grant scope/expiry, entitlement ceiling, custom industry privacy, webhook signature |
| Risks | Marketplace boundary erosion (`ADR-035`), config cache staleness |
| Gate | Integration verification |

### 4.11 Verification and launch — PH-25 to PH-26

| Phase | Work | Evidence |
| --- | --- | --- |
| PH-25 | Full-system verification, load, restore, chaos/failure exercises, accessibility, security review | Release candidate report |
| PH-26 | Production deployment, monitoring, on-call, runbooks, handover | Launch approval + rollback plan |

**PH-25 is not a formality.** It is the first phase where the whole graph,
isolation, restore and degradation are tested together. A failure here blocks
launch; it does not become a known issue.

---

## 5. Critical tests by phase

| Phase | Tests that must exist before the gate |
| --- | --- |
| PH-03 | Typecheck, lint, build, unit test, secret scan, dependency audit |
| PH-05 | Cross-tenant read/write probes, role matrix, scope matrix, revocation |
| PH-08 | Migration up/down, FK/composite key, RLS with pooling, backup restore sample |
| PH-09 | Contract fixtures, error shape, idempotency replay, pagination |
| PH-10 | Outbox duplicate, job retry, dead-letter, signed URL expiry |
| PH-11–15 | Module workflow end-to-end, permission denial, audit event |
| PH-16 | Lineage, freshness, quality rule |
| PH-17 | Metric formula fixtures, versioning, reconciliation |
| PH-18 | Drill-down authorization, suppression, export scope |
| PH-19 | Leakage, parity, schema/manifest hash |
| PH-20 | Baseline comparison, segment metrics, calibration |
| PH-21 | Version pinning, timeout, out-of-distribution, fallback |
| PH-22 | Evidence resolution, insufficient-data path, scope isolation |
| PH-23 | Prompt injection, tool allow-list, no ambient authority |
| PH-24 | Support grant, entitlement ceiling, custom industry privacy |
| PH-25 | Load, restore, region-loss tabletop, full cross-tenant sweep |
| PH-26 | Production smoke, alert delivery, rollback rehearsal |

---

## 6. Decision gates

| Decision | Must close before | Consequence if late |
| --- | --- | --- |
| `OD-003` | PH-05 | Cannot start identity; no acceptable workaround |
| `OD-002`, `OD-004` | PH-08 | Schema and data access cannot be finalised |
| `OD-005`, `OD-015` | PH-08 | Custom fields cannot be modelled |
| `OD-037` | PH-08 | RLS decision affects schema and pooling |
| `OD-016`, `OD-017` | PH-09 | Workflow variants and approval thresholds undefined |
| `OD-008`, `OD-009` | PH-10 | Jobs and storage cannot be built |
| `OD-012`, `OD-021`, `OD-023` | PH-10 | Observability, backup and retention undefined |
| `OD-039`, `OD-044`, `OD-045`, `OD-046` | PH-09/10 | Replay, export, deprecation and idempotency windows undefined |
| `OD-013`, `OD-014`, `OD-020` | PH-24 | Catalogue and support access undefined |
| `OD-007`, `OD-026` | PH-19 | ML runtime and pooling undefined |
| `OD-042` | PH-20 | Registry approach undefined |
| `OD-041` | PH-21 | Real-time serving scope undefined |
| `OD-027`, `OD-028`, `OD-029` | PH-22 | Provider, measurement and opt-out undefined |
| `OD-011`, `OD-022` | PH-26 | Environment and residency undefined |
| `OD-018`, `OD-033`, `OD-034`, `OD-035` | PH-05/PH-26 | Legal scope, roles, sub-processors and special-category data undefined |

A decision may be closed with a documented "defer" only if the deferral does not
block the phase's acceptance. Deferring a blocking item is not closure.

---

## 7. Phase dependency graph

```
PH-01
  └── PH-02
        ├── PH-03 ── PH-05 ── PH-06 ── PH-07
        │               │
        │               └── PH-08 ── PH-09 ── PH-10
        │                                 │
        │                                 ├── PH-11 ── PH-12 ── PH-13 ── PH-14 ── PH-15
        │                                 │                                   │
        │                                 │                                   ├── PH-16 ── PH-17 ── PH-18
        │                                 │                                   │             │
        │                                 │                                   │             └── PH-19 ── PH-20 ── PH-21
        │                                 │                                   │                               │
        │                                 │                                   │                               └── PH-22 ── PH-23
        │                                 └── PH-24 ────────────────────────────┘
        │
        └── PH-04 ── PH-06

PH-25 depends on PH-01…PH-24
PH-26 depends on PH-25
```

**Read:** PH-16 starts after the operational domains it measures. PH-22 depends on
both analytics (PH-18) and serving (PH-21). PH-24 can run in parallel with late
domain work, but its acceptance depends on stable entitlements and module
boundaries.

---

## 8. Cross-phase workstreams

| Workstream | Phases | Rule |
| --- | --- | --- |
| Security | PH-02 onward | Threat model updated per module; no control deferred to PH-25 |
| Tenancy | PH-05, PH-08, PH-25 | Probes added with every repository |
| Audit | PH-09 onward | Every consequential write audits in the same transaction |
| Observability | PH-03 onward | New route, job and dependency add a metric and a log event |
| Testing | PH-03 onward | No module acceptance without its critical tests |
| Documentation | Every phase | Contracts and ADRs updated in the same change as behaviour |
| Accessibility | PH-04, PH-07, PH-25 | WCAG 2.2 AA is a gate, not a backlog item |
| Data governance | PH-08, PH-16, PH-19 | Classification, lineage and retention travel with the data |
| Cost | PH-10 onward | Per-tenant cost visibility before scale |
| Incident readiness | PH-10, PH-25, PH-26 | Runbooks written before launch, tested in PH-25 |

---

## 9. Stage 3 readiness

Stage 3 may begin only after the product owner explicitly accepts the Stage 2 set
and authorises the next stage.

### 9.1 Required before Stage 3

| Condition | Evidence |
| --- | --- |
| Stage 2 documents reviewed | Written acceptance of the 13 deliverables |
| ADR statuses honest | `Approved` / `Proposed` / `Requires approval` reflect reality |
| Blocking decisions identified | `OD-003` and other PH-05 items named |
| Contracts agreed | API, event, BI, ML and inference conventions accepted |
| Tenancy design reviewed | Security review of the authorization model |
| Module map accepted | Ownership and cycle register reviewed |
| Data architecture accepted | Domain ownership and planes agreed |
| Phase sequence accepted | This document reviewed against the roadmap |
| No implementation authorised | No code, migration, package or deployment claimed |

### 9.2 What Stage 3 may start with

If authorised, Stage 3 should start with **PH-03 — repository and development
infrastructure**, unless the product owner chooses PH-05 first after closing
`OD-003`.

| Start option | Precondition | Why |
| --- | --- | --- |
| PH-03 first | Stage 2 accepted | Makes every later change safe; no product behaviour yet |
| PH-05 first | `OD-003` closed | Identity and tenancy are prerequisites for all business modules |
| PH-04 in parallel | `OD-006` closed | Design can proceed alongside infrastructure |

**PH-03 and PH-05 cannot be skipped.** Starting a domain module before tenancy,
audit and contracts exist guarantees rework.

### 9.3 What Stage 3 must not do

| Prohibited | Reason |
| --- | --- |
| Treat a `Proposed` ADR as approved | Architectural drift |
| Implement a module before its tenancy and audit foundation | Retrofitting is a rewrite |
| Add executable tenant configuration | `ADR-029` is approved |
| Give AI execution authority | `ADR-033` is approved |
| Skip cross-tenant tests | The primary invariant is unproven |
| Claim compliance | No control is assessed |
| Build the marketplace | Not approved; separate governance |

---

## 10. Sequencing risks

| ID | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| SEQ-R1 | Foundation phases feel slow; pressure to start features | High | High | Show vertical-slice value after PH-05; do not skip controls |
| SEQ-R2 | An unaccepted ADR becomes code | Medium | High | Gate check: ADR status before dependency |
| SEQ-R3 | Domain order forces projections with no source events | Medium | High | Follow the dependency graph; do not reorder finance before sales |
| SEQ-R4 | Analytics starts before source domains are stable | Medium | High | PH-16 entry check |
| SEQ-R5 | ML starts before data quality | Medium | High | PH-19 entry check; baseline requirement |
| SEQ-R6 | Intelligence phase expands authority under delivery pressure | Medium | Critical | Authority matrix reviewed at PH-22/23 gate |
| SEQ-R7 | Industry configuration becomes a second product | Medium | High | Profile schema limits; custom industry is data, not code |
| SEQ-R8 | Verification compressed to protect a date | High | Critical | PH-25 failure blocks launch |
| SEQ-R9 | Small team parallelises too much | High | Medium | Limit work-in-progress per phase |
| SEQ-R10 | Documentation drifts from implementation | Medium | Medium | Contract and ADR updates in the same change |

---

## 11. Phase gate checklist

A phase gate is passed only when all of the following are true:

- [ ] Deliverables listed in `DEVELOPMENT_ROADMAP.md` exist.
- [ ] Architecture decisions the phase depends on are accepted.
- [ ] Interfaces are contract-tested.
- [ ] Tenancy and authorization tests pass for every new path.
- [ ] Audit events are written for consequential actions.
- [ ] Observability exists for new routes, jobs and dependencies.
- [ ] Documentation and ADRs are updated.
- [ ] Known limitations are recorded, not hidden.
- [ ] The product owner or delegated reviewer has accepted the phase.

---

## 12. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Stage 2 architecture implementation sequence: 26-phase mapping, decision gates, tests, risks and Stage 3 readiness. No implementation. |
