# Multi-Tenant Security Controls

**Document ID:** SEC-7.4  
**Stage:** 7 — Security, Identity, Permissions, Privacy, and Audit Design  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the comprehensive security controls for multi-tenant isolation in the ClickIT platform. Multi-tenant isolation is the most critical security requirement, ensuring that one tenant cannot access another tenant's private information through any access path.

**Key Principles:**
- Defense-in-depth with multiple isolation layers
- Tenant context established at authentication
- Every data access validated against tenant scope
- No client-side tenant ID trust
- Comprehensive testing of isolation boundaries
- Complete audit trail for all tenant-scoped operations

---

## 2. Tenant Isolation Architecture

### 2.1 Three-Layer Defense Model

**Layer 1: Database Row-Level Security (RLS)**
- PostgreSQL RLS policies on all tenant-owned tables
- Automatic enforcement at database level
- Cannot be bypassed by application bugs
- Performance overhead minimal with proper indexing

**Layer 2: Application Middleware**
- Tenant context extraction from session
- Automatic tenant filtering on all queries
- Request-level validation
- Centralized enforcement point

**Layer 3: Service-Level Explicit Checks**
- Explicit tenant validation in service methods
- Defense-in-depth against middleware bypass
- Clear authorization boundaries
- Audit trail at service level

### 2.2 Tenant Context Flow

```
1. User Authentication
   ↓
2. Session Creation (includes tenantId)
   ↓
3. Request Received
   ↓
4. Middleware Extracts tenantId from Session
   ↓
5. Middleware Sets Database Context
   ↓
6. RLS Policies Activate
   ↓
7. Service Methods Execute
   ↓
8. All Queries Filtered by tenantId
   ↓
9. Response Contains Only Tenant's Data
```

---

## 3. Database-Level Isolation

### 3.1 Row-Level Security (RLS) Policies

**RLS Policy Template:**
```sql
-- Enable RLS on tenant-owned table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation ON leads
  USING (organization_id = current_setting('app.current_tenant')::UUID);

-- Create policy for each tenant-owned table
-- Repeat for: contacts, companies, opportunities, invoices, etc.
```

**RLS Policy Requirements:**
- Every tenant-owned table must have RLS enabled
- Policy must check organization_id against session variable
- Policy must be tested for every table
- Policy must not have exceptions

**Session Variable Management:**
```sql
-- Set tenant context at start of request
SET LOCAL app.current_tenant = 'tenant-uuid-here';

-- Verify context is set
SELECT current_setting('app.current_tenant');

-- Context automatically resets at end of transaction
```

### 3.2 Database User Privileges

**Application Database User:**
- Cannot bypass RLS policies
- Cannot disable RLS
- Cannot modify RLS policies
- Limited to SELECT, INSERT, UPDATE, DELETE on tenant tables
- No DROP, TRUNCATE, or ALTER privileges

**Migration Database User:**
- Separate user for schema migrations
- Elevated privileges for DDL operations
- Used only during deployment
- Not used by application

**Audit:**
- All database access logged
- Privilege changes audited
- RLS policy changes tracked

### 3.3 Cross-Tenant Foreign Key Prevention

**Rule:** No foreign keys between tenants

**Implementation:**
```sql
-- All tenant-owned tables include organization_id
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,  -- Tenant identifier
  -- ... other fields
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- RLS ensures organization_id matches session
-- No cross-tenant foreign keys possible
```

**Validation:**
- Automated tests verify no cross-tenant FKs
- Schema review checks for violations
- Database constraints enforce tenant boundaries

---

## 4. Application-Level Isolation

### 4.1 Tenant Context Middleware

