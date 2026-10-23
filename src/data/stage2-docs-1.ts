import { Document } from './types';

export const archDoc1: Document = {
  id: 'system-architecture',
  number: 1,
  title: 'System Architecture',
  shortTitle: 'System Architecture',
  description: 'Overall architecture, logical components, boundaries and diagrams.',
  status: 'Recorded',
  stage: 2,
  sections: [
    {
      id: 'SA-1',
      title: '1. Architecture Overview',
      content: `**Architecture Style:** Modular Monolith with clearly defined module boundaries, prepared for selective service extraction when scaling demands justify it.

**Rationale for Modular Monolith:**
- Simpler deployment and operations in early stages
- Easier testing with in-process module communication
- Clear boundaries enforced by code organization and TypeScript module restrictions
- Modules can be extracted to independent services when needed (e.g., ML inference, background jobs)
- Avoids premature distribution complexity while maintaining architectural clarity

**High-Level Architecture Diagram:**
\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
│  Next.js App Router │ React │ TypeScript │ Tailwind CSS │ shadcn/ui │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ HTTPS / WebSocket (notifications)
┌──────────────────────────────────┴──────────────────────────────────┐
│                         API GATEWAY LAYER                            │
│  Authentication │ Rate Limiting │ Request Validation │ Routing      │
│  Tenant Context Injection │ CORS │ Request Logging                  │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────┐
│                     APPLICATION LAYER (Modular Monolith)             │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Organization│ │     CRM     │ │    Sales    │ │  Marketing  │  │
│  │   & Admin   │ │             │ │             │ │             │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │   Finance   │ │  Inventory  │ │  Projects   │ │    HR /     │  │
│  │             │ │ & Procure   │ │  & Ops      │ │  Workforce  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │  Support    │ │  Documents  │ │  Strategy   │ │   Business  │  │
│  │             │ │             │ │  & KPIs     │ │ Intelligence│  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              CROSS-CUTTING SERVICES                          │   │
│  │  Authorization │ Audit │ Notifications │ Workflow Engine     │   │
│  │  Background Jobs │ File Storage │ Search │ Caching           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────┐
│                    INTELLIGENCE LAYER (Separate Services)            │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │    Data     │ │     ML      │ │   Model     │ │  Inference  │  │
│  │ Preparation │ │  Training   │ │  Registry   │ │  Serving    │  │
│  │ (Python)    │ │  (Python)   │ │             │ │  (FastAPI)  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────┐  │
│  │ Inference   │ │  Decision   │ │     AI Assistant &          │  │
│  │ Orchestrator│ │ Intelligence│ │     Tool Execution          │  │
│  └─────────────┘ └─────────────┘ └─────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────┐
│                       DATA & INFRASTRUCTURE LAYER                    │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ PostgreSQL  │ │    Redis    │ │   Object    │ │  Message    │  │
│  │ (Primary)   │ │  (Cache)    │ │   Storage   │ │   Queue     │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────┐  │
│  │   Search    │ │ Monitoring  │ │     Logging & Tracing       │  │
│  │   Index     │ │ & Alerting  │ │                             │  │
│  └─────────────┘ └─────────────┘ └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
\`\`\``
    },
    {
      id: 'SA-2',
      title: '2. Logical Components',
      content: `**Component 1: Authentication & Session Management**
- Responsibility: User identity verification, session creation/management, MFA
- Location: API Gateway layer + dedicated auth module
- Separation reason: Security-critical, benefits from focused audit and testing

**Component 2: Organization & Tenant Management**
- Responsibility: Tenant lifecycle, branch/department structure, organization settings
- Location: Core application module
- Owns: Organization, Branch, Department, Team entities

**Component 3: Authorization & Permission Evaluation**
- Responsibility: RBAC + ABAC evaluation, data scope enforcement, approval workflows
- Location: Cross-cutting service (middleware + library)
- Separation reason: Must be enforced consistently across all modules

**Component 4: Core Business Application Modules**
- Responsibility: CRM, Sales, Marketing, Finance, Inventory, Projects, HR, Support, Documents, Strategy
- Location: Application layer (modular monolith)
- Each module owns its entities, business rules and APIs

**Component 5: Business Rules & Workflow Orchestration**
- Responsibility: Deterministic business rules, state machines, approval chains
- Location: Cross-cutting service within application layer
- Separation reason: Shared across modules, must be consistent

**Component 6: API & Integration Layer**
- Responsibility: External API exposure, webhook management, integration configuration
- Location: API Gateway + Integration module
- Handles: Rate limiting, versioning, authentication for external consumers

**Component 7: Operational Database**
- Responsibility: Persistent storage for all business data
- Location: PostgreSQL with RLS policies
- Features: Tenant isolation, audit columns, soft deletes, constraints

**Component 8: Audit & Event Recording**
- Responsibility: Immutable audit trail, domain event publication
- Location: Cross-cutting service
- Separation reason: Must capture events from all modules consistently

**Component 9: Background Job Processing**
- Responsibility: Async tasks, scheduled jobs, retry logic
- Location: Separate worker process (can be extracted to service)
- Justification for separation: Different scaling characteristics, isolation from request path

**Component 10: File & Document Services**
- Responsibility: File upload, storage, retrieval, virus scanning
- Location: Shared service within application layer
- Storage: Object storage (S3-compatible) with tenant-scoped paths

**Component 11: Notifications & Communication**
- Responsibility: Email, in-app notifications, push notifications
- Location: Shared service + background jobs
- Channels: Configurable per user preference

**Component 12: Business Intelligence & Analytics**
- Responsibility: Metric calculation, dashboard data, report generation
- Location: Separate analytics schema/service within application
- Separation reason: Different query patterns, read-heavy, may need separate read replica

**Component 13: Data Preparation & Feature Engineering**
- Responsibility: ETL from operational to analytics, feature computation
- Location: Python service (separate)
- Justification for separation: Different runtime, specialized libraries, batch processing

**Component 14: ML Training & Evaluation**
- Responsibility: Model training, validation, evaluation, experiment tracking
- Location: Python service (separate, batch-oriented)
- Justification: GPU/long-running workloads, specialized tooling

**Component 15: Model Registry & Versioning**
- Responsibility: Model artifact storage, version metadata, promotion workflow
- Location: Shared service (can be simple database + object storage)

**Component 16: Model Serving & Inference**
- Responsibility: Real-time prediction API, input validation, response formatting
- Location: Python/FastAPI service (separate)
- Justification for separation: Different scaling, latency requirements, specialized runtime

**Component 17: Inference Intelligence Orchestration**
- Responsibility: Coordinates data retrieval, analytics, models, rules for recommendations
- Location: Application layer service
- Separation reason: Complex orchestration logic, benefits from focused testing

**Component 18: Decision & Recommendation Management**
- Responsibility: Recommendation lifecycle, approval tracking, outcome measurement
- Location: Application layer module
- Owns: Recommendation, ActionProposal, Approval, Outcome entities

**Component 19: AI Assistant & Tool Execution**
- Responsibility: Natural language interface, authorized tool invocation, safety controls
- Location: Application layer + inference services
- Safety: Sandboxed execution, authorization checks, output validation

**Component 20: SaaS Administration & Subscription**
- Responsibility: Tenant provisioning, subscription management, usage tracking, billing
- Location: Platform-level module (separate from tenant data)
- Separation: Platform concerns vs. tenant business data

**Component 21: Observability & Monitoring**
- Responsibility: Metrics, logs, traces, health checks, alerting
- Location: Infrastructure layer + application instrumentation
- Cross-cutting: All components emit observability data

**Component 22: Future Data Marketplace**
- Responsibility: Governed data sharing, aggregation, privacy protection
- Location: Completely separate service (future)
- Isolation: No direct access to operational data, only approved aggregated exports`
    },
    {
      id: 'SA-3',
      title: '3. Component Placement Strategy',
      content: `**In the Modular Monolith (Initial Deployment):**
- Components 1-12 (Authentication through BI/Analytics)
- Components 17-18 (Inference orchestration, Decision management)
- Components 20-21 (SaaS admin, Observability instrumentation)

**Separate Services (Justified Separation):**
- Component 9: Background job workers (different scaling, process isolation)
- Component 13: Data preparation (Python, batch processing, different runtime)
- Component 14: ML training (GPU workloads, long-running, specialized)
- Component 16: Model serving (latency-sensitive, different scaling, Python)
- Component 19: AI assistant (LLM integration, safety sandboxing)

**Future Separate Service:**
- Component 22: Data marketplace (completely separate governance)

**Extraction Criteria:**
A component should be extracted to a separate service when:
- It has fundamentally different scaling characteristics
- It requires specialized runtime or libraries (Python ML stack)
- It has different availability or latency requirements
- It needs independent deployment for rapid iteration
- Team boundaries justify separate ownership
- The operational complexity is justified by the benefits

**Current Extraction Justifications:**
- ML/Data services: Python ecosystem, GPU requirements, batch vs. real-time
- Background workers: Isolation from request path, independent scaling
- Model serving: Latency requirements, specialized monitoring`
    },
    {
      id: 'SA-4',
      title: '4. Deployment Architecture',
      content: `**Initial Deployment Model:**
\`\`\`
┌─────────────────────────────────────────────────┐
│              Load Balancer / CDN                 │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────┴────────┐          ┌────────┴────────┐
│  Next.js App   │          │  Next.js App    │
│  (App Router)  │          │  (App Router)   │
│  + API Routes  │          │  + API Routes   │
│  + Modules     │          │  + Modules      │
└───────┬────────┘          └────────┬────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────┴────────┐          ┌────────┴────────┐
│  Background    │          │  Python ML      │
│  Workers       │          │  Services       │
│  (Node.js)     │          │  (FastAPI)      │
└───────┬────────┘          └────────┬────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │        PostgreSQL           │
        │   (Primary + Read Replica)  │
        └─────────────────────────────┘
        ┌──────────────┬──────────────┐
        │    Redis     │   Object     │
        │   (Cache)    │   Storage    │
        └──────────────┴──────────────┘
\`\`\`

**Scaling Strategy:**
- Next.js app: Horizontal scaling behind load balancer
- Background workers: Scale based on queue depth
- ML services: Scale based on inference load
- Database: Read replicas for analytics, connection pooling
- Cache: Redis cluster for session and query caching

**Environment Strategy:**
- Development: Local with Docker Compose
- Testing: CI environment with test database
- Staging: Production-like environment for verification
- Production: Multi-AZ deployment with monitoring`
    },
    {
      id: 'SA-5',
      title: '5. Architecture Principles Summary',
      content: `**Principle 1: Modular Monolith First**
- Clear module boundaries enforced by code organization
- In-process communication initially, API boundaries prepared for extraction
- No premature microservices

**Principle 2: Schema-First Development**
- Domain entities and API contracts defined before implementation
- Database migrations reviewed and tested
- Type safety from database to frontend

**Principle 3: Secure Multi-Tenancy**
- Tenant isolation at database level (RLS) and application level (middleware)
- Defense-in-depth: multiple layers of tenant scope enforcement
- No cross-tenant data access by design

**Principle 4: Explicit Authorization**
- Default-deny: no access unless explicitly granted
- Least privilege: minimum necessary permissions
- Server-side enforcement: never rely on client-side hiding
- Audit all authorization decisions

**Principle 5: Reliable Business Data**
- Database constraints for integrity
- Transactions for multi-step operations
- Idempotency for retries and duplicates
- Immutable audit trail

**Principle 6: Controlled AI Integration**
- AI respects existing authorization boundaries
- No bypassing tenant isolation
- No executing actions without approval
- Uncertainty always disclosed
- Evidence always cited

**Principle 7: Incremental Delivery**
- Each phase builds on previous phases
- Independent testing of modules
- Integration through documented contracts
- No big-bang deployments`
    }
  ]
};

