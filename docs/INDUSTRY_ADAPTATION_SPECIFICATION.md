# ONO — Industry Adaptation Specification

| Field | Value |
| --- | --- |
| Document | Industry Adaptation Specification |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` |
| Requirements | `REQ-IND-001` … `REQ-IND-006`, `REQ-ORG-005` |

---

## 1. Principle: universal core, configurable edge

ONO serves **any** business, including one whose industry does not exist in the
catalogue. This is achieved by keeping industry-specific behaviour out of core
services and expressing it through four escalating mechanisms:

| Level | Mechanism | Who configures | Reversible | Requires review |
| --- | --- | --- | --- | --- |
| L1 | Industry profile (modules, terminology, metrics, defaults) | Tenant admin | Yes | No |
| L2 | Custom fields and field sets within validated types | Tenant admin | Yes | No |
| L3 | Workflow variant selection (approved variants only) | Tenant admin | Yes | No |
| L4 | Industry extension (new capability) | ONO engineering | Yes | Yes |

A tenant can always operate on the universal core alone. Configuration removes
irrelevant modules; it never removes safety, audit or tenancy controls.

## 2. Industry catalogue

### 2.1 Structure

```
Industry (level 1)
└── Sub-industry (level 2)
    └── Activity tags (level 3, free-form selection from suggestions)
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | stable slug | Never changes once published (`ind-retail`) |
| `name` | string | Display name |
| `parentId` | nullable | Sub-industry parent |
| `synonyms` | string[] | Search aliases ("oil & gas", "petroleum") |
| `description` | string | Plain-language scope |
| `defaultProfileId` | reference | Profile applied on selection |
| `status` | enum | `published`, `provisional`, `deprecated` |
| `version` | integer | Profile evolution |
| `source` | enum | `curated`, `custom-promoted` |

### 2.2 Initial catalogue (illustrative, not exhaustive)

| # | Industry | Example sub-industries | Initial test priority |
| --- | --- | --- | --- |
| 1 | Technology, software & IT services | SaaS, custom software, IT support, data services | P1 |
| 2 | Retail | Grocery, electronics, fashion, pharmacy retail | P1 |
| 3 | Wholesale & distribution | FMCG, industrial supplies, import distribution | P1 |
| 4 | Manufacturing | Food & beverage, metal fabrication, plastics, assembly | P1 |
| 5 | Agriculture, livestock & fisheries | Crop farming, livestock, dairy, fisheries, agro-processing | P1 |
| 6 | Healthcare & life sciences | Clinic, hospital, laboratory, pharmacy, diagnostics | P2 |
| 7 | Education & training | School, college, university, vocational training | P2 |
| 8 | Banking, finance & insurance | Microfinance, insurance brokerage, SACCO, investment | P2 |
| 9 | Construction, engineering & real estate | Civil works, building contracting, consultancy, property development | P1 |
| 10 | Transport, logistics & mobility | Freight, courier, fleet leasing, ride-hailing, clearing & forwarding | P1 |
| 11 | Petroleum, oil & gas | Fuel distribution, petroleum transport, depot operations, LPG | P1 |
| 12 | Renewable energy & utilities | Solar installation, mini-grid, water utility, waste management | P2 |
| 13 | Hospitality, tourism & food services | Hotel, restaurant, tour operator, catering | P2 |
| 14 | Professional & consulting services | Legal, accounting, engineering consultancy, marketing agency | P1 |
| 15 | Media, entertainment & communications | Publishing, production, advertising, events | P3 |
| 16 | Telecommunications | ISP, mobile virtual operator, infrastructure services | P3 |
| 17 | Mining & natural resources | Extraction, processing, exploration services | P3 |
| 18 | Government, nonprofit & public services | Local government, NGO, association, education programme | P3 |
| 19 | Automotive & equipment services | Vehicle dealership, workshop, spare parts, equipment rental | P2 |
| 20 | Property management | Residential letting, commercial property, facilities management | P2 |
| 21 | Import, export & international trade | Trading house, export agent, customs brokerage | P2 |
| 22 | Other — not listed | Tenant-defined | Always available |

Priority indicates **testing and profile-quality focus**, not eligibility. Any
business may onboard on day one using the `Other` path.

## 3. Onboarding flow (REQ-ORG-001, REQ-IND-002)

| Step | Screen | Required input | Behaviour |
| --- | --- | --- | --- |
| 1 | Organisation identity | Legal/trading name, country, currency, timezone | Pre-fills locale defaults; editable later |
| 2 | Industry search | Search box over catalogue with synonyms | Results ranked; "Other — my industry is not listed" always visible |
| 3 | Industry selection | One or more industries; optional sub-industries | Multi-select allowed; each selection can be marked primary or secondary |
| 4 | Business activities | Describe products/services; activity tags | Free text plus suggestions; used for module recommendations |
| 5 | Configuration preview | Suggested modules, terminology, metrics, roles | Every suggestion individually toggleable; nothing hidden |
| 6 | Structure | Branches, departments (optional) | Can be skipped and completed later |
| 7 | Administrator account | Owner name, email, password or SSO | Creates the first tenant administrator |
| 8 | Review & finish | Summary of applied configuration | Explicit confirmation before provisioning |

