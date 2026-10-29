# ONO — Reliability and Observability Plan

| Field | Value |
| --- | --- |
| Document | Reliability and Observability Plan |
| Stage | 2 — Architecture and technical contracts |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — plan only. No monitoring, alert, backup or runbook is implemented |
| Scope | SLOs, failure domains, logs, metrics, traces, health, alerting, retries, degradation, backup, recovery, rollback, incidents |
| Related | `NFR-003`, `NFR-005`, `SLO` targets, `ADR-010`, `ADR-024`, `ADR-025`, `SYSTEM_ARCHITECTURE.md` §14, `SECURITY_PRIVACY_AND_COMPLIANCE_REQUIREMENTS.md` |

---

## 1. Purpose

A business platform is trusted because it is predictable, not because it is
clever. Reliability work makes four promises explicit:

1. **What availability means** — measured, not asserted.
2. **What happens when a dependency fails** — a defined degradation, not an
   improvised outage.
3. **How a failure is seen** — logs, metrics, traces, alerts and a correlation ID.
4. **How the system is restored** — backup, restore, rollback and a tested drill.

Nothing here is implemented. The plan defines what PH-03, PH-10, PH-25 and PH-26
must build and prove.

---

## 2. Service level objectives

### 2.1 Targets

| ID | Objective | Target | Source | Status |
| --- | --- | --- | --- | --- |
| SLO-01 | Tenant application availability | 99.9% monthly, excluding announced maintenance | `NFR-003` | Proposed |
| SLO-02 | Interactive page response | p95 < 2.5 s server response at 1,000 concurrent tenant users | `NFR-001` | Proposed |
| SLO-03 | Dashboard query latency | p95 < 4 s for standard dashboards over 24 months | `NFR-002` | Proposed |
| SLO-04 | API mutation success (excluding client errors) | ≥ 99.5% | Derived | Proposed |
| SLO-05 | Event dispatch latency | p95 < 5 s for normal domain events | `EV` rules | Proposed |
| SLO-06 | Background job success | ≥ 99% within the job's expected window | Derived | Proposed |
| SLO-07 | Recovery point objective | RPO ≤ 15 min | `NFR-005` | Requires approval `OD-021` |
| SLO-08 | Recovery time objective | RTO ≤ 4 h | `NFR-005` | Requires approval `OD-021` |
| SLO-09 | Backup restore success | 100% of quarterly drills pass | Derived | Proposed |
| SLO-10 | Audit write success | 100% for consequential actions | `ADR-025` | Required |

**99.9% monthly** allows roughly **43 minutes** of unplanned unavailability in a
30-day month. A maintenance window is announced and excluded, not hidden.

### 2.2 Measurement rules

| Rule | Detail |
| --- | --- |
| Server-side | Latency is measured at the server boundary, not in the browser |
| Tenant-visible | An error is counted when the tenant cannot complete the task |
| Exclusions | Client aborts, invalid input and rate-limit rejections are not availability failures |
| Segmentation | Reported per route class and per tenant tier; an average hides a broken module |
| Error budget | Burn rate is reviewed weekly; a fast burn triggers a release freeze discussion |
| Honesty | A target missed is reported; it is not redefined after the fact |

---

## 3. Failure domains

| Domain | Failure | Blast radius | Primary mitigation |
| --- | --- | --- | --- |
| Web process | Crash, bad deploy, memory leak | All tenants on that instance | Multiple stateless instances, rolling deploy, health checks |
| Worker process | Stalled lease, poison job, crash | Affected jobs and their tenants | Leases, retries, dead-letter, separate queues |
| PostgreSQL primary | Unavailability, corruption, saturation | All tenants | Managed HA, PITR, connection limits, read replica for reads |
| Read replica | Lag or loss | Analytics and heavy reports | Fall back to primary with a labelled freshness warning |
| Object storage | Unavailability | Uploads/downloads, exports, artefacts | Retry, queued upload, clear error |
| Identity provider | Outage | New sign-ins | Existing sessions continue until expiry; fail closed for new sign-in |
| Email provider | Outage | Notifications | Queue and retry; in-app notification still works |
| AI provider | Outage, refusal, cost spike | Intelligence features | Rules-only fallback; core unaffected |
| ML service | Unavailability | Predictions | Batch last-good output; core unaffected |
| Observability pipeline | Loss | Diagnosis, not operation | Local buffering; alerts from a separate path where possible |
| Cache | Loss | Performance | Database fallback; correctness unaffected |
| DNS/TLS edge | Misconfiguration | All tenants | Change control, canary, rollback |

