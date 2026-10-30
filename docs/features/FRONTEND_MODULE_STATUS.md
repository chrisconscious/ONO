# Frontend module status — after Part 4

**Last updated:** 2026-10-30
**Scope:** tenant workspace, platform administration, Part 3 hardening and the
Part 4 CRM intelligence layer (CRM workspace, pipeline, insights, record detail,
timelines, lead conversion, grounded copilot, automation engine, in-app
notifications and CRM search).
**Important:** this file records what the frontend can actually do against the
current backend. It is not a claim that the whole ONO platform is complete.
Part 4 extends the existing CRM modules; it does not add trained ML, outbound
communications, a scheduler or a payment provider.

Status values:

- **Fully implemented** — real route, real API, real persistence, permissions
  enforced on the server, and the main workflow was exercised against the
  running database.
- **Partially implemented** — some real capability exists, but a named part of
  the module has no backend support or no user interface yet.
- **Blocked** — no backend model/service exists, or the required external
  capability (storage, email, payment provider) is absent. No UI was invented
  for these areas.

## Status matrix

| Area | Status | What works | Known limit or blocker |
| --- | --- | --- | --- |
| Authentication, workspace selection, shell and navigation | Fully implemented | Sign-in, sign-out, session cookies, active-workspace switching, platform/tenant guards, permission-filtered grouped navigation, denied states, workspace context in the header. | None in the delivered scope. |
| Tenant provisioning and organisation setup | Partially implemented | Platform administrators can create tenants, list them, and activate/suspend/close them. Workspace settings show organisation name, slug, status and creation date. The tenant industry is editable with `PERM-INDUSTRY.UPDATE`. | Creating a tenant does not create an owner membership, send an invitation or run a setup checklist. `Invitation` exists in the schema but has no service, API, email delivery or acceptance screen. |
| Members, roles, permissions and audit | Fully implemented | Member directory, system/custom roles, permission catalogue (76 seeded codes), create/edit custom roles, assign multiple roles to a member, self-role-change guard, tenant-scoped role listing, and the audit trail view. | System roles are intentionally read-only. No invitation flow. The seeded database has one member per workspace, so a real two-member assignment was not executed; the invalid-member, self-edit and system-role guards were verified. |
| Testimonials (submission and moderation) | Fully implemented | Client submission with 1–5 stars, consent choices, server-derived company identity, own-submission list with status, revision after a change request or rejection, consent withdrawal, moderation queue with status/company/rating/date/search filters, detail preview, approve, reject with reason, request changes, edit, publish, unpublish, feature/unfeature, reorder, archive, and moderation/publication history. | Approval auto-publishes because the established Part 1 workflow explicitly combined the two steps; unpublishing and publishing remain separate, audited actions. No email notification on moderation changes. |
| CRM and sales pipeline | Fully implemented | Leads, contacts, companies and opportunities: list, search, status filters, sorting, pagination, create, edit, delete, owner assignment, validation, loading/empty/error states. Record detail pages add timelines, linked tasks, quotations, score factors, stage history and lead conversion. A permission-gated workspace (`/app/crm`), pipeline board and sales-insights page add priorities, data-quality gaps, source performance, per-currency pipeline totals and stage ageing. | No trained ML, email/calendar sync or outbound messaging. Scores and win probabilities are labelled rule/statistical baselines. Opportunity reopen and conversion/loss by automation are intentionally blocked. |
| CRM timelines, notifications and search | Fully implemented | Immutable CRM activity timeline per record (human and system events), in-app notifications with a header bell, and tenant-scoped global search across leads, contacts, companies and opportunities. | No email, SMS, push or browser notification delivery. Notifications are read in the application only. |
| CRM copilot | Partially implemented | A deterministic copilot answers bounded questions from the records the caller may read, with evidence, limitations, method label and explicit confirmation that nothing was executed. An optional OpenAI-compatible adapter exists and is disabled by default. | No AI provider credentials are configured, no trained model exists, and the generative path was not exercised against a live provider. The copilot never performs consequential actions. |
| Quotations and sales orders | Fully implemented | Document headers plus server-calculated line items, subtotal/tax/total, status, currency, party, dates, edit/delete lines, and detail pages. | No PDF rendering, e-signature or outbound email. Tax is a document-level amount, not a multi-rate tax engine. |
| Procurement | Fully implemented | Suppliers, purchase orders and purchase-order lines with the same server-calculated totals and permissions. | No supplier portal, no purchase-order approval chain (would need the workflow engine). |
| Inventory | Fully implemented | Product catalogue, warehouses, immutable stock movements (`IN`, `OUT`, `ADJUSTMENT`), server-side over-issue and below-zero guards, and a stock-level screen derived from movements. | Warehouses and movements cannot be deleted through the API by design; movements are immutable. No barcode scanning or multi-warehouse transfer document. |
| Finance and invoicing | Fully implemented | Invoices with line items, document tax, derived subtotal/total/balance/status, immutable payments, partial and full settlement, overpayment rejection, and a guard preventing a line edit below payments already recorded. Expenses are CRUD records. | No payment gateway, refunds, credit notes, bank reconciliation, PDF invoice or email delivery. The UI never treats a frontend action as payment completion. |
| Projects and tasks | Fully implemented | Project and task CRUD, statuses, dates, assignees, related-record links, overdue flags on the workspace overview, search, filters, sorting and pagination. | `Milestone` exists in the schema but has no service, API or screen. |
| Support cases | Fully implemented | Support case records with subject, description, status, priority and assignment through the shared resource framework. | No inbound email ingestion, outbound replies, SLA timers, customer/contact linkage or chat. Communication delivery is blocked. |
| Analytics | Fully implemented | Server-side aggregation of stored tenant records for 6-month and 12-month periods, with a denied state for missing analytics permission. CRM insights add source performance, data-quality counts and a per-currency pipeline-weighted forecast whose assumptions are shown in the UI. | No configurable reports, exports, scheduled delivery or trained forecasting model. Analytics is descriptive or baseline-statistical, not AI. |
| Documents (file storage) | Blocked | Quotations, sales orders, purchase orders and invoices are modelled as business documents with line items and detail pages. | The `Document` table stores file metadata only. There is no upload/download route, storage adapter, virus scanning or retention job, so no file UI was built. |
| HR | Blocked | — | No employee, leave, payroll, attendance or recruitment model/service. |
| Workflow automation | Partially implemented | Server-side CRM automation with triggers, up to five conditions, five safe actions, validation, audit history, retries, per-run summaries and idempotency (`workflowId` + event key). Time-based triggers are evaluated by a permission-protected sweep endpoint. The console supports create, edit, activate, pause, manual run and delete. | No queue, cron, worker, approval chain or cross-module workflow product. There is no scheduler in the codebase, so an operator or external scheduler must call the sweep endpoint. Automation cannot convert or lose a lead, send a message or take payment. |
| AI and machine learning | Partially implemented | A deterministic, evidence-based copilot with bounded intents; explainable lead-scoring and win-probability baselines; a per-currency pipeline-weighted forecast; an optional server-only OpenAI-compatible adapter. | No trained model, training pipeline, model registry, feature store or inference service exists. The generative adapter is disabled without approved credentials and was not verified against a live provider. No synthetic AI output was added. |
| Integrations, API keys and webhooks | Blocked | — | No integration, credential, API-key or webhook model/service. |
| Subscriptions and entitlements | Blocked | Tenant status and role permissions are enforced. | No plan, subscription, entitlement, usage metering or billing model. No billing screen was created. |
| Data marketplace and data governance products | Blocked (marketplace) / implemented (governance controls) | Tenant isolation, role permissions, audit trail and moderation privacy controls are implemented. | No marketplace listing, dataset contract, anonymisation pipeline or buyer access model. |
| Industry configuration | Partially implemented | Tenant industry is editable and stored; `Industry`, `CustomIndustry` and `TenantIndustry` models plus a read-only `/api/industries` route exist. | No platform UI to manage the industry catalogue, custom industry definitions, field variants or template activation. |
| Module preferences | Blocked | Navigation and actions are permission-driven by design. | No preference/entitlement model exists, so no module toggle was invented. |
| Branches | Blocked | — | `Branch` exists in the schema but has no service, API, UI or tenant scoping workflow. |
| Notifications and email | Partially implemented | Persisted in-app notifications are created by automations and read through the header bell and `/api/tenant/notifications`. | No email/SMS/WhatsApp/calendar provider, template store or delivery log. External delivery is therefore impossible and is never claimed. |
| Onboarding and invitation acceptance | Partially implemented | The workspace overview shows a permission-aware “Getting started” card and an optional four-step tour. Dismissing the card or finishing the tour is remembered across reloads. Invitation acceptance remains absent. | Onboarding dismissal is stored in the browser only (`ono.onboarding.workspace.v1`) because the approved schema has no user-preference table; it is UI-only and never used for authorization. Tenant creation still has no owner assignment, invitation lifecycle, email delivery or accept-invite route. |

