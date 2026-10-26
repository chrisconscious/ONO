# ONO — Master Project Specification

| Field | Value |
| --- | --- |
| Product | **ONO** — AI-Powered Integrated Business Intelligence & Management Platform |
| Document | Master Project Specification |
| Version | 1.0 |
| Date | 2026-10-26 |
| Stage | 1 — Requirements and planning only |
| Status | `Recorded` — awaiting product-owner review |
| Owner | Product owner (Chris) |
| Supersedes | All prior working references using the name "ClickIT" |

> **Naming decision.** The product is **ONO**. "ClickIT" is retired and must not
> appear in product surfaces, code identifiers, package names, documentation or
> infrastructure. The repository, package name and application shell already use
> `ONO` / `ono`.

---

## 1. Vision

ONO is a universal, configurable, multi-tenant business operating system. It
connects the operational records a business already produces to reliable
metrics, explainable insight, predictions where data supports them, and
approved actions whose outcomes are measured.

ONO is explicitly **not** another record-keeping tool with decorative charts.
Its differentiator is the closed loop between:

> observed data → validated data → trusted metrics → explanation →
> prediction (when justified) → recommended action → human approval →
> controlled execution → measured outcome → improved future decisions.

## 2. Problem statement

Businesses run on fragmented systems: spreadsheets, messaging apps, accounting
packages and disconnected CRMs. The consequences are consistent across
industries:

1. The same number is calculated differently in different places, so nobody
   trusts the dashboard.
2. Data is captured but not connected, so cause and effect are invisible.
3. Reports describe the past; nobody can say what is likely next, or why.
4. Recommendations are either absent or unsupported by evidence.
5. Actions are taken without a record of the decision, the approver or the
   measured result, so the organisation cannot learn.
6. Software is industry-specific, so any business outside a narrow template is
   forced into someone else's process.

ONO addresses these by treating **metric definitions, evidence and outcomes as
first-class product objects**, and by making the core universal while industry
behaviour is configuration plus extension.

## 3. Objectives

| ID | Objective | Measure of success |
| --- | --- | --- |
| OBJ-1 | One trustworthy source of business metrics | Every dashboard metric resolves to one registered definition (`MET-*`) and one calculation path |
| OBJ-2 | Connect operations to decisions | Every insight links to source records and to an owner |
| OBJ-3 | Honest intelligence | Every AI/ML output is labelled as fact, metric, prediction, assumption or recommendation, with confidence and provenance |
| OBJ-4 | Universal industry fit | Any business can onboard, including one whose industry is not in the catalogue |
| OBJ-5 | Safe multi-tenancy | Zero cross-tenant data exposure, enforced server-side and tested |
| OBJ-6 | Governed action | No consequential action executes without an authorised approver and an audit record |
| OBJ-7 | Measurable outcomes | Accepted recommendations can be traced to a measured business result |
| OBJ-8 | Operational excellence | Accessible, responsive, fast, observable, recoverable |
| OBJ-9 | Sustainable delivery | Modular boundaries, schema-first data, reviewed migrations, automated tests |

## 4. Target users

| ID | Persona | Primary needs | Typical modules |
| --- | --- | --- | --- |
| PER-01 | Owner / CEO | Company-wide truth, risk, growth, cash position | BI, Strategy, Finance, AI Insights |
| PER-02 | General manager | Cross-department performance, approvals, exceptions | All tenant modules, Approvals |
| PER-03 | Sales manager | Pipeline health, forecast, team performance | CRM, Sales, BI |
| PER-04 | Sales representative | Own leads, activities, quotes | CRM, Sales |
| PER-05 | Marketing manager | Campaign return, acquisition cost, attribution | Marketing, BI |
| PER-06 | Finance manager / accountant | Receivables, payables, cash, statements, controls | Finance, Procurement |
| PER-07 | Operations manager | Delivery, stock, suppliers, throughput | Projects, Inventory, Procurement |
| PER-08 | Inventory / procurement officer | Stock accuracy, reorder, purchase flow | Inventory, Procurement |
| PER-09 | Project manager | Scope, schedule, cost, utilisation | Projects, Workforce |
| PER-10 | HR / workforce manager | Staff records, allocation, capacity | Workforce |
| PER-11 | Support agent | Cases, history, resolution, satisfaction | Support, CRM |
| PER-12 | Organisation administrator | Users, roles, configuration, audit | Organisation, IAM |
| PER-13 | Platform administrator | Tenant lifecycle, plans, platform health | Platform administration |
| PER-14 | Auditor / read-only reviewer | Evidence, history, exports | Audit, BI, Documents |

