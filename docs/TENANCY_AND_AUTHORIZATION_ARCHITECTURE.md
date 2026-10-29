# ONO — Tenancy and Authorization Architecture

| Field | Value |
| --- | --- |
| Document | Tenancy and Authorization Architecture |
| Stage | 2 — Architecture and technical contracts |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — design only. No policy code, session store, RLS policy or tenant guard exists |
| Scope | Tenant isolation, identity and sessions, authorization, scopes, separation of duties, platform boundary, enforcement points |
| Related | `ADR-005`, `ADR-006`, `ADR-014`, `ADR-016`, `ROLES_AND_PERMISSION_MODEL.md`, `SECURITY_PRIVACY_AND_COMPLIANCE_REQUIREMENTS.md`, `DATA_ARCHITECTURE_PLAN.md` |

---

## 1. Why this document exists

Tenant isolation and authorization are the two invariants that cannot be repaired
later by a feature. A missed tenant predicate is a data breach; a missed
permission check is an unauthorized action. Both are cheap to prevent at the
architecture level and expensive to detect after launch.

This document fixes:

1. **where the tenant comes from** — the session, never the request;
2. **how a decision is made** — one server-side policy module, default deny;
3. **what the decision is made of** — entitlement, permission, scope, state,
   separation of duties, approval;
4. **where the decision is enforced** — every entry point, enumerated;
5. **how the database defends the same invariant** — repository guard plus RLS
   as proposed defence in depth;
6. **what happens on failure** — fail closed, with a safe response.

It does not create roles, permissions, policies or tables. Those are PH-05 and
PH-08.

---

## 2. Non-negotiable invariants

| ID | Invariant | Consequence if violated |
| --- | --- | --- |
| TA-01 | Tenant identity is derived from the authenticated session, never from body, query, path or a client-supplied header | Trivial cross-tenant access (`RL-01`, `AUTHZ-3`) |
| TA-02 | Every tenant-owned row carries a non-null `tenantId` | Orphan rows and unscoped queries |
| TA-03 | Absence of a matching grant is denial | Silent privilege by omission |
| TA-04 | Authorization is evaluated before data access, not after | Denied data is still loaded and may leak |
| TA-05 | Denied records are excluded from lists, counts and aggregates, not returned as errors | Existence and volume leakage (`SCOPE-2`) |
| TA-06 | A record the actor may not see is indistinguishable from a record that does not exist | IDOR and enumeration |
| TA-07 | The client is never the control; it may only reflect a server decision | Bypass by devtools or direct API call |
| TA-08 | Jobs, webhooks and integrations act under an explicit identity with the same rules | Privilege escalation through the worker |
| TA-09 | An AI tool call carries the requesting actor's authority and may never widen it | Assistant becomes a confused deputy (`ADR-033`) |
| TA-10 | Platform access to tenant data requires a scoped, expiring, audited grant | Unbounded operator access (`PLAT-1`–`PLAT-6`) |

These are architectural invariants, not features. A change to any of them requires
an ADR and a security review.

---

## 3. Tenant boundary model

### 3.1 Structure

```
Platform (ONO)
└── Tenant (customer organisation)                  ← isolation boundary
    ├── Branch (operating location)
    │   └── Department
    │       └── Team
    ├── Department (may span branches)
    │   └── Team
    └── Membership (user + roles + scope)            ← the only path to tenant data
```

| Level | Purpose | Isolation rule |
| --- | --- | --- |
| Platform | ONO operations | No implicit access to tenant business data |
| Tenant | Customer organisation | Root of every tenant-owned row |
| Branch | Operating location | Optional scope dimension; records may be branch-scoped |
| Department | Functional grouping | Optional scope dimension; owns budgets and approvals |
| Team | Working group | Optional scope dimension; assignment target |
| Membership | User's participation in a tenant | Must be active for any request to succeed |

### 3.2 Global versus tenant-scoped data

| Data | Scope | Rule |
| --- | --- | --- |
| `User` (identity) | Global | One identity may hold memberships in several tenants; the identity record holds no tenant business data |
| `Membership`, `RoleAssignment`, `DataScope` | Tenant | Unique `(tenantId, userId)`; roles and scopes never cross tenants |
| Industry catalogue, platform plans, platform flags | Platform | Read-only to tenants; never contain tenant records |
| Tenant settings, branches, departments, teams | Tenant | `tenantId` non-null |
| Business records (CRM, sales, finance, inventory, procurement, projects, workforce, support, documents) | Tenant | `tenantId` non-null on every row |
| Audit and outbox | Tenant or platform | Explicit scope marker; never inferred |
| Metrics, datasets, models, predictions | Tenant unless governance approves otherwise | `OD-026` unresolved; default tenant-scoped |
| Marketplace aggregates | Governed aggregate | Separate access path; no operational joins (`ADR-035`) |