### 3.1 Blast-radius rules

| Rule | Detail |
| --- | --- |
| No shared mutable singleton | Per-tenant state is in the database, not process memory |
| Queue fairness | One tenant's backlog cannot starve another; per-tenant concurrency caps |
| Connection pool | Bounded per instance; no unbounded acquisition |
| Migration | Additive first; a failed migration stops the release |
| Feature flag | A faulty module can be disabled without a deploy |
| Tenant suspension | Isolated to one tenant |

---

## 4. Observability pillars

| Pillar | Purpose | Minimum content |
| --- | --- | --- |
| Structured logs | What happened, to whom, with which correlation | Timestamp, level, service, correlation ID, event, outcome |
| Metrics | Rates, errors, durations, saturation and business signals | RED/USE plus queue, outbox, freshness, auth failures |
| Traces | Where time went across request → service → database → job | Span names, status, attributes, no sensitive payloads |
| Audit events | Who did what, immutably | Actor, action, target, before/after summary, correlation |
| Business signals | Is the product working for the tenant? | Invoice posted, order confirmed, job completed, metric fresh |
| Health checks | Can this instance serve traffic? | Liveness, readiness, startup |

**Audit is not observability.** Audit is a compliance record with a different
retention and access model. Logs may reference an audit event ID; they never
replace it.

---

## 5. Logging standard

### 5.1 Format

One JSON object per line to stdout/stderr. The platform collects it; the
application does not write log files.

```json
{
  "timestamp": "2026-10-26T09:14:22.481Z",
  "level": "info",
  "service": "ono-web",
  "environment": "production",
  "version": "2026.10.26-1",
  "correlationId": "cor_01J9Z8K3W7",
  "requestId": "req_01J9Z8K3W8",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "tenantId": "ten_01J9...",
  "actorId": "usr_01J9...",
  "route": "POST /api/v1/invoices",
  "status": 201,
  "durationMs": 84,
  "event": "invoice.created",
  "outcome": "success"
}
```

### 5.2 Required fields

| Field | When | Rule |
| --- | --- | --- |
| `timestamp` | Always | UTC, ISO 8601 |
| `level` | Always | `debug`, `info`, `warn`, `error`, `fatal` |
| `service` | Always | `ono-web`, `ono-worker`, `ono-ml` |
| `environment` | Always | `local`, `test`, `staging`, `production` |
| `version` | Always | Build or release identifier |
| `correlationId` | Always | Propagated from the request or job |
| `event` | Always | Stable event name, not a free-text sentence |
| `outcome` | Always | `success`, `denied`, `invalid`, `failed`, `degraded` |
| `tenantId` | Tenant context | Never for platform-global events without a scope marker |
| `actorId` | Authenticated actor | Pseudonymous or opaque ID; never an email |
| `durationMs` | Timed operation | Server-measured |
| `errorCode` | Failure | Stable ONO code |

### 5.3 Prohibited in logs

| Prohibited | Reason |
| --- | --- |
| Passwords, tokens, session cookies, API keys | Credential leak |
| Full request or response bodies for sensitive resources | Data leak |
| Personal data beyond an opaque ID | Privacy minimisation |
| SQL parameters containing personal or financial values | Data leak |
| Prompt text or model context containing tenant data | AI data leak |
| Signed URLs | Bearer access |
| Stack traces returned to clients | Information disclosure; allowed in server logs with care |

### 5.4 Redaction

| Rule | Detail |
| --- | --- |
| Deny-list by field name | `password`, `token`, `secret`, `authorization`, `cookie`, `apiKey`, `cardNumber` |
| Structural redaction | Known sensitive objects are reduced before logging |
| Error objects | Log code and safe message; stack traces are server-side only |
| Sampling | Debug logs are sampled; errors are never sampled away |
| Review | A log change that adds a field is reviewed for classification |

### 5.5 Retention