## CRM intelligence behaviour

- **Lead score.** Stored on the lead with its method, factors, confidence,
  sample size and calculation time. Converted leads record 100; all other scores
  stay within 0–95 so the UI never implies certainty. The score is recomputed
  after writes and after human activity is logged.
- **Win probability.** Stage baseline, historical stage conversion once at least
  three closed outcomes exist, ageing, expected-close proximity and task health.
  Closed deals record 100/0 as an outcome, not a forecast.
- **Forecast.** Open amount × current win baseline, reported per currency with
  best case, conservative case and committed closed-won value. The assumptions
  are rendered next to the figures.
- **Timeline.** Human notes, calls, meetings and emails plus system events
  (creation, status, owner, stage, conversion, automation). Only human
  interaction types update "last contacted"; system events do not.
- **Automation.** Definitions are validated on the server; unsafe status
  changes, cross-record actions and oversized definitions are rejected. Runs
  record conditions, actions, attempts, errors and idempotency keys. A failure is
  visible in run history and never blocks the originating user write.
- **Copilot.** Bounded intents only; evidence and limitations are always
  returned; `executed` is always false. The response label states whether a
  generative provider was used.

## Testimonial privacy behaviour (verified)

- Company identity is taken from the authenticated tenant on the server; the
  submitter cannot type a different company.
