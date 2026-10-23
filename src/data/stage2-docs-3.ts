import { Document } from './types';

export const archDoc9: Document = {
  id: 'ai-ml-architecture',
  number: 9,
  title: 'AI/ML and Inference Architecture',
  shortTitle: 'AI/ML Architecture',
  description: 'Data pipelines, ML, model serving, inference orchestration, decision intelligence and monitoring.',
  status: 'Recorded',
  stage: 2,
  sections: [
    {
      id: 'AIML-1',
      title: '1. AI/ML Component Boundaries',
      content: `**Separation of Concerns:**

**Business Rules Engine (Deterministic):**
- Location: Application layer (TypeScript)
- Responsibility: Permissions, approvals, workflow transitions, limits
- Characteristics: 100% reliable, no uncertainty, auditable
- Authority: Absolute (cannot be overridden by ML)

**Analytics Engine (Descriptive):**
- Location: Application layer + analytics schema
- Responsibility: Metric calculations, trend analysis, comparisons
- Characteristics: Based on verified data, documented formulas
- Authority: Trusted for factual reporting

**ML Training & Evaluation (Offline):**
- Location: Python service (separate)
- Responsibility: Dataset preparation, model training, validation
- Characteristics: Batch processing, versioned, reproducible
- Output: Trained model artifacts + evaluation metrics

**Model Serving (Real-time):**
- Location: Python/FastAPI service (separate)
- Responsibility: Accept inputs, run model, return predictions
- Characteristics: Low latency, validated inputs, structured outputs
- Output: Predictions with confidence and metadata

**Inference Intelligence Orchestrator:**
- Location: Application layer (TypeScript)
- Responsibility: Coordinate data, analytics, models, rules for recommendations
- Characteristics: Authorization-aware, evidence-based, uncertainty-disclosing
- Output: Recommendations with full evidence chain

**Decision Intelligence:**
- Location: Application layer (TypeScript)
- Responsibility: Evaluate options, constraints, expected outcomes
- Characteristics: Goal-oriented, constraint-aware, approval-gated
- Output: Decision support with alternatives

**AI Assistant:**
- Location: Application layer + LLM integration
- Responsibility: Natural language interface to authorized capabilities
- Characteristics: Sandboxed, authorized, safety-controlled
- Output: Responses and tool invocations (with approval)

**Feedback & Evaluation:**
- Location: Application layer
- Responsibility: Track recommendations, actions, outcomes
- Characteristics: Continuous learning, model improvement
- Output: Evaluation metrics, retraining triggers`
    },
    {
      id: 'AIML-2',
      title: '2. Data Pipeline Architecture',
      content: `**Pipeline Stages:**

**Stage 1: Data Extraction**
- Source: Operational database (read replicas)
- Method: Change Data Capture (CDC) or scheduled extraction
- Frequency: Configurable (real-time, hourly, daily)
- Authorization: Tenant-scoped, permission-checked
- Output: Raw data snapshots

**Stage 2: Data Validation**
- Checks: Completeness, consistency, format, range
- Actions: Reject invalid, flag anomalies, log issues
- Output: Validated data with quality scores

**Stage 3: Data Transformation**
- Operations: Cleaning, normalization, enrichment
- Business rules: Apply domain-specific transformations
- Output: Clean, structured data

**Stage 4: Feature Engineering**
- Operations: Calculate features from raw data
- Versioning: Feature definitions versioned with code
- Consistency: Same logic in training and serving
- Output: Feature vectors

**Stage 5: Storage**
- Training data: Object storage (Parquet files)
- Features: Feature store (database tables or dedicated store)
- Metadata: Database (lineage, quality, versioning)

**Pipeline Implementation:**
\`\`\`
Operational DB → CDC/Extract → Validate → Transform → Feature Eng → Store
     ↓                                                              ↓
  (RLS)                                                    (Versioned datasets)
                                                                  ↓
                                                          (Training pipeline)
\`\`\`

**Data Governance:**
- All data access authorized per tenant and user permissions
- PII handling follows data classification policy
- Data lineage tracked from source to features
- Quality metrics computed at each stage
- Pipeline failures logged and alerted`
    },
    {
      id: 'AIML-3',
      title: '3. Model Training and Evaluation',
      content: `**Training Workflow:**
\`\`\`
1. Define experiment (hypothesis, data, features, model type)
2. Prepare dataset (versioned, validated, split)
3. Engineer features (versioned definitions)
4. Train model (with hyperparameters)
5. Evaluate on validation set
6. Compare to baseline
7. Check bias and fairness metrics
8. Document results
9. Promote if criteria met
10. Register in model registry
\`\`\`

**Experiment Tracking:**
\`\`\`typescript
interface MLExperiment {
  id: string;
  name: string;
  hypothesis: string;
  datasetVersion: string;
  featureVersion: string;
  modelType: string;
  hyperparameters: Record<string, unknown>;
  trainingMetrics: {
    loss: number;
    accuracy?: number;
    // ... task-specific
  };
  validationMetrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    rmse?: number;
    // ... task-specific
  };
  biasMetrics?: {
    demographicParity?: number;
    equalOpportunity?: number;
    // ... fairness metrics
  };
  comparisonToBaseline: {
    baselineVersion: string;
    improvement: Record<string, number>;
  };
  status: 'running' | 'completed' | 'failed';
  artifactUrl: string;
  createdAt: string;
  createdBy: string;
}
\`\`\`

**Evaluation Criteria:**
- Performance: Must exceed baseline by defined margin
- Calibration: Probability predictions must be well-calibrated
- Bias: Fairness metrics within acceptable bounds
- Latency: Inference time within acceptable limits
- Stability: Performance consistent across data segments

**Model Promotion:**
\`\`\`typescript
interface PromotionCriteria {
  minAccuracy?: number;
  maxLatencyMs?: number;
  minDataCoverage?: number;
  maxBiasMetric?: number;
  requiresHumanApproval: boolean;
}

async function evaluateForPromotion(experiment: MLExperiment, criteria: PromotionCriteria): Promise<boolean> {
  // Check all criteria
  if (criteria.minAccuracy && experiment.validationMetrics.accuracy < criteria.minAccuracy) {
    return false;
  }
  // ... other checks

  // Human approval if required
  if (criteria.requiresHumanApproval) {
    const approval = await requestPromotionApproval(experiment);
    return approval.status === 'approved';
  }

  return true;
}
\`\`\``
    },
    {
      id: 'AIML-4',
      title: '4. Model Serving and Inference',
      content: `**Serving Architecture:**
\`\`\`
┌─────────────────────────────────────────────────┐
│           Core Application (TypeScript)          │
│                                                 │
│  Inference Request → Authorization → Validation │
└───────────────────────┬─────────────────────────┘
                        │ REST API
┌───────────────────────┴─────────────────────────┐
│           Model Serving (Python/FastAPI)         │
│                                                 │
│  Input Validation → Feature Computation →       │
│  Model Inference → Response Formatting →        │
│  Metadata Attachment → Logging                  │
└───────────────────────┬─────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────┐
│           Model Registry                         │
│                                                 │
│  Model Versions │ Artifacts │ Metadata │ Status │
└─────────────────────────────────────────────────┘
\`\`\`

**Inference Request Flow:**
1. Core app receives inference request
2. Authorization: Check user has permission for this model/prediction
3. Input validation: Verify inputs are within expected ranges
4. Tenant context: Include organization_id for scoping
5. Forward to model serving service
6. Model service loads appropriate version
7. Compute features (using same logic as training)
8. Run model inference
9. Format response with metadata
10. Return to core app
11. Core app applies business rules
12. Core app logs prediction for monitoring

**Response Format:**
\`\`\`typescript
interface InferenceResponse {
  prediction: unknown;
  confidence: number;
  uncertaintyRange?: { lower: number; upper: number };
  featureImportance?: Record<string, number>;
  modelVersion: string;
  dataFreshness: {
    latestDataPoint: string;
    completeness: number;
  };
  warnings: string[];
  processingTimeMs: number;
}
\`\`\`

**Safety Controls:**
- Input validation prevents adversarial inputs
- Output validation ensures reasonable ranges
- Timeout protection (max 5 seconds per inference)
- Circuit breaker for model service failures
- Rate limiting per user and tenant
- All predictions logged for monitoring`
    },
    {
      id: 'AIML-5',
      title: '5. Inference Intelligence Engine',
      content: `**Orchestration Flow:**
\`\`\`
1. Trigger (scheduled, event, user request)
2. Context Assembly
   - Gather authorized operational data
   - Retrieve relevant analytics
   - Identify applicable models
   - Load business rules
3. Analysis Execution
   - Run statistical analysis
   - Execute applicable models
   - Apply business rules
4. Evidence Synthesis
   - Combine data, analytics, predictions
   - Identify patterns and anomalies
   - Assess confidence levels
5. Recommendation Generation
   - Generate action proposals
   - Estimate expected outcomes
   - Quantify uncertainty
   - Rank by expected value
6. Presentation
   - Format for authorized users
   - Include full evidence chain
   - Disclose uncertainty
   - Provide alternatives
7. Approval (if required)
   - User reviews recommendation
   - User approves/rejects/modifies
8. Execution (if approved)
   - Execute permitted actions only
   - Log execution details
9. Outcome Measurement
   - Track actual results
   - Compare to predictions
   - Record feedback
\`\`\`

**Engine Components:**
\`\`\`typescript
interface InferenceEngine {
  // Data retrieval (authorized)
  gatherContext(request: InferenceRequest): Promise<Context>;

  // Analytics execution
  runAnalytics(context: Context, analytics: AnalyticsSpec[]): Promise<AnalyticsResult[]>;

  // Model inference
  runModels(context: Context, models: ModelSpec[]): Promise<Prediction[]>;

  // Business rules
  applyRules(context: Context, rules: RuleSpec[]): Promise<RuleResult[]>;

  // Synthesis
  synthesize(
    context: Context,
    analytics: AnalyticsResult[],
    predictions: Prediction[],
    rules: RuleResult[]
  ): Promise<Recommendation[]>;

  // Present to user
  present(recommendations: Recommendation[], user: User): Promise<void>;
}
\`\`\`

**Safety Principles:**
- No recommendation without cited evidence
- No action without explicit approval (for consequential actions)
- Uncertainty always disclosed
- Conflicting evidence surfaced, not hidden
- Cannot access data outside user's authorization
- Cannot execute actions without permission
- Business rules always take precedence over ML predictions`
    },
    {
      id: 'AIML-6',
      title: '6. AI Assistant and Tool Execution',
      content: `**AI Assistant Architecture:**
\`\`\`
User Query → Intent Classification → Authorization Check →
Tool Selection → Input Validation → Sandboxed Execution →
Output Validation → Response Formatting → User Display
\`\`\`

**Authorized Tools:**
\`\`\`typescript
interface AITool {
  id: string;
  name: string;
  description: string;
  parameters: JSONSchema;
  requiredPermission: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  execute: (params: unknown, context: AuthContext) => Promise<ToolResult>;
}

// Example tools
const tools: AITool[] = [
  {
    id: 'search_leads',
    name: 'Search Leads',
    description: 'Search for leads matching criteria',
    parameters: { /* JSON Schema */ },
    requiredPermission: 'read:lead',
    riskLevel: 'low',
    requiresApproval: false,
    execute: async (params, ctx) => { /* ... */ }
  },
  {
    id: 'create_task',
    name: 'Create Task',
    description: 'Create a new task in a project',
    parameters: { /* JSON Schema */ },
    requiredPermission: 'create:task',
    riskLevel: 'medium',
    requiresApproval: false,
    execute: async (params, ctx) => { /* ... */ }
  },
  {
    id: 'approve_expense',
    name: 'Approve Expense',
    description: 'Approve a pending expense',
    parameters: { /* JSON Schema */ },
    requiredPermission: 'approve:expense',
    riskLevel: 'high',
    requiresApproval: true,  // User must confirm before execution
    execute: async (params, ctx) => { /* ... */ }
  }
];
\`\`\`

**Safety Controls:**
- Prompt injection prevention (input sanitization)
- Tool authorization checked before execution
- High-risk tools require explicit user confirmation
- All tool calls logged with full context
- Output validation prevents data leakage
- Rate limiting on AI assistant usage
- No direct database access from AI
- No execution of arbitrary code
- Sandboxed execution environment`
    }
  ]
};

