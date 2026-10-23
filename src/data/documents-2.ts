import { Document } from './types';

export const doc5: Document = {
  id: 'workflow-catalog',
  number: 5,
  title: 'Business Workflow Catalog',
  shortTitle: 'Workflows',
  description: 'Cross-module workflows, lifecycle states, business rules, exceptions and audit requirements.',
  status: 'Recorded',
  sections: [
    {
      id: '5.1',
      title: '5.1 Lead-to-Revenue Workflow',
      content: `**Lifecycle States:**
Lead: New → Contacted → Qualified → Unqualified
Opportunity: Prospecting → Qualification → Proposal → Negotiation → Closed Won / Closed Lost
Quotation: Draft → Under Review → Approved → Sent → Accepted / Rejected / Expired
Order: Pending → Confirmed → Processing → Fulfilled → Completed / Cancelled
Invoice: Draft → Sent → Paid → Overdue → Written Off

**Business Rules:**
- Lead cannot become Opportunity without qualification criteria met
- Quotation requires approval before sending (configurable threshold)
- Order cannot be fulfilled without confirmed payment terms
- Invoice auto-generated from accepted quotation or order
- Overdue invoice triggers notification after configurable grace period

**Cross-Module Dependencies:**
- CRM → Sales: Lead conversion creates Opportunity
- Sales → Finance: Closed Won creates Invoice
- Sales → Inventory: Order triggers stock reservation
- Finance → CRM: Payment receipt updates customer status

**Audit Requirements:**
- All state transitions logged with actor, timestamp and reason
- Approval decisions recorded with approver identity
- Financial transactions require immutable audit trail
- Communication history linked to relevant records`
    },
    {
      id: '5.2',
      title: '5.2 Procure-to-Pay Workflow',
      content: `**Lifecycle States:**
Purchase Request: Draft → Submitted → Approved / Rejected
Purchase Order: Draft → Sent → Confirmed → Partially Received → Fully Received → Closed
Receiving: Scheduled → In Progress → Inspected → Accepted / Rejected
Payment: Pending → Approved → Processing → Completed / Failed

**Business Rules:**
- Purchase request above threshold requires manager approval
- Purchase order cannot exceed approved request amount
- Receiving must match PO quantities (configurable tolerance)
- Quality inspection required for configurable product categories
- Payment requires matched PO, receiving record and invoice (three-way match)
- Duplicate invoice detection before payment processing

**Cross-Module Dependencies:**
- Inventory → Procurement: Reorder rules trigger purchase requests
- Procurement → Finance: Approved POs create payment obligations
- Procurement → Inventory: Receiving updates stock levels
- Finance → Procurement: Payment completion closes PO

**Exception Handling:**
- Partial receiving: remaining quantity stays on PO
- Damaged goods: rejection with supplier notification
- Price discrepancy: approval escalation required
- Late delivery: performance tracking and supplier scoring

**Audit Requirements:**
- Three-way match results recorded
- Approval chain with timestamps and decisions
- Receiving inspection results with inspector identity
- Payment authorization trail`
    },
    {
      id: '5.3',
      title: '5.3 Project Delivery Workflow',
      content: `**Lifecycle States:**
Project: Planning → Initiation → Execution → Monitoring → Closure → Archived
Task: Backlog → To Do → In Progress → In Review → Done / Blocked
Milestone: Planned → In Progress → Completed / At Risk / Overdue
Deliverable: Planned → In Progress → Submitted → Approved / Rejected

**Business Rules:**
- Project requires approved budget before initiation
- Tasks cannot start before project initiation
- Milestone completion requires all dependent tasks done
- Deliverable approval requires designated reviewer
- Time entries require task assignment validation
- Resource allocation cannot exceed capacity (configurable threshold)

**Cross-Module Dependencies:**
- Projects → Finance: Budget tracking and cost allocation
- Projects → Workforce: Resource assignment and capacity planning
- Projects → Inventory: Material requisition for project tasks
- Finance → Projects: Cost tracking against budget

**Exception Handling:**
- Blocked tasks: escalation to project manager
- Budget overrun: approval required for additional allocation
- Resource conflict: priority-based resolution or escalation
- Scope change: formal change request with impact assessment

**Audit Requirements:**
- All task state changes with actor and timestamp
- Time entries linked to task and project
- Budget variance calculations at each reporting period
- Change requests with approval trail`
    },
    {
      id: '5.4',
      title: '5.4 Employee Lifecycle Workflow',
      content: `**Lifecycle States:**
Candidate: Applied → Screening → Interview → Offer → Hired / Rejected
Employee: Onboarding → Active → On Leave → Active → Offboarding → Former
Assignment: Proposed → Accepted → Active → Completed
Review: Self-Assessment → Manager Review → Calibration → Final Rating

**Business Rules:**
- Employee record cannot be created without required fields
- Onboarding requires completion of mandatory steps before active status
- Leave requests require manager approval
- Offboarding triggers access revocation and asset return
- Performance reviews follow defined cycle schedule
- Assignments require capacity validation

**Cross-Module Dependencies:**
- HR → Organization: User account creation and role assignment
- HR → Projects: Resource availability for assignments
- HR → Finance: Payroll integration (where applicable)
- Organization → HR: Access revocation on offboarding

**Audit Requirements:**
- All employment status changes with reason and effective date
- Access grants and revocations logged
- Performance review scores with reviewer identity
- Leave records with approval trail`
    },
    {
      id: '5.5',
      title: '5.5 Support Case Resolution Workflow',
      content: `**Lifecycle States:**
Case: New → Assigned → In Progress → Waiting (customer) → Resolved → Closed / Reopened
Priority: Low → Medium → High → Critical (configurable)
Satisfaction: Not Rated → Satisfied → Neutral → Dissatisfied

**Business Rules:**
- New cases auto-assigned based on routing rules (if configured)
- SLA timers start on case creation (configurable per priority)
- SLA breach triggers escalation
- Resolution requires resolution category and notes
- Case can be reopened within configurable window
- Customer satisfaction survey sent on resolution

**Cross-Module Dependencies:**
- Support → CRM: Case linked to customer/contact record
- Support → Products: Case linked to affected product/service
- Support → BI: Resolution time and satisfaction metrics

**Exception Handling:**
- SLA breach: automatic escalation to next level
- Customer non-response: auto-close after configurable period
- Complex issues: escalation with full history transfer
- Repeated issues: pattern detection triggers root cause analysis

**Audit Requirements:**
- All case state changes with agent and timestamp
- SLA timer events (start, pause, resume, breach)
- Customer communication log
- Resolution category and satisfaction rating`
    },
    {
      id: '5.6',
      title: '5.6 AI Recommendation and Action Workflow',
      content: `**Lifecycle States:**
Analysis: Data Collected → Validated → Analyzed → Insights Generated
Recommendation: Generated → Under Review → Approved / Rejected / Modified
Action: Approved → Scheduled → Executing → Completed / Failed
Outcome: Pending Measurement → Measured → Evaluated → Feedback Recorded

**Business Rules:**
- Recommendations must cite evidence and data sources
- Uncertainty must be disclosed with predictions
- Actions require explicit human approval before execution
- Executed actions are tracked for outcome measurement
- Failed actions trigger review and learning
- Model predictions cannot auto-execute without approval
- Recommendations based on insufficient data are flagged

**Cross-Module Dependencies:**
- BI → AI: Metrics and trends feed analysis
- AI → Business Modules: Approved actions execute in relevant module
- Business Modules → AI: Outcomes feed back for evaluation
- AI → Monitoring: Model performance tracked continuously

**Exception Handling:**
- Insufficient data: recommendation not generated, gap reported
- Conflicting recommendations: human review required
- Action failure: rollback where possible, alert generated
- Outcome worse than predicted: model review triggered

**Audit Requirements:**
- Full evidence chain for each recommendation
- Approval decision with approver and reasoning
- Action execution log with system and timestamp
- Outcome measurement with actual vs. predicted comparison
- Model version and configuration used for each prediction`
    }
  ]
};

