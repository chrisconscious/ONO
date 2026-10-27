# ONO API Documentation

API endpoints are implemented as Next.js App Router handlers under
`src/app/api`. This inventory reflects the routes currently present; inspect
their source for exact request fields, response details, and validation rules.
There is no generated OpenAPI specification in the current repository.

## Response and error conventions

Tenant-wrapped handlers generally return `{ "data": ... }`. Errors are
normalized by `src/lib/api/errors.ts` and `jsonError`. Collection and
resource-specific routes may differ; treat route code as authoritative.

## Tenant authentication

1. Sign in through `POST /api/v1/auth/login`; the server sets an HttpOnly
   session cookie.
2. Select an active organization by sending its ID in `X-Tenant-Id` on
   tenant-scoped requests.
3. The server verifies that the authenticated user has an active membership
   and derives the role and permissions itself.
4. The header is a selector, not proof of authorization. Never trust a
   browser-supplied role or permission.

Permission labels below are the ones passed by the route wrapper. Server
services may apply additional domain checks.

## Operational endpoints

| Method | Path | Access/purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Basic application health |
| `GET` | `/api/livez` | Liveness probe |
| `GET` | `/api/readyz` | Readiness probe |
| `GET` | `/api/metrics` | Operational metrics; inspect source for exposure controls |

## Authentication and bootstrap

| Method | Path | Access/purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Registration |
| `POST` | `/api/v1/auth/login` | Credential verification and session cookie |
| `POST` | `/api/v1/auth/logout` | Session logout |
| `GET` | `/api/v1/bootstrap` | Bootstrap/current-user application data |

## Tenant endpoints

| Method | Path | Route permission |
| --- | --- | --- |
| `GET`, `POST` | `/api/v1/leads` | `crm.read`, `crm.write` |
| `GET`, `PATCH`, `DELETE` | `/api/v1/leads/{id}` | See individual route |
| `POST` | `/api/v1/leads/{id}/convert` | See individual route |
| `GET`, `POST` | `/api/v1/opportunities` | See individual route |
| `POST` | `/api/v1/opportunities/{id}/stage` | See individual route |
| `GET` | `/api/v1/analytics/kpis?metric=sales-summary` | `analytics.read` |
| `GET` | `/api/v1/analytics/kpis?metric=receivables-aging` | `analytics.read` |
| `GET`, `POST` | `/api/v1/invoices` | `finance.read`, `finance.write` |
| `POST` | `/api/v1/invoices/{id}/payments` | See individual route |
| `POST` | `/api/v1/invoices/{id}/transition` | See individual route |
| `GET` | `/api/v1/members` | See individual route |
| `GET`, `POST` | `/api/v1/products` | See individual route |

Tenant endpoints require the session cookie and a valid `X-Tenant-Id`, unless
the route source explicitly documents otherwise.

## Platform and public endpoints

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/api/v1/platform/overview` | Platform administrator |
| `GET`, `POST` | `/api/v1/platform/testimonials` | Platform administration |
| `PATCH`, `DELETE` | `/api/v1/platform/testimonials/{id}` | Platform administration |
| `POST` | `/api/v1/platform/testimonials/{id}/approve` | Platform administration |
| `POST` | `/api/v1/platform/testimonials/{id}/withdraw` | Platform administration |
| `GET` | `/api/v1/public/testimonials` | Public published testimonials |

## Request examples

Sign-in example (use test credentials only in a local development environment):

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "developer@example.test",
  "password": "<local-test-password>"
}
```

Example tenant request:

```http
GET /api/v1/leads
Cookie: <session-cookie-set-by-login>
X-Tenant-Id: <active-tenant-id>
```

Do not put real passwords, session cookies, API keys, or tenant data in
documentation, shell history, screenshots, or source control.
