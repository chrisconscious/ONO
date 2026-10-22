import { Document } from './types';

export const stage5Doc4: Document = {
  id: 'entity-relationship-diagrams',
  number: 4,
  title: 'Entity Relationship Diagrams',
  shortTitle: 'ER Diagrams',
  description: 'Visual relationship diagrams showing entity connections and cardinality.',
  status: 'Recorded',
  stage: 5,
  sections: [
    {
      id: 'ERD-1',
      title: '1. Platform and Organization ERD',
      content: `\`\`\`mermaid
erDiagram
    ORGANIZATION ||--o{ BRANCH : has
    ORGANIZATION ||--o{ DEPARTMENT : has
    ORGANIZATION ||--o{ MEMBERSHIP : has
    ORGANIZATION ||--o{ ROLE : defines
    ORGANIZATION ||--o{ AUDIT_LOG : generates
    
    USER ||--o{ MEMBERSHIP : belongs_to
    USER ||--o{ AUDIT_LOG : creates
    
    MEMBERSHIP }o--o{ ROLE : has
    ROLE }o--o{ PERMISSION : includes
    
    BRANCH ||--o{ DEPARTMENT : contains
    DEPARTMENT ||--o{ TEAM : contains
    
    ORGANIZATION {
        uuid id PK
        string name
        string slug UK
        string timezone
        string currency
        string status
    }
    
    USER {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string status
    }
    
    MEMBERSHIP {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        string status
    }
    
    ROLE {
        uuid id PK
        uuid organization_id FK
        string name
        boolean is_system
    }
    
    PERMISSION {
        uuid id PK
        string resource
        string action
        string scope
    }
\`\`\`

**Key Relationships:**
- Organization has many Branches, Departments, Memberships, Roles
- User has many Memberships (can belong to multiple orgs)
- Membership has many Roles (user can have multiple roles per org)
- Role has many Permissions
- Branch has many Departments
- Department has many Teams`
    },
    {
      id: 'ERD-2',
      title: '2. CRM and Sales ERD',
      content: `\`\`\`mermaid
erDiagram
    LEAD }o--o| COMPANY : belongs_to
    LEAD ||--o{ ACTIVITY : has
    LEAD ||--o{ COMMUNICATION : has
    LEAD ||--o| CONVERSION : converts_to
    
    CONTACT }o--o| COMPANY : belongs_to
    CONTACT ||--o{ ACTIVITY : has
    
    COMPANY ||--o{ CONTACT : has
    COMPANY ||--o{ LEAD : has
    COMPANY ||--o{ OPPORTUNITY : has
    
    OPPORTUNITY }o--|| PIPELINE_STAGE : in
    OPPORTUNITY ||--o{ QUOTATION : has
    OPPORTUNITY ||--o| CONTRACT : becomes
    OPPORTUNITY ||--o| ORDER : becomes
    
    QUOTATION ||--o{ QUOTATION_LINE : contains
    QUOTATION_LINE }o--|| PRODUCT : references
    
    ORDER ||--o{ ORDER_LINE : contains
    ORDER_LINE }o--|| PRODUCT : references
    
    LEAD {
        uuid id PK
        uuid organization_id FK
        string first_name
        string last_name
        string email
        uuid company_id FK
        string status
    }
    
    CONTACT {
        uuid id PK
        uuid organization_id FK
        string first_name
        string last_name
        uuid company_id FK
    }
    
    COMPANY {
        uuid id PK
        uuid organization_id FK
        string name
        string industry
    }
    
    OPPORTUNITY {
        uuid id PK
        uuid organization_id FK
        uuid company_id FK
        uuid contact_id FK
        uuid pipeline_stage_id FK
        decimal value
        string status
    }
    
    QUOTATION {
        uuid id PK
        uuid opportunity_id FK
        decimal total
        string status
    }
    
    ORDER {
        uuid id PK
        uuid opportunity_id FK
        decimal total
        string status
    }
\`\`\`

**Key Relationships:**
- Lead can belong to Company (optional)
- Lead converts to Contact + Company (via Conversion)
- Contact can belong to Company (optional)
- Company has many Contacts, Leads, Opportunities
- Opportunity belongs to Pipeline Stage
- Opportunity can become Contract or Order
- Quotation and Order have line items referencing Products`
    },
    {
      id: 'ERD-3',
      title: '3. Finance and Inventory ERD',
      content: `\`\`\`mermaid
erDiagram
    INVOICE ||--o{ INVOICE_LINE : contains
    INVOICE_LINE }o--|| PRODUCT : references
    INVOICE }o--|| ORDER : generated_from
    INVOICE ||--o{ PAYMENT_ALLOCATION : has
    
    PAYMENT ||--o{ PAYMENT_ALLOCATION : allocates_to
    
    EXPENSE }o--|| EXPENSE_CATEGORY : categorized_as
    EXPENSE }o--|| PROJECT : charged_to
    
    PRODUCT ||--o{ STOCK_MOVEMENT : has
    PRODUCT }o--|| WAREHOUSE : stored_in
    
    PURCHASE_ORDER ||--o{ PURCHASE_ORDER_LINE : contains
    PURCHASE_ORDER_LINE }o--|| PRODUCT : references
    PURCHASE_ORDER }o--|| SUPPLIER : from
    
    INVOICE {
        uuid id PK
        uuid organization_id FK
        uuid order_id FK
        uuid customer_id FK
        decimal subtotal
        decimal tax
        decimal total
        string status
        date due_date
    }
    
    PAYMENT {
        uuid id PK
        uuid organization_id FK
        decimal amount
        date payment_date
        string method
        string status
    }
    
    PRODUCT {
        uuid id PK
        uuid organization_id FK
        string name
        string sku
        decimal price
        string type
    }
    
    STOCK_MOVEMENT {
        uuid id PK
        uuid product_id FK
        uuid warehouse_id FK
        integer quantity
        string type
        timestamp movement_date
    }
    
    WAREHOUSE {
        uuid id PK
        uuid organization_id FK
        string name
        string code
    }
    
    SUPPLIER {
        uuid id PK
        uuid organization_id FK
        string name
        string contact_email
    }
\`\`\`

**Key Relationships:**
- Invoice contains Invoice Lines (each referencing Product)
- Invoice generated from Order
- Payment allocated to Invoices (many-to-many via PaymentAllocation)
- Expense categorized by Expense Category
- Expense can be charged to Project
- Product has many Stock Movements
- Product stored in Warehouses (many-to-many)
- Purchase Order from Supplier contains Product lines`
    }
  ]
};

