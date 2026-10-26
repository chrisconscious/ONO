# ONO — Security, Privacy and Compliance Requirements

| Field | Value |
| --- | --- |
| Document | Security, Privacy and Compliance Requirements |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — no control is implemented yet |
| Requirements | `REQ-SEC-001` … `REQ-SEC-008`, `REQ-DATA-*`, `REQ-OPS-*` |

> **No compliance claim.** Nothing in this document asserts that ONO is compliant
> with any law, regulation or standard. It records requirements and open
> questions. Any compliance statement requires qualified legal review for the
> relevant jurisdiction and a verified control assessment.

---

## 1. Security principles

| ID | Principle |
| --- | --- |
| SP-1 | Default deny — absence of a grant is denial |
| SP-2 | Least privilege — minimum permission for the minimum time |
| SP-3 | Defence in depth — no single control is trusted alone |
| SP-4 | Tenant isolation is a structural invariant, not a feature |
| SP-5 | Server-side enforcement — the client is never the control |
| SP-6 | Fail closed — errors deny access rather than grant it |
| SP-7 | Complete mediation — every entry point authorises |
| SP-8 | Auditability — consequential actions are attributable |
| SP-9 | Minimise data — collect and retain only what is needed |
| SP-10 | Assume breach — detection, containment and recovery are designed |

---

## 2. Threat model summary

### 2.1 Assets

| Asset | Why it matters |
| --- | --- |
| Tenant business records | Commercial confidentiality |
| Personal data (contacts, employees) | Legal and ethical obligations |
| Financial records | Integrity, fraud, statutory retention |
| Credentials and secrets | Direct compromise path |
| Session tokens | Account takeover |
| Audit trail | Non-repudiation, investigation |
| Model artefacts and datasets | IP and privacy |
| Platform configuration | Tenant-wide impact |

### 2.2 Adversaries

| Actor | Motivation | Primary controls |
| --- | --- | --- |
| Malicious tenant user | Access another tenant's data, escalate role | Tenancy guard, policy engine |
| Compromised account | Fraud, data theft | MFA, session revocation, anomaly detection |
| Insider (support/admin) | Curiosity, coercion | Support grants, audit in tenant log, break-glass review |
| External attacker | Data theft, disruption | Auth hardening, rate limits, patching, WAF |
| Malicious integration | Exfiltration | Scoped credentials, egress control, allow-listed calls |
| Prompt injector | Manipulate AI tools | Instruction/data separation, tool allow-list |
| Accidental user | Data loss, over-share | Confirmations, exports logging, scope defaults |

### 2.3 Priority threats

| ID | Threat | Key controls |
| --- | --- | --- |
| T-01 | Cross-tenant read/write | Repository tenant guard, RLS, automated probes |
| T-02 | Privilege escalation via role editing | Template ceilings, SOD checks, audit |
| T-03 | Exfiltration via export or report | Scope filtering, export logging, rate limits |
| T-04 | Credential stuffing | Rate limiting, lockout, MFA |
| T-05 | Session hijacking | HttpOnly/Secure cookies, rotation, short idle timeout |
| T-06 | Insecure direct object reference | Server-side scope checks on every ID |
| T-07 | Injection (SQL, prompt) | Parameterised queries, validated input, data/instruction separation |
| T-08 | Malicious file upload | Type/size validation, scanning, isolated storage |
| T-09 | Supply-chain compromise | Lockfile, review, advisory monitoring |
| T-10 | Insider data access | Support grants, tenant-visible audit |
| T-11 | Backup theft | Encryption at rest, restricted restore access |
| T-12 | AI-generated harmful action | Approval requirement, allow-list, no financial tools |

---

## 3. Tenant isolation (`REQ-SEC-001`)