A single person may hold several personas. ONO must support that without
weakening authorisation (see `ROLES_AND_PERMISSION_MODEL.md`).

## 5. The intelligence cycle

ONO is defined by this eleven-step cycle. Each step has an owner, an artefact and
a quality gate.

| Step | Activity | Artefact | Gate |
| --- | --- | --- | --- |
| 1 | Collect authorised operational data | Source records, imports, integrations | Data is lawfully obtained and scoped to the tenant |
| 2 | Validate and organise | Clean, typed, deduplicated records | Validation rules pass; exceptions queued |
| 3 | Calculate reliable metrics | Registered metric values | One definition per metric (`MET-*`) |
| 4 | Identify trends, anomalies, risk | Signals with time windows | Statistical/deterministic basis recorded |
| 5 | Explain what is happening | Explanation with linked evidence | Every claim resolvable to data |
| 6 | Predict plausible futures | Forecasts with intervals | Only where data and model quality justify it |
| 7 | Evaluate candidate actions | Options with constraints | Business rules applied first |
| 8 | Recommend with evidence and uncertainty | Ranked recommendations | Confidence, impact, assumptions stated |
| 9 | Human approval or rejection | Decision record | Authorised approver only |
| 10 | Execute only permitted actions | Execution log | Allow-listed action types |
| 11 | Measure outcome and feed back | Outcome record, model feedback | Baseline captured before execution |

### 5.1 Epistemic rules (non-negotiable)

| ID | Rule |
| --- | --- |
| EPI-1 | Never present a prediction as an observed fact. |
| EPI-2 | Never fabricate business evidence, records, customers, amounts or events. |
| EPI-3 | Every metric states its definition, period, source and freshness. |
| EPI-4 | Every insight states what is observed, what is inferred, and what is uncertain. |
| EPI-5 | Recommendations are labelled as recommendations and rank-ordered with reasons. |
| EPI-6 | Confidence is expressed meaningfully (interval, band or calibrated probability), not as decoration. |
| EPI-7 | When data is insufficient, the correct output is "insufficient data", not a guess. |
| EPI-8 | Deterministic rules take precedence over probabilistic suggestions for compliance-sensitive logic. |
| EPI-9 | AI assistance never silently mutates financial, contractual or permission-bearing records. |
| EPI-10 | Model identity, version and input scope are recorded for every served prediction. |

## 6. Scope

### 6.1 In scope (full product vision)

- Multi-tenant organisation management, branches, departments, users, roles.
- Universal business modules: CRM, sales, marketing, finance, inventory,
  procurement, projects, workforce, support, documents, strategy, BI, AI.
- Industry adaptation: catalogue, profiles, custom-industry onboarding,
  configurable terminology/fields/workflows/metrics.
- Governed intelligence: metrics registry, analytics, ML services, inference
  engine, decision layer, controlled automation.
- Integrations, background jobs, SaaS administration, audit.
- Secure, accessible, responsive web application opening at authentication.

### 6.2 Out of scope for this project phase

| Excluded | Reason | Revisit |
| --- | --- | --- |
| Public marketing website | To be developed separately by decision | Not part of application |
| Native mobile apps | Web-first responsive delivery | Post-PH-26 |
| Full payroll processing / statutory filing | Jurisdiction-heavy, high liability | Requires legal review |
| Payment initiation / money movement | Regulatory and custody risk | Requires partner + legal |
| Data marketplace (selling/sharing insights) | Separate governance regime | PH-26+ as a new programme |
| Industry-complete coverage of all 20+ industries | Unrealistic for v1 | Staged via PH-24 and extensions |

### 6.3 Out of scope permanently (product boundaries)

- Selling or exposing identifiable customer records to other tenants.
- Autonomous execution of financially or legally consequential actions without
  an authorised human approver.
