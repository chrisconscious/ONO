import { Document } from './types';

export const archDoc4: Document = {
  id: 'module-dependency-map',
  number: 4,
  title: 'Module Dependency Map',
  shortTitle: 'Module Dependencies',
  description: 'Domain ownership, dependencies, allowed interactions and circular-dependency risks.',
  status: 'Recorded',
  stage: 2,
  sections: [
    {
      id: 'MDM-1',
      title: '1. Module Ownership Matrix',
      content: `**Domain Entity Ownership:**

| Domain Entity | Owning Module | Referenced By |
|--------------|---------------|---------------|
| Organization | Organization & Admin | ALL modules |
| Branch | Organization & Admin | ALL modules |
| Department | Organization & Admin | ALL modules |
| User | Organization & Admin | ALL modules |
| Role/Permission | Organization & Admin | ALL modules |
| Lead | CRM | Sales, Marketing |
| Contact | CRM | Sales, Support, Finance |
| Company | CRM | Sales, Support, Finance |
| Opportunity | Sales | Finance (revenue) |
| Quotation | Sales | Finance (invoicing) |
| Order | Sales | Inventory, Finance |
| Product | Shared (Sales + Inventory) | All commercial modules |
| Invoice | Finance | Sales (reference) |
| Payment | Finance | Sales, Inventory |
| Expense | Finance | Projects (cost tracking) |
| Stock Level | Inventory | Sales (availability) |
| Purchase Order | Inventory | Finance (payables) |
| Supplier | Inventory | Finance |
| Project | Projects | Finance (budget), HR |
| Task | Projects | HR (assignments) |
| Employee | HR | Projects (resources) |
| Support Case | Support | CRM (customer) |
| Document | Documents | ALL modules |
| Metric Definition | Business Intelligence | AI/ML |
| Dashboard | Business Intelligence | ALL (read) |
| ML Model | AI/ML Services | Inference Engine |
| Prediction | AI/ML Services | Decision Intelligence |
| Recommendation | Inference Engine | ALL (actions) |
| Integration Config | SaaS Admin | ALL (connectors) |

**Shared Entity Rules:**
- Product is co-owned: Sales owns catalogue/pricing, Inventory owns stock/warehousing
- Designated owner handles creation; others reference via ID
- Module-specific extensions stored in module-owned tables (e.g., product_stock_details)`
    },
    {
      id: 'MDM-2',
      title: '2. Dependency Diagram',
      content: `**Dependency Flow (simplified):**
\`\`\`
Organization & Admin (Foundation)
├── CRM
│   ├── Sales
│   │   ├── Finance
│   │   └── Inventory (stock checks)
│   ├── Marketing
│   └── Support
├── Finance
│   └── Inventory (procurement payments)
├── Inventory & Procurement
│   ├── Finance (AP/AR)
│   └── Sales (stock availability)
├── Projects & Operations
│   ├── Finance (project budgets)
│   ├── HR (resource assignments)
│   └── Inventory (material requisitions)
├── HR / Workforce
│   └── Projects (capacity planning)
├── Documents (shared service)
├── Strategy & KPIs
│   └── Business Intelligence
└── Business Intelligence
    ├── AI/ML (features)
    └── Inference Engine (context)

Cross-cutting (all modules depend on):
- Authorization Service
- Audit Service
- Notification Service
- Background Jobs
- File Storage
\`\`\`

**Dependency Rules:**
- Dependencies flow downward (foundation → business → intelligence)
- No circular dependencies between business modules
- Cross-cutting services are depended upon by all, but depend on none
- Intelligence layer consumes from business modules but does not modify their data directly`
    },
    {
      id: 'MDM-3',
      title: '3. Allowed Interactions',
      content: `**Interaction Patterns:**

**1. Direct Function Calls (within modular monolith):**
- Module A calls Module B's public API
- Module B's internal implementation is hidden
- Return types are strongly typed
- Example: Sales module calls Inventory module to check stock availability

**2. Event-Driven Communication:**
- Module A publishes domain event
- Module B subscribes and reacts
- Asynchronous, eventually consistent
- Example: Order placed → Inventory reserves stock → Finance records receivable

**3. Shared Database Queries (read-only):**
- Module reads from another module's tables for reporting
- No direct writes to another module's tables
- Access controlled by authorization layer
- Example: BI module reads from all modules for dashboard calculations

**4. API Contracts (for future service extraction):**
- Modules expose typed interfaces
- Can be converted to REST APIs when extracted
- Version-controlled contracts
- Example: Inventory module exposes StockService interface

**Prohibited Interactions:**
- Direct database writes to another module's tables
- Bypassing authorization checks
- Accessing another module's internal state
- Circular synchronous calls (A calls B calls A)`
    },
    {
      id: 'MDM-4',
      title: '4. Circular Dependency Prevention',
      content: `**Identified Risks:**

**Risk 1: Sales ↔ Inventory**
- Sales needs stock availability from Inventory
- Inventory needs demand signals from Sales
- **Resolution:** Unidirectional dependency. Sales queries Inventory (read-only). Inventory consumes demand events from Sales (async).

**Risk 2: Finance ↔ All Commercial Modules**
- Finance needs transaction data from Sales, Inventory, Projects
- Commercial modules need financial status (payment confirmed, budget available)
- **Resolution:** Commercial modules publish events. Finance consumes events and publishes payment/budget status events back. No direct circular calls.

**Risk 3: Projects ↔ HR**
- Projects needs resource availability from HR
- HR needs project assignments for capacity planning
- **Resolution:** HR owns employee records and capacity. Projects publishes assignment requests. HR confirms or rejects. Projects records confirmed assignments.

**Prevention Strategy:**
- Dependency direction rules enforced in code review
- Architecture tests verify no circular imports
- Event-driven communication for bidirectional information flow
- Clear ownership: one module is authoritative per entity`
    },
    {
      id: 'MDM-5',
      title: '5. Cross-Cutting Service Dependencies',
      content: `**Services ALL modules depend on:**

**Authorization Service:**
- Every module checks permissions before operations
- Provides: canUser(action, resource, scope)
- Dependency: Unidirectional (modules → auth service)

**Audit Service:**
- Every module records significant operations
- Provides: recordEvent(actor, action, resource, changes)
- Dependency: Unidirectional (modules → audit service)
- Implementation: Event-driven (modules publish, audit service persists)

**Notification Service:**
- Modules trigger notifications based on business events
- Provides: sendNotification(recipient, type, content)
- Dependency: Unidirectional (modules → notification service)
- Implementation: Async (queued for delivery)

**File Storage Service:**
- Modules upload and reference files
- Provides: upload(file, scope), getUrl(fileId), delete(fileId)
- Dependency: Unidirectional (modules → file service)
- Tenant-scoped storage paths

**Background Job Service:**
- Modules schedule async work
- Provides: schedule(jobType, payload, options)
- Dependency: Unidirectional (modules → job service)
- Implementation: Message queue or scheduled task runner

**Search Service:**
- Modules index searchable content
- Provides: index(document), search(query, scope)
- Dependency: Unidirectional (modules → search service)
- Tenant-scoped search indexes`
    }
  ]
};

