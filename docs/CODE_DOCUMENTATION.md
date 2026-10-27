# ONO Code Documentation

This guide describes the main source folders and their responsibilities as they
exist in the repository.

## Repository map

```text
prisma/
  schema.prisma       Prisma enums, models, relations, and indexes
  migrations/         Versioned SQL migration history
src/
  app/                Next.js pages, layouts, and API route handlers
  components/         Shared and UI components
  features/           Business feature areas
  lib/                Shared infrastructure, auth, validation, and helpers
  server/
    events/           In-process domain event bus
    repositories/     Data-access modules
    services/         Server-side business operations
    workflows/        Workflow and handover processing
tests/
  unit/               Unit tests
  integration/        Database-backed integration tests
  e2e/                End-to-end/API-level tests
```

## App Router

`src/app` holds pages and route handlers. An API route is implemented in a
`route.ts` file at a path corresponding to its URL. Keep transport-specific
work—reading headers, path parameters, and bodies—in the route handler. Routes
should call server-side services for business behavior.

## Feature areas

The current `src/features` directories are:

- `ai-insights`
- `analytics`
- `crm`
- `finance`
- `inventory`
- `procurement`
- `projects`
- `sales`
- `workforce`

Directory presence alone does not mean every feature is implemented. Confirm
that a feature has source files, tests, and an API/UI integration before calling
it complete.

## Server code

`src/server/services` contains domain operations such as CRM, finance, sales,
inventory, authentication, subscriptions, billing, provisioning, governance,
testimonials, and analytics/AI insights.

`src/server/repositories` contains data-access code. `src/server/workflows`
contains workflow automation and handover behavior. `src/server/events` holds
an in-process event bus; this is not a durable queue or an outbox processor.

## Shared libraries

| Directory | Responsibility |
| --- | --- |
| `src/lib/api` | Tenant route wrapper, API errors, and API client helpers |
| `src/lib/auth` | Session handling, credentials/tokens, and platform-admin checks |
| `src/lib/configuration` | Validated server environment contract |
| `src/lib/database` | Prisma client singleton |
| `src/lib/observability` | Health, metrics, logging, and redaction helpers |
| `src/lib/permissions` | Role and permission definitions/checks |
| `src/lib/security` | Security helpers such as rate limiting |
| `src/lib/validation` | Shared Zod request schemas |

## Request-to-database flow

For a protected tenant API, the usual flow is:

1. Next.js dispatches to `src/app/api/**/route.ts`.
2. `withTenant` in `src/lib/api/tenant-route.ts` resolves the session, checks
   active membership, and derives tenant permissions.
3. The route validates or parses request data and calls a service.
4. The service uses the trusted tenant context, validates domain rules, and
   performs Prisma operations.
5. The route returns a JSON response or a normalized API error.

Not every route uses `withTenant`: authentication, health, public, and
platform-level endpoints have different access requirements. Consult the route
implementation before changing access behavior.

## Tests

Tests live under `tests/unit`, `tests/integration`, and `tests/e2e`. Some
integration tests require a configured PostgreSQL database and test
environment. The current `package.json` does not define an `npm test` script;
use the repository's configured Vitest runner directly, and verify database
prerequisites before running integration suites.

## Naming and change guidance

- Prefer domain-named services and small, focused modules.
- Keep business rules in server-side services, not API handlers or UI code.
- Use Zod schemas for untrusted input.
- Keep tenant scoping explicit in every tenant-owned query.
- Add regression tests for behavior changes and update relevant documentation.
