# Approved Technology and Architecture Baseline

**Document ID:** ARCH-18.3  
**Stage:** 18 — Final Implementation Blueprint  
**Status:** ✅ Approved  
**Version:** 1.0  
**Date:** 2026-01-29  
**Author:** ClickIT Architecture Team  
**Approvers:** Engineering Lead, Security Lead, Product Owner

---

## Executive Summary

This document establishes the approved technology stack and architectural baseline for the ClickIT platform. All implementation must conform to these decisions unless formally changed through the change control process.

**Key Decisions:**
- ✅ **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- ✅ **UI Components:** Shadcn UI component library
- ✅ **Backend:** Modular monolith (Node.js/TypeScript)
- ✅ **Database:** PostgreSQL 15+ with Prisma ORM
- ✅ **Authentication:** To be decided (Supabase Auth or custom JWT)
- ✅ **Authorization:** Custom RBAC + ABAC implementation
- ✅ **Deployment:** To be decided (Vercel, Railway, or similar)
- ⏳ **AI/ML Service:** Deferred to Phase 2+ (Python/FastAPI)

---

## 1. Technology Stack

### 1.1 Frontend Technologies (Approved)

| Technology | Version | Purpose | Status | Rationale |
|------------|---------|---------|--------|-----------|
| **React** | 18.2.0 | UI framework | ✅ Approved | Industry standard, large ecosystem, team familiarity |
| **Vite** | 6.3.5 | Build tool | ✅ Approved | Fast builds, HMR, modern tooling |
| **TypeScript** | 5.7.0 | Type safety | ✅ Approved | Strict mode, catch errors early |
| **Tailwind CSS** | 4.1.7 | Styling | ✅ Approved | Utility-first, consistent design, rapid development |
| **Shadcn UI** | Latest | Component library | ✅ Approved | Accessible, customizable, consistent with Tailwind |
| **React Router** | 6.8.0 | Routing | ✅ Approved | Industry standard, declarative routing |
| **React Hook Form** | Latest | Form handling | ⏳ To be added | Performance, validation, ease of use |
| **Zod** | Latest | Schema validation | ⏳ To be added | Type-safe validation, runtime checking |
| **Lucide React** | 0.294.0 | Icons | ✅ Approved | Consistent icon set, tree-shakeable |
| **date-fns** | 2.30.0 | Date utilities | ✅ Approved | Lightweight, functional, tree-shakeable |
| **Recharts** | 2.10.0 | Charts | ✅ Approved | React-native, customizable, accessible |

**Alternatives Considered:**
- **Next.js:** Rejected for MVP due to complexity, can migrate later if needed
- **Vue.js:** Rejected due to team familiarity with React
- **Styled Components:** Rejected in favor of Tailwind for consistency
- **Material UI:** Rejected in favor of Shadcn for customization

### 1.2 Backend Technologies (Approved)

| Technology | Version | Purpose | Status | Rationale |
|------------|---------|---------|--------|-----------|
| **Node.js** | 20 LTS | Runtime | ✅ Approved | JavaScript ecosystem, team familiarity |
| **Express/Fastify** | Latest | API framework | ⏳ To be decided | Lightweight, flexible, well-documented |
| **PostgreSQL** | 15+ | Database | ✅ Approved | Robust, ACID compliance, JSON support, RLS |
| **Prisma** | Latest | ORM | ✅ Approved | Type-safe, migrations, excellent DX |
| **Redis** | 7+ | Caching/Queue | ⏳ To be added | Fast, versatile, pub/sub support |
| **BullMQ** | Latest | Job queue | ⏳ To be added | Reliable, Redis-based, feature-rich |

**Alternatives Considered:**
- **MongoDB:** Rejected due to need for relational data, transactions
- **MySQL:** Rejected in favor of PostgreSQL for advanced features
- **TypeORM:** Rejected in favor of Prisma for better DX
- **Sequelize:** Rejected in favor of Prisma for type safety