export const archDoc5: Document = {
  id: 'api-event-contracts',
  number: 5,
  title: 'API and Event Contracts',
  shortTitle: 'API & Events',
  description: 'API standards, event conventions and cross-component communication requirements.',
  status: 'Recorded',
  stage: 2,
  sections: [
    {
      id: 'AEC-1',
      title: '1. API Design Standards',
      content: `**URL Conventions:**
- Resource-based URLs: \`/api/v1/leads\`, \`/api/v1/opportunities\`
- Nested resources: \`/api/v1/contacts/:id/activities\`
- Actions (non-CRUD): \`/api/v1/leads/:id/convert\`
- Consistent plural nouns for collections

**HTTP Methods:**
- GET: Retrieve resource(s)
- POST: Create new resource
- PUT: Full update (replace)
- PATCH: Partial update
- DELETE: Remove resource (soft delete)

**Request/Response Format:**
\`\`\`typescript
// Success response
interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasNext?: boolean;
  };
}

// Error response
interface ApiError {
  error: {
    code: string;          // Machine-readable error code
    message: string;       // Human-readable message
    details?: unknown;     // Additional context (validation errors, etc.)
    requestId: string;     // For support/debugging
  };
}
\`\`\`

**Pagination:**
- Cursor-based for large datasets (preferred)
- Offset-based for simple cases
- Parameters: \`page\`, \`pageSize\`, \`cursor\`, \`limit\`
- Response includes: \`totalCount\`, \`hasNextPage\`, \`nextCursor\`

**Filtering and Sorting:**
- Query parameters: \`?status=active&createdAfter=2024-01-01\`
- Sorting: \`?sort=createdAt&order=desc\`
- Search: \`?q=search+term\`
- Field selection: \`?fields=id,name,email\`

**Versioning:**
- URL versioning: \`/api/v1/...\`
- Backward-compatible changes don't require version bump
- Breaking changes require new version
- Deprecation period for old versions`
    },
    {
      id: 'AEC-2',
      title: '2. Authentication and Authorization in APIs',
      content: `**Authentication:**
- Session-based authentication (httpOnly cookies)
- CSRF tokens for state-changing operations
- API keys for external integrations (scoped, revocable)
- OAuth 2.0 for third-party access (future)

**Authorization Enforcement:**
\`\`\`typescript
// Every API route must:
1. Verify authentication (session valid)
2. Extract tenant context (organization_id)
3. Check permission (canUser(action, resource))
4. Apply data scope (filter by accessible records)
5. Execute business logic
6. Return authorized data only
\`\`\`

**Tenant Context:**
- Extracted from session on every request
- Set as database context (for RLS)
- Passed to all service calls
- Never trust client-provided tenant ID

**Permission Checks:**
- Checked at route level (middleware)
- Checked at service level (defense-in-depth)
- Checked at database level (RLS)
- All checks logged for audit

**Rate Limiting:**
- Per-user: Prevent abuse
- Per-tenant: Fair usage
- Per-endpoint: Protect expensive operations
- Returns 429 with retry-after header`
    },
    {
      id: 'AEC-3',
      title: '3. Event Contract Standards',
      content: `**Event Structure:**
\`\`\`typescript
interface DomainEvent {
  eventId: string;           // UUID, unique
  eventType: string;         // e.g., 'lead.created', 'order.confirmed'
  timestamp: string;         // ISO 8601
  organizationId: string;    // Tenant context
  actor: {
    userId: string;
    userType: 'user' | 'system' | 'integration';
  };
  aggregate: {
    type: string;            // e.g., 'Lead', 'Order'
    id: string;              // Entity ID
  };
  payload: Record<string, unknown>;  // Event-specific data
  metadata: {
    correlationId: string;   // Trace across operations
    causationId?: string;    // What caused this event
    version: string;         // Event schema version
  };
}
\`\`\`

**Event Naming Convention:**
- Format: \`{aggregate}.{action}\`
- Examples: \`lead.created\`, \`opportunity.stageChanged\`, \`order.confirmed\`
- Past tense for completed actions
- Camel case for actions

**Event Categories:**

**CRM Events:**
- \`lead.created\`, \`lead.qualified\`, \`lead.converted\`, \`lead.rejected\`
- \`contact.created\`, \`contact.updated\`
- \`activity.logged\`

**Sales Events:**
- \`opportunity.created\`, \`opportunity.stageChanged\`, \`opportunity.won\`, \`opportunity.lost\`
- \`quotation.created\`, \`quotation.approved\`, \`quotation.sent\`, \`quotation.accepted\`
- \`order.confirmed\`, \`order.fulfilled\`, \`order.cancelled\`

**Finance Events:**
- \`invoice.created\`, \`invoice.sent\`, \`invoice.paid\`, \`invoice.overdue\`
- \`payment.recorded\`, \`payment.failed\`
- \`expense.submitted\`, \`expense.approved\`, \`expense.rejected\`

**Inventory Events:**
- \`stock.received\`, \`stock.adjusted\`, \`stock.reserved\`, \`stock.depleted\`
- \`purchaseOrder.created\`, \`purchaseOrder.received\`, \`purchaseOrder.closed\`

**Projects Events:**
- \`project.created\`, \`project.completed\`
- \`task.assigned\`, \`task.completed\`
- \`milestone.reached\`

**Support Events:**
- \`case.created\`, \`case.assigned\`, \`case.resolved\`, \`case.closed\`
- \`sla.breached\`, \`sla.met\`

**Delivery Guarantees:**
- At-least-once delivery (consumers must be idempotent)
- Events stored in database before publishing (outbox pattern)
- Consumers track processed event IDs to handle duplicates
- Failed deliveries retried with exponential backoff
- Dead-letter queue for permanently failed events`
    },
    {
      id: 'AEC-4',
      title: '4. Frontend/Backend Contracts',
      content: `**Data Fetching:**
- Server Components: Direct database access for initial page load
- Client Components: Fetch from API routes
- React Query: Caching, background refetching, optimistic updates
- Server Actions: Form submissions, mutations

**Form Validation:**
- Zod schemas defined once, shared between frontend and backend
- Frontend: Client-side validation for immediate feedback
- Backend: Server-side validation (authoritative)
- Error messages: Structured, field-specific, translatable

**Optimistic Updates:**
- UI updates immediately on user action
- Server confirms or rejects
- Rollback on failure with user notification
- Used for: Status changes, simple edits

**Permission-Aware UI:**
- Frontend checks permissions before rendering actions
- Backend re-checks permissions on every request
- Hidden buttons for unauthorized actions
- "Request access" option where applicable
- No broken layouts for restricted users

**Loading and Error States:**
- Skeleton loaders for initial load
- Spinners for actions
- Error boundaries with retry option
- Toast notifications for transient errors
- Inline errors for form validation

**Real-time Updates:**
- Server-Sent Events for notifications
- WebSocket for collaborative features (future)
- Polling as fallback
- Optimistic UI with server reconciliation`
    },
    {
      id: 'AEC-5',
      title: '5. Business Intelligence Contracts',
      content: `**Metric Definition Contract:**
\`\`\`typescript
interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  formula: string;           // Human-readable calculation
  implementation: {
    sourceTables: string[];
    filters: Record<string, unknown>;
    aggregation: 'sum' | 'count' | 'average' | 'min' | 'max';
    groupBy?: string[];
  };
  dataSources: string[];     // Module names
  updateFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  permissions: {
    view: string[];          // Role names
    export: string[];
  };
  version: string;
  lastUpdated: string;
}
\`\`\`

**Dashboard Data Contract:**
\`\`\`typescript
interface DashboardDataRequest {
  dashboardId: string;
  dateRange: { start: string; end: string };
  filters: Record<string, unknown>;
  organizationId: string;
  userId: string;            // For permission checks
}

interface DashboardDataResponse {
  widgets: Array<{
    widgetId: string;
    metricId: string;
    value: number | null;
    comparison?: {
      previousValue: number | null;
      change: number;        // Percentage
      trend: 'up' | 'down' | 'stable';
    };
    dataQuality: {
      completeness: number;  // 0-1
      freshness: string;     // ISO timestamp
      lastUpdated: string;
    };
  }>;
  metadata: {
    generatedAt: string;
    cacheHit: boolean;
    executionTime: number;   // milliseconds
  };
}
\`\`\`

**Data Quality Indicators:**
- Every metric includes data quality metadata
- Completeness: Percentage of expected data present
- Freshness: Age of most recent data point
- Source: Which modules contributed data
- Warnings: Any data quality issues detected

**Drill-Down Contract:**
- Metrics support drill-down to underlying records
- Drill-down paths defined in metric definition
- Authorization re-checked on drill-down
- Example: Revenue metric → drill to invoices → drill to invoice lines`
    },
    {
      id: 'AEC-6',
      title: '6. ML/Inference Contracts',
      content: `**Training Data Contract:**
\`\`\`typescript
interface TrainingDataRequest {
  datasetId: string;
  version: string;
  organizationId: string;
  features: string[];
  target: string;
  timeRange: { start: string; end: string };
  filters: Record<string, unknown>;
}

interface TrainingDataResponse {
  dataUrl: string;           // Signed URL to data file
  schema: Record<string, string>;
  rowCount: number;
  featureStats: Record<string, {
    mean: number;
    std: number;
    min: number;
    max: number;
    missing: number;
  }>;
}
\`\`\`

**Inference Request Contract:**
\`\`\`typescript
interface InferenceRequest {
  modelId: string;
  modelVersion: string;
  inputs: Record<string, unknown>;
  context: {
    organizationId: string;
    userId: string;
    timestamp: string;
    requestId: string;       // For tracing
  };
}
\`\`\`

**Inference Response Contract:**
\`\`\`typescript
interface InferenceResponse {
  prediction: unknown;       // Type depends on model
  confidence: number;        // 0-1
  uncertaintyRange?: {
    lower: number;
    upper: number;
  };
  featureImportance?: Record<string, number>;
  dataFreshness: {
    latestDataPoint: string;
    completeness: number;
  };
  modelMetadata: {
    version: string;
    trainedOn: string;
    evaluationMetrics: Record<string, number>;
  };
  warnings: string[];
  processingTime: number;    // milliseconds
}
\`\`\`

**Model Registry Contract:**
\`\`\`typescript
interface ModelVersion {
  modelId: string;
  version: string;
  status: 'training' | 'evaluating' | 'approved' | 'deployed' | 'deprecated';
  artifactUrl: string;
  trainingConfig: Record<string, unknown>;
  evaluationResults: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    rmse?: number;
    custom: Record<string, number>;
  };
  deploymentCriteria: {
    minAccuracy?: number;
    maxLatency?: number;
    // ... other criteria
  };
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
}
\`\`\`

**Communication Protocol:**
- REST APIs for inference requests (synchronous)
- Message queue for batch predictions (asynchronous)
- Shared object storage for model artifacts and datasets
- Authentication: Service-to-service tokens with limited scope`
    }
  ]
};