export const archDoc2: Document = {
  id: 'architecture-decisions',
  number: 2,
  title: 'Architecture Decision Records',
  shortTitle: 'ADR',
  description: 'Important decisions, context, options considered, consequences and status.',
  status: 'Recorded',
  stage: 2,
  sections: [
    {
      id: 'ADR-1',
      title: 'ADR-001: Modular Monolith Architecture',
      content: `**Status:** PROPOSED (Pending Approval)

**Context:**
The platform requires clear module boundaries while avoiding premature distribution complexity. We need an architecture that supports incremental development and can evolve toward services when justified.

**Decision:**
Adopt a modular monolith architecture for core business functionality, with clearly defined module boundaries enforced by code organization and TypeScript module restrictions.

**Options Considered:**
1. **Full Microservices:** Maximum independence but high operational complexity, network latency, distributed transaction challenges
2. **Modular Monolith (SELECTED):** Clear boundaries, simpler operations, easier testing, extract services when needed
3. **Monolith:** Simple but no boundaries, becomes unmaintainable at scale
4. **Hybrid from start:** Complex, unclear responsibilities

**Consequences:**
- (+) Simpler deployment and debugging
- (+) Easier to test modules in isolation
- (+) Can extract services when scaling demands it
- (+) Lower operational overhead initially
- (-) Requires discipline to maintain boundaries
- (-) Single deployment unit (but can be split later)

**Migration Path:**
Modules can be extracted to services by:
1. Defining explicit API boundaries (already in place)
2. Moving module to separate deployment
3. Replacing in-process calls with API calls
4. No data model changes required`
    },
    {
      id: 'ADR-2',
      title: 'ADR-002: Next.js as Primary Backend',
      content: `**Status:** PROPOSED (Pending Approval)

**Context:**
Need to select backend framework. Options include Next.js API routes, dedicated Express/Fastify, or hybrid approach.

**Decision:**
Use Next.js App Router with API Routes and Server Actions as the primary backend for core application functionality.

**Options Considered:**
1. **Next.js API Routes (SELECTED):** Unified stack, SSR benefits, simpler deployment, shared types
2. **Express/Fastify:** More control, but separate codebase, duplicated types, more complex deployment
3. **Hybrid:** Best of both worlds but unclear boundaries, more complexity

**Rationale:**
- Single codebase for frontend and backend reduces duplication
- Shared TypeScript types between client and server
- Server Components reduce client-side JavaScript
- API Routes provide RESTful endpoints when needed
- Server Actions simplify form handling and mutations
- Vercel/Node.js deployment is straightforward

**When to Extract:**
If specific requirements emerge (e.g., very high throughput APIs, WebSocket-heavy features, specialized protocols), those specific endpoints can be extracted to a dedicated service without rewriting the entire backend.

**Consequences:**
- (+) Unified development experience
- (+) Shared types and validation
- (+) Simpler deployment
- (+) SSR and performance benefits
- (-) Less control over server configuration
- (-) Vendor considerations if using Vercel
- (-) May need dedicated backend for specialized requirements`
    },
    {
      id: 'ADR-3',
      title: 'ADR-003: PostgreSQL with Prisma',
      content: `**Status:** PROPOSED (Pending Approval)

**Context:**
Need to select database and data access layer. Requirements include type safety, migration management, tenant isolation and developer productivity.

**Decision:**
Use PostgreSQL as the primary database with Prisma as the ORM and migration tool.

**Options Considered:**
1. **PostgreSQL + Prisma (SELECTED):** Type safety, excellent DX, migration management, active community
2. **PostgreSQL + Drizzle:** Lighter weight, SQL-first, but less mature ecosystem
3. **PostgreSQL + Raw SQL:** Maximum control, but no type safety, manual migration management
4. **MongoDB:** Flexible schema, but loses relational integrity, harder tenant isolation

**Rationale for PostgreSQL:**
- ACID transactions for business data integrity
- Row-Level Security for tenant isolation
- JSON columns for flexible extension data
- Full-text search capabilities
- Mature, reliable, well-understood
- Strong ecosystem and tooling

**Rationale for Prisma:**
- Type-safe database access from TypeScript
- Automatic type generation from schema
- Migration management with versioning
- Good developer experience
- Active community and ecosystem
- Supports PostgreSQL features (RLS, JSON, etc.)

**Consequences:**
- (+) Type safety from database to application
- (+) Managed migrations with rollback
- (+) Strong relational integrity
- (+) RLS for tenant isolation
- (-) Prisma adds abstraction layer
- (-) May need raw SQL for complex queries
- (-) Prisma migrations require review process`
    },
    {
      id: 'ADR-4',
      title: 'ADR-004: Python for ML/Data Services',
      content: `**Status:** PROPOSED (Pending Approval)

**Context:**
ML and data science ecosystems are predominantly Python-based. Need to decide how to integrate Python services with the TypeScript application.

**Decision:**
Use Python with FastAPI for ML training, data preparation and model serving services, communicating with the core application via REST APIs.

**Options Considered:**
1. **Python microservices (SELECTED):** Access to ML ecosystem, specialized libraries, team flexibility
2. **TypeScript ML libraries:** Unified stack, but limited ML ecosystem, less mature
3. **Managed ML services:** Less operational burden, but vendor lock-in, less control

**Rationale:**
- Python dominates ML/data science (scikit-learn, pandas, PyTorch, TensorFlow)
- FastAPI provides excellent performance and type safety
- Clear API boundaries between TypeScript app and Python services
- Teams can specialize (TypeScript for product, Python for ML)
- Independent scaling and deployment

**Communication Pattern:**
- REST APIs for inference requests
- Shared message queue for async data preparation
- Object storage for model artifacts and datasets

**Consequences:**
- (+) Access to full ML ecosystem
- (+) Specialized tooling and libraries
- (+) Independent scaling
- (+) Team specialization
- (-) Two language ecosystems
- (-) Network communication overhead
- (-) More complex deployment
- (-) Need for API contract management`
    },
    {
      id: 'ADR-5',
      title: 'ADR-005: Tenant Isolation via RLS + Middleware',
      content: `**Status:** PROPOSED (Pending Approval)

**Context:**
Multi-tenant SaaS requires strict data isolation. Need to prevent cross-tenant data access at all levels.

**Decision:**
Implement defense-in-depth tenant isolation using PostgreSQL Row-Level Security (RLS) policies as the primary enforcement, with application-level middleware as defense-in-depth.

**Options Considered:**
1. **Application-level only:** Simpler, but single point of failure
2. **Database RLS only:** Strong, but harder to debug, limited flexibility
3. **RLS + Middleware (SELECTED):** Defense-in-depth, database-level guarantee + application-level flexibility
4. **Separate databases per tenant:** Maximum isolation, but operational complexity, cost

**Implementation:**
\`\`\`sql
-- Every tenant-owned table
CREATE TABLE example (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  -- ... business fields
);

-- RLS Policy
ALTER TABLE example ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON example
  USING (organization_id = current_setting('app.current_tenant')::UUID);

-- Application sets context per request
SET LOCAL app.current_tenant = 'tenant-uuid-here';
\`\`\`

**Consequences:**
- (+) Database-level guarantee of isolation
- (+) Application middleware provides flexibility
- (+) Defense-in-depth approach
- (+) Automated testing can verify isolation
- (-) RLS requires careful policy management
- (-) Need to set context on every connection
- (-) Debugging RLS issues can be complex`
    },
    {
      id: 'ADR-6',
      title: 'ADR-006: Event-Driven Communication (Selective)',
      content: `**Status:** PROPOSED (Pending Approval)

**Context:**
Modules need to communicate. Options include direct function calls, REST APIs, or event-driven messaging.

**Decision:**
Use direct function calls within the modular monolith for synchronous operations, with selective event-driven communication for specific scenarios that benefit from decoupling.

**Options Considered:**
1. **All direct calls:** Simple, but tight coupling
2. **All events:** Decoupled, but eventual consistency, complexity
3. **Selective events (SELECTED):** Direct calls for simplicity, events where decoupling provides clear value
4. **REST APIs between modules:** Overhead for in-process communication

**When to Use Events:**
- Analytics data preparation (BI consumes business events)
- Notification triggers (multiple consumers)
- Audit trail recording (append-only, decoupled)
- Cross-module workflow triggers (e.g., order placed → inventory reserved)
- Future integration with external systems

**Event Infrastructure:**
- Initial: In-process event bus (simple, reliable)
- Future: Message queue (RabbitMQ, Redis Streams) when scaling demands

**Consequences:**
- (+) Simplicity where direct calls suffice
- (+) Decoupling where it provides value
- (+) Can evolve to message queue later
- (-) Mixed communication patterns
- (-) Need clear guidelines on when to use each`
    }
  ]
};