**Middleware Implementation:**
```typescript
export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. Get session
  const session = await getSession(req);
  
  if (!session) {
    throw new UnauthorizedError('No active session');
  }
  
  // 2. Extract tenant from session (NEVER from client)
  const tenantId = session.organizationId;
  
  if (!tenantId) {
    throw new UnauthorizedError('No organization in session');
  }
  
  // 3. Verify tenant is active
  const tenant = await getOrganization(tenantId);
  if (tenant.status !== 'active') {
    throw new ForbiddenError('Organization is not active');
  }
  
  // 4. Verify user membership
  const membership = await getMembership(session.userId, tenantId);
  if (!membership || membership.status !== 'active') {
    throw new ForbiddenError('User is not a member of this organization');
  }
  
  // 5. Set database context
  await db.setTenantContext(tenantId);
  
  // 6. Attach to request
  req.tenantId = tenantId;
  req.userId = session.userId;
  req.membership = membership;
  
  next();
}
```

**Middleware Application:**
```typescript
// Apply to all protected routes
app.use('/api/*', tenantMiddleware);
app.use('/app/*', tenantMiddleware);

// Exclude public routes
app.use('/api/auth/login', loginHandler);
app.use('/api/auth/register', registerHandler);
```

### 4.2 Service-Level Tenant Checks

**Service Method Pattern:**
```typescript
async function getLead(
  leadId: string,
  context: AuthContext
): Promise<Lead> {
  // Explicit tenant check (defense-in-depth)
  const lead = await db.lead.findFirst({
    where: {
      id: leadId,
      organizationId: context.tenantId  // Explicit filter
    }
  });
  
  if (!lead) {
    throw new NotFoundError('Lead not found');
  }
  
  // Permission check
  if (!await canUser(context.userId, 'read', lead)) {
    throw new ForbiddenError('User cannot read this lead');
  }
  
  return lead;
}
```

**Why Explicit Checks?**
- Defense-in-depth against middleware bypass
- Clear authorization boundaries
- Easier to audit and test
- Protects against future middleware changes

### 4.3 Query Builder Tenant Enforcement

**Automatic Tenant Filtering:**
```typescript
// Query builder automatically adds tenant filter
async function findLeads(context: AuthContext): Promise<Lead[]> {
  return await db.lead.findMany({
    where: {
      organizationId: context.tenantId  // Automatically added
    }
  });
}
```

**Custom Queries:**
```typescript
// Custom queries must include tenant filter
async function customLeadQuery(context: AuthContext): Promise<Lead[]> {
  return await db.$queryRaw`
    SELECT * FROM leads
    WHERE organization_id = ${context.tenantId}
  `;
}
```

---

## 5. Tenant Isolation by Access Path

### 5.1 Web Pages and Frontend Requests

**Isolation Mechanism:**
- Session cookie contains tenantId
- Middleware validates tenant on every request
- Frontend receives only tenant's data
- No tenant ID in URLs or client state

**Security Controls:**
- HttpOnly, Secure, SameSite cookies
- CSRF protection on all state changes
- Tenant context in all API calls
- No client-side tenant switching without re-auth

### 5.2 Backend APIs and Server Actions

**Isolation Mechanism:**
- Tenant extracted from session
- Middleware validates tenant
- All queries filtered by tenant
- Response contains only tenant's data

**Security Controls:**
- No tenantId in request parameters
- Tenant validation in middleware
- Explicit tenant checks in services
- Audit log for all API calls

### 5.3 Database Queries and Transactions

**Isolation Mechanism:**
- RLS policies enforce tenant isolation
- Session variable sets tenant context
- All queries filtered at database level
- Cannot bypass RLS without elevated privileges

**Security Controls:**
- RLS on all tenant tables
- Parameterized queries (no SQL injection)
- Transaction-scoped tenant context
- Database user privilege restrictions

### 5.4 Search and Global Lookup

**Isolation Mechanism:**
- Search index scoped by tenant
- Search queries include tenant filter
- Results filtered by tenant
- No cross-tenant search results

**Security Controls:**
- Tenant-scoped search indexes
- Tenant filter in all search queries
- Search result validation
- Audit log for search operations

### 5.5 Dashboards, Reports, and Analytics

**Isolation Mechanism:**
- Dashboard data queries filtered by tenant
- Report generation scoped to tenant
- Analytics calculations use tenant data only
- No cross-tenant data in reports

