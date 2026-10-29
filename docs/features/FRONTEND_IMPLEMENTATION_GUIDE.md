# Frontend implementation guide

**Last updated:** 2026-10-27
**Applies to:** the Frontend Parts 1–3 delivery in this repository.
**Status:** implemented and verified against the local PostgreSQL database and a
production build. All changes remain uncommitted.

This guide is the practical reference for running, navigating and extending the
frontend. It records only behaviour that exists in the code. The feature matrix
and per-module blockers are in
[`FRONTEND_MODULE_STATUS.md`](./FRONTEND_MODULE_STATUS.md); delivery history is in
[`../changelog/FRONTEND_PART_1.md`](../changelog/FRONTEND_PART_1.md),
[`FRONTEND_PART_2.md`](../changelog/FRONTEND_PART_2.md) and
[`FRONTEND_PART_3.md`](../changelog/FRONTEND_PART_3.md).

## 1. Stack and commands

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16.4.3 App Router, React 19.3.1 |
| Styling | Tailwind CSS with the Shadcn preset `b1Q5GC` direction and OKLCH design tokens |
| Primitives | Base UI (`@base-ui/react`) behind the local `src/components/ui` wrappers |
| Icons | `lucide-react` |
| Database | PostgreSQL with Prisma 6.19.3 |
| Auth | Server-side session records plus an HTTP-only cookie |
| Validation | Zod 4 |
| Tests | Vitest 4.1.12 |

```bash
npm run dev        # development server
npm run build      # production build
npm start          # serve the production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest single run
npm run test:watch # Vitest watch mode

npm run db:generate
npm run db:push
npm run db:migrate
npm run db:seed
```

Use `npm.cmd` in PowerShell. The browser tooling in this environment is only
reliable against `npm start`, not `next dev`.

## 2. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma. |
| `AUTH_SECRET` | Yes | Server-only secret used for session token handling. Generate with `openssl rand -base64 32`. |
| `NEXT_PUBLIC_APP_URL` | Yes | Public base URL used for absolute links and redirects. |

`.env.example` documents the names with placeholder values. Never commit `.env`
or a real secret. Only `NEXT_PUBLIC_*` values are exposed to the browser; no
database credential or auth secret is sent to the client.

## 3. Route map

Route groups: `(auth)` for public sign-in, `(tenant)` for workspace pages,
`(platform-admin)` for the separate platform console.

| Area | Routes |
| --- | --- |
| Public | `/`, `/login`, `/access-denied`, `/not-found` handling |
| Workspace overview | `/app` |
| Workspace modules | `/app/{leads,contacts,companies,opportunities,projects,tasks,products,quotations,sales-orders,suppliers,purchase-orders,invoices,payments,expenses,support-cases,warehouses,stock-movements}` |
| Derived views | `/app/stock-levels`, `/app/analytics` |
| Document detail | `/app/{quotations,sales-orders,purchase-orders,invoices}/[id]` |
| Workspace governance | `/app/settings`, `/app/testimonials` |
| Platform console | `/admin`, `/admin/tenants`, `/admin/tenants/[id]`, `/admin/administrators`, `/admin/testimonials`, `/admin/audit`, `/admin/settings` |

Every navigation entry resolves to a real page. There are no placeholder routes
or dead links. The tenant and platform shells are separate layouts with separate
navigation and access checks.

## 4. API surface

| Group | Routes |
| --- | --- |
| Auth | `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` |
| Tenant resources | `/api/tenant/[resource]`, `/api/tenant/[resource]/[id]` |
| Document lines | `/api/tenant/[resource]/[id]/lines`, `/api/tenant/[resource]/[id]/lines/[lineId]` |
| Workspace | `/api/workspace/profile`, `/api/workspace/switch`, `/api/workspace/roles`, `/api/workspace/roles/[id]`, `/api/workspace/members/[id]/roles` |
| Testimonials | `/api/testimonials`, `/api/testimonials/[id]`, `/api/testimonials/mine` |
| Platform admin | `/api/admin/testimonials`, `/api/admin/testimonials/[id]`, `/api/admin/testimonials/reorder`, `/api/admin/users`, `/api/admin/users/[id]`, `/api/admin/settings`, `/api/tenants`, `/api/tenants/[id]`, `/api/audit-logs` |
| Reference | `/api/industries` (read-only catalogue) |
| Operations | `/api/health` |

Older per-resource routes from Part 1 (`/api/leads`, `/api/invoices`, etc.) remain
in place as a compatibility surface. The tenant screens use the generic
`/api/tenant/[resource]` pair so permissions and tenant scoping stay consistent.

All list endpoints return tenant-scoped data and enforce the matching
`PERM-<RESOURCE>.<ACTION>` code on the server. The browser never supplies a role,
tenant ID or permission that is trusted for authorization.

## 5. Component map

| Component | Responsibility |
| --- | --- |
| `src/components/app/app-shell.tsx` | Workspace chrome, grouped navigation, skip link, mobile drawer, workspace switcher and user menu. |
| `src/components/app/nav.ts` | Permission-filtered navigation definitions. Filtering is presentation only. |
| `src/components/app/page-header.tsx`, `stat-card.tsx`, `states.tsx` | Shared page headings, summary tiles, empty and error surfaces. |
| `src/components/app/data-table.tsx`, `filters.tsx` | Shared desktop table and filter controls. |
| `src/components/app/status-badge.tsx` | Status tone mapping with contrast-safe colour mixing. |
| `src/components/app/onboarding.tsx` | Dismissible “Getting started” card and optional four-step tour. |
| `src/components/app/route-states.tsx` | Route skeleton and safe error surface used by `loading.tsx`/`error.tsx`. |
| `src/components/app/mini-chart.tsx` | Server-rendered bar chart with an accessible text alternative. |
| `src/components/workspace/resource-workspace.tsx` | Shared list/search/filter/sort/pagination/create/edit/delete workspace for the 17 registry-backed resources. |
| `src/components/workspace/document-lines.tsx` | Responsive line editor for quotations, orders, purchase orders and invoices. |
| `src/components/workspace/stock-levels-table.tsx` | Derived stock levels with table/card layouts. |
| `src/components/workspace/testimonial-submission-form.tsx`, `own-testimonials.tsx` | Consent-based submission, revision and withdrawal. |
| `src/components/platform/*` | Tenant creation/status, administrator management, platform settings and testimonial moderation controls. |
| `src/components/auth/*` | Sign-in form, sign-out control and public testimonial carousel. |

