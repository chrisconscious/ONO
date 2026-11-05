# ONO Technical Documentation

**Status:** describes the repository at the time of this documentation
consolidation. Source files and migrations remain authoritative.

## 1. System summary

ONO is a TypeScript web application built as a modular monolith. The Next.js
application serves pages, server-rendered UI, and JSON route handlers. Domain
and application logic is primarily in server services. PostgreSQL is accessed
through Prisma. The current repository does not contain a separate deployed
worker, message broker, general-purpose job queue, object-storage adapter, or
external provider runtime.

The current stack and versions are pinned or bounded by `package.json`:

| Component | Current dependency |
| --- | --- |
| Runtime | Node.js `>=20.9.0` |
| Web framework | Next.js `16.4.3` |
| UI | React / React DOM `19.3.1` |
| Language | TypeScript `5.9.3` |
| Database client and ORM | Prisma / `@prisma/client` `6.19.3` |
| Database | PostgreSQL |
| Validation | Zod `4.6.7` |
| Styling | Tailwind CSS `4.3.3` |
| Tests | Vitest `4.1.12` |
| UI libraries | Base UI, Lucide, Sonner, shadcn CLI/components as listed in `package.json` |

`package.json` and `package-lock.json` are the dependency source of truth.

## 2. Runtime architecture

```text
Browser
  -> Next.js App Router page/layout or /api route handler
  -> session + active workspace resolution
  -> Zod/request validation
  -> permission and tenant checks
  -> server service
  -> Prisma / PostgreSQL
  -> response or server-rendered UI
```

- Server components are used for page reads where appropriate; client
  components provide interactive controls.
- The generic resource API and shared `ResourceWorkspace` reuse tenant scoping,
  permissions, validation, search, pagination, and form behaviour.
- Some older root API endpoints coexist with newer `/api/tenant/...` handlers.
  The API is not consistently versioned and does not have a generated OpenAPI
  contract.
- Decimal and date results are serialized before JSON responses where needed.
- CRM changes can create activities, stage history, notifications, and
  automation events. CRM automation is bounded and does not imply a general
  workflow or queue engine.

## 3. Configuration

Copy `.env.example` to `.env`; do not commit `.env` or paste secret values into
issues, documentation, logs, or chat.

| Variable | Required | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma. |
| `AUTH_SECRET` | Optional in the current parser | If supplied, at least 32 characters; provide a cryptographically random value in every deployed environment. |
| `NEXT_PUBLIC_APP_URL` | No | Public application URL; defaults to `http://localhost:3000`. |
| `AI_PROVIDER_ENABLED` | Optional | Optional CRM copilot provider switch; disabled by default. |
| `AI_PROVIDER_API_KEY` | When provider is enabled | Server-side provider key. Never expose it to client code. |
| `AI_PROVIDER_MODEL` | When provider is enabled | Provider model identifier. |
| `AI_PROVIDER_BASE_URL` | No | OpenAI-compatible provider base URL; defaults to the provider default documented in `.env.example`. |
| `SESSION_IDLE_MINUTES` | No | Standard-session idle timeout; defaults to 30 minutes. |
| `SESSION_ABSOLUTE_HOURS` | No | Standard-session hard limit; defaults to 12 hours. |
| `SESSION_WARNING_MINUTES` | No | Session warning lead time; defaults to 2 minutes. |
| `SESSION_REMEMBER_IDLE_DAYS` | No | Remember-me idle timeout; defaults to 7 days. |
| `SESSION_REMEMBER_ABSOLUTE_DAYS` | No | Remember-me hard limit; defaults to 30 days. |
| `SESSION_TOUCH_SECONDS` | No | Minimum gap between server-side idle timestamp writes; defaults to 60 seconds. |
| `SEED_PLATFORM_EMAIL` | Seed only | Development platform account override. |
| `SEED_PLATFORM_PASSWORD` | Seed only | Development platform password override. |
| `SEED_TENANT_EMAIL` | Seed only | Development tenant account override. |
| `SEED_TENANT_PASSWORD` | Seed only | Development tenant password override. |

The server environment parser in `src/lib/configuration/env.ts` validates
`NODE_ENV`, `DATABASE_URL`, optional `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL`.
The optional copilot provider reads its own settings in
`src/server/services/crm/copilot.service.ts`. Review both before adding
configuration.

### Secret and seed handling

`prisma/seed.mjs` supports the four `SEED_*` overrides above and contains local
development defaults. It prints account details; treat those defaults as
development-only, override them, and never run the seed against production.
Do not include the defaults in this guide.

## 4. Authentication and tenant security

- Login creates a database session whose opaque random token is stored as a
  hash. The browser cookie is `ono_session`, HTTP-only, `SameSite=Lax`, and
  secure in production.
- Standard sessions expire after 30 minutes of inactivity or 12 hours
  absolutely, whichever comes first. The warning lead time is 2 minutes.
  Remember-me sessions default to 7 days idle and 30 days absolute. Values can
  be configured with the `SESSION_*` variables above and are clamped in
  `src/lib/auth/policy.ts`.
- Protected layouts record server-side activity with a write throttle. The
  session warning offers continue-session and logout actions; only an explicit
  continue request refreshes the session from the warning UI. The `/api/auth/me`
  status endpoint does not extend a session.