export const stage5Doc5: Document = {
  id: 'tenant-data-ownership',
  number: 5,
  title: 'Tenant Data Ownership Matrix',
  shortTitle: 'Tenant Ownership',
  description: 'Complete matrix showing tenant isolation, data ownership, and access patterns.',
  status: 'Recorded',
  stage: 5,
  sections: [
    {
      id: 'TDO-1',
      title: '1. Tenant Isolation Strategy',
      content: `**Isolation Model:**
Shared database, shared schema, tenant_id column isolation with Row-Level Security (RLS).

**Three-Layer Defense:**

**Layer 1: Database RLS (Primary)**
\`\`\`sql
-- Every tenant-owned table has RLS enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy enforces tenant isolation
CREATE POLICY tenant_isolation ON leads
  USING (organization_id = current_setting('app.current_tenant')::UUID);

-- Application sets tenant context per request
SET LOCAL app.current_tenant = :organizationId;
\`\`\`

**Layer 2: Application Middleware (Defense-in-Depth)**
\`\`\`typescript
// Every API route
async function handler(req: Request) {
  const session = await authenticate(req);
  const tenantId = session.organizationId;
  
  // Set database context
  await db.setTenantContext(tenantId);
  
  // All queries automatically scoped by RLS
  return await executeWithTenant(tenantId, () => {
    // Business logic
  });
}
\`\`\`

**Layer 3: Service-Level Checks (Explicit)**
\`\`\`typescript
// Every service method includes explicit tenant check
async function getLead(id: string, context: AuthContext) {
  const lead = await db.lead.findFirst({
    where: {
      id,
      organizationId: context.tenantId  // Explicit filter
    }
  });
  
  if (!lead) throw new NotFoundError();
  return lead;
}
\`\`\`

**Tenant Context Flow:**
1. User authenticates → session includes tenantId
2. Request arrives → middleware extracts tenantId
3. Database context set → RLS policies active
4. Service calls → tenantId passed explicitly
5. All queries → filtered by tenantId
6. Response → only tenant's data returned`
    },
    {
      id: 'TDO-2',
      title: '2. Data Ownership Classification',
      content: `**Platform-Wide Tables (No Tenant Isolation):**
- users (can belong to multiple orgs)
- permissions (shared across all orgs)
- industries (catalogue, shared)
- platform_settings (singleton)

**Tenant-Owned Tables (RLS Enforced):**
All business data tables include organization_id and have RLS:

| Table | Owner Module | Write Access | Read Access |
|-------|--------------|--------------|-------------|
| organizations | Platform | Platform Admin | Org Admin |
| branches | Organization | Org Admin | All (scoped) |
| departments | Organization | Org Admin | All (scoped) |
| teams | Organization | Org Admin | All (scoped) |
| memberships | Organization | Org Admin | All (scoped) |
| roles | Organization | Org Admin | All (scoped) |
| role_permissions | Organization | Org Admin | All (scoped) |
| leads | CRM | CRM users | Sales, Support (scoped) |
| contacts | CRM | CRM users | Sales, Support (scoped) |
| companies | CRM | CRM users | Sales, Support (scoped) |
| opportunities | Sales | Sales users | Finance (revenue) |
| quotations | Sales | Sales users | Finance (reference) |
| orders | Sales | Sales users | Inventory, Finance |
| products | Sales+Inventory | Sales/Inventory | All (scoped) |
| invoices | Finance | Finance users | Sales (status) |
| payments | Finance | Finance users | Sales (reference) |
| expenses | Finance | Finance users | Projects (costs) |
| stock_movements | Inventory | Inventory users | Sales (availability) |
| warehouses | Inventory | Inventory users | Sales (reference) |
| purchase_orders | Inventory | Inventory users | Finance (payables) |
| suppliers | Inventory | Inventory users | Finance |
| projects | Projects | Project users | Finance, HR |
| tasks | Projects | Project users | HR (assignments) |
| employees | HR | HR users | Projects (resources) |
| support_cases | Support | Support users | CRM (customer) |
| documents | Documents | All (scoped) | All (scoped) |
| audit_logs | Infrastructure | System | Org Admin |

**Derived Analytics Data (Tenant-Scoped):**
- metric_definitions (tenant-specific metrics)
- dashboard_configs (tenant-specific dashboards)
- analytics_snapshots (aggregated tenant data)

**AI/ML Data (Tenant-Scoped):**
- model_versions (tenant-specific models)
- predictions (tenant-specific predictions)
- recommendations (tenant-specific recommendations)
- inference_logs (tenant-specific logs)`
    },
    {
      id: 'TDO-3',
      title: '3. Cross-Tenant Prevention Rules',
      content: `**Absolute Rules:**

1. **No Cross-Tenant Foreign Keys**
   - Tenant-owned tables cannot reference other tenants' records
   - Exception: Platform-wide tables (users, permissions, industries)

2. **No API Parameters for Tenant ID**
   - Tenant ID always extracted from session
   - Never accepted as request parameter
   - Prevents tenant ID spoofing

3. **No Shared Caches Without Tenant Key**
   - All cache keys include tenant ID
   - Example: \`lead:{tenantId}:{leadId}\`
   - Prevents cross-tenant cache leakage

4. **No Background Jobs Without Tenant Context**
   - Every background job includes tenant ID
   - Job execution sets tenant context
   - Prevents cross-tenant data access

5. **No Cross-Tenant Reporting**
   - Analytics queries filtered by tenant
   - No aggregate reports across tenants
   - Platform metrics separate from tenant metrics

**Testing Requirements:**

**Automated Tenant Isolation Tests:**
\`\`\`typescript
describe('Tenant Isolation', () => {
  it('prevents cross-tenant data access', async () => {
    const tenant1 = await createTenant();
    const tenant2 = await createTenant();
    
    const lead = await createLead(tenant1.id);
    
    // Attempt to access tenant1's lead as tenant2
    await expect(
      getLead(lead.id, { tenantId: tenant2.id })
    ).rejects.toThrow(NotFoundError);
  });
  
  it('enforces RLS at database level', async () => {
    const tenant1 = await createTenant();
    const tenant2 = await createTenant();
    
    const lead = await createLead(tenant1.id);
    
    // Direct database query with wrong tenant context
    await db.setTenantContext(tenant2.id);
    const result = await db.lead.findUnique({
      where: { id: lead.id }
    });
    
    expect(result).toBeNull();
  });
});
\`\`\`

**Penetration Testing:**
- Quarterly penetration testing
- Focus on tenant isolation
- Attempt cross-tenant access via API
- Attempt cross-tenant access via direct database
- Verify RLS policies cannot be bypassed`
    },
    {
      id: 'TDO-4',
      title: '4. Data Scope Enforcement',
      content: `**Data Scopes (Within Tenant):**

Beyond tenant isolation, users have data scopes within their tenant:

| Scope | Description | Example |
|-------|-------------|---------|
| own | User's own records | Sales rep sees own leads |
| team | Team's records | Sales manager sees team leads |
| department | Department's records | Department head sees department data |
| branch | Branch's records | Branch manager sees branch data |
| organization | All tenant data | Org admin sees everything |

**Scope Enforcement:**
\`\`\`typescript
function applyScope<T>(
  query: Prisma.Query,
  user: User,
  scope: DataScope
): Prisma.Query {
  switch (scope) {
    case 'own':
      return { ...query, where: { createdById: user.id } };
    case 'team':
      return { ...query, where: { teamId: { in: user.teamIds } } };
    case 'department':
      return { ...query, where: { departmentId: { in: user.departmentIds } } };
    case 'branch':
      return { ...query, where: { branchId: { in: user.branchIds } } };
    case 'organization':
      return query;  // Already filtered by tenant
  }
}
\`\`\`

**Permission Resolution (Multiple Roles):**

When user has multiple roles, permissions are resolved:

\`\`\`typescript
function resolvePermissions(user: User): ResolvedPermission[] {
  const allPermissions = user.roles.flatMap(role => role.permissions);
  
  // Group by action:resource
  const grouped = groupBy(allPermissions, p => \`\${p.action}:\${p.resource}\`);
  
  return grouped.map((key, perms) => {
    const [action, resource] = key.split(':');
    
    if (action === 'read') {
      // Most permissive scope for read
      return { action, resource, scope: mostPermissiveScope(perms) };
    } else {
      // Most restrictive scope for write/delete
      return { action, resource, scope: mostRestrictiveScope(perms) };
    }
  });
}
\`\`\`

**Example:**
- User has Role A (read:lead, scope: own)
- User has Role B (read:lead, scope: team)
- Resolved: read:lead with scope: team (most permissive)

- User has Role A (delete:lead, scope: own)
- User has Role B (delete:lead, scope: organization)
- Resolved: delete:lead with scope: own (most restrictive)`
    }
  ]
};
