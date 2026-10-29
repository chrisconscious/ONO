# ONO — Open Decisions and Assumptions

| Field | Value |
| --- | --- |
| Document | Open Decisions and Assumptions |
| Version | 1.1 |
| Stage | 2 — Architecture and technical contracts (extends the Stage 1 register) |
| Date | 2026-10-26 |
| Status | `Recorded` — every item below needs a human decision or confirmation |
| Rule | Documentation does not wait for every answer; blocking items are marked. |

> **Stage 2 update.** Every Stage 1 identifier is preserved; nothing is
> renumbered. New items begin at `OD-037`, `CF-11` and `RISK-016`. Stage 2 also
> records four approved architecture decisions and two product/market decisions
> in §6. Items that remain open are still open — the architecture documents do
> not silently close them.

---

## 1. How decisions are closed

1. The product owner records a decision against the `OD-*` identifier.
2. The decision states the choice, the rationale, the date and the owner.
3. Affected documents are updated (requirement status, ADR, roadmap).
4. The item moves to §5 (decided) with a pointer to where it is recorded.

Items marked **Blocking** stop the phase listed beside them.

---

## 2. Open decisions

### 2.1 Product and market

| ID | Question | Options | Recommendation | Needed by |
| --- | --- | --- | --- | --- |
| `OD-001` | Which market and which 3–5 pilot businesses define "good enough" for launch? | Tanzania-first; East Africa; global self-serve | Tanzania-first with 3 pilot industries (distribution, construction, professional services) | PH-04 |
| `OD-018` | Which jurisdictions are legally in scope at launch? | Single; multiple | Single jurisdiction at launch, confirmed by counsel | PH-05 |
| `OD-025` | Is the data marketplace an approved future programme? | Yes/no/defer | Defer; separate governance and legal basis required | Post-PH-26 |
| `OD-031` | Which languages for v1? | English only; English + Swahili | English first, with all strings externalised | PH-04 |
| `OD-030` | Dark mode in v1? | Yes/no | No; tokens prepared for later | PH-07 |
| `OD-032` | Print/PDF fidelity for invoices and reports? | Browser print; generated PDF | Generated PDF for invoices, browser print for internal reports | PH-13 |

### 2.2 Architecture and technology

| ID | Question | Options | Recommendation | Needed by |
| --- | --- | --- | --- | --- |
| `OD-002` | Primary relational database | PostgreSQL; MySQL; SQL Server | PostgreSQL 16+ | PH-08 |
| `OD-003` | Authentication provider and session model | Managed auth; self-hosted; library | Managed provider with DB-backed sessions for revocation | PH-05 **Blocking** |
| `OD-004` | Confirm Prisma as ORM, and the SQL boundary for reporting | Prisma; Drizzle; Kysely; raw SQL | Prisma for transactional, SQL views for BI | PH-08 |
| `OD-005` | Custom field storage | JSONB; EAV; typed side tables | JSONB with validation and selective indexes | PH-08 |
| `OD-006` | Component system | shadcn/ui; custom; other library | shadcn/ui with owned source | PH-04 |
| `OD-007` | Separate Python ML service? | Yes now; later; never | Later, only when data volume justifies; start in-process | PH-19 |
| `OD-008` | Background job technology | Managed queue; Redis-based; database-backed | Database-backed queue first, managed queue at scale | PH-10 |
| `OD-009` | Object storage | S3-compatible; provider-specific | S3-compatible for portability | PH-10 |
| `OD-010` | Test tooling | Vitest + Playwright; Jest + Cypress | Vitest + Playwright | PH-03 |
| `OD-011` | CI/CD platform and environment topology | GitHub Actions; other | GitHub Actions with staging and production | PH-03 |
| `OD-012` | Observability stack | Managed vendor; self-hosted | Managed logs/metrics initially | PH-10 |
| `OD-037` | Is row-level security enabled in v1, and with which pooling model? | v1; later; never | Enable in v1 as defence in depth with transaction pooling; prove with tests | PH-08 |
| `OD-038` | What measured threshold justifies introducing a message broker? | No broker; outbox only; broker at volume | Outbox until dispatch lag or volume exceeds a documented threshold; revisit at PH-24 | PH-24 |
| `OD-039` | How long are outbox events retained, and what is the replay window? | 7/30/90 days | 30 days with operator replay; must exceed the longest planned consumer outage | PH-10 |
| `OD-040` | What triggers a columnar warehouse or OLAP store? | Never; replica only; warehouse at threshold | Replica plus materialisation first; warehouse only when measured query cost or data volume exceeds a documented threshold | PH-16 |
| `OD-043` | Is malware scanning required before any file download, and with which service? | Scan all; scan external only; none | Scan all uploads before availability; provider to be selected | PH-10 |
| `OD-044` | At what size does an export or report become asynchronous? | Row/time threshold | Async above a documented row or time threshold; synchronous small exports only | PH-18 |
| `OD-045` | What is the API deprecation window and supported-version policy? | 3/6/12 months | 6 months with `Deprecation` and `Sunset` headers, documented announcement | PH-09 |
| `OD-046` | How long are idempotency keys and responses retained? | 24 h; 7 days; 30 days | 7 days, bounded by storage; replays must be safe within the window | PH-09 |