| Data | Retention | Notes |
| --- | --- | --- |
| Application logs | 90 days | Proposed; operational need |
| Error logs | 90 days | Same |
| Access/security logs | 1 year | Security review may extend |
| Metrics | 13 months | Year-over-year comparison |
| Traces | 7–14 days | Sampling-dependent |
| Audit events | 7 years | `OD-023`; separate store |
| Backup catalogues | Life of backup + 1 year | Restore evidence |

---

## 6. Correlation and tracing

### 6.1 Identifiers

| ID | Scope | Generation | Propagation |
| --- | --- | --- | --- |
| `X-Request-Id` | One HTTP request | Edge or app | Response header; log field |
| `X-Correlation-Id` | End-to-end business action | First entry point | Headers, jobs, events, AI tools, logs |
| `traceparent` | Distributed trace | OpenTelemetry | W3C trace context |
| `eventId` | One event | Producer | Envelope and consumer ledger |
| `jobId` | One job | Scheduler | Job row, logs, retries |
| `Idempotency-Key` | One client intent | Client | Stored with the response |

**Rules:**

- A client-supplied correlation ID is accepted only if well-formed; otherwise it
  is generated.
- A job inherits the correlation ID of the request that queued it where one
  exists.
- An event carries `correlationId` and optional `causationId`.
- An AI tool call inherits the assistant run's correlation ID.
- Logs without a correlation ID are a defect for anything above debug.

### 6.2 Trace boundaries

| Span | Attributes |
| --- | --- |
| HTTP request | Route, method, status, tenant tier (not tenant ID in high-cardinality metric labels) |
| Service call | Service, operation, outcome |
| Database query | Operation, table class, duration; never SQL text with values |
| Outbox dispatch | Event type, count, lag |
| Job run | Job key, attempt, outcome |
| Model call | Model key, version, latency, token count |
| Provider call | Provider, operation, latency, status |

**Cardinality rule:** tenant ID may appear in logs and traces, but not as an
unbounded metric label. Metrics use tier and route class.

---

## 7. Metrics catalogue

### 7.1 Platform metrics

| Category | Metrics |
| --- | --- |
| Request | Rate, error rate, p50/p95/p99 latency by route class |
| Saturation | CPU, memory, event-loop lag, connection pool usage, disk |
| Database | Connections, active queries, lock waits, replication lag, transaction rate, slow queries |
| Jobs | Queue depth, oldest job age, attempts, success/failure, lease expiry |
| Outbox | Pending count, dispatch lag, dead-letter count, replay count |
| Cache | Hit rate, eviction, latency |
| Storage | Upload/download error rate, bytes, signed URL failures |
| Email | Queued, delivered, bounced, complained |
| Rate limits | Rejections by class and tenant tier |

### 7.2 Product and business metrics

| Metric | Why |
| --- | --- |
| Tenant sign-ins and failed sign-ins | Access health and attack signal |
| Invoice posted / order confirmed / payment recorded | Core workflow health |
| Approval queue age | Workflow friction |
| Metric freshness by domain | Analytics trust |
| Report generation success | BI health |
| Import success and rejection rate | Data onboarding |
| AI acceptance and rejection rate | Intelligence usefulness |
| "Insufficient data" rate | Coverage gap |
| Support grant usage | Security and operational load |

### 7.3 Security metrics

| Metric | Alert condition |
| --- | --- |
| Authentication failure rate | Spike per IP/account |
| Authorization denial rate | Spike on a sensitive route |
| Cross-tenant probe signals | Any hit is investigated |
| Privilege changes | Any change outside an approved window |
| Export volume | Unusual size or frequency |
| Support grant creation | Any new grant |
| Audit write failure | Any occurrence |
| Secret scan findings | Any high-severity finding |

---

## 8. Health and readiness

| Endpoint | Purpose | Checks | Must not check |
| --- | --- | --- | --- |
| `/api/health/live` | Is the process alive? | Event loop responsive | Database, provider |
| `/api/health/ready` | Can it serve traffic? | Database reachable, migrations current, required config present, storage reachable | Non-critical providers |
| `/api/health/startup` | Has initialisation completed? | Config loaded, pool created | Long migrations |
| `/api/health/version` | What is deployed? | Build version, commit | Secrets |

**Rules:**

- Readiness fails closed: if the database or required config is unavailable, the
  instance is removed from rotation.
