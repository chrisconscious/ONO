# ONO

ONO is a multi-tenant business operations platform for organisations that need a
shared workspace for customer relationships, sales, finance, procurement,
inventory, projects and operational reporting. It is an active product codebase,
not an empty scaffold; the full product vision is broader than the features
currently implemented.

## Start locally

**Requirements:** Node.js 20.9 or later, npm, and PostgreSQL.

1. Copy `.env.example` to `.env` and set `DATABASE_URL`. Set a random
   `AUTH_SECRET` of at least 32 characters. Keep `.env` private and untracked.
2. Install dependencies: `npm.cmd install` (use `npm` on shells where its
   executable is permitted).
3. Generate the Prisma client: `npm.cmd run db:generate`.
4. Apply local development migrations: `npm.cmd run db:migrate`.
5. Optionally seed a local-only database: `npm.cmd run db:seed`. The seed script
   has development defaults and prints account information; override its
   accounts with `SEED_PLATFORM_EMAIL`, `SEED_PLATFORM_PASSWORD`,
   `SEED_TENANT_EMAIL`, and `SEED_TENANT_PASSWORD`. Never seed production.
6. Start the app: `npm.cmd run dev`, then open `http://localhost:3000/login`.

The actual seed implementation is the authority for local account creation.
Do not copy seed passwords into documentation, source control, or production.

## Current stack

Next.js 16 App Router, React 19, TypeScript, PostgreSQL, Prisma 6, Zod 4,
Tailwind CSS 4 and Vitest 4. Node 20.9+ is required. PostgreSQL is the
operational system of record.

## Current implementation

The app has database-backed sign-in and sessions, platform and tenant
workspaces, permission-aware navigation, CRM and sales pipeline, quotations and
orders, invoicing and payments, expenses, inventory, procurement, projects and
tasks, support cases, basic analytics, testimonials and moderation, audit
records, and bounded CRM automation/copilot features. Exact scope and
limitations are recorded in the architecture and code guides. The complete
23-module product vision is not yet implemented.

## Repository map

```text
src/app/                 App Router pages, layouts, and API route handlers
src/components/          Shared and domain-specific UI
src/lib/                 Authentication, permissions, validation, resources, utilities
src/server/services/     Server-side domain and application services
prisma/schema.prisma     Database schema (authoritative)
prisma/migrations/       Reviewed database migration history
prisma/seed.mjs          Development-only seed routine
```

## Checks and commands

| Command | Purpose |
| --- | --- |
| `npm.cmd run dev` | Local development server |
| `npm.cmd run build` | Production build |
| `npm.cmd run start` | Serve a production build |
| `npm.cmd run lint` | ESLint |
| `npm.cmd run typecheck` | TypeScript check |
| `npm.cmd test` | Vitest unit tests |
| `npm.cmd run test:watch` | Vitest watch mode |
| `npm.cmd run db:generate` | Generate Prisma client |
| `npm.cmd run db:migrate` | Create/apply local development migrations |
| `npm.cmd run db:push` | Push schema directly (development only) |
| `npm.cmd run db:seed` | Seed a development database |
| `npm.cmd run db:studio` | Open Prisma Studio |

## Documentation

- [Technical documentation](docs/TECHNICAL_DOCUMENTATION.md)
- [Code documentation](docs/CODE_DOCUMENTATION.md)
- [Project architecture document](docs/PROJECT_ARCHITECTURE_DOCUMENT.md)
- [API documentation](docs/API_DOCUMENTATION.md)
- [Database schema documentation](docs/DATABASE_SCHEMA_DOCUMENTATION.md)
- [Developer guide](docs/DEVELOPER_GUIDE.md)

The current source and database schema define implemented behaviour. Product
vision, target architecture, and proposed requirements in the architecture
guide are explicitly labelled and must not be mistaken for shipped features.
