# Authorization and Permission Matrix

**Document ID:** SEC-7.3  
**Stage:** 7 — Security, Identity, Permissions, Privacy, and Audit Design  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the comprehensive authorization model for the ClickIT platform, combining Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) to provide granular, context-aware access control.

**Key Principles:**
- Least privilege by default
- Explicit authorization required for all operations
- Separation of duties for sensitive operations
- Configurable roles and permissions per organization
- Complete audit trail for all authorization decisions

---

## 2. Authorization Model Architecture

### 2.1 Combined RBAC + ABAC Model

**RBAC Components:**
- **Users:** Individual accounts with memberships
- **Roles:** Named permission sets (system or custom)
- **Permissions:** Atomic access rights (action + resource + scope)
- **Memberships:** User-organization associations with roles

**ABAC Components:**
- **Attributes:** User, resource, and environment properties
- **Conditions:** Logical expressions evaluating attributes
- **Context:** Request-time information (time, location, device)

**Authorization Decision Flow:**
```
1. Authenticate user → Get user context
2. Check RBAC → User has role with required permission?
3. Check ABAC → Conditions satisfied?
4. Check data scope → User can access this record?
5. Check approval → Is approval required and granted?
6. Allow or deny access
```

### 2.2 Permission Structure

**Permission Definition:**
```typescript
interface Permission {
  id: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'admin';
  resource: string;  // e.g., 'lead', 'invoice', 'user'
  scope: 'own' | 'team' | 'department' | 'branch' | 'organization';
  conditions?: ABACCondition[];
}

interface ABACCondition {
  attribute: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
}
```

**Permission Examples:**
- `crm:lead:create:own` — Create leads owned by user
- `crm:lead:read:team` — Read leads owned by team
- `finance:invoice:approve:organization` — Approve any invoice in organization
- `admin:user:admin:organization` — Administer users in organization

---

## 3. System Roles

### 3.1 Platform-Level Roles

**Platform Admin**
- **Scope:** Platform-wide
- **Permissions:**
  - Manage organizations (create, suspend, delete)
  - Manage platform settings
  - View platform analytics
  - Manage subscriptions
  - Access platform audit logs
- **Restrictions:**
  - Cannot access tenant business data by default
  - Requires explicit tenant consent for support access
  - All actions logged with enhanced audit

**Platform Support**
- **Scope:** Platform-wide (limited)
- **Permissions:**
  - View organization metadata (name, status, plan)
  - Access support tickets
  - View platform health metrics
- **Restrictions:**
  - No access to tenant business data
  - Temporary access requires tenant approval
  - Time-limited access grants

### 3.2 Organization-Level System Roles

**Organization Admin**
- **Scope:** Organization-wide
- **Permissions:**
  - Manage organization settings
  - Manage users and invitations
  - Manage roles and permissions
  - Manage branches and departments
  - Configure modules and workflows
  - View all organization data
  - Access organization audit logs
- **Restrictions:**
  - Cannot access Highly Restricted data without explicit permission
  - Cannot approve own transactions
  - All administrative actions logged

**Department Manager**
- **Scope:** Department-wide
- **Permissions:**
  - Manage department users
  - View department data
  - Approve department-level transactions
  - Manage department workflows
- **Restrictions:**
  - Cannot access other departments' data
  - Cannot modify organization settings
  - Limited to department scope

**Team Lead**
- **Scope:** Team-wide
- **Permissions:**
  - Manage team members
  - View team data
  - Assign team tasks
  - Approve team-level transactions
- **Restrictions:**
  - Cannot access other teams' data
  - Cannot modify department settings

**Standard User**
- **Scope:** Own records + shared records
- **Permissions:**
  - Create, read, update own records
  - Read shared records (based on sharing rules)
  - Participate in workflows
  - View assigned tasks
- **Restrictions:**
  - Cannot access other users' private data
  - Cannot approve transactions (unless delegated)
  - Limited to own scope

---

## 4. Permission Matrix by Module

### 4.1 CRM Module