**Global tables are an allow-list, not a default.** A new table without
`tenantId` requires a documented reason, an ADR note and a security review.

### 3.3 Cross-tenant integrity

| Rule | Detail |
| --- | --- |
| Composite foreign keys | Where a child row references a parent that could belong to another tenant, the FK includes `tenantId` |
| Unique constraints | Include `tenantId` (for example `(tenantId, invoiceNumber)`) |
| No cross-tenant joins | A query that joins two tenant-owned tables must constrain both to the same `tenantId` |
| No global sequences as identifiers | Opaque IDs (cuid) prevent enumeration but are not a security control |
| Tenant deletion | Never cascades across domains without an explicit offboarding workflow |

### 3.4 Tenant lifecycle

| State | Entry | Access | Jobs | Data |
| --- | --- | --- | --- | --- |
| `provisioning` | Onboarding | Owner invitation only | Provisioning jobs only | Being created transactionally |
| `active` | Provisioning completes | Full, subject to entitlements | Normal | Available |
| `suspended` | Platform or billing action | Sign-in blocked; sessions revoked | Tenant jobs paused | Retained |
| `closing` | Owner or platform action | Read-only export window | Export jobs only | Retained until purge |
| `closed` | Offboarding completes | None | None | Purged after retention, audit evidence retained |

**Rules:**

- Suspension is immediate for sessions and jobs; it is not a UI state.
- Closing requires an explicit export step before purge (`DEL-07`).
- Ownership transfer is audited and confirmed; the previous owner's sessions are
  re-evaluated.
- A tenant is never hard-deleted while financial or audit retention applies.

---

## 4. Identity, membership and sessions

### 4.1 Entities

| Entity | Scope | Purpose |
| --- | --- | --- |
| `User` | Global | Identity, credentials or federated subject, MFA state |
| `Membership` | Tenant | Active participation, status, joining date |
| `Invitation` | Tenant | Single-use, expiring invitation bound to an email and role set |
| `Role` / `RoleAssignment` | Tenant | Template or custom role, assigned to a membership |
| `DataScope` | Tenant | Branch/department/team/own/assigned scope for an assignment |
| `Session` | Tenant-bound | Server-verified session, revocation state, auth age |
| `SupportGrant` | Platform → tenant | Time-boxed, scoped operator access |

### 4.2 Session properties

| Property | Rule |
| --- | --- |
| Token | Opaque, high-entropy; stored hashed server-side |
| Transport | `HttpOnly`, `Secure`, `SameSite=Lax` cookie |
| Binding | Bound to a user and an active tenant membership |
| Rotation | On sign-in, privilege change, and periodic rotation |
| Absolute lifetime | Proposed 12 h (`OD-024`) |
| Idle timeout | Proposed 30 min (`OD-024`) |
| Re-authentication | Required for sensitive actions (role change, export of restricted data, support grant, ownership transfer) |
| Revocation | Immediate on suspension, removal, password change, MFA reset, logout-all or privilege downgrade |
| Store | Database-backed (`ADR-005`); stateless JWT-only sessions are rejected |
| Multi-tenant switch | Explicit tenant selection; the session is re-bound and all cached decisions invalidated |

### 4.3 Actor context

Every entry point resolves one immutable context and passes it explicitly:

```
ActorContext {
  userId
  tenantId                 // null only for platform-scope operations
  membershipId             // null for platform scope
  membershipStatus
  roleIds[]
  permissionSet            // resolved grants, not role names
  scopes[]                 // resolved predicates
  sensitivityCeiling
  entitlements[]           // enabled modules for the tenant
  sessionId
  authAgeSeconds
  mfaLevel                 // none | totp | webauthn | federated
  platformScope            // true only for platform operations
  supportGrantId?          // present only during support access
  correlationId
}
```

**Rules:**

- Services accept `ActorContext` as an argument; they never read cookies or
  headers directly.
