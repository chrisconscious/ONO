import { Document } from './types';

export const stage3Doc9: Document = {
  id: 'observability-readiness',
  number: 9,
  title: 'Observability and Operational Readiness',
  shortTitle: 'Observability',
  description: 'Logging, monitoring, alerting, health checks, and operational procedures for production readiness.',
  status: 'Recorded',
  stage: 3,
  sections: [
    {
      id: 'OBS-1',
      title: '1. Structured Logging',
      content: `**Logging Standards:**

**1. Log Format (JSON):**
\`\`\`typescript
interface LogEntry {
  timestamp: string;          // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service: string;            // Module or service name
  requestId: string;          // Correlation ID
  tenantId?: string;          // Tenant context
  userId?: string;            // User context
  duration?: number;          // Operation duration (ms)
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}
\`\`\`

**2. Logger Implementation:**
\`\`\`typescript
// packages/infrastructure/src/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: () => \`,"\${new Date().toISOString()}"\`,
  redact: {
    paths: [
      'password',
      'token',
      'secret',
      'apiKey',
      'creditCard',
      'ssn',
    ],
    censor: '[REDACTED]'
  }
});

// Usage
logger.info({
  service: 'crm',
  requestId: req.id,
  tenantId: req.tenantId,
  userId: req.userId,
}, 'Lead created');
\`\`\`

**3. Log Levels:**
- **debug**: Development details, full request/response (dev only)
- **info**: Normal operations (user actions, API calls, job completions)
- **warn**: Unexpected but handled situations (retries, fallbacks)
- **error**: Failures that need attention (API errors, job failures)
- **fatal**: System-level failures requiring immediate action

**4. Log Rules:**
- No PII in logs (emails masked, names redacted)
- No credentials or tokens in logs
- No full request/response bodies at info level
- Include correlation IDs for request tracing
- Include tenant context for tenant-scoped operations
- Sanitize error messages before logging`
    },
    {
      id: 'OBS-2',
      title: '2. Metrics and Monitoring',
      content: `**Application Metrics:**

**1. HTTP Metrics:**
\`\`\`typescript
// Request rate, latency, error rate per endpoint
interface HttpMetrics {
  'http_requests_total': Counter;
  'http_request_duration_seconds': Histogram;
  'http_request_errors_total': Counter;
}
\`\`\`

**2. Business Metrics:**
\`\`\`typescript
interface BusinessMetrics {
  'leads_created_total': Counter;
  'opportunities_won_total': Counter;
  'invoices_paid_total': Counter;
  'background_jobs_completed_total': Counter;
  'background_jobs_failed_total': Counter;
}
\`\`\`

**3. Database Metrics:**
\`\`\`typescript
interface DatabaseMetrics {
  'db_query_duration_seconds': Histogram;
  'db_connections_active': Gauge;
  'db_connections_waiting': Gauge;
  'db_slow_queries_total': Counter;
}
\`\`\`

**4. ML/Inference Metrics:**
\`\`\`typescript
interface MLMetrics {
  'inference_requests_total': Counter;
  'inference_duration_seconds': Histogram;
  'inference_errors_total': Counter;
  'model_prediction_confidence': Histogram;
}
\`\`\`

**Health Checks:**
\`\`\`typescript
// /api/health - Basic health check
export async function healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
  };
}

// /api/ready - Readiness check (all dependencies available)
export async function readinessCheck() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    storage: await checkStorage(),
    mlService: await checkMLService(),
  };

  const allHealthy = Object.values(checks).every(c => c.status === 'healthy');

  return {
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  };
}
\`\`\`

**Monitoring Tools:**
- Metrics: Prometheus + Grafana (or managed alternative)
- Errors: Sentry
- Logs: LogDNA or Datadog
- Uptime: Pingdom or Better Stack
- APM: Built-in Next.js analytics + custom instrumentation`
    },
    {
      id: 'OBS-3',
      title: '3. Alerting and Incident Response',
      content: `**Alert Rules:**

**Critical (Page immediately):**
- Service completely down
- Database connection lost
- Tenant isolation failure detected
- Data corruption detected
- Security breach detected

**High (Notify within 15 minutes):**
- Error rate > 5% for 2 minutes
- Latency p95 > 5s for 2 minutes
- Background job failure rate > 20%
- ML service unavailable
- Disk usage > 95%

**Medium (Notify within 1 hour):**
- Error rate > 1% for 5 minutes
- Latency p95 > 2s for 5 minutes
- Background job failure rate > 10%
- Disk usage > 80%
- Certificate expiring within 7 days

**Low (Notify during business hours):**
- Slow queries detected
- Unusual traffic patterns
- Dependency updates available
- Non-critical warnings

**Alert Channels:**
- Critical: PagerDuty (phone + SMS + email)
- High: Slack + email
- Medium: Slack
- Low: Email digest

**Incident Response Process:**
1. **Detect**: Automated alert or user report
2. **Triage**: Assess severity, assign responder
3. **Communicate**: Update status page, notify stakeholders
4. **Investigate**: Identify root cause
5. **Mitigate**: Restore service (workaround if needed)
6. **Resolve**: Fix root cause
7. **Verify**: Confirm fix, monitor for recurrence
8. **Post-Mortem**: Document within 48 hours
9. **Improve**: Implement preventive measures`
    },
    {
      id: 'OBS-4',
      title: '4. Backup and Recovery',
      content: `**Backup Strategy:**

**Database:**
- Automated daily full backups (2:00 AM UTC)
- Continuous WAL archiving for point-in-time recovery
- Encrypted backups (AES-256)
- Stored in separate region from primary
- Retention: 30 daily, 12 weekly, 24 monthly

**Object Storage:**
- Cross-region replication enabled
- Versioning enabled for critical buckets
- Lifecycle policies for cost management

**Configuration:**
- All configuration in Git (Infrastructure as Code)
- Secrets in cloud secrets manager
- Database schema versioned (migrations)

**Recovery Procedures:**

**Database Recovery:**
\`\`\`bash
# 1. Assess data loss extent
# 2. Choose recovery point
# 3. Restore from backup
pg_restore -h <host> -U <user> -d clickit_production backup.dump

# 4. Apply WAL logs to desired point
# 5. Verify data integrity
# 6. Update connection strings
# 7. Monitor for issues
\`\`\`

**Application Recovery:**
\`\`\`bash
# 1. Identify failure cause
# 2. Rollback deployment if code issue
vercel rollback

# 3. Restart services
# 4. Verify health checks pass
curl https://api.clickit.com/health
curl https://api.clickit.com/ready

# 5. Monitor for recurrence
\`\`\`

**Recovery Objectives:**
- RPO (Recovery Point Objective): < 1 hour
- RTO (Recovery Time Objective): < 4 hours
- Tested quarterly with documented results

**Backup Verification:**
- Automated restore testing monthly
- Data integrity checks on restore
- Documented procedures reviewed quarterly`
    },
    {
      id: 'OBS-5',
      title: '5. Data Freshness and Pipeline Monitoring',
      content: `**Analytics Pipeline Monitoring:**

**1. Freshness Tracking:**
\`\`\`typescript
interface DataFreshness {
  metricId: string;
  lastUpdated: string;
  expectedFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  isStale: boolean;
  stalenessDuration?: number;  // seconds
}

// Check freshness before displaying metrics
function checkFreshness(metric: MetricDefinition): DataFreshness {
  const lastUpdated = metric.lastCalculatedAt;
  const expectedFrequency = metric.updateFrequency;
  const maxAge = getMaxAge(expectedFrequency);
  const age = Date.now() - new Date(lastUpdated).getTime();

  return {
    metricId: metric.id,
    lastUpdated,
    expectedFrequency,
    isStale: age > maxAge,
    stalenessDuration: age > maxAge ? age : undefined,
  };
}
\`\`\`

**2. Pipeline Health:**
\`\`\`typescript
interface PipelineStatus {
  pipelineId: string;
  status: 'running' | 'completed' | 'failed' | 'stale';
  lastRunAt: string;
  lastDuration: number;
  recordsProcessed: number;
  errors: number;
  nextRunAt: string;
}

// Monitor all pipelines
async function checkPipelineHealth(): Promise<PipelineStatus[]> {
  const pipelines = await db.pipeline.findMany();

  return pipelines.map(pipeline => ({
    pipelineId: pipeline.id,
    status: determineStatus(pipeline),
    lastRunAt: pipeline.lastRunAt,
    lastDuration: pipeline.lastDuration,
    recordsProcessed: pipeline.recordsProcessed,
    errors: pipeline.errorCount,
    nextRunAt: pipeline.nextRunAt,
  }));
}
\`\`\`

**3. Alerts for Pipeline Issues:**
- Pipeline not run within expected window
- Pipeline failure rate > 10%
- Records processed dropped significantly
- Error count increasing
- Duration increasing (performance degradation)

**4. User-Facing Indicators:**
- Show data freshness on dashboards
- Warn when data is stale
- Provide "last updated" timestamps
- Allow manual refresh where applicable`
    }
  ]
};