**Security Controls:**
- Tenant filter in all analytics queries
- Report access requires tenant membership
- Analytics audit log
- Data scope enforcement (own/team/dept/org)

### 5.6 Document Storage and File Downloads

**Isolation Mechanism:**
- Files stored with tenant prefix
- File access requires tenant validation
- Download URLs include tenant context
- No direct file access without authorization

**Security Controls:**
- Tenant-scoped file paths
- File access authorization check
- Temporary signed URLs with tenant context
- File access audit log

**File Storage Structure:**
```
/tenant-{tenantId}/
  /documents/
    /{documentId}.pdf
  /attachments/
    /{attachmentId}.jpg
```

### 5.7 Background Jobs and Scheduled Tasks

**Isolation Mechanism:**
- Every job includes tenantId
- Job execution sets tenant context
- Job queries filtered by tenant
- No cross-tenant job processing

**Security Controls:**
- TenantId required in job payload
- Tenant context set before job execution
- Job authorization validates tenant
- Job execution audit log

**Job Payload Structure:**
```typescript
interface JobPayload {
  tenantId: string;  // Required
  userId?: string;   // Optional (for user-triggered jobs)
  data: any;         // Job-specific data
}
```

### 5.8 Imports and Exports

**Isolation Mechanism:**
- Imports validated against tenant
- Exports filtered by tenant
- No cross-tenant data in imports/exports
- Import/export audit log

**Security Controls:**
- Import validation checks tenant ownership
- Export queries include tenant filter
- Import/export size limits
- Import/export rate limiting
- Complete audit trail

### 5.9 Notifications and Email Generation

**Isolation Mechanism:**
- Notifications scoped to tenant
- Email templates use tenant data only
- No cross-tenant data in notifications
- Notification audit log

**Security Controls:**
- Tenant filter in notification queries
- Email templates validated for tenant
- Notification rate limiting
- Notification audit log

### 5.10 Integrations and Webhooks

**Isolation Mechanism:**
- Integration credentials scoped to tenant
- Webhook payloads filtered by tenant
- No cross-tenant integration data
- Integration audit log

**Security Controls:**
- Tenant-scoped integration credentials
- Webhook signature verification
- Webhook payload validation
- Integration access audit log

### 5.11 AI Context Retrieval and Model Inference

**Isolation Mechanism:**
- AI context retrieval filtered by tenant
- Model inference uses tenant data only
- No cross-tenant training data
- AI access audit log

**Security Controls:**
- Tenant filter in AI context queries
- Authorization before data reaches AI
- No cross-tenant model training
- AI access audit log
- Prompt injection prevention

### 5.12 Caches and Shared Intermediate Storage

**Isolation Mechanism:**
- Cache keys include tenantId
- Cache access requires tenant context
- No shared caches without tenant isolation
- Cache invalidation on tenant changes

**Security Controls:**
- Tenant-scoped cache keys: `tenant:{tenantId}:key`
- Cache access validation
- Cache TTL per tenant
- Cache audit log

**Cache Key Pattern:**
```typescript
const cacheKey = `tenant:${tenantId}:lead:${leadId}`;
```

### 5.13 Logs, Traces, and Operational Tooling

**Isolation Mechanism:**
- Logs include tenantId for tenant operations
- Log access restricted by tenant
- No cross-tenant log access
- Log retention per tenant

**Security Controls:**
- TenantId in all tenant operation logs
- Log access authorization
- Log anonymization for support
- Log retention policies

---

## 6. Tenant Context Propagation

### 6.1 Request Context

**Context Object:**
```typescript
interface AuthContext {
  userId: string;
  tenantId: string;
  membership: Membership;
  permissions: Permission[];
  ipAddress: string;
  userAgent: string;
  sessionId: string;
}
```

