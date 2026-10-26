# ONO — UI/UX Design Requirements

| Field | Value |
| --- | --- |
| Document | UI/UX Design Requirements |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` |
| Requirements | `REQ-UX-001` … `REQ-UX-007`, `REQ-IAM-001` |

---

## 1. First impression rule

**The application opens on authentication.** There is no public landing page,
marketing hero, pricing table or blog inside this product. The marketing website
is a separate project (see `MASTER_PROJECT_SPECIFICATION.md` §6.2).

| Route | Expected behaviour |
| --- | --- |
| `/` | Redirect to sign-in when unauthenticated; redirect to the role-appropriate dashboard when authenticated |
| `/sign-in` | Sign-in form |
| `/forgot-password` | Reset request |
| `/invite/[token]` | Invitation acceptance |
| `/(tenant)/*` | Requires an active membership |
| `/(platform-admin)/*` | Requires a platform role |

> **Known conflict:** the current scaffold serves a landing page at `/`
> (`src/app/page.tsx`). It must be replaced in PH-05. Recorded, not yet fixed.

---

## 2. Design language

### 2.1 Colour tokens

| Token | Value | Use |
| --- | --- | --- |
| `navy` | `#172B4D` | Primary surface, navigation, headings on light |
| `blue` | `#2563EB` | Primary action, focus ring, active state, links |
| `white` | `#FFFFFF` | Cards, content surfaces |
| `neutral-50` | `#F8FAFC` | Page background |
| `neutral-200` | `#E2E8F0` | Borders, dividers |
| `neutral-500` | `#64748B` | Secondary text |
| `neutral-900` | `#0F172A` | Primary text |
| `success` | `#15803D` | Confirmed, paid, healthy |
| `warning` | `#B45309` | Attention, at-risk |
| `danger` | `#B91C1C` | Error, breach, overdue |
| `info` | `#1D4ED8` | Neutral informational |

Rules:

| ID | Rule |
| --- | --- |
| C-01 | Colour is never the only carrier of meaning; pair with text or icon. |
| C-02 | Text contrast meets WCAG 2.2 AA (4.5:1 body, 3:1 large text). |
| C-03 | Navy is the dominant surface; blue is reserved for action and focus. |
| C-04 | No decorative gradients, glows or "AI-style" purple neon. |
| C-05 | Financial values use tabular figures. |
| C-06 | Status badges use a consistent mapping across all modules. |

### 2.2 Typography

| Role | Size / weight | Notes |
| --- | --- | --- |
| Page title | 24–28 px / 600 | One per page |
| Section title | 18 px / 600 | |
| Body | 14–16 px / 400 | Line height 1.5 |
| Table | 14 px / 400 | Tabular numerals for numbers |
| Label | 13 px / 500 | Sentence case |
| Caption / helper | 12–13 px / 400 | Neutral-500 |
| Metric value | 28–36 px / 600 | With period and freshness label |

Font: system UI stack (no runtime font download dependency).

### 2.3 Spacing, shape and motion

| Token | Value |
| --- | --- |
| Spacing scale | 4, 8, 12, 16, 24, 32, 48, 64 px |
| Radius | 6 px inputs, 8 px cards, 999 px pills |
| Border | 1 px `neutral-200` |
| Shadow | Subtle only; one elevation level for overlays |
| Motion | 120–200 ms ease-out for state changes; respect `prefers-reduced-motion` |
| Focus ring | 2 px blue offset 2 px, always visible on keyboard focus |

---

## 3. Application shell

```
┌─────────────────────────────────────────────────────────────┐
│ Top bar: org switcher · global search · notifications · user │
├───────────────┬─────────────────────────────────────────────┤
│ Sidebar       │ Page header: title, breadcrumb, actions     │
│ (module nav)  ├─────────────────────────────────────────────┤
│               │ Filters / toolbar                           │
│               ├─────────────────────────────────────────────┤
│               │ Content (list, detail, form, dashboard)     │
│               │                                             │
│ Footer: help  │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

| ID | Rule |
| --- | --- |
| SH-1 | Navigation shows only modules the tenant is entitled to and the user may access. |
| SH-2 | The active module and page are always identifiable. |
| SH-3 | Global search respects permissions and never reveals titles of denied records. |
| SH-4 | Tenant/organisation switcher is visible when a user belongs to more than one tenant. |
| SH-5 | Breadcrumbs reflect real hierarchy, not decorative labels. |
| SH-6 | The shell never blocks on analytics; heavy widgets load independently. |

---

## 4. Screen inventory

Every module must provide, at minimum: **list**, **detail**, **create/edit**,
**search/filter**, **permission-aware states**, and **analytics where relevant**.

| Module | Screens |
| --- | --- |
| Auth | Sign-in, forgot password, reset password, invitation acceptance, MFA challenge, session expired |
| Tenant onboarding | Organisation, industry search, activities, configuration preview, structure, admin account, review |
| Organisation | Settings, branches (list/detail/edit), departments (tree/detail/edit), teams, numbering, branding |
| Users & roles | Members list, invite, member detail, roles list, role editor, permission viewer, audit |
| Platform admin | Tenants list/detail, plans, entitlements, feature flags, support grants, platform health |
| Industry | Catalogue browse, profile preview/apply, custom industry request, custom field manager |
| CRM | Leads list/detail/edit, contacts list/detail, companies list/detail, activities, duplicates review, segments |
| Sales | Pipeline board, opportunity detail, quotations list/detail/editor, contracts, orders, pricing |
| Marketing | Campaigns list/detail, campaign performance, attribution setup, consent/suppression |
| Finance | Invoices list/detail/editor, payments, expenses, bills, budgets, journals, period close, reports |
| Inventory | Products, warehouses, stock levels, movements, counts, reorder rules, inventory analytics |
| Procurement | Suppliers, requests, purchase orders, receiving, match exceptions, supplier performance |
| Projects | Project list/detail, tasks board/list, milestones, resourcing, costs, variations |
| Workforce | Employees, positions, capacity planner, site assignments, workforce reports |
| Support | Case queue, case detail, SLA dashboard, knowledge base, feedback |
| Documents | Document library, upload, version history, retention policies |
| Strategy | Objectives, KPI builder, risk register, review cycles, management pack |
| BI | Dashboard list, dashboard view, metric registry, metric detail, report builder, report runs |
| AI insights | Insight feed, insight detail, recommendations, decision history, outcomes |
| Integrations | Connections list/detail, credentials, webhooks, job monitor, import wizard |
| Audit | Audit log, access log, compliance export |
| Approvals | My approvals, approval detail, policy configuration |

### 4.1 Detail: CRM screens

| Screen | Contents | Primary actions | States |
| --- | --- | --- | --- |
| Leads list | Columns, saved views, owner filter, source filter | Create, assign, convert | Empty, loading, no-results, error |
| Lead detail | Profile, activity timeline, score/evidence, related records | Qualify, convert, disqualify, reassign | Permission-limited, archived |
| Lead editor | Required fields, owner, source, consent | Save, cancel | Validation errors |
| Contacts list | Search, company filter, consent state | Create, merge, export (permitted) | Export disabled without permission |
| Duplicate review | Side-by-side comparison, survivorship | Merge, dismiss | Conflict warning |

### 4.2 Detail: Finance screens

| Screen | Contents | Primary actions | States |
| --- | --- | --- | --- |
| Invoices list | Status, due date, balance, aging buckets | Create, issue, record payment | Posted-immutable state |
| Invoice editor | Line items, tax, totals (server-calculated) | Save draft, issue | Totals read-only from server |
| Invoice detail | Timeline, payments, credit notes, evidence | Print/export, credit note | Void/paid |
| Payments | Unallocated queue, allocation panel | Allocate, reconcile | Over-allocation blocked with message |
| Period close | Checklist, blockers, approver | Close, reopen (elevated) | Locked state |

### 4.3 Detail: BI screens

| Screen | Contents | Primary actions | States |
| --- | --- | --- | --- |
| Dashboard | Widgets bound to registered metrics | Filter, drill, export | Partial data, stale data banner |
| Metric detail | Definition, formula, owner, freshness, lineage | Version history, drill to records | Insufficient access |
| Report builder | Fields, filters, schedule | Run, schedule, export | Empty result is valid |

---

## 5. Required states

Every screen must implement these states explicitly. A missing state is a defect.

| State | Requirement |
| --- | --- |
| Loading | Skeleton matching final layout; no spinner-only pages |
| Empty | Explains what the screen is for and the next action |
| No results | Distinguishes "no data" from "no match for filters"; offers reset |
| Error | Plain-language message, correlation ID, retry; never a stack trace |
| Permission denied | Clear explanation and the role needed; no data leakage |
| Disabled | Explains why, with the condition required to enable |
| Success | Confirms what changed and what happens next |
| Partial / stale | Shows data freshness and what is missing |
| Offline / degraded | AI or integration unavailable, core remains usable |
| Read-only | Immutable record state is visually distinct from editable |

---

## 6. Forms

| ID | Rule |
| --- | --- |
| F-01 | Labels above fields; required fields marked; help text available. |
| F-02 | Validate on blur and on submit; never on every keystroke. |
| F-03 | Errors appear next to the field and in a summary for long forms. |
| F-04 | Destructive actions require confirmation naming the object. |
| F-05 | Unsaved changes trigger a leave confirmation. |
| F-06 | Money, dates, percentages and quantities use locale-aware inputs. |
| F-07 | Server validation is authoritative; client validation is convenience. |
| F-08 | Multi-step forms show progress and allow safe back navigation. |
| F-09 | No hidden required fields; no surprise validation after submit. |
| F-10 | Autosave only where loss is unacceptable, with explicit status. |

---

## 7. Tables, filters and search

| ID | Rule |
| --- | --- |
| T-01 | Column choice persists per user per screen. |
| T-02 | Sorting, pagination and result count are always visible. |
| T-03 | Filters are visible as chips when active, individually removable. |
| T-04 | Saved views are shareable within scope, never across tenants. |
| T-05 | Bulk actions state the count and require confirmation. |
| T-06 | Empty tables show the action that creates the first record. |
| T-07 | Numeric columns are right-aligned with tabular figures. |
| T-08 | Export respects permissions and states the applied filters. |

---

## 8. Dashboards and insight presentation

| ID | Rule |
| --- | --- |
| D-01 | Every widget states its period, scope and last-updated time. |
| D-02 | No widget shows a number without a registered metric behind it. |
| D-03 | Insight cards label fact, prediction, assumption and recommendation. |
| D-04 | Every insight card offers "why am I seeing this?" with evidence links. |
| D-05 | Confidence is shown as a band or interval, not a decorative percentage. |
| D-06 | Recommendations show expected impact, cost, risk and required approval. |
| D-07 | "Insufficient data" is a designed state, not an error. |
| D-08 | No fabricated sample metrics in production surfaces. |

---

## 9. Onboarding

| ID | Rule |
| --- | --- |
| ON-01 | Contextual, skippable, resumable. |
| ON-02 | Shows progress (step x of y). |
| ON-03 | Next, previous, skip and finish are always available where meaningful. |
| ON-04 | Each suggested setting explains why it is suggested. |
| ON-05 | Never blocks the user from reaching the product. |
| ON-06 | Completion state is stored per user so it is not repeated. |
| ON-07 | No modal stacking; one task at a time. |

---

## 10. Accessibility (WCAG 2.2 AA)

| ID | Requirement |
| --- | --- |
| A-01 | Every interactive element is keyboard reachable in a logical order |
| A-02 | Visible focus indicator at all times |
| A-03 | Semantic landmarks, headings and lists |
| A-04 | Form fields programmatically labelled; errors associated |
| A-05 | Status messages announced via live regions |
| A-06 | Contrast meets AA for text, icons and UI boundaries |
| A-07 | Target size at least 24×24 px |
| A-08 | Motion respects `prefers-reduced-motion` |
| A-09 | No keyboard traps in dialogs; escape closes |
| A-10 | Charts have text alternatives and data tables |
| A-11 | Zoom to 200% without loss of function |
| A-12 | Language and direction declared |

Accessibility is part of the definition of done, not a later audit.

---

## 11. Responsive behaviour

| Breakpoint | Behaviour |
| --- | --- |
| ≥ 1280 px | Sidebar expanded, multi-column dashboards |
| 1024–1279 px | Sidebar collapsible, two-column content |
| 768–1023 px | Sidebar drawer, single-column cards, tables become stacked rows |
| 480–767 px | Bottom-friendly actions, simplified tables, sticky primary action |
| < 480 px (min 360 px) | Single column, full-width controls, no horizontal scroll for core tasks |

| ID | Rule |
| --- | --- |
| R-01 | Critical actions are reachable one-handed on small screens. |
| R-02 | Tables degrade to definition lists rather than horizontal scroll for key data. |
| R-03 | No hover-only information. |
| R-04 | Charts remain legible at 360 px or provide a table view. |

---

## 12. Content and tone

| ID | Rule |
| --- | --- |
| TX-01 | Plain language; no internal jargon or error codes in user text. |
| TX-02 | Buttons use verbs ("Issue invoice", not "Submit"). |
| TX-03 | Destructive confirmations name the object and the consequence. |
| TX-04 | Empty states teach, not apologise. |
| TX-05 | No exclamation marks, no anthropomorphic AI voice. |
| TX-06 | Numbers state their unit, currency and period. |
| TX-07 | Every AI-generated statement is attributable and labelled. |

---

## 13. Anti-patterns (explicitly rejected)

| Rejected | Reason |
| --- | --- |
| Marketing hero inside the app | Product opens at sign-in |
| Fake metrics or demo data in production | Violates `P-12` and `EPI-2` |
| Non-functional buttons or "coming soon" controls | Erodes trust |
| Decorative gradients and neon AI styling | Not professional |
| Chart walls without definitions | Hides uncertainty |
| Confirmation dialogs for every action | Trains users to click through |
| Hiding errors behind toasts only | Information loss |
| Infinite scroll on financial data | Unverifiable totals |
| Colour-only status | Accessibility failure |
| Auto-executing AI actions | Governance failure |

---

## 14. Design process

| Step | Output |
| --- | --- |
| 1. Screen inventory | Table above, reviewed per module |
| 2. Flow review | Workflow-aligned, one design group at a time |
| 3. Component mapping | Existing primitive or new component decision |
| 4. State specification | Every state in §5 designed |
| 5. Accessibility check | Keyboard, contrast, labels, announcements |
| 6. Responsive review | 360 px, 768 px, 1280 px |
| 7. Sign-off | Approved design group before implementation |

Design groups are reviewed individually — never one enormous collage that is
impossible to critique.

---

## 15. Requirements mapping

| Requirement | Section |
| --- | --- |
| `REQ-UX-001` | §2 design language |
| `REQ-UX-002` | §1 authentication-first |
| `REQ-UX-003` | §10 accessibility |
| `REQ-UX-004` | §4 screen inventory |
| `REQ-UX-005` | §5 states |
| `REQ-UX-006` | §11 responsive |
| `REQ-UX-007` | §9 onboarding |

## 16. Open decisions

| ID | Question |
| --- | --- |
| `OD-006` | shadcn/ui adoption and component ownership |
| `OD-030` | Dark mode in v1 or later? (Baseline: light theme first, tokens ready for dark) |
| `OD-031` | Localisation languages for v1 (Swahili/English?) |
| `OD-032` | Print/PDF fidelity requirements for invoices and reports |

## 17. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial UI/UX requirements and screen inventory. |
