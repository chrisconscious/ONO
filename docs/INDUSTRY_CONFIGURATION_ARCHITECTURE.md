# ONO — Industry Configuration Architecture

| Field | Value |
| --- | --- |
| Document | Industry Configuration Architecture |
| Stage | 2 — Architecture and technical contracts |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — configuration design only. No catalogue, profile or custom field exists |
| Scope | Industry catalogue, profile schema, resolution order, custom industries, custom fields, workflow variants, extension framework |
| Related | `ADR-007`, `ADR-029`, `ADR-030`, `INDUSTRY_ADAPTATION_SPECIFICATION.md`, `MODULE_DEPENDENCY_MAP.md`, `DATA_ARCHITECTURE_PLAN.md` |

---

## 1. The universality claim, stated precisely

ONO claims to serve **any** business, including one whose industry is not in the
catalogue. That claim is satisfied by three things, not by shipping every
industry's features:

1. a **universal core** that works for any organisation;
2. a **declarative profile system** that adapts labels, modules, metrics and
   defaults without changing code;
3. an **explicit extension path** for genuine capability gaps, owned by
   engineering.

What the claim does **not** mean:

- ONO will not contain a bespoke feature for every trade at launch.
- ONO will not generate statutory tax, payroll or regulatory logic from a
  description.
- ONO will not execute tenant-supplied code, formulas or scripts.

`ADR-029` is approved: **no executable tenant configuration.** `ADR-030` is
proposed: profiles are declarative, versioned and schema-validated.

---

## 2. Configuration layers

| Level | Mechanism | Configured by | Data or code | Reversible | Review |
| --- | --- | --- | --- | --- | --- |
| L0 | Universal core | ONO engineering | Code | n/a | Normal engineering |
| L1 | Industry profile | ONO curation; tenant selection | Data | Yes | Profile review |
| L2 | Tenant overrides (modules, terminology, thresholds) | Tenant admin | Data | Yes | Policy bounds |
| L3 | Custom fields and field sets | Tenant admin | Data | Yes | Schema validation |
| L4 | Extension (new capability) | ONO engineering | Code | Feature-flagged | Architecture + security review |

A tenant can always operate on L0 alone. Configuration **removes** irrelevant
surface; it never removes safety, audit, tenancy or authorization.

---

## 3. Industry catalogue architecture

### 3.1 Catalogue structure

```
Industry (level 1)
└── Sub-industry (level 2)
    └── Activity tags (level 3, suggested vocabulary)
```

| Field | Type | Rule |
| --- | --- | --- |
| `id` | stable slug | Never changes after publication (`ind-construction`) |
| `name` | string | Display name; localisable later |
| `parentId` | nullable reference | Sub-industry parent |
| `synonyms` | string[] | Search aliases, including local terms |
| `description` | string | Plain-language scope |
| `defaultProfileId` | reference | Profile applied on selection |
| `status` | enum | `published`, `provisional`, `deprecated` |
| `version` | integer | Increments on profile or metadata change |
| `source` | enum | `curated`, `custom-promoted` |

### 3.2 Catalogue ownership

| Concern | Rule |
| --- | --- |
| Curated entries | Platform-owned; published by the industry curator (`OD-013`) |
| Provisional entries | Tenant-private; created during custom onboarding |
| Promotion | A provisional entry becomes curated only after human review (`IND-CUSTOM-3`) |
| Deprecation | A deprecated industry remains readable; existing tenants keep their profile until they choose to migrate |
| Visibility | A tenant sees curated entries plus its own provisional entries; never another tenant's (`IND-CUSTOM-2`) |
| Search | Synonym, fuzzy and local-term matching (`IND-FLOW-1`) |
| "Other" | Always available, never disabled or hidden (`IND-FLOW-2`) |

### 3.3 Illustrative coverage

The Stage 1 catalogue of 22 industry groups remains the reference
(`INDUSTRY_ADAPTATION_SPECIFICATION.md` §2.2). Priority indicates profile quality
and testing focus, not eligibility.

---

## 4. Profile schema

A profile is a **declarative document**. It contains no functions, expressions,
scripts, templates with executable logic, SQL or code of any kind.

### 4.1 Shape