export const archDoc10: Document = {
  id: 'reliability-observability',
  number: 10,
  title: 'Reliability and Observability Plan',
  shortTitle: 'Reliability',
  description: 'Logging, monitoring, retries, failure handling, backup and recovery.',
  status: 'Recorded',
  stage: 2,
  sections: [
    {
      id: 'RO-1',
      title: '1. Logging Architecture',
      content: `**Structured Logging:**
\`\`\`typescript
interface LogEntry {
  timestamp: string;          // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service: string;            // Module or service name
  requestId: string;          // Correlation ID for request tracing
  tenantId?: string;          // Tenant context (if applicable)
  userId?: string;            // User context (if applicable)
  duration?: number;          // Operation duration (ms)
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, unknown>;  // Additional context
}
\`\`\`

**Logging Rules:**
- All logs structured (JSON format)
- Correlation IDs trace requests across services
- Tenant ID included for tenant-scoped operations
- Sensitive data masked (PII, credentials, tokens)
- Log levels used consistently (debug for development, info for operations, error for failures)
- No sensitive data in log messages
- Request/response bodies logged at debug level only

**Log Destinations:**
- Development: Console
- Production: Centralized log aggregation (e.g., CloudWatch, Datadog, ELK)
- Audit logs: Separate, immutable storage
- Security logs: Enhanced retention, separate access controls

**Log Retention:**
- Application logs: 30 days (configurable)
- Audit logs: 7 years minimum
- Security logs: 1 year minimum
- Error logs: 90 days`
    },
    {
      id: 'RO-2',
      title: '2. Monitoring and Metrics',
      content: `**Application Metrics:**
\`\`\`typescript
interface AppMetrics {
  // Request metrics
  http_requests_total: Counter;
  http_request_duration_seconds: Histogram;
  http_request_errors_total: Counter;

  // Business metrics
  business_operations_total: Counter;  // By operation type
  business_operation_duration_seconds: Histogram;

  // Database metrics
  db_query_duration_seconds: Histogram;
  db_connections_active: Gauge;
  db_connections_waiting: Gauge;

  // Background job metrics
  jobs_queued_total: Counter;
  jobs_completed_total: Counter;
  jobs_failed_total: Counter;
  job_duration_seconds: Histogram;

  // ML/Inference metrics
  inference_requests_total: Counter;
  inference_duration_seconds: Histogram;
  model_prediction_confidence: Histogram;

  // Cache metrics
  cache_hits_total: Counter;
  cache_misses_total: Counter;
}
\`\`\`

**Health Checks:**
\`\`\`typescript
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: { status: string; latency: number };
    cache: { status: string; latency: number };
    storage: { status: string; latency: number };
    ml_service: { status: string; latency: number };
    queue: { status: string; depth: number };
  };
  version: string;
  uptime: number;
}
\`\`\`

**Alerting Rules:**
- Error rate > 1% for 5 minutes → Warning
- Error rate > 5% for 2 minutes → Critical
- Latency p95 > 2s for 5 minutes → Warning
- Latency p95 > 5s for 2 minutes → Critical
- Database connection pool exhausted → Critical
- Background job failure rate > 10% → Warning
- ML service unavailable → Warning (graceful degradation)
- Disk usage > 80% → Warning
- Disk usage > 95% → Critical

**Dashboards:**
- System overview: Request rate, error rate, latency
- Business metrics: Operations per module, user activity
- Database: Query performance, connection pool, slow queries
- Background jobs: Queue depth, completion rate, failures
- ML/Inference: Prediction latency, model performance, drift detection`
    },
    {
      id: 'RO-3',
      title: '3. Failure Handling Strategies',
      content: `**Retry Policies:**
\`\`\`typescript
interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;      // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[]; // Error codes that should be retried
}

// Different policies for different operations
const apiRetryPolicy: RetryPolicy = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 5000,
  backoffMultiplier: 2,
  retryableErrors: ['TIMEOUT', 'SERVICE_UNAVAILABLE', 'RATE_LIMITED']
};

const dbRetryPolicy: RetryPolicy = {
  maxRetries: 2,
  initialDelay: 50,
  maxDelay: 1000,
  backoffMultiplier: 2,
  retryableErrors: ['CONNECTION_LOST', 'DEADLOCK']
};
\`\`\`

**Circuit Breakers:**
\`\`\`typescript
interface CircuitBreaker {
  state: 'closed' | 'open' | 'half-open';
  failureThreshold: number;
  recoveryTimeout: number;
  monitoredErrors: string[];
}

// Applied to external service calls
// Opens after N failures, stops calling service
// Periodically tests if service recovered
\`\`\`

**Timeouts:**
- API requests: 30 seconds default
- Database queries: 10 seconds default
- ML inference: 5 seconds default
- Background jobs: Configurable per job type
- External integrations: 15 seconds default

**Graceful Degradation:**
- ML service unavailable → Show "predictions unavailable" message
- Cache unavailable → Direct database queries (slower but functional)
- Search service unavailable → Basic filtering only
- Notification service unavailable → Queue for later delivery
- File storage unavailable → Block uploads, allow other operations

**Idempotency:**
- All write operations support idempotency keys
- Duplicate requests with same key return same result
- Keys stored with expiration (24 hours)
- Prevents duplicate operations from retries`
    },
    {
      id: 'RO-4',
      title: '4. Backup and Recovery',
      content: `**Backup Strategy:**
\`\`\`
Database:
- Automated daily full backups (off-peak hours)
- Continuous WAL archiving for point-in-time recovery
- Backup encryption (AES-256)
- Geographic redundancy (different region from primary)
- Retention: 30 daily, 12 weekly, 24 monthly

Object Storage:
- Cross-region replication enabled
- Versioning enabled for critical buckets
- Lifecycle policies for cost management

Configuration:
- Infrastructure as Code (versioned in Git)
- Database schema versioned (migrations)
- Application code versioned (Git)
- Secrets managed externally (not in backups)
\`\`\`

**Recovery Procedures:**

**Database Recovery:**
1. Assess data loss extent
2. Choose recovery point (latest, specific timestamp)
3. Restore from backup
4. Apply WAL logs to desired point
5. Verify data integrity
6. Update connection strings
7. Monitor for issues

**Application Recovery:**
1. Identify failure cause
2. Rollback deployment if code issue
3. Restart services
4. Verify health checks pass
5. Monitor for recurrence

**Full Disaster Recovery:**
1. Activate DR environment
2. Restore database from backup
3. Restore object storage (if needed)
4. Update DNS to DR environment
5. Verify all services operational
6. Communicate status to users

**Recovery Objectives:**
- RPO (Recovery Point Objective): < 1 hour (WAL archiving)
- RTO (Recovery Time Objective): < 4 hours
- Tested quarterly with documented results

**Backup Verification:**
- Automated restore testing monthly
- Data integrity checks on restore
- Performance benchmarking after restore
- Documented procedures reviewed quarterly`
    },
    {
      id: 'RO-5',
      title: '5. Incident Response',
      content: `**Incident Severity Levels:**

**P1 - Critical (Response: Immediate)**
- Complete service outage
- Data breach or security incident
- Data loss or corruption
- Tenant isolation failure

**P2 - High (Response: < 15 minutes)**
- Major feature unavailable
- Significant performance degradation
- Multiple users affected

**P3 - Medium (Response: < 1 hour)**
- Minor feature unavailable
- Intermittent issues
- Small number of users affected

**P4 - Low (Response: < 4 hours)**
- Cosmetic issues
- Non-critical feature degradation
- Single user affected

**Incident Response Process:**
1. **Detection:** Monitoring alerts, user reports
2. **Triage:** Assess severity, assign responder
3. **Communication:** Notify stakeholders, status page update
4. **Investigation:** Identify root cause
5. **Mitigation:** Restore service (workaround if needed)
6. **Resolution:** Fix root cause
7. **Verification:** Confirm fix, monitor
8. **Post-Mortem:** Document lessons learned
9. **Improvement:** Implement preventive measures

**Communication Templates:**
- Initial: "We are investigating an issue affecting [service]. Updates to follow."
- Update: "Issue identified. We are working on a fix. ETA: [time]."
- Resolution: "Issue resolved. Services operational. Post-mortem to follow."
- Post-Mortem: Published internally within 48 hours

**On-Call Rotation:**
- Rotating schedule for P1/P2 incidents
- Escalation paths defined
- Contact information current
- Handoff procedures documented`
    }
  ]
};