### 3.1 Flow rules

| ID | Rule |
| --- | --- |
| IND-FLOW-1 | Search must return results for synonyms, misspellings (fuzzy) and local terminology. |
| IND-FLOW-2 | "Other" is never disabled, hidden or deprioritised. |
| IND-FLOW-3 | Selecting an industry must never silently enable a module the user cannot see. |
| IND-FLOW-4 | Every suggested setting shows its reason ("commonly used in construction"). |
| IND-FLOW-5 | Onboarding is resumable; no partial provisioning leaves a half-configured tenant. |
| IND-FLOW-6 | Provisioning is transactional: tenant, owner, roles, profile and defaults are created together or not at all. |
| IND-FLOW-7 | Onboarding must be completable in under ten minutes for a small business. |

### 3.2 Multi-industry businesses (REQ-ORG-005)

- A tenant may hold several industries (for example: fuel distribution +
  transport + property letting).
- One industry is marked **primary** and drives default terminology.
- Module sets are the **union** of selected profiles, minus explicit opt-outs.
- Metric conflicts (same name, different formula) are resolved by explicit
  tenant choice, recorded in the metric registry.
- The configuration preview highlights conflicts before completion.

## 4. Custom industry path (REQ-IND-003)

| Stage | Actor | Output |
| --- | --- | --- |
| 1. Capture | Tenant admin | Custom industry name, description, activities, products/services, size, country |
| 2. Provisional profile | System | Universal core + modules inferred from described activities, marked `provisional` |
| 3. Operate | Tenant | Full platform available immediately on the universal core |
| 4. Review queue | ONO product/industry team | Candidate record with usage signals and gaps |
| 5. Curation | ONO team | Promote to `published` catalogue entry with a curated profile, or keep provisional |
| 6. Migration | System | Tenants on the provisional profile are offered the curated profile; never forced |

### 4.1 Rules

| ID | Rule |
| --- | --- |
| IND-CUSTOM-1 | A custom industry must never block onboarding or module access. |
| IND-CUSTOM-2 | A custom industry is tenant-private by default; it never appears in another tenant's catalogue. |
| IND-CUSTOM-3 | Promotion to the shared catalogue requires a human review decision. |
| IND-CUSTOM-4 | AI may draft a provisional profile but may not invent regulatory obligations, tax rules or statutory processes. |
| IND-CUSTOM-5 | The tenant is notified and can decline when a curated profile would change its configuration. |
| IND-CUSTOM-6 | Custom industry names are moderated for abuse before being offered as suggestions to others. |

## 5. Industry profile structure (REQ-IND-004)

A profile is declarative data, versioned, diffable and reviewable. It contains no
executable tenant-supplied code.

| Section | Contents | Example |
| --- | --- | --- |
| `modules` | Enabled module IDs, default on/off, optional add-ons | Construction: `projects`, `procurement`, `inventory`; `marketing` off |
| `terminology` | Label overrides | `Project` → `Site`, `Customer` → `Client` |
| `metrics` | Default metric set and profile-specific parameter values | `MET-PROJECT-MARGIN` enabled; utilisation threshold 75% |
| `workflows` | Selected approved variants | Procurement requires two approvals above threshold |
| `roles` | Recommended role templates | `Site Supervisor`, `Quantity Surveyor` |
| `fields` | Recommended custom field sets | `Site permit number`, `Retention percentage` |
| `documents` | Document types and required metadata | `Site instruction`, `Completion certificate` |
| `numbering` | Record numbering patterns | `INV-{branch}-{sequence}` |
| `compliance` | Jurisdiction notes requiring human review | "VAT treatment must be confirmed by the tenant's advisor" |
| `disclaimers` | Shown contextually | "ONO does not provide statutory tax advice." |

### 5.1 Profile rules

| ID | Rule |
| --- | --- |
| IND-PROFILE-1 | Profiles are additive and reversible; applying one never deletes tenant records. |
| IND-PROFILE-2 | Terminology overrides affect display only, never stored data or API field names. |
| IND-PROFILE-3 | A profile cannot enable a module the tenant's plan does not entitle. |
| IND-PROFILE-4 | Profile changes are versioned and audited; tenants can see what changed. |
| IND-PROFILE-5 | Metric formulas are never overridable by a profile — only selection and parameters. |

## 6. Configuration boundaries

### 6.1 Tenants may configure

| Area | Boundary |
| --- | --- |
| Module enablement | Within plan entitlements |
| Terminology | Labels only, per locale |
| Custom fields | Approved types: text, number, date, boolean, select, multi-select, user reference, file reference |
| Workflow variants | Choose from approved variants for that record type |
| Approval thresholds | Within tenant policy, bounded by platform maximums for sensitive actions |
| Metrics | Select, set parameters, set targets — not rewrite formulas |
| Notifications | Channels, recipients, timing |
| Branding | Logo, accent colour within contrast rules |
| Document types | Add types; cannot remove statutory types |

### 6.2 Tenants may not configure

