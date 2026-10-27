# ONO Project Architecture

This is a description of the current code organization, not a claim that every
planned module is complete or production-ready.

## High-level structure

```text
Browser
  |
  v
Next.js App Router
  |-- pages and shared components
  |-- API route handlers
          |
          v
  Shared request/auth/permission helpers
          |
          v
  Server-side domain services and workflows
       |           |
       v           v
  Repositories   In-process events
       |
       v
  Prisma Client
       |
       v
  PostgreSQL
```

## Runtime layers

### Web and transport

Next.js App Router code is in `src/app`. API handlers translate HTTP input and
output. They should delegate domain decisions to server code rather than
implementing business rules inline.

### Identity and tenant context

Authentication helpers are in `src/lib/auth`. Tenant routes use
`src/lib/api/tenant-route.ts`: the server resolves the authenticated identity,
requires an `X-Tenant-Id` selection, validates active membership, and builds a
trusted context with permissions derived server-side. The supplied header alone
does not grant access.

Platform-level and public routes use separate access paths. Review each route
before assuming tenant middleware applies.

### Domain logic and persistence

Domain services live in `src/server/services`; workflow logic lives in
`src/server/workflows`; repositories live in `src/server/repositories`.
Persistence uses the Prisma client singleton at `src/lib/database/prisma.ts`
and the PostgreSQL schema in `prisma/schema.prisma`.

### Events and background work

`src/server/events/event-bus.ts` is an in-process event mechanism. The codebase
does not contain the claimed durable Stage 10 job queue, outbox consumer, or
webhook integration service. Do not rely on in-process events for durable
delivery across restarts.

## Tenancy and trust boundaries

- Authentication identity, membership, and role are resolved on the server.
- Tenant-scoped handlers obtain a `TenantContext` only after membership checks.
- Services must scope tenant-owned reads and writes using that trusted context.
- Request bodies, query parameters, path values, and headers are untrusted.
- Public endpoints must disclose only the data explicitly intended to be public.

## Main domain areas represented in code

CRM, sales, finance, inventory, procurement, projects, workforce, analytics/AI
insights, subscriptions/billing, organization provisioning, audit, governance,
and testimonials are represented in the current schema or server modules.
Presence in a schema or folder does not mean the user-facing behavior is
complete.

## Architecture boundaries

- Keep Prisma and server secrets out of client components.
- Keep HTTP concerns in App Router route handlers.
- Keep business rules and authorization-relevant checks server-side.
- Prefer domain services over direct database access from routes.
- Keep schema changes in reviewed Prisma migrations; do not treat
  `db:push` as a replacement for migration history.

See [Code Documentation](./CODE_DOCUMENTATION.md) for directory-level detail
and [Database Schema Documentation](./DATABASE_SCHEMA_DOCUMENTATION.md) for
the current model inventory.