export const archDoc11: Document = {
  id: 'implementation-sequence',
  number: 11,
  title: 'Architecture Implementation Sequence',
  shortTitle: 'Implementation Sequence',
  description: 'Technical dependencies and architecture requirements mapped to the 26 phases.',
  status: 'Recorded',
  stage: 2,
  sections: [
    {
      id: 'IS-1',
      title: '1. Phase-to-Architecture Mapping (Phases 1-13)',
      content: `**Phase 1: Master Requirements** ✓ COMPLETE
- Architecture prerequisites: None
- Status: Completed (Stage 1)

**Phase 2: Architecture & Technical Contracts** ✓ IN PROGRESS
- Prerequisites: Phase 1 approved
- Architecture deliverables: This document set
- Key decisions: ADR-001 through ADR-006
- Gate: Architecture approved, technology stack confirmed

**Phase 3: Repository & Infrastructure**
- Prerequisites: Phase 2 complete
- Architecture requirements: Monorepo structure, CI/CD pipeline, dev environment
- Interfaces: None yet (foundation)
- Risks: Environment consistency, secret management setup
- Artifacts: Repository, CI/CD config, Docker setup, linting config
- Tests: Build passes, lint passes, dev environment works

**Phase 4: UI/UX Design System**
- Prerequisites: Phase 2 complete
- Architecture requirements: Component library, design tokens, accessibility patterns
- Interfaces: Design system API (component props, themes)
- Risks: Accessibility compliance, responsive design complexity
- Artifacts: Component library, Storybook, design documentation
- Tests: Visual regression, accessibility audit, responsive testing

**Phase 5: Authentication & Organization**
- Prerequisites: Phases 3, 4
- Architecture requirements: Auth flow, tenant model, RLS policies
- Interfaces: Auth API, session management, tenant context
- Risks: Security vulnerabilities, tenant isolation gaps
- Artifacts: Auth implementation, tenant management, RLS policies
- Tests: Auth flows, tenant isolation tests, security audit

**Phase 6: Application Shell & Navigation**
- Prerequisites: Phase 5
- Architecture requirements: Layout system, routing, navigation state
- Interfaces: Navigation API, layout components
- Risks: Navigation complexity, deep linking
- Artifacts: App shell, navigation system, routing config
- Tests: Navigation flows, deep linking, responsive layout

**Phase 7: Shared Frontend Components**
- Prerequisites: Phase 6
- Architecture requirements: Form system, table system, modal system
- Interfaces: Component APIs, validation integration
- Risks: Component complexity, accessibility
- Artifacts: Shared components, form handling, validation
- Tests: Component tests, integration tests, accessibility

**Phase 8: Database Schema**
- Prerequisites: Phase 2
- Architecture requirements: Complete schema, migrations, RLS
- Interfaces: Database API (Prisma client)
- Risks: Migration complexity, data integrity
- Artifacts: Schema, migrations, seed data, integrity tests
- Tests: Migration tests, constraint tests, RLS tests

**Phase 9: Backend APIs**
- Prerequisites: Phase 8
- Architecture requirements: API routes, business logic, validation
- Interfaces: REST APIs, Server Actions
- Risks: API complexity, validation gaps
- Artifacts: API endpoints, business logic, validation
- Tests: API tests, integration tests, validation tests

**Phase 10: Shared Infrastructure Services**
- Prerequisites: Phases 8, 9
- Architecture requirements: File storage, notifications, background jobs
- Interfaces: Service APIs
- Risks: Service reliability, integration complexity
- Artifacts: File service, notification service, job queue
- Tests: Service tests, integration tests

**Phase 11: CRM Module**
- Prerequisites: Phases 7, 9
- Architecture requirements: CRM entities, workflows, APIs
- Interfaces: CRM API, event publication
- Risks: Workflow complexity, data model
- Artifacts: CRM implementation, workflows, tests
- Tests: CRM workflow tests, API tests

**Phase 12: Sales & Marketing**
- Prerequisites: Phase 11
- Architecture requirements: Sales entities, pipeline, campaigns
- Interfaces: Sales API, CRM integration, event publication
- Risks: Pipeline complexity, integration
- Artifacts: Sales implementation, marketing, tests
- Tests: Sales workflow tests, integration tests

**Phase 13: Finance**
- Prerequisites: Phases 9, 12
- Architecture requirements: Financial entities, transactions, reporting
- Interfaces: Finance API, Sales integration
- Risks: Financial integrity, compliance
- Artifacts: Finance implementation, reports, tests
- Tests: Financial calculation tests, integrity tests`
    },
    {
      id: 'IS-2',
      title: '2. Phase-to-Architecture Mapping (Phases 14-26)',
      content: `**Phase 14: Inventory & Procurement**
- Prerequisites: Phases 9, 13
- Architecture requirements: Inventory entities, stock management, procurement
- Interfaces: Inventory API, Finance integration
- Risks: Stock calculation complexity, procurement workflows
- Artifacts: Inventory implementation, procurement, tests
- Tests: Stock calculation tests, procurement workflow tests

**Phase 15: Projects & Workforce**
- Prerequisites: Phases 9, 14
- Architecture requirements: Project entities, tasks, workforce
- Interfaces: Projects API, Finance integration, HR integration
- Risks: Resource allocation complexity, scheduling
- Artifacts: Projects implementation, workforce, tests
- Tests: Project workflow tests, resource allocation tests

**Phase 16: Data Quality & Analytics Model**
- Prerequisites: Phases 9, 11-15
- Architecture requirements: Analytics schema, ETL, data quality
- Interfaces: Analytics API, data extraction
- Risks: Data pipeline complexity, quality issues
- Artifacts: Analytics schema, ETL pipelines, quality monitoring
- Tests: ETL tests, data quality tests

**Phase 17: Business Metrics & Analytics**
- Prerequisites: Phase 16
- Architecture requirements: Metric definitions, calculation services
- Interfaces: Metrics API, dashboard data
- Risks: Calculation accuracy, performance
- Artifacts: Metric services, calculation logic, tests
- Tests: Metric calculation tests, performance tests

**Phase 18: Dashboards & Reports**
- Prerequisites: Phase 17
- Architecture requirements: Dashboard system, report builder
- Interfaces: Dashboard API, report generation
- Risks: Visualization complexity, performance
- Artifacts: Dashboard implementation, reports, tests
- Tests: Dashboard tests, report generation tests

**Phase 19: ML Data Pipelines**
- Prerequisites: Phase 16
- Architecture requirements: Feature engineering, training data
- Interfaces: Feature API, dataset API
- Risks: Feature consistency, data leakage
- Artifacts: Feature pipelines, training datasets, tests
- Tests: Feature tests, data validation tests

**Phase 20: ML Models & Evaluation**
- Prerequisites: Phase 19
- Architecture requirements: Model training, evaluation, registry
- Interfaces: Model API, evaluation API
- Risks: Model accuracy, overfitting
- Artifacts: Trained models, evaluation results, registry
- Tests: Model evaluation tests, bias tests

**Phase 21: Model Serving**
- Prerequisites: Phase 20
- Architecture requirements: Inference API, model loading
- Interfaces: Inference API
- Risks: Latency, scalability
- Artifacts: Inference service, monitoring, tests
- Tests: Inference tests, load tests

**Phase 22: Inference Intelligence Engine**
- Prerequisites: Phases 18, 21
- Architecture requirements: Orchestration, recommendations
- Interfaces: Recommendation API, approval API
- Risks: Orchestration complexity, safety
- Artifacts: Engine implementation, recommendations, tests
- Tests: Orchestration tests, safety tests

**Phase 23: AI Assistant & Automation**
- Prerequisites: Phase 22
- Architecture requirements: AI interface, tool execution
- Interfaces: AI API, tool APIs
- Risks: Safety, prompt injection
- Artifacts: AI assistant, tools, safety controls, tests
- Tests: Safety tests, tool execution tests

**Phase 24: Integrations & SaaS Admin**
- Prerequisites: Phases 10, 23
- Architecture requirements: Integration framework, admin panel
- Interfaces: Integration API, admin API
- Risks: Integration complexity, security
- Artifacts: Integration framework, admin panel, tests
- Tests: Integration tests, admin tests

**Phase 25: Full-System Verification**
- Prerequisites: All previous phases
- Architecture requirements: Integration testing, security audit
- Interfaces: All interfaces verified
- Risks: Integration issues, security gaps
- Artifacts: Test results, audit report, verification
- Tests: Full integration tests, security penetration test

**Phase 26: Production Deployment**
- Prerequisites: Phase 25
- Architecture requirements: Deployment pipeline, monitoring
- Interfaces: Production APIs
- Risks: Deployment issues, monitoring gaps
- Artifacts: Production deployment, monitoring, documentation
- Tests: Production smoke tests, monitoring verification`
    },
    {
      id: 'IS-3',
      title: '3. Critical Path and Dependencies',
      content: `**Critical Path:**
\`\`\`
Phase 1 → 2 → 3 → 5 → 6 → 7 → 9 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 22 → 23 → 24 → 25 → 26
\`\`\`

**Parallel Opportunities:**
- Phase 4 (UI/UX) can run parallel to Phase 3 (Repository)
- Phase 8 (Database) can run parallel to Phases 4-7
- Phase 19-21 (ML) can begin after Phase 16, parallel to Phases 17-18

**Key Dependencies:**
- Phase 5 (Auth) blocks all business modules
- Phase 9 (Backend APIs) blocks all module implementations
- Phase 16 (Analytics) blocks BI and ML phases
- Phase 21 (Model Serving) blocks Inference Engine
- Phase 25 (Verification) blocks production deployment

**Decisions Required Before Phase 3:**
- ADR-001: Modular monolith confirmed
- ADR-002: Next.js backend confirmed
- ADR-003: PostgreSQL + Prisma confirmed
- ADR-004: Python ML services confirmed
- ADR-005: RLS + middleware tenancy confirmed
- ADR-006: Selective event-driven confirmed
- Authentication provider selected
- Cloud provider selected (or deferred)

**Decisions That Can Be Deferred:**
- Background job implementation (Phase 10)
- Search implementation details (Phase 7)
- Real-time communication approach (Phase 6)
- ML infrastructure details (Phase 19)`
    }
  ]
};

