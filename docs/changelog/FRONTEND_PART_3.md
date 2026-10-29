# Frontend implementation — Part 3 of 3

**Status:** Part 3 complete and verified against a production build.
**Date:** 2026-10-27
**Changes:** uncommitted.

This note records the third and final frontend delivery: responsive behaviour,
accessibility, guided onboarding, UI states, performance and security hardening,
automated tests, implementation documentation and final verification. It does not
add backend models. Modules without backend support remain blocked and are listed
in [`../features/FRONTEND_MODULE_STATUS.md`](../features/FRONTEND_MODULE_STATUS.md).

## Scope delivered

1. Responsive table-to-card layouts for shared resource lists, document lines,
   stock levels and workspace members, with no page-level horizontal scrolling.
2. WCAG 2.2 AA-oriented accessibility work: skip links, landmarks, dialog
   semantics, carousel and mobile-navigation ARIA, live regions, alert errors,
   focus visibility, reduced motion, forced colors and contrast-safe badges.
3. A dismissible workspace “Getting started” card and an optional four-step tour
   with permission-aware next steps.
4. Route-level loading skeletons and safe error boundaries for the workspace,
   platform console and root application.
5. Duplicate-submission protection and removal of redundant server refreshes
   after mutations whose API responses already update local state.
6. Browser security headers and CSP; session cookie hardening retained.
7. A Vitest unit suite for pure logic, with test scripts and configuration.
8. A consolidated implementation guide covering routes, APIs, components, env
   vars, auth boundaries, testimonial workflow, commands and limitations.

## Responsive behaviour

- `ResourceWorkspace` renders the existing desktop table at `md` and above and a
  labelled card list below it. Cards show the same values and only the actions
  the role permits. Loading, empty, error and permission states are identical in
  both layouts.
- `DocumentLines` uses a card editor on small screens and the table editor on
  larger ones. The totals summary remains visible and server-owned.
- `StockLevelsTable` and the workspace member directory use the same split.
- Long text wraps with `overflow-wrap: anywhere`; shell and dialog containers use
  `min-w-0` and viewport-constrained widths.
- The mobile navigation drawer exposes `aria-haspopup="dialog"` and
  `aria-expanded`, and closes through the primitive’s dialog behaviour.

## Accessibility

- The workspace shell has a “Skip to main content” link targeting
  `main#main-content`; the sign-in page links to the form.
- Carousel semantics and a polite live region were added to the public
  testimonial showcase.
- Dialogs expose Base UI generated `aria-labelledby`/`aria-describedby`; focus is
  managed by the primitive.
- List and table screens announce loading and result counts through polite live
  regions; errors use `role="alert"` and never render raw exceptions.
- A global `:focus-visible` fallback ring covers native links and controls, with a
  system `Highlight` outline in forced-colors mode.
- `prefers-reduced-motion` collapses animations, transitions and smooth scrolling.
- Status badge tones for success, information and danger now mix toward the
  foreground with `color-mix(in oklch, ...)` to reach 4.5:1 at badge text size.

## Onboarding

`GettingStarted` appears on `/app` only when the workspace has not dismissed it.
It shows up to three permission-aware next steps (CRM, sales, analytics) and
offers an optional tour. The tour has four steps, Back/Next/Finish/Skip controls,
and labelled dialog semantics.

Persistence uses browser `localStorage` under
`ono.onboarding.workspace.v1` with values `dismissed` or `completed`. The
component uses `useSyncExternalStore`, listens for `storage` and a local custom
event, and hides the card if storage is unavailable. This is a UI preference
only: the approved schema has no user-preference table, and the value is never
used for authorization or business decisions. Dismissal is therefore per browser
profile, not per account.

## UI states and mutations

- `src/app/(tenant)/app/loading.tsx`, `src/app/(platform-admin)/admin/loading.tsx`
  and `PageSkeleton` provide route-level loading feedback with a status region.
- Root, tenant and platform `error.tsx` files plus `global-error.tsx` render
  `RouteError`, which offers retry and a safe home link and shows only an opaque
  support reference.