- The public endpoint requires `APPROVED`, a non-null `publishedAt` and
  `consentToPublish = true`.
- Public responses contain no testimonial ID, tenant ID, submitter ID or
  moderation notes.
- Name, title and company are masked individually unless the matching consent
  flag is true; the rating and quote remain.
- Withdrawing consent clears publication eligibility immediately, so the entry
  disappears from the public listing without waiting for moderation.
- Unpublishing clears `publishedAt` while retaining the approved status; the
  public query excludes it.
- Archiving removes the entry from public display and retains the moderation
  record.
- Rejection and change-request reasons are visible to the author; internal
  moderation notes are not part of the public or own-submission response.

## Framework reuse

Seventeen tenant resources share one registry, Zod schema set, records service
and `/api/tenant/[resource]` route pair. The screens share one client
`ResourceWorkspace` for search, status filters, sorting, pagination, create/edit
dialogs, delete confirmation, validation, retry, empty and denied states. This
keeps tenant scoping and permission checks consistent; it does not make the
modules interchangeable — each registry entry declares its own columns, fields,
permissions, sort options and immutable/delete rules.

## Responsive and accessibility behaviour

- Shared list screens (`ResourceWorkspace`) render a desktop table from the `md`
  breakpoint and labelled record cards below it. The mobile cards expose the same
  values and permitted actions; the table is hidden rather than left to overflow.
- Document line editors, stock levels and the workspace member directory use the
  same table/card split.
- Long names, quotes and pasted text wrap inside their containers. The workspace
  shell and dialogs use `min-w-0`, wrapping and viewport-constrained widths so a
  long organisation name cannot force horizontal page scrolling.
- The app shell and sign-in page provide skip links to `main#main-content`.
  Keyboard focus has a global visible fallback ring, and Windows forced-colors
  mode receives a system highlight outline.
- Reduced-motion preferences collapse animations and transitions globally.
- The sign-in testimonial showcase uses carousel roles and a polite live region.
  The mobile navigation trigger exposes `aria-haspopup` and `aria-expanded`.
- List screens announce loading, result counts and save results through polite
  live regions. Route errors use `role="alert"` and never expose a raw exception,
  stack trace or database message.
- Status badge tones were adjusted with `color-mix` so success, information and
  danger text meet the 4.5:1 contrast requirement at badge text size.

## UI states and duplicate-submission protection

Loading skeletons exist at the route level (`loading.tsx` for tenant and platform
areas) and inside shared list and table screens. Empty, error-with-retry,
validation, success and permission-denied states are rendered from real responses.
`/access-denied` explains platform versus workspace scope and offers the correct
next step. Mutating forms guard against double submission with in-flight refs and
disabled controls; the server remains the authority for validation and conflicts.

## Automated tests

Vitest is configured through `vitest.config.mts`. The suite covers pure logic:
formatting fallbacks, safe post-login redirects, the permission catalogue,
resource registry integrity, public testimonial privacy/masking, CRM scoring and
forecasting, automation definition/condition rules, copilot intent mapping and
CRM presentation helpers.

```bash
npm test           # single run
npm run test:watch # watch mode
npm run typecheck
npm run lint
npm run build
```

There is no integration or end-to-end test framework in the repository. Database
workflows were verified manually against the running PostgreSQL instance; that
evidence is recorded in the Part 2, Part 3 and Part 4 changelogs.