export const archDoc12: Document = {
  id: 'open-decisions-updated',
  number: 12,
  title: 'Open Decisions and Assumptions (Updated)',
  shortTitle: 'Open Decisions',
  description: 'Updated from Stage 1. Preserves previous entries and clearly marks changes.',
  status: 'Updated',
  stage: 2,
  sections: [
    {
      id: 'ODU-1',
      title: '1. Decisions Requiring Approval (Updated from Stage 1)',
      content: `**DECISION-001: Backend Architecture** → ADR-002
- Stage 1: Question raised
- Stage 2: **PROPOSAL: Next.js API Routes + Server Actions**
- Rationale: Unified stack, shared types, simpler deployment
- Status: **PENDING APPROVAL**

**DECISION-002: Authentication Provider**
- Stage 1: Question raised
- Stage 2: Options evaluated (NextAuth, Clerk, Auth0, Supabase, custom)
- **No recommendation yet** — requires evaluation of specific requirements
- Factors: Cost, control, MFA, SSO, developer experience
- Status: **PENDING APPROVAL** (needs requirements clarification)

**DECISION-003: Database ORM** → ADR-003
- Stage 1: Question raised
- Stage 2: **PROPOSAL: PostgreSQL + Prisma**
- Rationale: Type safety, migration management, DX
- Status: **PENDING APPROVAL**

**DECISION-004: Cloud Provider**
- Stage 1: Question raised
- Stage 2: Options identified (AWS, GCP, Azure, Vercel)
- **No recommendation yet** — depends on target market and compliance
- Status: **PENDING APPROVAL** (can be deferred to Phase 3)

**DECISION-005: Real-time Strategy**
- Stage 1: Question raised
- Stage 2: **PROPOSAL: SSE for notifications, WebSocket for collaboration (future)**
- Rationale: Start simple, add complexity when needed
- Status: **PENDING APPROVAL**

**DECISION-006: ML Infrastructure** → ADR-004
- Stage 1: Question raised
- Stage 2: **PROPOSAL: Python microservices (FastAPI)**
- Rationale: ML ecosystem, specialized libraries, team flexibility
- Status: **PENDING APPROVAL**

**DECISION-007: Multi-language Support (i18n)**
- Stage 1: Question raised
- Stage 2: **PROPOSAL: English-only for initial release, i18n framework prepared**
- Rationale: Reduce initial complexity, prepare for future
- Status: **PENDING APPROVAL**

**DECISION-008: Mobile Application**
- Stage 1: Question raised
- Stage 2: **PROPOSAL: Responsive web only for initial release**
- Rationale: Single codebase, responsive design covers mobile
- Status: **PENDING APPROVAL**`
    },
    {
      id: 'ODU-2',
      title: '2. New Architecture Decisions (Stage 2)',
      content: `**ADR-001: Modular Monolith Architecture**
- Proposal: Modular monolith with clear boundaries
- Alternatives: Full microservices, pure monolith, hybrid
- Status: **PENDING APPROVAL**

**ADR-005: Tenant Isolation Strategy**
- Proposal: RLS + middleware (defense-in-depth)
- Alternatives: App-level only, DB RLS only, separate databases
- Status: **PENDING APPROVAL**

**ADR-006: Event-Driven Communication**
- Proposal: Selective events (direct calls + events where beneficial)
- Alternatives: All direct, all events, REST between modules
- Status: **PENDING APPROVAL**`
    },
    {
      id: 'ODU-3',
      title: '3. Assumptions (Updated from Stage 1)',
      content: `**ASSUMPTION-001: Target Market**
- Stage 1: Tanzania and East Africa primarily
- Stage 2: **Unchanged** — affects data residency and compliance decisions
- Status: **TO BE VALIDATED**

**ASSUMPTION-002: Target Organization Size**
- Stage 1: SMBs with potential for larger organizations
- Stage 2: **Unchanged** — architecture supports scaling
- Status: **TO BE VALIDATED**

**ASSUMPTION-003: Primary Language**
- Stage 1: English for initial release
- Stage 2: **Unchanged** — i18n framework prepared but not implemented
- Status: **TO BE VALIDATED**

**ASSUMPTION-004: Development Team Skills**
- Stage 1: TypeScript, React, PostgreSQL experience
- Stage 2: **Unchanged** — Python skills needed for ML services
- Status: **TO BE VALIDATED** (Python skills gap identified)

**ASSUMPTION-005: Internet Connectivity**
- Stage 1: May be intermittent in target market
- Stage 2: **Unchanged** — responsive design handles mobile, offline not in scope
- Status: **TO BE VALIDATED**

**ASSUMPTION-006: Business Model**
- Stage 1: SaaS subscription
- Stage 2: **Unchanged** — SaaS admin module planned
- Status: **TO BE VALIDATED**

**ASSUMPTION-007: Existing Codebase**
- Stage 1: Preserve existing auth if working
- Stage 2: **No existing codebase confirmed** — starting from scratch
- Status: **CLARIFIED** — No existing codebase

**ASSUMPTION-008: Data Marketplace Timeline**
- Stage 1: Future feature
- Stage 2: **Unchanged** — architecture isolates marketplace for future
- Status: **TO BE VALIDATED**`
    },
    {
      id: 'ODU-4',
      title: '4. Risks (Updated from Stage 1)',
      content: `**RISK-001: Scope Complexity** — HIGH
- Stage 1: Identified
- Stage 2: **Unchanged** — 26 phases, 20+ modules, ML, multi-industry
- Mitigation: Strict phase gating, modular architecture
- Status: **ACTIVE**

**RISK-002: ML Accuracy Expectations** — MEDIUM
- Stage 1: Identified
- Stage 2: **Unchanged** — architecture includes uncertainty disclosure
- Mitigation: Clear communication, minimum data thresholds
- Status: **ACTIVE**

**RISK-003: Multi-Tenant Security** — LOW (with controls)
- Stage 1: Identified
- Stage 2: **Mitigated by architecture** — RLS + middleware + testing
- Mitigation: Defense-in-depth, automated testing, penetration testing
- Status: **MITIGATED** (requires implementation verification)

**RISK-004: Industry Configuration Complexity** — MEDIUM
- Stage 1: Identified
- Stage 2: **Addressed by architecture** — universal core + profiles + extensions
- Mitigation: Strong universal core, curated profiles, extension framework
- Status: **MITIGATED** (requires implementation verification)

**RISK-005: Performance at Scale** — MEDIUM
- Stage 1: Identified
- Stage 2: **Addressed by architecture** — analytics schema, read replicas, caching
- Mitigation: Separate analytics, pre-aggregation, query optimization
- Status: **MITIGATED** (requires load testing)

**RISK-006: Regulatory Compliance** — MEDIUM
- Stage 1: Identified
- Stage 2: **Unchanged** — requires legal review
- Mitigation: Privacy-by-design, configurable data handling, legal review
- Status: **ACTIVE** (requires legal consultation)

**NEW RISK-007: Python/TypeScript Integration** — LOW
- Stage 2: Two language ecosystems, API boundary management
- Mitigation: Clear API contracts, typed interfaces, monitoring
- Status: **IDENTIFIED**`
    }
  ]
};