### 1.3 Infrastructure Technologies (To Be Decided)

| Technology | Purpose | Options | Decision Required |
|------------|---------|---------|-------------------|
| **Hosting** | Application deployment | Vercel, Railway, Fly.io, AWS | ⏳ Pending |
| **Database Hosting** | PostgreSQL hosting | Supabase, Neon, AWS RDS, managed | ⏳ Pending |
| **Authentication** | User authentication | Supabase Auth, Auth0, custom JWT | ⏳ Pending |
| **File Storage** | File/document storage | Cloudflare R2, AWS S3, Supabase Storage | ⏳ Pending |
| **Email Service** | Transactional emails | Resend, SendGrid, AWS SES | ⏳ Pending |
| **Monitoring** | Error tracking, APM | Sentry, Datadog, New Relic | ⏳ Pending |
| **CI/CD** | Continuous integration | GitHub Actions, GitLab CI, CircleCI | ⏳ Pending |

**Decision Criteria:**
- Cost-effectiveness for MVP
- Ease of integration
- Scalability for growth
- Team familiarity
- Security and compliance
- Support and documentation

### 1.4 AI/ML Technologies (Deferred)

| Technology | Version | Purpose | Status | Rationale |
|------------|---------|---------|--------|-----------|
| **Python** | 3.11+ | ML runtime | ⏳ Deferred | Industry standard for ML |
| **FastAPI** | Latest | ML service API | ⏳ Deferred | Fast, async, type-safe |
| **scikit-learn** | Latest | Traditional ML | ⏳ Deferred | Robust, well-documented |
| **PyTorch** | Latest | Deep learning | ⏳ Deferred | Flexible, research-friendly |
| **OpenAI API** | Latest | LLM integration | ⏳ Deferred | State-of-the-art models |
| **LangChain** | Latest | LLM orchestration | ⏳ Deferred | Framework for LLM apps |

**Decision Timeline:** Phase 2+ (after MVP validation)

---

## 2. Architecture Pattern

### 2.1 Modular Monolith (Approved)

**Architecture Style:** Modular monolith with clear module boundaries

**Rationale:**
- Simpler than microservices for MVP
- Easier to test and deploy
- Can extract services later if needed
- Reduces operational complexity
- Faster development velocity

**Module Structure:**

```
src/
├── app/                      # Application shell
│   ├── routes/              # Route definitions
│   ├── layouts/             # Layout components
│   └── providers/           # Context providers
│
├── features/                # Feature modules
│   ├── auth/               # Authentication module
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # Business logic
│   │   ├── api/            # API calls
│   │   └── types/          # TypeScript types
│   │
│   ├── organizations/      # Organization management
│   ├── users/              # User management
│   ├── crm/                # CRM module
│   │   ├── leads/          # Lead management
│   │   ├── contacts/       # Contact management
│   │   ├── companies/      # Company management
│   │   └── activities/     # Activity tracking
│   │
│   ├── sales/              # Sales module
│   │   ├── opportunities/  # Opportunity management
│   │   ├── pipeline/       # Pipeline visualization
│   │   ├── quotations/     # Quotation management
│   │   └── orders/         # Order management
│   │
│   ├── inventory/          # Inventory module
│   │   ├── products/       # Product catalog
│   │   ├── stock/          # Stock management
│   │   ├── movements/      # Stock movements
│   │   └── adjustments/    # Stock adjustments
│   │
│   ├── finance/            # Finance module
│   │   ├── invoices/       # Invoice management
│   │   ├── payments/       # Payment recording
│   │   └── expenses/       # Expense tracking
│   │
│   ├── tasks/              # Task management
│   ├── analytics/          # Analytics module
│   │   ├── metrics/        # Metric definitions
│   │   ├── dashboards/     # Dashboard components
│   │   └── reports/        # Report generation
│   │
│   └── admin/              # Administration module
│
├── shared/                 # Shared utilities
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Shadcn components
│   │   ├── forms/         # Form components
│   │   ├── tables/        # Table components
│   │   └── layouts/       # Layout components
│   │
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utility functions
│   ├── types/             # Shared types
│   └── constants/         # Shared constants
│
├── server/                # Server-side logic (if separate)
│   ├── api/               # API endpoints
│   ├── services/          # Business logic
│   ├── repositories/      # Data access
│   ├── middleware/         # Auth, validation, etc.
│   └── utils/             # Server utilities
│
└── config/                # Configuration
    ├── env.ts             # Environment variables
    ├── database.ts        # Database configuration
    └── constants.ts       # Application constants
```