```json
{
  "profileId": "profile-construction",
  "schemaVersion": 1,
  "industryId": "ind-construction",
  "version": 4,
  "status": "published",
  "name": "Construction and engineering",
  "effectiveFrom": "2026-10-01",
  "modules": {
    "enabled": ["projects", "procurement", "inventory", "finance", "documents"],
    "disabled": ["marketing"],
    "optional": ["workforce", "support"]
  },
  "terminology": {
    "project": "Site",
    "customer": "Client",
    "task": "Work item"
  },
  "metrics": {
    "selected": [
      { "code": "MET-PROJECT-MARGIN", "target": "18" },
      { "code": "MET-UTILISATION", "params": { "threshold": "75" } }
    ]
  },
  "workflows": {
    "procurement.purchase_order": "two-tier-approval",
    "finance.expense": "single-approval"
  },
  "roles": [
    { "templateCode": "ROLE-PROJECT-MANAGER", "displayName": "Site manager" },
    { "templateCode": "ROLE-OPERATIONS-MANAGER", "displayName": "Contracts manager" }
  ],
  "fields": [
    {
      "entity": "project",
      "key": "cf_permit_number",
      "type": "text",
      "label": "Permit number",
      "required": false,
      "indexed": true,
      "classification": "internal"
    }
  ],
  "documents": [
    { "type": "site_instruction", "requiredMetadata": ["issuedBy", "issuedAt"] }
  ],
  "numbering": {
    "invoice": "INV-{branch}-{sequence}",
    "purchaseOrder": "PO-{year}-{sequence}"
  },
  "compliance": [
    {
      "note": "Withholding tax treatment must be confirmed by the tenant's advisor.",
      "requiresReview": true
    }
  ],
  "disclaimers": [
    "ONO does not provide statutory tax or legal advice."
  ]
}
```

### 4.2 Schema rules

| ID | Rule |
| --- | --- |
| ICA-01 | The profile is validated by the same Zod contract mechanism used elsewhere (`ADR-019`); no second validation library. |
| ICA-02 | Unknown keys are rejected, not ignored. |
| ICA-03 | Every referenced module, metric, role template, field type and workflow variant must exist and be published. |
| ICA-04 | A profile cannot reference a permission, role or module that is not platform-defined. |
| ICA-05 | `terminology` values are display strings only; they may not contain HTML, script or interpolation. |
| ICA-06 | `metrics` may select and parameterise; it may never define a formula (`IND-PROFILE-5`). |
| ICA-07 | `workflows` values are codes from an approved variant registry (`OD-016`). |
| ICA-08 | `fields` conform to the custom-field type system (§7). |
| ICA-09 | `numbering` uses a fixed token grammar; unknown tokens are rejected. |
| ICA-10 | `compliance` notes are advisory text requiring human review; they are never auto-applied as legal rules. |
| ICA-11 | A published profile version is immutable. A change is a new version. |
| ICA-12 | A profile cannot grant permission, disable audit, change tenancy or alter security controls. |

### 4.3 What a profile may never contain

| Prohibited | Reason |
| --- | --- |
| JavaScript, SQL, formulas, expressions | Executable tenant configuration (`ADR-029`) |
| Permission grants | Authorization is platform-defined |
| Audit or retention overrides | Compliance invariant |
| Tax or payroll calculation rules | Liability; requires jurisdiction-specific engines not in v1 |
| Secrets, API keys or endpoints | Credential handling |
| Free-text HTML | Injection and accessibility |
| References to tenant records | Profiles are reusable, tenant-neutral data |

---

## 5. Effective configuration resolution

Runtime never reads a raw profile and interprets it piecemeal. It reads one
**effective configuration snapshot** per tenant and version.

### 5.1 Precedence

Lowest to highest:

| # | Layer | Examples | Can be overridden? |
| --- | --- | --- | --- |
| 1 | Platform invariants | Tenant isolation, audit, permission evaluation | **Never** |
| 2 | Plan entitlements | Which modules the plan allows | No, only raised by plan change |
| 3 | Industry profiles (union) | Modules, terminology defaults, metric selection, fields | Yes, by tenant overrides within bounds |
| 4 | Tenant configuration | Module opt-outs, label changes, thresholds, custom fields | Yes, by a later tenant change |
| 5 | User display preferences | Locale, density, default landing page | Yes, by the user; display only |

### 5.2 Resolution steps

