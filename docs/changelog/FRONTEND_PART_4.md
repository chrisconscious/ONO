# Frontend implementation — Part 4: AI-assisted CRM

**Status:** Implemented and verified against the local production build.
**Date:** 2026-10-30
**Branch:** `crm-intelligence`

This note records the fourth delivery: a CRM intelligence layer on top of the
Part 1–3 frontend and backend. It extends the existing schema, services,
permissions, API conventions and tenant isolation. It does not replace them.

Two claims are deliberately **not** made:

1. No trained machine-learning model exists in this repository. Lead scores,
   win probabilities and forecasts are labelled, explainable statistical
   baselines computed from stored records.
2. No email, SMS, WhatsApp, calendar or payment provider is configured, and no
   outbound message or payment was sent. The copilot never executes an action
   and the automation engine only performs internal, reversible writes.

## Scope delivered

1. A permission-gated CRM workspace (`/app/crm`) that combines priorities,
   data-quality gaps, source performance, recent activity and the copilot.
2. A pipeline board (`/app/crm/pipeline`) with per-currency totals, stage
   ageing, win baselines and audited stage changes.
3. A sales-insights page (`/app/crm/insights`) with descriptive analytics and a
   per-currency pipeline-weighted forecast.
4. Detail pages for leads, contacts, companies and opportunities, each with
   facts, score factors, linked records, tasks, timeline and copilot.
5. A transactional automation console (`/app/crm/automations`) with triggers,
   conditions, actions, run history, manual runs and a protected sweep endpoint.
6. Lead conversion (lead → contact + company + opportunity) in one transaction.
7. Record timelines, in-app notifications and a notification bell.
8. Global CRM search in the tenant header.
9. A deterministic copilot that answers only from records the caller may read,
   plus an optional, disabled-by-default generative adapter.
10. Unit tests for scoring, automation definitions, copilot intent mapping and
    presentation helpers.

## Routes added

| Route | Purpose | Server permission |
| --- | --- | --- |
| `/app/crm` | Smart daily workspace | Any of `LEAD`, `CONTACT`, `COMPANY`, `OPPORTUNITY` READ |
| `/app/crm/pipeline` | Stage board and forecast | `OPPORTUNITY.READ` |
| `/app/crm/insights` | Sales analytics and data quality | `ANALYTICS.READ` |
| `/app/crm/automations` | Automation console | `AUTOMATION.READ` |
| `/app/leads/[id]` | Lead detail, score factors, conversion | `LEAD.READ` |
| `/app/contacts/[id]` | Contact detail and timeline | `CONTACT.READ` |
| `/app/companies/[id]` | Account detail, links and timeline | `COMPANY.READ` |
| `/app/opportunities/[id]` | Deal detail, stage history, quotations | `OPPORTUNITY.READ` |

Pages re-check permissions on the server and render a denied state rather than
relying on hidden navigation. Detail pages return the branded not-found state
when a record does not exist in the active tenant.

