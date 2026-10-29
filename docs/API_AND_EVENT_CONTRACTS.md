# ONO — API and Event Contracts

| Field | Value |
| --- | --- |
| Document | API and Event Contracts |
| Stage | 2 — Architecture and technical contracts |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — conventions and contracts; no endpoint is implemented |
| Scope | HTTP API, server actions, domain events, frontend/backend, BI, ML and inference contracts |
| Related | `SYSTEM_ARCHITECTURE.md` §7–8, `MODULE_DEPENDENCY_MAP.md`, `DATA_ARCHITECTURE_PLAN.md` |

---

## 1. Contract principles

| ID | Principle |
| --- | --- |
| CT-01 | A contract is a schema, not a convention. Untyped payloads are defects. |
| CT-02 | The server is authoritative for validation, authorization, money, state and derived values. |
| CT-03 | Tenant and actor are never accepted from the request body, query or a client-supplied header. |
| CT-04 | Contracts are additive within a major version; removals require a new version. |
| CT-05 | Error shapes are stable and machine-readable; internals never reach the client. |
| CT-06 | Every unsafe mutation is idempotency-aware where a retry is possible. |
| CT-07 | Events describe facts that already committed; they never replace the transaction. |
| CT-08 | Events carry identifiers, not sensitive payloads. Consumers fetch what they are allowed to see. |
| CT-09 | A consumer owns its projection and can rebuild it from events. |
| CT-10 | A contract change is reviewed like code and tested against fixtures. |

---

## 2. HTTP API conventions

### 2.1 Base path and versioning

| Concern | Rule |
| --- | --- |
| Base path | `/api/v1` |
| Version scope | Major version in the path; minor, additive changes within v1 |
| Resource naming | Plural nouns, kebab-case: `/purchase-orders`, `/stock-movements` |
| Identifier | Opaque cuid string; never a sequential integer |
| Tenant in URL | **Prohibited** for tenant APIs. The tenant comes from the session. Platform APIs use `/platform/...` with explicit platform authorization |
| Content type | `application/json; charset=utf-8`; uploads use `multipart/form-data` to a dedicated endpoint |
| Field naming | `camelCase` in JSON; database columns remain `snake_case` |
| Dates | ISO 8601 with `Z` (UTC); business dates as `YYYY-MM-DD` |
| Money | `{ "amount": "1250.0000", "currency": "TZS" }`; decimal string, never a float |
| IDs in responses | Strings, even when internally numeric |
| Null vs absent | `null` means explicitly empty; an absent field means "not provided" on input and "not permitted/not applicable" on output — documented per resource |

### 2.2 Methods and status codes

| Method | Use | Success | Notes |
| --- | --- | --- | --- |
| `GET` | Read a resource or list | `200` | Cacheable where safe; no side effects |
| `POST` | Create or invoke an action | `201` + `Location`, or `202` for async | Idempotency key supported |
| `PATCH` | Partial update | `200` | JSON Merge Patch semantics; `If-Match` supported |
| `PUT` | Full replacement of a mutable sub-resource | `200` | Rare; not used for financial records |
| `DELETE` | Archive/remove where allowed | `204` | Financial/audit records are never hard-deleted |
| `HEAD` | Existence/metadata | `200`/`404` | Same authorization as `GET` |

| Status | Meaning in ONO |
| --- | --- |
| `400` | Malformed request or schema violation |
| `401` | No valid session |
| `403` | Authenticated but not permitted; used only when disclosure is safe |
| `404` | Not found **or** not visible; used to avoid existence leaks |
| `409` | State conflict, duplicate business key, or idempotency payload mismatch |
| `412` | `If-Match` version mismatch |
| `422` | Semantically invalid but syntactically correct (e.g. allocation exceeds balance) |
| `423` | Record locked by period close or approval |
| `429` | Rate limit exceeded |
| `500` | Unexpected failure; correlation ID only |
| `503` | Dependency unavailable or maintenance; includes retry hint |

### 2.3 Request validation

- Zod schemas are the single validation mechanism (`ADR-019`).
- Validation occurs **before** authorization so malformed input cannot probe policy.
- Unknown fields are rejected by default on mutating endpoints (`strict` schemas).
- Limits are explicit: string lengths, array sizes, file sizes, page sizes, numeric ranges.
- Money, quantity and percentage use decimal strings or integers with documented scale; never binary floats.
- Validation errors use field pointers, not prose-only messages.

### 2.4 Authentication and authorization

