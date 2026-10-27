# ONO Developer Guide

This guide covers a local development workflow. Check with the project owner
before applying database changes or deploying.

## Prerequisites

- Node.js 20.9 or newer.
- npm.
- PostgreSQL for database-backed functionality and tests.
- A local `.env` configured from `.env.example`.

Never commit `.env` or share its contents. Do not use production credentials
for development.

## Setup

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Edit `.env` locally and provide the required `DATABASE_URL`. Configure a
development-only `AUTH_SECRET` when needed. The server environment validator is
defined in `src/lib/configuration/env.ts`.

Generate the Prisma client and start Next.js:

```powershell
npm run db:generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Stop the development
server with `Ctrl+C` in the terminal where it is running.

## Common checks

```powershell
npm run typecheck
npm run lint
npm run build
```

Tests use Vitest, but `package.json` currently has no `test` script. Inspect
test prerequisites, then use:

```powershell
npx vitest run
```

Database-backed integration tests require a configured test database. Do not
point them at production.

## Database workflow

Review schema changes in `prisma/schema.prisma` and create migrations with the
Prisma migration workflow against a development database. Inspect generated SQL
and test migration behavior before sharing it. Avoid `db:push` for changes that
need reproducible migration history.

## Making a change

1. Find the route, feature, service, validation schema, and Prisma models
   involved.
2. Keep HTTP parsing in route handlers and business rules in server services.
3. Validate input with the shared Zod schemas or a domain-specific schema.
4. Enforce authorization and tenant scope in server-side code.
5. Add or update tests, including tenant-isolation cases where relevant.
6. Update documentation for directly affected behavior.
7. Run the narrowest applicable tests, then typecheck, lint, and build as
   appropriate; report what actually passed.

## Adding an API route

- Place the handler under `src/app/api` following the existing path structure.
- For tenant-scoped endpoints, use `withTenant` from
  `src/lib/api/tenant-route.ts`.
- Use `readJsonBody` for JSON input and return consistent JSON/error shapes.
- Select permissions explicitly and verify them against
  `src/lib/permissions/rbac.ts`.
- Delegate business work to `src/server/services`.
- Do not trust tenant IDs, role names, or permissions from request bodies.

## Database safety and source control

- Confirm the target database before running migrations or schema commands.
- Do not commit generated secrets, `.env`, or real tenant data.
- Review `git status` before staging; stage only the intended files.
- Preserve unrelated local changes and existing stashes.
