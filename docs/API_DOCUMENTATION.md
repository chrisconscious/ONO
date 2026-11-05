# ONO API Documentation

This is a route catalogue for the current Next.js API handlers under
`src/app/api`. It documents the current unversioned `/api` surface, not the
proposed `/api/v1` architecture. Routes and exact validation are subject to
source changes. There is no generated OpenAPI/Swagger contract.

## 1. Authentication and tenant context

- `/api/auth/login` accepts credentials and creates the `ono_session` cookie.
- `/api/auth/logout` revokes the active session and clears the cookie.
- `/api/auth/logout-all` revokes all sessions owned by the current account.
- `/api/auth/me` returns the current actor and session deadlines without
  refreshing idle time.
- Registration, verification, reset, profile, preferences and session APIs
  validate requests server-side, use same-origin checks for mutations, and
  apply database-backed rate limits where appropriate.
- Tenant APIs resolve the active workspace from the authenticated actor's
  membership and workspace selection. A client-supplied tenant ID is not a
  trusted scope.
- `requireTenantApi(permission)` returns `401` without authentication and `403`
  when active membership, workspace state, or permission checks fail.
- Platform administration routes require the relevant platform permission;
  tenant roles do not become platform administrators.
- Public health and published testimonial reads do not require a tenant
  workspace. Other access depends on route/service guards.

## 2. Route inventory

### Authentication and health

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health response. |
| POST | `/api/auth/login` | Sign in. |
| POST | `/api/auth/logout` | Sign out/revoke session. |
| POST | `/api/auth/logout-all` | Revoke every session for the current account and sign out. |
| GET | `/api/auth/me` | Current actor and session deadline information; does not touch idle time. |
| POST | `/api/auth/register` | Create an unprivileged account and issue a verification email/token. No workspace access is granted. |
| POST | `/api/auth/forgot-password` | Request a password reset; response does not reveal account existence. |
| POST | `/api/auth/reset-password` | Consume a one-use reset token, update password, and revoke sessions. |
| POST | `/api/auth/verify-email` | Consume a one-use verification token. POST is required; opening the link alone does not verify. |
| POST | `/api/auth/resend-verification` | Request a new email verification link with a neutral response. |
| POST | `/api/auth/session/touch` | Explicitly continue a still-valid session from the expiry warning. |
| GET | `/api/auth/account/sessions` | List active session metadata for the authenticated account; never returns token hashes. |
| DELETE | `/api/auth/account/sessions/[id]` | Revoke one session belonging to the current account. |
| PATCH | `/api/auth/account/profile` | Update the current user's display name. |
| POST | `/api/auth/account/password` | Verify current password, change password, rotate current session, revoke others. |
| PUT | `/api/auth/account/preferences` | Save presentation-only user preferences. |

### Generic tenant resources

The registry allow-list is: `leads`, `contacts`, `companies`, `opportunities`,
`projects`, `tasks`, `products`, `quotations`, `sales-orders`, `suppliers`,
`purchase-orders`, `invoices`, `payments`, `expenses`, `support-cases`,
`warehouses`, `stock-movements`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/api/tenant/[resource]` | List or create an allow-listed tenant resource. |
| PATCH, DELETE | `/api/tenant/[resource]/[id]` | Update or delete a resource where registry rules allow it. |
| GET, POST | `/api/tenant/[resource]/[id]/lines` | Read or add supported document lines. |
| PATCH, DELETE | `/api/tenant/[resource]/[id]/lines/[lineId]` | Update or remove a supported document line. |

List query parameters include `page`, `limit`, `q`, `status`, and `sort` where
supported. Page is at least 1; `limit` is clamped to 1–100 (default 20); sort
options are resource-specific and allow-listed. The common list response is
`{ records, pagination }`; create/update responses use `{ record }`. Exact
filters, permissions, validation fields and immutable behaviour are in
`src/lib/resources/registry.ts`, `schemas.ts`,
`src/app/api/tenant/[resource]/route.ts`,
`src/app/api/tenant/[resource]/[id]/route.ts`, and the tenant record service.

### Legacy/root business routes

These coexist with the generic tenant resource API and may differ in response
shape and authorization implementation.

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/api/companies` | Companies. |
| GET, POST | `/api/contacts` | Contacts. |
| GET, POST | `/api/expenses` | Expenses. |
| GET, POST | `/api/industries` | Industry catalogue/custom requests as implemented by handler. |
| GET, POST | `/api/invoices` | Invoices. |
| GET, POST | `/api/leads` | Leads. |
| GET, POST | `/api/memberships` | Membership operations. |
| GET, POST | `/api/opportunities` | Opportunities. |
| GET, POST | `/api/payments` | Payments. |
| GET, POST | `/api/products` | Products. |
| GET, POST | `/api/projects` | Projects. |
| GET, POST | `/api/purchase-orders` | Purchase orders. |
| GET, POST | `/api/roles` | Roles. |
| GET, POST | `/api/suppliers` | Suppliers. |
| GET, POST | `/api/support-cases` | Support cases. |
| GET, POST | `/api/tasks` | Tasks. |

Inspect each handler before relying on uniform pagination, errors, or response
contracts; the older endpoints are not guaranteed to match the generic route.