| ID | Requirement |
| --- | --- |
| TI-1 | Tenant identity derives from the session; request parameters can never select a tenant |
| TI-2 | Every tenant-owned query includes a tenant predicate applied by the repository layer |
| TI-3 | Cross-tenant IDs return "not found", indistinguishable from non-existent |
| TI-4 | Caches, queues, object storage keys and job payloads are tenant-namespaced |
| TI-5 | Aggregations cannot reveal another tenant's existence or volume |
| TI-6 | Exports and reports are filtered before generation and re-checked at delivery |
| TI-7 | Defence in depth: row-level security policies proposed at the database layer (ADR-006) |
| TI-8 | Automated tests attempt cross-tenant access on every repository and fail the build |
| TI-9 | Platform staff access requires an explicit, audited support grant |
| TI-10 | A tenant's audit log records support access into that tenant |

---

## 4. Authentication and session security

| ID | Requirement |
| --- | --- |
| AU-1 | Passwords, where used, are hashed with a memory-hard algorithm and per-user salt |
| AU-2 | Minimum password policy is configurable, with a secure default and breach-list check |
| AU-3 | Sign-in attempts are rate-limited per account and per IP |
| AU-4 | MFA is available to all users and enforceable for privileged roles |
| AU-5 | Session cookies are `HttpOnly`, `Secure`, `SameSite=Lax` or stricter |
| AU-6 | Sessions rotate on sign-in and on privilege change |
| AU-7 | Idle and absolute timeouts are enforced (`OD-024`) |
| AU-8 | Suspension revokes all sessions immediately |
| AU-9 | Recovery tokens are single-use, time-limited and audited |
| AU-10 | Re-authentication is required for sensitive actions |

---

## 5. Authorisation

| ID | Requirement |
| --- | --- |
| AZ-1 | Every page, route handler, server action, job, export, file and AI tool authorises server-side |
| AZ-2 | Permissions and scopes are evaluated together; a grant without scope is nothing |
| AZ-3 | Denied records are excluded from lists and counts, not returned with an error |
| AZ-4 | Authorisation decisions are logged with a reason code for sensitive resources |
| AZ-5 | Client-side checks are convenience only |
| AZ-6 | Separation-of-duties rules are enforced in services, not only in the UI |
| AZ-7 | Platform roles do not imply tenant data access |

Detail: `ROLES_AND_PERMISSION_MODEL.md`.

---

## 6. Data protection

### 6.1 Classification

| Class | Examples | Handling |
| --- | --- | --- |
| `public` | Product help text | No restriction |
| `internal` | Aggregated tenant metrics | Authenticated tenant users with permission |
| `confidential` | Customer records, contracts, pricing | Permission + scope; export logged |
| `restricted` | Financial postings, employee sensitive data, credentials | Strict permission, re-auth where configured, masked by default |
| `secret` | Integration credentials, keys | Never displayed; encrypted; access logged |

### 6.2 Controls

| ID | Requirement |
| --- | --- |
| DP-1 | TLS 1.2+ in transit; encryption at rest for database, backups and object storage |
| DP-2 | Integration credentials encrypted with a managed key, never logged or returned |
| DP-3 | Personal data minimised; fields not required for the workflow are not collected |
| DP-4 | Sensitive fields masked in lists by default, revealed only with permission |
| DP-5 | Exports of confidential or restricted data are logged and rate-limited |
| DP-6 | Backups are encrypted and access-restricted; restore is tested |
| DP-7 | Deletion follows the retention matrix; legal hold overrides |
| DP-8 | No production data in development or test environments |
| DP-9 | Logs exclude record contents, tokens and unnecessary personal data |
| DP-10 | Screenshot/print surfaces do not expose data the user cannot view |

---

## 7. Input validation and output safety

| ID | Requirement |
| --- | --- |
| IN-1 | All external input validated against a schema at the boundary |
| IN-2 | Database access is parameterised; no string-built SQL |
| IN-3 | Output is escaped by default; raw HTML from user or model content is prohibited |
| IN-4 | Uploads validated by content type, size and extension; scanned before availability |
| IN-5 | File downloads are permission-checked; signed URLs are short-lived |
| IN-6 | Redirects are restricted to allow-listed destinations |
| IN-7 | Errors expose a stable code and correlation ID only |
| IN-8 | API responses return only fields the actor may see |