| Permission | Description | Default Role | Scope |
|------------|-------------|--------------|-------|
| `crm:lead:create` | Create leads | Sales Rep | Own |
| `crm:lead:read` | View leads | Sales Rep | Own/Team |
| `crm:lead:update` | Edit leads | Sales Rep | Own |
| `crm:lead:delete` | Delete leads | Sales Manager | Own |
| `crm:lead:assign` | Assign leads | Sales Manager | Team |
| `crm:lead:export` | Export leads | Sales Manager | Team |
| `crm:contact:create` | Create contacts | Sales Rep | Own |
| `crm:contact:read` | View contacts | Sales Rep | Own/Team |
| `crm:contact:update` | Edit contacts | Sales Rep | Own |
| `crm:contact:delete` | Delete contacts | Sales Manager | Own |
| `crm:company:create` | Create companies | Sales Rep | Own |
| `crm:company:read` | View companies | Sales Rep | Organization |
| `crm:company:update` | Edit companies | Sales Manager | Own |
| `crm:activity:create` | Log activities | Sales Rep | Own |
| `crm:activity:read` | View activities | Sales Rep | Own/Team |

**Data Scope Rules:**
- Sales Rep: Own leads + team leads (if team lead)
- Sales Manager: All team leads
- Department Manager: All department leads
- Organization Admin: All organization leads

### 4.2 Sales Module

| Permission | Description | Default Role | Scope |
|------------|-------------|--------------|-------|
| `sales:opportunity:create` | Create opportunities | Sales Rep | Own |
| `sales:opportunity:read` | View opportunities | Sales Rep | Own/Team |
| `sales:opportunity:update` | Edit opportunities | Sales Rep | Own |
| `sales:opportunity:delete` | Delete opportunities | Sales Manager | Own |
| `sales:opportunity:approve:discount` | Approve discounts | Sales Manager | Organization |
| `sales:quotation:create` | Create quotations | Sales Rep | Own |
| `sales:quotation:read` | View quotations | Sales Rep | Own/Team |
| `sales:quotation:update` | Edit quotations | Sales Rep | Own |
| `sales:quotation:approve` | Approve quotations | Sales Manager | Organization |
| `sales:order:create` | Create orders | Sales Rep | Own |
| `sales:order:read` | View orders | Sales Rep | Own/Team |
| `sales:order:approve` | Approve orders | Finance Manager | Organization |
| `sales:contract:create` | Create contracts | Sales Manager | Own |
| `sales:contract:approve` | Approve contracts | Legal/Finance | Organization |

**Approval Requirements:**
- Discount > 10%: Sales Manager approval
- Discount > 20%: Finance Manager approval
- Quotation > $10,000: Sales Manager approval
- Quotation > $50,000: Finance Manager approval
- Contract: Legal review required

### 4.3 Finance Module

| Permission | Description | Default Role | Scope |
|------------|-------------|--------------|-------|
| `finance:invoice:create` | Create invoices | Accountant | Organization |
| `finance:invoice:read` | View invoices | Accountant | Organization |
| `finance:invoice:update` | Edit invoices | Accountant | Organization |
| `finance:invoice:approve` | Approve invoices | Finance Manager | Organization |
| `finance:invoice:delete` | Delete invoices | Finance Director | Organization |
| `finance:payment:create` | Record payments | Accountant | Organization |
| `finance:payment:read` | View payments | Accountant | Organization |
| `finance:payment:approve` | Approve payments | Finance Manager | Organization |
| `finance:expense:create` | Create expenses | Any User | Own |
| `finance:expense:read` | View expenses | Accountant | Organization |
| `finance:expense:approve` | Approve expenses | Manager | Department |
| `finance:budget:create` | Create budgets | Finance Manager | Organization |
| `finance:budget:approve` | Approve budgets | Finance Director | Organization |
| `finance:report:generate` | Generate reports | Accountant | Organization |
| `finance:report:export` | Export reports | Finance Manager | Organization |

**Approval Requirements:**
- Expense > $100: Manager approval
- Expense > $1,000: Department Manager approval
- Expense > $10,000: Finance Manager approval
- Payment > $5,000: Finance Manager approval
- Payment > $50,000: Finance Director approval
- Budget changes: Finance Director approval

**Separation of Duties:**
- Invoice creator cannot approve same invoice
- Expense submitter cannot approve own expense
- Payment recorder cannot approve own payment

### 4.4 Inventory Module