### 2.2 Module Boundaries

**Boundary Rules:**
1. **No Circular Dependencies:** Modules cannot depend on each other circularly
2. **Explicit Interfaces:** Modules communicate through well-defined interfaces
3. **Shared Code in /shared:** Common utilities go in shared directory
4. **Feature Encapsulation:** Each feature module is self-contained
5. **Server/Client Separation:** Server logic separated from client logic

**Dependency Flow:**
```
app/ → features/ → shared/
                ↓
            server/
```

**Example: CRM Module Dependencies**
```typescript
// features/crm/leads/services/leadService.ts
import { db } from '@/server/repositories/database';
import { validateLead } from '@/shared/lib/validation';
import { Lead, CreateLeadInput } from '@/shared/types/lead';
import { auditLog } from '@/server/services/auditService';

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  // Validate input
  const validated = validateLead(input);
  
  // Create lead
  const lead = await db.lead.create({ data: validated });
  
  // Audit log
  await auditLog('lead.created', { leadId: lead.id });
  
  return lead;
}
```

### 2.3 Layer Separation

**Presentation Layer (UI):**
- React components
- State management (React Context, hooks)
- User interaction handling
- Form validation (client-side)
- Routing

**Application Layer (Services):**
- Business logic
- Use cases
- Workflow orchestration
- Authorization checks
- Transaction management

**Data Access Layer (Repositories):**
- Database queries
- Data transformation
- Caching
- External API calls

**Infrastructure Layer:**
- Database connection
- File storage
- Email sending
- Queue management
- External service integration

---

## 3. Security Architecture

### 3.1 Authentication (To Be Implemented)

**Requirements:**
- Secure password storage (bcrypt/argon2)
- JWT tokens with expiration
- Refresh token rotation
- Multi-factor authentication (optional)
- Session management
- Account recovery

**Implementation Options:**

**Option A: Supabase Auth**
- Pros: Quick setup, built-in features, managed service
- Cons: Vendor lock-in, limited customization
- Cost: Free tier available, paid for scale

**Option B: Custom JWT**
- Pros: Full control, no vendor lock-in, customizable
- Cons: More implementation effort, security responsibility
- Cost: Development time only

**Recommendation:** Start with Supabase Auth for MVP, migrate to custom if needed

### 3.2 Authorization (Custom Implementation)

**RBAC + ABAC Model:**

```typescript
// Shared types
interface Permission {
  action: 'create' | 'read' | 'update' | 'delete' | 'approve';
  resource: string;
  scope: 'own' | 'team' | 'department' | 'organization';
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface User {
  id: string;
  email: string;
  roles: Role[];
  organizationId: string;
}

// Authorization service
class AuthorizationService {
  async checkPermission(
    user: User,
    action: string,
    resource: string,
    resourceId?: string
  ): Promise<boolean> {
    // Check role permissions
    const hasPermission = user.roles.some(role =>
      role.permissions.some(p =>
        p.action === action && p.resource === resource
      )
    );
    
    if (!hasPermission) return false;
    
    // Check data scope
    if (resourceId) {
      const scope = await this.getDataScope(user, resource, resourceId);
      return this.isInScope(user, scope);
    }
    
    return true;
  }
}
```

### 3.3 Tenant Isolation

**Three-Layer Defense:**