## Verification summary (Part 4)

| Check | Result |
| --- | --- |
| `npm test` | 9 files, 58 tests passed. |
| `npm run typecheck` | Passed with no errors. |
| `npm run lint` | Passed with no warnings. |
| `npm run build` | Production build succeeded; all CRM routes rendered. |
| Authenticated CRM pages | `/app/crm`, `/app/crm/pipeline`, `/app/crm/insights`, `/app/crm/automations`, `/app/leads`, `/app/contacts`, `/app/companies` and `/app/opportunities` returned 200 with expected titles. |
| Record detail | A stored lead rendered at `/app/leads/[id]`; an unknown id rendered the 404 fallback. |
| Authorization | No session returned 401 on tenant automation APIs; a platform administrator without workspace membership returned 403 and was redirected from `/app/crm`. |
| Copilot | Grounded deterministic answers with evidence, limitations, method label and `executed: false`. No provider configured. |
| Automation | Create → manual run ×2 → notification and run history → sweep → delete all verified; temporary rows removed. |
| Safety fix | System/automation timeline entries no longer update lead or contact "last contacted"; only human NOTE/CALL/MEETING/EMAIL activities do. |

## Verification summary (Part 3)

| Check | Result |
| --- | --- |
| `npm test` | 5 files, 17 tests passed. |
| `npm run typecheck` | Passed with no errors. |
| `npm run lint` | Passed with no warnings. |
| `npm run build` | Production build succeeded (Next.js 16.4.3). |
| Lighthouse accessibility | `/login`, `/app`, `/app/leads`, `/app/settings`, `/app/analytics`, `/admin`, `/admin/tenants` and `/admin/testimonials` scored 1.0. |
| Security headers | CSP, COOP, Permissions-Policy, Referrer-Policy, `X-Content-Type-Options` and `X-Frame-Options` present on responses; `X-Powered-By` absent. |
| Onboarding | Dismiss and finish persist across reload; the tour exposes labelled dialog semantics and four steps. |
| Platform boundary | A tenant owner opening `/admin` receives `/access-denied?scope=platform`, not the platform console. |
| Desktop overflow | No horizontal page overflow on the workspace overview, leads, invoices, settings, analytics, stock levels or the audited admin pages at 1296px. |
| Document lines | A temporary invoice line rendered the desktop table, the mobile card alternative and server totals without overflow; the fixture was removed. |
| Mobile structure | Card alternatives exist and are hidden at desktop width; true device-width rendering could not be automated with the available browser tooling. |

## Known limitations

- No trained ML exists. Scoring, win probability and forecast are explainable
  rule/statistical baselines, labelled as such in the UI and services. There is
  no training pipeline, model registry or inference infrastructure.
- No AI provider credentials are configured. The deterministic copilot was
  verified; the optional generative adapter was not exercised against a live
  provider.
- No email, SMS, WhatsApp, calendar or payment provider exists. No outbound
  communication, calendar sync or payment was implemented or claimed.
- No queue or scheduler is bundled. Time-based automations require an operator or
  external scheduler to call the protected sweep endpoint.
- The browser automation tool has no viewport or device-emulation command, so
  mobile and tablet layouts were verified structurally (DOM and computed styles)
  rather than through screenshots at each breakpoint.
- Only unit tests exist. There is no integration, contract or end-to-end suite.
- Lighthouse audits accessibility, best practices and SEO; it does not emulate a
  device or produce a performance benchmark in this environment.
- The Content Security Policy still permits inline scripts and styles because the
  Next.js bootstrap requires them. A nonce-based policy needs a dedicated change
  and regression testing before a strict production deployment.
- Onboarding dismissal is per browser profile, not per user account.
- Production session cookies are `secure`, so authenticated verification requires
  HTTPS or `localhost`.

## Not claimed

- No trained model, fabricated probability, forecast, churn prediction or AI
  output is presented as real.
- No payment is initiated, captured or confirmed by the frontend.
- No message is sent by the copilot, an automation or any CRM screen.
- No automation performs a consequential action without a person: conversion and
  loss are blocked, and stage changes are audited service methods.
- No secret, token, credential, private file or moderation note is exposed in a
  public response.
- No module marked blocked has placeholder data, inert controls or a simulated
  backend.
- Part 4 does not make the platform complete. HR, file storage, integrations,
  subscriptions, the marketplace, invitation acceptance and outbound
  communications remain blocked, and the full product still requires the phases
  recorded in `docs/DEVELOPMENT_ROADMAP.md`.