| Area | Reason |
| --- | --- |
| Tenant isolation logic | Security invariant |
| Permission evaluation | Security invariant |
| Audit event emission | Compliance invariant |
| Financial posting immutability | Integrity invariant |
| AI evidence requirements | Product integrity invariant |
| Metric formula bodies | Cross-tenant comparability |
| Arbitrary scripts or code | Security and maintainability |
| Retention below legal/contractual minimum | Compliance |

## 7. Extension framework (REQ-IND-006)

An extension is required when configuration cannot express a genuine industry
need (for example, petroleum transport trip profitability with depot-specific
cost allocation).

| Stage | Requirement |
| --- | --- |
| Proposal | Written need, affected tenants, alternative configurations considered |
| Design | Bounded module inside the relevant feature; no core forking |
| Contract | Explicit interfaces: data, service, permission, metric, audit |
| Review | Architecture + security review; ADR recorded |
| Delivery | Feature-flagged; enabled per tenant or per industry profile |
| Verification | Industry acceptance scenario executed end to end |
| Maintenance | Owner assigned; deprecation path documented |

Extension rules:

| ID | Rule |
| --- | --- |
| IND-EXT-1 | Extensions live inside their domain feature, never in `src/lib` or core services. |
| IND-EXT-2 | An extension declares its permissions, metrics and audit events explicitly. |
| IND-EXT-3 | Extensions are off by default; enabling is audited. |
| IND-EXT-4 | No extension may bypass tenant scoping or authorisation. |
| IND-EXT-5 | If two industries need the same capability, it is promoted to core rather than duplicated. |

## 8. Industry-specific workflow support

The following table maps example industry processes to shared capabilities plus
the extension that specialises them. Detailed flows are in
`BUSINESS_WORKFLOW_CATALOG.md`.

| Industry | Process | Shared capability | Specialisation |
| --- | --- | --- | --- |
| Logistics | Dispatch and delivery | Projects/tasks, orders, documents | Route and trip entities, delivery proof, trip costing (`WF-IND-01`) |
| Petroleum transport | Transport orders and fuel delivery | Orders, inventory, finance | Depot loading, tank reconciliation, trip profitability (`WF-IND-02`) |
| Retail | Sales, stock, pricing | Sales, inventory | Promotions, shelf-level pricing, shrinkage (`WF-IND-03`) |
| Manufacturing | Production and quality | Inventory, procurement, projects | Bills of materials, production orders, QC checks (`WF-IND-04`) |
| Construction | Site delivery and progress | Projects, procurement, finance | Variations, retention, site instructions (`WF-IND-05`) |
| Professional services | Engagements and utilisation | Projects, workforce, sales | Time and materials, realisation rate (`WF-IND-06`) |
| Agriculture | Production cycles and yield | Inventory, projects, finance | Season/plot records, input usage, harvest yield (`WF-IND-07`) |
| Healthcare | Appointments and protected data | Documents, support | Appointment scheduling, heightened sensitivity (`WF-IND-08`) |
| Education | Enrolment and attendance | CRM, documents | Cohorts, terms, attendance registers (`WF-IND-09`) |
| Property management | Lettings and facilities | Projects, finance, support | Units, leases, maintenance requests (`WF-IND-10`) |

## 9. Release strategy for industry coverage

| Release | Coverage | Rationale |
| --- | --- | --- |
| v1 (PH-01 → PH-26) | Universal core + curated profiles for P1 industries + custom industry path | Proves universality without unbounded scope |
| v1.x | P2 profiles, deeper extensions | Demand-driven |
| v2 | P3 profiles, marketplace readiness | Requires maturity and legal review |

Do not attempt complete functional coverage of every industry before v1. The
universality claim is satisfied by the **core plus custom path**, not by shipping
every industry's specialised features.

## 10. Validation of industry adaptation

| Test | Pass condition |
| --- | --- |
| Unknown industry onboarding | A business with a non-existent industry completes setup in under 10 minutes |
| Multi-industry conflict | Two profiles with conflicting metric parameters produce an explicit choice, not silent override |
| Terminology safety | Changing labels does not change stored values, API contracts or reports |
| Plan boundary | A profile cannot enable an unentitled module |
| Reversibility | Disabling a module preserves data and can be re-enabled |
| No-code safety | No tenant-provided code executes in any tier |

## 11. Entities introduced

`ENT-Industry`, `ENT-IndustryProfile`, `ENT-ProfileVersion`, `ENT-TenantIndustry`,
`ENT-CustomIndustryRequest`, `ENT-CustomField`, `ENT-FieldSet`,
`ENT-WorkflowVariant`, `ENT-Extension`, `ENT-TerminologyOverride`.

## 12. Open decisions

| ID | Question |
| --- | --- |
| `OD-013` | Who curates and approves the industry catalogue, and at what cadence? |
| `OD-014` | Are custom industry names visible across tenants before promotion? (Current baseline: no.) |
| `OD-015` | Maximum number of custom fields per entity and per tenant? |
| `OD-016` | Are workflow variants tenant-authored within a DSL, or fixed by profile? (Current baseline: fixed variants.) |

## 13. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial industry adaptation baseline. |