**Layer 1: Database RLS**
```sql
-- Enable RLS on tenant tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation ON leads
  USING (organization_id = current_setting('app.current_tenant')::UUID);
```

**Layer 2: Application Middleware**
```typescript
// Middleware to set tenant context
async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.user?.organizationId;
  
  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Set tenant context for database
  await db.$executeRaw`SET LOCAL app.current_tenant = ${tenantId}`;
  
  next();
}
```

**Layer 3: Service-Level Checks**
```typescript
// Service-level tenant validation
async function getLead(leadId: string, userId: string) {
  const user = await getUser(userId);
  
  const lead = await db.lead.findFirst({
    where: {
      id: leadId,
      organizationId: user.organizationId // Explicit tenant check
    }
  });
  
  if (!lead) {
    throw new NotFoundError('Lead not found');
  }
  
  return lead;
}
```

### 3.4 Data Protection

**Encryption:**
- In transit: TLS 1.3 for all connections
- At rest: AES-256 for sensitive data
- Database: Encrypted connections
- Files: Encrypted storage

**Secrets Management:**
- Environment variables for configuration
- Secret manager for sensitive credentials
- No secrets in code or version control
- Regular rotation of secrets

**Audit Logging:**
```typescript
// Audit log service
class AuditService {
  async log(event: AuditEvent): Promise<void> {
    await db.auditLog.create({
      data: {
        eventType: event.type,
        userId: event.userId,
        organizationId: event.organizationId,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        metadata: event.metadata,
        timestamp: new Date(),
        ipAddress: event.ipAddress,
        userAgent: event.userAgent
      }
    });
  }
}
```

---

## 4. Data Architecture

### 4.1 Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Core entities
model Organization {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  industry    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       User[]
  roles       Role[]
  leads       Lead[]
  // ... other relations
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique
  passwordHash   String
  firstName      String
  lastName       String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  roles          UserRole[]
  leads          Lead[]     @relation("LeadOwner")
  // ... other relations
}

model Role {
  id             String   @id @default(uuid())
  name           String
  description    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  permissions    RolePermission[]
  users          UserRole[]
}

model Permission {
  id        String @id @default(uuid())
  action    String
  resource  String
  scope     String
  
  roles     RolePermission[]
}

model Lead {
  id             String   @id @default(uuid())
  firstName      String
  lastName       String
  email          String?
  phone          String?
  status         String   @default("new")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  ownerId        String?
  owner          User? @relation("LeadOwner", fields: [ownerId], references: [id])
  
  activities     Activity[]
  // ... other relations
}

// ... other models
```

### 4.2 Data Flow

**Write Flow:**
```
User Action → API Endpoint → Validation → Authorization → 
Business Logic → Database Transaction → Audit Log → Response
```

**Read Flow:**
```
User Request → API Endpoint → Authorization → Data Scope Filter → 
Database Query → Response
```

**Event Flow:**
```
Business Event → Event Publisher → Event Queue → Event Consumer → 
Side Effects → Audit Log
```

### 4.3 Data Quality

**Validation Layers:**
1. **Client-side:** Form validation, type checking
2. **API-level:** Request validation, schema checking
3. **Service-level:** Business rule validation
4. **Database-level:** Constraints, triggers

**Data Integrity:**
- Foreign key constraints
- Unique constraints
- Check constraints
- Transaction management
- Optimistic locking

---

## 5. API Architecture

### 5.1 API Design Principles

**RESTful Conventions:**
- Resource-based URLs: `/api/leads`, `/api/contacts`
- HTTP methods: GET, POST, PUT, PATCH, DELETE
- Status codes: 200, 201, 204, 400, 401, 403, 404, 500
- Consistent error format

**API Structure:**
```typescript
// API route structure
/api
  /auth
    POST /login
    POST /register
    POST /logout
    POST /refresh
  
  /organizations
    GET /
    POST /
    GET /:id
    PUT /:id
    DELETE /:id
  
  /users
    GET /
    POST /
    GET /:id
    PUT /:id
    DELETE /:id
  
  /leads
    GET /
    POST /
    GET /:id
    PUT /:id
    DELETE /:id
    POST /:id/convert
  
  // ... other resources