export const stage3Doc10: Document = {
  id: 'implementation-sequence',
  number: 10,
  title: 'Development Infrastructure Implementation Sequence',
  shortTitle: 'Implementation Sequence',
  description: 'Ordered steps for setting up repository, tooling, CI/CD, and development infrastructure.',
  status: 'Recorded',
  stage: 3,
  sections: [
    {
      id: 'ISI-1',
      title: '1. Phase 3A: Repository Foundation',
      content: `**Step 1: Initialize Repository**
- Create monorepo structure (apps/, packages/, modules/)
- Configure pnpm workspaces
- Set up Turborepo for build orchestration
- Add root package.json with workspace scripts

**Step 2: TypeScript Configuration**
- Root tsconfig.json with strict settings
- Base tsconfig for shared settings
- Per-package tsconfig extending base
- Path aliases for clean imports

**Step 3: Code Quality Tools**
- ESLint configuration (TypeScript, React, import rules)
- Prettier configuration
- EditorConfig for cross-editor consistency
- Husky + lint-staged for pre-commit hooks

**Step 4: Documentation**
- README.md with quick start guide
- CONTRIBUTING.md with development guidelines
- CODE_OF_CONDUCT.md
- docs/ directory structure

**Acceptance Criteria:**
- Repository builds successfully
- Linting passes
- Type checking passes
- Documentation is complete`
    },
    {
      id: 'ISI-2',
      title: '2. Phase 3B: Development Environment',
      content: `**Step 1: Docker Compose**
- PostgreSQL for development
- PostgreSQL for testing (separate instance)
- Redis for caching and queues
- Health checks for all services

**Step 2: Environment Variables**
- .env.example template
- Environment variable documentation
- Secret management guidelines

**Step 3: Database Setup**
- Prisma schema (initial structure)
- Migration workflow scripts
- Seed data scripts
- Test database isolation

**Step 4: Development Scripts**
- setup.sh (initial environment setup)
- dev.sh (start development servers)
- test.sh (run test suites)
- migrate.sh (database operations)

**Acceptance Criteria:**
- Developer can run \`docker-compose up\` and get all services
- Developer can run \`pnpm dev\` and see the app
- Database migrations work
- Seed data loads correctly`
    },
    {
      id: 'ISI-3',
      title: '3. Phase 3C: Testing Infrastructure',
      content: `**Step 1: Unit Testing**
- Vitest configuration
- Test utilities and factories
- Coverage reporting
- Test file conventions

**Step 2: Integration Testing**
- Test database setup
- Test service configuration
- Integration test patterns
- Test data management

**Step 3: E2E Testing**
- Playwright configuration
- Test environment setup
- Page object model (if needed)
- E2E test conventions

**Step 4: Security Testing**
- Tenant isolation test suite
- Authorization test patterns
- Input validation tests
- Security scan integration

**Acceptance Criteria:**
- Unit tests run and pass
- Integration tests run against test database
- E2E tests run in CI
- Security tests verify tenant isolation`
    },
    {
      id: 'ISI-4',
      title: '4. Phase 3D: CI/CD Pipeline',
      content: `**Step 1: GitHub Actions Configuration**
- PR validation workflow
- Main branch workflow
- Staging deployment workflow
- Production deployment workflow

**Step 2: Quality Gates**
- Lint and format checks
- TypeScript type checking
- Unit test execution
- Integration test execution
- Security scanning
- Build verification

**Step 3: Deployment**
- Staging deployment automation
- E2E test execution in staging
- Production deployment with approval
- Smoke tests post-deployment
- Rollback procedures

**Step 4: Monitoring Setup**
- Error tracking (Sentry)
- Log aggregation
- Metrics collection
- Health check endpoints
- Alert rules

**Acceptance Criteria:**
- PR triggers CI checks
- All checks must pass before merge
- Main branch deploys to staging automatically
- Production deployment requires approval
- Monitoring captures errors and metrics`
    },
    {
      id: 'ISI-5',
      title: '5. Phase 3E: ML Infrastructure',
      content: `**Step 1: Python Environment**
- Python virtual environment setup
- Requirements.txt with pinned versions
- ML service directory structure
- FastAPI application skeleton

**Step 2: Model Registry**
- Model versioning schema
- Artifact storage configuration
- Metadata database tables
- Promotion workflow

**Step 3: Training Pipeline**
- Experiment tracking (MLflow)
- Dataset versioning
- Feature engineering framework
- Reproducible training scripts

**Step 4: Inference Service**
- FastAPI inference endpoint
- Input/output validation
- Timeout and circuit breaker
- Monitoring and logging

**Acceptance Criteria:**
- Python environment works
- Model can be trained and versioned
- Inference service responds to requests
- Monitoring captures ML metrics`
    },
    {
      id: 'ISI-6',
      title: '6. Dependencies and Risks',
      content: `**Dependencies:**
- Phase 3A must complete before 3B (need repo before environment)
- Phase 3B must complete before 3C (need database before tests)
- Phase 3C and 3D can partially overlap (tests inform CI)
- Phase 3E can start after 3A (independent Python service)

**Risks:**

**Risk 1: Tooling Compatibility**
- Different tools may have conflicting requirements
- Mitigation: Test integration early, pin versions

**Risk 2: CI/CD Complexity**
- Pipeline may become slow or flaky
- Mitigation: Start simple, add complexity gradually

**Risk 3: ML Infrastructure**
- Python/TypeScript integration challenges
- Mitigation: Clear API contracts, typed interfaces

**Risk 4: Developer Experience**
- Complex setup may slow onboarding
- Mitigation: Comprehensive documentation, setup scripts

**Decisions Required Before Implementation:**
- Authentication provider (needed for Phase 5)
- Cloud provider (needed for deployment)
- Monitoring tools (Sentry vs. alternatives)
- CI/CD platform (GitHub Actions confirmed)

**Decisions That Can Be Deferred:**
- Specific Python ML libraries (can be decided per model)
- Background job implementation details (Phase 10)
- Search implementation (Phase 7)
- Real-time communication approach (Phase 6)`
    }
  ]
};