### 2.3 Industry and configuration

| ID | Question | Options | Recommendation | Needed by |
| --- | --- | --- | --- | --- |
| `OD-013` | Who curates the industry catalogue, and how often? | Product owner; dedicated curator; community | Product owner initially, quarterly review | PH-24 |
| `OD-014` | Are custom industry names visible to other tenants before promotion? | Yes/no | No — tenant-private until curated | PH-24 |
| `OD-015` | Limits on custom fields | 5/entity; 20/entity; unlimited | 20 per entity, 100 per tenant | PH-08 |
| `OD-016` | Workflow variants: fixed or tenant-authored DSL? | Fixed; DSL; code extension | Fixed variants; no tenant DSL in v1 | PH-09 |
| `OD-019` | Is a permission DSL exposed to tenants? | Yes/no | No — composition of approved permissions only | PH-05 |
| `OD-020` | Must support grants always require tenant approval? | Always; sensitive only | Sensitive modules only, with tenant-visible audit | PH-24 |

### 2.4 Roles, approval and finance

| ID | Question | Options | Recommendation | Needed by |
| --- | --- | --- | --- | --- |
| `OD-017` | Approval thresholds and currency handling | Fixed defaults; tenant-configurable | Tenant-configurable within platform maximums | PH-09 |
| `OD-036` | Is multi-currency required in v1? | Single; multi | Multi-currency records, single reporting currency per tenant | PH-13 |

### 2.5 Security, privacy and operations

| ID | Question | Options | Recommendation | Needed by |
| --- | --- | --- | --- | --- |
| `OD-021` | Backup retention, RPO and RTO | 7/15/30-day retention | 30-day retention, RPO 15 min, RTO 4 h | PH-10 |
| `OD-022` | Data residency | Single region; per-tenant region | Single region at launch, documented honestly | PH-05 |
| `OD-023` | Audit and financial retention periods | 5/7/10 years | 7 years, subject to local counsel | PH-10 |
| `OD-024` | Session lifetime and re-authentication | 8 h; 12 h; 30 days | 12 h absolute, 30 min idle, re-auth for sensitive actions | PH-05 |
| `OD-033` | Controller/processor allocation per data category | ONO processor; mixed | ONO processor for tenant data; controller for platform accounts — legal review | PH-05 |
| `OD-034` | Approved sub-processors | Hosting, email, AI, storage | Approve explicitly, list publicly, contract each | PH-05 |
| `OD-035` | Special-category data in scope for v1? | Yes/no | No — exclude health/biometric detail; healthcare tenants use reduced scope | PH-05 |

### 2.6 AI governance

| ID | Question | Options | Recommendation | Needed by |
| --- | --- | --- | --- | --- |
| `OD-026` | Cross-tenant pooled model training | Never; with consent; aggregated only | Not in v1; requires separate governance | PH-19 |
| `OD-027` | LLM/AI providers permitted, and data-processing terms | One; multiple; none | One approved provider with no-training terms; pluggable interface | PH-22 |
| `OD-028` | Outcome measurement windows per action class | Fixed; per action | Per action class, agreed with pilot tenants | PH-22 |
| `OD-029` | May tenants disable all AI features? | Yes/no | Yes, with no loss of core function | PH-22 |
| `OD-041` | Which use cases justify synchronous inference, and what is the latency budget? | Batch only; narrow synchronous set | Batch-first; synchronous only for interactive assistant or decision flows with a hard timeout and deterministic fallback | PH-21 |
| `OD-042` | Is the model registry built in-house or managed? | In-house database + object storage; managed registry | In-house registry tables plus content-addressed object storage (`ADR-031`); revisit if model volume or compliance demands a managed service | PH-20 |

---

## 3. Working assumptions