- A service never constructs an actor context from input.
- A job constructs a service identity plus an `onBehalfOf` actor where one
  exists; otherwise it runs as `system` with an explicit tenant.
- A platform-scope context has no tenant data access until a support grant is
  resolved.

### 4.4 MFA and federated identity

| Requirement | Rule |
| --- | --- |
| MFA for privileged roles | Required for platform administrators, tenant owners, finance approvers and role administrators |
| MFA enrolment | Enforced at first privileged sign-in; recovery codes are one-time and audited |
| SSO readiness | A tenant may require federated sign-in; local membership and roles remain authoritative |
| Provider outage | Existing sessions continue until expiry; new sign-in fails closed with a clear message |
| Recovery | Identity verification process is documented and audited; no support-driven password reset without verification |

### 4.5 Membership lifecycle

| State | Entry | Allowed transitions | Effect |
| --- | --- | --- | --- |
| `invited` | Admin invites | `active`, `expired`, `revoked` | No access |
| `active` | Acceptance | `suspended`, `removed` | Access subject to policy |
| `suspended` | Admin or platform action | `active`, `removed` | Sessions revoked immediately; jobs stop |
| `removed` | Admin action | — | Access ends; attribution retained |
| `expired` | Invitation timeout | `invited` (reissue) | No access |

A user may hold different roles in different tenants; there is no shared session
across tenants.

---

## 5. The authorization decision

### 5.1 One policy module

`ADR-016` is approved: **a single server-side policy module, default deny.**
There is no second authorization implementation in a route handler, a component,
a report, a job or an AI tool.

| Element | Rule |
| --- | --- |
| Policy decision point | `src/lib/permissions` — pure, deterministic, no network I/O |
| Policy enforcement points | Every entry point in §11 |
| Inputs | `ActorContext`, action (`PERM-*`), resource type, resource scope facts, record state, approval state |
| Outputs | `Decision { allow, reasonCode, obligations }` |
| Obligations | Scope predicate, approval requirement, audit level, re-auth requirement |
| Failure | Unknown action, missing scope or policy error → deny |
| Side effects | None; the caller performs audit and state changes |

The policy module may read cached entitlement and configuration data, but it must
not call a business service. This keeps decisions fast and testable.

### 5.2 The twelve steps

Every server entry point performs the same sequence. This is the Stage 1 model,
fixed here as an architecture.

| # | Step | Question | Failure behaviour |
| --- | --- | --- | --- |
| 1 | Authenticate | Is there a valid, unexpired, unrevoked session? | `401`; no detail |
| 2 | Resolve tenant | Which tenant is bound to this session? | `401`; never accept a tenant from input |
| 3 | Resolve membership | Is the membership active? | `403` or sign-out; sessions revoked if suspended |
| 4 | Check entitlement | Is the module enabled for this tenant's plan? | `404` or an upgrade state; no data |
| 5 | Check permission | Does the actor hold the required `PERM-*`? | `403`/`404` per existence policy |
| 6 | Check scope | Is the record inside the actor's data scope? | Excluded or `404` |
| 7 | Check state | Does the record state permit this action? | `409`/`423` with a safe reason |
| 8 | Check separation of duties | Is the actor a prohibited counterparty? | `403` with a policy reason |
| 9 | Evaluate approval | Does the action exceed an approval boundary? | Route to approval, not execute |
| 10 | Execute | Perform the operation in one transaction | Roll back; no partial effect |
| 11 | Audit | Append an immutable event for consequential actions | Transaction fails if audit cannot be written |
| 12 | Respond | Return the minimum data the actor may see | Projection only |

**Ordering rules:**

- **Validation precedes authorization** (`RL-02`) so malformed input cannot be
  used to probe policy.
- **Authorization precedes data access** (`RL-03`) so denied records are never
  loaded into memory.
- **Audit is inside the transaction** for consequential actions (`RL-04`,
  `ADR-025`).
- **Approval is not permission.** Passing step 9 does not grant step 5; both are
  required.

### 5.3 Decision outputs

```
Decision {
  allow: boolean
  reasonCode: string            // stable, e.g. ONO-AUTHZ-004
  obligations: {
    scopePredicate?: ScopePredicate
    approvalRequired?: { policyId, threshold, approvers }
    reAuthRequired?: boolean
    auditLevel: 'none' | 'standard' | 'sensitive' | 'restricted'
    maskFields?: string[]
  }
}
```

