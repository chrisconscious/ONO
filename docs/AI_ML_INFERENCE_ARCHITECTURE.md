# ONO — AI, ML and Inference Architecture

| Field | Value |
| --- | --- |
| Document | AI, ML and Inference Architecture |
| Stage | 2 — Architecture and technical contracts |
| Version | 1.0 |
| Date | 2026-10-26 |
| Status | `Recorded` — architecture only. No dataset, model, prompt, provider or serving endpoint exists |
| Scope | Analytics, ML pipelines, model registry, serving, inference orchestration, decision layer, assistant and tool authority |
| Related | `ADR-008`, `ADR-009`, `ADR-012`, `ADR-031`, `ADR-032`, `ADR-033`, `ADR-034`, `AI_ML_INFERENCE_SPECIFICATION.md`, `DATA_ARCHITECTURE_PLAN.md` |

---

## 1. Purpose and boundary

ONO's intelligence layer answers six questions — what is happening, why, what may
happen next, what could be done, what should be done, and whether it worked. Each
question belongs to a different layer with a different method and a different
authority.

The architecture exists to prevent three failures:

1. **Category error** — a prediction presented as a metric, or a recommendation
   presented as a decision.
2. **Authority creep** — the intelligence layer executing actions it was never
   granted.
3. **Untraceable output** — a number or claim that cannot be traced to a source,
   a model version and a time window.

**What is not built in this stage:** no dataset, no feature, no training run, no
model, no prompt, no provider integration, no serving process, no assistant.

---

## 2. The five layers

| Layer | Question | Method | Authority | Failure if conflated |
| --- | --- | --- | --- | --- |
| Analytics | What is true now? | Deterministic calculation over registered metrics | Read and display | Numbers nobody trusts |
| ML | What is likely next? | Statistical/ML models on versioned data | Produce a typed estimate | Confident fiction |
| Serving | What does this model say for this input? | Pinned model, validated features, bounded latency | Return a prediction | Silent version drift |
| Inference | What does it mean, and what could we do? | Authorized context + rules + analytics + models + evidence | Propose | Unsupported narrative |
| Decision and action | What should we do, and did it work? | Human approval, bounded execution, pre-registered measurement | Execute only through approval | Automation without accountability |

**Rule:** a higher layer may consume a lower layer. A lower layer never depends
on a higher layer's judgement. Analytics does not call the assistant; ML does not
call the decision engine; serving does not know about recommendations.

---

## 3. Component topology

```
                         ┌────────────────────────────────────────────┐
                         │ U1 Web process                             │
                         │  CMP-12 BI & analytics (read)              │
                         │  CMP-17 inference orchestration            │
                         │  CMP-18 decision & recommendations         │
                         │  CMP-19 assistant & tool execution         │
                         └───────────────▲────────────────────────────┘
                                         │ authorized reads, proposals
                         ┌───────────────┴────────────────────────────┐
                         │ U2 Worker process                          │
                         │  CMP-12 metric materialisation             │
                         │  CMP-13 dataset & feature builds           │
                         │  CMP-14 training orchestration             │
                         │  CMP-16 batch scoring                      │
                         │  outbox dispatch, report generation        │
                         └───────┬───────────────────────┬────────────┘
                                 │                       │
                    ┌────────────▼──────────┐   ┌────────▼─────────────┐
                    │ U3 PostgreSQL         │   │ U4 Object storage    │
                    │ metrics, registry,    │   │ datasets, artefacts, │
                    │ predictions, evidence │   │ exports              │
                    └───────────────────────┘   └──────────────────────┘
                                 │
                    ┌────────────▼──────────────────────────┐
                    │ U5 ML service (conditional, OD-007)   │
                    │  CMP-14 training, CMP-15 registry,    │
                    │  CMP-16 serving                       │
                    └───────────────────────────────────────┘
```