## API endpoints added

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/tenant/crm/search` | GET | Tenant-scoped search across leads, contacts, companies and opportunities |
| `/api/tenant/crm/copilot` | POST | Grounded copilot analysis and optional draft |
| `/api/tenant/crm/activities` | POST | Log a human interaction against a CRM record |
| `/api/tenant/crm/leads/[id]/convert` | POST | Transactional lead conversion |
| `/api/tenant/crm/opportunities/[id]/stage` | POST | Audited stage change |
| `/api/tenant/crm/automations` | GET, POST | List and create workflows |
| `/api/tenant/crm/automations/[id]` | GET, PATCH, DELETE | Read, validate, update or remove a workflow |
| `/api/tenant/crm/automations/[id]/run` | POST | Run one active workflow against one explicit record |
| `/api/tenant/crm/automations/sweep` | POST | Evaluate time-based triggers |
| `/api/tenant/notifications` | GET | List the caller's notifications |

All handlers require an authenticated workspace session and the matching
`PERM-<RESOURCE>.<ACTION>` code. Tenant identity always comes from the session,
never from the request body. Generic resource writes also dispatch CRM events
after the transaction; a failure there is logged and never fails the user's
request.

## Scoring, probability and forecast

| Output | Method label | Basis | Status |
| --- | --- | --- | --- |
| Lead score (0–95) | `RULE_BASELINE_V1` | Status, completeness, source history, recency, value, owner | Rule/statistical baseline |
| Opportunity win probability | `RULE_BASELINE_V1` or `HISTORICAL_STAGE_BASELINE_V1` | Stage base, history, ageing, tasks, expected close | Rule/statistical baseline with smoothing |
| Forecast | Pipeline-weighted baseline | Open amount × current baseline, per currency | Descriptive, not trained |

- Every score stores its factors, method, sample size, confidence and
  calculation time. The UI renders the factors and states that the output is not
  a trained model.
- Lead history uses add-5 smoothing, so one outcome cannot produce 0% or 100%.
- Opportunity history is used only after at least three closed outcomes.
- Currencies are reported separately and never summed.
- Closed deals record the outcome (100% won / 0% lost) instead of a forecast.

There is no model registry, training job, feature store or inference service, so
no "trained ML" label is used anywhere.

## Copilot behaviour

- Prompts map onto a small, bounded intent set; unknown prompts return help
  rather than invented answers.
- Answers are computed from records the caller's permissions allow, and include
  the evidence used, limitations and a timestamp.
- Mode is always shown: `DETERMINISTIC` (no model configured) or `GENERATIVE`.
- `executed` is always `false`; the copilot cannot change a stage, send a
  message, convert a lead or run an automation.
- An OpenAI-compatible provider is optional and disabled unless
  `AI_PROVIDER_ENABLED=true`, `AI_PROVIDER_API_KEY` and `AI_PROVIDER_MODEL` are
  present on the server. If enabled but incomplete, the response states the
  configuration error and falls back to deterministic analysis.
- Provider output is grounded on the same computed evidence; it is never asked
  to invent records or probabilities.

## Automation engine

- Triggers: `LEAD_CREATED`, `LEAD_STATUS_CHANGED`, `LEAD_ASSIGNED`,
  `LEAD_INACTIVE`, `OPPORTUNITY_CREATED`, `OPPORTUNITY_STAGE_CHANGED`,
  `OPPORTUNITY_WON`, `OPPORTUNITY_STALLED`, `TASK_OVERDUE`.
- Conditions: status, source, stage, score, amount, industry and company name
  with equals, not-equals, contains, numeric comparisons, is-empty and is-set.
- Actions: create task, assign lead owner, update lead status (restricted to
  `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`), create an in-app notification, set
  an opportunity next step.
- Limits: at most five conditions and five actions; conversion and loss require
  a person; actions must match the trigger record type.
- Execution: server-side and transactional; every action and condition is
  recorded in `automation_runs`; retries are capped at two attempts; a unique
  `(workflowId, idempotencyKey)` constraint prevents duplicate event runs.
- History: status, trigger, attempts, error, action summary and timing are
  visible in the console.
- Scheduling: no queue or scheduler is bundled. Time-based triggers run through
  the permission-protected sweep endpoint, which an operator or an external
  scheduler must call.
- Automation events create timeline entries, but only human `NOTE`, `CALL`,
  `MEETING` and `EMAIL` activities update lead/contact "last contacted". This
  prevents an internal automation from falsely resetting a stale lead.

## Schema and migration

Migration `prisma/migrations/20261027181000_crm_intelligence` adds:

- `Lead` intelligence fields: `score`, `scoreMethod`, `scoreFactors`,
  `scoreUpdatedAt`.
- `Opportunity` intelligence fields: `winProbability`, `probabilityMethod`,
  `probabilityFactors`, `probabilityUpdatedAt`, `stageChangedAt`, `closedAt`,
  `wonReason`, `lostReason`.
- `CrmActivity`, `OpportunityStageEvent`, `Notification`,
  `AutomationWorkflow`, `AutomationRun` and the supporting enums/indexes.
- `Contact.lastContactedAt`, `Company.lastInteractionAt` and
  `Opportunity.lastActivityAt` where missing.

The migration was applied to the local PostgreSQL 16 database; `prisma generate`
succeeded. The `AUTOMATION` permission resource was added to the permission
catalogue and `prisma/seed.mjs`. **Re-run `node prisma/seed.mjs` after upgrading**
so existing workspaces receive the four `PERM-AUTOMATION.*` codes; without the
re-seed the automation API correctly returns 403.

## Verification evidence

Environment: Next.js 16.4.3 production server on `localhost:3000`, PostgreSQL 16
on `127.0.0.1:5544`, seeded `Northwind Trading` workspace.

| Check | Result |
| --- | --- |
| `npm.cmd test` | 9 files, 58 tests passed. |
| `npm.cmd run typecheck` | Passed, no errors. |
| `npm.cmd run lint` | Passed, no warnings. |
| `npm.cmd run build` | Production build succeeded; all new CRM routes rendered in the route table. |
| Authenticated pages | `/app`, `/app/crm`, `/app/crm/pipeline`, `/app/crm/insights`, `/app/crm/automations`, `/app/leads`, `/app/contacts`, `/app/companies`, `/app/opportunities` returned 200 with the expected page titles. |
| Lead detail | `/app/leads/[id]` returned 200 for the stored lead; an unknown id rendered the 404 fallback. |
| Copilot | Workspace and record prompts returned grounded `DETERMINISTIC` answers with evidence, limitations and `executed: false`; no provider is configured. |
| Automation lifecycle | Created a workflow through the API, ran it twice against the stored lead, confirmed two succeeded runs and two in-app notifications, then ran the sweep (0 evaluated, no time-based workflows) and deleted the workflow. |
| Automation safety | Attempted unsafe definitions are rejected by validation; manual run of an inactive workflow is rejected; unknown records are rejected. |
| Authorization | Unauthenticated automation listing returned 401; a platform administrator with no workspace membership received 403 on tenant APIs and was redirected from `/app/crm` to the denied state. |
| Data cleanup | Temporary workflow, runs, notifications and timeline entries were deleted; the lead's `lastContactedAt` was restored to its prior empty value. |

During this pass a defect was found and fixed: system timeline entries were
updating `lastContactedAt`, so an automation could silently reset lead staleness.
Contact recency now changes only for human interaction activities.

## Files added or changed

| Area | Files |
| --- | --- |
| Schema and seed | `prisma/schema.prisma`, `prisma/migrations/20261027181000_crm_intelligence/migration.sql`, `prisma/seed.mjs` |
| Scoring and rules | `src/lib/crm/scoring.ts`, `src/lib/crm/automation.ts`, `src/lib/crm/copilot.ts`, `src/lib/crm/presentation.ts` |
| Services | `src/server/services/crm/crm.service.ts`, `automation.service.ts`, `copilot.service.ts`, `events.service.ts`, `src/server/services/notifications/notification.service.ts` |
| Resource framework | `src/lib/resources/schemas.ts`, `src/lib/resources/registry.ts`, `src/server/services/tenant/records.service.ts` |
| API | the ten endpoints listed above |
| Pages | `src/app/(tenant)/app/crm/**`, `src/app/(tenant)/app/{leads,contacts,companies,opportunities}/[id]/page.tsx` |
| Components | `src/components/workspace/crm-copilot.tsx`, `record-timeline.tsx`, `lead-convert-dialog.tsx`, `opportunity-stage-dialog.tsx`, `automation-manager.tsx`, `crm-panels.tsx`, `src/components/app/global-search.tsx`, `notification-bell.tsx` |
| Tests | `src/lib/crm/{scoring,automation,copilot,presentation}.test.ts` |
| Documentation | this changelog; `docs/features/FRONTEND_MODULE_STATUS.md`; `docs/features/FRONTEND_IMPLEMENTATION_GUIDE.md`; `docs/README.md` |

## Known limitations

- No trained ML: there is insufficient outcome data (one lead, zero
  opportunities) and no training/inference infrastructure. Labels and UI copy
  reflect that honestly.
- No AI provider credentials are present. Only the deterministic copilot was
  exercised. The generative adapter is code-complete but unverified against a
  live provider.
- No email, SMS, WhatsApp, calendar or payment provider exists, so no outbound
  communication or payment was implemented or claimed.
- No queue, cron or worker is included; time-based automation relies on the
  manual sweep endpoint.
- Only unit tests exist. There is no integration, contract or end-to-end suite.
- The browser tool has no viewport emulation; responsive behaviour was verified
  structurally, not with screenshots at each breakpoint.
- Tenant isolation, permission denial and 404s were verified at the API/route
  boundary. A second populated tenant was not created, so cross-tenant record
  enumeration was checked by code review and tenant-scoped queries rather than a
  live two-tenant fixture.
- Production session cookies are `secure`; authenticated checks in this pass
  used a local `localhost` session cookie.

## Not claimed complete

Part 4 delivers a working, audited CRM intelligence layer on the existing
platform. It does not deliver trained ML, autonomous AI actions, outbound
communications, a scheduler, integrations, billing or the still-blocked HR,
file-storage, marketplace and invitation areas. The module status matrix remains
the authority on what works.

Changes are committed to `crm-intelligence` and pushed to the GitHub repository.
No deployment, payment or real communication was performed.