- Presenting unsupported regulatory, tax or compliance guarantees.

## 7. Product principles

| ID | Principle | Consequence |
| --- | --- | --- |
| P-01 | Universal core, configurable edge | No industry logic in core services; industry behaviour is profile + extension |
| P-02 | One metric, one definition | Metrics registry is authoritative; dashboards cannot compute ad hoc KPIs |
| P-03 | Evidence or silence | Insights without resolvable evidence are not shown |
| P-04 | Default deny | Authorisation fails closed; absence of a grant is a denial |
| P-05 | Tenant isolation is structural | Enforced at the data-access layer, not only in UI |
| P-06 | Human authority over consequential action | Approval is a first-class object, not a UI modal |
| P-07 | Records are auditable | Critical operations append immutable audit events |
| P-08 | Boring where it matters | Deterministic rules for money, permissions, compliance |
| P-09 | Configuration is bounded | Tenants configure within validated boundaries, never arbitrary code |
| P-10 | Explainability over cleverness | Simpler explainable model beats complex opaque one at equal value |
| P-11 | Accessibility is functional | Keyboard, focus, contrast and reduced motion are acceptance criteria |
| P-12 | No invented data | Seeds, demos and fixtures are labelled and never mixed with tenant data |

## 8. Requirement summary by domain

Full statements, acceptance criteria and status are in
`REQUIREMENTS_TRACEABILITY_MATRIX.md`; module detail is in
`MODULE_AND_FEATURE_INVENTORY.md`.

| Domain | Prefix | Requirements | Primary document |
| --- | --- | --- | --- |
| Platform & SaaS operations | `REQ-PLT` | 6 | Module inventory |
| Organisation & structure | `REQ-ORG` | 6 | Module inventory, permission model |
| Identity & access | `REQ-IAM` | 8 | Permission model |
| Industry adaptation | `REQ-IND` | 6 | Industry specification |
| CRM | `REQ-CRM` | 7 | Module inventory |
| Sales | `REQ-SAL` | 7 | Module inventory |
| Marketing | `REQ-MKT` | 5 | Module inventory |
| Finance | `REQ-FIN` | 8 | Module inventory, workflow catalogue |
| Inventory | `REQ-INV` | 6 | Module inventory |
| Procurement | `REQ-PRC` | 6 | Module inventory, workflow catalogue |
| Projects & operations | `REQ-PRJ` | 6 | Module inventory |
| Workforce | `REQ-WFM` | 5 | Module inventory |
| Customer support | `REQ-SUP` | 5 | Module inventory |
| Documents & communication | `REQ-DOC` | 5 | Module inventory |
| Strategy & performance | `REQ-STR` | 5 | Module inventory |
| Business intelligence | `REQ-BI` | 8 | AI/ML specification |
| Machine learning | `REQ-ML` | 6 | AI/ML specification |
| Inference intelligence | `REQ-INF` | 7 | AI/ML specification |
| Integrations | `REQ-INT` | 5 | Architecture plan |
| Data marketplace (future) | `REQ-MDP` | 3 | Master spec §6.2 |
| Data governance | `REQ-DATA` | 5 | Database plan |
| Security & privacy | `REQ-SEC` | 8 | Security requirements |
| Reliability & delivery | `REQ-OPS` | 5 | Architecture plan, roadmap |
| UI/UX & accessibility | `REQ-UX` | 7 | UI/UX requirements |

Total functional requirements: **145**. Non-functional: **12** (`NFR-001`–`NFR-012`).

## 9. Non-functional requirements