| Component | Runtime | Responsibility | Phase |
| --- | --- | --- | --- |
| CMP-12 | U1/U2/U3 | Metric registry, calculation, materialisation, dashboards, reports | PH-16–18 |
| CMP-13 | U2 (+U5) | Dataset snapshots, feature definitions, validation | PH-19 |
| CMP-14 | U5 or U2 | Training, evaluation, calibration, bias review | PH-20 |
| CMP-15 | U5 + U3 | Registry, versions, approval state, model cards | PH-20 |
| CMP-16 | U5 or U2/U1 | Serving, pinned versions, timeouts | PH-21 |
| CMP-17 | U1/U2 | Authorized context, rules → analytics → models, evidence | PH-22 |
| CMP-18 | U1/U2 | Options, ranking, approval binding, outcomes | PH-22 |
| CMP-19 | U1 | Assistant, allow-listed tools, no ambient authority | PH-23 |

**Conditional runtime:** U5 exists only if `OD-007` and `ADR-009` justify it. The
HTTP contract is defined regardless, so the decision stays reversible. Until then,
simple statistics run in the worker (`TECH-17`).

---

## 4. Analytics architecture

### 4.1 Metric registry

| Rule | Detail |
| --- | --- |
| One definition | Each metric code has exactly one published definition per version |
| Ownership | A named domain owner (finance, sales, operations) |
| Versioning | A formula change is a new version; old values retain their version |
| Calculation mode | `materialised` or `on_read`, declared per metric (`ADR-008`) |
| Sources | Explicit source references; lineage resolves metric → source |
| Freshness | Every value carries `computedAt`, `asOf`, `isStale` and a boundary |
| Suppression | Small cohorts are suppressed, not zeroed |
| No local KPI | Dashboards may not compute a KPI outside the registry (`AC-17-01`) |

### 4.2 Calculation path

```
Source records (P1)
  → registered query / SQL view (CMP-12, ADR-013)
  → metric calculation (TypeScript or SQL)
  → MetricValue (P2) with version, period, dimensions, freshness
  → dashboard / report / dataset input
```

| Rule | Detail |
| --- | --- |
| Determinism | The same source boundary and metric version produce the same value |
| Idempotency | Recalculation for the same period overwrites only the derived value, never the source |
| Replica safety | Analytics reads may use a replica; lag is surfaced as freshness (`ADR-027`) |
| Write-back | Prohibited; analytics never edits operational records (`PL-01`) |
| Drill-down | Re-authorizes each record; aggregates never reveal denied rows |
| Freshness | Stale values are labelled; they are never presented as current (`AP-12`) |

### 4.3 Metric versioning

| Change | Version bump | Old values |
| --- | --- | --- |
| Formula change | Yes | Retain their version and lineage |
| Source change | Yes | Retain; may be recomputed as a new version |
| Parameter/target change | No (parameter set) | Recorded with the effective config |
| Unit change | Yes | Old values keep the old unit |
| Deprecation | Yes | Readable; no new calculation |

---

## 5. ML data plane

### 5.1 Datasets

| Rule | Detail |
| --- | --- |
| Immutable snapshot | A dataset version is immutable once published |
| Manifest | Source, window, row count, schema, features, exclusions, class distribution, content hash |
| Tenant scope | One tenant unless governance explicitly approves pooling (`OD-026`) |
| Personal data | Minimised; internal keys replace direct identifiers |
| Labels | Defined with derivation time and a leakage check |
| Validation | Schema, range, missingness, leakage, label quality |
| Minimum data | Enforced before training; insufficient data is a valid outcome, not an error to hide |
| Rebuild | From the manifest and source boundary; a deleted dataset is not silently recreated with the same version |

### 5.2 Features

| Rule | Detail |
| --- | --- |
| Definition | Name, type, source, transformation, freshness, owner |
| Parity | Training and serving use the same definition; parity is tested |
| Point-in-time | Features use the value known at the prediction time, not a later value |
| Leakage | Target-derived or future-derived features are rejected |
| Missing values | Explicit; no silent imputation without a recorded policy |
| Versioning | A feature change is a new version; models pin the version |

### 5.3 Leakage controls