| Rule | Detail |
| --- | --- |
| Session | Opaque `HttpOnly`, `Secure`, `SameSite=Lax` cookie; server-verified |
| CSRF | Origin check + CSRF token for cookie-authenticated state-changing requests (`API-3`) |
| API clients | Scoped service credentials or user-delegated tokens, decided at PH-24; never a shared tenant key |
| Authorization | The 12-step evaluation in `TENANCY_AND_AUTHORIZATION_ARCHITECTURE.md` |
| Denial | `404` when existence is sensitive; `403` only when the actor already knows the resource exists |
| Audit | Denials on sensitive resources are logged with a reason code |
| Cross-tenant ID | Treated exactly like a non-existent ID |

### 2.5 List contract: pagination, filtering, sorting, search

**Pagination is keyset (cursor), never offset** (`ADR-022`).

```
GET /api/v1/invoices?status=issued&customerId=cmp_123&sort=-issueDate&limit=25&cursor=eyJ...
```

```json
{
  "data": [ { "id": "inv_...", "number": "INV-0012", "status": "issued" } ],
  "meta": {
    "nextCursor": "eyJpZCI6Imludl8uLi4iLCJ2IjoiMjAyNi0xMC0yNiJ9",
    "hasMore": true,
    "approximateTotal": 184,
    "sort": "-issueDate",
    "filters": { "status": "issued", "customerId": "cmp_123" }
  }
}
```

| Concern | Rule |
| --- | --- |
| Cursor | Opaque, signed or tamper-evident; encodes sort key + id |
| Default limit | 25 |
| Maximum limit | 100 (exports use a separate async endpoint) |
| Sort | Allow-listed per resource; `-` prefix means descending; default documented |
| Filter | Allow-listed, typed; unknown filters are rejected |
| Search | `q` where supported; server-side, indexed; never a raw SQL fragment |
| Total count | Approximate or omitted; if shown it must be labelled approximate |
| Stable ordering | Every cursor sort includes a unique tiebreaker (`id`) |
| Page jumping | Not supported; the UI must not promise it |

### 2.6 Filtering rules

| Rule | Detail |
| --- | --- |
| Equality | `status=issued` |
| Multi-value | `status=issued,paid` (OR within a field) |
| Range | `issueDateFrom=2026-01-01&issueDateTo=2026-03-31` |
| Comparison | Only where documented; no generic operators |
| Nested | Explicit field allow-list (e.g. `customer.id`), not arbitrary JSON paths |
| Custom fields | Only declared, indexed custom fields; never arbitrary JSONB queries |
| Denied records | Excluded from results and counts, not returned as errors (`SCOPE-2`) |

### 2.7 Error contract — RFC 9457 Problem Details

```json
{
  "type": "https://ono.example/problems/validation-failed",
  "title": "Request validation failed",
  "status": 400,
  "detail": "One or more fields are invalid.",
  "instance": "/api/v1/invoices",
  "code": "ONO-VALIDATION-001",
  "correlationId": "cor_01J9Z8K3W7",
  "errors": [
    { "pointer": "/lines/0/quantity", "code": "ONO-FIELD-002", "message": "Quantity must be greater than zero." }
  ]
}
```

| Field | Required | Rule |
| --- | --- | --- |
| `type` | Yes | Stable URI; may be a non-resolving documentation URI |
| `title` | Yes | Short, human-readable, stable |
| `status` | Yes | Matches HTTP status |
| `detail` | No | Safe explanation; no internals |
| `instance` | Yes | Request path (not a URL with query secrets) |
| `code` | Yes | Permanent ONO error code |
| `correlationId` | Yes | Traceable in logs |
| `errors[]` | For validation | `pointer`, `code`, `message` |

**Rules:** error codes are permanent once published; user-facing messages are
plain language; database, stack or provider messages never appear; `detail` may
be localised later without changing `code`.

### 2.8 Idempotency

| Concern | Rule |
| --- | --- |
| Header | `Idempotency-Key: <client-generated UUID>` |
| Applies to | Unsafe mutations where a retry can duplicate an effect (create invoice, record payment, approve, execute action) |
| Scope | Per tenant + actor + endpoint |
| Stored | Key, request hash, status, response, created/expires (`OD-046`) |
| Replay | Same key + same payload returns the original response with `Idempotent-Replay: true` |
| Conflict | Same key + different payload → `409` with code `ONO-IDEMPOTENCY-002` |
| In progress | Second request while first is running → `409` or `202` with retry hint, documented per endpoint |
| Not applied | Reads and naturally idempotent state assignments |

### 2.9 Concurrency control