export const archDoc6: Document = {
  id: 'data-architecture',
  number: 6,
  title: 'Data Architecture Plan',
  shortTitle: 'Data Architecture',
  description: 'Data domains, ownership, relationships, lineage and lifecycle principles.',
  status: 'Recorded',
  stage: 2,
  sections: [
    {
      id: 'DA-1',
      title: '1. Data Domain Classification',
      content: `**Operational Data (Transactional):**
- Business entities: Leads, Contacts, Opportunities, Orders, Invoices, etc.
- Characteristics: High write volume, ACID requirements, immediate consistency
- Storage: PostgreSQL operational schema
- Retention: Active records + configurable archive period

**Derived Analytics Data:**
- Aggregated metrics, trends, comparisons
- Characteristics: Read-heavy, pre-computed, eventually consistent
- Storage: PostgreSQL analytics schema (separate from operational)
- Retention: Configurable history window

**Training Datasets:**
- Historical data prepared for ML training
- Characteristics: Immutable snapshots, versioned, large volume
- Storage: Object storage (Parquet/CSV files)
- Retention: Versioned, governed by data policy

**Model Artifacts:**
- Trained model files, metadata, evaluation results
- Characteristics: Binary files, versioned, moderate size
- Storage: Object storage with metadata in database
- Retention: Until explicitly deprecated and removed

**Inference Results:**
- Predictions, recommendations, decisions
- Characteristics: Append-only, linked to source data, auditable
- Storage: PostgreSQL (inference schema)
- Retention: Linked to business record lifecycle

**Audit and Event Data:**
- Immutable log of all significant operations
- Characteristics: Append-only, high volume, compressed over time
- Storage: PostgreSQL audit schema → archive to object storage
- Retention: Minimum 7 years (configurable per jurisdiction)

**Configuration Data:**
- Tenant settings, module configuration, industry profiles
- Characteristics: Low volume, high read, occasional writes
- Storage: PostgreSQL configuration schema
- Retention: Active + version history`
    },
    {
      id: 'DA-2',
      title: '2. Data Ownership and Boundaries',
      content: `**Ownership Rules:**
- Each module owns its primary entities
- Owned entities: Module creates, updates, deletes
- Referenced entities: Other modules read via ID, don't modify
- Shared entities: Designated owner, others extend via related tables

**Ownership Map:**

| Data Domain | Owner Module | Write Access | Read Access |
|------------|--------------|--------------|-------------|
| Organization structure | Organization | Org Admin | All (scoped) |
| Users & Auth | Organization | Org Admin | All (scoped) |
| Leads & Contacts | CRM | CRM users | Sales, Support (scoped) |
| Opportunities | Sales | Sales users | Finance (revenue data) |
| Products (catalogue) | Sales | Sales users | Inventory, Projects |
| Products (stock) | Inventory | Inventory users | Sales (availability) |
| Invoices & Payments | Finance | Finance users | Sales (status) |
| Purchase Orders | Inventory | Inventory users | Finance (payables) |
| Projects & Tasks | Projects | Project users | Finance (costs), HR |
| Employee Records | HR | HR users | Projects (assignments) |
| Support Cases | Support | Support users | CRM (customer) |
| Documents | Documents | All (scoped) | All (scoped) |
| Metrics & Dashboards | BI | BI Admin | All (scoped) |
| ML Models | AI/ML | ML Engineers | Inference Engine |
| Recommendations | Inference | System | Authorized users |

**Cross-Module Data Access:**
- Read access: Via typed service interfaces or direct queries (read-only)
- Write access: Only to owned entities
- Events: For notifying other modules of changes
- Authorization: All access checked against user permissions`
    },
    {
      id: 'DA-3',
      title: '3. Data Relationships and Integrity',
      content: `**Relationship Types:**

**Strong References (Foreign Keys):**
- Enforced at database level
- Prevent orphaned records
- Example: Invoice → Customer (customer_id FK)
- Cascade rules: Restrict (default), Cascade, Set Null (explicit)

**Weak References (ID fields without FK):**
- Used for optional or cross-tenant references
- Application-level validation
- Example: Activity → Related Record (polymorphic)
- Use case: Flexible associations, audit trails

**Many-to-Many (Join Tables):**
- Explicit join tables with metadata
- Example: User ↔ Role (user_roles join table with assigned_at)
- Allows tracking relationship metadata

**Polymorphic Associations:**
- Used sparingly, with explicit type field
- Example: Document → Attachable (attachable_type, attachable_id)
- Application-level integrity checks

**Data Integrity Rules:**
- Required fields: NOT NULL constraints
- Unique constraints: Where business rules require
- Check constraints: Value ranges, enum validation
- Default values: Sensible defaults where appropriate
- Soft deletes: deleted_at timestamp, excluded from normal queries

**Referential Integrity Strategy:**
- Foreign keys for core relationships
- Application-level validation for complex rules
- Database triggers for audit columns (created_at, updated_at)
- Cascading deletes only where explicitly appropriate`
    },
    {
      id: 'DA-4',
      title: '4. Data Lineage and Traceability',
      content: `**Lineage Requirements:**
- Every metric traces to source data
- Every prediction traces to input data and model version
- Every recommendation traces to evidence and analysis
- Every derived value traces to calculation logic

**Lineage Tracking:**

**Operational → Analytics:**
- ETL processes documented with source → target mapping
- Transformation logic versioned and tested
- Data quality checks at each stage
- Freshness timestamps on all derived data

**Analytics → Predictions:**
- Model training data versioned with lineage metadata
- Feature engineering logic documented and reproducible
- Model inputs traced to source features
- Prediction outputs linked to input snapshot

**Predictions → Recommendations:**
- Recommendation logic documented
- Evidence sources cited
- Model predictions referenced with version
- Business rules applied traced to rule definitions

**Recommendations → Actions → Outcomes:**
- Approved recommendations linked to executed actions
- Action outcomes measured and recorded
- Comparison: Predicted vs. actual outcome
- Feedback loop: Outcome informs future recommendations

**Traceability Implementation:**
- Lineage metadata stored with each derived artifact
- Queryable lineage API for debugging and auditing
- Visual lineage diagrams in admin interface
- Automated lineage validation in CI/CD`
    },
    {
      id: 'DA-5',
      title: '5. Data Lifecycle Management',
      content: `**Lifecycle Stages:**

**1. Creation:**
- Validated at input (API validation)
- Constrained at database (NOT NULL, FK, CHECK)
- Audited on creation (who, when, what)
- Tenant-scoped immediately

**2. Active Use:**
- Regular reads and updates
- Permission-checked on every access
- Updated with audit trail
- Indexed for query performance

**3. Archival:**
- Moved to archive schema/storage after configurable period
- Still accessible but slower
- Reduced indexing for space efficiency
- Retains full audit trail

**4. Deletion:**
- Soft delete first (deleted_at timestamp)
- Hard delete only for legal requirements (GDPR erasure)
- Hard delete requires special authorization
- Deletion logged immutably
- Cascading deletes handled explicitly

**Retention Policies:**
- Operational data: Configurable per tenant (default 3 years active, 7 years archived)
- Audit data: Minimum 7 years (legal requirement in many jurisdictions)
- Analytics data: Configurable history window (default 5 years)
- Training data: Versioned, retained per data governance policy
- Model artifacts: Retained until explicitly deprecated

**Data Correction:**
- Corrections create new version, not overwrite
- Original values preserved in audit trail
- Correction reason required
- Correction authorized per sensitivity level

**Data Export:**
- Standard formats: CSV, JSON, PDF (for reports)
- Tenant-scoped exports only
- Authorization required for bulk exports
- Export logged for audit
- Rate-limited to prevent abuse`
    },
    {
      id: 'DA-6',
      title: '6. Data Security Classification',
      content: `**Classification Levels:**

**Public:**
- Examples: Product catalogue (if public), help documentation
- Protection: Standard access controls
- Encryption: TLS in transit, standard at rest

**Internal:**
- Examples: Employee directory, internal reports, operational metrics
- Protection: Authenticated access, tenant isolation
- Encryption: TLS in transit, standard at rest

**Confidential:**
- Examples: Customer data, financial records, contracts, pricing
- Protection: Role-based access, field-level security, audit logging
- Encryption: TLS in transit, encrypted at rest, field-level encryption for PII

**Highly Restricted:**
- Examples: Authentication credentials, API keys, encryption keys, health data (if applicable)
- Protection: Minimal access, explicit authorization, enhanced audit, secrets management
- Encryption: Encrypted at rest with separate key management, never logged

**Classification Enforcement:**
- Each data entity tagged with classification
- Access controls enforced per classification
- Encryption applied per classification
- Audit logging enhanced for higher classifications
- AI/ML access restricted per classification
- Export controls per classification

**Sensitive Data Handling:**
- PII identified and classified as Confidential minimum
- Financial data classified as Confidential minimum
- Credentials classified as Highly Restricted
- Health data (if applicable) classified as Highly Restricted
- Data masking in logs and error messages
- Secure deletion procedures for all classifications`
    }
  ]
};

