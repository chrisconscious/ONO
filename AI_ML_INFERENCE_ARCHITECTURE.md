# AI/ML Inference Architecture

**Document ID:** AI-9.1  
**Stage:** 9 — AI/ML, Inference Engine, Decision Intelligence, and Model Governance  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the complete AI/ML inference architecture for the ClickIT platform. It specifies how different intelligence mechanisms work together to transform business data into explanations, predictions, recommendations, and measurable improvements.

**Key Principles:**
- Right tool for the right job: Use deterministic rules, analytics, ML, or LLMs as appropriate
- Evidence-based: All AI outputs must cite verifiable evidence
- Authorization-aware: AI respects tenant isolation and user permissions
- Uncertainty-aware: Clearly communicate confidence and limitations
- Human-in-the-loop: Consequential actions require human approval
- Auditable: Complete traceability from question to answer to action

---

## 2. Intelligence Mechanisms

The platform uses four distinct intelligence mechanisms, each with specific purposes and limitations.

### 2.1 Deterministic Business Rules Engine

**Purpose:** Enforce business logic that must be 100% predictable and auditable

**Characteristics:**
- 100% reliable and deterministic
- No uncertainty or probabilistic behavior
- Fully auditable with clear decision trails
- Cannot be overridden by AI

**Use Cases:**
- Approval workflows (expense approvals, purchase orders)
- Permission checks (can user X do action Y on resource Z)
- Validation rules (invoice total must equal sum of line items)
- Workflow transitions (lead status changes)
- Threshold checks (stock below reorder point)
- Compliance rules (separation of duties)

**Implementation:**
- Location: Application layer (TypeScript)
- Technology: Rule engine or conditional logic
- Testing: Unit tests with 100% coverage
- Audit: Every rule execution logged

**Example:**
```typescript
// Approval rule: Expenses over $1000 require manager approval
function checkExpenseApproval(expense: Expense, user: User): ApprovalResult {
  if (expense.amount > 1000) {
    return {
      required: true,
      approverRole: 'manager',
      reason: 'Amount exceeds $1000 threshold'
    };
  }
  return { required: false };
}
```

### 2.2 Analytics and Calculation Engine

**Purpose:** Calculate authoritative business metrics from verified data

**Characteristics:**
- Deterministic calculations based on approved formulas
- Source of truth for all business metrics
- Complete lineage from source data to result
- Data quality and freshness tracked

**Use Cases:**
- Revenue calculations
- Conversion rates
- Inventory levels
- Financial metrics
- Performance KPIs
- Trend analysis

**Implementation:**
- Location: Analytics service (Stage 8)
- Technology: SQL queries, aggregation functions
- Testing: Reconciliation with source data
- Audit: Calculation lineage recorded

**Example:**
```typescript
// Calculate monthly revenue
async function calculateMonthlyRevenue(
  tenantId: string,
  month: string
): Promise<MetricResult> {
  const invoices = await db.invoice.findMany({
    where: {
      organizationId: tenantId,
      status: 'paid',
      invoiceDate: { startsWith: month }
    }
  });
  
  return {
    value: invoices.reduce((sum, inv) => sum + inv.total, 0),
    unit: 'currency',
    sourceRecords: invoices.map(i => i.id),
    calculatedAt: new Date(),
    dataQuality: await calculateDataQuality(invoices)
  };
}
```

### 2.3 Machine Learning Models

**Purpose:** Predict future outcomes based on historical patterns

**Characteristics:**
- Probabilistic predictions with confidence intervals
- Trained on historical data
- Requires validation and monitoring
- Can drift over time

**Use Cases:**
- Demand forecasting
- Lead conversion scoring
- Churn risk prediction
- Anomaly detection
- Cash flow forecasting
- Project delay prediction

**Implementation:**
- Location: Python ML service (separate)
- Technology: scikit-learn, XGBoost, PyTorch (task-dependent)
- Testing: Validation against holdout data
- Monitoring: Drift detection, performance tracking

**Example:**
```python
# Lead conversion prediction
def predict_lead_conversion(lead_features: dict) -> Prediction:
    model = load_model('lead_conversion_v2.1')
    prediction = model.predict_proba([lead_features])[0]
    
    return Prediction(
        probability=prediction[1],
        confidence_interval=calculate_confidence_interval(model, lead_features),
        model_version='2.1',
        feature_importance=model.feature_importances_,
        training_date='2026-01-15'
    )
```

### 2.4 Large Language Models (LLMs)

**Purpose:** Natural language understanding, explanation, and generation

**Characteristics:**
- Flexible natural language processing
- Can explain complex concepts
- May hallucinate or make errors
- Requires careful prompting and validation

**Use Cases:**
- Explaining metrics in plain language
- Answering business questions
- Summarizing reports
- Drafting recommendations
- Generating insights
- Natural language queries