export const doc6: Document = {
  id: 'architecture-plan',
  number: 6,
  title: 'System Architecture Plan',
  shortTitle: 'Architecture',
  description: 'Proposed architecture, components, boundaries, integrations, security controls and architecture decisions requiring approval.',
  status: 'Proposed',
  sections: [
    {
      id: '6.1',
      title: '6.1 Architecture Overview',
      content: `**Proposed Architecture Style:** Modular Monolith (initial) → Microservices (if justified by scale)

**Rationale:**
- Modular monolith provides clear boundaries without premature distribution complexity
- Modules can be extracted to services when scaling demands it
- Simpler deployment, testing and debugging in early stages
- Clear module boundaries enforced by code organization and API contracts

**High-Level Components:**
\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  Next.js App (React, TypeScript, Tailwind CSS)          │
│  Accessible component system (shadcn/ui based)          │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / WebSocket
┌──────────────────────────┴──────────────────────────────┐
│                   API Gateway / BFF                      │
│  Authentication, Rate limiting, Request routing          │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────┐
│                 Application Layer                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Org &   │ │  CRM &   │ │ Finance  │ │Inventory │  │
│  │  Admin   │ │  Sales   │ │          │ │& Procure │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Projects  │ │   HR /   │ │   BI &   │ │  AI/ML   │  │
│  │& Ops     │ │Workforce │ │Analytics │ │Inference │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────┐
│                 Infrastructure Layer                     │
│  PostgreSQL │ Redis │ Object Storage │ Message Queue    │
│  Background Jobs │ Search Index │ Monitoring            │
└─────────────────────────────────────────────────────────┘
\`\`\``
    },
    {
      id: '6.2',
      title: '6.2 Technology Stack Proposal',
      content: `**Frontend:**
- Framework: Next.js App Router
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS
- Components: shadcn/ui (accessible, customizable)
- State: React Server Components + client state management
- Forms: React Hook Form + Zod validation
- Charts: Recharts or similar (accessible charting)

**Backend:**
- Primary: Next.js server capabilities (API routes, server actions)
- Alternative (if needed): Dedicated Node.js/Express or Fastify backend
- Validation: Zod schemas shared between frontend and backend
- API Style: REST with typed contracts (OpenAPI generation)

**Database:**
- Primary: PostgreSQL
- ORM: Prisma (with reviewed migrations)
- Alternative consideration: Drizzle (lighter weight, SQL-first)
- Decision needed: Evaluate based on team preference and requirements

**Authentication:**
- Provider: To be selected (NextAuth.js, Clerk, Auth0, or custom)
- Requirements: MFA support, session management, SSO capability
- Must preserve existing working authentication if applicable

**ML/AI Services:**
- Language: Python 3.11+
- Framework: FastAPI for inference endpoints
- ML Libraries: scikit-learn, pandas, appropriate specialized libraries
- Model Serving: Dedicated service with versioning and monitoring
- LLM Integration: Where appropriate, with prompt safety controls

**Infrastructure:**
- Hosting: Cloud provider (AWS, GCP or Azure — decision needed)
- CI/CD: GitHub Actions or equivalent
- Monitoring: Application + infrastructure monitoring
- Logging: Structured logging with correlation IDs
- Secrets: Environment-based secret management (never in code)`
    },
    {
      id: '6.3',
      title: '6.3 Module Boundaries',
      content: `**Boundary Rules:**
- Each module owns its data entities
- Cross-module communication through defined interfaces only
- No direct database access between modules
- Shared concepts defined in a common domain layer
- Events for asynchronous cross-module communication

**Module Communication Patterns:**
- Synchronous: Direct function calls within same process (modular monolith)
- Asynchronous: Event/message-based for eventual consistency scenarios
- API: RESTful endpoints for external consumption

**Shared Domain Concepts:**
- User/Identity (owned by Organization module)
- Organization/Tenant (owned by Organization module)
- Currency, Units of Measure (shared reference data)
- Notification preferences (shared service)
- File/Document storage (shared service)

**Boundary Enforcement:**
- TypeScript module boundaries (import restrictions)
- Database schema ownership (each module owns its tables)
- API contract validation
- Architecture tests verifying no forbidden dependencies`
    },
    {
      id: '6.4',
      title: '6.4 Security Architecture',
      content: `**Authentication Layer:**
- Secure session management with httpOnly cookies
- CSRF protection on all state-changing operations
- Rate limiting on authentication endpoints
- Account lockout after failed attempts (configurable)
- Session timeout and refresh mechanisms

**Authorization Layer:**
- Middleware-based tenant scope enforcement
- Route-level permission checks
- Resource-level ownership validation
- Field-level sensitivity controls
- Approval workflow enforcement

**Data Protection:**
- Encryption at rest (database, file storage)
- TLS for all data in transit
- Sensitive field encryption (PII, credentials)
- Secure file upload validation
- Data masking in logs and error messages

**AI/ML Security:**
- Prompt injection prevention
- Tool-use authorization checks
- Output validation and sanitization
- Model input/output logging (with PII protection)
- Adversarial input detection where applicable

**Audit and Monitoring:**
- All security-relevant events logged
- Anomaly detection for access patterns
- Real-time alerting for security incidents
- Regular security scanning and penetration testing
- Incident response procedures documented`
    },
    {
      id: '6.5',
      title: '6.5 Architecture Decisions Requiring Approval',
      content: `**ADR-001: Modular Monolith vs. Microservices**
- Proposal: Start with modular monolith
- Rationale: Simpler operations, easier testing, extract services when needed
- Decision: PENDING

**ADR-002: Backend Framework**
- Options: Next.js API routes, dedicated Express/Fastify, or hybrid
- Proposal: Next.js server capabilities for initial implementation
- Rationale: Unified stack, SSR benefits, simpler deployment
- Decision: PENDING

**ADR-003: Database ORM**
- Options: Prisma, Drizzle, or raw SQL with query builder
- Proposal: Prisma for type safety and migration management
- Rationale: Strong typing, good DX, active community
- Decision: PENDING

**ADR-004: Authentication Provider**
- Options: NextAuth.js, Clerk, Auth0, Supabase Auth, custom
- Proposal: Evaluate based on requirements (MFA, SSO, cost, control)
- Decision: PENDING

**ADR-005: Cloud Provider**
- Options: AWS, GCP, Azure, or platform-agnostic approach
- Proposal: Evaluate based on target market, compliance needs, cost
- Decision: PENDING

**ADR-006: Real-time Communication**
- Options: WebSockets, Server-Sent Events, polling
- Proposal: SSE for notifications, WebSocket for collaborative features
- Decision: PENDING

**ADR-007: Search Implementation**
- Options: PostgreSQL full-text search, Elasticsearch, Meilisearch
- Proposal: PostgreSQL FTS initially, dedicated search engine if needed
- Decision: PENDING

**ADR-008: Background Job Processing**
- Options: Bull/BullMQ, Inngest, Trigger.dev, custom
- Proposal: Evaluate based on reliability requirements and scale
- Decision: PENDING`
    },
    {
      id: '6.6',
      title: '6.6 Integration Architecture',
      content: `**Integration Patterns:**
- REST API: For synchronous external integrations
- Webhooks: For event-driven notifications to external systems
- Scheduled Sync: For batch data exchange
- Manual Import/Export: For ad-hoc data transfer

**Integration Management:**
- Centralized integration configuration per tenant
- Credential storage with encryption
- Connection health monitoring
- Retry logic with exponential backoff
- Integration-specific error handling and reporting

**Planned Integration Categories:**
- Payment gateways (for finance module)
- Email providers (for communications)
- SMS providers (for notifications)
- Cloud storage (for file management)
- Accounting software (for finance sync)
- E-commerce platforms (for retail)
- Shipping carriers (for logistics)
- Communication tools (for collaboration)

**Integration Security:**
- OAuth 2.0 for third-party authorization where available
- API key encryption at rest
- Webhook signature verification
- Rate limiting per integration
- Integration audit logging`
    }
  ]
};