| Control | Rule |
| --- | --- |
| Temporal split | Training, validation and test are separated in time where the use case is temporal |
| Target isolation | Target and its proxies are excluded from features |
| Post-outcome data | Fields updated after the outcome are excluded |
| Duplicate entities | Split by entity, not by row, where leakage would otherwise occur |
| Evaluation reuse | Reusing evaluation data for tuning is recorded (`ML-EVAL-6`) |

---

## 6. Training and evaluation

### 6.1 Required artefacts

Every training run records: dataset version, feature versions, code version,
environment image, hyperparameters, seed, metrics, calibration, segment
performance, confusion/error analysis, model card draft and artefact hash.

### 6.2 Gate

| Rule | Detail |
| --- | --- |
| Baseline | Every model is compared with a named deterministic baseline |
| Held-out data | The model must beat the baseline on held-out data (`ML-EVAL-1`) |
| Uncertainty | Metrics report uncertainty, not a single point (`ML-EVAL-2`) |
| Segments | Performance is reported per segment, not only in aggregate (`ML-EVAL-3`) |
| Calibration | Probabilities are calibrated when used for thresholds (`ML-EVAL-4`) |
| Explainability | A model that cannot explain top drivers is not used for consequential recommendations (`ML-EVAL-5`) |
| Approval | Promotion is a separate human decision (`SOD-5`, `GOV-2`) |
| Claim | "Production-ready" is a status granted by the gate, never by a claim (`ML-EVAL-7`) |

### 6.3 Registry lifecycle

```
proposed → data_ready → trained → evaluated → approved → deployed → monitored → retired
```

| State | Entry | Who | Reversible |
| --- | --- | --- | --- |
| `proposed` | Use case approved | Product/ML | Yes |
| `data_ready` | Dataset validated | Data pipeline | Yes |
| `trained` | Run completed | Training job | Yes |
| `evaluated` | Gate evidence complete | ML owner | Yes |
| `approved` | Human approval | Model owner + approver | Revocable |
| `deployed` | Serving pin updated | Release process | Yes, by rollback |
| `monitored` | Production signals flowing | Operations | — |
| `retired` | Superseded or withdrawn | Model owner | No; artefact retained |

A deployed version is **explicit**. "Latest" is prohibited in production
requests (`SRV-5`).

---

## 7. Model artefacts and registry storage

| Concern | Rule |
| --- | --- |
| Artefact storage | Object storage, content-addressed by hash (`ADR-031`) |
| Registry | Database rows for identity, state, versions, metrics, approvals and artefact references |
| Immutability | An artefact is never overwritten; a new version is a new key |
| Model card | Intended use, limitations, prohibited use, segment metrics, owner, training data summary |
| Access | Registry reads are auditable; artefacts are never public |
| Retention | Life of model + 3 years, subject to policy |
| Reproducibility | Dataset version, code version, environment image and hash are recorded |
| Serving pin | A deployment record names the model version and the date |

---

## 8. Serving architecture

### 8.1 Batch-first

`ADR-032` is proposed: **batch-first inference.** Most ONO intelligence is
scheduled or event-driven, not interactive.

| Mode | Use | Latency expectation | Failure behaviour |
| --- | --- | --- | --- |
| Batch scoring | Dashboard cards, daily risk lists, segmentation | Minutes; not user-blocking | Last good output remains, labelled with its age |
| Event-triggered | Score a record after a business event | Seconds to minutes | Queue and retry; no user block |
| Synchronous | Interactive assistant or a decision the user is waiting on | Hard timeout, proposed ≤ 2 s (`OD-041`) | Degrade to rules/analytics; label the degraded mode |

**Synchronous serving is allowed only when all of the following hold:**

1. a user is waiting for the result;
2. the action is reversible or non-consequential;
3. a deterministic fallback exists;
4. cost and rate limits are enforceable;
5. latency meets the budget.

Otherwise the answer is batch or asynchronous.

### 8.2 Serving contract