**Implementation:**
- Location: LLM service (external provider or self-hosted)
- Technology: GPT-4, Claude, or similar
- Testing: Output validation, fact-checking
- Monitoring: Usage tracking, cost monitoring

**Example:**
```typescript
// Generate insight explanation
async function explainRevenueDecline(
  metrics: MetricData,
  context: BusinessContext
): Promise<Insight> {
  const prompt = `
    Explain why revenue declined 15% this month.
    
    Data:
    - Current month revenue: $425,000
    - Previous month revenue: $500,000
    - Top products: [list with quantities]
    - Customer segments: [breakdown]
    
    Provide:
    1. Summary of decline
    2. Contributing factors
    3. Confidence level
    4. Limitations of analysis
  `;
  
  const response = await llm.generate(prompt);
  return validateAndFormatInsight(response);
}
```

---

## 3. End-to-End Intelligence Pipeline

### 3.1 Pipeline Architecture

```
User Question or Trigger
    ↓
1. Intent Classification
    ↓
2. Authorization Check
    ↓
3. Context Retrieval (Tenant-Scoped)
    ↓
4. Data Quality Validation
    ↓
5. Task Routing
    ├─→ Deterministic Rules (if applicable)
    ├─→ Analytics Calculation (if metric needed)
    ├─→ ML Prediction (if prediction needed)
    └─→ LLM Reasoning (if explanation needed)
    ↓
6. Evidence Aggregation
    ↓
7. Output Generation
    ↓
8. Output Validation
    ↓
9. User Presentation
    ↓
10. User Action (if any)
    ↓
11. Action Approval (if required)
    ↓
12. Action Execution
    ↓
13. Outcome Measurement
    ↓
14. Feedback Loop
```

### 3.2 Pipeline Components

**Component 1: Intent Classifier**
- Purpose: Determine what the user is asking for
- Input: Natural language question or system trigger
- Output: Task type (explain, predict, recommend, calculate)
- Technology: Rule-based or lightweight ML model
- Example: "Why did sales decline?" → Task: explain_metric_change

**Component 2: Authorization Service**
- Purpose: Verify user has permission for requested operation
- Input: User ID, tenant ID, requested operation
- Output: Authorization decision (allow/deny)
- Technology: RBAC + ABAC engine (Stage 7)
- Example: User can only see their own team's data

**Component 3: Context Retriever**
- Purpose: Gather relevant data within user's scope
- Input: Task type, user scope, time range
- Output: Authorized data context
- Technology: Database queries with RLS
- Example: Retrieve last 3 months of sales data for user's team

**Component 4: Data Quality Validator**
- Purpose: Ensure data is sufficient and reliable
- Input: Retrieved context
- Output: Quality score, missing data flags
- Technology: Quality checks (Stage 8)
- Example: Flag if data completeness < 90%

**Component 5: Task Router**
- Purpose: Select appropriate intelligence mechanism
- Input: Task type, data quality, available models
- Output: Selected mechanism(s)
- Technology: Decision tree or rules
- Example: Route to analytics for metric calculation, ML for prediction

**Component 6: Execution Engine**
- Purpose: Run selected mechanism(s)
- Input: Task, context, mechanism
- Output: Raw results
- Technology: Analytics engine, ML service, LLM service
- Example: Calculate revenue, predict next month, generate explanation

**Component 7: Evidence Aggregator**
- Purpose: Combine results from multiple sources
- Input: Results from multiple mechanisms
- Output: Unified evidence package
- Technology: Aggregation logic
- Example: Combine metric calculation with trend analysis and prediction

**Component 8: Output Generator**
- Purpose: Format results for user consumption
- Input: Evidence package, task type
- Output: Structured insight or response
- Technology: Template engine or LLM
- Example: Generate natural language explanation with citations

**Component 9: Output Validator**
- Purpose: Ensure output is safe and accurate
- Input: Generated output
- Output: Validated output or error
- Technology: Validation rules, fact-checking
- Example: Verify all cited sources exist and are authorized

**Component 10: Presentation Layer**
- Purpose: Display results to user
- Input: Validated output
- Output: UI rendering
- Technology: React components (Stage 4)
- Example: Show insight card with evidence and confidence

**Component 11: Action Handler**
- Purpose: Execute user-requested actions
- Input: User action request
- Output: Execution result
- Technology: Business workflows (Stage 6)
- Example: Create follow-up task for lead

**Component 12: Outcome Tracker**
- Purpose: Measure results of actions
- Input: Action execution, time period
- Output: Outcome metrics
- Technology: Analytics engine
- Example: Measure conversion rate after follow-up

---

## 4. Implementation Strategy

### 4.1 Phase 1: Foundation (Months 1-3)

**Deliverables:**
- Deterministic rules engine (integrated with existing workflows)
- Analytics calculation engine (from Stage 8)
- Basic intent classification (rule-based)
- Simple LLM integration for explanations
- Authorization and tenant isolation