---

## 8. Secrets and configuration

| ID | Requirement |
| --- | --- |
| SC-1 | No secret in source control, logs, error messages or client bundles |
| SC-2 | Secrets stored in a managed secret store per environment |
| SC-3 | Only `NEXT_PUBLIC_*` values reach the browser, and only non-sensitive ones |
| SC-4 | Secrets rotated on a schedule and on suspected exposure |
| SC-5 | Access to secrets is least-privilege and audited |
| SC-6 | Local development uses placeholder values from `.env.example` only |

---

## 9. Audit and monitoring

| ID | Requirement |
| --- | --- |
| AM-1 | Critical operations emit immutable audit events (financial, permission, configuration, AI action, support access) |
| AM-2 | Audit events include actor, tenant, target, before/after, reason and correlation ID |
| AM-3 | Audit records cannot be modified or deleted by application roles |
| AM-4 | Audit queries and exports are themselves audited |
| AM-5 | Security-relevant anomalies raise alerts with an owner |
| AM-6 | Retention and archiving follow policy (`OD-023`) |
| AM-7 | Tenants can review their own audit trail within permission |

---

## 10. File and document security

| ID | Requirement |
| --- | --- |
| FS-1 | Object storage is private; access only through the application |
| FS-2 | Storage keys are tenant-namespaced and non-guessable |
| FS-3 | Virus/malware scanning before a document is downloadable |
| FS-4 | Version history is preserved; deletion is soft then purged per policy |
| FS-5 | Document permissions inherit from the linked record and may not exceed it |
| FS-6 | Sharing links, if introduced, are time-limited, revocable and audited |

---

## 11. AI-specific security

| ID | Requirement |
| --- | --- |
| AI-1 | Retrieved content is treated as data, never as instructions |
| AI-2 | Tools are allow-listed per use case and role |
| AI-3 | Tool arguments are schema-validated; scope cannot be widened |
| AI-4 | The inference engine has no ambient credentials |
| AI-5 | Financial and permission-changing tools are unavailable in v1 |
| AI-6 | Model and prompt versions are recorded per run |
| AI-7 | Outputs are validated and labelled before display |
| AI-8 | Prompt-injection attempts are detected, logged and neutralised |
| AI-9 | Tenant data is not sent to an external model provider without an approved data-processing basis |
| AI-10 | AI features can be disabled per tenant |

Detail: `AI_ML_INFERENCE_SPECIFICATION.md` §9.

---

## 12. API and integration security

| ID | Requirement |
| --- | --- |
| API-1 | Authentication on every non-public endpoint |
| API-2 | Rate limiting per actor, per tenant and per endpoint class |
| API-3 | CSRF protection for cookie-based state-changing requests |
| API-4 | CORS restricted to known origins; no wildcard with credentials |
| API-5 | Webhooks verified by signature and replay-protected |
| API-6 | Integration credentials scoped to the minimum provider permissions |
| API-7 | Outbound calls use timeouts, retry caps and circuit breaking |
| API-8 | Third-party responses are treated as untrusted input |

---

## 13. Privacy requirements

| ID | Requirement |
| --- | --- |
| PR-1 | Each processing purpose is documented before data is collected for it |
| PR-2 | Lawful basis is recorded for marketing communication and any special-category data |
| PR-3 | Consent is recorded with source, timestamp and scope, and is revocable |
| PR-4 | Data-subject requests (access, correction, deletion, portability) have a defined process and SLA |
| PR-5 | Tenant data is logically separated; ONO staff access is exceptional and audited |
| PR-6 | Retention periods are defined per data class and enforced |
| PR-7 | Cross-border transfer is identified and lawful before it occurs |
| PR-8 | Privacy notices are provided to end users by the tenant and/or ONO as appropriate |
| PR-9 | Analytics and model training do not repurpose data beyond the declared purpose |
| PR-10 | No sale of identifiable tenant or personal data, ever |

