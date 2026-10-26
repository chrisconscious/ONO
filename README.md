# ONO

A multi-tenant business operations platform: CRM, sales, finance, inventory,
procurement, projects, workforce, analytics and AI insights in one system.

This repository currently contains the application scaffold — bootable, typed,
linted and ready for feature work.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.9 (strict) |
| UI | React 19 + Tailwind CSS 4 |
| Database | PostgreSQL via Prisma 6 |
| Validation | Zod 4 |
| Lint | ESLint 9 + `eslint-config-next` |

## Getting started

Requires Node.js 20.9+ (developed on Node 24).

```bash
npm install
cp .env.example .env      # then edit DATABASE_URL / AUTH_SECRET
npm run db:generate       # generate the Prisma client
npm run dev               # http://localhost:3000
```

`npm install` already runs `prisma generate` through `postinstall`.

To create the schema in your database:

```bash
npm run db:push                                   # quick sync, no migration history
npm run db:migrate -- --name init_schema          # or a tracked migration
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over the repo |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Push schema to the database |
| `npm run db:migrate` | Create/apply migrations |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```text
prisma/
  schema.prisma          # data model (Tenant, User)
  migrations/            # tracked SQL migrations
src/
  app/
    (auth)/              # sign-in, sign-up, password flows
    (tenant)/            # tenant-facing application shell
    (platform-admin)/    # internal admin console
    api/                 # route handlers (api/health is live)
    layout.tsx           # root layout
    page.tsx             # landing page
    globals.css          # Tailwind entry + theme tokens
  components/
    ui/                  # primitives (buttons, inputs, ...)
    shared/              # cross-feature composites
  config/                # app-level configuration
  features/              # vertical slices, one per business module
    ai-insights/  analytics/  crm/  finance/  inventory/
    procurement/  projects/   sales/  workforce/
  lib/
    auth/                # session + authentication helpers
    configuration/       # typed environment contract
    database/            # Prisma client singleton
    permissions/         # role and tenancy checks
    validation/          # shared Zod schemas
  server/
    jobs/                # background work
    repositories/        # data access
    services/            # business logic
  types/                 # shared TypeScript types
tests/
  unit/  integration/  e2e/
docs/
  architecture/  database/  api/  security/  deployment/ ...
```

## Conventions

- **Tenancy:** every tenant-scoped table carries a `tenantId`; access checks
  live in `src/lib/permissions`.
- **Feature slices:** a feature owns its components, server actions and
  schemas under `src/features/<module>`; nothing else imports from inside it
  except its public entry points.
- **Data access:** route handlers and server components call
  `src/server/services`, which call `src/server/repositories`. Prisma is not
  imported outside `src/server` and `src/lib/database`.
- **Environment:** server configuration is validated once through
  `getServerEnv()` in `src/lib/configuration/env.ts`.
- **Secrets:** `.env` is git-ignored; only `.env.example` is committed.

## Health check

`GET /api/health` returns:

```json
{ "status": "ok", "service": "ono", "timestamp": "..." }
```