```
1  Load tenant state (active, plan, industry selections)
2  Load plan entitlements
3  Load selected profile versions (primary + secondary)
4  Compute the module set: union of profile modules ∩ entitlements − tenant opt-outs
5  Merge terminology: primary industry first, then secondary, then tenant overrides
6  Merge metrics by code; conflict on parameters requires explicit tenant choice
7  Merge workflow variants; conflict defaults to the stricter variant
8  Merge custom fields by key; type conflict is an apply-time error
9  Apply tenant numbering and document types
10 Validate the result against the profile and platform schemas
11 Persist an immutable snapshot with a version and content hash
12 Publish `industry.config.applied` for cache invalidation
```

### 5.3 Resolution rules

| ID | Rule |
| --- | --- |
| ICA-13 | The union of multiple profiles never exceeds plan entitlements (`IND-PROFILE-3`). |
| ICA-14 | A tenant opt-out disables a module but preserves its data (`IND-PROFILE-1`). |
| ICA-15 | Terminology conflicts are resolved by primary industry, then tenant override. |
| ICA-16 | Metric parameter conflicts require an explicit tenant choice; the system never silently picks (`IND-CUSTOM`/multi-industry rule). |
| ICA-17 | Workflow conflicts default to the **stricter** variant (more approvals), and the tenant is told. |
| ICA-18 | Custom field conflicts with different types block the apply and name the conflicting profiles. |
| ICA-19 | The effective snapshot is immutable; any change creates a new version. |
| ICA-20 | Runtime reads the snapshot, never re-resolves profile JSON per request. |
| ICA-21 | A missing snapshot falls back to the universal core with no custom fields, and raises a degradation signal. |
| ICA-22 | The snapshot records the profile versions, tenant overrides and resolution algorithm version used. |

### 5.4 Snapshot content

```
EffectiveConfig {
  tenantId
  version
  contentHash
  resolvedAt
  profileVersions[]        // profileId + version
  planId
  modules { enabled[], disabled[], addOns[] }
  terminology { key: label }
  metrics { code: { params, target } }
  workflows { recordType: variantCode }
  fields[]                 // validated definitions
  documents[]
  numbering { entity: pattern }
  disclaimers[]
  degraded: boolean
}
```

---

## 6. Module enablement and entitlements

| Rule | Detail |
| --- | --- |
| Entitlement is a ceiling | A profile or tenant cannot enable an unentitled module |
| Core modules | Identity, tenancy, audit and authorization are always on |
| Optional modules | CRM, marketing, inventory, procurement, projects, workforce, support, strategy |
| Industry add-ons | Specialised extensions, feature-flagged and entitled separately |
| Disable behaviour | UI hides the module; API returns not-found; jobs stop; data is retained |
| Re-enable | Data and configuration are restored; no re-import required |
| Dependency rule | Enabling a module does not create a new code dependency (`MD-11`) |
| Plan downgrade | Modules above the new ceiling are disabled, never deleted; export window is offered |
| Audit | Every enable/disable is audited with actor and reason |

---

## 7. Custom fields

Custom fields cover L3 needs without schema changes per tenant.

### 7.1 Type system

| Type | Storage | Validation | Indexable |
| --- | --- | --- | --- |
| `text` | string | Max length, optional pattern (non-executable) | Yes |
| `number` | decimal string | Scale and range | Yes |
| `date` | ISO date | Valid calendar date | Yes |
| `boolean` | boolean | True/false | Yes |
| `select` | string | One of declared options | Yes |
| `multi-select` | string[] | Subset of declared options | Limited |
| `user-reference` | user ID | Active membership in the same tenant | Yes |
| `file-reference` | document ID | Document in the same tenant and scope | No |

### 7.2 Storage rules

| Rule | Detail |
| --- | --- |
| Storage | Validated JSONB on the owning entity (`ADR-007`) |
| Key naming | `cf_` prefix, stable, lower snake case |
| Definition registry | Field definitions are tenant-scoped rows with type, label, options, required, classification, index flag |
| Validation | Server-side on write; unknown keys rejected |
| Indexing | Only declared and explicitly indexed fields; no generic GIN on every payload |
| Querying | Equality/range on indexed declared fields only; no arbitrary JSONB paths |
| Limits | Proposed 20 per entity, 100 per tenant (`OD-015`) |
| Classification | Each field declares a class; inheritance follows `CL-02` |
| Deletion | Soft-delete the definition; values are retained or purged per policy |
| Type change | Not in place; create a new field and migrate with a recorded backfill |
| Reporting | A declared field may be exposed to BI only after an explicit metric or report binding |