| ID | Area | Requirement | Target (proposed) |
| --- | --- | --- | --- |
| NFR-001 | Performance | Interactive page response for standard list/detail views | p95 < 2.5 s server response at 1,000 concurrent tenant users |
| NFR-002 | Performance | Dashboard query latency | p95 < 4 s for standard dashboards over 24 months of data |
| NFR-003 | Availability | Tenant application availability | 99.9% monthly, excluding announced maintenance |
| NFR-004 | Scalability | Tenant count without redesign | 1,000 tenants / 100,000 users on modular monolith + read replicas |
| NFR-005 | Recoverability | Recovery point / recovery time objectives | RPO ≤ 15 min, RTO ≤ 4 h (needs approval, `OD-021`) |
| NFR-006 | Accessibility | Conformance target | WCAG 2.2 AA for all shipped surfaces |
| NFR-007 | Browser support | Supported clients | Current and previous major versions of Chrome, Edge, Firefox, Safari; 360 px minimum width |
| NFR-008 | Security | Tenant isolation | No cross-tenant read/write path, proven by automated tests |
| NFR-009 | Auditability | Critical operation coverage | 100% of financial, permission and configuration changes audited |
| NFR-010 | Observability | Traceability of requests and jobs | Correlation ID across request → job → integration → inference |
| NFR-011 | Maintainability | Type safety and boundaries | Strict TypeScript, no `any`, no cross-feature deep imports |
| NFR-012 | Localisation readiness | Multi-currency, multi-timezone, multi-locale | Stored per tenant; no hard-coded currency, date format or timezone |

All numeric targets are **proposals requiring approval**; see
`OPEN_DECISIONS_AND_ASSUMPTIONS.md`.

## 10. Constraints

| ID | Constraint |
| --- | --- |
| C-01 | Authentication-first: the application opens on sign-in. No public marketing surface. |
| C-02 | Documentation-only until explicit implementation authorisation. |
| C-03 | TypeScript is the primary language for application logic. |
| C-04 | PostgreSQL is the proposed primary relational store. |
| C-05 | Prisma is the proposed ORM, subject to an explicit compatibility decision. |
| C-06 | Python/FastAPI only if a separate ML service is justified by a documented need. |
| C-07 | No new language, framework, database or service without an approved ADR. |
| C-08 | No secrets in source control. |
| C-09 | Every tenant-owned operation is tenant-scoped. |
| C-10 | No unsupported claims about regulatory compliance or data residency. |
| C-11 | Migrations must be reviewed; no unreviewed schema drift. |
| C-12 | Existing working authentication must be preserved where applicable (none exists yet — see `PROJECT_STATUS.md`). |

## 11. Success measures

| Layer | Measure |
| --- | --- |
| Product | A business can onboard, configure its industry, and run at least one end-to-end operational process in a single system |
| Trust | Finance and management accept ONO numbers as authoritative because definitions are visible |
| Intelligence | Recommendations are accepted at a measured rate and outcomes are recorded |
| Safety | No confirmed cross-tenant disclosure; no unaudited consequential change |
| Adoption | Weekly active users per tenant across ≥ 2 modules within 60 days of onboarding |
| Delivery | Each phase exits with its gate met, not merely "code written" |

## 12. Definitions

| Term | Definition |
| --- | --- |
| **Observed fact** | A record captured from a source (user entry, import, integration event). |
| **Derived metric** | A value computed from facts by a registered definition (`MET-*`). |
| **Prediction** | A model or statistical output about an unobserved value or future state, with uncertainty. |
| **Inference** | The process of deriving conclusions from facts, metrics, rules and predictions. |
| **Recommendation** | A proposed action with rationale, expected impact, constraints and confidence. |
| **Assumption** | A stated premise that, if false, changes the conclusion. |
| **Tenant** | An independent customer organisation; the isolation boundary. |
| **Branch** | A physical or logical operating location within a tenant. |
| **Scope** | The data subset an actor may act on: tenant, branch, department, ownership, sensitivity. |
| **Evidence** | A resolvable reference to records, metrics or models supporting a claim. |
| **Decision record** | Immutable record of a recommendation, its approver, the decision and the timestamp. |
| **Outcome record** | Measured post-action state compared with the pre-action baseline. |
| **Industry profile** | Configuration bundle (modules, terminology, metrics, workflows) applied to a tenant. |
| **Extension** | A bounded, reviewed capability added for an industry without forking the core. |

## 13. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial Stage 1 baseline. Product name corrected from ClickIT to ONO. |

Related: `MODULE_AND_FEATURE_INVENTORY.md`, `DEVELOPMENT_ROADMAP.md`,
`OPEN_DECISIONS_AND_ASSUMPTIONS.md`, `PROJECT_STATUS.md`.
