# ONO Code Documentation

This guide maps current source code and records what is and is not implemented.
The source is the authority for exact behaviour; the Prisma schema is the
authority for persisted fields.

## 1. Repository layout

```text
src/
  app/                     Next.js routes, layouts, pages, API handlers
    (auth)/                Login and public/authentication pages
    (platform)/            Platform administration pages
    (workspace)/           Tenant workspace pages and module screens
    api/                   JSON route handlers
  components/              Shared UI and domain components
  lib/
    api/                   Tenant API context, pagination, serialization
    auth/                  Sessions, password/token utilities, API guards
    configuration/         Server environment parsing
    crm/                   CRM scoring, forecasting, automation rules
    database/              Prisma client
    permissions/           Role/permission context and checks
    resources/              Shared resource registry and Zod schemas
  server/services/
    audit/                 Audit service
    crm/                   CRM, events, automation, copilot
    notifications/         In-app notifications
    platform/               Platform users, tenants, settings, overview, audit
    tenant/                 Tenant records and document lines
    testimonials/           Testimonial submission and moderation
    workspace/              Workspace membership, roles and governance
prisma/
  schema.prisma             Current database model
  migrations/               Migration history
  seed.mjs                  Local development seed
```

`src/features/` may contain placeholder/module folders; current business UI and
logic are mainly in `src/app`, `src/components`, `src/lib`, and
`src/server/services`. The folder name alone does not mean a module is built.

## 2. Application routes

### Pages

- Authentication and public: `/login`, `/access-denied`; public testimonial
  content is presented where used by the login experience.
- Additional account routes: `/sign-in`, `/sign-up`, `/forgot-password`,
  `/reset-password`, `/verify-email`, `/session-expired`, and
  `/account/security`.
- Workspace: `/app`, `/app/leads`, `/app/contacts`, `/app/companies`,
  `/app/opportunities`, `/app/crm`, `/app/crm/pipeline`,
  `/app/crm/insights`, `/app/crm/automations`, `/app/projects`,
  `/app/tasks`, `/app/products`, `/app/quotations`, `/app/sales-orders`,
  `/app/suppliers`, `/app/purchase-orders`, `/app/invoices`, `/app/payments`,
  `/app/expenses`, `/app/support-cases`, `/app/warehouses`,
  `/app/stock-movements`, `/app/analytics`, `/app/settings`, and record-detail
  routes for supported resources.
- Platform administration: `/admin`, `/admin/tenants`, `/admin/users`,
  `/admin/testimonials`, `/admin/settings`, and audit views.

The exact route tree is discoverable under `src/app`; pages may be added or
renamed independently of this high-level inventory.

### Shared tenant resource framework

`src/lib/resources/registry.ts` defines 17 resource keys, UI metadata, permitted
operations, fields, display columns and sort options. `schemas.ts` defines
server-side create/update schemas. `src/server/services/tenant/records.service.ts`
owns shared record operations. `ResourceWorkspace` and related components
provide common list, filter, sorting, pagination, form, validation, and error
states.

Supported generic resources: leads, contacts, companies, opportunities,
projects, tasks, products, quotations, sales orders, suppliers, purchase
orders, invoices, payments, expenses, support cases, warehouses, and stock
movements. Resource-specific fields and rules are deliberately not identical;
see the registry, Zod schemas, and service for current details.

Document resources have detail and line-item operations. Server code computes
document totals; do not move accounting authority to UI code. The resource
registry also controls immutable/delete restrictions.

## 3. Important server modules

| Area | Source | Responsibility |
| --- | --- | --- |
| Authentication | `src/lib/auth/session.ts`, `password.ts`, `guards.ts` | Session creation/resolution/revocation, actor context and route guards. |
| Authorization | `src/lib/permissions/authorize.ts` | Permission catalogue, role resolution and server-side checks. |
| Tenant API | `src/lib/api/tenant.ts` | Active tenant context, membership and permission checks, pagination and JSON serialization. |
| Generic resources | `src/lib/resources/`, `src/server/services/tenant/` | Registry, Zod input schemas, shared data operations and document lines. |
| CRM | `src/server/services/crm/crm.service.ts`, `events.service.ts` | CRM actions, events/timelines, stage history and related records. |
| CRM scoring | `src/lib/crm/scoring.ts` | Explainable scoring/probability baselines; not trained ML. |
| CRM automation | `src/lib/crm/automation.ts`, `src/server/services/crm/automation.service.ts` | Bounded trigger/condition/action rules, run history, idempotency and sweep. |
| CRM copilot | `src/server/services/crm/copilot.service.ts` | Permission-scoped deterministic answers and optional provider adapter. |
| Audit | `src/server/services/audit/`, `platform/audit.service.ts` | Tenant/platform audit read and write operations. |
| Workspace governance | `src/server/services/workspace/` | Membership, workspace settings, roles and permission governance. |
| Platform admin | `src/server/services/platform/` | Tenant/user administration, settings and overview. |
| Testimonials | `src/server/services/testimonials/` | Consent-aware submission, moderation, publication and public projection. |
| Notifications | `src/server/services/notifications/` | In-app notifications; not external delivery. |