export const doc7: Document = {
  id: 'database-plan',
  number: 7,
  title: 'Database and Data Domain Plan',
  shortTitle: 'Database Plan',
  description: 'Preliminary domain entities, relationships, tenancy, data ownership, integrity requirements and migration principles.',
  status: 'Recorded',
  sections: [
    {
      id: '7.1',
      title: '7.1 Domain Entity Overview',
      content: `**Core Domain Entities (by module ownership):**

Organization Module:
- Organization, Branch, Department, Team
- User, Membership, Role, Permission
- Invitation, AuditLog

CRM Module:
- Lead, Contact, Company
- Activity, Communication, FollowUp
- LeadSource, Tag

Sales Module:
- Opportunity, PipelineStage
- Product, Service, PriceList
- Quotation, QuotationLine
- Contract, Order, OrderLine

Finance Module:
- Invoice, InvoiceLine, Payment
- Expense, ExpenseCategory
- Budget, BudgetLine
- JournalEntry, Account

Inventory Module:
- Product (shared with Sales), SKU, Warehouse
- StockLevel, StockMovement
- Supplier, PurchaseRequest, PurchaseOrder
- ReceivingRecord, ReorderRule

Projects Module:
- Project, Phase, Milestone, Deliverable
- Task, TaskAssignment, TimeEntry
- WorkflowTemplate, WorkflowInstance

HR Module:
- Employee, EmploymentRecord
- Assignment, Capacity
- Review, Goal

Support Module:
- Case, CaseNote, Resolution
- SLAPolicy, SLAEvent

BI/Analytics:
- MetricDefinition, Dashboard
- Report, ReportSchedule
- DataSnapshot, DataQualityLog

AI/ML:
- Model, ModelVersion, ModelEvaluation
- Prediction, Recommendation
- ActionProposal, ActionOutcome`
    },
    {
      id: '7.2',
      title: '7.2 Tenancy Model',
      content: `**Approach:** Shared database, shared schema, tenant_id column on all tenant-owned records.

**Rules:**
- Every tenant-owned table includes \`organization_id\` (UUID)
- Database row-level security (RLS) policies enforce tenant isolation
- Application-level middleware provides defense-in-depth
- Cross-tenant queries are architecturally impossible by design
- Platform tables (organizations, subscriptions) are separate from tenant tables

**Tenant-Scoped Tables Pattern:**
\`\`\`sql
-- Every tenant-owned table follows this pattern:
CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  -- business fields...
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ -- soft delete
);

-- RLS policy
CREATE POLICY tenant_isolation ON example
  USING (organization_id = current_setting('app.current_tenant')::UUID);
\`\`\`

**Cross-Reference Rules:**
- No foreign keys between tenant-scoped and platform tables except organization_id
- No foreign keys between different tenants' records (enforced by RLS)
- Shared reference data (currencies, countries) is platform-scoped and read-only`
    },
    {
      id: '7.3',
      title: '7.3 Data Integrity Requirements',
      content: `**Referential Integrity:**
- Foreign keys enforced at database level
- Cascade rules defined per relationship (restrict, cascade, set null)
- Orphan records prevented by design

**Business Integrity:**
- Financial records immutable after posting (append-only with corrections)
- State machines enforced at application and database level
- Approval states cannot be bypassed
- Audit trail records cannot be modified or deleted

**Data Quality:**
- Required fields enforced at database level (NOT NULL)
- Enum values constrained (CHECK constraints or enum types)
- Date ranges validated (end >= start)
- Monetary values use appropriate precision (DECIMAL, not FLOAT)
- Unique constraints where business rules require them

**Soft Delete Policy:**
- Most records use soft delete (deleted_at timestamp)
- Hard delete only for specific cases (GDPR right to erasure)
- Soft-deleted records excluded from normal queries
- Retention policies determine when soft-deleted records are purged

**Concurrency Control:**
- Optimistic locking with version columns where needed
- Last-write-wins for non-critical concurrent updates
- Pessimistic locking for financial transactions
- Conflict resolution rules defined per entity type`
    },
    {
      id: '7.4',
      title: '7.4 Data Ownership Matrix',
      content: `**Module Data Ownership:**

| Entity | Owner Module | Referenced By |
|--------|-------------|---------------|
| Organization | Platform | All modules |
| User | Organization | All modules |
| Role/Permission | Organization | All modules |
| Lead/Contact | CRM | Sales, Marketing, Support |
| Opportunity | Sales | Finance (revenue) |
| Product | Shared (Sales+Inventory) | Sales, Inventory, Projects |
| Invoice | Finance | Sales (reference) |
| StockLevel | Inventory | Sales (availability) |
| PurchaseOrder | Inventory | Finance (payables) |
| Project | Projects | Finance (budget), HR (resources) |
| Employee | HR | Projects (assignments) |
| Case | Support | CRM (customer) |
| MetricDefinition | BI | AI/ML (features) |
| Model | AI/ML | Inference Engine |
| Recommendation | Inference | All modules (actions) |

**Shared Entity Rules:**
- Product entity is co-owned by Sales and Inventory
- A designated "owner" module handles creation
- Other modules reference but don't modify core attributes
- Module-specific extensions stored in module-owned tables`
    },
    {
      id: '7.5',
      title: '7.5 Migration Principles',
      content: `**Migration Rules:**
- All schema changes through versioned migrations
- No manual database modifications in any environment
- Migrations must be reversible (include down migration)
- Migrations reviewed before merging to main branch
- No data loss in any migration
- Large migrations split into safe incremental steps

**Migration Safety:**
- Backward-compatible changes only (add columns, don't rename)
- Multi-step migrations for breaking changes:
  1. Add new column/table
  2. Backfill data
  3. Update application code
  4. Remove old column/table (in subsequent release)
- Lock-time considerations for large table alterations
- Test migrations against production-sized data before deployment

**Migration Categories:**
- Schema migrations: Table/column/index changes
- Data migrations: Data transformation or backfill
- Permission migrations: Role/permission updates
- Configuration migrations: Default settings updates

**Version Control:**
- Migration files committed to repository
- Migration order is deterministic
- Migration history tracked in database
- Rollback procedures documented for each migration`
    },
    {
      id: '7.6',
      title: '7.6 Indexing and Performance Strategy',
      content: `**Indexing Principles:**
- Primary keys always indexed (automatic)
- Foreign keys indexed for join performance
- Composite indexes for common query patterns
- Partial indexes for filtered queries (e.g., active records only)
- Full-text search indexes for search-enabled fields

**Performance Considerations:**
- Query analysis before adding indexes (avoid over-indexing)
- Monitor slow queries in production
- Consider read replicas for analytics workloads
- Partitioning strategy for high-volume tables (audit logs, events)
- Materialized views for complex aggregations (refresh strategy needed)

**Analytics Data Strategy:**
- Separate analytics schema or database for heavy queries
- ETL process from operational to analytics storage
- Pre-aggregated tables for common dashboard metrics
- Data freshness indicators on all analytics outputs
- Query timeout limits to prevent resource exhaustion`
    }
  ]
};