- AI, email and analytics dependencies do **not** fail readiness; they degrade.
- Health endpoints are unauthenticated but expose no tenant data.
- A failed readiness check is alerting, not just a log line.

---

## 9. Alerting

### 9.1 Severity

| Severity | Meaning | Response | Examples |
| --- | --- | --- | --- |
| SEV-1 | Tenant-wide outage or data-integrity/security event | Immediate, all hands | Primary database down, cross-tenant leak, audit write failure |
| SEV-2 | Major function degraded for many tenants | Within 30 min | Worker stalled, outbox lag > 15 min, payment posting failures |
| SEV-3 | Limited function degraded or SLO burn | Within business hours | One integration failing, report queue backlog |
| SEV-4 | Informational or trend | Next review | Disk growth, cost anomaly, slow query trend |

### 9.2 Alert rules

| Alert | Condition | Severity |
| --- | --- | --- |
| Availability burn | Error budget burn > 10× in 1 h | SEV-2 |
| Error budget exhausted | 100% of monthly budget | SEV-1 |
| Database unavailable | Readiness fails for 2 min | SEV-1 |
| Replication lag | > 60 s for 5 min | SEV-2 |
| Outbox lag | p95 > 60 s for 10 min | SEV-2 |
| Dead-letter growth | Any new dead-letter in a critical event type | SEV-2 |
| Job queue age | Oldest job > 2× expected window | SEV-2 |
| Auth failure spike | > 5× baseline for 5 min | SEV-2 |
| Audit write failure | Any | SEV-1 |
| Cross-tenant signal | Any | SEV-1 |
| Backup failure | Any scheduled failure | SEV-2 |
| Restore drill failure | Any | SEV-2 |
| Storage errors | > 1% for 5 min | SEV-2 |
| AI provider errors | > 20% for 10 min | SEV-3 (core unaffected) |
| Certificate expiry | < 14 days | SEV-3 |

**Alert hygiene:** every alert names an owner, a runbook and a user-visible
impact. An alert without a runbook is a TODO, not an alert.

### 9.3 Runbooks (required before PH-26)

| Runbook | Content |
| --- | --- |
| Database failover | Detection, promotion, connection recovery, verification |
| Restore from backup | Selection, isolation, restore, verification, traffic switch |
| Worker stall | Lease inspection, restart, dead-letter review |
| Outbox backlog | Cause, safe replay, duplicate handling |
| Tenant suspension | Scope, session revocation, job stop, communication |
| Security incident | Containment, evidence preservation, notification |
| Provider outage | Fallback, user messaging, recovery |
| Bad release | Rollback or forward-fix, migration state check |

---

## 10. Retries, timeouts and idempotency

| Concern | Rule |
| --- | --- |
| Timeouts | Every external call has a hard timeout; no unbounded wait |
| Retries | Only for transient, idempotent operations; exponential backoff with jitter |
| Attempt cap | Bounded (default 8 for events; per job policy) |
| Retry budget | A retry storm is itself a failure; circuit breaker opens |
| Idempotency | Mutations that can duplicate use `Idempotency-Key` (`ADR-023`) |
| Event duplicates | Consumer ledger `(consumer, eventId)` (`EV-07`) |
| Job duplicates | Job handler is idempotent or uses a business key |
| Non-retryable | Validation, authorization, conflict and permanent provider errors |
| Timeout budget | A request's total budget is less than the client timeout; no nested infinite retries |

---

## 11. Jobs and outbox reliability

| Concern | Rule |
| --- | --- |
| Queue | Database-backed with `FOR UPDATE SKIP LOCKED` (`ADR-010`) |
| Lease | A worker holds a lease and heartbeats; an expired lease is reclaimable |
| Retries | Bounded, backoff, recorded attempt count |
| Dead-letter | Status, owner, reason and last error; alert on critical types |
| Poison job | Quarantined; never blocks the queue |
| Replay | Operator tool, service identity, audit, idempotent handler |
| Ordering | Per aggregate via `subject.version`; not global |
| Outbox retention | Must exceed the longest planned consumer outage (`OD-039`) |
| Fairness | Per-tenant concurrency cap |
| Visibility | Queue depth, age and failure rate are first-class metrics |

---

## 12. Degradation matrix

