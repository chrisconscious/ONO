# ONO Developer Guide

This guide covers getting the current repository running and making safe
changes. See the [code guide](CODE_DOCUMENTATION.md) for source locations and
the [technical guide](TECHNICAL_DOCUMENTATION.md) for runtime/security details.

## 1. Prerequisites

- Node.js 20.9 or later
- npm
- PostgreSQL with a database you may use for development
- Git

Check versions:

```powershell
node --version
npm.cmd --version
git --version
```

## 2. Local setup

From the repository root in PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` locally. Set a valid `DATABASE_URL` for your PostgreSQL database and
use a random `AUTH_SECRET` of at least 32 characters. Do not paste secrets into
source files or commit `.env`.

Install and initialize:

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

Open `http://localhost:3000/login`. The seed command is optional and is for a
disposable local database only. It supports `SEED_PLATFORM_EMAIL`,
`SEED_PLATFORM_PASSWORD`, `SEED_TENANT_EMAIL`, and `SEED_TENANT_PASSWORD`.
Override its development defaults; the script prints account information.
Never seed a production database.

Use `npm.cmd` in PowerShell if execution policy blocks `npm.ps1`; this avoids
changing machine-wide PowerShell policy.

## 3. Environment reference

| Name | Use |
| --- | --- |
| `DATABASE_URL` | PostgreSQL database used by Prisma. |
| `AUTH_SECRET` | Optional in schema parsing today; configure a random 32+ character secret for deployed environments. |
| `NEXT_PUBLIC_APP_URL` | App URL; local default is `http://localhost:3000`. |
| `AI_PROVIDER_ENABLED` | Optional, disabled by default. |
| `AI_PROVIDER_API_KEY` | Secret key for optional server-side copilot provider. |
| `AI_PROVIDER_MODEL` | Provider model name. |
| `AI_PROVIDER_BASE_URL` | Optional OpenAI-compatible endpoint. |

Seed overrides are documented in setup above. `.env.example` is the canonical
safe template. Do not share the contents of `.env`.

## 4. Daily commands

| Command | Description |
| --- | --- |
| `npm.cmd run dev` | Start Next.js in development mode. |
| `npm.cmd run build` | Compile the production build. |
| `npm.cmd run start` | Start the production server after a build. |
| `npm.cmd run lint` | Run ESLint. |
| `npm.cmd run typecheck` | Run TypeScript without emitting files. |
| `npm.cmd test` | Run Vitest once. |
| `npm.cmd run test:watch` | Run Vitest in watch mode. |
| `npm.cmd run db:generate` | Regenerate Prisma client. |
| `npm.cmd run db:migrate` | Create/apply development migrations. |
| `npm.cmd run db:push` | Push schema directly; local disposable DB only. |
| `npm.cmd run db:seed` | Populate development fixtures/accounts. |
| `npm.cmd run db:studio` | Open Prisma Studio. |

## 5. Making a change

1. Confirm the current branch and worktree before editing:

   ```powershell
   git status --short --branch
   ```

2. Trace the relevant page/API handler into its service and shared helpers.
3. Reuse the tenant/resource registry, Zod validation, permission helpers and
   existing UI patterns where they fit.
4. Derive tenant and actor from the verified session/workspace. Never authorize
   from a browser-provided tenant ID.
5. Keep domain calculations and state transitions server-side. Preserve
   auditability, consent, idempotency and immutable transaction history.
6. For schema changes, add a migration and review its SQL; update seed data and
   affected API/UI schemas.
7. Add focused tests for the behaviour and security boundary.
8. Run the smallest relevant validation, then broader checks as appropriate:

   ```powershell
   npm.cmd run lint
   npm.cmd run typecheck
   npm.cmd test
   npm.cmd run build
   ```

9. Inspect `git diff --check` and `git diff` before committing. Keep unrelated
   local changes intact.

## 6. Database workflow

- Prefer Prisma migrations over direct database edits.
- `db:push` is for disposable local development only; it does not create a
  reviewed migration history.
- Never point seed or destructive experiments at production.
- Do not remove or rewrite a migration already applied to shared environments.
- Use a disposable database for migration tests. Back up before any production
  schema change.
- Prisma Studio can display sensitive data; do not expose it on a public
  interface.

## 7. Test strategy and known gaps

The current automated suite is Vitest unit testing. It covers selected pure
logic and helper behaviour, including permissions, resource registry,
testimonial privacy, CRM scoring/forecasting, automation rules and copilot
intent. No database integration, API contract, browser end-to-end or external
provider test suite is configured.

When adding a feature, test positive behaviour and rejected/unauthorized cases.
For tenant-owned records, include tests that prove a caller cannot read or
mutate another tenant's record. For money and stock, test boundaries and
rounding. For public data, test consent and field projection.

## 8. Common issues

### PowerShell says `npm.ps1` cannot be loaded

Use `npm.cmd <command>` in PowerShell (for example `npm.cmd run dev`) rather
than changing the execution policy.

### Prisma client is missing or stale

Run `npm.cmd run db:generate`. `npm install` also runs Prisma generation through
the package `postinstall` script.

### Prisma cannot connect

Check that PostgreSQL is running, the database exists, `DATABASE_URL` is
correct, and the account has the needed local development privileges. Do not
paste the full connection string into logs or chat.

### Migration command fails

Read the Prisma error and inspect migration state. Do not reset a database,
delete migration history, or use `db:push` as an automatic workaround. Back up
valuable data and resolve drift deliberately.

### Login fails in a fresh database

Confirm migrations succeeded and, if appropriate, seed a disposable local
database with overridden `SEED_*` credentials. The seed script is not a
production account provisioning mechanism.

### Build requires environment values

Use a local `.env` based on `.env.example`. Avoid importing server-only
environment parsing into client bundles. Follow the Next.js version-specific
guidance in `node_modules/next/dist/docs/` when changing framework APIs.

## 9. Git and collaboration safety

- Do not commit `.env`, provider credentials, `node_modules`, or generated
  `.next` output.
- Inspect staged changes before committing; stage specific files rather than
  adding the entire worktree.
- Do not overwrite another contributor's uncommitted changes.
- For database or authorization changes, describe migration and security impact
  in the change summary.
- Do not push or commit changes unless requested by the project owner.

## 10. Current product constraints for contributors

Do not represent planned modules as already implemented. There is no full HR,
marketing, approval, file-storage, email/SMS/calendar, payment-provider,
general integration/job, trained ML, or data-marketplace implementation.
Scoring and forecasts are baselines; the CRM copilot does not execute actions.
The architecture document contains a fuller scope and marks plans separately
from current code.
