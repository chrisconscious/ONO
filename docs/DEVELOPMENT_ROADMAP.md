# ONO — Development Roadmap

| Field | Value |
| --- | --- |
| Document | Development Roadmap |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — sequence approved by the product owner with the 26-phase list; boundaries below are proposals |
| Rule | A phase is complete only when its **gate** is met. Code written is not completion. |

---

## 1. Phase summary

| # | Phase | Primary modules | Gate type |
| --- | --- | --- | --- |
| 01 | Master requirements and product specification | All | Design approval |
| 02 | Architecture and technical contracts | All | Design approval |
| 03 | Repository and development infrastructure | Platform | Working pipeline |
| 04 | UI/UX design system and screen inventory | All | Design approval |
| 05 | Authentication, organisation and access foundation | M02, M03, M01 | Security verification |
| 06 | Application shell and navigation | All | Usability verification |
| 07 | Shared frontend components | All | Component verification |
| 08 | Database schema and data integrity | All | Migration review |
| 09 | Backend APIs and business rules | All | Contract verification |
| 10 | Shared infrastructure services | M14, M19, M20, M21 | Reliability verification |
| 11 | CRM and relationship management | M05 | Module acceptance |
| 12 | Sales, marketing and commercial workflows | M06, M07 | Module acceptance |
| 13 | Finance | M08 | Financial integrity |
| 14 | Inventory and procurement | M09, M10 | Module acceptance |
| 15 | Projects, workforce and operational execution | M11, M12, M13 | Module acceptance |
| 16 | Data quality and analytics data model | M16, M22 | Data verification |
| 17 | Business metrics and analytics services | M16 | Metric correctness |
| 18 | Dashboards, reports and drill-downs | M16 | Acceptance |
| 19 | ML data pipelines and feature engineering | M17 | Pipeline verification |
| 20 | ML models and evaluation | M17 | Evaluation gate |
| 21 | Model serving and inference services | M17 | Serving verification |
| 22 | Inference intelligence engine and decision layer | M18 | Safety verification |
| 23 | AI assistant, workflows and controlled automation | M18, M21 | Governance verification |
| 24 | Integrations, SaaS administration and industry configuration | M01, M04, M19 | Integration verification |
| 25 | Full-system verification | All | Release candidate |
| 26 | Production deployment and handover | All | Launch approval |

Gate types:

| Gate | Meaning |
| --- | --- |
| Design approval | Deliverable reviewed and explicitly accepted by the product owner |
| Working pipeline | Automated checks run on every change |
| Security verification | Isolation, authorisation and audit proven by tests |
| Migration review | Schema reviewed, reversible, backed up |
| Module acceptance | Acceptance criteria met for that module's workflows |
| Evaluation gate | Model beats baseline on held-out data with a model card |
| Release candidate | Full-system verification passed |
| Launch approval | Product owner sign-off with rollback plan |

---

## 2. Phase detail

### PH-01 — Master requirements and product specification
**Objective:** establish the authoritative product baseline.
**Deliverables:** this documentation set (15 documents), requirement IDs, traceability matrix, open decisions, project status.
**Dependencies:** none.
**Acceptance:**
- FR-01 all 23 modules documented with requirements.
- FR-02 every requirement has an ID and a status.
- FR-03 every unresolved item is recorded as an open decision.
- FR-04 industry adaptation and custom-industry path explicitly covered.
**Gate:** product owner reviews and approves the baseline. **Implementation is not authorised by this phase.**
**Out of scope:** code, migrations, models, UI.

---

### PH-02 — Architecture and technical contracts
**Objective:** convert the proposal into approved technical decisions and contracts.
**Deliverables:** approved ADRs (`ADR-001`–`ADR-014`), API contract conventions, error model, event model, module boundary rules, tenancy enforcement design, environment topology.
**Dependencies:** PH-01.
**Acceptance:**
- AC-02-01 Each ADR has a decision, alternatives, consequences and owner.
- AC-02-02 Boundary rules are enforceable (lint or review checklist).
- AC-02-03 Tenancy enforcement design is reviewed by security.
- AC-02-04 Error and idempotency conventions are defined.
**Gate:** design approval.
**Out of scope:** feature code.

---