| Rule | Detail |
| --- | --- |
| Authorization | Actor scope is checked before feature retrieval (`SRV-1`) |
| Validation | Unknown features are rejected; missing values are explicit (`SRV-3`) |
| Version pinning | The request names a model version (`SRV-5`) |
| Timeout | Hard limit; caller degrades (`SRV-2`) |
| Uncertainty | Interval or calibrated probability is mandatory for probabilistic output |
| Out-of-distribution | Warning and reduced confidence (`SRV-4`) |
| No write-back | Serving never writes a source record (`SRV-6`) |
| Batch scope | Tenant-scoped and rate-limited (`SRV-7`) |
| Availability | Model unavailability never blocks core business (`SRV-8`) |

### 8.3 Serving response

Every response carries model key, version, dataset version, training date,
`servedAt`, confidence/interval and warnings. A prediction without provenance is
a defect.

---

## 9. Inference orchestration

### 9.1 Pipeline

```
1  Trigger              schedule | user question | metric threshold | business event
2  Authorise            actor + tenant + scope + entitlement
3  Assemble context     only records the actor may see
4  Establish facts      registered metrics, period, freshness
5  Evaluate rules       deterministic business rules first
6  Retrieve predictions only relevant, approved models
7  Build evidence       link each claim to facts, metrics, models
8  Reason               bounded synthesis; no invented entities
9  Quantify uncertainty intervals, confidence, assumptions, coverage
10 Rank options         impact, confidence, cost, risk, urgency
11 Publish or decline   "insufficient data" is a first-class outcome
12 Record the run       input scope, versions, duration, outcome
```

This is the Stage 1 pipeline fixed as architecture (`INF-R-1`–`INF-R-10`).

### 9.2 Context assembly

| Included | Excluded |
| --- | --- |
| Records within actor scope | Any record outside scope |
| Registered metrics with freshness | Ad hoc metric recomputation |
| Approved model outputs with metadata | Raw model internals or unapproved experiments |
| Tenant configuration relevant to the question | Other tenants' configuration or benchmarks |
| Historical decisions and outcomes | Unredacted personal data not needed for the question |

### 9.3 Orchestration rules

| ID | Rule |
| --- | --- |
| AIA-01 | The orchestrator runs server-side and receives an explicit `ActorContext`. |
| AIA-02 | Rules run before models; a rule violation is never overridden by a prediction (`INF-R-2`). |
| AIA-03 | Model outputs enter as typed values, never as prose to be trusted (`INF-R-5`). |
| AIA-04 | Every claim resolves to evidence or is labelled an assumption (`INF-R-3`). |
| AIA-05 | Insufficient evidence produces "insufficient data", never filler (`INF-R-4`). |
| AIA-06 | The orchestrator cannot execute an action; it proposes (`INF-R-6`). |
| AIA-07 | Retrieved content never grants permission (`INF-R-7`, `AI-SEC-1`). |
| AIA-08 | Every run is reproducible from recorded scope and versions (`INF-R-8`). |
| AIA-09 | Cost and latency budgets are enforced per run (`INF-R-9`). |
| AIA-10 | When models are unavailable, the engine degrades to rules and analytics (`INF-R-10`). |

### 9.4 Evidence model

| Evidence kind | Resolves to | Required metadata |
| --- | --- | --- |
| `record` | A business record the actor may see | Entity type, ID, version |
| `metric` | A registered metric value | Metric code, version, period, freshness |
| `prediction` | A served model output | Model version, dataset version, `asOf` |
| `rule` | A deterministic rule evaluation | Rule code, version, outcome |
| `assumption` | An explicit statement | Text, why it matters |

An evidence reference that cannot be resolved is a defect, not a warning.

---

## 10. Decision and recommendation layer

### 10.1 Decision model

| Element | Definition |
| --- | --- |
| Goal | Business objective (for example, reduce overdue receivables) |
| Constraints | Budget, policy, capacity, contractual, legal |
| Options | Candidate actions from the allow-list |
| Expected effect | Estimate with interval and assumptions |
| Cost | Direct cost, effort, risk |
| Reversibility | Reversible, costly to reverse, irreversible |
| Approval | Automatic, single approver, multi-approver |
| Measurement | Baseline, window, metric, comparison method |

### 10.2 Action allow-list

The Stage 1 allow-list (`AI_ML...` §7.2) is the architecture boundary:

| Action class | Executable in v1 | Approval |
| --- | --- | --- |
| Notify | Yes | None (notification only) |
| Assign | Yes | Single |
| Create draft | Yes | Single |
| Schedule | Yes | None |
| Adjust threshold | Yes | Single |
| Send communication | No (PH-23) | Multi |
| Financial posting | No | Multi |
| Price change | No (PH-23) | Multi |

Anything not on the list is a recommendation only, executed manually by a human
in the normal UI.

### 10.3 Approval binding

| Rule | Detail |
| --- | --- |
| Version binding | The approval names the recommendation version and evidence set |
| Re-evaluation | Execution re-checks permission, scope, state and entitlement at execution time |
| No self-approval | The recommender cannot approve their own action (`SOD-1`) |
| Expiry | An approval expires; execution after expiry is refused |
| Audit | Recommendation, approval and execution are separate audit events |
| Reversal | Where reversible, the reversal is recorded against the same outcome |

### 10.4 Outcome measurement

| Rule | Detail |
| --- | --- |
| Pre-registered | Baseline, window, metric and method are recorded before execution (`FB-3`) |
| Separate signals | Acceptance, rejection, execution and outcome are distinct (`FB-1`) |
| Confounders | Disclosed, never silently excluded (`FB-4`) |
| Inconclusive | Reported as inconclusive (`FB-6`) |
| No causal claim | Correlation is not presented as causation (`§8.1`) |

---

## 11. Assistant and tool execution

### 11.1 Modes

| Mode | Meaning | v1 |
| --- | --- | --- |
| `read` | Retrieve and summarise within scope | Yes |
| `propose` | Create a recommendation or draft for approval | Yes |
| `execute` | Perform an action directly | **No** (`AI-SEC-5`) |

### 11.2 Tool rules

| Rule | Detail |
| --- | --- |
| Allow-list | Declared per use case and role (`ADR-034`, `AI-SEC-2`) |
| Schema | Arguments validated server-side; unknown arguments rejected (`AI-SEC-3`) |
| Authority | Runs under the requesting actor's context; no widening (`ADR-033`, `AI-SEC-4`) |
| No ambient credentials | The assistant has none (`AI-SEC-10`) |
| Financial tools | Not exposed in v1 (`AI-SEC-5`) |
| Injection | Retrieved content is data, never instructions (`AI-SEC-1`, `AI-SEC-6`) |
| Output | Structured result, validated before display; no raw HTML (`AI-SEC-7`) |
| Audit | Actor, tool, argument hash and result status (`AI-SEC-8`) |
| Rate and cost | Per user and per tenant (`AI-SEC-9`) |
| Tenant opt-out | Disabling AI removes no core function (`OD-029`) |

### 11.3 Tool invocation path

```
User question
  → assistant (CMP-19) resolves actor context
  → tool selection from the allow-list for this use case and role
  → argument validation (Zod)
  → module service call with ActorContext
  → policy evaluation (the same 12 steps)
  → scoped result
  → evidence-labelled answer
  → audit (tool, argument hash, status)
```

The assistant never receives a database handle, a service credential or a
cross-tenant read path.

---

## 12. Authority model

`ADR-033` is approved: **AI may never exceed the requesting actor's authority.**
The following matrix is the operational meaning of that decision.

| Operation | May the intelligence layer do it? | Condition |
| --- | --- | --- |
| Read a record | Yes | Actor scope, same as any UI read |
| Read a metric | Yes | Metric visibility + dimension scope |
| Read a model output | Yes | Approved model, actor scope |
| Summarise a document | Yes | Document in actor scope; content treated as data |
| Propose an action | Yes | Allow-listed action class |
| Create a draft record | Yes | Through a module service with actor context |
| Send a notification | Yes | Notification only; no external content generation without review |
| Change a record state | **No** | Requires human action or approved executor |
| Post a financial entry | **No** | Finance permission and explicit human action |
| Change a price | **No** in v1 | Requires approval and human execution |
| Change a permission or role | **No** | Never |
| Delete a record | **No** | Never |
| Disable audit or retention | **No** | Never |
| Access another tenant | **No** | Never |
| Use its own credentials | **No** | Never |
| Approve its own proposal | **No** | Never |