**Success Criteria:**
- 10 core metrics calculable
- Basic natural language explanations working
- 100% tenant isolation
- All AI operations audited

### 4.2 Phase 2: ML Integration (Months 4-6)

**Deliverables:**
- ML model serving infrastructure
- First ML models (lead scoring, demand forecasting)
- Advanced intent classification
- RAG system for business knowledge
- Model monitoring and drift detection

**Success Criteria:**
- 3 ML models in production
- Model accuracy > baseline
- Drift detection functional
- User adoption > 50%

### 4.3 Phase 3: Advanced Intelligence (Months 7-12)

**Deliverables:**
- Decision intelligence engine
- Advanced recommendations
- Multi-model orchestration
- Outcome measurement and feedback
- Continuous model improvement

**Success Criteria:**
- Recommendations improve business outcomes
- Feedback loop operational
- Model retraining automated
- ROI positive

---

## 5. Technology Stack

### 5.1 Core Stack

**Application Layer (TypeScript):**
- Intent classification
- Authorization checks
- Context retrieval
- Task routing
- Output validation
- Action execution

**Analytics Layer (SQL):**
- Metric calculations
- Data aggregation
- Trend analysis
- Reconciliation

**ML Layer (Python):**
- Model training
- Model serving (FastAPI)
- Feature engineering
- Model monitoring

**LLM Layer (External/Self-hosted):**
- Natural language generation
- Explanation generation
- Question answering
- Summarization

### 5.2 Infrastructure

**Compute:**
- Application servers: Node.js (existing)
- ML servers: Python with GPU support (if needed)
- LLM: External API or self-hosted

**Storage:**
- Operational data: PostgreSQL (existing)
- Analytical data: PostgreSQL or data warehouse
- ML artifacts: Object storage (S3-compatible)
- Model registry: Database + object storage

**Networking:**
- Internal APIs: REST/gRPC
- External APIs: HTTPS with authentication
- Message queue: For async processing

---

## 6. Security and Compliance

### 6.1 Security Controls

**Tenant Isolation:**
- All AI operations tenant-scoped
- No cross-tenant data mixing
- RLS enforced at database level
- Middleware validation

**Authorization:**
- User permissions checked before AI operations
- Data scope enforced
- Sensitive data masked or excluded
- Audit trail complete

**Data Protection:**
- PII minimized before sending to LLM
- Encryption in transit and at rest
- No training on customer data without consent
- Provider data retention policies reviewed

**Prompt Injection Prevention:**
- Input sanitization
- System prompt isolation
- Output validation
- Sandboxed execution

### 6.2 Compliance

**Regulatory:**
- GDPR compliance for EU data subjects
- Data residency requirements
- Right to explanation
- Audit trail requirements

**Industry Standards:**
- Financial reporting standards (where applicable)
- Healthcare data protection (if applicable)
- Industry-specific regulations

---

## 7. Monitoring and Operations

### 7.1 Operational Metrics

**System Health:**
- API latency (p50, p95, p99)
- Error rates
- Resource utilization
- Queue depths

**AI Performance:**
- Model accuracy over time
- Prediction confidence distribution
- LLM usage and cost
- Drift metrics

**Business Impact:**
- Recommendation adoption rate
- Outcome improvement
- User satisfaction
- ROI

### 7.2 Alerting

**Critical Alerts:**
- Model performance degradation
- Tenant isolation violation
- Security breach attempt
- Service outage

**Warning Alerts:**
- Drift detected
- High error rate
- Cost threshold exceeded
- Latency degradation

**Informational:**
- Model retraining completed
- New model deployed
- Usage patterns changed

---

## 8. Acceptance Criteria

### 8.1 Functional Requirements

- [ ] Intent classification accurate > 90%
- [ ] Authorization enforced for all AI operations
- [ ] Tenant isolation verified
- [ ] Evidence citations complete
- [ ] Confidence levels displayed
- [ ] Actions require approval when needed
- [ ] Outcomes tracked and measured

### 8.2 Non-Functional Requirements

- [ ] API latency < 2 seconds (p95)
- [ ] 99.9% uptime for AI services
- [ ] Cost per request tracked and optimized
- [ ] Scalable to 1000+ concurrent users
- [ ] Complete audit trail

### 8.3 Security Requirements

- [ ] No cross-tenant data leakage
- [ ] Prompt injection prevented
- [ ] Sensitive data protected
- [ ] All operations audited
- [ ] Provider data policies compliant

---

## 9. References

- Stage 2: AI/ML and Inference Architecture
- Stage 7: AI/ML Security and Data Boundaries
- Stage 8: BI Analytics Architecture Specification
- Industry standards: MLOps maturity models, AI ethics guidelines

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** AI Architect / ML Engineer