| Dependency down | Core transaction workflows | Reads | Intelligence | User experience |
| --- | --- | --- | --- | --- |
| Database primary | Blocked | Blocked | Blocked | Maintenance state |
| Read replica | Unaffected | Fall back to primary; slower | Stale analytics | Freshness warning |
| Object storage | Unaffected unless a document is required | Record reads work | Model serving may fail | Upload queued or refused with a clear message |
| Identity provider | Existing sessions work | Works | Works | New sign-in unavailable |
| Email provider | Unaffected | Works | Works | In-app notification only |
| AI provider | Unaffected | Works | Rules/analytics only | "AI unavailable" label |
| ML service | Unaffected | Works | Predictions unavailable | Last-good or no prediction; labelled |
| Cache | Unaffected | Slower | Slower | No visible error |
| Observability | Unaffected | Works | Works | Blind operations; alerting degraded |
| Job worker | Synchronous workflows work | Works | Deferred | "Queued" state; no fake completion |
| Outbox dispatcher | Business writes commit | Works | Downstream delayed | Eventual consistency; freshness label |

**Rule:** degradation is explicit. The UI never shows a stale value as current,
and never shows a queued job as complete.

---

## 13. Backup and restore

### 13.1 Backup

| Asset | Method | Frequency | Retention | Encryption |
| --- | --- | --- | --- | --- |
| PostgreSQL | Automated snapshots + PITR WAL | Continuous WAL; daily snapshot | 30 days (proposed `OD-021`) | At rest and in transit |
| Object storage | Versioning + lifecycle | Continuous | Per policy | At rest |
| Configuration | Versioned in database; exported with backup | Daily | 30 days | At rest |
| Secrets | Secret manager backup/export procedure | On change | Per security policy | Sealed |
| Audit | Included in database backup; append-only | Continuous | 7 years (`OD-023`) | At rest |

### 13.2 Restore

| Rule | Detail |
| --- | --- |
| Restore is isolated | Restore to a separate instance first; never overwrite production in place |
| Verification | Row counts, tenant sample, referential checks, audit continuity, migration version |
| Deletion replay | Deletion records are re-applied before serving traffic (`DEL-06`) |
| Access | Restore requires two-person approval and is audited |
| Time target | RTO ≤ 4 h (proposed `OD-021`) |
| Data loss | RPO ≤ 15 min (proposed `OD-021`) |
| Drill | Quarterly restore drill with a written result |
| Partial restore | Per-tenant restore is a logical export/import, not a database restore |

### 13.3 Backup failure handling

| Situation | Action |
| --- | --- |
| Scheduled backup fails | Alert SEV-2; retry; investigate before the next window |
| PITR gap | Treat as a data-integrity incident |
| Restore drill fails | Block release until resolved |
| Backup access anomaly | Security incident |

---

## 14. Disaster recovery

| Scenario | Response |
| --- | --- |
| Single instance loss | Replace; load balancer routes to healthy instances |
| Availability-zone loss | Managed database failover; web instances in another zone |
| Region loss | Restore from backup in the recovery region; announce RTO |
| Data corruption | Point-in-time restore; identify cause; prevent recurrence |
| Ransomware/credential compromise | Isolate, rotate credentials, restore from clean backup, forensic review |
| Provider loss (AI/email) | Degrade; no core outage |

**Honesty:** single-region hosting at launch is an accepted limitation
(`ASM-003`, `OD-022`). A region-loss recovery is a documented best effort, not a
claim of continuous availability.

---

## 15. Release, migration and rollback

| Concern | Rule |
| --- | --- |
| Deploy | Rolling or blue/green; health-gated |
| Migration | Additive first: add → backfill → switch reads → remove old |
| Destructive migration | Backup, rollback plan, named reviewer |
| Feature flag | Risky features ship dark and are enabled per tenant |
| Canary | Internal tenant or small cohort first |
| Rollback | Forward-fix preferred; restore only for data loss |
| Rollback limit | A migration that cannot be reversed must be deployed in expand/contract steps |
| Post-deploy | Error rate, latency, queue and freshness watched for 30 min |
| Failed deploy | Automatic stop; no partial rollout to all instances |

---

## 16. Incident management