### 13.1 Roles

| Role | Responsibility |
| --- | --- |
| Tenant | Controller for its business and customer data |
| ONO | Processor for tenant data; controller for platform account data |
| Sub-processors | Listed, contracted, and reviewed before use |

This allocation must be confirmed by counsel; it is a working model, not a legal
determination.

---

## 14. Jurisdiction and open compliance questions

| ID | Question | Status |
| --- | --- | --- |
| `OD-018` | Which jurisdictions are in scope at launch, and what local obligations apply? | Open |
| `OD-022` | Data residency: single region, or per-tenant region? | Open |
| `OD-023` | Audit and financial retention periods by jurisdiction | Open |
| `OD-033` | Is ONO a controller or processor for each data category? | Open — legal review |
| `OD-034` | Which sub-processors (hosting, email, AI provider) are acceptable? | Open |
| `OD-035` | Special-category data (health, biometric) — in scope or excluded for v1? | Open |

> Tanzania: local data-protection legislation may apply to ONO and to tenants
> operating there. ONO makes **no** compliance claim. A qualified local adviser
> must confirm obligations, registration requirements, transfer rules and
> retention before launch in that market. The same applies to any other
> jurisdiction named in the product.

---

## 15. Incident response

| Stage | Requirement |
| --- | --- |
| Detect | Alerts on auth anomalies, error spikes, drift, job failure, isolation test failure |
| Triage | Severity matrix with a named on-call owner |
| Contain | Session revocation, feature disable, credential rotation, tenant isolation |
| Eradicate | Root cause fix, dependency patch |
| Recover | Restore from verified backup, replay safely |
| Notify | Tenant and regulator notification where legally required, within required timelines |
| Review | Blameless post-incident review with actions and owners |
| Record | Timeline, decisions, evidence retained |

Break-glass access during an incident follows `PLAT-6` (two-person authorisation,
immediate review).

---

## 16. Backup, continuity and recovery

| ID | Requirement |
| --- | --- |
| BC-1 | Automated encrypted backups with a defined schedule |
| BC-2 | Restore tested at least quarterly, with evidence |
| BC-3 | RPO and RTO documented and approved (`OD-021`) |
| BC-4 | Point-in-time recovery for the primary database |
| BC-5 | Document storage versioned and protected against deletion |
| BC-6 | Runbooks for database loss, region failure and credential compromise |
| BC-7 | Recovery drills include tenant-scoped restore verification |

---

## 17. Security verification

| Test class | Frequency | Gate |
| --- | --- | --- |
| Dependency audit | Every build | No unresolved critical advisory |
| SAST / lint security rules | Every change | Blocking |
| Cross-tenant isolation probes | Every change | Blocking |
| Authorisation matrix tests | Every change touching policy | Blocking |
| Upload and injection tests | Per module | Blocking |
| Prompt-injection suite | Per AI change | Blocking |
| Penetration test | Before launch and annually | Remediation tracked |
| Restore drill | Quarterly | Evidence recorded |
| Access review | Quarterly | Excess access removed |

---

## 18. Requirements mapping

| Requirement | Section |
| --- | --- |
| `REQ-SEC-001` | §3 tenant isolation |
| `REQ-SEC-002` | §5 authorisation |
| `REQ-SEC-003` | §1, §5 least privilege/default deny |
| `REQ-SEC-004` | §6 data protection and classification |
| `REQ-SEC-005` | §7 validation and output safety |
| `REQ-SEC-006` | §9 audit |
| `REQ-SEC-007` | §11 AI security |
| `REQ-SEC-008` | §8 secrets |
| `REQ-DATA-005` | §13 privacy, §6 retention |
| `REQ-OPS-003` | §16 backup and recovery |

## 19. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial security, privacy and compliance requirements. No compliance claimed. |