### 7.3 Why not EAV or typed side tables

| Option | Verdict | Reason |
| --- | --- | --- |
| JSONB with validation | **Proposed** | One schema, typed at the boundary, efficient for sparse fields |
| EAV | Rejected | Query complexity, weak typing, reporting pain |
| Typed side tables per field | Rejected | Schema explosion; migration cost per tenant |
| Arbitrary document store | Rejected | Loses relational integrity for the core record |

---

## 8. Workflow variants

| Rule | Detail |
| --- | --- |
| Registry | Platform-owned, versioned, reviewed variants per record type |
| Selection | Profile default, tenant override within approved set |
| Content | States, transitions, approver roles, thresholds, escalation, timeout |
| No DSL | v1 uses fixed variants (`OD-016`); no tenant-authored logic |
| Invariants | A variant cannot remove audit, SoD, tenant scope or approval record-keeping |
| Conflict | The stricter variant wins by default; the tenant is informed |
| Versioning | A variant change is a new version; in-flight records keep their version |
| Migration | A tenant may adopt a newer variant; existing records are not retroactively re-routed |
| Extension | A genuinely new workflow is an L4 extension, not a configuration |

### 8.1 Example variant set

| Record type | Variants | Notes |
| --- | --- | --- |
| Purchase order | `single-approval`, `two-tier-approval`, `threshold-approval` | Thresholds are tenant parameters within platform maximums |
| Quotation discount | `manager-approval`, `manager-then-finance` | Bound to discount bands |
| Expense | `single-approval`, `manager-then-finance` | Receipt requirement configurable |
| Stock adjustment | `supervisor-approval`, `manager-approval` | Above tenant threshold |
| Invoice write-off | `finance-manager` | No variant may auto-approve |
| Recommendation execution | `owner-approval`, `owner-then-approver` | Per action class |

---

## 9. Metrics and performance configuration

| Allowed | Prohibited |
| --- | --- |
| Select metrics from the registry | Define or edit a formula |
| Set parameters (thresholds, targets, windows) declared by the metric | Change the calculation source or grain |
| Choose display units within the metric's unit family | Invent a metric code |
| Set targets and review cadence | Suppress audit or freshness metadata |

A profile can enable `MET-PROJECT-MARGIN` and set a target of 18%. It cannot
change how gross margin is calculated. This preserves cross-tenant comparability
and metric trust (`IND-PROFILE-5`).

---

## 10. Numbering and terminology

### 10.1 Numbering

| Rule | Detail |
| --- | --- |
| Pattern grammar | Literal text plus allow-listed tokens: `{branch}`, `{year}`, `{month}`, `{sequence}` |
| Uniqueness | Enforced per tenant and entity, not globally |
| Sequence | Per tenant/entity/branch scope; gaps are acceptable, reuse is not |
| Change | Applies to new records; existing numbers never change |
| Validation | Pattern length, token allow-list, collision check |
| Financial records | Numbering is immutable after posting |

### 10.2 Terminology

| Rule | Detail |
| --- | --- |
| Display only | Labels never change stored values, API fields, metric codes or audit payloads (`IND-PROFILE-2`) |
| Scope | Per tenant and locale |
| Fallback | Tenant override → primary industry → secondary industry → universal English label |
| Length | Bounded; UI must handle truncation |
| Injection | Plain text only; escaped on render |
| Search | Search indexes canonical values, not labels |
| Export | Column headers may use labels; underlying field names remain canonical |

---

## 11. Custom industry architecture

### 11.1 Path

| Stage | Actor | Architectural output |
| --- | --- | --- |
| 1. Capture | Tenant admin | Name, description, activities, products/services, size, country |
| 2. Provisional profile | System (rules-based) | Universal core + modules inferred from declared activities, marked `provisional` |
| 3. Operate | Tenant | Full platform on the universal core immediately |
| 4. Review queue | ONO product/industry team | Candidate record with usage signals and gaps |
| 5. Curation | ONO team | Promote to `published` with a curated profile, or keep provisional |
| 6. Migration | System | Tenants on the provisional profile are **offered** the curated profile; never forced |