export const stage3Doc11: Document = {
  id: 'open-decisions-stage3',
  number: 11,
  title: 'Open Decisions and Assumptions (Stage 3 Update)',
  shortTitle: 'Open Decisions',
  description: 'Updated from Stages 1-2. Preserves all previous entries and adds Stage 3 findings.',
  status: 'Updated',
  stage: 3,
  sections: [
    {
      id: 'OD3-1',
      title: '1. Decisions Still Requiring Approval',
      content: `**From Stage 1 (Unchanged):**
- Authentication provider selection (NextAuth, Clerk, Auth0, Supabase, or custom)
- Cloud provider selection (AWS, GCP, Azure, Vercel)
- Target market compliance requirements (legal review needed)
- Development team size and skills confirmation
- Timeline expectations
- Budget constraints

**From Stage 2 (Unchanged):**
- ADR-001: Modular monolith (proposed, pending approval)
- ADR-002: Next.js backend (proposed, pending approval)
- ADR-003: PostgreSQL + Prisma (proposed, pending approval)
- ADR-004: Python ML services (proposed, pending approval)
- ADR-005: RLS + middleware tenancy (proposed, pending approval)
- ADR-006: Selective event-driven (proposed, pending approval)

**From Stage 3 (New):**
- Package manager: pnpm (proposed) vs npm vs yarn
- Build orchestration: Turborepo (proposed) vs Nx vs manual
- Testing framework: Vitest (proposed) vs Jest
- E2E framework: Playwright (proposed) vs Cypress
- Monitoring: Sentry + LogDNA (proposed) vs alternatives
- Background jobs: BullMQ (proposed) vs Inngest vs Trigger.dev

**All decisions documented with rationale in respective Stage 3 documents.**`
    },
    {
      id: 'OD3-2',
      title: '2. Assumptions Validated in Stage 3',
      content: `**Existing Repository Inspection:**
- Current repo has Vite + React 18 + TypeScript 5.7 + Tailwind CSS 4
- Supabase client is installed (potential auth/database connection)
- Various UI libraries present (dnd-kit, framer-motion, lucide-react, recharts)
- No ESLint, Prettier, or testing frameworks configured
- No CI/CD, Docker, or backend code exists
- No database migrations or seed data

**Implications:**
- Repository is a documentation viewer, not the actual platform
- Stage 3 plan assumes building from scratch (new monorepo)
- Existing packages may be useful for UI components
- Supabase client suggests potential auth direction

**New Assumptions:**
- ASSUMPTION-009: pnpm is acceptable as package manager
- ASSUMPTION-010: Turborepo is acceptable for monorepo management
- ASSUMPTION-011: Vitest is acceptable for unit/integration testing
- ASSUMPTION-012: Playwright is acceptable for E2E testing
- ASSUMPTION-013: Python 3.11+ is available for ML services
- ASSUMPTION-014: Docker is available for local development

**All assumptions require validation before implementation.**`
    },
    {
      id: 'OD3-3',
      title: '3. Risks Identified in Stage 3',
      content: `**From Stages 1-2 (Unchanged):**
- Scope complexity (HIGH)
- ML accuracy expectations (MEDIUM)
- Multi-tenant security (LOW with controls)
- Industry configuration (MEDIUM, mitigated)
- Performance at scale (MEDIUM, mitigated)
- Regulatory compliance (MEDIUM)

**From Stage 3 (New):**
- **Tooling compatibility** (LOW) — Different tools may conflict; mitigate by testing early
- **CI/CD complexity** (MEDIUM) — Pipeline may become slow; mitigate by starting simple
- **ML infrastructure integration** (LOW) — Python/TS boundary; mitigate with clear contracts
- **Developer experience** (MEDIUM) — Complex setup; mitigate with documentation and scripts
- **Existing codebase confusion** (LOW) — Current repo is documentation viewer, not platform; mitigate by clear communication`
    }
  ]
};