### PH-03 — Repository and development infrastructure
**Objective:** make change safe and repeatable.
**Deliverables:** branch/PR conventions, CI pipeline, typecheck/lint/build gates, test harness (`OD-010`), migration checks, secret scanning, dependency audit, environment templates, contributing guide.
**Dependencies:** PH-02.
**Acceptance:**
- AC-03-01 A pull request cannot merge with failing typecheck, lint, build or tests.
- AC-03-02 Secrets scanning is active.
- AC-03-03 A new developer can run the app from the README in one sitting.
- AC-03-04 Dependency audit runs on every build.
**Gate:** working pipeline.
**Note:** the scaffold already builds, typechecks and lints cleanly; CI does not exist yet.

---

### PH-04 — UI/UX design system and screen inventory
**Objective:** design the complete experience before implementing it.
**Deliverables:** tokens, component inventory, screen inventory per module, design groups, accessibility specification, responsive rules, state catalogue.
**Dependencies:** PH-01, PH-02.
**Acceptance:**
- AC-04-01 Every module has list/detail/create/edit/search screens designed.
- AC-04-02 Every state in §5 of the UI document is designed at least once per pattern.
- AC-04-03 Accessibility criteria are embedded in the component spec.
- AC-04-04 Design groups are individually approved.
**Gate:** design approval.
**Out of scope:** production components.

---

### PH-05 — Authentication, organisation and access foundation
**Objective:** establish identity, tenancy and authorisation correctly and once.
**Deliverables:** provider integration (`OD-003`), sign-in/reset/invitation, session management, tenant and membership model, policy engine, scopes, role templates, onboarding wizard, platform/tenant boundary, replacement of the current landing page with an authentication entry.
**Dependencies:** PH-03, PH-04.
**Acceptance:**
- AC-05-01 An unauthenticated visitor cannot reach any product surface.
- AC-05-02 Cross-tenant access attempts fail and are logged.
- AC-05-03 Suspension revokes sessions immediately.
- AC-05-04 Platform roles have no default tenant data access.
- AC-05-05 Onboarding provisions a usable tenant atomically.
**Gate:** security verification.
**Conflict to resolve:** `src/app/page.tsx` currently serves a public landing page and must be replaced.

---

### PH-06 — Application shell and navigation
**Objective:** provide a coherent, role-aware workspace.
**Deliverables:** shell layout, navigation, tenant switcher, breadcrumbs, global search, notification surface, empty/error boundaries, responsive behaviour.
**Dependencies:** PH-05.
**Acceptance:**
- AC-06-01 Navigation shows only entitled and permitted modules.
- AC-06-02 Keyboard navigation reaches all primary destinations.
- AC-06-03 Shell works at 360 px and 1280 px.
- AC-06-04 Heavy widgets never block the shell.
**Gate:** usability verification.

---

### PH-07 — Shared frontend components
**Objective:** build the reusable component system once.
**Deliverables:** shadcn/ui-based primitives (`OD-006`), data table, form controls, dialogs, date/money inputs, status badges, empty/error states, charts wrapper, accessibility tests.
**Dependencies:** PH-04, PH-06.
**Acceptance:**
- AC-07-01 Components meet WCAG 2.2 AA checks.
- AC-07-02 No component fetches data directly.
- AC-07-03 Component API documented with examples.
**Gate:** component verification.

---

### PH-08 — Database schema and data integrity
**Objective:** establish a correct, reviewed data foundation.
**Deliverables:** approved schema for identity/tenancy and core domains, migration set, tenant guard, constraints, indexes, seed data (synthetic), migration runbook.
**Dependencies:** PH-02, PH-05.
**Acceptance:**
- AC-08-01 Every tenant-owned table has a non-null tenant column and composite uniqueness.
- AC-08-02 Migrations are reviewed and reversible or documented.
- AC-08-03 Referential integrity is enforced.
- AC-08-04 Tenant guard is proven by tests.
**Gate:** migration review.
**Explicit:** no migration is created before this phase.

---

### PH-09 — Backend APIs and business rules
**Objective:** implement services and contracts for core operations.
**Deliverables:** route handlers/server actions, Zod contracts, service layer, domain invariants, approval hooks, audit emission, error model.
**Dependencies:** PH-08.
**Acceptance:**
- AC-09-01 Every endpoint validates input and authorises server-side.
- AC-09-02 State transitions are enforced by services, not UI.
- AC-09-03 Consequential operations emit audit events.
- AC-09-04 Contract tests cover success and failure paths.
**Gate:** contract verification.