| Rule | Detail |
| --- | --- |
| Explainability | A denial carries a reason code and correlation ID, never another tenant's data |
| Stability | Reason codes are permanent; messages may change |
| Testability | The policy module is unit-tested against a permission × scope × state × SoD matrix |
| No role branching | Callers never branch on role names; they branch on the decision |

### 5.4 Denial semantics

| Situation | Response | Rationale |
| --- | --- | --- |
| No session | `401` | Authentication required |
| Valid session, wrong tenant | `404` | Do not confirm the tenant exists |
| Authenticated, not permitted, resource existence is sensitive | `404` | Prevent enumeration |
| Authenticated, not permitted, existence already known (for example an action button on a visible record) | `403` + reason code | Honest affordance |
| Record outside scope in a list | Omitted from `data` and counts | `SCOPE-2` |
| Entitlement missing | `404` or an upgrade state in UI | Do not leak plan details of another tenant |
| State conflict | `409`/`423` | Not an authorization failure |
| SoD conflict | `403` with `ONO-AUTHZ-SOD-*` | Policy reason is safe to disclose |
| Policy engine failure | `503` for reads, `503` for writes; never allow | Fail closed |

---

## 6. Permission model

### 6.1 Permission format

`PERM-<RESOURCE>.<ACTION>`, exactly as defined in
`ROLES_AND_PERMISSION_MODEL.md` §3. Resources are singular upper-case domain
nouns; actions are enumerated.

| Rule | Detail |
| --- | --- |
| No wildcards | `PERM-*` is not a grant; every action is explicit |
| `MANAGE` is scoped | Applies to configuration objects only, never business records |
| `VIEW` is scoped | It does not imply tenant-wide list visibility |
| `POST` is financial | Only finance roles with the grant may post |
| `EXECUTE` is action-bound | Used for approved automation, not general mutation |

### 6.2 Roles

Roles are **templates**, not security boundaries. A tenant may compose a custom
role from permitted grants but may not exceed the ceiling of the templates it
composes.

| Rule | Detail |
| --- | --- |
| System roles | Platform-defined, versioned, immutable per version |
| Custom roles | Tenant-owned, composed from entitled permissions, reviewed on save |
| Ceiling | A custom role cannot grant a permission absent from the tenant's entitled modules or from its template set |
| Versioning | Every role change records previous grants and affected memberships |
| Deletion | Blocked while memberships reference the role |
| Owner role | Cannot be deleted; transfer only |
| Multi-role | Effective permissions are the union of role grants, then intersected with entitlement and scope |

**No negative permissions in v1.** The only global negative is a suspended
tenant or membership. If explicit deny is later required, it needs an ADR because
it changes evaluation order.

### 6.3 Effective permission resolution

```
effective = union(role grants)
          ∩ entitled modules
          ∩ sensitivity ceiling
          ∩ tenant boundary
```

Scope is applied separately as a predicate on records, not as a permission.

---

## 7. Data scopes

### 7.1 Scope dimensions

| Scope | Dimension | Applied to |
| --- | --- | --- |
| `tenant` | Whole organisation | Tenant-wide roles |
| `branch` | Selected branch IDs | Branch managers, branch accountants |
| `department` | Selected department IDs | Department managers |
| `team` | Selected team IDs | Team leads |
| `own` | Records owned by the actor | Sales reps, project members |
| `assigned` | Explicitly assigned records | Tasks, cases, approvals |
| `sensitivity` | Classification ceiling | HR, finance, restricted records |
| `state` | Lifecycle state | Approvers seeing submitted records only |

### 7.2 Scope algebra

| Rule | Detail |
| --- | --- |
| Union within a dimension | Multiple branches, departments or teams are OR-ed |
| Intersection across dimensions | Different dimensions are AND-ed |
| Role scope union | For a given permission, the actor receives the union of scopes from roles that grant it |
| Tenant clip | No scope may exceed the resolved tenant |
| Sensitivity clip | A record above the ceiling is excluded even if the scope would include it |
| State clip | A state-scoped grant applies only in that state |
| Empty scope | Grants nothing; the module appears empty (`SCOPE-6`) |

### 7.3 Scope predicate

The policy module returns a **predicate**, not a list of IDs:

```
ScopePredicate {
  tenantId: string                 // mandatory, always first
  branchIds?: string[]
  departmentIds?: string[]
  teamIds?: string[]
  ownerUserIds?: string[]
  assignedUserIds?: string[]
  maxClassification: 'public' | 'internal' | 'confidential' | 'restricted'
  states?: string[]
}
```

The repository compiles the predicate into the query. **A query without a
`tenantId` predicate is a defect**, even if the scope predicate is otherwise
correct.

### 7.4 Scope edge cases

| Case | Behaviour |
| --- | --- |
| Multi-role user | Union of grants, intersected with scope; conflicts surfaced at assignment |
| Manager of two branches | Branch scope covers both; reports distinguish |
| External contractor | Expiring membership, restricted scope, no export |
| Departed employee | Suspended; owned records reassigned; history retained |
| Auditor | Read-only across scope, including audit; no writes |
| Tenant with one user | Owner holds all roles; conflicts acknowledged and logged |
| Cross-tenant consultant | Separate memberships; separate sessions; no shared context |
| Permission changed mid-session | Effective on next request; cache TTL is short and bounded |
| Reassignment | New owner gains scope; previous owner loses it unless another grant applies |

---

## 8. Object-level authorization

Authentication and permission checks are not enough; every record access must
prove the record is inside scope.

| Control | Rule |
| --- | --- |
| Record load | Load with the scope predicate applied in the query, not after loading |
| Detail pages | A non-visible record produces the not-found state (`TA-06`) |
| Lists | Denied rows are excluded, not counted |
| Counts | Approximate totals must be computed over the permitted set, or omitted |
| Search | Results are scope-filtered; no result count leak |
| Exports | Scope-filtered at query time; the file contains only permitted rows |
| Reports and dashboards | Metric visibility and dimension scope evaluated before query |
| Drill-down | Re-authorizes each record when opened; aggregates never expose denied rows |
| Attachments | Inherit the linked record's permission; signed URL is short-lived |
| Notifications | Opening a notification re-authorizes the target; a stale link shows not-found |
| Webhooks | Resolve tenant from the integration record, then apply the same scope rules |
| Imports | Validate that every row belongs to the target tenant; reject foreign IDs |
| Merge/convert | Both source and target must be in scope |
| Bulk actions | Authorized per record; partial success is explicit |

**Opaque IDs are not authorization.** An unguessable ID prevents enumeration but
does not replace scope checks.

---

## 9. Separation of duties

`SOD-1`–`SOD-6` in `ROLES_AND_PERMISSION_MODEL.md` are architectural constraints,
not UI warnings.

| Conflict | Enforcement point | Behaviour |
| --- | --- | --- |
| Requester vs approver (`SOD-1`) | Approval decision | Block with a policy reason |
| Procurement vs payment (`SOD-2`) | Payment posting | Block unless the tenant has acknowledged the conflict |
| Sales discount vs approval (`SOD-3`) | Discount approval | Block self-approval above limit |
| Role administration vs audit (`SOD-4`) | Role and audit permissions | Cannot hold both destructive audit and role management |
| Model training vs promotion (`SOD-5`) | Model registry | Promotion requires a second approver |
| Expense claimant vs approver (`SOD-6`) | Expense approval | Block self-approval |

### 9.1 Small-tenant reality

A five-person business may need one person to hold most roles. The architecture
does not pretend otherwise:

1. The tenant acknowledges the conflict explicitly at assignment.
2. Conflicting actions are audited with elevated visibility.
3. The tenant's compliance view shows reduced approval coverage as a documented
   risk.
4. The platform does not silently disable the action.

The goal is honest operation, not theoretical purity. Hiding the risk is the
failure mode.

### 9.2 Delegation

| Rule | Detail |
| --- | --- |
| Time-boxed | Delegation has a start and end |
| Reason-bound | A reason is required and stored |
| Audited | Grant and use are audited |
| Non-transitive | A delegate cannot re-delegate |
| Revocable | The delegator or an administrator can revoke immediately |
| Scope-clipped | Delegation cannot exceed the delegator's scope |

---

## 10. Approval integration

Approval is a second gate after authorization. It answers "may this person do
this, given the amount and context?" — not "is this person allowed to use the
feature?"