| Mechanism | Use |
| --- | --- |
| `ETag` + `If-Match` | Record updates where lost updates matter (quotations, approvals, configuration) |
| `version` field | Optimistic concurrency in the body for server actions |
| `412` | Version mismatch; client must refetch and reapply |
| Locking | Approval decisions and financial posting use a transaction-scoped row lock; no long-lived locks |
| Conflict resolution | Never last-write-wins for financial, approval or configuration records |

### 2.10 Rate limiting

| Class | Proposed limit | Notes |
| --- | --- | --- |
| Authentication | Per IP + per account, strict | Lockout/backoff after failures |
| Standard reads | Per actor + tenant | Burst allowed |
| Mutations | Per actor + tenant | Lower than reads |
| Exports/reports | Per tenant, concurrent cap | Async beyond a size threshold (`OD-044`) |
| AI/inference | Per actor + tenant, cost-aware | `AI-SEC-9` |
| Webhooks | Per integration | Replay-safe |
| Platform admin | Per operator | Elevated but audited |

Headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`; `429` uses
Problem Details with `retryAfterSeconds`.

### 2.11 Audit metadata and correlation

| Header | Direction | Rule |
| --- | --- | --- |
| `X-Request-Id` | In/out | Accepted only if well-formed; otherwise generated; always returned |
| `X-Correlation-Id` | In/out | Propagated across jobs, integrations and inference; generated if absent |
| `traceparent` | In/out | W3C trace context where tracing is enabled |
| `Idempotency-Key` | In | As above |

Audit events are written server-side from the actor context. Client-supplied
`actorId`, `tenantId`, `role` or `before/after` values are ignored.

### 2.12 Backward compatibility and deprecation

| Change | Allowed in v1? | Requirement |
| --- | --- | --- |
| Add optional response field | Yes | Documented; clients must ignore unknown fields |
| Add optional request field | Yes | Defaulted; no behaviour change for existing callers |
| Add enum value | Yes, with caution | Clients must tolerate unknown enum values |
| Add new endpoint | Yes | — |
| Remove/rename field | No | Requires v2 |
| Change field type or meaning | No | Requires v2 |
| Change error code meaning | No | New code instead |
| Tighten validation | No, unless a security fix | Documented migration window |
| Deprecate endpoint | Yes | `Deprecation` + `Sunset` headers, announcement window (`OD-045`) |

---

## 3. Server action contract (UI mutations)

Server actions are the default UI mutation path (`ADR-018`). They are not a
second business layer: each action validates, authorizes and calls exactly one
service.

```ts
type ActionResult<T> =
  | { ok: true; data: T; meta?: { version?: number } }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        correlationId: string;
        fieldErrors?: Array<{ field: string; code: string; message: string }>;
      };
    };