| ID | Assumption | If false |
| --- | --- | --- |
| `ASM-001` | Target customers are SMB to mid-market organisations (5–500 users) | Enterprise requirements (SSO, custom SLAs) arrive earlier than planned |
| `ASM-002` | English is sufficient for v1 UI | Localisation moves into PH-04/PH-07 |
| `ASM-003` | Single-region hosting at launch | Data-residency work expands PH-05 and PH-26 |
| `ASM-004` | Users have reliable internet; offline-first is not required for v1 | Field operations need a sync/offline design (major scope) |
| `ASM-005` | No legacy production data must be migrated | A migration/reconciliation phase is required before PH-25 |
| `ASM-006` | No existing authentication must be preserved | `C-12` is void; integration work is added to PH-05 |
| `ASM-007` | No existing production users or data exist | Backward-compatibility constraints would apply from PH-08 |
| `ASM-008` | A managed PostgreSQL service is available | Self-hosted database operations enter PH-26 |
| `ASM-009` | ONO records payments but does not initiate money movement | Payment initiation would require licensing review |
| `ASM-010` | Tenants will accept provider-based email delivery | Self-hosted mail infrastructure would be required |
| `ASM-011` | AI provider usage is permitted with contractual no-training terms | AI features would be limited to self-hosted models |
| `ASM-012` | A small team (1–3 engineers) delivers the first release | Timeline and parallelisation change materially |
| `ASM-013` | Users access via current evergreen browsers | Legacy browser support would constrain the component system |
| `ASM-014` | Legal review is available before launch | Launch must be delayed or scope restricted to non-regulated features |
| `ASM-015` | Tenants are responsible for their own statutory tax treatment | ONO would need jurisdiction-specific tax engines (major scope) |
| `ASM-016` | Managed infrastructure budget is available | Self-hosting increases PH-26 effort and risk |

---

## 4. Known conflicts and inconsistencies

| ID | Conflict | Resolution status |
| --- | --- | --- |
| `CF-01` | Scaffold serves a landing page at `/`; requirement is authentication-first | **Resolved by plan:** replace in PH-05. Code not yet changed. |
| `CF-02` | `User.tenantId` implies one tenant per user; model requires multi-tenant membership | **Resolved by plan:** `Membership` entity in PH-08 |
| `CF-03` | Single `role` enum cannot express multiple or custom roles | **Resolved by plan:** role + assignment model in PH-08 |
| `CF-04` | Nine documented modules have no feature folder | Open — create in PH-04/PH-05 |
| `CF-05` | "Data marketplace" vs "never sell customer records" | **Clarified:** marketplace would expose only governed, aggregated insight — never records. Not approved. |
| `CF-06` | 26-phase list vs recommended adjustments (REC-01…REC-05) | Open — requires approval |
| `CF-07` | Product name "ClickIT" appeared in the original brief | **Resolved:** product is ONO; name corrected across all documents |
| `CF-08` | "Universal industry support" vs "do not build every industry in v1" | **Clarified:** universality via universal core + custom path; coverage staged |
| `CF-09` | No native mobile app vs field operations (site assignment, delivery proof) | Open — responsive web first; revisit after `ASM-004` is tested |
| `CF-10` | "No implementation" instruction vs an existing scaffold in the repo | **Closed 2026-10-26:** scaffold predates Stage 1 authorisation, is documented as such in `PROJECT_STATUS.md`, and was committed as `4f14249` with no further implementation |
| `CF-11` | The Stage 2 brief again referred to the product as "ClickIT" | **Resolved 2026-10-26:** the product is **ONO**; the Stage 2 brief is recorded as a naming slip. No document uses ClickIT as the product name. |
| `CF-12` | Stage 1 defined five data-classification labels; early Stage 2 drafts used four | **Resolved 2026-10-26:** canonical labels are `public`, `internal`, `confidential`, `restricted`, `secret`. `secret` is credential-only and never a business record. `ADR-026` and all Stage 2 documents use the five-label model. |

---