API endpoints are catalogued in [API documentation](API_DOCUMENTATION.md).

## 4. Current product/module status

| Area | Status in current source | Boundary |
| --- | --- | --- |
| Authentication and workspace access | Implemented core | Sign-in/up, verification and reset-token flows, database-backed sessions, active workspace, permission guards, session expiry warning, account profile/security settings. Production email delivery is not configured; no invitation acceptance or MFA. |
| Tenant/platform administration | Partial | Platform tenant/user actions and workspace settings exist. Tenant creation does not complete onboarding or send invitations. |
| Members, roles, permissions, audit | Implemented core | Member directory, custom/system roles, permission assignment and audit view; no invitation workflow. |
| Testimonials | Implemented | Consent-aware submissions, moderation, publication/unpublication, feature/order and archive. No moderation email. |
| CRM and sales pipeline | Implemented | Lead/contact/company/opportunity flows, timelines, conversion, pipeline and insights. |
| CRM notifications/search | Implemented in-app | Tenant-scoped search and in-app notification centre; no email, SMS or push. |
| CRM copilot | Partial | Deterministic evidence-based answers; optional generative adapter not live-verified and no actions executed. |
| Quotations and orders | Implemented core | Lines/totals and status workflows; no PDF, e-signature or outbound email. |
| Procurement | Implemented core | Suppliers, purchase orders and lines; no supplier portal or approval chain. |
| Inventory | Implemented core | Products, warehouses, immutable movements and server-side stock protections; no barcode or transfer document. |
| Finance | Partial | Invoices, payments and expenses; no gateway, refunds, bank reconciliation, PDF delivery or full accounting ledger. |
| Projects and tasks | Implemented core | Project/task CRUD and lists; `Milestone` has no service/API/screen. |
| Support cases | Partial | Case CRUD; no customer linkage, email ingestion/replies, SLA timers or chat. |
| Analytics | Basic | Tenant-scoped summary metrics and CRM insights; no report builder, exports, scheduled delivery or trained forecast model. |
| File documents | Not implemented | `Document` stores metadata only; no upload/download/storage or malware scan. |
| Workforce/HR | Not implemented | No employee, payroll, attendance, leave or recruitment domain. |
| Marketing | Not implemented | No campaign, consent/suppression, attribution or outbound marketing workflow. |
| Industry configuration | Foundation only | Industry-related schema/API exists; the full declarative catalogue/profile and tenant-customisation vision is not complete. |
| General integrations/jobs | Not implemented | No provider connection manager, durable general job queue, worker, or external provider. |
| Audit/compliance | Partial | Audit records and views exist; no complete compliance programme, retention automation or export package. |
| Approvals/workflow engine | Not implemented | CRM automation is not a cross-module approval engine. |
| Data quality/governance | Partial | Some CRM quality indicators; no general data-quality/governance module. |
| AI/ML and inference | Baseline only | Rule/statistical scores and a bounded copilot; no trained ML, registry, serving or decision engine. |
| Data marketplace | Future | Not implemented; requires separate legal and governance approval. |

“Implemented” describes a working current feature area, not full coverage of
every proposed requirement or production certification.

## 5. API implementation map

Route handlers live under `src/app/api`. The API contains:

- Authentication: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
- Health: `/api/health`.
- Legacy/root resource endpoints: companies, contacts, expenses, industries,
  invoices, leads, memberships, opportunities, payments, products, projects,
  purchase orders, roles, suppliers, support cases, and tasks.
- Generic tenant APIs: `/api/tenant/[resource]`, item routes, and document line
  routes. The resource allow-list has 17 entries.
- CRM APIs: activity, search, copilot, lead conversion, opportunity stage
  change, automation list/item/run/sweep.
- Workspace/platform: tenants, users, settings, roles, member role assignment,
  workspace profile/switch, audit logs and notification endpoints.
- Testimonials: public/own-submission routes and platform moderation routes.

See [API documentation](API_DOCUMENTATION.md) for methods, access boundaries,
query shape and response conventions.

## 6. Tests

Vitest is used for unit tests. Test coverage currently includes formatting and
redirect helpers, permission catalogue, resource registry, testimonial
privacy/masking, CRM scoring/forecasting, automation validation, copilot intent
mapping, and CRM presentation helpers. There is no end-to-end or database
integration test suite. Use `npm test`; do not treat historical test reports as
a current run.

## 7. Change workflow

1. Find the route/page and its service before changing behaviour.
2. Derive tenant and actor from the authenticated session/workspace context.
3. Validate input with the existing Zod schema pattern.
4. Enforce permissions in server code; UI gating is only presentation.
5. Preserve domain rules such as immutability, decimal calculations,
   idempotency and consent.
6. Add/update focused tests and documentation.
7. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` as
   appropriate; review migration SQL before database changes.
