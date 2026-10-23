import { Document } from './types';

export const stage5Doc2: Document = {
  id: 'business-entity-catalog',
  number: 2,
  title: 'Business Entity Catalog',
  shortTitle: 'Entity Catalog',
  description: 'Detailed specifications for all business entities including attributes, constraints, and validation rules.',
  status: 'Recorded',
  stage: 5,
  sections: [
    {
      id: 'BEC-1',
      title: '1. Core Platform Entities',
      content: `**Organization (Tenant)**
\`\`\`
Purpose: Customer organization using the platform
Primary Key: id (UUID)
Tenant Scope: Platform-wide (each org is a tenant)

Attributes:
- id: UUID (PK)
- name: String (required, max 200 chars)
- slug: String (required, unique, max 100 chars, URL-safe)
- description: Text (optional)
- logoUrl: String (optional)
- website: String (optional, URL format)
- primaryIndustryId: UUID (FK to Industry)
- timezone: String (required, IANA format)
- locale: String (required, BCP 47 format)
- currency: String (required, ISO 4217)
- status: Enum ['active', 'suspended', 'archived'] (required)
- createdAt: Timestamp (required, auto)
- updatedAt: Timestamp (required, auto)
- deletedAt: Timestamp (optional, soft delete)

Constraints:
- name: NOT NULL, max 200 chars
- slug: NOT NULL, UNIQUE, max 100 chars, regex: ^[a-z0-9-]+$
- timezone: NOT NULL, valid IANA timezone
- currency: NOT NULL, valid ISO 4217 code
- status: NOT NULL, enum validation

Indexes:
- slug (unique)
- status
- createdAt

Audit: Full audit trail on all changes
Retention: Active + 7 years after deletion
\`\`\`

**User**
\`\`\`
Purpose: Platform user account
Primary Key: id (UUID)
Tenant Scope: Platform-wide (can belong to multiple orgs)

Attributes:
- id: UUID (PK)
- email: String (required, unique, max 254 chars)
- passwordHash: String (required, bcrypt/argon2)
- firstName: String (required, max 100 chars)
- lastName: String (required, max 100 chars)
- avatarUrl: String (optional)
- emailVerifiedAt: Timestamp (optional)
- mfaEnabled: Boolean (required, default false)
- mfaSecret: String (optional, encrypted)
- lastLoginAt: Timestamp (optional)
- status: Enum ['active', 'deactivated', 'deleted'] (required)
- createdAt: Timestamp (required, auto)
- updatedAt: Timestamp (required, auto)

Constraints:
- email: NOT NULL, UNIQUE, valid email format
- passwordHash: NOT NULL, min 60 chars (bcrypt)
- firstName/lastName: NOT NULL, max 100 chars
- status: NOT NULL, enum validation

Indexes:
- email (unique)
- status
- lastLoginAt

Security:
- passwordHash: Never exposed via API
- mfaSecret: Encrypted at rest
- PII: Classified as Confidential

Audit: Login events, password changes, MFA changes
Retention: Active + 7 years after deletion
\`\`\`

**Membership**
\`\`\`
Purpose: User-organization association with roles
Primary Key: id (UUID)
Tenant Scope: Tenant-owned

Attributes:
- id: UUID (PK)
- userId: UUID (FK to User, required)
- organizationId: UUID (FK to Organization, required)
- status: Enum ['active', 'invited', 'deactivated'] (required)
- invitedAt: Timestamp (optional)
- acceptedAt: Timestamp (optional)
- createdAt: Timestamp (required, auto)
- updatedAt: Timestamp (required, auto)

Constraints:
- userId + organizationId: UNIQUE (one membership per user per org)
- status: NOT NULL, enum validation

Indexes:
- userId + organizationId (unique composite)
- organizationId
- status

Audit: Role changes, status changes
Retention: Active + 7 years after removal
\`\`\``
    },
    {
      id: 'BEC-2',
      title: '2. Authorization Entities',
      content: `**Role**
\`\`\`
Purpose: Collection of permissions
Primary Key: id (UUID)
Tenant Scope: Tenant-owned

Attributes:
- id: UUID (PK)
- organizationId: UUID (FK to Organization, required)
- name: String (required, max 100 chars)
- description: Text (optional)
- isSystem: Boolean (required, default false)
- isCustom: Boolean (required, default true)
- createdAt: Timestamp (required, auto)
- updatedAt: Timestamp (required, auto)
- deletedAt: Timestamp (optional, soft delete)

Constraints:
- name: NOT NULL, max 100 chars
- organizationId + name: UNIQUE (per org)
- isSystem: NOT NULL
- System roles cannot be deleted

Indexes:
- organizationId + name (unique composite)
- organizationId
- isSystem

System Roles (predefined):
- Organization Admin: Full access
- Department Manager: Department-scoped access
- User: Basic access

Audit: Permission changes, role assignments
Retention: Active + 7 years after deletion
\`\`\`

**Permission**
\`\`\`
Purpose: Atomic access right
Primary Key: id (UUID)
Tenant Scope: Platform-wide (shared across all orgs)

Attributes:
- id: UUID (PK)
- resource: String (required, max 100 chars)
- action: Enum ['create', 'read', 'update', 'delete', 'approve', 'export'] (required)
- scope: Enum ['own', 'team', 'department', 'branch', 'organization'] (required)
- description: Text (optional)
- createdAt: Timestamp (required, auto)

Constraints:
- resource + action + scope: UNIQUE
- resource: NOT NULL, max 100 chars
- action: NOT NULL, enum validation
- scope: NOT NULL, enum validation

Indexes:
- resource + action + scope (unique composite)
- resource

Examples:
- resource: 'lead', action: 'create', scope: 'own'
- resource: 'invoice', action: 'approve', scope: 'organization'
- resource: 'report', action: 'export', scope: 'department'

Audit: Immutable (append-only)
Retention: Permanent (reference data)
\`\`\`

**RolePermission (Join Table)**
\`\`\`
Purpose: Many-to-many relationship between roles and permissions
Primary Key: id (UUID)
Tenant Scope: Tenant-owned

Attributes:
- id: UUID (PK)
- roleId: UUID (FK to Role, required)
- permissionId: UUID (FK to Permission, required)
- createdAt: Timestamp (required, auto)

Constraints:
- roleId + permissionId: UNIQUE
- Both FKs: NOT NULL

Indexes:
- roleId + permissionId (unique composite)
- roleId
- permissionId

Audit: Permission grants/revocations
Retention: Active + 7 years after role deletion
\`\`\`

**MembershipRole (Join Table)**
\`\`\`
Purpose: Many-to-many relationship between memberships and roles
Primary Key: id (UUID)
Tenant Scope: Tenant-owned

Attributes:
- id: UUID (PK)
- membershipId: UUID (FK to Membership, required)
- roleId: UUID (FK to Role, required)
- assignedAt: Timestamp (required, auto)
- assignedBy: UUID (FK to User, optional)

Constraints:
- membershipId + roleId: UNIQUE
- Both FKs: NOT NULL

Indexes:
- membershipId + roleId (unique composite)
- membershipId
- roleId

Audit: Role assignments (who, when)
Retention: Active + 7 years after membership removal
\`\`\``
    },
    {
      id: 'BEC-3',
      title: '3. CRM Entities',
      content: `**Lead**
\`\`\`
Purpose: Prospective customer
Primary Key: id (UUID)
Tenant Scope: Tenant-owned

Attributes:
- id: UUID (PK)
- organizationId: UUID (FK to Organization, required)
- firstName: String (required, max 100 chars)
- lastName: String (required, max 100 chars)
- email: String (optional, max 254 chars, email format)
- phone: String (optional, max 50 chars)
- companyId: UUID (FK to Company, optional)
- sourceId: UUID (FK to LeadSource, optional)
- status: Enum ['new', 'contacted', 'qualified', 'converted', 'lost'] (required)
- ownerId: UUID (FK to User, optional)
- score: Integer (optional, 0-100)
- notes: Text (optional)
- convertedAt: Timestamp (optional)
- lostReason: Text (optional)
- createdAt: Timestamp (required, auto)
- updatedAt: Timestamp (required, auto)
- deletedAt: Timestamp (optional, soft delete)

Constraints:
- firstName/lastName: NOT NULL, max 100 chars
- email: valid email format if provided
- status: NOT NULL, enum validation
- score: 0-100 if provided
- organizationId: NOT NULL (tenant isolation)

Indexes:
- organizationId
- status
- ownerId
- companyId
- email
- createdAt
- score

Business Rules:
- Cannot convert without required fields (email or phone)
- Score calculated by background job or manually
- Status transitions enforced by workflow

Audit: All field changes, status transitions
Retention: Active + 7 years after deletion
\`\`\`

**Contact**
\`\`\`
Purpose: Individual person (customer or prospect)
Primary Key: id (UUID)
Tenant Scope: Tenant-owned

Attributes:
- id: UUID (PK)
- organizationId: UUID (FK to Organization, required)
- firstName: String (required, max 100 chars)
- lastName: String (required, max 100 chars)
- email: String (optional, max 254 chars, email format)
- phone: String (optional, max 50 chars)
- title: String (optional, max 100 chars)
- companyId: UUID (FK to Company, optional)
- ownerId: UUID (FK to User, optional)
- status: Enum ['active', 'inactive', 'archived'] (required)
- notes: Text (optional)
- createdAt: Timestamp (required, auto)
- updatedAt: Timestamp (required, auto)
- deletedAt: Timestamp (optional, soft delete)

Constraints:
- firstName/lastName: NOT NULL, max 100 chars
- email: valid email format if provided
- status: NOT NULL, enum validation
- organizationId: NOT NULL

Indexes:
- organizationId
- companyId
- ownerId
- email
- status
- createdAt

Business Rules:
- Can be created from lead conversion
- Can exist independently (not all contacts belong to companies)

Audit: All field changes
Retention: Active + 7 years after deletion
\`\`\`

**Company**
\`\`\`
Purpose: Business entity (customer or prospect)
Primary Key: id (UUID)
Tenant Scope: Tenant-owned

Attributes:
- id: UUID (PK)
- organizationId: UUID (FK to Organization, required)
- name: String (required, max 200 chars)
- website: String (optional, URL format)
- industry: String (optional, max 100 chars)
- size: Enum ['startup', 'small', 'medium', 'enterprise'] (optional)
- ownerId: UUID (FK to User, optional)
- status: Enum ['active', 'inactive', 'archived'] (required)
- notes: Text (optional)
- createdAt: Timestamp (required, auto)
- updatedAt: Timestamp (required, auto)
- deletedAt: Timestamp (optional, soft delete)

Constraints:
- name: NOT NULL, max 200 chars
- website: valid URL format if provided
- status: NOT NULL, enum validation
- organizationId: NOT NULL

Indexes:
- organizationId
- ownerId
- industry
- status
- createdAt

Business Rules:
- Can have multiple contacts
- Can have multiple leads
- Can be created from lead conversion

Audit: All field changes
Retention: Active + 7 years after deletion
\`\`\``
    }
  ]
};