export const archDoc7: Document = {
  id: 'tenancy-authorization',
  number: 7,
  title: 'Tenancy and Authorization Architecture',
  shortTitle: 'Tenancy & Auth',
  description: 'Tenant boundaries, authorization, roles, data scopes and isolation strategy.',
  status: 'Recorded',
  stage: 2,
  sections: [
    {
      id: 'TA-1',
      title: '1. Multi-Tenancy Architecture',
      content: `**Tenancy Model:** Shared database, shared schema, tenant_id column isolation.

**Isolation Layers:**

**Layer 1: Database Row-Level Security (RLS)**
\`\`\`sql
-- Enable RLS on all tenant-owned tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Only access records matching current tenant
CREATE POLICY tenant_isolation ON leads
  USING (organization_id = current_setting('app.current_tenant')::UUID);

-- Set tenant context per request
SET LOCAL app.current_tenant = :organizationId;
\`\`\`

**Layer 2: Application Middleware**
\`\`\`typescript
// Every API route
async function handler(req: Request) {
  // 1. Authenticate user
  const session = await authenticate(req);

  // 2. Extract tenant from session (never from client)
  const tenantId = session.organizationId;

  // 3. Set database context
  await db.setTenantContext(tenantId);

  // 4. Execute with tenant scope
  return await executeWithTenant(tenantId, () => {
    // All queries automatically scoped
  });
}
\`\`\`

**Layer 3: Service-Level Enforcement**
\`\`\`typescript
// Every service method
async function getLead(leadId: string, context: AuthContext) {
  // Explicit tenant check (defense-in-depth)
  const lead = await db.leads.findFirst({
    where: {
      id: leadId,
      organizationId: context.tenantId  // Explicit filter
    }
  });

  if (!lead) throw new NotFoundError();

  // Permission check
  if (!canUser(context.user, 'read', lead)) {
    throw new ForbiddenError();
  }

  return lead;
}
\`\`\`

**Tenant Context Flow:**
1. User authenticates → session includes tenantId
2. Request arrives → middleware extracts tenantId from session
3. Database context set → RLS policies active
4. Service calls → tenantId passed explicitly
5. All queries → filtered by tenantId
6. Response → only tenant's data returned

**Cross-Tenant Prevention:**
- No API accepts tenantId as parameter (always from session)
- No foreign keys between tenants
- No shared caches without tenant key
- No background jobs without tenant context
- Automated tests verify isolation`
    },
    {
      id: 'TA-2',
      title: '2. Authorization Model',
      content: `**Authorization Approach:** RBAC + ABAC + Data Scopes

**Role-Based Access Control (RBAC):**
\`\`\`typescript
// Role definition
interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;        // System roles can't be deleted
  isCustom: boolean;        // Custom roles created by org admin
}

// Permission definition
interface Permission {
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export';
  resource: string;         // e.g., 'lead', 'invoice', 'report'
  scope: 'own' | 'team' | 'department' | 'branch' | 'organization';
  conditions?: Record<string, unknown>;  // ABAC conditions
}
\`\`\`

**Attribute-Based Access Control (ABAC):**
\`\`\`typescript
// Additional conditions beyond role
interface AccessCheck {
  user: User;
  action: string;
  resource: Resource;
  environment: {
    time?: string;
    location?: string;
    deviceType?: string;
  };
}

// Example: Manager can approve expenses > $1000 only during business hours
function canApproveExpense(user: User, expense: Expense): boolean {
  return (
    hasPermission(user, 'approve', 'expense') &&
    expense.amount > 1000 ? isBusinessHours() : true
  );
}
\`\`\`

**Data Scope Enforcement:**
\`\`\`typescript
// Scope determines which records user can access
type DataScope = 'own' | 'team' | 'department' | 'branch' | 'organization';

function applyScope(query: Query, user: User, scope: DataScope) {
  switch (scope) {
    case 'own':
      return query.where({ createdById: user.id });
    case 'team':
      return query.where({ teamId: { in: user.teamIds } });
    case 'department':
      return query.where({ departmentId: { in: user.departmentIds } });
    case 'branch':
      return query.where({ branchId: { in: user.branchIds } });
    case 'organization':
      return query;  // Already filtered by tenant
  }
}
\`\`\`

**Authorization Evaluation:**
\`\`\`
canAccess(user, action, resource) =
  hasPermission(user.role, action, resource.type)
  AND isInScope(user.scope, resource)
  AND meetsConditions(user.attributes, resource.attributes)
  AND not isDeniedByPolicy(user, action, resource)
\`\`\``
    },
    {
      id: 'TA-3',
      title: '3. Multi-Role User Handling',
      content: `**Scenario:** User holds multiple roles (e.g., Sales Manager + Finance Approver)

**Permission Resolution:**
\`\`\`typescript
function resolvePermissions(user: User): ResolvedPermission[] {
  // Union of all role permissions
  const allPermissions = user.roles.flatMap(role => role.permissions);

  // For same resource+action, most permissive scope wins for READ
  // For same resource+action, most restrictive scope wins for WRITE/DELETE
  const resolved = groupBy(allPermissions, p => \`\${p.action}:\${p.resource}\`);

  return resolved.map((action, perms) => {
    if (action.startsWith('read')) {
      // Most permissive scope
      return { ...perms[0], scope: mostPermissiveScope(perms.map(p => p.scope)) };
    } else {
      // Most restrictive scope
      return { ...perms[0], scope: mostRestrictiveScope(perms.map(p => p.scope)) };
    }
  });
}
\`\`\`

**Approval Authority:**
- Approval permissions are NOT accumulated across roles
- User must have explicit approval permission in at least one role
- Self-approval prohibited regardless of role count
- Approval chains cannot be bypassed

**Conflict Resolution:**
- Deny always overrides Allow for security-critical operations
- Allow applies for read visibility (union of scopes)
- Approval requirements never bypassed by role accumulation
- Custom policies can define organization-specific rules

**Example:**
- User is Sales Rep (scope: own leads) + Sales Manager (scope: team leads)
- Resolved: Can read all team leads, can edit only own leads
- User is Accountant + Finance Manager
- Resolved: Can approve expenses (from Finance Manager role)
- User is all roles (small business owner)
- Resolved: Full access, but approval requirements still apply
- Self-approval still prohibited for financial transactions`
    },
    {
      id: 'TA-4',
      title: '4. Platform vs. Tenant Authorization',
      content: `**Platform Administration:**
- Manages: Infrastructure, tenant provisioning, subscriptions, platform settings
- Cannot: Access tenant business data by default
- Access to tenant data: Requires explicit tenant consent, time-limited, fully audited

**Platform Admin Permissions:**
\`\`\`typescript
interface PlatformPermission {
  action: 'manage_tenant' | 'view_platform_metrics' | 'manage_subscriptions';
  resource: 'platform';  // Not tenant resources
  scope: 'platform';
}

// Platform admin CANNOT:
- View tenant leads, contacts, financial data
- Modify tenant business records
- Access tenant files or documents
- View tenant analytics or dashboards

// Platform admin CAN:
- Create/suspend/delete tenants
- View platform-wide metrics (total tenants, usage, etc.)
- Manage subscriptions and billing
- Configure platform settings
- View platform audit logs
\`\`\`

**Support Access to Tenant Data:**
\`\`\`typescript
// When tenant requests support
interface SupportAccessGrant {
  tenantId: string;
  grantedBy: string;       // Tenant admin who approved
  grantedTo: string;       // Platform support user
  scope: 'read' | 'read_write';
  resources: string[];     // Specific modules or 'all'
  expiresAt: string;       // Time-limited
  reason: string;          // Why access is needed
  auditLevel: 'enhanced';  // All actions logged
}

// Support access workflow:
1. Tenant admin grants temporary access
2. Platform support user receives time-limited permission
3. All actions logged with enhanced audit
4. Access expires automatically
5. Tenant notified when access ends
\`\`\`

**Separation of Concerns:**
- Platform tables: organizations, subscriptions, platform_audit_logs
- Tenant tables: All business data (leads, invoices, etc.)
- No foreign keys between platform and tenant tables (except organization_id reference)
- Platform queries cannot join to tenant data
- Separate connection pools with different RLS policies`
    },
    {
      id: 'TA-5',
      title: '5. Sensitive Data Authorization',
      content: `**Field-Level Security:**
\`\`\`typescript
// Sensitive fields require additional permissions
interface SensitiveFieldPolicy {
  entity: string;
  field: string;
  classification: 'confidential' | 'highly_restricted';
  requiredPermission: string;  // Additional permission needed
  masking: 'full' | 'partial' | 'none';
  auditLevel: 'enhanced';
}

// Example: Employee salary field
const salaryPolicy: SensitiveFieldPolicy = {
  entity: 'Employee',
  field: 'salary',
  classification: 'highly_restricted',
  requiredPermission: 'view_sensitive_hr_data',
  masking: 'partial',  // Show range, not exact value
  auditLevel: 'enhanced'
};
\`\`\`

**Tenant Admin Limitations:**
- Tenant admins configure roles and permissions
- Tenant admins CANNOT automatically access all sensitive data
- Sensitive data access requires explicit permission grant
- Example: Tenant admin cannot view employee salaries without 'view_sensitive_hr_data' permission

**Approval for Sensitive Operations:**
\`\`\`typescript
// High-impact actions require approval regardless of permission
const sensitiveOperations = [
  'delete_financial_record',
  'export_all_customer_data',
  'modify_audit_settings',
  'approve_large_payment',
  'access_healthcare_data',
];

async function executeSensitiveOperation(op: string, user: User, context: OperationContext) {
  // 1. Check permission
  if (!hasPermission(user, op)) throw new ForbiddenError();

  // 2. Require approval (even if user has permission)
  const approval = await requestApproval(op, user, context);

  // 3. Execute only after approval
  if (approval.status !== 'approved') throw new ApprovalRequiredError();

  // 4. Log with enhanced audit
  await audit.log({
    action: op,
    actor: user.id,
    approver: approval.approverId,
    details: context,
    sensitivity: 'high'
  });
}
\`\`\`

**Data Masking:**
- PII masked in logs (email: j***@example.com)
- Financial data masked in error messages
- Sensitive fields masked in API responses unless authorized
- Masking rules configurable per tenant`
    }
  ]
};