| Rule | Detail |
| --- | --- |
| Both required | Permission + approval; neither substitutes for the other |
| Threshold evaluation | Server-side in the policy/workflow module, never in the UI |
| Version binding | Approval is bound to the record version; a material edit invalidates it (`APPR-2`) |
| Self-approval | Blocked (`SOD-1`, `SOD-6`) |
| Execution | The requester or an authorized executor applies the approved transition; the approver needs `EXECUTE` only if they perform it |
| Expiry | Approval requests expire; an expired approval cannot be applied |
| Rejection | Requires a reason and returns the record to a defined state |
| Audit | Approver, timestamp, decision, reason and subject version are immutable |
| Delegation | A delegate approves as themselves; the audit shows both identities |

---

## 11. Enforcement points

Every path that can read or write tenant data is enumerated here. A new path
requires a policy call and a test.

| Entry point | Identity source | Policy call | Failure behaviour | Audit |
| --- | --- | --- | --- | --- |
| RSC page render | Session cookie | Full 12-step, read action | Not-found or sign-in | Sensitive reads |
| Server action | Session cookie + origin check | Full 12-step, write action | Typed error union | Consequential writes |
| `/api/v1` route handler | Session or service credential | Full 12-step | Problem Details | Consequential writes |
| Webhook handler | Signature + integration record | Integration identity + tenant resolution | Reject unsigned | Delivery and failure |
| Background job | Service identity + explicit tenant | Re-check membership and entitlement | Stop and dead-letter | Job outcome |
| Scheduled report | Owner identity or service identity | Metric visibility + scope | Omit or fail with reason | Generation and download |
| Export/download | Session + signed URL | Re-authorize at issue; short TTL | Expired link | Download |
| Search | Session | Scope-filtered query | Empty result | Sensitive searches |
| Drill-down | Session | Re-authorize each record | Not-found per record | Sensitive reads |
| AI tool call | Requesting actor context | Tool allow-list + actor policy | Tool error, no data | Tool invocation |
| Notification link | Session | Re-authorize target | Not-found | None |
| Platform admin | Platform session | Platform policy + support grant | Deny | Tenant audit |
| Support session | Platform session + grant | Grant scope only | Deny | Tenant audit |
| Migration/ops script | Operator credential | Out-of-band, break-glass | Abort | Separate ops audit |

**No path is exempt.** "Internal" is not an identity.

---

## 12. Database enforcement

### 12.1 Repository tenant guard

| Rule | Detail |
| --- | --- |
| Mandatory predicate | Every repository query includes `tenantId` from `ActorContext` |
| No raw query without review | Raw SQL is allowed only inside repositories and must include the tenant predicate |
| Single writer | Only the owning module writes its tables (`MD-06`) |
| Query helper | A shared helper constructs the tenant predicate; bypassing it requires review |
| Test | A cross-tenant probe asserts that every repository rejects a foreign tenant ID |

### 12.2 Row-level security (proposed)

RLS is **defence in depth**, not the primary control (`OD-037`).

| Aspect | Proposed approach |
| --- | --- |
| Session variable | `SET LOCAL app.tenant_id` inside the transaction |
| Policy | `USING (tenant_id = current_setting('app.tenant_id')::text)` on tenant-owned tables |
| App role | No `BYPASSRLS`; separate migration role |
| Pooling | Transaction pooling is required for `SET LOCAL`; session pooling without reset is unsafe (`RISK-018`) |
| Failure | Missing tenant variable denies all rows |
| Tests | RLS tests run with the application role, not a superuser |
| Rollout | Can be enabled per table; a table without RLS must still have the repository guard |

**Why not rely on RLS alone:** RLS does not express approval state, separation of
duties, field masking or cross-module scope. It is a backstop for the tenant
predicate, not a replacement for the policy module.

### 12.3 Database roles

| Role | Purpose | Restrictions |
| --- | --- | --- |
| `ono_app` | Application runtime | No DDL, no `BYPASSRLS`, no direct audit update |
| `ono_migrate` | Migrations | DDL only; not used by the app |
| `ono_readonly` | Analytics/replica | Read-only, no tenant bypass |
| `ono_ops` | Break-glass operations | Separate credentials, MFA, audited |

### 12.4 What the database cannot enforce

| Concern | Why | Where enforced |
| --- | --- | --- |
| Approval state | Cross-domain workflow | Policy + workflow module |
| Separation of duties | Actor relationship | Policy module |
| Field masking | Presentation and export | Service projection + policy obligations |
| Entitlement | Plan configuration | Policy module |
| AI tool authority | Runtime context | Inference orchestrator |
| Cross-tenant existence hiding | Response semantics | API/service layer |