```

| Rule | Detail |
| --- | --- |
| Schema | Shared Zod schema; the same schema runs on the client for ergonomics and on the server as authority |
| Authorization | Server action performs the full policy evaluation; never trusts a hidden field |
| Service call | One action → one service call → one transaction where applicable |
| Return | Typed result union; never throw raw errors to the UI |
| Revalidation | `revalidatePath`/`revalidateTag` after success, scoped to the affected resource |
| CSRF | Origin check on the action request |
| Idempotency | Actions that can double-submit accept a generated key or enforce a unique business transition |
| Audit | Consequential actions audit inside the service transaction |
| Progressive enhancement | Nice to have, not a requirement |

**Forbidden in an action:** direct Prisma access, business math, role-name
branching, calling another feature's internals, returning database rows.

---

## 4. Frontend/backend contract

### 4.1 Data reads

| Concern | Rule |
| --- | --- |
| First paint | Server-side service call inside an RSC; no client fetch for initial data |
| Client fetching | Only for interactive refresh where a server render is impossible; uses `/api/v1` with the same auth |
| Cache keys | Tenant-scoped; include tenant, actor scope and resource version where relevant |
| Cache tags | `tenant:<id>`, `<module>:<entity>`, `<entity>:<id>` |
| Invalidation | On successful mutation; never a blanket global purge |
| Sensitive data | Never placed in a public cache; no `NEXT_PUBLIC_` leakage |
| Pagination | Cursor in URL; back/forward restores the list |
| Stale data | Freshness and `asOf` shown where the data is derived or delayed |

### 4.2 Permission projection

The server sends a `can` map for **affordances only**:

```json
{
  "can": {
    "invoice.create": true,
    "invoice.approve": false,
    "invoice.export": true,
    "record.delete": false
  },
  "denyReasons": {
    "invoice.approve": "ONO-AUTHZ-004"
  }
}
```

| Rule | Detail |
| --- | --- |
| Authority | The server decides; the UI only reflects the decision |
| Granularity | Action-level, not data-level; row scope is already applied to the data |
| Deny reason | Optional, safe reason code; never reveals another tenant's data |
| Empty states | A user with no scope sees an empty module, not an error (`SCOPE-6`) |
| Disabled controls | Explain why (permission, state, entitlement, approval required) |

### 4.3 Validation and error handling

- Field errors from the server map to the same field names as the schema.
- The client may show immediate format hints; it may not declare a business rule
  satisfied if the server has not confirmed it.
- A `409`/`412` triggers a refetch, not a silent retry with overwritten data.
- A `404` on a record the user navigated to shows a neutral not-found state, not
  "forbidden" (existence protection).
- Network failure shows retry with the correlation ID; no optimistic success.

### 4.4 Optimistic updates

Allowed only when the action is reversible and the server response is not
financial or approval-bound (e.g. marking a notification read). Prohibited for
payments, postings, approvals, role changes and record deletion.

---

## 5. Event architecture

### 5.1 Mechanism

Transactional outbox, no broker in v1 (`ADR-024`). An event row is inserted in the
same transaction as the business change. The worker dispatches it at-least-once.
Consumers are idempotent. A broker is introduced only when measured volume
justifies it (`OD-038`).

### 5.2 Event envelope

```json
{
  "eventId": "evt_01J9Z8K3W7",
  "eventType": "sales.order.confirmed",
  "schemaVersion": 1,
  "occurredAt": "2026-10-26T09:14:22.481Z",
  "recordedAt": "2026-10-26T09:14:22.503Z",
  "tenantId": "ten_01J9...",
  "actor": { "type": "user", "id": "usr_01J9..." },
  "producer": "sales",
  "subject": { "type": "sales_order", "id": "ord_01J9...", "version": 3 },
  "correlationId": "cor_01J9...",
  "causationId": "evt_01J9...",
  "classification": "confidential",
  "data": {
    "orderId": "ord_01J9...",
    "customerId": "cmp_01J9...",
    "total": { "amount": "12500.0000", "currency": "TZS" },
    "status": "confirmed"
  }
}
```

| Field | Required | Rule |
| --- | --- | --- |
| `eventId` | Yes | Globally unique; used for deduplication |
| `eventType` | Yes | `domain.entity.action`, past tense, stable |
| `schemaVersion` | Yes | Integer; additive changes keep the version until a breaking change |
| `occurredAt` | Yes | When the business fact happened (UTC) |
| `recordedAt` | Yes | When the outbox row was written |
| `tenantId` | Yes for tenant events | Never inferred by the consumer; platform events use a platform scope and are marked |
| `actor` | Yes | `user`, `service` or `system`; never anonymous for consequential events |
| `producer` | Yes | Owning module code |
| `subject` | Yes | Type, id and version of the affected aggregate |
| `correlationId` | Yes | Ties the event to the originating request/job |
| `causationId` | No | The event or command that caused this one |
| `classification` | Yes | Highest classification of the payload |
| `data` | Yes | Minimal identifiers and changed fields; no documents, tokens, free-text notes or full personal records |

### 5.3 Event rules

| ID | Rule |
| --- | --- |
| EV-01 | An event is published only after its transaction commits (outbox dispatcher). |
| EV-02 | Payloads contain identifiers and minimal facts; consumers fetch authorized details. |
| EV-03 | The tenant is explicit; a consumer may not infer it from a record lookup before checking it. |
| EV-04 | Ordering is guaranteed per aggregate only by `subject.version`; global ordering is not promised. |
| EV-05 | Consumers must tolerate out-of-order delivery; use version checks or state guards. |
| EV-06 | Delivery is at-least-once; duplicates are normal, not exceptional. |
| EV-07 | A consumer records `(consumer, eventId)` before or within the effect transaction. |
| EV-08 | Events are immutable; correction is a new event. |
| EV-09 | Events are never used to grant permission or to bypass a service call. |
| EV-10 | Payloads are validated against the schema version before handling. |

### 5.4 Delivery, duplicates and failure recovery

| Concern | Rule |
| --- | --- |
| Dispatch latency target | p95 < 5 seconds for normal events; batch/analytics events may be minutes |
| Retries | Exponential backoff with jitter; bounded attempts (default 8) |
| Dead letter | After exhaustion, status `dead_letter` with owner, reason and last error; alert raised |
| Poison event | Quarantined, never blocks the queue; manual inspection and replay |
| Replay | Operator tool can replay by event ID, type or time range, under a service identity and with audit |
| Duplicate handling | Unique `(consumer, eventId)` ledger; effects also guarded by business idempotency keys |
| Ordering violation | Consumer rejects stale versions; logs a warning; does not overwrite newer state |
| Consumer outage | Events remain in the outbox; retention window must exceed the longest planned outage (`OD-039`) |
| Schema mismatch | Consumer refuses the event and alerts; no best-effort parsing |
| Cross-tenant leak | Treated as a security incident; dispatcher verifies tenant context before write |

### 5.5 Event catalogue

Each event is owned by one module. "Consumers" are the anticipated subscribers;
a new consumer does not require a producer change.

| Event | Owner | Trigger | Purpose | Consumers | Min. data | Class |
| --- | --- | --- | --- | --- | --- | --- |
| `identity.membership.invited` | M03 | Invitation created | Provision access, notify | M02, M14 | membershipId, email ref, roleId | confidential |
| `identity.membership.activated` | M03 | Invitation accepted | Audit, onboarding progress | M02, M20 | membershipId, userId | internal |
| `identity.membership.suspended` | M03 | Admin action | Immediate revocation, reassignment | M01, M20, all modules (session check) | membershipId, reason code | confidential |
| `identity.session.revoked` | M03 | Suspension, logout-all, privilege change | Security telemetry | M20 | userId, sessionId, reason | internal |
| `org.tenant.provisioned` | M02 | Onboarding completes transactionally | Apply profile, seed defaults, notify | M01, M04, M20 | tenantId, planId, industryIds | internal |
| `org.setting.changed` | M02 | Setting update | Cache invalidation, audit | M16, M20 | tenantId, key, version (no values) | confidential |
| `industry.selection.changed` | M04 | Industry added/removed | Effective config recompute | M02, M16 | tenantId, industryIds, primaryId | internal |
| `industry.profile.published` | M04 | Curated profile version published | Offer upgrade to tenants | M02, M16 | profileId, version, changelogRef | internal |
| `crm.lead.created` | M05 | Lead captured | Attribution, dashboards, assignment | M07, M16 | leadId, sourceId, ownerId | confidential |
| `crm.lead.converted` | M05 | Lead converted atomically | Create opportunity, stop nurture | M06, M07, M16 | leadId, contactId, companyId, opportunityId | confidential |
| `crm.contact.merged` | M05 | Duplicate merge approved | Preserve history, update references | M06, M13, M16 | survivorId, mergedId, actorId | confidential |
| `sales.opportunity.stage_changed` | M06 | Stage transition committed | Pipeline metrics, risk signals | M16, M18 | opportunityId, fromStage, toStage, amount | confidential |
| `sales.quotation.approved` | M06 | Approval bound to version | Freeze quote, notify | M08 (projection), M16 | quotationId, version, total | confidential |
| `sales.order.confirmed` | M06 | Order confirmed | Fulfilment, invoicing, project creation | M08, M09, M11, M13, M16 | orderId, customerId, total, linesRef | confidential |
| `finance.invoice.issued` | M08 | Invoice posted/issued | Receivables, dashboards, collections | M11, M16, M18 | invoiceId, customerId, total, dueDate | confidential |
| `finance.payment.recorded` | M08 | Payment allocated | Update exposure, notify | M06 (credit projection), M16 | paymentId, invoiceIds, amount | restricted |
| `finance.journal.posted` | M08 | Journal posted | Reporting, reconciliation | M16, M20 | journalId, periodId, total | restricted |
| `inventory.movement.recorded` | M09 | Movement committed | Valuation, reorder, dashboards | M08, M10, M16 | movementId, productId, qty, type, occurredAt | internal |
| `inventory.level.changed` | M09 | Level projection changes | Reorder suggestions | M10, M16 | productId, locationId, onHand, reorderPoint | internal |
| `procurement.purchase_order.approved` | M10 | Approval bound to version | Issue PO, commit spend | M08, M16 | purchaseOrderId, supplierId, total | confidential |
| `procurement.receipt.recorded` | M10 | Goods received | Stock movement, match, payables | M08, M09, M16 | receiptId, purchaseOrderId, linesRef | internal |
| `procurement.match.completed` | M10 | Three-way match resolved | Permit bill approval | M08, M16 | matchId, billId, variance | confidential |
| `projects.milestone.completed` | M11 | Milestone accepted | Billing trigger, dashboards | M08, M16 | projectId, milestoneId, value | confidential |
| `projects.task.assigned` | M11 | Assignment changed | Notify, capacity | M12, M14 | taskId, assigneeId, dueAt | internal |
| `support.case.resolved` | M13 | Case closed with note | Customer history, satisfaction | M05, M16 | caseId, companyId, resolutionCode | confidential |
| `support.sla.breached` | M13 | SLA timer exceeded | Escalation, insight | M14, M18 | caseId, policyId, breachedAt | internal |
| `documents.document.uploaded` | M14 | Upload scanned and available | Link, index, audit | M20, M16 | documentId, ownerType, ownerId, mimeType, size | confidential |
| `analytics.metric.recalculated` | M16 | Materialisation completes | Refresh dashboards, ML inputs | M15, M17, M18, M23 (aggregate only) | metricId, version, period, freshness | internal |
| `analytics.report.generated` | M16 | Report ready | Notify, audit | M14, M20 | reportId, format, filtersHash | confidential |
| `ml.dataset.published` | M17 | Dataset validated and immutable | Training reproducibility | M20, M18 | datasetId, version, hash, window | restricted |
| `ml.model.approved` | M17 | Model passes evaluation + approval | Serving eligibility | M18, M20 | modelKey, version, useCaseId | restricted |
| `ml.predictions.ready` | M17 | Batch scoring completes | Insight generation | M18, M16 | useCaseId, modelVersionId, batchId, count | internal |
| `inference.recommendation.created` | M18 | Recommendation published | Approval routing, display | M16, M21, M14 | recommendationId, actionType, confidence, evidenceRef | confidential |
| `approval.requested` | M21 | Approval workflow started | Notify approver | M14, M18 | requestId, subjectType, subjectId, subjectVersion | confidential |
| `approval.decision.recorded` | M21 | Approve/reject/change | Apply transition, execute action | Requesting module, M18 | requestId, decision, approverId | restricted |
| `platform.tenant.suspended` | M01 | Platform action | Block access, revoke sessions | M02, M03, M20 | tenantId, reason code | internal |
| `platform.job.failed` | M19 | Job exhausted retries | Alert, operator action | M01, M20 | jobId, jobKey, attempts, errorCode | internal |
| `quality.exception.raised` | M22 | Quality rule fails | Data quality queue | M16, M18 | ruleId, entityType, count | internal |

**Not events:** permission checks, reads, UI state, raw logs, full documents,
personal data beyond identifiers, or anything that did not commit.

### 5.6 Event schema evolution

| Change | Version bump? | Rule |
| --- | --- | --- |
| Add optional field | No | Consumers ignore unknown fields |
| Add required field | Yes | New `schemaVersion`; old version still dispatched during migration |
| Remove/rename field | Yes | New version; old retained for a documented window |
| Change type/meaning | Yes | New event type is safer than a new version |
| Add enum value | No | Consumers must tolerate unknown values |

---

## 6. Webhook and integration contracts

### 6.1 Outbound webhooks

| Concern | Rule |
| --- | --- |
| Subscription | Allow-listed event types per tenant/integration |
| Signature | HMAC over timestamp + raw body; secret per endpoint |
| Replay protection | Timestamp window + `eventId` dedupe on the receiver |
| Delivery | At-least-once; retries with backoff; dead-letter after cap |
| Ordering | Not guaranteed; `subject.version` is provided |
| Payload | The event envelope, with sensitive fields reduced; never a full record |
| Disable | Automatic after repeated failures, with owner notification |
| Audit | Delivery attempts and failures are recorded (not the secret) |

### 6.2 Inbound integrations

| Concern | Rule |
| --- | --- |
| Verification | Signature or OAuth token; reject unsigned |
| Idempotency | Provider event ID stored per integration |
| Validation | Provider payload → internal schema; unknown fields ignored only where documented |
| Trust | Third-party responses are untrusted input (`IN-1`, `API-8`) |
| Tenant | Resolved from the integration record, never from the payload |
| Failure | Isolated per integration and tenant; no cross-tenant impact |
| Credentials | Encrypted at rest; never logged or returned |

---

## 7. Business intelligence contracts

### 7.1 Metric definition contract

A metric is registered once and referenced everywhere. No dashboard computes a
KPI locally (`AC-17-01`).

```json
{
  "id": "met_01J9...",
  "code": "MET-GROSS-MARGIN",
  "name": "Gross margin",
  "version": 3,
  "owner": "finance",
  "description": "Revenue minus direct cost, divided by revenue.",
  "unit": "percent",
  "grain": "month",
  "dimensions": ["tenant", "branch", "productCategory"],
  "calculationMode": "materialised",
  "formulaRef": "metrics/gross-margin/v3.sql",
  "sourceRefs": ["finance.invoice", "finance.invoice_line", "inventory.movement"],
  "freshnessSla": "PT6H",
  "classification": "confidential",
  "status": "published",
  "effectiveFrom": "2026-01-01"
}
```

| Rule | Detail |
| --- | --- |
| Formula ownership | Finance/analytics owner; profile cannot override the formula (`IND-PROFILE-5`) |
| Versioning | Any formula change is a new version; old values retain their version |
| Source references | Explicit; lineage resolves metric → source (`AC-16-02`) |
| Dimensions | Declared, not arbitrary |
| Null/zero policy | Documented per metric; no silent division by zero |
| Suppression | Small-cohort cells suppressed according to policy, never shown as zero |
| Freshness | Every value carries `computedAt`, `asOf`, `freshness`, `isStale` |

### 7.2 Metric query contract

```
POST /api/v1/analytics/query
```

```json
{
  "metrics": ["MET-GROSS-MARGIN", "MET-REVENUE"],
  "period": { "from": "2026-01-01", "to": "2026-09-30", "grain": "month" },
  "filters": { "branchId": ["br_01"], "productCategory": ["cat_02"] },
  "groupBy": ["month", "branchId"],
  "compare": { "mode": "previousPeriod" },
  "include": { "freshness": true, "drill": true }
}
```

```json
{
  "data": [
    {
      "metric": "MET-GROSS-MARGIN",
      "version": 3,
      "unit": "percent",
      "points": [
        { "periodStart": "2026-01-01", "dimensions": { "branchId": "br_01" }, "value": "31.40", "suppressed": false }
      ],
      "freshness": { "computedAt": "2026-10-26T06:00:00Z", "asOf": "2026-10-25", "isStale": false },
      "drill": { "pathId": "drill-gross-margin-v3" }
    }
  ],
  "meta": { "correlationId": "cor_...", "currency": "TZS" }
}
```

| Rule | Detail |
| --- | --- |
| Authorization | Metric visibility + dimension scope evaluated before query |
| No raw SQL | Clients send metric codes and declared dimensions only |
| Freshness | Always returned; stale values are labelled (`AP-12`) |
| Comparison | Declared mode; no client-side arithmetic on totals |
| Suppression | `suppressed: true` with no value when the cohort is too small |
| Drill-down | Returns a path/query reference; opening it re-authorizes every record |
| Exports | Async for large ranges; audited; filters preserved (`AC-18-03`, `OD-044`) |

### 7.3 Report and export contract

| Rule | Detail |
| --- | --- |
| Definition | Report references metric versions and filters; not embedded SQL |
| Schedule | Tenant-scoped; owner; timezone aware |
| Delivery | In-app + optional email; signed, expiring download |
| Audit | Generation, download and recipient are audited |
| Partial data | Report states missing/stale sources explicitly |
| Retention | Export files expire; the definition remains |

---

## 8. ML and inference contracts

### 8.1 Prediction request (internal/service)

```json
{
  "requestId": "req_01J9...",
  "useCaseId": "UC-03",
  "modelVersionId": "mdl_collections_2026_09_v4",
  "tenantId": "ten_01J9...",
  "actorId": "usr_01J9...",
  "asOf": "2026-10-25T23:59:59Z",
  "features": {
    "daysOverdue": 34,
    "invoiceCount": 7,
    "avgPaymentDelay": 12.5,
    "customerTenureMonths": 26
  },
  "options": { "explain": true }
}
```

```json
{
  "requestId": "req_01J9...",
  "prediction": { "type": "probability", "value": "0.71" },
  "interval": { "lower": "0.61", "upper": "0.80", "level": 0.9 },
  "confidence": "medium",
  "modelMeta": {
    "modelKey": "collections-risk",
    "version": 4,
    "datasetId": "ds_collections_2026_09",
    "datasetVersion": 2,
    "trainedAt": "2026-09-18T10:00:00Z"
  },
  "warnings": ["out_of_distribution:avgPaymentDelay"],
  "servedAt": "2026-10-26T09:14:22Z"
}
```

| Rule | Detail |
| --- | --- |
| Pinning | Production requests always name a model version; "latest" is prohibited (`SRV-5`) |
| Validation | Unknown features are rejected; missing values are explicit, not imputed silently (`SRV-3`) |
| Authorization | The actor's scope is checked before feature retrieval (`SRV-1`) |
| Timeout | Hard limit; caller degrades (`SRV-2`, `SRV-8`) |
| Provenance | Model key, version, dataset version and training date on every response |
| Uncertainty | Interval/confidence mandatory for probabilistic outputs |
| Write-back | Never writes source records; proposals go through the decision layer |
| Batch | `ml.predictions.ready` event; tenant-scoped, rate-limited (`SRV-7`) |

### 8.2 Inference and recommendation contract

```json
{
  "id": "rec_01J9...",
  "tenantId": "ten_01J9...",
  "type": "recommendation",
  "actionType": "notify_owner",
  "title": "Contact 7 customers with invoices over 45 days overdue",
  "statements": [
    {
      "type": "metric",
      "text": "Overdue receivables are 18% of open receivables.",
      "evidence": [{ "kind": "metric", "id": "met_receivables_overdue", "version": 2 }],
      "period": { "from": "2026-07-01", "to": "2026-09-30" },
      "confidence": "high"
    },
    {
      "type": "prediction",
      "text": "Four of these customers are likely to pay within 14 days if contacted.",
      "evidence": [{ "kind": "model", "id": "mdl_collections_2026_09_v4" }],
      "confidence": "medium",
      "assumptions": ["Payment history is complete for the period."]
    }
  ],
  "expectedImpact": { "metric": "MET-DSO", "direction": "decrease", "range": ["2", "6"], "unit": "days" },
  "confidence": "medium",
  "cost": "low",
  "reversibility": "reversible",
  "approval": { "required": true, "policyId": "pol_..." },
  "measurement": { "baseline": "met_dso_2026_09", "windowDays": 30 },
  "modelVersions": ["mdl_collections_2026_09_v4"],
  "createdAt": "2026-10-26T09:14:22Z"
}
```

| Rule | Detail |
| --- | --- |
| Labels | Every statement is `fact`, `metric`, `prediction`, `assumption` or `recommendation` (`AI_ML...` §8) |
| Evidence | Every claim resolves to a record, metric or model; otherwise it is an assumption (`INF-R-3`) |
| Insufficient data | First-class outcome; no filler (`INF-R-4`) |
| Authority | The engine proposes; it never executes (`INF-R-6`) |
| Approval | Consequential actions are bound to a recommendation version and an approval decision (`APPR-2`) |
| Measurement | Baseline and window are registered before execution (`FB-3`) |
| No secrets | Prompts, system messages and internal provider details are never returned |

### 8.3 AI assistant tool contract

```json
{
  "tool": "crm.searchContacts",
  "arguments": { "query": "Acme", "limit": 10 },
  "mode": "read"
}
```

| Rule | Detail |
| --- | --- |
| Allow-list | Tools are declared per use case and role (`ADR-034`) |
| Mode | `read`, `propose`, `execute`; v1 exposes `read` and `propose` only |
| Authorization | The tool runs under the requesting actor's policy context (`ADR-033`) |
| Validation | Arguments validated against a Zod schema; unknown arguments rejected |
| Scope | A tool cannot widen scope; no ambient credentials (`AI-SEC-10`) |
| Audit | Actor, tool, arguments hash and result status are logged (`AI-SEC-8`) |
| Injection | Retrieved content is data, never instructions (`AI-SEC-1`) |
| Output | Structured result, not raw model prose; the assistant renders labelled text |

---

## 9. Contract governance

| Concern | Rule |
| --- | --- |
| Source of truth | Zod schemas in `src/lib/contracts` and module contract folders |
| Types | Derived from schemas; no hand-maintained duplicate interfaces |
| API description | OpenAPI generated from schemas at PH-09 (proposed) |
| Event schemas | Versioned files with fixtures and a compatibility test |
| Review | Contract change requires review by the consuming module owner |
| Tests | Valid/invalid fixtures; error-shape tests; idempotency tests; duplicate-event tests |
| Breaking change | Requires a new API version or event schema version, a migration note and a deprecation window |
| Documentation | This document is the architectural contract; endpoint-level reference is generated later |

---

## 10. Open decisions

| ID | Question | Affects |
| --- | --- | --- |
| `OD-045` | API deprecation window and supported-version policy | §2.12 |
| `OD-046` | Idempotency key retention window | §2.8 |
| `OD-039` | Outbox retention and replay window | §5.4 |
| `OD-044` | Export size threshold for async generation | §7.3 |
| `OD-038` | Broker adoption threshold | §5.1 |
| `OD-027` | Approved AI provider and data terms | §8.3 |

---

## 11. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Stage 2 API, event, frontend, BI, ML and inference contracts. No implementation. |
