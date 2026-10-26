# ONO — AI, ML and Inference Specification

| Field | Value |
| --- | --- |
| Document | AI, ML and Inference Specification |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — no models trained, no inference implemented |
| Requirements | `REQ-BI-*`, `REQ-ML-*`, `REQ-INF-*` |

---

## 1. Purpose and boundaries

ONO's intelligence layer exists to answer six questions honestly:

1. What is happening? → **descriptive analytics**
2. What changed and why might it have changed? → **diagnostic analysis**
3. What may happen next? → **prediction**
4. What could we do about it? → **decision intelligence**
5. What should we do, and how sure are we? → **recommendation**
6. Did it work? → **outcome measurement**

### 1.1 Separation of responsibilities

| Layer | Question | Method | Failure mode if conflated |
| --- | --- | --- | --- |
| Analytics | What is true now? | Deterministic calculation over registered metrics | Numbers nobody trusts |
| ML | What is likely next? | Statistical/ML models on versioned data | Confident nonsense |
| Inference engine | What follows from the evidence? | Orchestration of rules, metrics, models, context | Unexplainable outputs |
| Decision layer | What should be done? | Constraint evaluation, ranking, approval routing | Uncontrolled automation |

**Rule:** these are separate services with separate contracts. The inference
engine never trains models; the ML layer never decides policy; analytics never
invents values.

### 1.2 When *not* to use machine learning

Use deterministic logic when: the rule is known and stable; the cost of error is
high; the data volume is insufficient; explainability is mandatory; or the
decision is a policy, not a pattern.

| Task | Correct approach |
| --- | --- |
| Tax calculation | Deterministic rules |
| Approval routing | Deterministic thresholds |
| Reorder quantity with stable demand | Formula + lead time |
| Duplicate detection | Deterministic match rules first, similarity second |
| Anomaly in expenses | Statistical threshold, ML only with enough history |
| Lead scoring | ML only after sufficient labelled conversions |

---

## 2. Data and feature engineering

### 2.1 Dataset principles

| ID | Principle |
| --- | --- |
| DS-1 | Every dataset is versioned, immutable once published, and content-hashed |
| DS-2 | Every dataset declares its tenant scope, time window and schema |
| DS-3 | Training data is reproducible from a recorded snapshot reference |
| DS-4 | Features are defined in a registry with owner, definition, dtype and source |
| DS-5 | Labels are defined explicitly, including how they were derived and when |
| DS-6 | No label may use information unavailable at prediction time |
| DS-7 | Personal data is minimised; identifiers are replaced by internal keys |
| DS-8 | Tenant data is never pooled into a shared model without an approved governance decision (`OD-026`) |
| DS-9 | Synthetic or demo data is labelled and never used to claim production quality |
| DS-10 | Dataset deletion follows retention policy and leaves a provenance record |

### 2.2 Leakage controls

| Leakage type | Control |
| --- | --- |
| Temporal | Strict time-based splits; no future information in features |
| Target | Label excluded from feature set; automated check |
| Group | Split by customer/project, not by row, when the same entity repeats |
| Tenant | Cross-tenant contamination check for any pooled model |
| Post-outcome | Features derived after the event are prohibited |
| Selection | Cohort definition fixed before evaluation |

### 2.3 Minimum data thresholds

A model is not proposed unless the dataset meets a documented minimum:

| Use case class | Minimum history | Minimum positive examples |
| --- | --- | --- |
| Forecasting (demand, cash) | 24 months or 104 weekly points | N/A |
| Classification (churn, lead) | 12 months | 500 positives |
| Anomaly detection | 6 months baseline | N/A (baseline of normal) |
| Ranking/recommendation | 12 months | 1,000 decisions |

Below threshold → descriptive analytics or deterministic rules, with an explicit
"insufficient data" state.

---

## 3. Candidate use cases (prioritised proposals)

