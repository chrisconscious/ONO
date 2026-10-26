# ONO — Open Decisions and Assumptions

| Field | Value |
| --- | --- |
| Document | Open Decisions and Assumptions |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — every item below needs a human decision or confirmation |
| Rule | Documentation does not wait for every answer; blocking items are marked. |

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
| `CF-10` | "No implementation" instruction vs an existing scaffold in the repo | **Recorded:** scaffold predates Stage 1 authorisation and is documented as such in `PROJECT_STATUS.md` |

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

---

## 6. Decisions recorded as closed

| ID | Decision | Date | Recorded in |
| --- | --- | --- | --- |
| — | Product name is **ONO**; "ClickIT" is retired | 2026-10-26 | `MASTER_PROJECT_SPECIFICATION.md` |
| — | No public marketing site inside this application | 2026-10-26 | `MASTER_PROJECT_SPECIFICATION.md` §6.2 |
| — | Stage 1 is documentation only; implementation requires explicit authorisation | 2026-10-26 | `PROJECT_STATUS.md` |
| — | TypeScript is the primary language; PostgreSQL is the proposed store | 2026-10-26 | `TECHNOLOGY_STACK_AND_GOVERNANCE.md` |

> These are recorded from the product owner's Stage 1 instruction. They are not
> technical ADR approvals.

---

## 7. Decisions the product owner must make before Stage 2

Ordered by blocking impact:

1. `OD-003` — authentication provider (blocks PH-05).
2. `OD-002`, `OD-004` — database and ORM confirmation (blocks PH-08).
3. `OD-022`, `OD-018`, `OD-033`, `OD-034` — jurisdiction, residency and legal roles (blocks launch planning).
4. `OD-001` — pilot market and industries (shapes PH-04 design work).
5. `OD-006`, `OD-010`, `OD-011` — component and pipeline choices (blocks PH-03/04).
6. REC-01…REC-05 — roadmap adjustments (blocks phase planning).

## 8. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial open decisions, assumptions, conflicts and risks. |