```

### 5.2 API Security

**Authentication:**
- JWT tokens in Authorization header
- Token expiration and refresh
- Rate limiting per user

**Authorization:**
- Permission checks on every endpoint
- Tenant isolation on every query
- Data scope enforcement

**Input Validation:**
```typescript
// Zod schema validation
import { z } from 'zod';

const CreateLeadSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional()
});

// API endpoint
app.post('/api/leads', async (req, res) => {
  try {
    const validated = CreateLeadSchema.parse(req.body);
    const lead = await leadService.create(validated, req.user);
    res.status(201).json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    throw error;
  }
});
```

---

## 6. Testing Architecture

### 6.1 Testing Strategy

**Test Types:**
- **Unit Tests:** Individual functions and components
- **Integration Tests:** Module interactions, API endpoints
- **E2E Tests:** Full user workflows
- **Security Tests:** Tenant isolation, authorization
- **Performance Tests:** Load testing, optimization

**Test Coverage Targets:**
- Business logic: 80% minimum
- API endpoints: 90% minimum
- Critical paths: 95% minimum
- Security tests: 100% required

### 6.2 Testing Tools

| Tool | Purpose | Status |
|------|---------|--------|
| **Vitest** | Unit and integration tests | ⏳ To be added |
| **React Testing Library** | Component tests | ⏳ To be added |
| **Playwright** | E2E tests | ⏳ To be added |
| **MSW** | API mocking | ⏳ To be added |
| **Factory Bot** | Test data generation | ⏳ To be added |

---

## 7. Deployment Architecture

### 7.1 Deployment Strategy

**Environments:**
- **Development:** Local development machines
- **Testing:** Automated testing environment
- **Staging:** Pre-production validation
- **Production:** Live customer environment

**Deployment Process:**
```
Code Commit → CI/CD Pipeline → Automated Tests → 
Build Artifacts → Deploy to Staging → Manual QA → 
Deploy to Production → Monitoring
```

### 7.2 Infrastructure Requirements

**Minimum Requirements:**
- Application server: 2 CPU, 4GB RAM
- Database: 2 CPU, 4GB RAM, 50GB storage
- Cache: 1 CPU, 2GB RAM
- File storage: Scalable object storage
- CDN: Global content delivery

**Scaling Strategy:**
- Horizontal scaling for application servers
- Vertical scaling for database
- Read replicas for analytics queries
- CDN for static assets

---

## 8. Monitoring and Observability

### 8.1 Monitoring Stack

**Application Monitoring:**
- Error tracking: Sentry
- Performance monitoring: APM tool
- Log aggregation: Centralized logging
- Metrics collection: Prometheus/Grafana

**Infrastructure Monitoring:**
- Server health: Cloud provider monitoring
- Database performance: Database monitoring
- Queue health: Queue monitoring
- API health: Health check endpoints

### 8.2 Alerting

**Alert Categories:**
- **Critical:** System down, data loss, security breach
- **High:** High error rate, slow performance
- **Medium:** Degraded performance, resource limits
- **Low:** Informational alerts

**Alert Channels:**
- Email for all alerts
- Slack for high/critical
- PagerDuty for critical

---

## 9. Architecture Decision Records

### ADR-001: Modular Monolith over Microservices

**Status:** ✅ Approved  
**Date:** 2026-01-29  
**Decision:** Use modular monolith architecture for MVP

**Context:**
- Platform needs to support multiple business modules
- Team is small (initially)
- Need fast development velocity
- May need to scale later

**Decision:**
- Start with modular monolith
- Clear module boundaries
- Can extract services later if needed

**Consequences:**
- ✅ Simpler deployment
- ✅ Faster development
- ✅ Easier testing
- ⚠️ May need to refactor for scale
- ⚠️ Single deployment unit

### ADR-002: PostgreSQL over MongoDB

**Status:** ✅ Approved  
**Date:** 2026-01-29  
**Decision:** Use PostgreSQL as primary database

**Context:**
- Need relational data model
- Need strong consistency
- Need complex queries
- Need row-level security

**Decision:**
- PostgreSQL 15+ for primary database
- Prisma ORM for type-safe queries
- RLS for tenant isolation

**Consequences:**
- ✅ Strong consistency
- ✅ Complex queries supported
- ✅ RLS for security
- ⚠️ Less flexible schema
- ⚠️ Requires migration planning

### ADR-003: React + Vite over Next.js

**Status:** ✅ Approved  
**Date:** 2026-01-29  
**Decision:** Use React + Vite for frontend

**Context:**
- Need fast development
- Team familiar with React
- MVP doesn't need SSR
- Can migrate later if needed

**Decision:**
- React 18 + Vite for frontend
- Client-side rendering
- Can add SSR later if needed

**Consequences:**
- ✅ Fast development
- ✅ Simple deployment
- ✅ Team familiarity
- ⚠️ No SSR for SEO
- ⚠️ May need migration later

---

## 10. Future Architecture Considerations

### 10.1 Migration to Microservices

**When to Consider:**
- Team grows beyond 10 developers
- Different modules need different scaling
- Need independent deployments
- Performance bottlenecks identified

**Migration Path:**
1. Identify service boundaries
2. Extract one module at a time
3. Implement API gateway
4. Migrate data gradually
5. Monitor and optimize

### 10.2 Adding Server-Side Rendering

**When to Consider:**
- SEO becomes important
- Need faster initial load
- Need better performance on low-end devices

**Migration Path:**
1. Evaluate Next.js migration
2. Identify SSR candidates
3. Implement incrementally
4. Test performance impact

### 10.3 Scaling Database

**When to Consider:**
- Query performance degrades
- Data volume exceeds single instance
- Need high availability

**Scaling Options:**
1. Read replicas for analytics
2. Connection pooling
3. Query optimization
4. Database sharding (last resort)

---

## 11. Compliance and Standards

### 11.1 Coding Standards

**TypeScript:**
- Strict mode enabled
- No `any` types
- Explicit return types
- Consistent naming conventions

**React:**
- Functional components only
- Hooks for state management
- Proper key usage in lists
- Accessibility considerations

**CSS:**
- Tailwind utilities preferred
- Consistent spacing scale
- Responsive design
- Dark mode support

### 11.2 Security Standards

**Authentication:**
- Strong password requirements
- Multi-factor authentication
- Session timeout
- Secure token storage

**Authorization:**
- Principle of least privilege
- Role-based access control
- Data scope enforcement
- Audit logging

**Data Protection:**
- Encryption in transit and at rest
- Secure secrets management
- Input validation
- Output encoding

---

## 12. References

**Related Documents:**
- FINAL_IMPLEMENTATION_BLUEPRINT.md
- AUTHORITATIVE_PROJECT_DOCUMENTATION_INDEX.md
- PHASED_IMPLEMENTATION_ROADMAP.md
- SECURITY_THREAT_MODEL.md (Stage 7)
- SYSTEM_ARCHITECTURE.md (Stage 2)

**External References:**
- React Documentation: https://react.dev
- TypeScript Documentation: https://www.typescriptlang.org
- Tailwind CSS Documentation: https://tailwindcss.com
- Prisma Documentation: https://www.prisma.io
- PostgreSQL Documentation: https://www.postgresql.org

---

## 13. Approval and Sign-Off

**Approved By:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Engineering Lead | | | |
| Security Lead | | | |
| Product Owner | | | |
| Data Lead | | | |

**Review Schedule:**
- Quarterly review of technology choices
- Annual architecture review
- Ad-hoc review for major changes

---

**Document Status:** ✅ Approved  
**Version:** 1.0  
**Last Updated:** 2026-01-29  
**Next Review:** 2026-04-29