| Permission | Description | Default Role | Scope |
|------------|-------------|--------------|-------|
| `inventory:product:create` | Create products | Inventory Manager | Organization |
| `inventory:product:read` | View products | Any User | Organization |
| `inventory:product:update` | Edit products | Inventory Manager | Organization |
| `inventory:product:delete` | Delete products | Inventory Manager | Organization |
| `inventory:stock:adjust` | Adjust stock | Inventory Staff | Organization |
| `inventory:stock:read` | View stock levels | Any User | Organization |
| `inventory:purchase:create` | Create purchase orders | Procurement Officer | Organization |
| `inventory:purchase:approve` | Approve purchase orders | Procurement Manager | Organization |
| `inventory:supplier:create` | Create suppliers | Procurement Officer | Organization |
| `inventory:supplier:read` | View suppliers | Procurement Officer | Organization |
| `inventory:transfer:create` | Create stock transfers | Inventory Staff | Organization |
| `inventory:transfer:approve` | Approve transfers | Inventory Manager | Organization |

**Approval Requirements:**
- Purchase order > $1,000: Procurement Manager approval
- Purchase order > $10,000: Finance Manager approval
- Stock adjustment > 10% of stock: Inventory Manager approval
- Stock write-off: Finance Manager approval

### 4.5 Projects Module

| Permission | Description | Default Role | Scope |
|------------|-------------|--------------|-------|
| `projects:project:create` | Create projects | Project Manager | Department |
| `projects:project:read` | View projects | Team Member | Project |
| `projects:project:update` | Edit projects | Project Manager | Project |
| `projects:project:delete` | Delete projects | Department Manager | Department |
| `projects:task:create` | Create tasks | Project Manager | Project |
| `projects:task:read` | View tasks | Team Member | Project |
| `projects:task:update` | Edit tasks | Task Assignee | Own |
| `projects:task:assign` | Assign tasks | Project Manager | Project |
| `projects:time:create` | Log time | Team Member | Own |
| `projects:time:read` | View time entries | Project Manager | Project |
| `projects:time:approve` | Approve time | Project Manager | Project |
| `projects:budget:read` | View project budget | Project Manager | Project |
| `projects:budget:approve` | Approve budget changes | Department Manager | Department |

**Approval Requirements:**
- Project budget > $10,000: Department Manager approval
- Project budget > $50,000: Finance Manager approval
- Scope changes: Project sponsor approval
- Time entry corrections: Project Manager approval

### 4.6 HR Module

| Permission | Description | Default Role | Scope |
|------------|-------------|--------------|-------|
| `hr:employee:create` | Create employee records | HR Manager | Organization |
| `hr:employee:read` | View employee records | HR Staff | Department |
| `hr:employee:update` | Edit employee records | HR Manager | Organization |
| `hr:employee:delete` | Delete employee records | HR Director | Organization |
| `hr:salary:read` | View salary information | HR Manager | Own |
| `hr:salary:update` | Update salary | HR Director | Organization |
| `hr:leave:create` | Request leave | Any User | Own |
| `hr:leave:read` | View leave requests | Manager | Department |
| `hr:leave:approve` | Approve leave | Manager | Department |
| `hr:performance:create` | Create performance reviews | Manager | Department |
| `hr:performance:read` | View performance reviews | HR Manager | Department |
| `hr:training:create` | Create training records | HR Staff | Organization |
| `hr:training:read` | View training records | Any User | Own |

**Data Sensitivity:**
- Salary information: Highly Restricted
- Performance reviews: Confidential
- Medical information: Highly Restricted (if applicable)
- Personal contact info: Confidential

**Access Restrictions:**
- Managers can only see their direct reports' data
- HR staff can see department data
- HR Manager can see organization data
- Employees can only see own data

### 4.7 Support Module

| Permission | Description | Default Role | Scope |
|------------|-------------|--------------|-------|
| `support:case:create` | Create support cases | Any User | Own |
| `support:case:read` | View support cases | Support Agent | Assigned |
| `support:case:update` | Edit support cases | Support Agent | Assigned |
| `support:case:assign` | Assign cases | Support Manager | Organization |
| `support:case:resolve` | Resolve cases | Support Agent | Assigned |
| `support:case:delete` | Delete cases | Support Manager | Organization |
| `support:knowledge:create` | Create knowledge base | Support Agent | Organization |
| `support:knowledge:read` | View knowledge base | Any User | Organization |
| `support:knowledge:update` | Edit knowledge base | Support Manager | Organization |
| `support:sla:read` | View SLA metrics | Support Manager | Organization |

### 4.8 Analytics and BI Module