The UI wrappers in `src/components/ui` follow the preset direction and Base UI
semantics. Use `cn` for conditional classes and keep new interactive code behind
client boundaries rather than turning whole pages into client components.

## 6. Authentication and authorization boundaries

- The session cookie is `httpOnly`, `SameSite=Lax`, `Path=/`, and `secure` in
  production. Session records are validated on the server for every request.
- `requireSession` redirects unauthenticated visitors to
  `/login?next=<validated-internal-path>`.
- `requirePlatformAdmin` reads platform privilege from the server-side user
  record. A tenant user opening `/admin` gets
  `/access-denied?scope=platform`.
- `requireWorkspace` resolves the active membership from the explicit request or
  the `ono_workspace` cookie and validates it against the actor’s memberships. A
  suspended or closed tenant gets `/access-denied?scope=suspended`.
- Platform administrators do not receive implicit tenant access. Without a
  membership they are redirected to `/admin`.
- Permission-filtered navigation is a usability feature, not the authorization
  boundary. Every route handler re-checks the actor and permission.
- `isSafeInternalPath` rejects external, protocol-relative and malformed
  post-login targets, preventing open redirects.

## 7. Tenant isolation and data handling

- Tenant-scoped services receive the resolved `tenantId` from the server session;
  client payloads cannot choose another tenant.
- Tenant and platform pages read the session cookie on the server and are
  request-time rendered. No `unstable_cache`, `revalidate` export or other shared
  cache is used for tenant data, so cached content cannot cross a tenant boundary.
- List and detail queries include the tenant boundary, and platform-only queries
  are isolated in the platform services.
- Testimonial company identity is derived from the authenticated tenant.
- Public testimonial responses omit IDs, submitter details and moderation notes;
  name, title and company are masked unless each consent flag is true.
- Mutations write audit entries where the module supports auditing.
- Route handlers return opaque error messages; raw Prisma errors and stack traces
  are not rendered in the UI.

## 8. Testimonial workflow

1. A tenant member submits a quote, rating, display name and optional title, with
   explicit publication and identity consent.
2. The server stores the tenant-derived company and the submitter link.
3. A platform administrator reviews the submission and can approve, reject with a
   reason, request changes, edit, publish/unpublish, feature/unfeature, reorder or
   archive it.
4. Approval auto-publishes because the established workflow combined the steps.
   Unpublishing clears `publishedAt` while retaining `APPROVED`; publishing again
   and featuring remain separate audited actions.
5. Authors may revise only after `CHANGES_REQUESTED` or `REJECTED`, and may
   withdraw consent at any time. Withdrawal removes the entry from public output.
6. The public listing requires `APPROVED`, a non-null `publishedAt` and
   `consentToPublish = true`.

## 9. UI conventions

- **Responsive:** tables are for `md` and above; below that, the same records are
  rendered as labelled cards. Page-level horizontal scrolling is not used as a
  substitute for layout.
- **States:** every data screen provides loading, empty, error/retry, validation,
  success and permission-denied feedback. Mutations guard against duplicate
  submission and disable controls while in flight.
- **Accessibility:** skip links, one `h1` per page, labelled controls, visible
  focus, polite live regions for asynchronous results, alert roles for failures,
  reduced-motion support and forced-colors fallbacks.
- **Long content:** quotes, organisation names and pasted text wrap inside their
  containers; avoid fixed widths that assume short values.
- **Server first:** keep data fetching in server components. Use client
  components only for interaction, and do not add client-side copies of
  server-owned totals or authorization decisions.

## 10. Testing and verification

Unit tests live beside the pure logic they cover:

- `src/lib/format.test.ts`
- `src/lib/auth/redirect.test.ts`
- `src/lib/permissions/catalog.test.ts`
- `src/lib/resources/registry.test.ts`
- `src/lib/testimonials/public.test.ts`

Run `npm test` for the suite, then `npm run typecheck`, `npm run lint` and
`npm run build`. Manual database workflows and Lighthouse results are recorded in
the Part 2 and Part 3 changelogs.

No integration or end-to-end framework is configured. The browser tool available
in this environment has no viewport emulation, so responsive verification used
DOM structure and computed styles at desktop width rather than device captures.

## 11. Known limitations and blocked areas

- HR, workflow automation, AI/ML, integrations/API keys/webhooks,
  subscriptions/entitlements, the data marketplace, document file storage,
  notifications/email, module preferences, branches and invitation acceptance
  remain blocked by absent backend capabilities. No placeholder UI was created.
- Tenant creation is partial onboarding: the platform can create and suspend a
  tenant, but cannot assign an owner, send an invitation or deliver email.
- Onboarding dismissal is browser-local, not a persisted user preference.
- Project milestones exist only in the schema.
- The Content Security Policy allows inline scripts and styles required by the
  Next.js bootstrap; a nonce-based policy needs a separate change.
- Production cookies require HTTPS (or `localhost`) for authenticated testing.