**The engine proposes; a human decides; an authorized executor acts.** This is
not a policy preference; it is the boundary that makes the system auditable.

---

## 13. Provider abstraction

| Concern | Rule |
| --- | --- |
| Interface | A single `AiProvider` abstraction for model calls and optional embeddings |
| Provider count | One approved provider initially; no silent fallback to another provider (`ADR-012`) |
| Fallback | Deterministic rules and analytics, clearly labelled as degraded |
| Terms | No training on tenant data; data-processing terms and residency must be approved (`OD-027`, `ASM-011`) |
| Prompts | Platform-owned, versioned and reviewed; no tenant-authored system prompts in v1 |
| Secrets | Provider keys in the secret manager, never in code, logs or tenant configuration |
| Data minimisation | Send only the context needed for the task; no bulk record dumps |
| Residency | Provider region must satisfy `OD-022` |
| Change | Switching provider is a configuration change with an evaluation and a rollback plan |
| Observability | Provider latency, error rate, token/cost usage and refusal rate are monitored |

**No provider is selected in this stage.** The interface exists so the choice is
reversible.

### 13.1 Prompt and template governance

| Rule | Detail |
| --- | --- |
| Versioned | Every prompt template has an ID and version |
| Reviewed | Changes are reviewed like code |
| Tested | Fixtures include adversarial content |
| No dynamic code | Templates cannot execute code or call arbitrary tools |
| No secrets | Prompts never contain credentials or system internals |
| Output schema | Responses are validated against a schema before use |

---

## 14. Cost, latency and rate budgets

| Budget | Rule | Degradation |
| --- | --- | --- |
| Per run | Token, tool-call and time cap | Return partial evidence or "insufficient data" |
| Per user | Rate limit | Queue or refuse with a clear message |
| Per tenant | Daily/monthly cost ceiling | Notify owner; disable expensive modes |
| Serving | Hard timeout per call | Rules-only fallback |
| Batch | Throughput cap and tenant fairness | Queue; never starve one tenant |
| Provider outage | Circuit open | Deterministic fallback; no retry storm |

Budgets are enforced in code, not in documentation. A budget that is not
enforced is a wish.

---

## 15. Data flow and lineage

```
P1 operational records
  → P2 metrics (versioned, fresh)
      ├── dashboards/reports
      ├── P3 dataset snapshot (hash, manifest)
      │     → features (versioned) → training run → P4 model artefact
      └── P5 inference run
            → prediction (model version, asOf)
            → evidence → insight → recommendation
            → approval → execution → outcome
```

| Rule | Detail |
| --- | --- |
| Forward trace | Any dashboard number traces to source records and metric version |
| Backward trace | Any record can list the metrics, datasets and recommendations derived from it |
| Prediction trace | Model version, dataset version, `asOf`, input hash |
| Recommendation trace | Evidence refs, ranking inputs, confidence, assumptions |
| Outcome trace | Baseline, window, method, confounders |
| Deletion | Derived data is purged or recomputed; lineage records the event (`DEL-05`) |
| Correction | A superseded value keeps its lineage and points to its replacement (`LIN-08`) |

---

## 16. Failure and degradation

| Failure | Effect | Behaviour |
| --- | --- | --- |
| Metric materialisation late | Stale dashboards | Show `isStale` and `asOf`; never present as current |
| Model unavailable | No prediction | Rules/analytics path; label degraded |
| Provider unavailable | No language synthesis | Structured rules output; no invented prose |
| Dataset missing | No training | Training blocked; previous model remains |
| Registry unavailable | No new deployment | Existing pinned model continues |
| Serving timeout | No synchronous answer | Batch or rules fallback |
| Out-of-distribution input | Uncertain prediction | Warning + reduced confidence |
| Cost budget exceeded | Expensive mode disabled | Notify; core function unaffected |
| Evidence missing | Unsupported claim | "Insufficient data" |
| Tenant AI opt-out | No AI features | Core product fully usable |