**Context Propagation:**
```typescript
// Create context from request
async function createContext(req: Request): Promise<AuthContext> {
  const session = await getSession(req);
  const membership = await getMembership(session.userId, session.organizationId);
  const permissions = await getUserPermissions(session.userId, session.organizationId);
  
  return {
    userId: session.userId,
    tenantId: session.organizationId,
    membership,
    permissions,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    sessionId: session.id
  };
}

// Pass context through call chain
async function createLead(data: CreateLeadInput, context: AuthContext) {
  // Context includes tenantId
  return await leadService.create(data, context);
}
```

### 6.2 Background Job Context

**Job Context:**
```typescript
interface JobContext {
  tenantId: string;
  userId?: string;
  jobId: string;
  scheduledAt: Date;
}

// Job execution with context
async function executeJob(payload: JobPayload) {
  const context: JobContext = {
    tenantId: payload.tenantId,
    userId: payload.userId,
    jobId: generateJobId(),
    scheduledAt: new Date()
  };
  
  // Set database tenant context
  await db.setTenantContext(context.tenantId);
  
  // Execute job with context
  await jobHandler(payload.data, context);
}
```

### 6.3 Async Local Storage

**Context Storage:**
```typescript
import { AsyncLocalStorage } from 'async_hooks';

const contextStorage = new AsyncLocalStorage<AuthContext>();

// Set context for request
app.use(async (req, res, next) => {
  const context = await createContext(req);
  contextStorage.run(context, () => {
    next();
  });
});

// Access context anywhere in request chain
function getCurrentContext(): AuthContext {
  const context = contextStorage.getStore();
  if (!context) {
    throw new Error('No context available');
  }
  return context;
}
```

---

## 7. Tenant Isolation Testing

### 7.1 Automated Isolation Tests

**Test Pattern:**
```typescript
describe('Tenant Isolation', () => {
  const entities = [
    'Lead', 'Contact', 'Company', 'Opportunity',
    'Invoice', 'Payment', 'Expense', 'Product'
  ];
  
  for (const entity of entities) {
    describe(entity, () => {
      it('should prevent cross-tenant read access', async () => {
        // Setup
        const tenant1 = await createTenant();
        const tenant2 = await createTenant();
        const user1 = await createUser(tenant1.id);
        const user2 = await createUser(tenant2.id);
        const record = await createRecord(entity, tenant1.id);
        
        // Test
        await expect(
          getRecord(entity, record.id, user2)
        ).rejects.toThrow(NotFoundError);
      });
      
      it('should prevent cross-tenant write access', async () => {
        // Setup
        const tenant1 = await createTenant();
        const tenant2 = await createTenant();
        const user2 = await createUser(tenant2.id);
        const record = await createRecord(entity, tenant1.id);
        
        // Test
        await expect(
          updateRecord(entity, record.id, {}, user2)
        ).rejects.toThrow(NotFoundError);
      });
      
      it('should prevent cross-tenant delete access', async () => {
        // Setup
        const tenant1 = await createTenant();
        const tenant2 = await createTenant();
        const user2 = await createUser(tenant2.id);
        const record = await createRecord(entity, tenant1.id);
        
        // Test
        await expect(
          deleteRecord(entity, record.id, user2)
        ).rejects.toThrow(NotFoundError);
      });
    });
  }
});
```

### 7.2 Database RLS Tests

**RLS Validation:**
```typescript
describe('Row-Level Security', () => {
  it('should enforce RLS on all tenant tables', async () => {
    const tenantTables = await getTenantTables();
    
    for (const table of tenantTables) {
      const rlsEnabled = await isRLSEnabled(table);
      expect(rlsEnabled).toBe(true);
    }
  });
  
  it('should prevent direct SQL access across tenants', async () => {
    const tenant1 = await createTenant();
    const tenant2 = await createTenant();
    const record = await createRecord('Lead', tenant1.id);
    
    // Try to access with wrong tenant context
    await db.setTenantContext(tenant2.id);
    const result = await db.$queryRaw`
      SELECT * FROM leads WHERE id = ${record.id}
    `;
    
    expect(result).toHaveLength(0);
  });
});
```

### 7.3 Integration Tests