---

## 13. Jobs, events, files and analytics

### 13.1 Jobs

| Rule | Detail |
| --- | --- |
| Tenant context | Every job row carries `tenantId`; every unit of work re-establishes it |
| Identity | Service identity plus `onBehalfOf` when the job acts for a user |
| Membership check | If the actor's membership is suspended, the job stops; it does not continue under stale authority |
| Entitlement check | A disabled module's jobs stop cleanly |
| Scope | A job uses the narrowest scope needed, not tenant-wide by default |
| Audit | Job outcome is audited; payloads are not |
| Failure | Retry within policy; dead-letter with owner and reason |

### 13.2 Events and projections

| Rule | Detail |
| --- | --- |
| Tenant explicit | Every tenant event carries `tenantId`; consumers verify it against the projection |
| No ambient authority | An event does not grant permission (`EV-09`) |
| Projection scope | Consumer-owned projections are tenant-scoped and rebuilt per tenant |
| Cross-tenant guard | Dispatcher and consumer both assert the tenant; a mismatch is a security incident |
| Replay | Replay runs under a service identity with audit |

### 13.3 Files and documents

| Rule | Detail |
| --- | --- |
| Authorization at issue | A signed URL is issued only after the linked record's policy check |
| Short TTL | Signed URLs expire quickly; they are bearer tokens while valid |
| Tenant namespace | Object keys are tenant-prefixed and non-guessable |
| Malware scan | Upload is quarantined until scanned (`OD-043`) |
| Download audit | Sensitive downloads are recorded |
| Deletion | Soft-delete with retention; signed URLs stop working |

### 13.4 Analytics and BI

| Rule | Detail |
| --- | --- |
| Metric visibility | Metric-level permission before query |
| Dimension scope | Branch/department filters are clipped to the actor's scope |
| Suppression | Small cohorts are suppressed, not zeroed (`SCOPE-3`) |
| Drill-down | Re-authorizes records; a denied row is not counted |
| Export | Scope-filtered; async and audited for large ranges |

### 13.5 AI and inference

| Rule | Detail |
| --- | --- |
| Context retrieval | Only records the actor may see (`INF-R-1`) |
| Tool execution | Under the actor's context, allow-listed (`ADR-033`, `ADR-034`) |
| No ambient credentials | The engine has no credentials of its own (`AI-SEC-10`) |
| Evidence | Every claim resolves to a record, metric or model the actor may see |
| Output | Never reveals another tenant's data, prompts or provider internals |
| Tenant opt-out | AI can be disabled per tenant without losing core function (`OD-029`) |

### 13.6 Marketplace (future)

| Rule | Detail |
| --- | --- |
| Separate credentials | No operational database credentials |
| Aggregates only | No record-level export (`PR-10`) |
| Purpose binding | Each grant names a purpose |
| Governance | Separate programme, legal review (`OD-025`) |

---

## 14. Platform administration and support access

`PLAT-1`–`PLAT-6` are fixed here as architecture.

| Rule | Detail |
| --- | --- |
| No implicit access | A platform administrator has no default permission to tenant business records |
| Support grant | Names the tenant, reason, scope, duration, approver and ticket reference |
| Tenant approval | Required for sensitive modules per tenant policy (`OD-020`) |
| Read-only default | Grants are read-only unless the reason explicitly requires a write |
| Financial restriction | Support grants cannot modify financial postings (`PLAT-5`) |
| Tenant audit | Every support action is written to the tenant's audit log (`PLAT-4`) |
| Expiry | Grants expire automatically; renewal requires a new decision |
| Break-glass | Two-person authorization, immediate alert, post-incident review (`PLAT-6`) |
| Impersonation | **Not supported in v1.** If required later, it needs an ADR, explicit tenant consent and a visible banner |

**Platform staff accounts are separate from tenant memberships.** A platform
operator does not become a tenant user to provide support.

---

## 15. Caching and freshness

| Concern | Rule |
| --- | --- |
| Decision cache | Optional; key includes tenant, user, membership version, policy version and resource scope facts |
| TTL | Short and bounded (proposed ≤ 30 s); never indefinite |
| Revocation | Session revocation is checked on every request; a cached decision cannot outlive it |
| Entitlement change | Invalidated by `platform.plan.changed` / `org.setting.changed` |
| Role change | Invalidated by membership/role version bump |
| Cross-tenant reuse | Prohibited; cache keys are tenant-namespaced |
| UI `can` map | A response projection, not a cache authority |
| Public cache | Never for authenticated tenant responses |