export const stage5Doc3: Document = {
  id: 'logical-data-model',
  number: 3,
  title: 'Logical Data Model',
  shortTitle: 'Logical Model',
  description: 'Complete logical schema design with tables, columns, data types, and constraints.',
  status: 'Recorded',
  stage: 5,
  sections: [
    {
      id: 'LDM-1',
      title: '1. Schema Organization',
      content: `**Database Schema Strategy:**
Single PostgreSQL database with logical schema separation via table prefixes and RLS policies.

**Table Naming Convention:**
- All tables use snake_case
- No schema prefixes (all in public schema)
- Tenant-owned tables include organization_id column
- Join tables named: {entity1}_{entity2} (alphabetical order)

**Common Columns (All Tenant-Owned Tables):**
\`\`\`sql
organization_id UUID NOT NULL REFERENCES organizations(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
created_by UUID REFERENCES users(id),
updated_by UUID REFERENCES users(id),
deleted_at TIMESTAMPTZ  -- soft delete
\`\`\`

**Row-Level Security (RLS) Pattern:**
\`\`\`sql
-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation ON leads
  USING (organization_id = current_setting('app.current_tenant')::UUID);

-- Set tenant context per request
SET LOCAL app.current_tenant = :organizationId;
\`\`\`

**Data Type Standards:**
- UUIDs: UUID type (not VARCHAR)
- Strings: VARCHAR(n) with explicit limits
- Text: TEXT for long content
- Numbers: INTEGER, BIGINT, DECIMAL(18,2) for money
- Booleans: BOOLEAN
- Dates: DATE for date-only
- Timestamps: TIMESTAMPTZ (always UTC)
- Enums: PostgreSQL ENUM types or VARCHAR with CHECK constraint
- JSON: JSONB for flexible structured data

**Soft Delete Pattern:**
- deleted_at column (NULL = active, timestamp = deleted)
- All queries filter: WHERE deleted_at IS NULL
- Unique constraints exclude deleted records
- Hard delete only for legal requirements (GDPR erasure)`
    },
    {
      id: 'LDM-2',
      title: '2. Platform and Organization Schema',
      content: `**organizations table**
\`\`\`sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  primary_industry_id UUID REFERENCES industries(id),
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  locale VARCHAR(20) NOT NULL DEFAULT 'en-US',
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_created_at ON organizations(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
\`\`\`

**users table**
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  email_verified_at TIMESTAMPTZ,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret TEXT,  -- encrypted
  last_login_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'deactivated', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);
\`\`\`

**memberships table**
\`\`\`sql
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'invited'
    CHECK (status IN ('active', 'invited', 'deactivated')),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_organization_id ON memberships(organization_id);
CREATE INDEX idx_memberships_status ON memberships(status);

-- RLS (platform-wide table, but org-scoped access)
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_admins_can_view ON memberships
  USING (organization_id = current_setting('app.current_tenant')::UUID);
\`\`\`

**branches table**
\`\`\`sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(254),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON branches
  USING (organization_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_branches_organization_id ON branches(organization_id);
CREATE INDEX idx_branches_status ON branches(status);
\`\`\``
    },
    {
      id: 'LDM-3',
      title: '3. Authorization Schema',
      content: `**roles table**
\`\`\`sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_custom BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, name)
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON roles
  USING (organization_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_roles_organization_id ON roles(organization_id);
CREATE INDEX idx_roles_is_system ON roles(is_system);
\`\`\`

**permissions table**
\`\`\`sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(20) NOT NULL
    CHECK (action IN ('create', 'read', 'update', 'delete', 'approve', 'export')),
  scope VARCHAR(20) NOT NULL
    CHECK (scope IN ('own', 'team', 'department', 'branch', 'organization')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource, action, scope)
);

-- Platform-wide table (no RLS, shared across all orgs)
CREATE INDEX idx_permissions_resource ON permissions(resource);
\`\`\`

**role_permissions table (join table)**
\`\`\`sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Access via role's organization
CREATE POLICY tenant_isolation ON role_permissions
  USING (
    role_id IN (
      SELECT id FROM roles
      WHERE organization_id = current_setting('app.current_tenant')::UUID
    )
  );

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
\`\`\`

**membership_roles table (join table)**
\`\`\`sql
CREATE TABLE membership_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(membership_id, role_id)
);

ALTER TABLE membership_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON membership_roles
  USING (
    membership_id IN (
      SELECT id FROM memberships
      WHERE organization_id = current_setting('app.current_tenant')::UUID
    )
  );

CREATE INDEX idx_membership_roles_membership_id ON membership_roles(membership_id);
CREATE INDEX idx_membership_roles_role_id ON membership_roles(role_id);
\`\`\``
    }
  ]
};