| Permission | Description | Default Role | Scope |
|------------|-------------|--------------|-------|
| `analytics:dashboard:read` | View dashboards | Any User | Scope-based |
| `analytics:dashboard:create` | Create dashboards | Analytics Admin | Organization |
| `analytics:dashboard:share` | Share dashboards | Analytics Admin | Organization |
| `analytics:report:generate` | Generate reports | Any User | Scope-based |
| `analytics:report:export` | Export reports | Manager | Department |
| `analytics:metric:read` | View metrics | Any User | Scope-based |
| `analytics:metric:create` | Create custom metrics | Analytics Admin | Organization |
| `analytics:data:export` | Export raw data | Finance Manager | Organization |

**Data Scope for Analytics:**
- Standard User: Own data only
- Team Lead: Team data
- Department Manager: Department data
- Organization Admin: Organization data
- Analytics Admin: Organization data (with audit)

**Export Restrictions:**
- Bulk data export requires explicit permission
- Sensitive data exports require approval
- All exports logged with full details
- Export size limits enforced

### 4.9 AI and Automation Module

| Permission | Description | Default Role | Scope |
|------------|-------------|--------------|-------|
| `ai:assistant:use` | Use AI assistant | Any User | Organization |
| `ai:recommendation:read` | View recommendations | Any User | Scope-based |
| `ai:recommendation:approve` | Approve AI recommendations | Manager | Department |
| `ai:automation:create` | Create automation rules | Automation Admin | Organization |
| `ai:automation:read` | View automation rules | Any User | Organization |
| `ai:automation:update` | Edit automation rules | Automation Admin | Organization |
| `ai:automation:execute` | Execute automations | System | N/A |
| `ai:model:read` | View model information | Analytics Admin | Organization |
| `ai:model:configure` | Configure models | AI Admin | Organization |

**AI Safety Controls:**
- AI cannot bypass authorization
- AI cannot access data outside user's scope
- High-risk AI actions require human approval
- All AI actions logged with full context
- AI cannot modify sensitive data without approval

### 4.10 Administration Module

| Permission | Description | Default Role | Scope |
|------------|-------------|--------------|-------|
| `admin:organization:update` | Update organization settings | Organization Admin | Organization |
| `admin:user:create` | Create users | Organization Admin | Organization |
| `admin:user:read` | View users | Organization Admin | Organization |
| `admin:user:update` | Edit users | Organization Admin | Organization |
| `admin:user:delete` | Delete users | Organization Admin | Organization |
| `admin:role:create` | Create roles | Organization Admin | Organization |
| `admin:role:read` | View roles | Organization Admin | Organization |
| `admin:role:update` | Edit roles | Organization Admin | Organization |
| `admin:role:delete` | Delete roles | Organization Admin | Organization |
| `admin:audit:read` | View audit logs | Organization Admin | Organization |
| `admin:integration:create` | Create integrations | Organization Admin | Organization |
| `admin:integration:read` | View integrations | Organization Admin | Organization |
| `admin:integration:update` | Edit integrations | Organization Admin | Organization |

---

## 5. Data Scope Enforcement

### 5.1 Scope Hierarchy

```
Organization (widest)
  └── Branch
      └── Department
          └── Team
              └── Own (narrowest)
```

### 5.2 Scope Resolution

**Scope Resolution Algorithm:**
```typescript
function resolveScope(user: User, requestedScope: DataScope): DataScope {
  // User's maximum scope based on roles
  const maxScope = getMaxScope(user.roles);
  
  // Return the more restrictive of requested and maximum
  return isMoreRestrictive(requestedScope, maxScope) 
    ? requestedScope 
    : maxScope;
}

function applyScope(query: Query, user: User, scope: DataScope): Query {
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
      return query; // Already filtered by tenant
  }
}
```

### 5.3 Multi-Role Scope Resolution

**When user has multiple roles:**
- Read operations: Use most permissive scope
- Write operations: Use most restrictive scope
- Approval operations: Use explicit approval permission

**Example:**
```typescript
// User has roles: Sales Rep (own), Sales Manager (team)
// Read leads: Can see team leads (most permissive)
// Create leads: Creates as own (most restrictive)
// Approve discounts: Requires explicit approval permission
```

---

## 6. Approval Workflows

### 6.1 Approval Types

**Financial Approvals:**
- Expense approvals
- Payment approvals
- Invoice approvals
- Budget approvals

**Operational Approvals:**
- Purchase order approvals
- Stock adjustment approvals
- Project budget approvals
- Leave approvals