export const doc8: Document = {
  id: 'ai-ml-spec',
  number: 8,
  title: 'AI/ML and Inference Specification',
  shortTitle: 'AI/ML & Inference',
  description: 'Analytics, ML, inference, decision intelligence, data requirements, evaluation and monitoring.',
  status: 'Recorded',
  sections: [
    {
      id: '8.1',
      title: '8.1 Analytics Foundation',
      content: `**Descriptive Analytics (What is happening):**
- Real-time operational metrics from business modules
- Historical trend analysis with configurable time windows
- Comparative analysis (period-over-period, segment comparison)
- Distribution analysis and outlier identification
- Data quality indicators on all metrics

**Metric Definition Standards:**
- Every metric has a unique, versioned definition
- Calculation logic is documented and auditable
- Data sources explicitly declared
- Update frequency specified (real-time, hourly, daily)
- Permission requirements for access defined
- Drill-down paths documented

**Data Quality Requirements:**
- Completeness: Percentage of expected data present
- Timeliness: Age of most recent data point
- Accuracy: Validation rules and reconciliation checks
- Consistency: Same metric produces same result regardless of access path
- All quality dimensions displayed alongside metrics`
    },
    {
      id: '8.2',
      title: '8.2 Machine Learning Architecture',
      content: `**ML Lifecycle:**
\`\`\`
Data Collection → Feature Engineering → Training → Evaluation → Deployment → Monitoring → Feedback
\`\`\`

**Data and Feature Engineering:**
- Versioned datasets with lineage tracking
- Feature definitions stored as code (reproducible)
- Data validation before feature computation
- Historical window management (training vs. serving consistency)
- Label definitions documented per prediction task
- Data leakage prevention (temporal splits, proper cross-validation)
- Feature store for shared feature computation

**Model Training and Evaluation:**
- Baseline model required before advanced models
- Appropriate training methods per task type
- Validation dataset separate from training data
- Performance metrics relevant to business objective
- Calibration assessment for probability predictions
- Bias evaluation across relevant segments
- Model versioning with full experiment tracking
- Deployment criteria defined before training begins

**Model Types (Where Data Supports):**
- Revenue/sales forecasting (time series)
- Demand prediction (regression/classification)
- Lead scoring (classification)
- Customer churn prediction (classification)
- Anomaly detection (unsupervised/supervised)
- Cash flow forecasting (time series)
- Stock optimization (optimization)
- Text classification for support cases (NLP)

**Principle:** Not every problem requires ML. Use deterministic rules or descriptive analytics where they are more reliable and interpretable.`
    },
    {
      id: '8.3',
      title: '8.3 Model Serving and Inference',
      content: `**Serving Architecture:**
- Dedicated inference service (Python/FastAPI)
- Model version registry with metadata
- Input validation before inference
- Structured response format with confidence/uncertainty
- Timeout and circuit-breaker protections
- Request/response logging (with PII protection)
- Horizontal scaling for load management

**Inference Request/Response:**
\`\`\`typescript
// Request
interface InferenceRequest {
  modelId: string;
  modelVersion: string;
  inputs: Record<string, unknown>;
  context: {
    organizationId: string;
    userId: string;
    timestamp: string;
  };
}

// Response
interface InferenceResponse {
  prediction: unknown;
  confidence: number; // 0-1
  uncertaintyRange?: { lower: number; upper: number };
  featureImportance?: Record<string, number>;
  dataFreshness: {
    latestDataPoint: string;
    dataCompleteness: number;
  };
  modelMetadata: {
    version: string;
    trainedOn: string;
    evaluationMetrics: Record<string, number>;
  };
  warnings: string[];
}
\`\`\`

**Authorization:**
- Model access controlled per organization
- Input data validated against tenant scope
- Output data scoped to requesting user's permissions
- Inference requests logged for audit`
    },
    {
      id: '8.4',
      title: '8.4 Inference Intelligence Engine',
      content: `**Purpose:** Orchestrate data retrieval, analytical tools, business rules, model predictions and AI reasoning to generate actionable recommendations.

**Engine Components:**
1. Data Retrieval Layer: Authorized access to operational and analytics data
2. Analytical Tools: Statistical analysis, trend detection, correlation analysis
3. Business Rules Engine: Deterministic rules and constraints
4. Model Integration: Authorized model predictions with uncertainty
5. Reasoning Layer: Evidence synthesis and explanation generation
6. Recommendation Generator: Action proposals with expected outcomes
7. Approval Gateway: Human-in-the-loop for action authorization

**Execution Flow:**
\`\`\`
1. Trigger (scheduled, event-driven, or user-initiated)
2. Context Assembly (gather relevant data within authorization)
3. Analysis Execution (run applicable tools and models)
4. Rule Evaluation (apply business constraints)
5. Recommendation Synthesis (combine evidence into proposals)
6. Uncertainty Assessment (quantify confidence levels)
7. Presentation (show to authorized users with full evidence)
8. Approval/Rejection (human decision)
9. Action Execution (only approved actions, only permitted operations)
10. Outcome Measurement (track actual results)
11. Feedback Loop (improve future recommendations)
\`\`\`

**Safety Controls:**
- No recommendation without cited evidence
- No action execution without explicit approval
- Uncertainty always disclosed
- Conflicting evidence surfaced, not hidden
- Recommendations can be traced to source data and models
- Engine cannot access data outside user's authorization scope`
    },
    {
      id: '8.5',
      title: '8.5 Decision Intelligence Layer',
      content: `**Purpose:** Evaluate business goals, constraints, possible actions, expected effects and approval requirements to support optimal decision-making.

**Decision Framework:**
- Objective definition: What is the business trying to achieve?
- Constraint identification: What limits exist (budget, time, resources, regulations)?
- Option generation: What actions are possible?
- Impact estimation: What is the expected effect of each option?
- Risk assessment: What could go wrong? What is the uncertainty?
- Recommendation: Which option best serves the objective given constraints?
- Approval routing: Who needs to approve this decision?

**Decision Types:**
- Strategic: Long-term direction, resource allocation (high approval)
- Tactical: Medium-term planning, process optimization (medium approval)
- Operational: Day-to-day execution, routine decisions (low/no approval)

**Decision Support:**
- Evidence presentation (not just conclusions)
- Alternative scenarios with assumptions stated
- Sensitivity analysis (how robust is the recommendation?)
- Historical precedent (what happened in similar situations?)
- Confidence levels clearly communicated

**Constraint:** The system recommends; humans decide. No automated execution of strategic or high-impact decisions.`
    },
    {
      id: '8.6',
      title: '8.6 Monitoring and Feedback',
      content: `**Model Monitoring:**
- Prediction accuracy over time (drift detection)
- Input data distribution monitoring (data drift)
- Feature importance stability
- Prediction confidence distribution
- Latency and throughput metrics
- Error rate tracking

**Recommendation Monitoring:**
- Acceptance rate (how often are recommendations approved?)
- Action completion rate (are approved actions executed?)
- Outcome measurement (did the action produce expected results?)
- User feedback collection
- False positive/negative tracking where measurable

**Feedback Loop:**
\`\`\`
Prediction → Action → Outcome → Comparison → Learning
\`\`\`

- Compare predicted outcomes with actual outcomes
- Identify systematic prediction errors
- Trigger model retraining when performance degrades
- Update business rules based on observed patterns
- Improve recommendation quality over time

**Alerting:**
- Model performance below threshold
- Data quality degradation
- Unusual prediction patterns
- Recommendation acceptance rate anomaly
- System errors or timeouts

**Reporting:**
- Model performance dashboard per model
- Recommendation effectiveness summary
- Data quality scorecard
- AI value delivered (outcome improvements where measurable)`
    }
  ]
};