## 5. Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- |
| `RISK-001` | Cross-tenant data leakage | Low | Critical | Repository guard, RLS, automated probes, review | Architecture |
| `RISK-002` | Scope explosion across 23 modules | High | High | Phase gates, P1-only launch scope, REC-04 | Product |
| `RISK-003` | Metric definitions drift | Medium | High | Registry-only calculation, versioning, review | Analytics |
| `RISK-004` | AI outputs over-trusted | Medium | High | Labelling, evidence, uncertainty, approval gates | Product/AI |
| `RISK-005` | Financial correctness defects | Medium | Critical | Immutability, reconciliation tests, review | Finance |
| `RISK-006` | Custom fields become untyped chaos | Medium | Medium | Types, limits, validation, usage reporting | Data |
| `RISK-007` | Approval bypass under pressure | Medium | High | Server enforcement, SOD, audit, alerts | Security |
| `RISK-008` | Reporting load degrades transactions | Medium | High | Read replica/analytics store before scale | Architecture |
| `RISK-009` | Weak industry profiles make onboarding feel generic | High | Medium | Pilot with 3 industries, iterate profiles | Product |
| `RISK-010` | Insufficient data makes ML useless at launch | High | Medium | Deterministic/statistical first, UC-01..03 only | AI |
| `RISK-011` | Compliance claims made without evidence | Medium | Critical | Explicit disclaimers, legal review gate | Product |
| `RISK-012` | Small team + 26 phases = long time to value | High | High | Slice by vertical value, not by layer completeness | Product |
| `RISK-013` | Data migration from spreadsheets corrupts trust | Medium | High | Import validation, reconciliation phase (REC-03) | Data |
| `RISK-014` | Secrets or credentials leak via logs | Low | Critical | Secret scanning, log hygiene, review | Security |
| `RISK-015` | AI provider changes terms or pricing | Medium | Medium | Pluggable provider interface, fallback rules-only mode | Architecture |
| `RISK-016` | At-least-once event delivery creates duplicate business effects | Medium | High | Consumer ledger `(consumer, eventId)`, idempotent handlers, duplicate tests | Architecture |
| `RISK-017` | Module boundaries erode under delivery pressure and the monolith becomes a tangle | High | High | Import lint, graph check, one public entrypoint, PR dependency note (`MD-01`–`MD-12`) | Architecture |
| `RISK-018` | Row-level security interacts badly with connection pooling and either leaks or blocks | Medium | Critical | `SET LOCAL` per transaction, transaction pooling, tests with the app role (`OD-037`) | Security |
| `RISK-019` | Custom-field JSONB queries degrade performance or bypass typed validation | Medium | Medium | Declared, indexed fields only; no arbitrary JSONB paths; usage reporting | Data |
| `RISK-020` | Read-replica lag presents stale analytics as current | Medium | High | Freshness on every value; stale label; replica-lag alert | Analytics |
| `RISK-021` | Model artefacts or registry state are lost, or serving drifts from the approved version | Low | High | Content-addressed artefacts, immutable versions, pinned serving, restore drill | AI |
| `RISK-022` | Industry profiles grow into ad-hoc code or unmaintainable complexity | Medium | High | Schema limits, no executable config, profile review, custom path bounded (`ADR-029`, `ADR-030`) | Product |
| `RISK-023` | One tenant's job backlog starves other tenants | Medium | High | Per-tenant concurrency caps, fairness metrics, queue-age alerts | Architecture |
| `RISK-024` | Effective-configuration cache goes stale and shows the wrong module set or labels | Medium | Medium | Versioned snapshots, event invalidation, bounded TTL, degradation to universal core | Architecture |
| `RISK-025` | The future marketplace erodes the boundary and becomes an operational data path | Low | Critical | Separate credentials/schema, aggregates only, governance gate, `ADR-035` review | Product/Security |

---

## 6. Decisions recorded as closed

| ID | Decision | Date | Recorded in |
| --- | --- | --- | --- |
| — | Product name is **ONO**; "ClickIT" is retired | 2026-10-26 | `MASTER_PROJECT_SPECIFICATION.md` |
| — | No public marketing site inside this application | 2026-10-26 | `MASTER_PROJECT_SPECIFICATION.md` §6.2 |
| — | Stage 1 is documentation only; implementation requires explicit authorisation | 2026-10-26 | `PROJECT_STATUS.md` |
| — | TypeScript is the primary language; PostgreSQL is the proposed store | 2026-10-26 | `TECHNOLOGY_STACK_AND_GOVERNANCE.md` |
| — | `ADR-001` modular monolith is approved as the starting architecture | 2026-10-26 | `ARCHITECTURE_DECISION_RECORDS.md` |
| — | `ADR-016` single server-side, default-deny policy module is approved | 2026-10-26 | `ARCHITECTURE_DECISION_RECORDS.md` |
| — | `ADR-029` no executable tenant configuration is approved | 2026-10-26 | `ARCHITECTURE_DECISION_RECORDS.md` |
| — | `ADR-033` AI may never exceed the requesting actor's authority is approved | 2026-10-26 | `ARCHITECTURE_DECISION_RECORDS.md` |
| — | **Product/market decision:** ONO must support any business, including an industry not in the catalogue, through the universal core plus the custom-industry path | 2026-10-26 | `INDUSTRY_CONFIGURATION_ARCHITECTURE.md` |
| — | **Product/market decision:** a governed data marketplace may exist only as a future, separately approved programme that exposes aggregated insight, never identifiable tenant or personal records | 2026-10-26 | `DATA_ARCHITECTURE_PLAN.md` §18, `ADR-035` |

