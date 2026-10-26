# ONO — Business Workflow Catalog

| Field | Value |
| --- | --- |
| Document | Business Workflow Catalog |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` |
| Scope | Cross-module workflows, lifecycle states, rules, exceptions and audit requirements |

---

## 1. How workflows are defined

Each workflow has: a trigger, an explicit state machine, business rules,
exceptions, and audit obligations. States are persisted, not implied by UI.

| Convention | Meaning |
| --- | --- |
| `WF-<DOMAIN>-NN` | Workflow identifier |
| States in `monospace` | Persisted record states |
| Rules `ID` | Testable business rule |
| Exceptions | What must not be silently swallowed |
| Audit | Events that must be recorded |

Universal constraints applied to **every** workflow:

| ID | Universal rule |
| --- | --- |
| U-01 | Every transition is authorised server-side. |
| U-02 | Every transition is tenant-scoped. |
| U-03 | Every consequential transition writes an audit event. |
| U-04 | Transitions are atomic; partial application is not permitted. |
| U-05 | A transition on a stale record version fails with a conflict, never overwrites. |
| U-06 | Every workflow has an explicit terminal state and a defined archive policy. |
| U-07 | No workflow sends external communication without consent and template review. |
| U-08 | No workflow deletes financial or audit records. |

---

## 2. Organisation and identity workflows

### WF-ORG-01 — Tenant onboarding and provisioning
| Field | Detail |
| --- | --- |
| Trigger | Prospective customer completes setup |
| States | `draft` → `validated` → `provisioning` → `active` (or `failed`) |
| Rules | Provision tenant, owner membership, default roles, industry profile, numbering and settings in one transaction (`IND-FLOW-6`) |
| Exceptions | Duplicate slug/name → offer alternatives; payment/plan failure → `provisioning` rollback, no orphan tenant |
| Audit | `tenant.created`, `tenant.provisioned`, `owner.assigned` |

### WF-ORG-02 — Branch or department change
| Field | Detail |
| --- | --- |
| Trigger | Admin adds, renames, moves or closes a branch/department |
| States | `active` → `archived` |
| Rules | Closing preserves records; historical approvals retain the department at decision time (`ORG-STR-2`, `ORG-STR-6`) |
| Exceptions | Branch with open approvals cannot be archived until reassigned |
| Audit | `branch.created/updated/archived`, `department.reparented` |

### WF-IAM-01 — Invitation and acceptance
| Field | Detail |
| --- | --- |
| Trigger | Admin invites a user |
| States | `invited` → `active` / `expired` / `revoked` |
| Rules | Single-use token, expiry, role and scope fixed at acceptance; email must match |
| Exceptions | Email mismatch → reject; expired → reissue; existing user in another tenant → separate membership |
| Audit | `membership.invited/accepted/revoked` |

### WF-IAM-02 — Role or permission change
| Field | Detail |
| --- | --- |
| Trigger | Admin edits a role or assignment |
| States | `draft` → `applied` → `superseded` |
| Rules | Versioned grants; affected memberships enumerated; conflicts surfaced (`ROLE-4`, `SOD-*`) |
| Exceptions | Change would remove the last owner-level grant → blocked |
| Audit | `role.updated` with before/after grants, `membership.role_changed` |

### WF-IAM-03 — Offboarding and access revocation
| Field | Detail |
| --- | --- |
| Trigger | Employee departure, suspension or policy breach |
| States | `active` → `suspended` → `removed` |
| Rules | Revoke sessions immediately; stop queued jobs; reassign owned records; retain attribution |
| Exceptions | Sole owner → ownership transfer required first |
| Audit | `membership.suspended`, `session.revoked`, `records.reassigned` |

### WF-IAM-04 — Platform support access grant
| Field | Detail |
| --- | --- |
| Trigger | Support request or incident |
| States | `requested` → `approved` → `active` → `expired` / `revoked` |
| Rules | Named tenant, reason, scope, expiry; tenant approval where required (`PLAT-2`, `PLAT-3`); two-person rule for break-glass |
| Exceptions | Grant cannot touch financial postings (`PLAT-5`); expiry is automatic |
| Audit | Every action inside the grant is written to the tenant's audit log |

---

## 3. Industry workflows

### WF-IND-01 — Custom industry intake and curation
| Field | Detail |
| --- | --- |
| Trigger | Tenant selects "Other — my industry is not listed" |
| States | `captured` → `provisional` → `in_review` → `published` / `retained-provisional` |
| Rules | Full platform available immediately (`IND-CUSTOM-1`); tenant-private (`IND-CUSTOM-2`); human decision required to publish (`IND-CUSTOM-3`) |
| Exceptions | Abusive name → moderation; duplicate of existing industry → suggest match |
| Audit | `custom_industry.captured`, `profile.published`, `tenant.notified` |

### WF-IND-02 — Industry profile change
| Field | Detail |
| --- | --- |
| Trigger | Tenant selects a new industry or the ONO team publishes a profile version |
| States | `proposed` → `previewed` → `applied` (or `declined`) |
| Rules | Additive and reversible (`IND-PROFILE-1`); plan entitlement respected (`IND-PROFILE-3`); never delete records |
| Exceptions | Metric parameter conflict → explicit tenant choice; plan gap → upsell prompt, no silent partial apply |
| Audit | `profile.previewed`, `profile.applied`, `profile.declined` |

---

## 4. CRM workflows

### WF-CRM-01 — Lead capture and qualification
| Field | Detail |
| --- | --- |
| Trigger | Manual entry, import, web form or integration |
| States | `new` → `contacted` → `qualified` → `converted` / `disqualified` |
| Rules | Source recorded; owner assigned by rule or round-robin; qualification criteria per tenant |
| Exceptions | Duplicate detected → merge review before conversion; missing consent → block outreach |
| Audit | `lead.created`, `lead.assigned`, `lead.qualified/disqualified` |

### WF-CRM-02 — Lead conversion
| Field | Detail |
| --- | --- |
| Trigger | Sales rep converts a qualified lead |
| States | `qualified` → `converting` → `converted` |
| Rules | Creates or links company, contact and opportunity atomically; preserves source history (`REQ-CRM-006`) |
| Exceptions | Partial creation is rolled back; existing company match requires confirmation |
| Audit | `lead.converted` with created record references |

### WF-CRM-03 — Duplicate merge
| Field | Detail |
| --- | --- |
| Trigger | Match rule, import conflict or manual flag |
| States | `detected` → `reviewed` → `merged` / `dismissed` |
| Rules | Surviving record chosen explicitly; child records re-pointed; merge reversible only by support |
| Exceptions | Merging records with financial history is blocked from self-service |
| Audit | `duplicate.merged` with source, target and field survivorship |

### WF-CRM-04 — Activity and follow-up
| Field | Detail |
| --- | --- |
| Trigger | Rep logs a call, meeting, note or task |
| States | `open` → `completed` / `cancelled` / `overdue` |
| Rules | Follow-up requires owner and due date; overdue surfaces in dashboards |
| Exceptions | Logging against a denied record is rejected |
| Audit | `activity.created`, `activity.completed`, `followup.overdue` |

---

## 5. Sales and marketing workflows

### WF-SAL-01 — Opportunity progression
| Field | Detail |
| --- | --- |
| Trigger | Stage change by owner or manager |
| States | `qualifying` → `proposal` → `negotiation` → `won` / `lost` |
| Rules | Stage requires defined fields and evidence; `lost` requires a reason; probability derives from stage |
| Exceptions | Backward movement requires reason and is logged; stale opportunities flagged |
| Audit | `opportunity.stage_changed` with before/after and reason |

### WF-SAL-02 — Quote to order
| Field | Detail |
| --- | --- |
| Trigger | Quote accepted by customer |
| States | `draft` → `issued` → `accepted` / `rejected` / `expired` → `ordered` |
| Rules | Totals computed server-side (`REQ-SAL-003`); accepted quote creates an order in one transaction; tax and currency frozen at issue |
| Exceptions | Price changed after issue → reissue required; expired quote → cannot order |
| Audit | `quotation.issued/accepted/expired`, `order.created` |

### WF-SAL-03 — Discount approval
| Field | Detail |
| --- | --- |
| Trigger | Quote discount exceeds boundary |
| States | `pending` → `approved` / `rejected` / `escalated` |
| Rules | Thresholds per `APPR` table; approver cannot be the requester (`SOD-3`) |
| Exceptions | Approval invalidated by later material edit (`APPR-2`) |
| Audit | `approval.requested/decided`, `discount.granted` |

### WF-SAL-04 — Contract renewal
| Field | Detail |
| --- | --- |
| Trigger | Renewal date approaches |
| States | `upcoming` → `in_negotiation` → `renewed` / `lapsed` |
| Rules | Renewal surfaces 60 days ahead; terms require approval; linked orders updated |
| Exceptions | Auto-renew only where the contract explicitly states it and the tenant enables it |
| Audit | `contract.renewal_started/renewed/lapsed` |

### WF-MKT-01 — Campaign lifecycle
| Field | Detail |
| --- | --- |
| Trigger | Marketer creates a campaign |
| States | `planned` → `active` → `paused` → `completed` / `cancelled` |
| Rules | Budget and channel required; spend cannot exceed budget without approval |
| Exceptions | Sending to non-consented contacts is blocked (`REQ-MKT-004`) |
| Audit | `campaign.created/launched/paused/completed`, `spend.recorded` |

### WF-MKT-02 — Consent change
| Field | Detail |
| --- | --- |
| Trigger | Contact updates preference, or an unsubscribe arrives |
| States | `opted_in` → `opted_out` / `suppressed` |
| Rules | Opt-out is immediate and applies to all channels covered by the consent basis; suppression is permanent until re-consent |
| Exceptions | Conflicting consent signals → safest interpretation wins (no contact) |
| Audit | `consent.changed` with source and timestamp; never deleted |

---

## 6. Finance workflows

### WF-FIN-01 — Invoice issue and collection
| Field | Detail |
| --- | --- |
| Trigger | Order completed or manual billing |
| States | `draft` → `issued` → `partially_paid` → `paid` / `overdue` / `written_off` |
| Rules | Numbering per tenant pattern; currency and tax frozen at issue; posted invoices immutable (`REQ-FIN-002`) |
| Exceptions | Correction by credit note or reversal only; write-off requires finance manager |
| Audit | `invoice.issued`, `invoice.paid`, `invoice.written_off`, `credit_note.issued` |

### WF-FIN-02 — Payment application and reconciliation
| Field | Detail |
| --- | --- |
| Trigger | Payment received or imported from bank statement |
| States | `unallocated` → `allocated` → `reconciled` (or `exception`) |
| Rules | Allocation cannot exceed invoice balance; overpayment requires explicit handling |
| Exceptions | Unmatched payment stays in exception queue, never auto-applied to a guess |
| Audit | `payment.recorded`, `payment.allocated`, `reconciliation.completed` |

### WF-FIN-03 — Expense claim
| Field | Detail |
| --- | --- |
| Trigger | Employee submits an expense |
| States | `draft` → `submitted` → `approved` / `rejected` → `reimbursed` |
| Rules | Receipt required above threshold; category and tax code required; self-approval blocked (`SOD-6`) |
| Exceptions | Duplicate receipt detected → hold; missing evidence → return to submitter |
| Audit | `expense.submitted/approved/rejected/reimbursed` |

### WF-FIN-04 — Period close
| Field | Detail |
| --- | --- |
| Trigger | Accounting period end |
| States | `open` → `closing` → `closed` → `locked` |
| Rules | Close checklist: unposted items, unreconciled payments, stock valuation, accruals; only finance manager closes |
| Exceptions | Reopening a closed period requires owner approval and is reported |
| Audit | `period.closed`, `period.reopened` with reason |

### WF-FIN-05 — Credit note and reversal
| Field | Detail |
| --- | --- |
| Trigger | Customer dispute, error correction or return |
| States | `draft` → `issued` → `applied` |
| Rules | Reversal references the original; no deletion of posted entries (`REQ-FIN-002`) |
| Exceptions | Reversal exceeding original value is blocked |
| Audit | `credit_note.issued`, `journal.reversed` |

---

## 7. Inventory and procurement workflows

### WF-INV-01 — Stock receipt
| Field | Detail |
| --- | --- |
| Trigger | Purchase order receipt, transfer or production output |
| States | `expected` → `partially_received` → `received` / `rejected` |
| Rules | Every quantity change writes a movement naming actor, reason and reference (`REQ-INV-003`) |
| Exceptions | Over-receipt beyond tolerance requires approval; damaged goods go to quarantine |
| Audit | `stock.received`, `stock.rejected` |

### WF-INV-02 — Stock count and adjustment
| Field | Detail |
| --- | --- |
| Trigger | Cycle count or discrepancy |
| States | `scheduled` → `counting` → `variance_review` → `approved` / `rejected` |
| Rules | Counter cannot approve their own variance above threshold (`REQ-INV-005`) |
| Exceptions | Large unexplained variance escalates to operations manager; repeated variance flags control weakness |
| Audit | `stockcount.completed`, `stock.adjusted` with reason |

### WF-INV-03 — Reorder to purchase
| Field | Detail |
| --- | --- |
| Trigger | Stock at or below reorder point |
| States | `suggested` → `accepted` → `requested` |
| Rules | Suggested quantity considers lead time and open orders (`REQ-INV-004`) |
| Exceptions | Supplier on hold → block and notify |
| Audit | `reorder.suggested/accepted` |

### WF-PRC-01 — Purchase request and approval
| Field | Detail |
| --- | --- |
| Trigger | Department need or reorder suggestion |
| States | `draft` → `submitted` → `approved` / `rejected` → `ordered` |
| Rules | Budget check; threshold routing; requester cannot approve (`SOD-1`) |
| Exceptions | Over-budget → explicit override approval with reason |
| Audit | `purchase_request.submitted/approved/rejected` |

### WF-PRC-02 — Purchase order and receiving
| Field | Detail |
| --- | --- |
| Trigger | Approved request or direct order |
| States | `draft` → `issued` → `partially_received` → `received` / `cancelled` |
| Rules | Issued orders are versioned on amendment; receiving updates stock atomically |
| Exceptions | Price above quoted → hold for approval; short delivery → partial state |
| Audit | `purchase_order.issued/amended/cancelled`, `goods.received` |

### WF-PRC-03 — Three-way match and bill approval
| Field | Detail |
| --- | --- |
| Trigger | Supplier bill received |
| States | `unmatched` → `matched` / `exception` → `approved_for_payment` |
| Rules | PO line, receipt and bill must agree within tolerance (`REQ-PRC-004`) |
| Exceptions | Mismatch routes to exception queue with a named resolver; never auto-paid |
| Audit | `bill.matched`, `bill.exception_raised`, `bill.approved_for_payment` |

---

## 8. Projects, workforce and support workflows

### WF-PRJ-01 — Project initiation
| Field | Detail |
| --- | --- |
| Trigger | Won opportunity or internal initiative |
| States | `proposed` → `approved` → `active` → `completed` / `cancelled` |
| Rules | Requires owner, budget, dates and deliverables; approval per threshold |
| Exceptions | Missing client link → allowed for internal projects only |
| Audit | `project.proposed/approved/activated` |

### WF-PRJ-02 — Task delivery
| Field | Detail |
| --- | --- |
| Trigger | Assignment or schedule |
| States | `todo` → `in_progress` → `blocked` → `review` → `done` |
| Rules | Completion requires evidence where configured; blocked tasks require a reason |
| Exceptions | Overdue → escalation to project manager; reassignment preserves history |
| Audit | `task.status_changed`, `task.reassigned` |

### WF-PRJ-03 — Change request / variation
| Field | Detail |
| --- | --- |
| Trigger | Scope, cost or date change |
| States | `raised` → `assessed` → `approved` / `rejected` → `applied` |
| Rules | Variation updates budget and schedule atomically on approval; client approval recorded |
| Exceptions | Unapproved work cannot be billed as variation |
| Audit | `variation.raised/approved/applied` |

### WF-WFM-01 — Employee onboarding and offboarding
| Field | Detail |
| --- | --- |
| Trigger | Hire or departure |
| States | `pending` → `active` → `suspended` → `ended` |
| Rules | Employee record creation is separate from platform membership; linking is explicit |
| Exceptions | Departure triggers `WF-IAM-03` automatically |
| Audit | `employee.created/updated/ended` |

### WF-WFM-02 — Capacity allocation
| Field | Detail |
| --- | --- |
| Trigger | Project resourcing or schedule change |
| States | `proposed` → `confirmed` → `active` → `released` |
| Rules | Allocation cannot exceed available capacity without explicit override |
| Exceptions | Overallocation surfaces a conflict to both project managers |
| Audit | `allocation.confirmed/released` |

### WF-SUP-01 — Case lifecycle
| Field | Detail |
| --- | --- |
| Trigger | Customer contact or internal report |
| States | `new` → `assigned` → `in_progress` → `resolved` → `closed` / `reopened` |
| Rules | Resolution note required; SLA timer pauses on customer-waiting state |
| Exceptions | Reopening preserves history and resets SLA per policy |
| Audit | `case.created/assigned/resolved/closed/reopened` |

### WF-SUP-02 — SLA breach escalation
| Field | Detail |
| --- | --- |
| Trigger | SLA timer approaches or passes target |
| States | `at_risk` → `breached` → `escalated` |
| Rules | Warning at 75%, breach at 100%; escalation path configured per priority |
| Exceptions | Paused timers exclude waiting-on-customer time, documented per policy |
| Audit | `sla.at_risk`, `sla.breached`, `sla.escalated` |

---

## 9. Strategy and intelligence workflows

### WF-STR-01 — Objective setting and review
| Field | Detail |
| --- | --- |
| Trigger | Planning cycle |
| States | `draft` → `active` → `under_review` → `achieved` / `missed` |
| Rules | Objective binds to registered metrics or explicit milestones (`REQ-STR-002`) |
| Exceptions | Missing metric binding blocks activation |
| Audit | `objective.activated/reviewed` |

### WF-STR-02 — Risk review
| Field | Detail |
| --- | --- |
| Trigger | Scheduled review or new risk |
| States | `identified` → `assessed` → `mitigating` → `closed` / `accepted` |
| Rules | Likelihood, impact, owner and mitigation required for assessment |
| Exceptions | Accepted risks require owner sign-off |
| Audit | `risk.created/assessed/accepted/closed` |

### WF-BI-01 — Metric definition change
| Field | Detail |
| --- | --- |
| Trigger | Metric owner proposes a change |
| States | `proposed` → `reviewed` → `published` → `deprecated` |
| Rules | One definition per metric (`REQ-BI-001`); historical comparability assessed; change always creates a new version |
| Exceptions | Breaking change requires migration note and dashboard impact list |
| Audit | `metric.version_published`, `metric.deprecated` |

### WF-BI-02 — Report generation and distribution
| Field | Detail |
| --- | --- |
| Trigger | Schedule or manual request |
| States | `queued` → `generating` → `ready` / `failed` |
| Rules | Permission-filtered at generation time; recipient scope re-checked at delivery |
| Exceptions | Empty result is a valid report, not an error; failures notify the owner |
| Audit | `report.generated`, `report.delivered`, `export.downloaded` |

### WF-ML-01 — Model lifecycle
| Field | Detail |
| --- | --- |
| Trigger | New use case or retraining |
| States | `proposed` → `data_ready` → `trained` → `evaluated` → `approved` → `deployed` → `retired` |
| Rules | Baseline comparison required; held-out evaluation; model card; promotion is a separate approval (`REQ-ML-003`, `REQ-ML-004`) |
| Exceptions | Failing quality gate blocks deployment; failed model can never be "latest" |
| Audit | `model.trained/evaluated/promoted/retired` with metrics |

### WF-ML-02 — Drift response
| Field | Detail |
| --- | --- |
| Trigger | Monitoring threshold breach |
| States | `detected` → `investigating` → `retrain_scheduled` / `waived` |
| Rules | Drift alert names the feature and magnitude; serving continues only if calibrated and within tolerance |
| Exceptions | Severe drift degrades the insight to "insufficient data" rather than serving bad predictions |
| Audit | `model.drift_detected`, `model.retrained`, `model.serving_suspended` |

### WF-INF-01 — Insight generation
| Field | Detail |
| --- | --- |
| Trigger | Scheduled refresh, user request or threshold event |
| States | `queued` → `assembling_context` → `evaluating` → `published` / `insufficient_data` / `failed` |
| Rules | Only authorised context; rules before models; evidence required (`REQ-INF-001`–`003`) |
| Exceptions | Missing evidence → publish "insufficient data"; timeout → fail closed with a clear message |
| Audit | `inference.run_completed` with input scope, model versions and duration |

### WF-INF-02 — Recommendation approval and execution
| Field | Detail |
| --- | --- |
| Trigger | Recommendation published above action threshold |
| States | `proposed` → `under_review` → `approved` / `rejected` → `executing` → `executed` / `failed` |
| Rules | Human approval mandatory (`REQ-INF-005`); only allow-listed actions execute (`REQ-INF-006`); approval bound to recommendation version |
| Exceptions | Execution failure never retries silently; partial execution is compensating, not repeating |
| Audit | `recommendation.viewed/approved/rejected`, `action.executed/failed` |

### WF-INF-03 — Outcome measurement
| Field | Detail |
| --- | --- |
| Trigger | Measurement window elapses after execution |
| States | `scheduled` → `measuring` → `recorded` / `inconclusive` |
| Rules | Baseline captured before execution; compare like-for-like period and scope; "inconclusive" is a valid result |
| Exceptions | Confounding factors must be disclosed, not excluded silently |
| Audit | `outcome.recorded` with baseline, result and method |

### WF-INT-01 — Integration onboarding
| Field | Detail |
| --- | --- |
| Trigger | Tenant connects an external system |
| States | `configured` → `verifying` → `active` / `failed` |
| Rules | Least-privilege scopes; credentials encrypted (`REQ-SEC-008`); connection test before activation |
| Exceptions | Failure keeps the integration inactive and reports the exact error |
| Audit | `integration.connected/verified/failed` (credentials never logged) |

### WF-INT-02 — Import job
| Field | Detail |
| --- | --- |
| Trigger | User uploads or schedules an import |
| States | `uploaded` → `mapped` → `validated` → `importing` → `completed` / `partial` / `failed` |
| Rules | Row-level validation; rejected rows reported with reasons; idempotent re-run |
| Exceptions | Partial import must be visibly partial, never reported as complete |
| Audit | `import.started/completed` with row counts |

### WF-INT-03 — Webhook delivery failure
| Field | Detail |
| --- | --- |
| Trigger | Non-2xx response or timeout |
| States | `pending` → `retrying` → `delivered` / `dead_lettered` |
| Rules | Signed payloads; exponential backoff with a cap; dead-letter queue visible to the tenant |
| Exceptions | Duplicate delivery is idempotent via event ID |
| Audit | `webhook.delivery_failed/dead_lettered` |

---

## 10. Cross-module flows

| Flow | Modules | Trigger | Critical control |
| --- | --- | --- | --- |
| Lead → Cash | CRM → Sales → Finance | Lead converted and quote accepted | Quote totals server-computed; invoice references order |
| Procure → Pay | Procurement → Inventory → Finance | Reorder suggested | Three-way match before payment approval |
| Hire → Deliver | Workforce → Projects | New employee | Capacity cannot exceed availability |
| Insight → Action | BI → INF → Approvals | Metric threshold | Evidence required; human approval |
| Quote → Project | Sales → Projects | Won opportunity | Budget and deliverables required |
| Support → Retention | Support → CRM → BI | Case resolved | Consent respected in follow-up |

---

## 11. Universal audit requirements

| Requirement | Detail |
| --- | --- |
| `AUD-01` | Every workflow emits `created`, `state_changed` and `decided` events where applicable |
| `AUD-02` | Events capture actor, tenant, target, before/after state, reason and correlation ID |
| `AUD-03` | Events are append-only; correction is by new event, never edit |
| `AUD-04` | Financial, permission, configuration and AI-action events are retained per policy and exportable |
| `AUD-05` | Audit queries are themselves audited |

## 12. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial workflow catalogue (44 workflows). |