export const archDoc13: Document = {
  id: 'project-status-updated',
  number: 13,
  title: 'Project Status (Updated)',
  shortTitle: 'Status',
  description: 'Updated from Stage 1. Current stage, completed deliverables, unresolved decisions and next permitted action.',
  status: 'Updated',
  stage: 2,
  sections: [
    {
      id: 'PSU-1',
      title: '1. Current Stage',
      content: `**Stage:** 2 — System Architecture and Technical Contracts

**Stage Status:** Documentation in progress (completing)

**Stage Objective:** Convert approved product requirements into coherent, technically feasible system architecture that can be implemented incrementally.

**Authorization:** Architecture analysis and documentation only. No implementation code, database migrations, UI implementation, model training or inference engine development.`
    },
    {
      id: 'PSU-2',
      title: '2. Completed Documentation',
      content: `**Stage 1 Documents (Completed):**
| # | Document | Status |
|---|----------|--------|
| 1-13 | Master Requirements through Project Status | Recorded |

**Stage 2 Documents (Completed):**
| # | Document | Status |
|---|----------|--------|
| 1 | System Architecture | Recorded |
| 2 | Architecture Decision Records | Recorded |
| 3 | Technology Stack Evaluation | Recorded |
| 4 | Module Dependency Map | Recorded |
| 5 | API and Event Contracts | Recorded |
| 6 | Data Architecture Plan | Recorded |
| 7 | Tenancy and Authorization Architecture | Recorded |
| 8 | Industry Configuration Architecture | Recorded |
| 9 | AI/ML and Inference Architecture | Recorded |
| 10 | Reliability and Observability Plan | Recorded |
| 11 | Architecture Implementation Sequence | Recorded |
| 12 | Open Decisions and Assumptions (Updated) | Updated |
| 13 | Project Status (Updated) | Updated |

**Total Documents:** 26 (13 from Stage 1 + 13 from Stage 2)`
    },
    {
      id: 'PSU-3',
      title: '3. Approved Decisions',
      content: `**Confirmed from Stage 1:**
1. Product is universal, multi-tenant business platform
2. All industries supported (extensible catalogue + custom)
3. Intelligence cycle distinguishes facts from predictions
4. AI must not fabricate evidence
5. Tenant isolation is non-negotiable
6. Default-deny authorization
7. Platform admins cannot access tenant data by default
8. Strict TypeScript, no any
9. Schema-first development
10. Documentation precedes implementation

**Proposed in Stage 2 (Pending Approval):**
1. ADR-001: Modular monolith architecture
2. ADR-002: Next.js as primary backend
3. ADR-003: PostgreSQL + Prisma
4. ADR-004: Python for ML/data services
5. ADR-005: RLS + middleware tenant isolation
6. ADR-006: Selective event-driven communication
7. SSE for notifications, WebSocket for collaboration (future)
8. English-only initial release, i18n prepared
9. Responsive web only (no native mobile)`
    },
    {
      id: 'PSU-4',
      title: '4. Unresolved Issues',
      content: `**Still Unresolved from Stage 1:**
1. Authentication provider not selected
2. Cloud provider not selected
3. Target market compliance requirements need legal review
4. Development team size and skills not confirmed
5. Timeline expectations not established
6. Budget constraints not defined

**Newly Identified in Stage 2:**
7. Python skills gap for ML services (team may need training)
8. Integration complexity between TypeScript and Python services

**Blocking Issues:**
- Architecture decisions (ADR-001 through ADR-006) need approval before Phase 3
- Authentication provider needed before Phase 5 implementation
- Cloud provider decision can be deferred to Phase 3`
    },
    {
      id: 'PSU-5',
      title: '5. Next Permitted Action',
      content: `**Current Permission:** Architecture documentation ONLY (Stage 2).

**Stage 2 Completion Status:**
- All 13 architecture documents created
- Architecture principles evaluated and documented
- Technology stack evaluated with proposals
- Module dependencies mapped
- API and event contracts defined
- Data architecture planned
- Tenancy and authorization designed
- Industry configuration architecture designed
- AI/ML architecture designed
- Reliability and observability planned
- Implementation sequence mapped to 26 phases
- Open decisions updated
- Project status updated

**Recommended Next Phase:** Phase 3 — Repository and Development Infrastructure

**Phase 3 Scope (when authorized):**
- Initialize repository with monorepo structure
- Set up CI/CD pipeline
- Configure development environment (Docker, linting, formatting)
- Set up secret management
- Create initial project structure (Next.js app, Python services)
- Establish development standards and conventions

**Prerequisites for Phase 3:**
- Stage 2 architecture documentation approved
- ADR-001 through ADR-006 approved
- Authentication provider selected (or deferred with justification)
- Development team confirmed

**STOPPING POINT:** Stage 2 documentation is complete. Awaiting explicit instruction to proceed to Phase 3 or to modify any architectural decisions.`
    }
  ]
};
