import { Document } from './types';

export const stage9Doc1: Document = {
  id: 'ai-ml-inference-architecture',
  number: 1,
  title: 'AI/ML Inference Architecture',
  shortTitle: 'AI/ML Architecture',
  description: 'Complete AI/ML inference architecture with intelligence mechanisms, pipeline design, and implementation strategy.',
  status: 'Recorded',
  stage: 9,
  sections: [
    {
      id: '9.1.1',
      title: 'Intelligence Mechanisms',
      content: `**Four Distinct Mechanisms:**

1. **Deterministic Business Rules Engine**
   - 100% reliable, no uncertainty
   - Use for: approvals, permissions, validations, thresholds
   - Cannot be overridden by AI

2. **Analytics and Calculation Engine**
   - Authoritative metric calculations
   - Use for: revenue, conversion rates, KPIs
   - Source of truth for business metrics

3. **Machine Learning Models**
   - Probabilistic predictions with confidence
   - Use for: forecasting, scoring, anomaly detection
   - Requires validation and monitoring

4. **Large Language Models (LLMs)**
   - Natural language understanding and generation
   - Use for: explanations, summaries, Q&A
   - Requires careful prompting and validation

**Key Principle:** Use the simplest mechanism that reliably solves the problem.`
    },
    {
      id: '9.1.2',
      title: 'End-to-End Pipeline',
      content: `**13-Step Pipeline:**
1. User question or trigger
2. Intent classification
3. Authorization check
4. Context retrieval (tenant-scoped)
5. Data quality validation
6. Task routing
7. Mechanism execution
8. Evidence aggregation
9. Output generation
10. Output validation
11. User presentation
12. User action (if any)
13. Outcome measurement

**Implementation Phases:**
- Phase 1 (Months 1-3): Foundation (rules, analytics, basic LLM)
- Phase 2 (Months 4-6): ML integration (first models, RAG)
- Phase 3 (Months 7-12): Advanced intelligence (decision engine, feedback)`
    }
  ]
};

export const stage9Doc2: Document = {
  id: 'ai-task-routing-reasoning',
  number: 2,
  title: 'AI Task Routing and Reasoning Policy',
  shortTitle: 'Task Routing',
  description: 'Policy for routing tasks to appropriate intelligence mechanisms and reasoning standards.',
  status: 'Recorded',
  stage: 9,
  sections: [
    {
      id: '9.2.1',
      title: 'Task Classification',
      content: `**7 Task Types:**

1. **Deterministic Calculation** → Analytics engine
2. **Rule-Based Decision** → Rules engine
3. **Pattern Recognition** → Analytics + LLM
4. **Prediction** → ML model (if available)
5. **Recommendation** → Decision intelligence
6. **Natural Language Query** → RAG or LLM
7. **Complex Analysis** → Multi-mechanism orchestration

**Routing Priority:**
1. Deterministic over probabilistic
2. Validated models only
3. Evidence required
4. Authorization first
5. Tenant isolation absolute`
    }
  ]
};

export const stage9Doc3: Document = {
  id: 'inference-engine-spec',
  number: 3,
  title: 'Inference Engine Specification',
  shortTitle: 'Inference Engine',
  description: 'Core inference engine design with component responsibilities and execution flow.',
  status: 'Recorded',
  stage: 9,
  sections: [
    {
      id: '9.3.1',
      title: 'Engine Components',
      content: `**Core Components:**
- Intent Classifier
- Context Retriever
- Task Router
- Execution Orchestrator
- Evidence Aggregator
- Output Generator
- Output Validator

**Output Schema:**
- Summary and details
- Evidence with citations
- Metrics with confidence
- Predictions with intervals
- Recommendations with priorities
- Data quality indicators
- Limitations and assumptions`
    }
  ]
};

export const stage9Doc4: Document = {
  id: 'ml-use-case-catalog',
  number: 4,
  title: 'ML Use Case and Readiness Catalog',
  shortTitle: 'ML Use Cases',
  description: 'Catalog of candidate ML use cases with readiness assessments and implementation criteria.',
  status: 'Recorded',
  stage: 9,
  sections: [
    {
      id: '9.4.1',
      title: 'Candidate Use Cases',
      content: `**CRM & Sales:**
- UC-001: Lead Conversion Scoring (Evaluation Ready)
- UC-002: Sales Forecasting (Evaluation Ready)
- UC-003: Customer Churn Prediction (Research Candidate)

**Finance:**
- UC-004: Cash Flow Forecasting (Evaluation Ready)
- UC-005: Expense Anomaly Detection (Evaluation Ready)

**Inventory & Operations:**
- UC-006: Demand Forecasting (Approved for Pilot)
- UC-007: Project Delay Prediction (Research Candidate)

**Marketing:**
- UC-008: Campaign Performance Estimation (Research Candidate)

**Readiness Levels:**
- Not Ready → Research Candidate → Evaluation Ready → Approved for Pilot → Approved for Production → Retired`
    }
  ]
};