> These are recorded from the product owner's Stage 1 and Stage 2 instructions.
> The four ADR approvals approve a **principle**, not every mechanism chosen to
> implement it. No other ADR is approved. The two product/market decisions are
> not ADRs and do not authorise building a marketplace.

---

## 7. Decisions required before Stage 3

Stage 2 is documentation complete. The following decisions are required before
implementation work can start or continue past a phase gate. A decision may be
closed with a documented choice; "defer" is not closure for a blocking item.

### 7.1 Blocking a Stage 3 start

| Order | Decision | Blocks | Why it cannot wait |
| --- | --- | --- | --- |
| 1 | `OD-003` — authentication provider and session model | PH-05 | No acceptable custom-auth workaround; identity is the first dependency |
| 2 | `OD-010`, `OD-011` — test tooling, CI/CD and environments | PH-03 | Stage 3 starts by making change safe |
| 3 | `OD-002`, `OD-004` — database and ORM/SQL boundary | PH-08 | Schema and data access depend on it |
| 4 | `OD-001` — pilot market and industries | PH-04 | Design and acceptance depend on the pilot cohort |
| 5 | `OD-006`, `OD-031` — component system and v1 language | PH-04 | Design system cannot be finalised without them |

### 7.2 Required before the named phase

| Decision | Phase | Consequence if late |
| --- | --- | --- |
| `OD-005`, `OD-015` | PH-08 | Custom fields cannot be modelled or limited |
| `OD-037` | PH-08 | RLS and pooling decision affects schema and test design |
| `OD-016`, `OD-017` | PH-09 | Workflow variants and approval thresholds undefined |
| `OD-019`, `OD-024` | PH-05 | Permission exposure and session lifetime undefined |
| `OD-008`, `OD-009`, `OD-043` | PH-10 | Jobs, storage and file scanning undefined |
| `OD-012`, `OD-021`, `OD-023` | PH-10 | Observability, backup and retention undefined |
| `OD-039`, `OD-045`, `OD-046` | PH-09/10 | Replay, deprecation and idempotency windows undefined |
| `OD-044` | PH-18 | Export behaviour undefined |
| `OD-007`, `OD-026` | PH-19 | ML runtime and cross-tenant pooling undefined |
| `OD-042` | PH-20 | Model registry approach undefined |
| `OD-041` | PH-21 | Synchronous inference scope undefined |
| `OD-027`, `OD-028`, `OD-029` | PH-22 | Provider, measurement and AI opt-out undefined |
| `OD-013`, `OD-014`, `OD-020` | PH-24 | Catalogue curation and support access undefined |
| `OD-018`, `OD-022`, `OD-033`, `OD-034` | PH-05/26 | Legal scope, residency and sub-processors undefined (launch planning) |
| `OD-035` | PH-05 | Special-category data scope affects onboarding, data scopes and the workforce data model |
| `OD-038` | PH-24/25 | Broker threshold reviewed before scale assumptions harden |
| `OD-040` | PH-16 | Warehouse trigger reviewed before analytics scale decisions |

### 7.3 Roadmap adjustments still unresolved

`CF-06` remains open: the product owner has not approved or rejected
`REC-01`–`REC-05`. They adjust **sequencing and delivery**, not the Stage 2
architecture. They should be decided with the Stage 3 instruction.

### 7.4 Decisions that do not block Stage 3

`OD-025` (marketplace programme) is deferred by design; `OD-030` (dark mode),
`OD-032` (PDF fidelity) and `OD-036` (multi-currency) affect later phases but do
not prevent PH-03 or PH-05. `OD-035` (special-category data) is a PH-05 gate and
also constrains sensitive HR fields in PH-15.

## 8. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial open decisions, assumptions, conflicts and risks. |
| 1.1 | 2026-10-26 | Stage 2 extension: added `OD-037`–`OD-046`, `CF-11`–`CF-12`, `RISK-016`–`RISK-025`; recorded four approved ADRs and two product/market decisions; replaced the pre-Stage-2 decision list with pre-Stage-3 gates. All Stage 1 identifiers preserved. |