### CRM and notifications

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/tenant/crm/activities` | Record a CRM activity. |
| GET | `/api/tenant/crm/search` | Tenant-scoped CRM search. |
| POST | `/api/tenant/crm/copilot` | Bounded copilot query; does not execute actions. |
| POST | `/api/tenant/crm/leads/[id]/convert` | Convert a lead under CRM rules and permissions. |
| POST | `/api/tenant/crm/opportunities/[id]/stage` | Change opportunity stage. |
| GET, POST | `/api/tenant/crm/automations` | List/create bounded CRM automation definitions. |
| GET, PATCH, DELETE | `/api/tenant/crm/automations/[id]` | Read/update/delete a workflow. |
| POST | `/api/tenant/crm/automations/[id]/run` | Run an automation. |
| POST | `/api/tenant/crm/automations/sweep` | Protected sweep for time-based triggers; requires an external caller/scheduler. |
| GET, PATCH | `/api/tenant/notifications` | List and update in-app notification state. |

### Workspace and platform administration

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/api/tenants` | Platform tenant list/create. |
| PATCH | `/api/tenants/[id]` | Platform tenant status/metadata update. |
| GET, POST | `/api/admin/users` | Platform user list/create. |
| PATCH | `/api/admin/users/[id]` | Platform user update. |
| GET, PATCH | `/api/admin/settings` | Read/update platform settings. |
| GET | `/api/audit-logs` | Audit list, permission-filtered. |
| PATCH | `/api/workspace/profile` | Update current workspace profile. |
| POST | `/api/workspace/switch` | Select an authorized workspace. |
| GET, POST | `/api/workspace/roles` | List/create workspace roles. |
| PATCH | `/api/workspace/roles/[id]` | Update an editable workspace role. |
| PATCH | `/api/workspace/members/[id]/roles` | Assign member roles. |

### Testimonials

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/api/testimonials` | Public published/consented listing and authenticated submission. |
| GET | `/api/testimonials/mine` | Current submitter's entries. |
| PATCH | `/api/testimonials/[id]` | Update own submission/consent within allowed states. |
| GET | `/api/admin/testimonials` | Platform moderation queue. |
| POST | `/api/admin/testimonials/reorder` | Reorder testimonial display. |
| GET, PATCH, DELETE | `/api/admin/testimonials/[id]` | Read, moderate/update, or archive/delete per handler rules. |

The public projection excludes internal IDs and moderation notes and masks
author name/title/company unless the corresponding consent is recorded.

## 3. Generic resource fields

The generic API validates resource-specific fields. This summary names the
business field families; exact requiredness, lengths, enum values, optional
blank handling, and create/update differences are defined by
`src/lib/resources/schemas.ts`.

| Resource | Main request fields |
| --- | --- |
| Leads | first/last name, email, phone, company, job title, industry, source, status, owner, estimated value/currency, expected conversion/last contact dates, lost reason, notes. |
| Contacts | first/last name, email, phone, title, status, owner, company, last contact date, notes. |
| Companies | name, industry, email, phone, website, size, status, owner, notes. |
| Opportunities | name, company, stage, amount/currency, close date, owner, description, next step, lost/won reason. |
| Projects | name, description, status, start/end dates, budget/currency. |
| Tasks | title, description, status, priority, assignee, due date, related record, outcome. |
| Products | name, SKU, description, type, price/currency, active flag. |
| Quotations | quote number, opportunity, status, validity, currency, notes and line operations. |
| Sales orders | order number, quotation, status, date, currency and line operations. |
| Suppliers | name, email, phone, active flag. |
| Purchase orders | PO number, supplier, status, dates, currency, notes and line operations. |
| Invoices | invoice number, sales order, status, issue/due dates, total/currency, notes and line operations. |
| Payments | invoice, positive amount, currency, method, reference, paid date, notes. |
| Expenses | description, positive amount/currency, category, vendor, date, status, receipt URL. |
| Support cases | subject, description, status, priority, assignee. |
| Warehouses | name, code, active flag. |
| Stock movements | product, warehouse, movement type, non-zero quantity, unit cost, reason, reference. |

Server services may compute or override fields such as tenant IDs, totals,
balances, status transitions, score metadata, and ownership context. Never trust
client-supplied derived values.

## 4. Permissions and errors

Permission codes and resource/action mapping are maintained in
`src/lib/permissions/` and the database seed. Route checks may be more specific
than a generic CRUD permission; inspect the handler before adding a client
feature. API errors are not yet standardized as RFC 9457 Problem Details across
all legacy and generic routes. Tenant helpers use `401` for missing
authentication and `403` for missing/invalid workspace access or permission.
Validation and domain-conflict statuses vary by handler. Never expose stack
traces, SQL, tokens, or provider secrets in an API error.

## 5. Not currently available

There is no MFA or invitation-acceptance API, public partner API version,
generated OpenAPI file, general integration/webhook API, file upload/download
API, payment-provider API, or full cross-module approval API. Email delivery
uses only a development console transport or disabled production transport;
configure and verify a real provider before enabling public account recovery or
verification. Do not infer unsupported services from proposed architecture or
schema placeholders.

## 6. Contract maintenance

When changing an endpoint, update this guide, validation schemas, permission
checks, UI callers, tests and response serialization together. Prefer the
tenant-scoped resource helpers where they fit; preserve special domain rules in
the owning service. Add request/response contract tests if an API test harness
is introduced.