- Account security at `/account/security` supports profile name, password,
  preferences, active-session listing/revocation, and sign-out-everywhere.
- Registration, email verification, password reset and resend endpoints use
  rate limits and single-use hashed token records. A console-only email
  transport is available in development. No real email provider is configured
  here; production email verification and password recovery require a provider.
- The active workspace is selected from authenticated membership context and
  the `ono_workspace` cookie. It is not trusted from a user-supplied tenant ID.
- `requireTenantApi` resolves the actor, active tenant, membership, workspace
  state, and optional permission before a route accesses tenant records.
- `getActorContext` and the permission helpers resolve permission codes from
  assigned roles. UI visibility is not an authorization boundary; the server
  must check every protected operation.
- Suspended or closed workspaces reject tenant API changes.
- Store only token hashes in the session table. Do not log passwords, tokens,
  session cookies, API keys, or full secret-bearing connection strings.
- Use least privilege for database and provider credentials. Keep local,
  staging, and production secrets separate.

The project vision proposes additional safeguards such as PostgreSQL RLS,
centralized secret management, formal data classification, WAF/rate limits,
and security verification gates. These are not claims of currently deployed
controls. Verify the hosting and database configuration before making
production security or compliance claims.

The public development tunnel is not a production deployment. Do not use
development seed accounts or console email links for public customer access.

## 5. Data and persistence

- `prisma/schema.prisma` defines the current PostgreSQL schema.
- `prisma/migrations/` contains the checked-in migration history. Current
  migration directories are:
  - `20261027152254_init_core_schema`
  - `20261027155425_part2_testimonials_inventory`
  - `20261027181000_crm_intelligence`
- Review schema changes and generated SQL before applying migrations to shared
  or production databases. Back up production data and use a release procedure.
- `npm run db:push` bypasses migration history and is for disposable local
  development databases only.
- Prisma `Decimal` is used for monetary/quantity fields. Keep financial
  calculations on the server and use decimal-safe operations; do not make
  browser-calculated totals authoritative.
- Stock movements and payments are treated as immutable records through
  application rules. Database details and constraints are in the schema guide.
- The `Document` model stores file metadata, but there is no file upload,
  download, malware scanning, or storage adapter in the current code.

## 6. Reliability, background work, and integrations

Current code includes CRM automation definitions and a protected sweep endpoint
for time-based triggers. There is no bundled scheduler; an operator or external
scheduler would have to call the endpoint. This is not a general durable job
system. The current code also has no live email, SMS, WhatsApp, calendar,
payment-gateway, or external CRM integration.

The product architecture records future proposals for a worker process,
transactional outbox, durable queue, retry controls, object storage, integration
management, and provider abstraction. Treat those as target design until the
relevant implementation, migrations, tests, and deployment configuration exist.

## 7. AI and analytics

- Current analytics are server-side summaries of stored tenant records; they do
  not constitute an independent warehouse or governed metric platform.
- CRM scoring, opportunity win probability, and forecasts are explainable
  statistical/rule baselines, not trained ML.
- The deterministic CRM copilot is bounded to records the caller may read and
  returns evidence and limitations. It does not execute actions.
- An optional OpenAI-compatible adapter exists but is disabled by default; no
  live provider credentials or successful live-provider verification are
  documented.
- No training pipeline, model registry, model serving service, or human-approved
  decision automation is implemented.

AI is not authoritative for permissions, financial values, or state transitions.
Any future AI integration must preserve tenant scope, validate output, retain
provenance, disclose uncertainty, and require explicit authorization for
consequential actions.

## 8. Testing and quality

The repository includes Vitest unit tests for pure logic and selected security-
oriented behaviour: permissions, resource registry, testimonial privacy,
CRM scoring/forecasting, automation rules, copilot intent and presentation
helpers. It does not include a database integration, contract, browser
end-to-end, or provider integration test framework.

Use the scripts in `package.json`: `npm run lint`, `npm run typecheck`,
`npm test`, and `npm run build`. Historical results in former changelog files
refer to earlier specific runs; they are not a guarantee of current status.

## 9. Development and deployment assumptions

Local development needs Node 20.9+, npm, and a reachable PostgreSQL database.
Production also needs a supported Node runtime, persistent managed PostgreSQL,
secure environment-variable injection, TLS, backups, monitoring, and an
operational migration and rollback procedure. Provider, data residency,
retention, backup RPO/RTO, legal jurisdiction, and deployment host remain
product/operations decisions; proposed values are not approved SLAs.

The project roadmap proposes automated CI, migration review, dependency and
secret scanning, staging, release checks, and launch approval. Do not assume
these are active unless configured and verified in the repository and hosting
environment.

## 10. Related references

- Exact model and enum definitions: [Database schema documentation](DATABASE_SCHEMA_DOCUMENTATION.md)
- API routes and permissions: [API documentation](API_DOCUMENTATION.md)
- Local commands and troubleshooting: [Developer guide](DEVELOPER_GUIDE.md)
- Implemented code map: [Code documentation](CODE_DOCUMENTATION.md)
- Proposed architecture and roadmap: [Project architecture document](PROJECT_ARCHITECTURE_DOCUMENT.md)
