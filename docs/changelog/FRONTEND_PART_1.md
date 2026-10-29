# Frontend implementation — Part 1 of 3

**Status:** Part 1 complete and verified against the running backend and database.
**Date:** 2026-10-27

This note records what was built in the first frontend delivery, how it was
verified, and what is deliberately left for Parts 2 and 3. It is not a claim
that the platform as a whole is finished.

## Scope delivered

1. Repository inspection and integration with the existing Next.js App Router
   project, Prisma schema, authentication helpers and service layer.
2. Shadcn UI setup using preset `b1Q5GC` (`base-nova` style, Base UI
   primitives, `cn` package, IBM Plex Sans, lucide icons), extended with ONO
   design tokens rather than replaced.
3. Split-screen sign-in screen with the approved photograph, exact required
   copy and a real-data testimonial carousel.
4. Platform administration console (Super Admin) with role-verified access.
5. Tenant workspace shell and first working modules (overview, leads, tasks,
   workspace settings, testimonial submission).
6. Real API/database integration for every screen and action in scope. No mock
   data or simulated authentication exists in the frontend.

## Backend additions required by the frontend

These were added because the approved UI patterns had no backing capability:

| Addition | Reason |
| --- | --- |
| `Testimonial` model + migration | The sign-in carousel must be fed by real, approved endorsements. |
| `PlatformSetting` model + migration | Platform settings screen needed persisted configuration. |
| `GET/POST /api/testimonials` | Public read of approved testimonials; member submission into the moderation queue. |
| `GET /api/admin/testimonials`, `PATCH /api/admin/testimonials/[id]` | Moderation queue and approve/reject decisions. |
| `GET/POST /api/admin/users`, `PATCH /api/admin/users/[id]` | Administrator listing and role changes. |
| `GET/PATCH /api/admin/settings` | Read and save platform configuration. |
| `PATCH /api/tenants/[id]` | Tenant lifecycle transitions used by the tenant detail screen. |
| `POST /api/workspace/switch` | Cookie-backed active-workspace selection, validated against memberships. |

No business rule was reimplemented in the frontend: validation mirrors server
constraints for early feedback only, and every mutation calls the API.

## Authorization corrections

Two defects in the existing API layer would have undermined the workspace
switcher and the permission-filtered navigation, so they were fixed in place:

- `getActorContext` now resolves the active tenant from the workspace cookie
  (validated against real memberships) instead of always taking the user's
  first membership. Roles and permissions are collected from that membership
  only, so authority in one workspace cannot leak into another. A stale or
  forged cookie fails closed with “No tenant context”.
- `GET/POST /api/leads` and `GET/POST /api/tasks` now enforce
  `PERM-LEAD.READ/CREATE` and `PERM-TASK.READ/CREATE` on the server. Hiding a
  button is not treated as authorization.

## Routes

| Area | Routes |
| --- | --- |
| Entry and auth | `/`, `/login`, `/access-denied` |
| Platform admin | `/admin`, `/admin/tenants`, `/admin/tenants/[id]`, `/admin/administrators`, `/admin/testimonials`, `/admin/audit`, `/admin/settings` |
| Tenant workspace | `/app`, `/app/leads`, `/app/tasks`, `/app/settings` |

Every navigation item resolves to a real route. Guards run in server layouts and
again in each page/service that reads data.

## Access model

- Platform access requires a session whose server-verified platform role is
  `PLATFORM_ADMIN`. Tenant administrators are redirected to
  `/access-denied?scope=platform`.
- Workspace access requires an active membership. The active workspace is chosen
  by cookie (validated against the actor's memberships) and suspended or closed
  tenants are refused with `/access-denied?scope=suspended`.
- Navigation is filtered server-side by permission codes. `PERM-LEAD.READ`,
  `PERM-LEAD.CREATE`, `PERM-TASK.READ` and `PERM-TASK.CREATE` are enforced by
  the seeded `Workspace Owner` role.
- Platform administrators receive no implicit tenant data access.

## Login screen

- Heading: “Sign in to your account.”
- Supporting text: “Secure access to your business intelligence and management
  platform.”
- Button: “Sign in”
- Image tagline: “Manage your business. Grow without limits.”
- The testimonial card sits over the lower image panel with a translucent,
  blurred surface, light border, bold white quote and a five-star rating when a
  rating exists.
- Previous/next controls sit bottom-right, respond to keyboard, mouse and touch,
  respect `prefers-reduced-motion`, hide when only one testimonial is approved,
  and never autoplay.
- With no approved testimonials the card renders a balanced statement of the
  platform's purpose — no invented names, quotes or ratings.

## Seed data

`npm run db:seed` creates only the accounts and access scaffolding needed to
sign in. It does not create testimonials or business records. Credentials are
printed by the script and can be overridden with `SEED_PLATFORM_EMAIL`,
`SEED_PLATFORM_PASSWORD`, `SEED_TENANT_EMAIL` and `SEED_TENANT_PASSWORD`.

## Verification evidence

Commands run locally against PostgreSQL on `127.0.0.1:5544` and the seeded
database:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passes with no errors. |
| `npm run lint` | Passes with no warnings. |
| `npm run build` | Production build succeeds; all application routes are dynamic as intended. |
| Login POST via `/api/auth/login` | `200` with `redirectTo: "/admin"` for the platform administrator and `"/app"` for the workspace administrator. |
| Unauthenticated `/` | Redirects to `/login`. |
| `/admin`, `/admin/tenants`, `/admin/administrators`, `/admin/testimonials`, `/admin/audit`, `/admin/settings` as platform admin | `200`. |
| Same admin routes as tenant administrator | `307` to `/access-denied?scope=platform`. |
| `/app`, `/app/leads`, `/app/tasks`, `/app/settings` as workspace owner | `200`. |
| `/app` as a platform administrator without membership | `307` to `/admin`. |
| `POST /api/leads`, `POST /api/tasks` | `201`, records persisted and counted on the workspace overview. |
| `GET /api/leads` with the role assignment removed | `403`; the same request succeeds again after restoring the role. |
| `GET/POST /api/leads` with a workspace cookie that matches no membership | `400` “No tenant context” (fails closed; no other tenant is used implicitly). |
| Testimonial submission → pending queue → approval → public endpoint | `201` → visible to admin → `PATCH` `200` → present in `GET /api/testimonials` and rendered in the sign-in HTML. The verification entry was deleted afterwards so no invented endorsement is published. |
| Tenant suspend → workspace request → reactivate | `307` to `/access-denied?scope=suspended`, then `200` after reactivation. |
| Workspace switch to a non-member tenant | `403`. |

## Deliberately deferred

- Part 2: the remaining tenant business modules, edit/status workflows that
  have no backend mutation routes yet, and deeper workspace administration.
- Part 3: expanded automated tests, security hardening review, deployment
  documentation and accessibility audit sign-off.

Billing and subscription screens are omitted because the backend has no billing
capability; adding UI for them would have required inventing state.