export const stage9Doc5: Document = {
  id: 'model-training-evaluation',
  number: 5,
  title: 'Model Training and Evaluation Policy',
  shortTitle: 'Training & Evaluation',
  description: 'Standards for training and evaluating ML models with validation and approval processes.',
  status: 'Recorded',
  stage: 9,
  sections: [
    {
      id: '9.5.1',
      title: 'Training Standards',
      content: `**12-Step Training Workflow:**
1. Problem definition
2. Data assessment
3. Dataset preparation (versioned, split)
4. Feature engineering (versioned)
5. Baseline model
6. Model training
7. Validation (cross-validation)
8. Evaluation (metrics, bias, calibration)
9. Comparison to baseline
10. Documentation
11. Review and approval
12. Deployment (if approved)

**Evaluation Requirements:**
- Baseline comparison mandatory
- Minimum improvement: >5% on primary metric
- Statistical significance: p < 0.05
- Bias and fairness assessment
- Calibration for probability predictions`
    }
  ]
};

export const stage9Doc6: Document = {
  id: 'model-lifecycle-monitoring',
  number: 6,
  title: 'Model Lifecycle and Monitoring Specification',
  shortTitle: 'Model Lifecycle',
  description: 'Complete model lifecycle from development through retirement with monitoring and drift detection.',
  status: 'Recorded',
  stage: 9,
  sections: [
    {
      id: '9.6.1',
      title: 'Lifecycle States',
      content: `**7 Lifecycle States:**
Development → Testing → Staging → Production → Monitoring → Retraining → Retirement

**Monitoring Metrics:**
- Prediction accuracy over time
- Confidence distribution
- Latency (p50, p95, p99)
- Error rate
- Usage volume

**Drift Detection:**
- Data drift: Monitor input feature distributions
- Concept drift: Monitor prediction accuracy
- Alert thresholds: PSI > 0.2, accuracy degradation > 10%

**Retraining Triggers:**
- Scheduled (daily/weekly/monthly)
- Event-driven (drift detected, performance degradation)
- Manual (business requirement change)`
    }
  ]
};

export const stage9Doc7: Document = {
  id: 'ai-decision-intelligence',
  number: 7,
  title: 'AI Decision Intelligence Specification',
  shortTitle: 'Decision Intelligence',
  description: 'Decision intelligence layer combining metrics, predictions, and business objectives for recommendations.',
  status: 'Recorded',
  stage: 9,
  sections: [
    {
      id: '9.7.1',
      title: 'Recommendation Framework',
      content: `**6-Step Decision Process:**
1. Identify decision context
2. Generate alternatives
3. Evaluate alternatives
4. Compare and rank
5. Present recommendations
6. Support decision

**Recommendation Structure:**
- Action and description
- Evidence and reasoning
- Expected impact with confidence
- Costs and risks
- Feasibility assessment
- Approval requirements
- Success metrics
- Priority ranking

**Key Principle:** AI recommends; humans decide.`
    }
  ]
};

export const stage9Doc8: Document = {
  id: 'ai-action-approval-boundaries',
  number: 8,
  title: 'AI Action and Approval Boundaries',
  shortTitle: 'Action Boundaries',
  description: 'Boundaries between AI recommendations and actual business actions with approval workflows.',
  status: 'Recorded',
  stage: 9,
  sections: [
    {
      id: '9.8.1',
      title: 'Action Classification',
      content: `**3 Action Classes:**

**Class 1: Read-Only Assistance**
- Examples: explaining metrics, summarizing reports
- Authorization: Read permission only
- No approval needed

**Class 2: Proposed Actions (User Confirmation)**
- Examples: drafting emails, proposing POs, suggesting changes
- Authorization: Action permission + user confirmation
- Approval if required by policy

**Class 3: Restricted/High-Impact Actions**
- Examples: financial transactions, permission changes, deletes
- Authorization: Specific permission + multi-party approval
- AI cannot self-approve

**Key Rule:** AI cannot approve its own recommendations.`
    }
  ]
};

export const stage9Doc9: Document = {
  id: 'ai-acceptance-verification',
  number: 9,
  title: 'AI Acceptance and Verification Criteria',
  shortTitle: 'Acceptance Criteria',
  description: 'Comprehensive acceptance criteria for all AI/ML capabilities with verification methods.',
  status: 'Recorded',
  stage: 9,
  sections: [
    {
      id: '9.9.1',
      title: 'Verification Categories',
      content: `**8 Verification Categories:**

1. **Architecture:** Mechanism selection, pipeline integrity
2. **Security:** Tenant isolation, authorization, prompt injection prevention
3. **Data Quality:** Input quality, output quality, citations
4. **Models:** Quality, monitoring, drift detection
5. **Decision Intelligence:** Recommendation quality, approval workflows
6. **Performance:** Latency, scalability, cost
7. **Business Value:** Outcome measurement, user experience
8. **Compliance:** Regulatory, ethical

**Release Criteria:**
- Must-Have: All security tests pass, tenant isolation verified
- Should-Have: Performance within targets, model accuracy meets thresholds
- Nice-to-Have: Advanced features, optimizations`
    }
  ]
};

export const stage9Docs: Document[] = [
  stage9Doc1,
  stage9Doc2,
  stage9Doc3,
  stage9Doc4,
  stage9Doc5,
  stage9Doc6,
  stage9Doc7,
  stage9Doc8,
  stage9Doc9
];
