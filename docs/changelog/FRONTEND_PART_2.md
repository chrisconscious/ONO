# Frontend implementation — Part 2 of 3

**Status:** Part 2 complete and verified against the running backend and
database. All changes remain uncommitted.
**Date:** 2026-10-27

This note records the second frontend delivery: the complete testimonial
workflow and the tenant business modules that the current backend can support.
It is not a claim that ONO is finished. Part 3 remains separate, and modules
without backend support are recorded as blocked in
`docs/features/FRONTEND_MODULE_STATUS.md` rather than simulated.

> Part 3 was delivered after this note. Its hardening and verification record is
> in `docs/changelog/FRONTEND_PART_3.md`.

## Scope delivered

1. Testimonial submission, consent, author revisions, consent withdrawal and
   own-submission status in the tenant workspace.
2. Super Admin moderation: queue filters, review detail, approve, reject with a
   reason, request changes, edit, publish/unpublish, feature/unfeature, reorder,
   archive, public-card preview and moderation/publication history.
3. Seventeen tenant business resources across CRM, sales, procurement,
   inventory, finance, projects, tasks and support, sharing one registry,
   validation, service and API framework.
4. Server-calculated line items and totals for quotations, sales orders,
   purchase orders and invoices, with detail pages.
5. Invoice payments with transactional paid/balance/status updates and
   overpayment/shortfall guards.
6. Immutable stock movements, over-issue and below-zero adjustment guards, and
   stock levels derived from movements.
7. Analytics over stored tenant data for 6-month and 12-month periods.
8. Workspace governance: profile/industry editing, member directory, custom role
   creation/editing, role assignment, self-edit protection and denied states.
9. Permission-filtered, grouped workspace navigation and consistent permission
   enforcement on every read and write route.

## Backend additions required by the frontend

| Addition | Reason |
| --- | --- |
| Testimonial workflow fields and statuses (`CHANGES_REQUESTED`, `ARCHIVED`, consent flags, submitter link, rejection reason, moderation notes, feature flag, archive timestamp) | The approved moderation lifecycle needed persisted state and an auditable history. |
| `Warehouse` and `StockMovement` models, `PurchaseOrderLine.productId` | Inventory was requested but only products existed; stock is now derived from immutable movements. |
| Permission catalogue (`src/lib/permissions/catalog.ts`) | One source of truth for seeding, the role editor and route enforcement; 76 permission codes are seeded. |
| Generic `/api/tenant/[resource]` read/create/update/delete routes | Avoids seventeen divergent handlers while preserving per-resource permissions and tenant scoping. |
| Nested `/api/tenant/[resource]/[id]/lines` routes and document services | Server-owned line arithmetic; the browser never calculates stored totals. |
| `/api/workspace/profile`, `/api/workspace/roles`, `/api/workspace/roles/[id]`, `/api/workspace/members/[id]/roles` | Real workspace settings and role management instead of read-only screens. |
| Testimonial edit, rejection note, changes-requested, publish, unpublish, feature, archive and reorder APIs | Required for the complete moderation surface. |
| Migration `20261027155425_part2_testimonials_inventory` | Applies the schema changes above. |

Existing `/api/*` routes from Part 1 remain in place. All mutations are executed
by the server; client-side validation only provides early feedback.

## Testimonial workflow

- Members write 20–600 characters, choose 1–5 stars, choose a display name,
  optional title, and explicit publication/identity consent, then see a
  confirmation and their current status.
- The company is derived from the authenticated tenant on the server.
- Clients cannot approve, publish, feature, archive or moderate their own
  submissions.
- Authors can revise only after `CHANGES_REQUESTED` or `REJECTED`, and can
  withdraw consent at any time; withdrawal removes the entry from public view
  immediately.
- Approval publishes in one audited transition because the established Part 1
  workflow explicitly combined them. Publishing an approved but unpublished
  entry and unpublishing are separate actions; unpublish clears `publishedAt`
  while retaining `APPROVED`.
- Rejection and change requests require a reason shown to the author. Internal
  moderation notes are never returned publicly.
- Public cards expose only approved, published, consented entries and omit all
  IDs, submitter details and moderation notes. Name, title and company are
  masked unless individually consented.
- The moderation queue filters by status, company, rating, date range and free
  text, with pagination and status counts.
- The public order is featured first, then `displayOrder`. Reordering is
  persisted through `POST /api/admin/testimonials/reorder`; the new display
  order control disables moves that would cross the featured boundary because
  the public query pins featured entries above the rest.
- Archiving retains the record and a timestamp; the interface states that it
  cannot be undone from the UI.

## Tenant modules

Implemented in the shared resource framework: leads, contacts, companies,
opportunities, projects, tasks, products, quotations, sales orders, suppliers,
purchase orders, invoices, payments, expenses, support cases, warehouses and
stock movements. Each list supports search, status filtering where relevant,
sorting, pagination, create/edit dialogs, delete confirmation (where allowed),
validation, loading, empty, error/retry and permission-denied states.

Finance and inventory rules enforced by the server:

- Invoice totals are recalculated from lines plus document tax.
- Payments are immutable and update invoice `amountPaid`, `balance` and status
  in one transaction.