- `not-found.tsx` provides a branded 404 with a route back into the app.
- Empty, validation, success, retry and permission-denied states remain part of
  the shared screens. `/access-denied` distinguishes platform, workspace and
  suspended-tenant scopes.
- Resource forms and document-line mutations disable their submit controls while
  a request is in flight and use refs to block duplicate submissions.
- `router.refresh()` was removed from `ResourceWorkspace` and the document-line
  editor because both already update state from the API response. This avoids a
  redundant server round-trip after every mutation.

## Performance and security

- Pages remain server components; interactivity stays in small client islands.
- Analytics and dashboard bars are server-rendered CSS, so no chart dependency or
  client chart bundle was added.
- The sign-in image uses `next/image` with `priority` and responsive `sizes`.
- `next.config.ts` adds CSP, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`, and
  disables `X-Powered-By`. CSP permits the inline bootstrap scripts/styles that
  Next.js emits; it is not yet nonce-based.
- Session cookies remain `httpOnly`, `SameSite=Lax`, `Path=/` and `secure` in
  production. Authorization is still re-checked in every server route and API
  handler; filtered navigation is not treated as a security boundary.
- Tenant and platform pages read the session cookie on the server, so they are
  request-time rendered. No shared `unstable_cache` or `revalidate` cache is used
  for tenant data.
- `isSafeInternalPath` centralises post-login redirect validation and is covered
  by unit tests.
- Public testimonial mapping was extracted to `src/lib/testimonials/public.ts` and
  is covered by unit tests for ID omission and per-field consent masking.

## Automated tests

Added `vitest` 4.1.12 and `vitest.config.mts`, with `npm test` and
`npm run test:watch` scripts.

| File | Coverage |
| --- | --- |
| `src/lib/format.test.ts` | Number, currency, date and identifier formatting, including the em-dash fallback. |
| `src/lib/auth/redirect.test.ts` | Accepts internal paths; rejects external, protocol-relative and malformed targets. |
| `src/lib/permissions/catalog.test.ts` | Catalogue uniqueness and permission-code shape. |
| `src/lib/resources/registry.test.ts` | Registry integrity, unique resource keys and required fields. |
| `src/lib/testimonials/public.test.ts` | Public mapping omits IDs and masks name/title/company without consent. |

There is no integration or end-to-end suite in the repository.

## Verification evidence

Environment: Next.js 16.4.3 production server on `localhost:3000`, PostgreSQL 16
on `127.0.0.1:5544`, seeded `Northwind Trading` workspace.

| Check | Result |
| --- | --- |
| `npm test` | 5 files, 17 tests passed. |
| `npm run typecheck` | Passed, no errors. |
| `npm run lint` | Passed, no warnings. |
| `npm run build` | Production build succeeded; 32 pages generated and the full route table rendered. |
| Lighthouse `/login` | Accessibility 1.0, best practices 1.0, SEO 1.0, no failures. |
| Lighthouse `/app` | Accessibility 1.0, best practices 1.0, SEO 1.0, no failures. |
| Lighthouse `/app/leads` | Accessibility 1.0, best practices 1.0, SEO 1.0, no failures. |
| Lighthouse `/app/settings` | Accessibility 1.0, best practices 1.0, SEO 1.0, no failures. |
| Lighthouse `/app/analytics` | Accessibility 1.0, best practices 1.0, SEO 1.0, no failures. |
| Lighthouse `/admin`, `/admin/tenants`, `/admin/testimonials` | Accessibility 1.0, best practices 1.0, SEO 1.0, no failures. |
| Security headers | CSP, COOP, Permissions-Policy, Referrer-Policy, `X-Content-Type-Options` present; `X-Frame-Options: DENY`; no `X-Powered-By`. |
| Onboarding dismiss | `localStorage` stored `dismissed`, card disappeared, stayed hidden after reload. |
| Onboarding tour | Four headings rendered in order; dialog had generated label/description IDs; Finish stored `completed` and closed. |
| Platform boundary | Tenant owner opening `/admin` reached `/access-denied?scope=platform` with a workspace link and sign-out. |
| Desktop overflow | `/app`, `/app/leads`, `/app/invoices`, `/app/settings`, `/app/analytics`, `/app/stock-levels`, `/admin`, `/admin/tenants`, `/admin/testimonials` had no horizontal page overflow at 1296px. |
| Responsive structure | Mobile card lists existed with the expected records and were hidden at desktop width; desktop tables were visible. |
| Empty states | `/app/invoices` and `/app/stock-levels` rendered their empty states with zero records. |
| Document lines | A temporary invoice with one 2 × 5 line rendered the desktop line table, the hidden `sm:hidden` card with the same values, subtotal/tax/total/paid/balance and the “How line items and totals work” disclosure, with no page overflow. The fixture was removed afterwards. |

Lighthouse before the badge contrast fix reported 0.96–0.97 with `color-contrast`
failures (information text 3.43:1, success text about 4.0:1). After the
`color-mix` change and rebuild, all audited routes scored 1.0.

## Files changed in Part 3

| Area | Files |
| --- | --- |
| Responsive and accessibility | `src/app/globals.css`, `src/components/app/app-shell.tsx`, `src/app/(auth)/login/page.tsx`, `src/components/auth/testimonial-carousel.tsx`, `src/components/workspace/resource-workspace.tsx`, `src/components/workspace/document-lines.tsx`, `src/components/workspace/stock-levels-table.tsx`, `src/app/(tenant)/app/settings/page.tsx` |
| Badge contrast | `src/components/app/status-badge.tsx` |
| Onboarding | `src/components/app/onboarding.tsx`, `src/app/(tenant)/app/page.tsx` |
| Route states | `src/components/app/route-states.tsx`, `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`, `src/app/(tenant)/app/error.tsx`, `src/app/(tenant)/app/loading.tsx`, `src/app/(platform-admin)/admin/error.tsx`, `src/app/(platform-admin)/admin/loading.tsx` |
| Security | `next.config.ts`, `src/lib/auth/redirect.ts`, `src/components/auth/login-form.tsx` |
| Testable privacy helper | `src/lib/testimonials/public.ts`, `src/server/services/testimonials/testimonials.service.ts` |
| Tests and tooling | `vitest.config.mts`, `package.json`, `package-lock.json`, `src/lib/format.test.ts`, `src/lib/auth/redirect.test.ts`, `src/lib/permissions/catalog.test.ts`, `src/lib/resources/registry.test.ts`, `src/lib/testimonials/public.test.ts` |
| Documentation | `docs/features/FRONTEND_MODULE_STATUS.md`, `docs/features/FRONTEND_IMPLEMENTATION_GUIDE.md`, this changelog |

## Test data cleanup

The temporary QA invoice, its line and its line audit entry were deleted after
the responsive check. Invoice, invoice-line and payment counts returned to zero.
No seeded account, permission, role or tenant was changed.

## Known limitations

- The browser automation tool has no viewport or device-emulation command.
  Mobile and tablet layouts were verified structurally, not by screenshots at
  each breakpoint.
- Only unit tests exist; there is no integration, contract or end-to-end suite.
- Lighthouse in this environment reports accessibility, best practices and SEO
  but does not emulate a device or run a performance benchmark.
- CSP permits inline scripts and styles because of the Next.js bootstrap. A
  nonce-based policy needs a dedicated change and regression pass.
- Onboarding state is browser-local and can be reset by clearing site data.
- Production cookies are `secure`, so authenticated checks need HTTPS or
  `localhost`.

## Not claimed complete

Part 3 hardens and verifies the frontend delivered in Parts 1–3. It does not add
the blocked backend capabilities (HR, workflow automation, AI/ML, integrations,
subscriptions, marketplace, file storage, notifications, module preferences,
branches or invitation acceptance), and it does not make the platform as a whole
production-ready. The feature matrix remains the authority on what works.

All changes remain uncommitted. No commit, push or deployment was performed.
