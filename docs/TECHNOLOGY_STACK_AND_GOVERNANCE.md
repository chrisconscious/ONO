# ONO — Technology Stack and Language Governance

| Field | Value |
| --- | --- |
| Document | Technology Stack and Governance |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` |
| Rule | This document describes what **is** installed separately from what is **planned**. Planned items are never described as present. |

---

## 1. How to read this document

- **Verified present** — inspected in the repository on 2026-10-26 and confirmed
  by `npm ls`, the lockfile, and successful `build` / `typecheck` / `lint` runs.
- **Planned** — direction only. Not installed, not configured, not approved.
- **Planned** items require an approved ADR before adoption (`C-07`).

## 2. Verified present

### 2.1 Runtimes and tooling

| Technology | Version | Role | Evidence |
| --- | --- | --- | --- |
| Node.js | 24.22.1 | JavaScript runtime for the Next.js app and tooling | `node --version` |
| npm | 11.19.1 | Package manager, lockfile authority | `npm --version`, `package-lock.json` |
| Git | 2.55.0 | Version control | `git --version` |
| Git Credential Manager | system | HTTPS credential storage for GitHub | `credential.helper=manager` |
| PowerShell | 5.1 (Windows host) | Shell used for local tasks | Host environment |

> **Windows note:** PowerShell execution policy blocks `npm.ps1` on this machine.
> Use `npm.cmd` for scripted commands until the policy is changed deliberately.

### 2.2 Application dependencies (installed)

| Technology | Version | Role | Location |
| --- | --- | --- | --- |
| Next.js | 16.4.3 | App Router framework, routing, server runtime, build | `package.json` |
| React | 19.3.1 | UI runtime | `src/app/**` |
| React DOM | 19.3.1 | Web renderer | `src/app/**` |
| TypeScript | 5.9.3 | Type system, strict mode | `tsconfig.json` |
| Tailwind CSS | 4.3.3 | Utility-first styling, CSS-first configuration | `src/app/globals.css` |
| `@tailwindcss/postcss` | 4.3.3 | Tailwind build integration | `postcss.config.mjs` |
| Prisma CLI | 6.19.3 | Schema tooling, client generation | `prisma/schema.prisma` |
| `@prisma/client` | 6.19.3 | Generated typed database client | `src/lib/database/prisma.ts` |
| Zod | 4.6.7 | Runtime validation of environment and contracts | `src/lib/configuration/env.ts` |
| ESLint | 9.39.5 | Static analysis | `eslint.config.mjs` |
| `eslint-config-next` | 16.4.3 | Next.js, React, accessibility and TypeScript rules | `eslint.config.mjs` |

### 2.3 Type and tooling packages

| Package | Version | Purpose |
| --- | --- | --- |
| `@types/node` | 26.6.5 | Node type definitions |
| `@types/react` | 19.3.0 | React type definitions |
| `@types/react-dom` | 19.3.0 | React DOM type definitions |

### 2.4 Languages actually present in the repository

| Language | Files | Purpose |
| --- | --- | --- |
| TypeScript (`.ts`, `.tsx`) | 7 | Application code, configuration modules |
| CSS | 1 | Tailwind entry and design tokens |
| JavaScript (`.mjs`) | 2 | Build configuration only (PostCSS, ESLint) |
| Prisma Schema Language | 1 | Data model definition |
| JSON | 3 | Package manifest, lockfile, TypeScript config |
| Markdown | 1 (now 17) | Documentation |

No Python, SQL, Java, C#, Go, Ruby, PHP, Rust or shell scripts are present.
There are **no database migrations** and **no SQL files**.

### 2.5 Verified build state

| Command | Result (2026-10-26) | Notes |
| --- | --- | --- |
| `npm run typecheck` | Exit 0 | Strict TypeScript, no errors |
| `npm run lint` | Exit 0 | No findings |
| `npm run build` | Exit 0 | Routes `/` (static), `/_not-found`, `/api/health` (dynamic) |
| `npm run db:generate` | Exit 0 | Client generated to `node_modules/@prisma/client` |
| Database connectivity | **Not verified** | No `DATABASE_URL`, no database instance, no migrations |

### 2.6 What exists in the repository today

| Area | State |
| --- | --- |
| Folder scaffold | Present (`src/app`, `src/features/*`, `src/lib/*`, `src/server/*`, `tests/*`, `docs/*`) |
| Root layout and styling | Present (`src/app/layout.tsx`, `src/app/globals.css`) |
| Landing page | Present at `/` — **conflicts with authentication-first requirement**, see `PROJECT_STATUS.md` |
| Health endpoint | Present at `/api/health` |
| Prisma schema | Minimal (`Tenant`, `User`, `UserRole`) — **no migration applied** |
| Prisma client singleton | Present (`src/lib/database/prisma.ts`) |
| Environment contract | Present and lazy (`src/lib/configuration/env.ts`) |
| Authentication | **Absent** — no provider, no session handling, no middleware |
| Authorisation | **Absent** — only empty `src/lib/permissions/` |
| shadcn/ui | **Absent** — no components installed |
| Test runner | **Absent** — no runner, no tests, empty `tests/*` |
| CI/CD | **Absent** — no pipeline configuration |
| ML service | **Absent** — no Python, no FastAPI |
| Background jobs | **Absent** — empty `src/server/jobs/` |

## 3. Planned technology (not installed)

| Technology | Intended role | Prerequisite decision | Phase |
| --- | --- | --- | --- |
| shadcn/ui (Radix primitives + Tailwind) | Accessible component system | `OD-006` component strategy | PH-04 |
| Authentication provider (to be selected) | Identity, sessions, MFA | `OD-003` provider choice | PH-05 |
| PostgreSQL 16+ | Primary relational database | `OD-002` database choice | PH-08 |
| Prisma Migrate | Reviewed schema migrations | `OD-004` ORM confirmation | PH-08 |
| Python 3.12+ | ML, forecasting, data science | `OD-007` separate service justification | PH-19 |
| FastAPI + Pydantic | ML service contracts | `OD-007` | PH-21 |
| Background job runner | Scheduled and asynchronous work | `OD-008` job technology | PH-10 |
| Object storage (S3-compatible) | Documents, attachments, exports | `OD-009` storage choice | PH-10 |
| Test stack (unit/integration/e2e) | Verification | `OD-010` tooling choice | PH-03 |
| CI/CD pipeline | Automated gates | `OD-011` platform choice | PH-03 |
| Observability stack | Logs, metrics, traces, alerts | `OD-012` | PH-10 / PH-26 |

Nothing in this table may be imported into the application until it is approved
and recorded as installed here.

## 4. Placement rules

| Concern | Permitted location | Forbidden |
| --- | --- | --- |
| UI primitives | `src/components/ui` | Feature-specific logic |
| Cross-feature composites | `src/components/shared` | Database or service imports |
| Feature slice | `src/features/<module>` | Deep imports from another feature |
| Server business logic | `src/server/services` | React imports, `next/*` request objects |
| Data access | `src/server/repositories` (plus `src/lib/database` for the client) | Prisma imports in components or features |
| Authorisation | `src/lib/permissions` | Client-only enforcement |
| Validation schemas | `src/lib/validation`, feature-local schemas | Ad hoc inline parsing of untrusted input |
| Environment | `src/lib/configuration` | `process.env` reads scattered across the app |
| Jobs | `src/server/jobs` | Long-running work inside request handlers |

These rules are enforced by review from PH-03 and, where practical, by lint
boundary rules.

## 5. Language governance

| Rule | Detail |
| --- | --- |
| LG-01 | TypeScript is the only language for application, server and API logic. |
| LG-02 | `any` is prohibited. Use `unknown` plus validation, or precise types. |
| LG-03 | Untrusted input is validated at the boundary with Zod before use. |
| LG-04 | HTML5/CSS3/Tailwind only for styling; no CSS-in-JS runtime introduced without an ADR. |
| LG-05 | SQL is permitted for reporting, aggregation and performance-critical queries, inside repositories, parameterised, reviewed. |
| LG-06 | Python is permitted only for ML/data science, behind a documented HTTP contract. |
| LG-07 | No new language, framework, database, queue or SaaS dependency without an approved ADR recording purpose, alternative considered, cost and exit path. |
| LG-08 | Every dependency must have a maintained release line, a licence compatible with commercial use, and a security review at adoption. |
| LG-09 | Prefer the platform's built-in capability over a new dependency when requirements are met. |
| LG-10 | Types are shared through explicit contracts, not by importing server internals into the client. |

## 6. Development, test, configuration and deployment per technology

| Technology | Develop | Test | Configure | Deploy |
| --- | --- | --- | --- | --- |
| Next.js | `npm run dev` (Turbopack) | Build + route checks; e2e later | `next.config.ts` | `npm run build` → `npm start` behind a reverse proxy |
| TypeScript | Editor + `npm run typecheck` | CI type gate | `tsconfig.json` | Compile-time only |
| Tailwind CSS | Dev server hot reload | Visual and accessibility checks | `globals.css` `@theme` tokens + `postcss.config.mjs` | Compiled into CSS at build |
| Prisma | `prisma generate`, `prisma studio` | Schema validation, migration review | `prisma/schema.prisma` + `DATABASE_URL` | `prisma migrate deploy` in release step |
| PostgreSQL | Local instance / container | Integration tests against a disposable database | Connection string per environment | Managed instance, backups, replicas |
| Zod | Colocated schemas | Unit tests per schema | N/A | Runtime |
| ESLint | `npm run lint` | CI lint gate | `eslint.config.mjs` | Build gate |
| GitHub | Branches, PRs | Required checks | Repository settings | Release tags |
| Python/FastAPI (planned) | Virtualenv + hot reload | Unit + contract tests | Environment-based config | Separate service, health-checked |
| Object storage (planned) | Local emulator | Upload/download permission tests | Bucket + credential policy | Managed bucket with lifecycle rules |

## 7. Configuration and secrets

| Rule | Detail |
| --- | --- |
| CFG-01 | Server configuration is read only through `getServerEnv()` in `src/lib/configuration/env.ts`. |
| CFG-02 | Only `NEXT_PUBLIC_*` values may reach the browser, and they must be non-sensitive. |
| CFG-03 | `.env` is ignored; `.env.example` documents required keys without values. |
| CFG-04 | Production secrets live in the deployment platform's secret manager, never in the repository. |
| CFG-05 | Every environment (`development`, `test`, `staging`, `production`) is separately configured and separately credentialed. |

## 8. Open technology decisions

| ID | Question | Blocking |
| --- | --- | --- |
| `OD-002` | PostgreSQL as primary datastore, or alternative? | PH-08 |
| `OD-003` | Authentication provider and session strategy | PH-05 |
| `OD-004` | Confirm Prisma versus alternative ORM/query builder | PH-08 |
| `OD-006` | shadcn/ui adoption and component ownership model | PH-04 |
| `OD-007` | Is a separate Python ML service justified, or is in-process TypeScript sufficient for v1? | PH-19 |
| `OD-008` | Background job technology | PH-10 |
| `OD-009` | Object storage provider | PH-10 |
| `OD-010` | Test tooling | PH-03 |
| `OD-011` | CI/CD platform and environment topology | PH-03 |
| `OD-012` | Observability vendor or self-hosted stack | PH-10 |

Full context in `OPEN_DECISIONS_AND_ASSUMPTIONS.md`.

## 9. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial inventory of installed versus planned technology. |