| ID | Use case | Method | Required data | Baseline to beat | Primary metric | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| UC-01 | Demand / reorder forecasting | Time series (ETS, gradient boosting) | Stock movements, orders, seasonality | Moving average | WAPE / MAPE | P1 |
| UC-02 | Cash-flow forecast | Time series with calendar effects | Invoices, payments, bills, recurring costs | Naive carry-forward | MAE vs baseline | P1 |
| UC-03 | Collections risk | Classification | Invoice history, payment behaviour, customer | Days-overdue rule | Precision @ top 20% | P1 |
| UC-04 | Lead conversion scoring | Classification | Lead attributes, activities, outcomes | Source-only rule | AUC / lift @ decile | P2 |
| UC-05 | Customer churn / retention | Classification | Activity, support, billing, contract | Recency rule | Recall @ fixed precision | P2 |
| UC-06 | Project delay risk | Classification/regression | Tasks, milestones, history, resourcing | Schedule slip heuristic | F1 / MAE | P2 |
| UC-07 | Expense anomaly detection | Unsupervised + rules | Expense history, categories, approvers | Fixed threshold | Precision at alert budget | P2 |
| UC-08 | Supplier performance prediction | Regression | Delivery, quality, price history | Last-3 average | MAE | P3 |
| UC-09 | Discount/margin optimisation | Causal/experimental | Quotes, win/loss, margins | Policy rules | Margin uplift at fixed win rate | P3 |
| UC-10 | Workforce utilisation forecast | Time series | Allocation, project pipeline | Current allocation | MAE | P3 |

**Rule:** an item moves up only when data availability is confirmed, not because
it is interesting.

---

## 4. Training and evaluation

### 4.1 Required artefacts per model

| Artefact | Content |
| --- | --- |
| Problem statement | Decision supported, user, cost of error |
| Dataset reference | Version, window, hash |
| Feature list | Names, definitions, availability at inference |
| Baseline | Simple rule or previous model, with metrics |
| Split strategy | Time-based / group-based, with justification |
| Metrics | Primary + secondary, with confidence intervals |
| Calibration | Reliability curve or interval coverage where probabilities are output |
| Bias review | Performance across segments (branch size, industry, tenure) |
| Model card | Intended use, limitations, prohibited use, owner, versions |
| Approval | Who accepted it and on what evidence |

### 4.2 Evaluation rules

| ID | Rule |
| --- | --- |
| ML-EVAL-1 | A model must beat its baseline on held-out data before deployment |
| ML-EVAL-2 | Metrics are reported with uncertainty, not a single point estimate |
| ML-EVAL-3 | Performance is reported per segment, not only in aggregate |
| ML-EVAL-4 | Probabilities must be calibrated if used for decisions with thresholds |
| ML-EVAL-5 | A model that cannot explain its top drivers is not used for consequential recommendations |
| ML-EVAL-6 | Evaluation data is never reused for tuning without recording that fact |
| ML-EVAL-7 | "Production-ready" is a status granted by an approved gate, never by a claim |

### 4.3 Model registry lifecycle

```
proposed → data_ready → trained → evaluated → approved → deployed → monitored → retired
```

| State | Entry condition | Exit condition |
| --- | --- | --- |
| `proposed` | Use case accepted | Dataset available |
| `data_ready` | Dataset versioned and validated | Training run completed |
| `trained` | Artefact stored, metrics computed | Evaluation reviewed |
| `evaluated` | Baseline beaten, model card written | Approval granted |
| `approved` | Named approver | Deployment |
| `deployed` | Serving verified | Retired or superseded |
| `monitored` | Live traffic | Drift or quality failure |
| `retired` | Superseded or unsafe | — |

Two-person rule: the person who trains a model does not solely approve it
(`SOD-5`).

---

## 5. Model serving contract

Every prediction call is a typed contract, not a free-form prompt.

| Field | Direction | Rule |
| --- | --- | --- |
| `requestId` | in/out | Idempotency and tracing |
| `tenantId` | in | Resolved server-side, never from the client |
| `actorId` | in | For authorisation and audit |
| `useCaseId` | in | Must map to a registered use case |
| `modelVersionId` | in | Pinned; no implicit "latest" in production |
| `features` | in | Validated against the feature schema; missing values explicit |
| `asOf` | in | Point-in-time anchor to prevent leakage |
| `prediction` | out | Typed value or distribution |
| `interval` | out | Lower/upper bound where applicable |
| `confidence` | out | Calibrated band or probability |
| `modelMeta` | out | Model key, version, dataset version, trainedAt |
| `warnings` | out | Out-of-distribution, low coverage, degraded mode |

| ID | Rule |
| --- | --- |
| SRV-1 | Requests are authorised before feature retrieval |
| SRV-2 | Timeouts are hard; the caller degrades gracefully |
| SRV-3 | Inputs are validated; unknown features are rejected, not ignored |
| SRV-4 | Out-of-distribution inputs return a warning and reduced confidence |
| SRV-5 | The response records model version for every served prediction |
| SRV-6 | Serving never writes back into the source record without an approval path |
| SRV-7 | Batch scoring is tenant-scoped and rate-limited |
| SRV-8 | Model unavailability never blocks core business operations |

---

## 6. Inference intelligence engine

### 6.1 Pipeline