---

### PH-10 — Shared infrastructure services
**Objective:** provide the cross-cutting capabilities every module needs.
**Deliverables:** job runner (`OD-008`), audit store, notification service, object storage adapter (`OD-009`), integration gateway skeleton, observability (`OD-012`).
**Dependencies:** PH-09.
**Acceptance:**
- AC-10-01 Jobs are idempotent, retried and observable.
- AC-10-02 Audit events are append-only and queryable per tenant.
- AC-10-03 Document access is permission-checked.
- AC-10-04 One failing integration does not degrade unrelated tenants.
**Gate:** reliability verification.

---

### PH-11 — CRM and relationship management
**Objective:** deliver the customer relationship module.
**Deliverables:** leads, contacts, companies, activities, communications, dedup/merge, conversion, segments, CRM dashboards.
**Dependencies:** PH-09, PH-10.
**Acceptance:**
- AC-11-01 Lead → contact/company/opportunity conversion is atomic.
- AC-11-02 Duplicate merge preserves history and is audited.
- AC-11-03 Ownership and scope rules apply to lists, detail and exports.
- AC-11-04 Consent blocks outreach where absent.
**Gate:** module acceptance.

---

### PH-12 — Sales, marketing and commercial workflows
**Objective:** connect pipeline to revenue and acquisition.
**Deliverables:** opportunities, catalogue, price books, quotations, contracts, orders, discount approvals, campaigns, attribution, consent management.
**Dependencies:** PH-11.
**Acceptance:**
- AC-12-01 Quote totals are computed server-side and frozen at issue.
- AC-12-02 Discount thresholds route to approval and self-approval is blocked.
- AC-12-03 Accepted quote creates an order atomically.
- AC-12-04 Campaign spend cannot exceed budget without approval.
**Gate:** module acceptance.

---

### PH-13 — Finance
**Objective:** deliver trustworthy financial records.
**Deliverables:** chart of accounts, invoices, payments, allocations, expenses, budgets, bills, journals, period close, financial reports, tax configuration.
**Dependencies:** PH-12 (orders), PH-10 (audit).
**Acceptance:**
- AC-13-01 Posted entries are immutable; correction is by reversal.
- AC-13-02 Allocations cannot exceed balances.
- AC-13-03 Journals balance.
- AC-13-04 Period close enforces its checklist and is audited.
- AC-13-05 Report figures reconcile to ledger totals.
**Gate:** financial integrity.
**Note:** ONO does not claim statutory compliance; tax handling is tenant-confirmed.

---

### PH-14 — Inventory and procurement
**Objective:** control stock and purchasing with auditability.
**Deliverables:** products/SKUs, warehouses, movements, levels, counts, reorder rules, suppliers, requests, purchase orders, receiving, three-way match, analytics.
**Dependencies:** PH-13.
**Acceptance:**
- AC-14-01 Stock quantity always reconciles to movements.
- AC-14-02 Count variance approval is separate from counting.
- AC-14-03 PO above threshold requires approval.
- AC-14-04 Mismatched bills never reach payment approval without resolution.
**Gate:** module acceptance.

---

### PH-15 — Projects, workforce and operational execution
**Objective:** connect delivery, people and support.
**Deliverables:** projects, deliverables, tasks, milestones, resourcing, costing, variations, employees, positions, capacity, site assignments, cases, SLA, knowledge base.
**Dependencies:** PH-14.
**Acceptance:**
- AC-15-01 Project completion requires accepted deliverables.
- AC-15-02 Allocation cannot silently exceed capacity.
- AC-15-03 Case resolution requires a note; SLA timers are correct.
- AC-15-04 Employee sensitive fields are separately permissioned.
**Gate:** module acceptance.

---

### PH-16 — Data quality and analytics data model
**Objective:** make analysis possible without corrupting truth.
**Deliverables:** quality rules, exception queue, lineage, analytics schema, metric store design, freshness tracking.
**Dependencies:** PH-15.
**Acceptance:**
- AC-16-01 Quality exceptions are visible and owned.
- AC-16-02 Lineage resolves metric → source.
- AC-16-03 Analytics reads do not degrade transactional performance.
**Gate:** data verification.

