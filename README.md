# ONO

ONO is a multi-tenant business operations application built with Next.js,
TypeScript, PostgreSQL, and Prisma. The current repository includes application
code for areas such as CRM, sales, finance, inventory, projects, workforce,
analytics, subscriptions, billing, and data governance. A directory or schema
model alone does not mean that a feature is complete.

## Run locally

Requirements: Node.js 20.9 or newer, npm, and PostgreSQL for database-backed
features.

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Set `DATABASE_URL` in the local `.env`. Never commit or share that file. Then
run:

```powershell
npm run db:generate
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local Next.js development server |
| `npm run build` | Create production build |
| `npm start` | Run production build |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma development migration workflow |
| `npm run db:studio` | Open Prisma Studio |

Review database migrations and confirm the target environment before changing
database state.

## Documentation

- [Technical Documentation](./docs/TECHNICAL_DOCUMENTATION.md) — stack,
  configuration, and operational constraints.
- [Code Documentation](./docs/CODE_DOCUMENTATION.md) — codebase layout and
  module responsibilities.
- [Project Architecture](./docs/PROJECT_ARCHITECTURE.md) — runtime layers,
  trust boundaries, and data flow.
- [API Documentation](./docs/API_DOCUMENTATION.md) — implemented route
  inventory and authentication conventions.
- [Database Schema Documentation](./docs/DATABASE_SCHEMA_DOCUMENTATION.md) —
  current Prisma model groups and migration guidance.
- [Developer Guide](./docs/DEVELOPER_GUIDE.md) — local setup, checks, and
  contribution workflow.

The documentation describes the repository as inspected and may not list every
field or behavior. Source code and `prisma/schema.prisma` are authoritative.