export const archDoc8: Document = {
  id: 'industry-configuration',
  number: 8,
  title: 'Industry Configuration Architecture',
  shortTitle: 'Industry Config',
  description: 'Universal core, industry catalogue, custom industries, configuration model and extension framework.',
  status: 'Recorded',
  stage: 2,
  sections: [
    {
      id: 'ICA-1',
      title: '1. Universal Core Architecture',
      content: `**Universal Core Components (Always Available):**
- Organization and tenant management
- User and role management
- Authorization and permission system
- Core CRM (contacts, companies, activities)
- Basic sales (opportunities, pipeline)
- Basic finance (invoicing, payments)
- Document management
- Audit trail
- Notifications
- Business intelligence framework

**Core Design Principles:**
- Industry-agnostic data models (extensible via custom fields)
- Configurable terminology (labels can be renamed per industry)
- Modular activation (modules can be enabled/disabled)
- Workflow templates (configurable per industry)
- Metric framework (custom metrics can be defined)

**Core Extensibility Points:**
- Custom fields on any entity (within boundaries)
- Custom workflow steps
- Custom approval rules
- Custom metric definitions
- Custom report templates
- Custom dashboard layouts
- Custom notification rules`
    },
    {
      id: 'ICA-2',
      title: '2. Industry Catalogue Architecture',
      content: `**Catalogue Data Model:**
\`\`\`typescript
interface IndustryCatalogue {
  categories: IndustryCategory[];
  industries: Industry[];
  subIndustries: SubIndustry[];
  businessActivities: BusinessActivity[];
}

interface IndustryCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
}

interface Industry {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  profileId: string;         // Links to configuration profile
  isCustom: boolean;         // false for catalogue, true for custom
  status: 'active' | 'deprecated';
  version: string;
}

interface SubIndustry {
  id: string;
  industryId: string;
  name: string;
  description: string;
  profileId?: string;        // Optional specialized profile
}

interface BusinessActivity {
  id: string;
  name: string;
  description: string;
  applicableIndustries: string[];  // Cross-cutting activities
}
\`\`\`

**Catalogue Management:**
- Platform-curated: Reviewed and maintained by platform team
- Community-contributed: Submitted by users, reviewed before publication
- Organization-specific: Private to organization, not shared
- Version-controlled: Changes tracked, migrations provided

**Search and Selection:**
- Full-text search across industries, sub-industries, activities
- Category browsing
- Related industries suggestions
- "Not found? Add custom industry" always visible`
    },
    {
      id: 'ICA-3',
      title: '3. Custom Industry Support',
      content: `**Custom Industry Flow:**
\`\`\`
1. User searches catalogue → not found
2. User selects "Other — my industry is not listed"
3. User enters:
   - Industry name (required)
   - Description of activities (required)
   - Products/services offered (optional)
   - Key business processes (optional)
4. System creates custom industry record
5. AI suggests configuration (optional, user reviews)
6. User configures modules, terminology, workflows
7. Custom industry is active and fully functional
\`\`\`

**Custom Industry Data Model:**
\`\`\`typescript
interface CustomIndustry {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  activities: string;
  productsServices: string;
  keyProcesses: string;
  configuration: IndustryConfiguration;
  status: 'active';
  createdAt: string;
  suggestedByAI: boolean;
  reviewedByUser: boolean;
}
\`\`\`

**Custom Industry Capabilities:**
- Full access to universal core
- Can activate any standard module
- Can define custom terminology
- Can create custom workflows
- Can define custom metrics
- Can add custom fields
- Can configure custom dashboards

**Custom Industry Limitations:**
- Cannot modify core security model
- Cannot bypass financial integrity rules
- Cannot disable audit trail
- Cannot access other tenants' configurations
- Custom configurations are private to organization

**AI Assistance (Optional):**
- Suggests module activation based on description
- Suggests terminology mappings
- Suggests initial metric definitions
- All suggestions clearly marked as "suggested"
- User must review and approve all suggestions
- AI cannot invent regulatory requirements`
    },
    {
      id: 'ICA-4',
      title: '4. Industry Profile Configuration',
      content: `**Industry Profile Data Model:**
\`\`\`typescript
interface IndustryProfile {
  id: string;
  industryId: string;
  version: string;
  status: 'draft' | 'reviewed' | 'approved' | 'deprecated';

  // Module configuration
  suggestedModules: {
    moduleId: string;
    activated: boolean;
    reason: string;
  }[];

  // Terminology customization
  terminology: {
    standardTerm: string;
    customTerm: string;
    context: string;
  }[];

  // Workflow templates
  workflowTemplates: {
    workflowId: string;
    template: WorkflowTemplate;
    description: string;
  }[];

  // Metric definitions
  metricDefinitions: {
    metricId: string;
    definition: MetricDefinition;
    industryRelevance: string;
  }[];

  // Role templates
  roleTemplates: {
    roleId: string;
    name: string;
    permissions: Permission[];
    description: string;
  }[];

  // Compliance notes (informational only)
  complianceNotes: {
    topic: string;
    note: string;
    jurisdiction?: string;
    isRegulatory: boolean;  // true = legal requirement, false = best practice
  }[];

  // Dashboard templates
  dashboardTemplates: {
    dashboardId: string;
    layout: DashboardLayout;
    description: string;
  }[];

  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
}
\`\`\`

**Profile Application:**
\`\`\`typescript
// When organization selects industry
async function applyIndustryProfile(organizationId: string, profileId: string) {
  const profile = await getIndustryProfile(profileId);

  // 1. Activate suggested modules
  for (const mod of profile.suggestedModules) {
    if (mod.activated) {
      await activateModule(organizationId, mod.moduleId);
    }
  }

  // 2. Apply terminology (organization can override)
  for (const term of profile.terminology) {
    await setTerminology(organizationId, term.standardTerm, term.customTerm);
  }

  // 3. Create workflow templates (organization can customize)
  for (const wf of profile.workflowTemplates) {
    await createWorkflowTemplate(organizationId, wf.template);
  }

  // 4. Create metric definitions
  for (const metric of profile.metricDefinitions) {
    await createMetricDefinition(organizationId, metric.definition);
  }

  // 5. Create role templates
  for (const role of profile.roleTemplates) {
    await createRole(organizationId, role);
  }

  // 6. Create dashboard templates
  for (const dash of profile.dashboardTemplates) {
    await createDashboard(organizationId, dash.layout);
  }

  // All configurations are editable by organization admin
}
\`\`\``
    },
    {
      id: 'ICA-5',
      title: '5. Extension Framework',
      content: `**Extension Points:**

**1. Custom Fields:**
\`\`\`typescript
interface CustomField {
  id: string;
  organizationId: string;
  entity: string;            // e.g., 'Lead', 'Product'
  fieldName: string;
  fieldType: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  label: string;
  required: boolean;
  options?: string[];        // For select/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  sortOrder: number;
  isVisible: boolean;
  isSearchable: boolean;
}
\`\`\`

**2. Custom Workflows:**
\`\`\`typescript
interface CustomWorkflow {
  id: string;
  organizationId: string;
  name: string;
  trigger: {
    entity: string;
    event: string;
    conditions?: Record<string, unknown>;
  };
  steps: WorkflowStep[];
  isActive: boolean;
}

interface WorkflowStep {
  id: string;
  type: 'approval' | 'notification' | 'field_update' | 'task_creation' | 'webhook';
  config: Record<string, unknown>;
  nextSteps: string[];       // Step IDs
}
\`\`\`

**3. Custom Metrics:**
\`\`\`typescript
interface CustomMetric {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  formula: string;           // Validated formula expression
  dataSources: string[];
  filters: Record<string, unknown>;
  visualization: 'number' | 'chart' | 'table';
}
\`\`\`

**Extension Validation:**
- Custom fields: Type-checked, size-limited, indexed appropriately
- Custom workflows: Validated against security model, cannot bypass approvals
- Custom metrics: Formula validated, data sources authorized
- All extensions: Scoped to organization, cannot affect other tenants

**Extension Storage:**
- Custom field definitions: Database (organization-scoped)
- Custom field values: JSONB columns on entity tables
- Custom workflows: Database (organization-scoped)
- Custom metrics: Database (organization-scoped)
- Extension metadata: Versioned, auditable

**Extension Limits:**
- Maximum custom fields per entity: 50 (configurable)
- Maximum custom workflows: 100 per organization
- Maximum custom metrics: 200 per organization
- No arbitrary code execution in extensions
- All extensions validated before activation`
    }
  ]
};