### 11.2 Rules

| ID | Rule |
| --- | --- |
| ICA-23 | A custom industry never blocks onboarding or module access (`IND-CUSTOM-1`). |
| ICA-24 | A custom industry is tenant-private until promotion (`IND-CUSTOM-2`, `OD-014`). |
| ICA-25 | Provisional profile generation is deterministic and rules-based; the same inputs produce the same proposal. |
| ICA-26 | AI may draft descriptive text but may not invent regulatory obligations, tax rules or statutory processes (`IND-CUSTOM-4`). |
| ICA-27 | Promotion requires a human review decision with a named reviewer (`IND-CUSTOM-3`). |
| ICA-28 | A tenant is notified and may decline a curated profile that would change its configuration (`IND-CUSTOM-5`). |
| ICA-29 | Custom industry names are moderated before being offered as suggestions (`IND-CUSTOM-6`). |
| ICA-30 | A provisional profile cannot enable an unentitled module. |

### 11.3 Provisional profile generation

Inference is limited to **module availability and defaults**:

| Input signal | May influence | May not influence |
| --- | --- | --- |
| Described activities | Suggested modules, activity tags | Legal or tax rules |
| Products/services text | Suggested terminology, document types | Permission grants |
| Country | Locale and currency defaults | Statutory compliance claims |
| Size | Suggested role set, approval defaults | Security controls |

The proposal is shown as suggestions, each individually toggleable, with a reason
("commonly used in logistics"). Nothing is hidden (`IND-FLOW-3`, `IND-FLOW-4`).

---

## 12. Multi-industry businesses

| Rule | Detail |
| --- | --- |
| Multiple selections | A tenant may hold several industries |
| Primary industry | Exactly one; drives default terminology and conflict resolution |
| Module set | Union of selected profiles, minus explicit opt-outs, clipped by entitlements |
| Metric conflicts | Same code with different parameters requires an explicit tenant choice |
| Field conflicts | Same key with different types blocks apply; same type merges |
| Workflow conflicts | Stricter variant wins by default, with notice |
| Preview | Conflicts are shown before onboarding completes |
| Change | Adding or removing an industry re-resolves the snapshot; data is preserved |

---

## 13. Extension framework

An extension is required only when configuration cannot express a genuine
industry need (for example, petroleum trip profitability with depot-specific cost
allocation).

| Stage | Requirement |
| --- | --- |
| Proposal | Written need, affected tenants, alternatives considered |
| Design | Bounded module inside the owning feature; no core fork |
| Contract | Explicit data, service, permission, metric and audit interfaces |
| Review | Architecture and security review; ADR recorded |
| Delivery | Feature-flagged; enabled per tenant or profile |
| Verification | Industry acceptance scenario executed end to end |
| Maintenance | Named owner; deprecation path |

| ID | Rule |
| --- | --- |
| ICA-31 | An extension lives inside its domain feature, never in `src/lib` or core services (`IND-EXT-1`). |
| ICA-32 | It declares permissions, metrics and audit events explicitly (`IND-EXT-2`). |
| ICA-33 | It is off by default; enabling is audited (`IND-EXT-3`). |
| ICA-34 | It cannot bypass tenant scoping or authorization (`IND-EXT-4`). |
| ICA-35 | If two industries need the same capability, it is promoted to core rather than duplicated (`IND-EXT-5`). |
| ICA-36 | An extension may not add a new cross-module dependency edge without updating `MODULE_DEPENDENCY_MAP.md`. |
| ICA-37 | An extension cannot change the profile schema or execute tenant data as code. |

---

## 14. Configuration lifecycle

| State | Entry | Editable | Visible to tenant |
| --- | --- | --- | --- |
| `draft` | Author creates | Yes | No |
| `review` | Submitted | No; comments only | No |
| `published` | Approved | No; new version required | Yes |
| `deprecated` | Superseded | No | Readable; migration offered |
| `withdrawn` | Author or reviewer | No | No new selection; existing tenants keep current snapshot |

### 14.1 Tenant configuration changes