export const stage3Doc12: Document = {
  id: 'project-status-stage3',
  number: 12,
  title: 'Project Status (Stage 3 Update)',
  shortTitle: 'Status',
  description: 'Updated project status reflecting Stage 3 completion. Current stage, deliverables, and next steps.',
  status: 'Updated',
  stage: 3,
  sections: [
    {
      id: 'PS3-1',
      title: '1. Current Stage',
      content: `**Stage:** 3 — Repository and Development Infrastructure Planning

**Stage Status:** Documentation complete

**Stage Objective:** Define repository structure, development environment, engineering standards, testing strategy, CI/CD pipeline, and infrastructure requirements for building the ClickIT platform.

**Authorization:** Documentation and planning only. No implementation code, configuration files, database migrations, dependencies, tests, workflows, or deployment infrastructure created.`
    },
    {
      id: 'PS3-2',
      title: '2. Completed Documentation',
      content: `**Stage 1 Documents (13):** Requirements, modules, industry adaptation, roles, workflows, architecture plan, database plan, AI/ML spec, UI/UX, security, roadmap, open decisions, project status.

**Stage 2 Documents (13):** System architecture, ADRs, tech stack, module dependencies, API/event contracts, data architecture, tenancy/authorization, industry configuration, AI/ML architecture, reliability, implementation sequence, updated decisions, updated status.

**Stage 3 Documents (12):**
1. Repository Structure Plan
2. Development Environment Plan
3. Engineering Standards
4. Testing Strategy
5. CI/CD and Quality Gate Plan
6. Database Migration Workflow
7. Security Engineering Controls
8. AI/ML Development Operations Plan
9. Observability and Operational Readiness
10. Development Infrastructure Implementation Sequence
11. Open Decisions and Assumptions (Updated)
12. Project Status (Updated)

**Total: 38 documents across 3 stages.**`
    },
    {
      id: 'PS3-3',
      title: '3. Key Engineering Decisions Proposed',
      content: `**Repository:**
- Monorepo with pnpm workspaces + Turborepo
- apps/ (web, workers, ml-services), packages/ (shared), modules/ (business)
- Clear module boundaries, no circular imports

**Development Environment:**
- Node.js 20 LTS, pnpm 9, Python 3.11+
- PostgreSQL 15+ with RLS, Redis 7+
- Docker Compose for local services
- Environment variables via .env files

**Engineering Standards:**
- Strict TypeScript (no any, no ts-ignore)
- Zod for validation, Prisma for database
- Layered architecture (types → schemas → services → repository → API)
- Comprehensive error handling with typed errors

**Testing:**
- Vitest for unit/integration
- Playwright for E2E
- Security tests for tenant isolation
- Coverage requirements: 90%+ business logic, 80%+ APIs

**CI/CD:**
- GitHub Actions for all pipelines
- Pre-merge: lint, typecheck, unit tests, security scan
- Post-merge: full tests, staging deployment
- Production: manual approval, smoke tests, monitoring

**Database:**
- Prisma migrations, version-controlled
- Backward-compatible changes only
- Tested against representative data
- Rollback procedures documented

**Security:**
- RLS + middleware tenant isolation
- Permission checks at every layer
- Audit logging for all sensitive operations
- Secret scanning in CI

**AI/ML:**
- Python services separate from TypeScript app
- Model and dataset versioning
- Reproducible training with experiment tracking
- Safety controls for AI assistant

**Observability:**
- Structured JSON logging
- Metrics for HTTP, business, database, ML
- Alerting with severity levels
- Backup and recovery procedures`
    },
    {
      id: 'PS3-4',
      title: '4. What Was Inspected',
      content: `**Existing Repository Inspection:**
- package.json: Vite + React 18 + TypeScript 5.7 + Tailwind CSS 4
- Dependencies: Supabase client, dnd-kit, framer-motion, lucide-react, recharts, date-fns, uuid
- Dev dependencies: Vite, React plugins, Tailwind, TypeScript
- Scripts: dev, build, typecheck
- No ESLint, Prettier, testing frameworks, CI/CD, Docker, backend code, or database setup

**Conclusion:**
- Current repository is a documentation viewer (Stages 1-2 output)
- Not the actual ClickIT platform codebase
- Stage 3 plan assumes building platform from scratch in new monorepo
- Existing UI libraries could be reused for platform frontend`
    },
    {
      id: 'PS3-5',
      title: '5. Conflicts with Previous Stages',
      content: `**No Conflicts Found:**
- Stage 3 plan is consistent with Stage 1 requirements
- Stage 3 plan is consistent with Stage 2 architecture decisions
- All proposed tools align with approved technology direction
- Repository structure supports modular monolith architecture
- Testing strategy covers all security requirements
- CI/CD pipeline enforces all engineering standards

**Clarifications:**
- Current repository is documentation viewer, not platform codebase
- Platform will be built in new monorepo structure
- Existing documentation viewer can be preserved or migrated`
    },
    {
      id: 'PS3-6',
      title: '6. Recommended Next Stage',
      content: `**Next Phase:** Phase 4 — UI/UX Design System and Screen Inventory

**Phase 4 Scope:**
- Design system (colors, typography, spacing, components)
- Component library (buttons, forms, tables, modals, etc.)
- Screen inventory for all modules
- Interaction patterns and flows
- Accessibility patterns
- Responsive design strategy
- Storybook for component documentation

**Prerequisites for Phase 4:**
- Stage 3 documentation approved
- Technology stack decisions confirmed (ADR-001 through ADR-006)
- Repository structure approved
- Development environment plan approved

**STOPPING POINT:** Stage 3 documentation is complete. Awaiting explicit instruction to proceed to Phase 4 or to modify any planning decisions.

**No implementation files or infrastructure were created or modified during this stage.**`
    }
  ]
};
