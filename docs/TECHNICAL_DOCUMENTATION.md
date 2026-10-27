# ONO Technical Documentation

This document summarizes the technologies, runtime configuration, and engineering
constraints currently present in the repository. The source code and
`prisma/schema.prisma` are authoritative when they differ from this overview.

## Technology stack

| Area | Current repository dependency |
| --- | --- |
| Runtime | Node.js 20.9 or newer |
| Framework | Next.js 16 App Router |
| Language | TypeScript 5.9, strict configuration |
| UI | React 19, Tailwind CSS 4 |
| Database access | Prisma 6 |
| Database | PostgreSQL |
| Validation | Zod 4 |
| Password hashing | `@node-rs/argon2` |
| Lint | ESLint 9 with Next.js configuration |
| Unit/integration test tooling | Vitest 3 |

Dependency versions are recorded in `package.json` and `package-lock.json`; check
those files for exact installed versions.

## Application runtime

- The web application and API routes run through Next.js.
- `src/app` contains App Router pages and API route handlers.
- PostgreSQL access is through the generated Prisma client.
- Most tenant API requests resolve a session and active membership before
  delegating to a domain service.
- The repository includes database migrations. Their presence does not prove
  that any particular database has been migrated.

## Environment configuration

Use `.env.example` as the list of expected local settings. Never commit `.env` or
copy its secret values into documentation or logs.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `AUTH_SECRET` | Session/token signing secret; production requires at least 32 characters |
| `NEXT_PUBLIC_APP_URL` | Public application URL; defaults to `http://localhost:3000` |
| `NODE_ENV` | Runtime environment |
| `LOG_LEVEL` | Operational log level |
| `APP_VERSION` | Application version label |

The server-side environment contract is in `src/lib/configuration/env.ts`.
`getServerEnv()` validates settings lazily. Production validation rejects a
missing/known-insecure auth secret and a localhost database URL.

## Operational scripts

See `package.json` for the canonical script list. Common commands:

```powershell
npm run dev
npm run build
npm start
npm run typecheck
npm run lint
npm run db:generate
npm run db:migrate
npm run db:studio
```

`npm run db:push` exists for direct schema synchronization; it does not create
tracked migration history. Prefer reviewed migrations for shared environments.
Do not run schema-changing commands against a production database without an
approved backup and migration procedure.

## Engineering constraints

- Keep database reads and writes in server-side code.
- Treat all request data as untrusted; validate it at the route/service boundary.
- Derive user roles and tenant membership from authenticated server state.
- For tenant-owned records, scope database operations by the trusted tenant
  context; never accept a browser-supplied tenant ID as proof of authorization.
- Keep secrets and personal or tenant data out of client bundles and logs.
- Do not describe a feature as verified unless its checks were actually run.

Related references: [Code Documentation](./CODE_DOCUMENTATION.md),
[Project Architecture](./PROJECT_ARCHITECTURE.md),
[API Documentation](./API_DOCUMENTATION.md), and
[Database Schema Documentation](./DATABASE_SCHEMA_DOCUMENTATION.md).