| Phase | Action |
| --- | --- |
| Detect | Alert, tenant report, or internal observation |
| Triage | Severity, affected tenants, data impact, security impact |
| Contain | Stop the bleeding; disable a feature; suspend a tenant; fail over |
| Communicate | Status to affected tenants; no speculation |
| Recover | Restore service; verify data integrity |
| Review | Blameless postmortem within 5 business days for SEV-1/2 |
| Prevent | Action items with owners and dates; tracked to closure |
| Notify | Legal/regulatory notification if personal data is affected (`OD-018`, `OD-033`) |

**Security incidents** follow a separate evidence-preservation path and do not
wait for a normal postmortem.

---

## 17. Capacity and performance

| Concern | Rule |
| --- | --- |
| Target scale | 1,000 tenants / 100,000 users (`NFR-004`) |
| Load test | PH-25, realistic mix, not a single endpoint |
| Connection pool | Bounded; sized to database limits; pooled connections counted |
| Queue capacity | Per-tenant fairness; backpressure visible |
| Storage growth | Document and audit growth projected; lifecycle rules |
| Slow query | Reviewed with `EXPLAIN`; no unindexed tenant scans |
| Pagination | Keyset only; no unbounded list |
| Export | Async beyond a size threshold (`OD-044`) |
| Cost | Usage monitored per tenant tier; no silent overrun |

---

## 18. Data quality and freshness monitoring

| Signal | Rule |
| --- | --- |
| Metric freshness | Every metric has an SLA; a breach raises an alert |
| Completeness | Missing-source counts are shown, not hidden |
| Exception queue | Quality exceptions are owned and prioritised |
| Reconciliation | Financial totals reconcile to source; a mismatch is SEV-2 |
| Duplicate detection | Import and CRM merges report duplicate candidates |
| Stale presentation | A stale value is labelled and never used as current |
| Dataset drift | Training input drift is monitored before it affects a model |

---

## 19. Security monitoring

| Control | Signal |
| --- | --- |
| Authentication | Failure rate, lockouts, MFA bypass attempts |
| Authorization | Denial spikes, cross-tenant probes, scope changes |
| Session | Revocation events, impossible travel (if implemented), concurrent sessions |
| Data access | Sensitive read/export volume, support grant use |
| Configuration | Role changes, entitlement changes, feature flag changes |
| Audit | Write failures, gaps, tampering attempts |
| Secrets | Scan findings, rotation overdue |
| Dependencies | Critical advisories, suspicious packages |
| AI | Prompt injection attempts, tool misuse, cost spikes |

---

## 20. Phase mapping

| Phase | Reliability work |
| --- | --- |
| PH-02 | This plan accepted; SLOs and degradation matrix reviewed |
| PH-03 | CI gates, basic health endpoint, structured logging |
| PH-05 | Auth/security metrics, session revocation tests |
| PH-08 | Backup plan, migration checks, DB metrics |
| PH-09 | Error contract, idempotency, request correlation |
| PH-10 | Worker, outbox, jobs, DLQ, observability integration |
| PH-11–15 | Module SLOs and business metrics |
| PH-16–18 | Freshness, reconciliation, report reliability |
| PH-19–21 | Pipeline and serving reliability |
| PH-22–23 | AI degradation, cost and safety monitoring |
| PH-24 | Tenant lifecycle, support grant monitoring |
| PH-25 | Load test, restore drill, chaos/failure exercises |
| PH-26 | On-call, runbooks, launch monitoring, handover |

---

## 21. Open decisions

| ID | Question | Blocks |
| --- | --- | --- |
| `OD-012` | Observability stack: managed or self-hosted | PH-10 |
| `OD-021` | Backup retention, RPO and RTO | PH-10 |
| `OD-023` | Audit and financial retention | PH-10 |
| `OD-038` | Broker adoption threshold (does not change observability) | PH-24 |
| `OD-039` | Outbox retention and replay window | PH-10 |
| `OD-044` | Export/async size threshold | PH-18 |
| `OD-011` | CI/CD platform and environment topology | PH-03 |
| `OD-022` | Data residency and recovery region | PH-26 |
| `OD-018` | Jurisdictions for incident notification | PH-05 |

---

## 22. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Stage 2 reliability and observability plan: SLOs, failure domains, logging, correlation, metrics, alerts, retries, degradation, backup, recovery, rollback and incidents. No implementation. |
