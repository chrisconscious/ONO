# ONO — Roles and Permission Model

| Field | Value |
| --- | --- |
| Document | Roles and Permission Model |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` |
| Requirements | `REQ-IAM-004` … `REQ-IAM-008`, `REQ-SEC-002`, `REQ-SEC-003` |

---

## 1. Organisational structure

```
Platform (ONO)
└── Tenant (customer organisation)              ← isolation boundary
    ├── Branch (operating location)
    │   └── Department
    │       └── Team
    └── Department (may span branches)
        └── Team
            └── Membership (user + role + scope)
```

| Level | Purpose | Key rules |
| --- | --- | --- |
| Platform | ONO operations | No implicit access to tenant business data |
| Tenant | Customer organisation | All business data carries `tenantId` |
| Branch | Physical/logical location | Data may be branch-scoped; financial consolidation is tenant-wide |
| Department | Functional grouping | Owns budgets, objectives and approvals |
| Team | Working group | Assignment target; inherits department scope |
| Membership | User's participation in a tenant | A user may belong to multiple tenants only by explicit invitation |

### 1.1 Structural rules

| ID | Rule |
| --- | --- |
| ORG-STR-1 | A tenant has one owner; ownership transfer is an audited, confirmed action. |
| ORG-STR-2 | Closing a branch does not delete its records; records remain for reporting and audit. |
| ORG-STR-3 | A user may hold several roles in one tenant and different roles across tenants. |
| ORG-STR-4 | A contractor or external collaborator is a membership with restricted scope and an expiry date. |
| ORG-STR-5 | Suspending a membership immediately revokes sessions and stops job execution on their behalf. |
| ORG-STR-6 | Departments may be re-parented; historical approvals retain the department at decision time. |

## 2. Role catalogue

Roles are **templates**. Tenants may create custom roles by composing permissions,
but may never exceed the grants of the composing template set.

| Role code | Display name | Typical scope | Key grants | Notable limits |
| --- | --- | --- | --- | --- |
| `ROLE-PLATFORM-ADMIN` | Platform administrator | Platform | Tenant lifecycle, plans, flags, platform health | No tenant business records without an audited grant |
| `ROLE-PLATFORM-SUPPORT` | Platform support | Platform | View tenant metadata, diagnostics, support grants | Read-only on tenant configuration; no financial records |
| `ROLE-TENANT-OWNER` | Owner | Tenant | Everything within the tenant, including billing and ownership transfer | Cannot grant platform-level access |
| `ROLE-ORG-ADMIN` | Organisation administrator | Tenant | Users, roles, settings, industry config, audit view | Cannot change financial postings or approve own requests |
| `ROLE-GENERAL-MANAGER` | General manager | Tenant / all branches | Cross-module read, approvals within threshold, reports | Cannot alter system configuration or audit |
| `ROLE-SALES-MANAGER` | Sales manager | Department / team | Pipeline, quotes, discount approval within limit, team performance | Cannot post journals or change prices beyond limit |
| `ROLE-SALES-REP` | Sales representative | Own records | Leads, contacts, own opportunities, draft quotes | No discount override; no company-wide reports |
| `ROLE-MARKETING-MANAGER` | Marketing manager | Tenant | Campaigns, audiences, attribution, consent configuration | No access to financial ledgers |
| `ROLE-FINANCE-MANAGER` | Finance manager | Tenant | Invoices, payments, budgets, period close, financial reports | Cannot approve own expenses; cannot delete posted entries |
| `ROLE-ACCOUNTANT` | Accountant | Tenant | Invoices, bills, payments, reconciliations, exports | Period close requires finance manager; no role management |
| `ROLE-OPERATIONS-MANAGER` | Operations manager | Tenant / branches | Projects, inventory, procurement approvals, delivery | No payroll or role changes |
| `ROLE-INVENTORY-OFFICER` | Inventory officer | Branch / warehouse | Stock movements, counts, transfers | Adjustments above threshold require approval |
| `ROLE-PROCUREMENT-OFFICER` | Procurement officer | Branch / department | Suppliers, requests, purchase orders within limit | Cannot approve own request or match invoices |
| `ROLE-PROJECT-MANAGER` | Project manager | Assigned projects | Tasks, milestones, assignments, project budgets | No cross-project visibility by default |
| `ROLE-PROJECT-MEMBER` | Project member | Assigned tasks | Update own tasks, log time, add documents | Cannot change budget or client terms |
| `ROLE-HR-MANAGER` | HR / workforce manager | Tenant | Employee records, capacity, sensitive HR fields | No financial ledger access |
| `ROLE-SUPPORT-AGENT` | Support agent | Assigned queues | Cases, customer history, knowledge base | No sales pricing or contract changes |
| `ROLE-AUDITOR` | Auditor | Tenant | Read-only audit log, reports, evidence exports | No write access anywhere |
| `ROLE-CUSTOM-*` | Tenant-defined | Tenant-defined | Composed subset of permitted grants | Cannot exceed template ceiling; reviewed on save |

### 2.1 Role rules

| ID | Rule |
| --- | --- |
| ROLE-1 | Every role is tenant-scoped except the two platform roles. |
| ROLE-2 | A role grant is a set of `PERM-*` permissions plus a default scope. |
| ROLE-3 | Custom roles cannot grant a permission absent from the tenant's entitled module set. |
| ROLE-4 | Roles are versioned; changing a role records the previous grants and affected memberships. |
| ROLE-5 | Deleting a role is blocked while memberships reference it; reassignment is required first. |
| ROLE-6 | The owner role cannot be deleted, only transferred. |

## 3. Permission taxonomy

Format: `PERM-<RESOURCE>.<ACTION>`.

| Element | Allowed values |
| --- | --- |
| `RESOURCE` | Singular upper-case domain noun: `TENANT`, `USER`, `ROLE`, `LEAD`, `OPPORTUNITY`, `QUOTATION`, `CONTRACT`, `ORDER`, `INVOICE`, `PAYMENT`, `JOURNAL`, `EXPENSE`, `BUDGET`, `PRODUCT`, `STOCK`, `PURCHASEORDER`, `SUPPLIER`, `PROJECT`, `TASK`, `EMPLOYEE`, `CASE`, `DOCUMENT`, `DASHBOARD`, `REPORT`, `METRIC`, `MODEL`, `RECOMMENDATION`, `ACTION`, `AUDIT`, `INTEGRATION`, `SETTING`, `APPROVAL` |
| `ACTION` | `VIEW`, `CREATE`, `UPDATE`, `DELETE`, `ARCHIVE`, `EXPORT`, `IMPORT`, `APPROVE`, `REJECT`, `POST`, `EXECUTE`, `MANAGE`, `ASSIGN`, `CONFIGURE` |

### 3.1 Action semantics

| Action | Meaning |
| --- | --- |
| `VIEW` | Read the record within scope; never implies list-wide visibility |
| `CREATE` | Create new records of the type |
| `UPDATE` | Modify mutable fields; not state transitions |
| `DELETE` | Remove or archive, per entity policy |
| `ARCHIVE` | Soft-retire without data loss |
| `EXPORT` | Produce a file containing records |
| `IMPORT` | Bring external records in |
| `APPROVE` / `REJECT` | Decide an approval request |
| `POST` | Commit an accounting or ledger effect |
| `EXECUTE` | Run an approved action |
| `MANAGE` | Full lifecycle of configuration objects |
| `ASSIGN` | Reassign ownership or queue membership |
| `CONFIGURE` | Change tenant configuration |

`MANAGE` is **not** a wildcard over business records. It applies to
configuration objects only and is explicitly enumerated.

## 4. Data scopes

Authorisation is the intersection of **permission** and **scope**. Holding a
permission without scope grants nothing.

| Scope | Dimension | Example |
| --- | --- | --- |
| `tenant` | Whole organisation | Finance manager sees all invoices |
| `branch` | Specific branches | Branch accountant sees two of five branches |
| `department` | Specific departments | Sales manager sees the sales department only |
| `team` | Specific team | Team lead sees team-owned pipeline |
| `own` | Records the user owns | Sales rep sees own leads |
| `assigned` | Explicitly assigned records | Project member sees assigned tasks |
| `sensitivity` | Classification ceiling | HR manager sees `confidential`, not `restricted-financial` |
| `state` | Record lifecycle state | Approver sees submitted records only |

### 4.1 Scope rules

| ID | Rule |
| --- | --- |
| SCOPE-1 | Scope is evaluated server-side on every access, including lists, detail, exports, reports, jobs and AI tools. |
| SCOPE-2 | A denied record is excluded from lists and counts, not returned with an error. |
| SCOPE-3 | Aggregations must not leak denied records through totals; suppressed cells follow a documented rule. |
| SCOPE-4 | Reassignment transfers scope; the previous owner loses access unless they hold another grant. |
| SCOPE-5 | Scope changes are audited with actor, before and after. |
| SCOPE-6 | A user with no scope for a module sees an empty module, not an error page. |

## 5. Authorisation decision model

Every server entry point (page render, route handler, server action, job, export,
webhook handler, AI tool call) performs the same evaluation:

1. **Authenticate** — establish a valid session or reject.
2. **Resolve tenant** — from the session, never from client-supplied input.
3. **Resolve membership** — confirm active membership in that tenant.
4. **Check entitlement** — confirm the module is enabled for the tenant.
5. **Check permission** — confirm the `PERM-*` grant for the action.
6. **Check scope** — confirm the record is inside the actor's data scope.
7. **Check state** — confirm the record state permits the action.
8. **Check separation of duties** — confirm the actor is not the prohibited counterparty.
9. **Evaluate approval requirement** — route to approval if the action exceeds a boundary.
10. **Execute** — perform the operation inside a transaction.
11. **Audit** — append an immutable audit event for consequential actions.
12. **Respond** — return the minimum data the actor may see.

### 5.1 Rules

| ID | Rule |
| --- | --- |
| AUTHZ-1 | Default deny: absence of a matching grant is denial. |
| AUTHZ-2 | Client-side checks are usability only; they are never the control. |
| AUTHZ-3 | Tenant identity is derived from the authenticated session, never from request parameters. |
| AUTHZ-4 | A missing record and a forbidden record return the same response where disclosure would leak existence. |
| AUTHZ-5 | Authorisation failures are logged with correlation ID, actor, resource and reason code. |
| AUTHZ-6 | Background jobs run under an explicit service identity with the same rules. |
| AUTHZ-7 | An AI tool invocation carries the requesting user's scope; it may never widen it. |

## 6. Separation of duties and conflicting roles

| ID | Conflict | Rule |
| --- | --- | --- |
| SOD-1 | Requester vs approver | A user cannot approve their own request |
| SOD-2 | Procurement vs payment | The officer who raises a purchase order cannot post its payment |
| SOD-3 | Sales discount vs approval | A rep cannot approve their own discount above limit |
| SOD-4 | Role administration vs audit | A user who can manage roles cannot also delete audit events |
| SOD-5 | Model training vs promotion | The person who trains a model should not solely promote it to production |
| SOD-6 | Expense claimant vs approver | Self-approval is always blocked |

Conflicts are configuration-aware: a very small business may legitimately need one
person to hold several roles. In that case the tenant must:

1. Acknowledge the conflict explicitly during role assignment.
2. Have the conflicting actions audited with elevated visibility.
3. Accept reduced approval coverage, shown as a documented risk on the tenant's
   compliance view.

Blocking a small business from operating is not acceptable; hiding the risk is.

## 7. Approval boundaries

Thresholds are **proposals requiring approval** (`OD-017`). Values are per tenant,
per currency, and may be overridden within platform maximums.

| Action | Default boundary | Approver |
| --- | --- | --- |
| Quotation discount | Above 10% | Sales manager |
| Quotation discount | Above 20% | General manager / finance |
| Purchase order | Above tenant threshold | Department manager, then finance |
| Stock adjustment | Above tenant threshold | Operations manager |
| Expense claim | Above tenant threshold | Finance manager |
| Invoice write-off | Any | Finance manager |
| Journal reversal | Any | Finance manager |
| Record deletion (financial) | Never | Archive only |
| Recommendation execution | Per action class | Record owner + approver |
| Role change granting `APPROVE` | Any | Owner or org admin |
| Custom industry profile change | Any | Owner |

### 7.1 Approval rules

| ID | Rule |
| --- | --- |
| APPR-1 | An approval decision records approver, timestamp, decision, reason and evidence version. |
| APPR-2 | Approval is bound to the specific record version; a later material edit invalidates it. |
| APPR-3 | Escalation paths and timeouts are explicit, not implicit. |
| APPR-4 | Delegation is time-boxed, reason-bound and audited. |
| APPR-5 | Rejection requires a reason and returns the record to a defined state. |

## 8. Platform administrator boundary

| ID | Rule |
| --- | --- |
| PLAT-1 | Platform administrators do not receive a default permission to read tenant business records. |
| PLAT-2 | Access to tenant data requires a support grant naming the tenant, the reason, the scope and an expiry. |
| PLAT-3 | Where tenant policy requires it, a support grant needs tenant approval before activation. |
| PLAT-4 | Every support session action is recorded in the tenant's own audit log. |
| PLAT-5 | Support grants cannot be used to modify financial postings. |
| PLAT-6 | Break-glass access exists for incidents, requires two-person authorisation and triggers immediate review. |

## 9. Invitations and membership lifecycle

| State | Entry | Allowed transitions | Notes |
| --- | --- | --- | --- |
| `invited` | Admin invites | `active`, `expired`, `revoked` | Invitation expires; single use |
| `active` | Acceptance | `suspended`, `removed` | Session established |
| `suspended` | Admin action | `active`, `removed` | Sessions revoked immediately |
| `removed` | Admin action | — | Records retained; attribution preserved |
| `expired` | Time limit | `invited` (reissue) | No access granted |

## 10. Edge cases

| Case | Expected behaviour |
| --- | --- |
| Multi-role user | Union of grants, intersected with scope; conflicts surfaced |
| Manager of two branches | Branch scope covers both; reports distinguish |
| External contractor | Expiring membership, restricted scope, no export |
| Departed employee | Suspended within one business day; owned records reassigned |
| Auditor | Read-only across scope, including audit log; nothing else |
| Tenant with one user | Owner holds all roles; conflicts acknowledged and logged |
| Cross-tenant consultant | Separate memberships, never a shared session |
| Permission changed mid-session | Change takes effect on next request; no stale caching beyond a short TTL |
| Deleted role | Blocked; explicit reassignment first |
| Emergency access | Break-glass with two-person rule and post-incident review |

## 11. Audit requirements for access control

| Event | Required fields |
| --- | --- |
| Role created/updated/deleted | Actor, role, before/after grants, timestamp |
| Membership invited/changed/suspended | Actor, target user, change, reason |
| Permission denied (sensitive resource) | Actor, resource, action, reason code, correlation ID |
| Support grant issued/used/revoked | Issuer, approver if required, tenant, scope, expiry |
| Scope changed | Actor, user, before/after scope |
| Approval decision | Approver, record, version, decision, reason |

## 12. Requirements mapping

| Requirement | Coverage |
| --- | --- |
| `REQ-IAM-004` | §9 invitations and lifecycle |
| `REQ-IAM-005` | §2 role catalogue, §2.1 rules |
| `REQ-IAM-006` | §5 authorisation model |
| `REQ-IAM-007` | §4 data scopes |
| `REQ-IAM-008` | §2 multi-role, §6 separation of duties |
| `REQ-SEC-002` | §5 entry-point checklist |
| `REQ-SEC-003` | §5.1 default deny, §8 platform boundary |

## 13. Open decisions

| ID | Question |
| --- | --- |
| `OD-017` | Exact approval thresholds and currency handling for boundaries |
| `OD-019` | Is a permission DSL exposed to tenants, or only pre-approved role composition? (Baseline: composition only.) |
| `OD-020` | Does a support grant require tenant approval always, or only for sensitive modules? |
| `OD-024` | Session lifetime, idle timeout and re-authentication rules |

## 14. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial role, permission, scope and approval model. |