```
1  Trigger              schedule | user question | metric threshold | business event
2  Authorise            actor + tenant + scope + entitlement
3  Assemble context     only records the actor may see
4  Establish facts      registered metrics, stated period and freshness
5  Evaluate rules       deterministic business rules first
6  Retrieve predictions call only relevant, approved models
7  Build evidence       link every claim to facts/metrics/models
8  Reason               bounded synthesis; no invented entities
9  Quantify uncertainty intervals, confidence, assumptions, coverage
10 Rank recommendations by expected impact, confidence, cost, risk, constraints
11 Publish or decline   "insufficient data" is a first-class outcome
12 Record the run       input scope, versions, duration, outcome
```

### 6.2 Rules

| ID | Rule |
| --- | --- |
| INF-R-1 | The engine may only use context retrieved under the actor's scope |
| INF-R-2 | Rules execute before models; a rule violation is never overridden by a prediction |
| INF-R-3 | Every claim carries an evidence reference or is labelled an assumption |
| INF-R-4 | Unavailable evidence produces "insufficient data", never filler text |
| INF-R-5 | Model outputs are consumed as typed values, not as prose to be trusted |
| INF-R-6 | The engine cannot execute actions; it can only propose them |
| INF-R-7 | Prompt or context content never grants new permissions |
| INF-R-8 | Every run is reproducible from its recorded input scope and versions |
| INF-R-9 | Cost and latency budgets are enforced per run |
| INF-R-10 | The engine degrades to rules-only when models are unavailable |

### 6.3 Context assembly

| Included | Excluded |
| --- | --- |
| Records within actor scope | Any record outside scope |
| Registered metric values with freshness | Ad hoc recomputation of metrics |
| Approved model outputs with metadata | Raw model internals or unapproved experiments |
| Tenant configuration relevant to the question | Other tenants' configuration or benchmarks |
| Historical decisions and outcomes | Unredacted personal data not needed for the question |

---

## 7. Decision intelligence

### 7.1 Decision model

| Element | Definition |
| --- | --- |
| Goal | The business objective (e.g. reduce overdue receivables) |
| Constraints | Budget, policy, capacity, contractual, legal |
| Options | Candidate actions drawn from an allow-list |
| Expected effect | Estimated impact with interval and assumptions |
| Cost | Direct cost, effort, risk |
| Reversibility | Reversible, costly to reverse, irreversible |
| Approval requirement | Automatic, single approver, multi-approver |
| Measurement plan | Baseline, window, metric, comparison method |

### 7.2 Action allow-list (proposed v1)

| Action class | Example | Executable in v1 | Approval |
| --- | --- | --- | --- |
| Notify | Alert an owner about overdue invoices | Yes | None (notification only) |
| Assign | Reassign a lead to an available rep | Yes | Single |
| Create draft | Draft a follow-up task or quotation | Yes | Single |
| Schedule | Schedule a report or reminder | Yes | None |
| Adjust threshold | Change reorder point | Yes | Single |
| Send communication | Email a customer | No (PH-23) | Multi |
| Financial posting | Issue invoice or credit note | No | Multi |
| Price change | Change catalogue price | No (PH-23) | Multi |

Anything not on the allow-list is a **recommendation only** and must be executed
manually by a human in the normal UI.

### 7.3 Ranking

Recommendations are ordered by a documented combination of expected impact,
confidence, cost, risk and urgency — not by a hidden score. The ranking inputs
are shown to the user in plain language.

---

## 8. Uncertainty and explanation format

Every published insight carries:

| Element | Requirement |
| --- | --- |
| Type label | `fact`, `metric`, `prediction`, `assumption`, `recommendation` |
| Statement | One claim per statement |
| Evidence | References to records, metrics or model outputs |
| Period | Time window the claim applies to |
| Confidence | Band, interval or calibrated probability |
| Assumptions | Explicit list that would change the conclusion |
| Limitations | Known gaps or confounds |
| Freshness | When the underlying data was last updated |

### 8.1 Prohibited output patterns

| Prohibited | Why |
| --- | --- |
| Invented customers, invoices, amounts or dates | Fabrication |
| "Revenue will be 4.2M" without interval and basis | False precision |
| Causal claims from correlation alone | Misleading |
| Regulatory or tax assurances | Liability |
| Confident advice on insufficient data | Dishonesty |
| Hidden assumptions | Unfalsifiable |
| Unlabelled model output presented as a metric | Category error |

---

## 9. Prompt injection and tool-use defence

