# ONO — Documentation Index

**Project:** ONO — AI-Powered Integrated Business Intelligence & Management Platform
**Stage:** 2 — Architecture and technical contracts (Stage 1 requirements retained)
**Status:** Documentation complete for review. No implementation authorised.
**Last updated:** 2026-10-26

---

## 1. What this folder contains

This is the controlled planning set for ONO. It is the reference of record for
scope, architecture direction, security expectations and phase boundaries. It
does not contain implementation.

> **Implementation record (2026-10-27):** Frontend Parts 1–3 were implemented and
> verified against the local backend. Start with
> [`features/FRONTEND_IMPLEMENTATION_GUIDE.md`](./features/FRONTEND_IMPLEMENTATION_GUIDE.md),
> then the delivery notes in
> [`changelog/FRONTEND_PART_1.md`](./changelog/FRONTEND_PART_1.md),
> [`changelog/FRONTEND_PART_2.md`](./changelog/FRONTEND_PART_2.md) and
> [`changelog/FRONTEND_PART_3.md`](./changelog/FRONTEND_PART_3.md). The planning
> status statements below describe the Stage 1/2 document set and remain the
> design authority.

### 1.1 Stage 1 — requirements and product definition

| # | Document | Purpose |
| --- | --- | --- |
| 1 | [MASTER_PROJECT_SPECIFICATION.md](./MASTER_PROJECT_SPECIFICATION.md) | Vision, objectives, users, scope, principles, non-functional requirements, success measures |
| 2 | [MODULE_AND_FEATURE_INVENTORY.md](./MODULE_AND_FEATURE_INVENTORY.md) | Every module, submodule, entity, workflow, permission and dependency |
| 3 | [INDUSTRY_ADAPTATION_SPECIFICATION.md](./INDUSTRY_ADAPTATION_SPECIFICATION.md) | Extensible industry catalogue, custom-industry onboarding, configuration and extension rules |
| 4 | [ROLES_AND_PERMISSION_MODEL.md](./ROLES_AND_PERMISSION_MODEL.md) | Organisational structure, role catalogue, permission model, data scopes, approval boundaries |
| 5 | [BUSINESS_WORKFLOW_CATALOG.md](./BUSINESS_WORKFLOW_CATALOG.md) | Cross-module workflows, lifecycle states, business rules, exceptions, audit requirements |
| 6 | [SYSTEM_ARCHITECTURE_PLAN.md](./SYSTEM_ARCHITECTURE_PLAN.md) | Stage 1 architecture proposal; superseded as architecture authority by `SYSTEM_ARCHITECTURE.md` |
| 7 | [DATABASE_AND_DATA_DOMAIN_PLAN.md](./DATABASE_AND_DATA_DOMAIN_PLAN.md) | Preliminary domain entities; extended by `DATA_ARCHITECTURE_PLAN.md` |
| 8 | [AI_ML_INFERENCE_SPECIFICATION.md](./AI_ML_INFERENCE_SPECIFICATION.md) | Analytics, ML, inference engine, decision intelligence, evaluation and monitoring |
| 9 | [UI_UX_DESIGN_REQUIREMENTS.md](./UI_UX_DESIGN_REQUIREMENTS.md) | Authentication-first experience, design language, screen inventory, states, accessibility |
| 10 | [SECURITY_PRIVACY_AND_COMPLIANCE_REQUIREMENTS.md](./SECURITY_PRIVACY_AND_COMPLIANCE_REQUIREMENTS.md) | Security boundaries, privacy, auditability, open legal questions |
| 11 | [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) | The 26 phases with dependencies, deliverables, acceptance criteria and gates |
| 12 | [OPEN_DECISIONS_AND_ASSUMPTIONS.md](./OPEN_DECISIONS_AND_ASSUMPTIONS.md) | Unknowns, conflicts, assumptions, risks, decisions awaiting approval (now v1.1) |
| 13 | [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Current stage, what exists in the repo, what is unresolved, next permitted action |
| 14 | [REQUIREMENTS_TRACEABILITY_MATRIX.md](./REQUIREMENTS_TRACEABILITY_MATRIX.md) | Requirement → module → workflow → roles → entities → security → phase → acceptance → status |
| 15 | [TECHNOLOGY_STACK_AND_GOVERNANCE.md](./TECHNOLOGY_STACK_AND_GOVERNANCE.md) | What is actually installed versus planned, and the rules for adding technology |

### 1.2 Stage 2 — architecture and technical contracts

| # | Document | Purpose |
| --- | --- | --- |
| 16 | [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Runtime units, layers, CMP-01–CMP-22, request lifecycle, trade-offs, phase map |
| 17 | [ARCHITECTURE_DECISION_RECORDS.md](./ARCHITECTURE_DECISION_RECORDS.md) | 36 ADRs with status, alternatives, consequences and phase |
| 18 | [TECHNOLOGY_STACK_EVALUATION.md](./TECHNOLOGY_STACK_EVALUATION.md) | Evaluation criteria, verified baseline, candidates, selections, deferrals, exit paths |
| 19 | [MODULE_DEPENDENCY_MAP.md](./MODULE_DEPENDENCY_MAP.md) | M01–M23 ownership, dependency classes, graph, cycle register, enforcement |
| 20 | [API_AND_EVENT_CONTRACTS.md](./API_AND_EVENT_CONTRACTS.md) | REST, errors, pagination, idempotency, events, BI/ML/inference contracts |
| 21 | [DATA_ARCHITECTURE_PLAN.md](./DATA_ARCHITECTURE_PLAN.md) | DOM-01–DOM-20, six data planes, lineage, retention, correction, reproducibility |
| 22 | [TENANCY_AND_AUTHORIZATION_ARCHITECTURE.md](./TENANCY_AND_AUTHORIZATION_ARCHITECTURE.md) | Isolation, identity, 12-step decision, scopes, separation of duties, enforcement points |
| 23 | [INDUSTRY_CONFIGURATION_ARCHITECTURE.md](./INDUSTRY_CONFIGURATION_ARCHITECTURE.md) | Catalogue, profile schema, resolution, custom industries, fields, variants, extensions |
| 24 | [AI_ML_INFERENCE_ARCHITECTURE.md](./AI_ML_INFERENCE_ARCHITECTURE.md) | Analytics, ML, registry, serving, orchestration, decisions, assistant, authority |
| 25 | [RELIABILITY_AND_OBSERVABILITY_PLAN.md](./RELIABILITY_AND_OBSERVABILITY_PLAN.md) | SLOs, failure domains, logs, metrics, traces, alerts, degradation, backup, recovery |
| 26 | [ARCHITECTURE_IMPLEMENTATION_SEQUENCE.md](./ARCHITECTURE_IMPLEMENTATION_SEQUENCE.md) | 26-phase mapping, prerequisites, decision gates, tests, risks, Stage 3 readiness |

## 2. Reading order

1. `MASTER_PROJECT_SPECIFICATION.md` — why ONO exists and what "done" means.
2. `MODULE_AND_FEATURE_INVENTORY.md` — what the product contains.
3. `INDUSTRY_ADAPTATION_SPECIFICATION.md` — how one product serves every industry.
4. `ROLES_AND_PERMISSION_MODEL.md` — who may do what, to which data.
5. `BUSINESS_WORKFLOW_CATALOG.md` — how work actually flows.
6. `SYSTEM_ARCHITECTURE.md` — the architecture authority (replaces the Stage 1 plan as the decision source).
7. `ARCHITECTURE_DECISION_RECORDS.md` — what was decided, what is proposed, what needs approval.
8. `MODULE_DEPENDENCY_MAP.md` + `DATA_ARCHITECTURE_PLAN.md` — how the system is decomposed and how data is owned.
9. `API_AND_EVENT_CONTRACTS.md` + `TENANCY_AND_AUTHORIZATION_ARCHITECTURE.md` — the contracts every module must honour.
10. `INDUSTRY_CONFIGURATION_ARCHITECTURE.md` — how the product adapts without executable configuration.
11. `AI_ML_INFERENCE_ARCHITECTURE.md` — how intelligence is produced, bounded and evaluated.
12. `TECHNOLOGY_STACK_EVALUATION.md` + `RELIABILITY_AND_OBSERVABILITY_PLAN.md` — what it runs on and how it stays trustworthy.
13. `UI_UX_DESIGN_REQUIREMENTS.md` + `SECURITY_PRIVACY_AND_COMPLIANCE_REQUIREMENTS.md` — how it looks and how it is protected.
14. `ARCHITECTURE_IMPLEMENTATION_SEQUENCE.md` + `DEVELOPMENT_ROADMAP.md` — the order of work and its gates.
15. `OPEN_DECISIONS_AND_ASSUMPTIONS.md` + `PROJECT_STATUS.md` — what to decide next.

`SYSTEM_ARCHITECTURE_PLAN.md`, `DATABASE_AND_DATA_DOMAIN_PLAN.md` and
`AI_ML_INFERENCE_SPECIFICATION.md` remain in the set as Stage 1 inputs. Where
they conflict with a Stage 2 document, the Stage 2 document is authoritative and
the difference is recorded as a conflict or amendment rather than edited away.

## 3. Identifier conventions

| Prefix | Meaning | Example |
| --- | --- | --- |
| `REQ-<DOMAIN>-NNN` | Functional requirement | `REQ-CRM-004` |
| `NFR-NNN` | Non-functional requirement | `NFR-003` |
| `WF-<DOMAIN>-NN` | Business workflow | `WF-FIN-03` |
| `ROLE-<NAME>` | Role definition | `ROLE-FINANCE-MANAGER` |
| `PERM-<RESOURCE>.<ACTION>` | Permission | `PERM-INVOICE.APPROVE` |
| `ENT-<Name>` | Domain entity | `ENT-Invoice` |
| `MET-<CODE>` | Metric definition | `MET-GROSS-MARGIN` |
| `ADR-NNN` | Architecture decision record | `ADR-004` |
| `OD-NNN` | Open decision requiring approval | `OD-037` |
| `CF-NN` | Recorded conflict | `CF-11` |
| `ASM-NNN` | Working assumption | `ASM-006` |
| `RISK-NNN` | Identified risk | `RISK-018` |
| `AC-<DOMAIN>-NNN` | Acceptance criteria | `AC-FIN-002` |
| `PH-NN` | Development phase | `PH-13` |
| `CMP-NN` | Logical component | `CMP-03` |
| `U<N>` | Runtime unit | `U2` |
| `M<NN>` | Module in the dependency map | `M08` |
| `DEP-NN` | Dependency class | `DEP-03` |
| `DOM-NN` | Data domain | `DOM-07` |
| `AP-NN` | Architecture principle | `AP-05` |
| `EV-NN` | Event contract rule | `EV-07` |
| `TA-NN` | Tenancy/authorization invariant | `TA-01` |
| `ICA-NN` | Industry configuration rule | `ICA-13` |
| `AIA-NN` | AI inference rule | `AIA-04` |
| `DA-NN`, `PL-NN`, `LIN-NN`, `DEL-NN`, `CL-NN`, `DM-NN` | Data architecture rules (planes, lineage, deletion, classification, domains) | `DEL-06` |
| `RL-NN`, `SLO-NN` | Reliability rule and service objective | `RL-04`, `SLO-02` |
| `SEQ-NN` | Implementation sequencing rule | `SEQ-03` |
| `TECH-NN`, `CDR-NN` | Technology selection and deferral record | `TECH-17`, `CDR-04` |

Requirement IDs are permanent. An ID is never reused or renumbered; withdrawn
requirements are marked `Withdrawn` with a reason. Stage 2 added new identifier
families without renumbering any Stage 1 item.

## 4. Status vocabulary

| Status | Meaning |
| --- | --- |
| `Proposed` | Suggested, not yet accepted into baseline |
| `Recorded` | Written into this set; not yet approved by the product owner |
| `Needs clarification` | Blocked on an open decision or missing information |
| `Requires approval` | ADR-level status: blocked on a named business or vendor decision |
| `Approved` | Explicitly accepted by the product owner |
| `Implemented` | Code exists and is merged |
| `Verified` | Implemented **and** proven against its acceptance criteria |
| `Withdrawn` | Removed from scope, with reason retained |

**Every requirement remains `Recorded`; none is `Approved`, `Implemented` or
`Verified`.** Four ADR principles are `Approved` by explicit product-owner
direction (`ADR-001`, `ADR-016`, `ADR-029`, `ADR-033`); the remaining 32 ADRs are
`Proposed` or `Requires approval`. Approving a principle does not approve the
mechanism, and documentation is not implementation.

## 5. Change control

- Any change to a requirement keeps its ID and adds a row to the change log in
  `PROJECT_STATUS.md`.
- New scope arrives as `Proposed`, never silently inserted into an existing ID.
- Phase boundaries in `DEVELOPMENT_ROADMAP.md` may only change with explicit
  product-owner approval recorded in `OPEN_DECISIONS_AND_ASSUMPTIONS.md`.
- Stage 2 documents may not contradict an `Approved` ADR. A disagreement is
  recorded as an `OD-*`, a `CF-*` or a new ADR — never as a silent edit.
- An ADR ID is never renumbered. A superseded decision keeps its ID and gains a
  supersession note.
- Documents in `docs/architecture/`, `docs/database/`, `docs/security/` etc. are
  for detailed design artefacts produced **later**, per phase. This top-level set
  is the authority until then.