**Cross-Tenant API Tests:**
```typescript
describe('Cross-Tenant API Access', () => {
  it('should reject API calls with wrong tenant', async () => {
    const tenant1 = await createTenant();
    const tenant2 = await createTenant();
    const user1 = await createUser(tenant1.id);
    const record = await createRecord('Lead', tenant1.id);
    
    // Try to access with tenant2's session
    const session2 = await createSession(user1, tenant2.id);
    
    const response = await api.get(`/leads/${record.id}`, {
      headers: { Cookie: session2.cookie }
    });
    
    expect(response.status).toBe(404);
  });
});
```

---

## 8. Tenant Lifecycle Security

### 8.1 Tenant Creation

**Creation Process:**
1. Platform admin creates organization
2. Generate unique tenant ID
3. Create organization record
4. Create initial admin user
5. Set up tenant-specific configuration
6. Log creation event

**Security Checks:**
- Unique slug validation
- Admin user creation
- Initial role assignment
- Tenant context initialization

### 8.2 Tenant Suspension

**Suspension Process:**
1. Platform admin suspends tenant
2. Invalidate all active sessions
3. Block all API access
4. Preserve data (no deletion)
5. Log suspension event

**Security Checks:**
- Session revocation
- API access blocking
- Data preservation
- Suspension audit log

### 8.3 Tenant Reactivation

**Reactivation Process:**
1. Platform admin reactivates tenant
2. Restore API access
3. Notify tenant admin
4. Log reactivation event

**Security Checks:**
- Access restoration
- Admin notification
- Reactivation audit log

### 8.4 Tenant Deletion

**Deletion Process:**
1. Platform admin initiates deletion
2. Soft delete (mark as deleted)
3. Wait retention period (30 days)
4. Hard delete all tenant data
5. Log deletion event

**Security Checks:**
- Data deletion verification
- Cascade deletion of related records
- Audit log preservation (anonymized)
- Deletion confirmation

### 8.5 Tenant Data Export

**Export Process:**
1. Tenant admin requests export
2. Validate export permission
3. Generate export package
4. Encrypt export package
5. Provide secure download link
6. Log export event

**Security Checks:**
- Export authorization
- Data encryption
- Secure download
- Export audit log

---

## 9. Monitoring and Detection

### 9.1 Tenant Isolation Monitoring

**Monitoring Metrics:**
- Cross-tenant access attempts
- RLS policy violations
- Tenant context errors
- Unauthorized tenant switching

**Alerts:**
- Cross-tenant access attempt → Critical alert
- RLS violation → Critical alert
- Tenant context error → High alert
- Unusual tenant switching → Medium alert

### 9.2 Anomaly Detection

**Detection Patterns:**
- User accessing multiple tenants rapidly
- Unusual query patterns
- Bulk data access attempts
- Off-hours access patterns

**Response:**
- Low risk: Log and monitor
- Medium risk: Require re-authentication
- High risk: Block access, notify admin
- Critical risk: Lock account, investigate

---

## 10. Security Acceptance Criteria

### 10.1 Tenant Isolation Requirements

**Must Have:**
- No cross-tenant data access via API
- No cross-tenant data access via database
- No cross-tenant data access via background jobs
- No cross-tenant data access via AI/ML
- No cross-tenant data access via caches
- Complete audit trail for all tenant operations

**Testing Requirements:**
- Automated tenant isolation tests for every entity
- Database RLS tests for every tenant table
- Cross-tenant API access tests
- Background job tenant isolation tests
- AI tenant isolation tests

### 10.2 Release Blocking Conditions

**Cannot Release If:**
- Any cross-tenant access test fails
- RLS not enabled on any tenant table
- Tenant context not set in middleware
- Audit logging incomplete for tenant operations
- Tenant isolation not verified in integration tests

---

## 11. References

- Stage 2: Tenancy and Authorization Architecture
- Stage 3: Security Engineering Controls
- Stage 5: Data Architecture Plan
- PostgreSQL Row-Level Security Documentation
- NIST SP 800-53 (Security and Privacy Controls)
- ISO 27017 (Cloud Security)

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Security Architect