**Invariant:** no intelligence failure blocks quote, order, invoice, payment,
stock or payroll workflows.

---

## 17. Security controls

| Control area | Requirement |
| --- | --- |
| Tenant isolation | Context assembly is scoped; no cross-tenant retrieval |
| Actor authority | Every tool call uses the actor context (`ADR-033`) |
| Prompt injection | Retrieved content is data; suspicious instructions are flagged and ignored |
| Tool abuse | Allow-list, schema validation, rate limits, audit |
| Output safety | No raw HTML; no secrets; no internal prompts; validated schema |
| Data minimisation | Only necessary context is sent to a provider |
| Credentials | Secret manager; no ambient credentials |
| Audit | Runs, tools, approvals and executions are auditable |
| Model supply chain | Artefacts content-addressed; registry approval required |
| Dependency risk | Provider and library changes are reviewed |

---

## 18. Evaluation and monitoring

| Level | Test | Pass condition |
| --- | --- | --- |
| Unit | Metric formula | Matches hand-calculated fixtures |
| Unit | Evidence linking | Every claim resolves to an existing record |
| Integration | Scope isolation | No evidence leaks outside actor scope |
| Offline | Model quality | Beats baseline on held-out data |
| Shadow | Recommendation usefulness | Domain expert review before pilot |
| Pilot | Real-world acceptance | Measured acceptance and outcome |
| Adversarial | Prompt injection | Injected instructions do not alter behaviour |
| Degradation | Model outage | Rules-only path works and is labelled |
| Calibration | Probability quality | Calibration error within the declared tolerance |
| Cost | Budget enforcement | Limits hold under load |

### 18.1 Production signals

| Signal | Detects | Action |
| --- | --- | --- |
| Prediction volume/latency | Serving health | Alert on error budget |
| Input drift | Data drift | Investigate, retrain |
| Performance decay | Model drift | Suspend beyond tolerance |
| Calibration drift | Over/under-confidence | Recalibrate |
| Acceptance rate | Usefulness | Review ranking/framing |
| Action completion | Friction | Improve workflow |
| Outcome vs predicted | Value realisation | Retrain, adjust expectations |
| "Insufficient data" rate | Coverage gaps | Improve data capture |
| Dismissal reasons | Trust erosion | Investigate explanations |

---

## 19. Phase mapping

| Phase | Intelligence work |
| --- | --- |
| PH-02 | This architecture accepted; authority matrix reviewed |
| PH-16 | Metric registry, quality gates, analytics schema |
| PH-17 | Calculation services, materialisation, freshness |
| PH-18 | Dashboards, reports, drill-down |
| PH-19 | Dataset snapshots, features, leakage controls |
| PH-20 | Training, evaluation, registry, model cards |
| PH-21 | Serving, batch scoring, version pinning |
| PH-22 | Inference orchestration, evidence, decisions, outcomes |
| PH-23 | Assistant, allow-listed tools, controlled automation |
| PH-24 | Tenant opt-out, entitlements, provider configuration |
| PH-25 | Adversarial, isolation and degradation verification |

---

## 20. Open decisions

| ID | Question | Blocks |
| --- | --- | --- |
| `OD-007` | Python service versus in-process analytics | PH-19 |
| `OD-026` | Cross-tenant pooled training | PH-19 |
| `OD-027` | Approved AI provider and data terms | PH-22 |
| `OD-028` | Outcome measurement windows | PH-22 |
| `OD-029` | Tenant opt-out of AI | PH-22 |
| `OD-041` | Real-time inference use cases and latency budget | PH-21 |
| `OD-042` | Model registry build versus managed | PH-20 |
| `OD-044` | Export/async threshold for large analyses | PH-18 |
| `OD-022` | Data residency for provider calls | PH-22 |
| `OD-034` | Approved sub-processors, including AI | PH-22 |

---

## 21. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-26 | Stage 2 intelligence architecture: analytics, ML, serving, inference, decisions, assistant, authority and degradation. No model trained or served. |
