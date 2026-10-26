# ONO — Documentation Index

**Project:** ONO — AI-Powered Integrated Business Intelligence & Management Platform
**Stage:** 1 — Master requirements, system vision and development control
**Status:** Documentation complete for review. No implementation authorised.
**Last updated:** 2026-10-26

---

## 1. What this folder contains

This is the controlled planning set for ONO. It is the reference of record for
scope, architecture direction, security expectations and phase boundaries. It
does not contain implementation.

| # | Document | Purpose |
| --- | --- | --- |
| 1 | [MASTER_PROJECT_SPECIFICATION.md](./MASTER_PROJECT_SPECIFICATION.md) | Vision, objectives, users, scope, principles, non-functional requirements, success measures |
| 2 | [MODULE_AND_FEATURE_INVENTORY.md](./MODULE_AND_FEATURE_INVENTORY.md) | Every module, submodule, entity, workflow, permission and dependency |
| 3 | [INDUSTRY_ADAPTATION_SPECIFICATION.md](./INDUSTRY_ADAPTATION_SPECIFICATION.md) | Extensible industry catalogue, custom-industry onboarding, configuration and extension rules |
| 4 | [ROLES_AND_PERMISSION_MODEL.md](./ROLES_AND_PERMISSION_MODEL.md) | Organisational structure, role catalogue, permission model, data scopes, approval boundaries |
| 5 | [BUSINESS_WORKFLOW_CATALOG.md](./BUSINESS_WORKFLOW_CATALOG.md) | Cross-module workflows, lifecycle states, business rules, exceptions, audit requirements |
| 6 | [SYSTEM_ARCHITECTURE_PLAN.md](./SYSTEM_ARCHITECTURE_PLAN.md) | Proposed architecture, component boundaries, integrations, security controls, decisions needing approval |
| 7 | [DATABASE_AND_DATA_DOMAIN_PLAN.md](./DATABASE_AND_DATA_DOMAIN_PLAN.md) | Preliminary domain entities, relationships, tenancy, ownership, integrity, migration principles |
| 8 | [AI_ML_INFERENCE_SPECIFICATION.md](./AI_ML_INFERENCE_SPECIFICATION.md) | Analytics, ML, inference engine, decision intelligence, evaluation and monitoring |
| 9 | [UI_UX_DESIGN_REQUIREMENTS.md](./UI_UX_DESIGN_REQUIREMENTS.md) | Authentication-first experience, design language, screen inventory, states, accessibility |
| 10 | [SECURITY_PRIVACY_AND_COMPLIANCE_REQUIREMENTS.md](./SECURITY_PRIVACY_AND_COMPLIANCE_REQUIREMENTS.md) | Security boundaries, privacy, auditability, open legal questions |
| 11 | [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) | The 26 phases with dependencies, deliverables, acceptance criteria and gates |
| 12 | [OPEN_DECISIONS_AND_ASSUMPTIONS.md](./OPEN_DECISIONS_AND_ASSUMPTIONS.md) | Unknowns, conflicts, assumptions, risks, decisions awaiting approval |
| 13 | [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Current stage, what exists in the repo, what is unresolved, next permitted action |
| 14 | [REQUIREMENTS_TRACEABILITY_MATRIX.md](./REQUIREMENTS_TRACEABILITY_MATRIX.md) | Requirement → module → workflow → roles → entities → security → phase → acceptance → status |
| 15 | [TECHNOLOGY_STACK_AND_GOVERNANCE.md](./TECHNOLOGY_STACK_AND_GOVERNANCE.md) | What is actually installed versus planned, and the rules for adding technology |

## 2. Reading order

1. `MASTER_PROJECT_SPECIFICATION.md` — why ONO exists and what "done" means.
2. `MODULE_AND_FEATURE_INVENTORY.md` — what the product contains.
3. `INDUSTRY_ADAPTATION_SPECIFICATION.md` — how one product serves every industry.
4. `ROLES_AND_PERMISSION_MODEL.md` — who may do what, to which data.
5. `BUSINESS_WORKFLOW_CATALOG.md` — how work actually flows.
6. `SYSTEM_ARCHITECTURE_PLAN.md` + `DATABASE_AND_DATA_DOMAIN_PLAN.md` — how it is built.
7. `AI_ML_INFERENCE_SPECIFICATION.md` — how intelligence is produced honestly.
8. `UI_UX_DESIGN_REQUIREMENTS.md` — how it looks and behaves.
9. `SECURITY_PRIVACY_AND_COMPLIANCE_REQUIREMENTS.md` — how it is protected.
10. `TECHNOLOGY_STACK_AND_GOVERNANCE.md` — what tooling is permitted.
11. `DEVELOPMENT_ROADMAP.md` — the order of work.
12. `OPEN_DECISIONS_AND_ASSUMPTIONS.md` + `PROJECT_STATUS.md` — what to decide next.

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
| `OD-NNN` | Open decision requiring approval | `OD-012` |
| `ASM-NNN` | Working assumption | `ASM-006` |
| `RISK-NNN` | Identified risk | `RISK-009` |
| `AC-<DOMAIN>-NNN` | Acceptance criteria | `AC-FIN-002` |
| `PH-NN` | Development phase | `PH-13` |

Requirement IDs are permanent. An ID is never reused or renumbered; withdrawn
requirements are marked `Withdrawn` with a reason.

## 4. Status vocabulary

| Status | Meaning |
| --- | --- |
| `Proposed` | Suggested, not yet accepted into baseline |
| `Recorded` | Written into this set; not yet approved by the product owner |
| `Needs clarification` | Blocked on an open decision or missing information |
| `Approved` | Explicitly accepted by the product owner |
| `Implemented` | Code exists and is merged |
| `Verified` | Implemented **and** proven against its acceptance criteria |
| `Withdrawn` | Removed from scope, with reason retained |

**Everything in this set is `Recorded` or `Needs clarification` only.** No
requirement is `Approved`, `Implemented` or `Verified`. Documentation is not
approval, and approval is not implementation.

## 5. Change control

- Any change to a requirement keeps its ID and adds a row to the change log in
  `PROJECT_STATUS.md`.
- New scope arrives as `Proposed`, never silently inserted into an existing ID.
- Phase boundaries in `DEVELOPMENT_ROADMAP.md` may only change with explicit
  product-owner approval recorded in `OPEN_DECISIONS_AND_ASSUMPTIONS.md`.
- Documents in `docs/architecture/`, `docs/database/`, `docs/security/` etc. are
  for detailed design artefacts produced **later**, per phase. This top-level set
  is the authority until then.