---

### PH-17 — Business metrics and analytics services
**Objective:** one definition per metric, one calculation path.
**Deliverables:** metric registry, calculation service, materialisation, versioning, comparison support, drill-path definitions.
**Dependencies:** PH-16.
**Acceptance:**
- AC-17-01 No dashboard computes a KPI locally.
- AC-17-02 Each metric has definition, owner, formula, source and freshness.
- AC-17-03 Fixture-based tests prove formula correctness.
- AC-17-04 Metric version changes are audited with impact noted.
**Gate:** metric correctness.

---

### PH-18 — Dashboards, reports and drill-downs
**Objective:** deliver decision-ready views.
**Deliverables:** role-aware dashboards, report builder, schedules, exports, drill-down to records, freshness indicators.
**Dependencies:** PH-17.
**Acceptance:**
- AC-18-01 Every widget states period, scope and freshness.
- AC-18-02 Drill-down respects scope and never reveals denied records.
- AC-18-03 Exports reflect applied filters and are audited.
- AC-18-04 Empty and insufficient-data states are designed.
**Gate:** acceptance.

---

### PH-19 — ML data pipelines and feature engineering
**Objective:** produce reproducible, leakage-safe datasets.
**Deliverables:** dataset versioning, feature registry, validation, training/serving parity, minimum-data checks, Python service decision (`OD-007`).
**Dependencies:** PH-16.
**Acceptance:**
- AC-19-01 Datasets are immutable, hashed and reproducible.
- AC-19-02 Leakage tests run automatically.
- AC-19-03 Insufficient data is detected before modelling.
**Gate:** pipeline verification.

---

### PH-20 — ML models and evaluation
**Objective:** prove models beat baselines before use.
**Deliverables:** baseline models, training runs, evaluation reports, calibration, bias review, model cards, registry states.
**Dependencies:** PH-19.
**Acceptance:**
- AC-20-01 Every model beats its baseline on held-out data with uncertainty.
- AC-20-02 Performance is reported per segment.
- AC-20-03 Model card documents intended and prohibited use.
- AC-20-04 Approval is separate from training.
**Gate:** evaluation gate.

---

### PH-21 — Model serving and inference services
**Objective:** serve predictions safely and observably.
**Deliverables:** versioned serving contract, input validation, auth, timeouts, degradation, prediction logging, batch scoring.
**Dependencies:** PH-20.
**Acceptance:**
- AC-21-01 Every response records model version and dataset version.
- AC-21-02 Out-of-distribution inputs reduce confidence and warn.
- AC-21-03 Model outage degrades gracefully without blocking the app.
- AC-21-04 Serving enforces actor scope.
**Gate:** serving verification.

---

### PH-22 — Inference intelligence engine and decision layer
**Objective:** turn evidence into explainable recommendations.
**Deliverables:** orchestrator, rules engine, evidence assembly, uncertainty model, recommendation ranking, action proposals, approval integration.
**Dependencies:** PH-17, PH-21, PH-10.
**Acceptance:**
- AC-22-01 Every claim resolves to evidence or is labelled an assumption.
- AC-22-02 Insufficient data yields "insufficient data", never filler.
- AC-22-03 The engine cannot execute actions.
- AC-22-04 Prompt-injection tests pass.
- AC-22-05 Context never exceeds actor scope.
**Gate:** safety verification.

---

### PH-23 — AI assistant, workflows and controlled automation
**Objective:** deliver assisted work with human authority.
**Deliverables:** assistant surface, allow-listed actions, approval routing, execution log, outcome measurement, opt-out.
**Dependencies:** PH-22.
**Acceptance:**
- AC-23-01 No consequential action executes without an authorised approver.
- AC-23-02 Only allow-listed actions execute; others are recommendations.
- AC-23-03 Outcomes are measured against a pre-registered baseline.
- AC-23-04 Tenants can disable AI features entirely.
**Gate:** governance verification.

---