**Administrative Approvals:**
- User role changes
- Permission changes
- Integration configuration
- Workflow changes

### 6.2 Approval Delegation

**Delegation Rules:**
- Approvers can delegate approval authority
- Delegation is time-limited (max 30 days)
- Delegated approvals logged with both users
- Cannot delegate to self
- Cannot delegate if already delegating

**Delegation Process:**
1. Approver creates delegation
2. Specify delegate user
3. Specify time period
4. Specify approval types
5. Delegate receives notification
6. Delegated approvals logged

### 6.3 Approval Escalation

**Escalation Rules:**
- If approval not received within timeout: Escalate
- Timeout configurable per approval type
- Escalation to next level or specific user
- Escalation logged and notified

**Escalation Process:**
1. Approval request created
2. Timer starts
3. If no action within timeout:
   - Escalate to next approver
   - Notify original approver
   - Notify escalated approver
4. Log escalation event

---

## 7. Separation of Duties

### 7.1 SoD Rules

**Financial SoD:**
- Invoice creator ≠ Invoice approver
- Expense submitter ≠ Expense approver
- Payment recorder ≠ Payment approver
- Budget creator ≠ Budget approver

**Procurement SoD:**
- Purchase requestor ≠ Purchase approver
- Receiver ≠ Payment approver
- Supplier manager ≠ Payment approver

**Administrative SoD:**
- User creator ≠ Role assigner (for sensitive roles)
- Integration creator ≠ Integration approver
- Audit log viewer ≠ Audit log modifier

### 7.2 SoD Enforcement

**Enforcement Mechanism:**
```typescript
function checkSeparationOfDuty(
  action: string,
  userId: string,
  resourceId: string
): boolean {
  // Check if user created the resource
  const resource = await getResource(resourceId);
  if (resource.createdById === userId) {
    return false; // Cannot approve own resource
  }
  
  // Check if user has conflicting roles
  const conflictingRoles = getConflictingRoles(action);
  if (userHasRoles(userId, conflictingRoles)) {
    return false; // Has conflicting roles
  }
  
  return true; // SoD satisfied
}
```

---

## 8. Permission Testing Requirements

### 8.1 Authorization Tests

**Test Categories:**
- Permission grant tests
- Permission denial tests
- Scope enforcement tests
- Multi-role resolution tests
- Approval workflow tests
- SoD enforcement tests
- Delegation tests

**Test Examples:**
```typescript
describe('Authorization', () => {
  it('should allow user with permission to access resource', async () => {
    const user = await createUserWithPermission('crm:lead:read');
    const lead = await createLead();
    
    const result = await getLead(lead.id, user);
    expect(result).toBeDefined();
  });
  
  it('should deny user without permission', async () => {
    const user = await createUserWithoutPermission('crm:lead:read');
    const lead = await createLead();
    
    await expect(getLead(lead.id, user)).rejects.toThrow(ForbiddenError);
  });
  
  it('should enforce data scope', async () => {
    const user = await createUserWithScope('own');
    const otherLead = await createLead({ createdById: otherUserId });
    
    await expect(getLead(otherLead.id, user)).rejects.toThrow(NotFoundError);
  });
  
  it('should prevent self-approval', async () => {
    const user = await createUserWithPermission('finance:expense:approve');
    const expense = await createExpense({ createdById: user.id });
    
    await expect(approveExpense(expense.id, user)).rejects.toThrow(SoDViolationError);
  });
});
```

---

## 9. Audit Requirements

### 9.1 Authorization Audit Events

**Logged Events:**
- Permission checks (success and failure)
- Role assignments
- Permission grants
- Approval decisions
- Delegation creation
- Escalation events
- SoD violations

**Audit Log Schema:**
```typescript
interface AuthorizationAuditLog {
  id: string;
  timestamp: Date;
  eventType: 'permission_check' | 'role_assign' | 'approval' | 'delegation';
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: 'allowed' | 'denied';
  reason?: string;
  context: {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
  };
}
```

---

## 10. References

- Stage 2: Tenancy and Authorization Architecture
- Stage 3: Security Engineering Controls
- Stage 5: Business Entity Catalog
- Stage 6: Approval and Delegation Framework
- NIST SP 800-162 (Guide to Attribute Based Access Control)
- NIST SP 800-53 (Security and Privacy Controls)

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Security Architect