| ID | Control |
| --- | --- |
| AI-SEC-1 | Retrieved content (emails, documents, notes) is data, never instructions |
| AI-SEC-2 | Tools are allow-listed per use case and per role |
| AI-SEC-3 | Tool arguments are validated server-side against schemas |
| AI-SEC-4 | A tool call cannot escalate the actor's scope |
| AI-SEC-5 | Financial and permission-changing tools are not available to the assistant in v1 |
| AI-SEC-6 | Content that appears to contain instructions is flagged and ignored |
| AI-SEC-7 | Outputs are validated before display; no raw HTML from a model |
| AI-SEC-8 | Every tool invocation is logged with actor, arguments hash and result status |
| AI-SEC-9 | Rate and cost limits apply per user and per tenant |
| AI-SEC-10 | The engine has no ambient credentials of its own |

---

## 10. Monitoring and feedback

| Signal | What it detects | Action |
| --- | --- | --- |
| Prediction volume and latency | Serving health | Alert on error budget |
| Input distribution drift | Data drift | Investigate, retrain |
| Performance decay | Model drift | Suspend if beyond tolerance |
| Calibration drift | Over/under-confidence | Recalibrate |
| Recommendation acceptance rate | Usefulness | Review ranking and framing |
| Action completion rate | Friction | Improve workflow |
| Outcome vs predicted impact | Value realisation | Retrain, adjust expectations |
| "Insufficient data" rate | Coverage gaps | Improve data capture, not model complexity |
| User dismissal reason | Trust erosion | Investigate explanations |

### 10.1 Feedback loop rules

| ID | Rule |
| --- | --- |
| FB-1 | Acceptance, rejection and outcome are recorded as separate signals |
| FB-2 | Rejection reasons are captured in structured form |
| FB-3 | Outcomes use a pre-registered measurement plan, not a post-hoc choice |
| FB-4 | Confounding factors are disclosed, never silently excluded |
| FB-5 | Feedback data is not used to train a model without versioning the dataset |
| FB-6 | Inconclusive results are reported as inconclusive |

---

## 11. Evaluation of the intelligence layer itself

| Level | Test | Pass condition |
| --- | --- | --- |
| Unit | Metric formula correctness | Matches hand-calculated fixtures |
| Unit | Evidence linking | Every claim resolves to an existing record |
| Integration | Scope isolation | No evidence leaks outside actor scope |
| Offline | Model quality | Beats baseline on held-out data |
| Shadow | Recommendation usefulness | Reviewed by domain expert before pilot |
| Pilot | Real-world acceptance | Measured acceptance and outcome on a limited cohort |
| Adversarial | Prompt injection | Injected instructions do not alter behaviour |
| Degradation | Model outage | Rules-only path remains functional and labelled |

---

## 12. Governance

| ID | Rule |
| --- | --- |
| GOV-1 | Every model has a named owner and a model card |
| GOV-2 | Every deployment is approved and auditable |
| GOV-3 | Tenant data stays tenant-scoped unless pooling is explicitly approved |
| GOV-4 | Users are told when they are interacting with AI-generated content |
| GOV-5 | Model retirement is planned, not abrupt; dependent insights are re-labelled |
| GOV-6 | Incidents involving AI output follow the same severity process as other incidents |
| GOV-7 | No claim of "AI accuracy" is published without measured evidence |

---

## 13. Requirements mapping

| Requirement | Section |
| --- | --- |
| `REQ-BI-001`–`002` | §4 metrics, `DATABASE_AND_DATA_DOMAIN_PLAN` §4.7 |
| `REQ-BI-008` | §8 evidence format |
| `REQ-ML-001` | §2 datasets and features |
| `REQ-ML-002` | §2.2 leakage controls |
| `REQ-ML-003` | §4 training and evaluation |
| `REQ-ML-004` | §4.3 registry lifecycle |
| `REQ-ML-005` | §5 serving contract |
| `REQ-ML-006` | §10 monitoring |
| `REQ-INF-001` | §6 pipeline |
| `REQ-INF-002` | §6.2 rules before models |
| `REQ-INF-003` | §8 evidence |
| `REQ-INF-004` | §8 uncertainty |
| `REQ-INF-005` | §7 decision intelligence |
| `REQ-INF-006` | §7.2 allow-list |
| `REQ-INF-007` | §10 feedback |

## 14. Open decisions

| ID | Question |
| --- | --- |
| `OD-007` | Separate Python service versus in-process analytics for v1 |
| `OD-026` | Whether any cross-tenant pooled model is permitted, and under what governance |
| `OD-027` | Which LLM provider(s) are permitted, and what data processing terms apply |
| `OD-028` | Default measurement windows for outcome evaluation per action class |
| `OD-029` | Whether tenants may opt out of AI features entirely (baseline: yes) |

## 15. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Initial analytics, ML, inference and decision specification. |