### PH-24 — Integrations, SaaS administration and industry configuration
**Objective:** operate ONO as a product for many businesses.
**Deliverables:** plans/entitlements, feature flags, tenant lifecycle, support grants, integration registry, webhooks, import/export, industry catalogue and profiles, custom-industry review, extension mechanism.
**Dependencies:** PH-22, PH-05.
**Acceptance:**
- AC-24-01 A new industry can be onboarded without code changes, including "Other".
- AC-24-02 Plan entitlements gate modules and are enforced server-side.
- AC-24-03 Support access is time-boxed, reasoned and audited in the tenant log.
- AC-24-04 Imports report partial results honestly.
**Gate:** integration verification.

---

### PH-25 — Full-system verification
**Objective:** prove the whole system, not the parts.
**Deliverables:** end-to-end suites, cross-tenant probes, performance tests, accessibility audit, security review, restore drill, migration rehearsal, UAT with representative businesses.
**Dependencies:** all prior phases.
**Acceptance:**
- AC-25-01 All critical workflows pass end to end.
- AC-25-02 No cross-tenant leakage in automated probes or manual review.
- AC-25-03 Accessibility meets WCAG 2.2 AA for shipped surfaces.
- AC-25-04 Performance targets (`NFR-001`–`004`) are measured and met or renegotiated.
- AC-25-05 Restore from backup verified.
**Gate:** release candidate.

---

### PH-26 — Production deployment and handover
**Objective:** launch safely with a real operational capability.
**Deliverables:** infrastructure as code, environment provisioning, secrets, backups, monitoring, alerting, runbooks, on-call rotation, data processing agreements, support process, handover training, rollback plan.
**Dependencies:** PH-25.
**Acceptance:**
- AC-26-01 Production migration executed with pre-flight checks and rollback plan.
- AC-26-02 Monitoring and alerts verified with a synthetic incident.
- AC-26-03 Backups and restore verified in production.
- AC-26-04 Runbooks cover database loss, credential compromise and tenant isolation incident.
- AC-26-05 Product owner signs off the launch checklist.
**Gate:** launch approval.

---

## 3. Dependency graph

```
PH-01 → PH-02 → PH-03 → PH-04 → PH-05 → PH-06 → PH-07
                                   ↘ PH-08 → PH-09 → PH-10
                                                       ↓
                          PH-11 → PH-12 → PH-13 → PH-14 → PH-15
                                                             ↓
                                                    PH-16 → PH-17 → PH-18
                                                             ↓
                                                    PH-19 → PH-20 → PH-21
                                                             ↓
                                                          PH-22 → PH-23
                                                             ↓
                                                          PH-24 → PH-25 → PH-26
```

Parallelisable after PH-10: PH-16/PH-17 (analytics) can start alongside
PH-13/PH-14 if the metric definitions for those domains are agreed early, but
this is **not** the current baseline.

---

## 4. Recommended adjustments (require approval)

| Ref | Recommendation | Rationale | Status |
| --- | --- | --- | --- |
| REC-01 | Pull audit and notification services forward into PH-08/PH-09 rather than PH-10 | Finance and approval correctness depend on audit existing first | `Proposed` |
| REC-02 | Split PH-13 into PH-13a (invoicing/receivables) and PH-13b (ledger/reporting) | Reduces a very large phase and allows earlier customer value | `Proposed` |
| REC-03 | Add an explicit data-migration/reconciliation sub-phase before PH-25 | Imported legacy data is a common launch failure | `Proposed` |
| REC-04 | Defer PH-23 to post-launch if launch scope must shrink | Keeps automation out of the first release while preserving the vision | `Proposed` |
| REC-05 | Keep ML to UC-01/UC-02/UC-03 for the first release | Data availability is the binding constraint | `Proposed` |

No phase boundary changes until the product owner approves them.

---

## 5. Definition of done (applies to every phase)

| Criterion | Requirement |
| --- | --- |
| Tests | Unit and integration tests for new behaviour pass |
| Types | Strict TypeScript, no `any`, no suppressed errors |
| Contracts | Input validated; output permission-filtered |
| Tenancy | Tenant guard applied and tested |
| Authorisation | Server-side checks with denial tests |
| Audit | Consequential events emitted |
| Accessibility | Keyboard and contrast verified for new UI |
| States | Loading, empty, error, success, disabled covered |
| Docs | Relevant docs updated; ADRs recorded for decisions |
| Review | Peer review completed; no unreviewed migration |

---

## 6. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial 26-phase roadmap with gates and acceptance criteria. |