- Overpayment is rejected with the outstanding balance.
- A line change that would push the invoice total below recorded payments is
  rejected.
- Stock levels are computed from `IN` minus `OUT` plus signed `ADJUSTMENT`.
- An issue above available stock and an adjustment below zero are both rejected.
- Stock movements are immutable; warehouses and movements are not deletable
  through the API.

## Routes added

| Area | Routes |
| --- | --- |
| Workspace modules | `/app/{leads,contacts,companies,opportunities,projects,tasks,products,quotations,sales-orders,suppliers,purchase-orders,invoices,payments,expenses,support-cases,warehouses,stock-movements}` |
| Derived and analytical views | `/app/stock-levels`, `/app/analytics` |
| Document detail | `/app/{quotations,sales-orders,purchase-orders,invoices}/[id]` |
| Testimonials | `/app/testimonials`, `/admin/testimonials` |
| Governance | `/app/settings` (profile, members, roles, testimonials link) |
| APIs | `/api/tenant/[resource]`, `/api/tenant/[resource]/[id]`, nested line routes, workspace governance routes, testimonial submission/moderation routes |

Every navigation entry resolves to a real route. No placeholder or dead links
were introduced.

## Verification evidence

Environment: Next.js 16.4.3 development server on `localhost:3000`,
PostgreSQL 16 on `127.0.0.1:5544`, seeded `Northwind Trading` workspace.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passes with no errors. |
| `npm run lint` | Passes with no warnings. |
| `npm run build` | Production build succeeds; the route table includes every workspace, admin and API route listed above. |
| All 17 tenant resource reads | `200`; seeded totals reported for leads/tasks and zero for empty modules. |
| All 22 workspace pages | `200`; no application error markers. |
| Platform admin pages | `/admin`, `/admin/testimonials`, `/admin/tenants`, `/admin/audit` return `200`. |
| Lead create → update → delete | Created, moved to `QUALIFIED`, then deleted through the API. |
| Quotation lines | Add 2×150 → subtotal 300/total 400; update 3×200 → 600/700; delete → 0/100 tax; detail page renders lines and totals. |
| Invoice and payments | 2×100 + 1×50 + 10 tax → subtotal 250/total 260/balance 260; 100 payment → `PARTIALLY_PAID`/balance 160; 9999 payment rejected `409` with outstanding balance; 160 payment → `PAID`/balance 0; reducing a line below recorded payments rejected `409`; invoice page renders `PAID`, lines and balance; payment list totals update. |
| Inventory | IN 10, OUT 4, ADJUSTMENT −2 → stock level 4; over-issue rejected `409`; below-zero adjustment rejected `409`; movement update rejected `403`; stock-level page renders the derived quantity. |
| Testimonial end-to-end | Submit → request changes → revise → approve (auto-publish) → public card shows consenting identity → feature/unfeature → unpublish (status `APPROVED`, `publishedAt` null, absent publicly) → archive (`ARCHIVED`). A second submission withdrew consent and disappeared from public view. Admin status counts included archived records. |
| Testimonial ordering | Two approved/published fixtures appeared newest-first; reorder API returned the new ID order and the public endpoint reflected it. Admin page rendered the display-order section and controls. Duplicate IDs `400`; unpublished ID `409`; tenant user `403`. |
| Consent and masking | Public response omitted IDs, submitter details and notes; unconsented name/title/company were masked. |
| Role guards | System role edit `409`; unknown permission `409`; self role change `409`; invalid member ID `409`. |
| Custom role lifecycle | Created with 2 permissions, updated to 3, shown in settings; temporary role removed afterwards. |
| Industry profile | Updated and restored to empty through `/api/workspace/profile`. |
| Workspace settings wiring | Profile form, member table, role manager, testimonials link, custom role and edit action all rendered. |

## Test data cleanup

All verification fixtures were removed after the run: QA testimonial rows and
their audit entries, the QA custom role, QA leads/quotations, the QA invoice,
its two payments and lines, and the QA product/warehouse/stock movements. The
workspace industry was restored to its original empty value. The seeded
accounts and permission catalogue remain unchanged.

## Deliberately deferred or blocked

The full matrix, including evidence for each status, is in
`docs/features/FRONTEND_MODULE_STATUS.md`. In summary:

- **Blocked by missing backend:** HR, workflow automation, AI/ML,
  integrations/API keys/webhooks, subscriptions/entitlements, data marketplace,
  document file storage, notifications/email, module preferences and branches.
- **Partial:** tenant onboarding and invitation acceptance (no owner assignment,
  invitation lifecycle or email delivery), industry configuration (no platform
  catalogue UI), project milestones (model only), and end-to-end multi-member
  role assignment (only one seeded member; guards were verified).
- **Not faked:** no payment completion, no invented AI output, no placeholder
  data, no inert controls and no simulated integrations.

## Not claimed complete

Part 2 covers the testimonial workflow and the backend-supported tenant
modules. Part 3 still covers accessibility, onboarding hardening, performance,
security review, automated tests, deployment documentation and final
verification. The platform as a whole is not finished.

All Part 2 changes remain uncommitted. No commit or push was made.