export const archDoc3: Document = {
  id: 'tech-stack-evaluation',
  number: 3,
  title: 'Technology Stack Evaluation',
  shortTitle: 'Tech Stack',
  description: 'Candidate technologies, evaluation criteria, trade-offs and proposed choices.',
  status: 'Recorded',
  stage: 2,
  sections: [
    {
      id: 'TSE-1',
      title: '1. Frontend Technology Stack',
      content: `**Framework: Next.js 14+ (App Router)**
- Selected for: SSR, API routes, server components, routing
- Alternatives considered: Remix, Vite + React Router
- Justification: Unified frontend/backend, excellent DX, strong ecosystem

**Language: TypeScript (Strict Mode)**
- Selected for: Type safety, refactoring confidence, IDE support
- Configuration: strict: true, noAny: true, noImplicitAny: true
- Enforcement: ESLint rules, CI checks

**Styling: Tailwind CSS**
- Selected for: Utility-first, responsive design, consistency
- Alternatives considered: CSS Modules, Styled Components
- Justification: Rapid development, small bundle size, design system integration

**Component Library: shadcn/ui**
- Selected for: Accessible, customizable, copy-paste model
- Alternatives considered: Material UI, Ant Design, custom components
- Justification: Full control over code, accessible by default, Tailwind integration

**Form Handling: React Hook Form + Zod**
- Selected for: Performance, validation, TypeScript integration
- Validation: Zod schemas shared between frontend and backend
- Justification: Minimal re-renders, excellent DX, type-safe validation

**State Management:**
- Server state: React Query / TanStack Query (caching, synchronization)
- Client state: React Context + useReducer (local UI state)
- Global state: Zustand (if needed for complex cross-component state)
- Justification: Server-first approach, minimal client state

**Data Fetching:**
- Server Components: Direct database queries for initial page load
- API Routes: RESTful endpoints for client-side data needs
- Server Actions: Form submissions and mutations
- Justification: Optimal performance, reduced client-side JavaScript`
    },
    {
      id: 'TSE-2',
      title: '2. Backend Technology Stack',
      content: `**Primary Backend: Next.js API Routes + Server Actions**
- API Routes: RESTful endpoints for external consumption and complex queries
- Server Actions: Form handling, mutations, server-side logic
- Middleware: Authentication, authorization, tenant context
- Justification: Unified stack, shared types, simplified deployment

**Validation: Zod**
- Selected for: Runtime validation, TypeScript type inference
- Usage: Shared schemas between frontend and backend
- Justification: Type-safe validation, excellent error messages

**Authentication: To Be Determined**
- Options: NextAuth.js, Clerk, Auth0, Supabase Auth, custom
- Requirements: MFA support, session management, SSO capability
- Decision pending: Evaluate based on cost, control, features

**Authorization: Custom implementation**
- RBAC + ABAC evaluation engine
- Middleware-based enforcement
- Permission definitions stored in database
- Justification: Full control over authorization logic, audit requirements

**Error Handling:**
- Structured error responses with error codes
- Global error boundary in frontend
- Centralized error logging
- User-friendly error messages

**Transaction Management:**
- Prisma transactions for multi-step operations
- Database-level constraints for integrity
- Idempotency keys for retries
- Saga pattern for complex distributed operations (if needed)`
    },
    {
      id: 'TSE-3',
      title: '3. Database Technology Stack',
      content: `**Database: PostgreSQL 15+**
- Selected for: ACID compliance, RLS, JSON support, full-text search
- Features: Row-Level Security, JSONB columns, materialized views
- Justification: Relational integrity, tenant isolation, mature ecosystem

**ORM: Prisma**
- Selected for: Type safety, migration management, developer experience
- Features: Auto-generated types, migration CLI, studio UI
- Justification: TypeScript integration, schema-first development

**Migrations:**
- Prisma Migrate for schema changes
- Version-controlled migration files
- Reviewed before merging to main
- Reversible migrations (up and down)
- Tested against production-sized data

**Schema Design:**
- Explicit foreign keys and constraints
- Tenant ID on all tenant-owned tables
- Audit columns (created_at, updated_at, created_by, updated_by)
- Soft deletes (deleted_at) where appropriate
- Indexes for common query patterns

**Connection Management:**
- Connection pooling (PgBouncer or similar)
- Read replicas for analytics queries
- Connection timeout and retry logic

**Backup and Recovery:**
- Automated daily backups
- Point-in-time recovery
- Regular restore testing
- Encrypted backups`
    },
    {
      id: 'TSE-4',
      title: '4. ML/AI Technology Stack',
      content: `**Language: Python 3.11+**
- Selected for: ML ecosystem dominance, library support
- Libraries: scikit-learn, pandas, numpy, PyTorch (if needed)

**API Framework: FastAPI**
- Selected for: Performance, type safety, automatic documentation
- Features: Async support, Pydantic validation, OpenAPI generation
- Justification: Excellent for ML serving, type-safe, fast

**Data Preparation:**
- Pandas for data manipulation
- SQLAlchemy for database access (if needed)
- Apache Airflow or Prefect for workflow orchestration (if needed)
- Justification: Mature tools, good documentation

**Model Training:**
- scikit-learn for traditional ML
- PyTorch or TensorFlow for deep learning (if needed)
- MLflow or Weights & Biases for experiment tracking
- Justification: Industry standard, good tooling

**Model Serving:**
- FastAPI for inference endpoints
- Model versioning in database + object storage
- Input validation with Pydantic
- Structured response format with metadata
- Monitoring and logging

**LLM Integration (where applicable):**
- OpenAI API or similar for natural language features
- Prompt engineering and safety controls
- Output validation and sanitization
- Cost tracking and rate limiting
- Fallback strategies for outages

**Feature Store:**
- Initial: Database tables with versioned features
- Future: Dedicated feature store if complexity demands
- Justification: Start simple, evolve when needed`
    },
    {
      id: 'TSE-5',
      title: '5. Infrastructure Technology Stack',
      content: `**Hosting: To Be Determined**
- Options: AWS, GCP, Azure, Vercel + managed services
- Decision pending: Evaluate based on target market, compliance, cost

**CI/CD: GitHub Actions**
- Selected for: GitHub integration, flexibility, ecosystem
- Pipelines: Lint, test, build, deploy
- Environments: Dev, staging, production
- Justification: Standard choice, good documentation

**Containerization: Docker**
- Selected for: Consistent environments, easy deployment
- Usage: Development, CI, production
- Justification: Industry standard, portable

**Cache: Redis**
- Selected for: Session storage, query caching, rate limiting
- Features: Pub/sub for real-time features (if needed)
- Justification: Fast, reliable, widely used

**Object Storage: S3-compatible**
- Selected for: File uploads, model artifacts, backups
- Options: AWS S3, Cloudflare R2, MinIO (self-hosted)
- Justification: Scalable, durable, cost-effective

**Message Queue: To Be Determined**
- Options: Redis Streams, RabbitMQ, AWS SQS
- Decision pending: Evaluate based on requirements
- Initial: In-process event bus, extract to queue when needed

**Monitoring:**
- Application: Structured logging, custom metrics
- Infrastructure: Cloud provider monitoring or Datadog/New Relic
- Error tracking: Sentry or similar
- Justification: Comprehensive observability

**Secrets Management:**
- Environment variables for development
- Cloud provider secrets manager for production (AWS Secrets Manager, GCP Secret Manager)
- Never commit secrets to repository
- Rotation support

**Search: PostgreSQL Full-Text Search (initial)**
- Selected for: Simplicity, no additional infrastructure
- Future: Elasticsearch or Meilisearch if requirements demand
- Justification: Start simple, add complexity when needed`
    }
  ]
};