| Step | Behaviour |
| --- | --- |
| 1. Propose | Tenant admin edits modules, labels, thresholds, fields |
| 2. Validate | Schema, entitlement, limits, conflicts, security invariants |
| 3. Preview | Show the diff and affected records/modules |
| 4. Apply | Create a new effective snapshot atomically |
| 5. Audit | Record actor, before/after summary and snapshot version |
| 6. Invalidate | Publish `industry.config.applied`; caches refresh |
| 7. Rollback | Restore a previous snapshot; data is never rolled back |

**Data is never deleted by a configuration change.** Disabling a module hides it;
it does not purge it.

---

## 15. Caching and invalidation

| Concern | Rule |
| --- | --- |
| Cache unit | Effective snapshot per tenant, keyed by version and hash |
| Read path | Runtime reads the snapshot; no per-request JSON interpretation |
| Invalidation | `industry.config.applied`, plan change, tenant suspension |
| TTL | Bounded; version check prevents stale reads |
| Missing cache | Load from database; if unavailable, universal core + degradation signal (ICA-21) |
| Cross-tenant reuse | Prohibited |
| Profile cache | Immutable by version; safe to cache globally |
| UI | Labels and module availability are server-provided, not hard-coded |

---

## 16. Security boundaries

| Threat | Control |
| --- | --- |
| Executable configuration | Schema allow-list; no expressions, scripts, SQL (`ADR-029`) |
| Privilege escalation via profile | Profiles cannot grant permissions or enable unentitled modules |
| Injection via labels | Plain text, escaped, length-bounded |
| Cross-tenant profile leakage | Provisional profiles are tenant-private |
| Malicious custom field values | Type validation, length limits, output escaping |
| Audit suppression | Profiles cannot disable audit or retention |
| Regulatory overreach | Compliance notes require human review; no auto-applied legal rules |
| Denial of service via configuration | Field and profile size limits; validation before write |
| Conflicting profiles | Explicit conflict handling, no silent override |

---

## 17. Validation

| Test | Pass condition |
| --- | --- |
| Unknown industry onboarding | Non-existent industry completes setup in under 10 minutes |
| Profile schema rejection | Executable or unknown keys are rejected |
| Entitlement ceiling | A profile cannot enable an unentitled module |
| Terminology safety | Labels do not change stored values or API contracts |
| Multi-industry conflict | Conflicting metric parameters require an explicit choice |
| Field type conflict | Apply is blocked and the conflict is named |
| Reversibility | Disabling and re-enabling a module preserves data |
| No-code test | No tenant-supplied string is evaluated as code |
| Snapshot determinism | The same inputs produce the same effective configuration |
| Rollback | A previous snapshot restores behaviour without data loss |
| Custom industry privacy | A provisional industry is invisible to other tenants |
| Extension isolation | An extension cannot write outside its module or bypass policy |

---

## 18. Phase mapping

| Phase | Configuration work |
| --- | --- |
| PH-02 | This architecture accepted; profile schema and resolution order reviewed |
| PH-04 | Onboarding and configuration screens designed |
| PH-05 | Industry catalogue, profile storage, effective config, custom fields foundation |
| PH-08 | Profile/custom-field schema, JSONB validation, indexes |
| PH-09 | Workflow variant registry and approval integration |
| PH-10 | Config change events, cache invalidation |
| PH-11–15 | Modules consume effective config; no module-specific profile parsing |
| PH-16–18 | Metric selection and parameters |
| PH-24 | Catalogue curation, custom industry review, extension enablement |
| PH-25 | Multi-industry and custom-industry verification |
| PH-26 | Profile quality review with pilot tenants |

---

## 19. Open decisions

| ID | Question | Blocks |
| --- | --- | --- |
| `OD-005` | Custom field storage (JSONB baseline) | PH-08 |
| `OD-013` | Who curates the catalogue and at what cadence | PH-24 |
| `OD-014` | Custom industry visibility before promotion | PH-24 |
| `OD-015` | Custom field limits | PH-08 |
| `OD-016` | Workflow variants fixed or tenant-authored DSL | PH-09 |
| `OD-019` | Permission DSL exposed to tenants | PH-05 |
| `OD-030` | Dark mode (display only; not configuration) | PH-07 |
| `OD-031` | Languages for v1 | PH-04 |

---

## 20. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Stage 2 industry configuration architecture: catalogue, profile schema, resolution, custom industries, fields, variants and extensions. No implementation. |