A cache is an optimization. If the cache is unavailable, the system falls back to
the database and remains correct.

---

## 16. Failure behaviour

| Failure | Reads | Writes | Rationale |
| --- | --- | --- | --- |
| Session store unavailable | `503` | `503` | Cannot prove identity |
| Policy module error | `503` | `503` | Fail closed |
| Entitlement cache unavailable | Recompute from DB; if unavailable, `503` | `503` | Never guess entitlements |
| Database unavailable | `503` | `503` | No partial truth |
| Identity provider unavailable | Existing sessions continue until expiry; new sign-in fails | Same | Do not extend sessions silently |
| RLS misconfiguration | Deny all rows | Deny | Backstop must fail closed |
| Audit write failure | Read may proceed if the read is not sensitive; sensitive read denied | Transaction rolls back | Audit is part of the write |
| Outbox dispatch failure | Business write still commits | Business write still commits | Delivery is asynchronous |

**No failure mode allows access.** A degraded system may be unavailable; it may
not be permissive.

---

## 17. Verification

| Test | What it proves | Phase |
| --- | --- | --- |
| Cross-tenant read probe | Every repository rejects a foreign tenant ID | PH-08 |
| Cross-tenant write probe | No update/delete crosses the tenant boundary | PH-08 |
| IDOR matrix | Every detail endpoint returns not-found for out-of-scope IDs | PH-09 |
| Role × permission matrix | Each role can perform exactly its granted actions | PH-05 |
| Scope matrix | Branch/department/team/own/assigned behave as specified | PH-05 |
| SoD tests | Self-approval and prohibited pairs are blocked | PH-09 |
| Approval version test | A material edit invalidates an approval | PH-09 |
| Support grant test | Access is scoped, expiring, read-only and tenant-audited | PH-24 |
| Job identity test | A suspended actor's job stops | PH-10 |
| AI tool scope test | A tool cannot exceed the actor's scope | PH-23 |
| RLS test with pooling | `SET LOCAL` is safe under the chosen pooler | PH-08 |
| Denial leak test | `404` responses do not differ by tenant existence | PH-09 |
| Cache revocation test | A revoked session cannot use a cached decision | PH-05 |

**Rule:** no test, no claim. A security property that is not tested is an
assumption.

---

## 18. Phase mapping

| Phase | Tenancy and authorization work |
| --- | --- |
| PH-02 | This architecture accepted; invariants and enforcement points reviewed |
| PH-03 | Lint/graph rules for policy imports; test harness |
| PH-05 | Identity, sessions, membership, policy module, role templates, scopes |
| PH-06 | Shell respects server-provided `can` map |
| PH-08 | Tenant guard, composite FKs, RLS decision, probes |
| PH-09 | Approval integration, SoD, API denial semantics |
| PH-10 | Job identity, audit, support grant scaffolding |
| PH-11–15 | Module-level scope and permission tests |
| PH-16–18 | Metric visibility, dimension scope, suppression |
| PH-19–21 | Dataset and serving tenant isolation |
| PH-22–23 | Inference context and AI tool authority |
| PH-24 | Platform admin, support grants, entitlements |
| PH-25 | Full cross-tenant and authorization verification |

---

## 19. Open decisions

| ID | Question | Blocks |
| --- | --- | --- |
| `OD-003` | Authentication provider and session model | PH-05 |
| `OD-017` | Approval thresholds and currency handling | PH-09 |
| `OD-019` | Permission DSL exposed to tenants, or composition only | PH-05 |
| `OD-020` | Support grant approval: always or sensitive modules only | PH-24 |
| `OD-024` | Session lifetime, idle timeout, re-authentication rules | PH-05 |
| `OD-037` | RLS in v1 or later; pooling strategy | PH-08 |
| `OD-018` | Jurisdictions in scope at launch | PH-05 |
| `OD-022` | Data residency | PH-05 |
| `OD-033` | Controller/processor allocation | PH-05 |
| `OD-034` | Approved sub-processors | PH-05 |
| `OD-035` | Special-category data excluded from v1 | PH-05 |

---

## 20. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Stage 2 tenancy, identity, authorization, scope, SoD, platform boundary and enforcement architecture. No implementation. |
