import { Document } from './types';

export const stage14Doc1: Document = {
  id: 'customer-lifecycle-onboarding',
  number: 1,
  title: 'Customer Lifecycle and Onboarding Specification',
  shortTitle: 'Customer Lifecycle',
  description: 'Complete customer journey from discovery through registration, organization setup, first value achievement, and ongoing use.',
  status: 'Recorded',
  stage: 14,
  sections: [
    {
      id: '14.1.1',
      title: '1. Customer Lifecycle Overview',
      content: `**17-Stage Lifecycle:**
Discovery → Evaluation → Decision → Registration → Organization Setup → Configuration → First Value → Adoption → Growth → Maturity → Renewal → [Expansion/Contraction] → [Closure]

**Key Phases:**
- **Pre-Onboarding:** Discovery, Evaluation, Decision
- **Onboarding:** Registration, Organization Setup, Configuration, First Value
- **Active Use:** Adoption, Growth, Maturity
- **Lifecycle Management:** Renewal, Expansion, Contraction, Closure

**Success Metrics:**
- Time to first value: < 30 minutes
- First value completion rate: > 80%
- User satisfaction: > 4.0/5.0

**Registration Scenarios:**
1. New User, New Organization
2. New User, Existing Organization (via invitation)
3. Existing User, New Organization
4. Existing User, Existing Organization (via invitation)`
    }
  ]
};

export const stage14Doc2: Document = {
  id: 'organization-setup-industry-config',
  number: 2,
  title: 'Organization Setup and Industry Configuration',
  shortTitle: 'Organization Setup',
  description: '7-step organization setup workflow with industry catalogue, custom industry support, and 4-layer configuration model.',
  status: 'Recorded',
  stage: 14,
  sections: [
    {
      id: '14.2.1',
      title: '1. Organization Setup Workflow',
      content: `**7-Step Setup Process:**
1. Basic Information (name, industry, description)
2. Industry Selection (catalogue or "Other")
3. Regional Settings (country, timezone, currency, language)
4. Initial Administrator (confirm owner)
5. Module Selection (based on industry recommendations)
6. Team Invitation (optional)
7. First Workflow (guided achievement)

**Industry Configuration:**
- 10+ predefined industry categories
- Each industry has configuration profile:
  * Terminology (module/entity/field name overrides)
  * Module recommendations
  * Workflow templates
  * KPI definitions
- Custom industries fully supported
- "Other — my industry is not listed" always available
- AI-assisted configuration for custom industries

**4-Layer Configuration Model:**
1. Platform Defaults (universal, cannot override)
2. Industry Profiles (industry-specific, can override)
3. Organization Configuration (org-specific, can override)
4. User Preferences (user-specific, can override)

**Key Principle:** Industry selection never blocks onboarding`
    }
  ]
};

export const stage14Doc3: Document = {
  id: 'tenant-provisioning-lifecycle',
  number: 3,
  title: 'Tenant Provisioning and Lifecycle Specification',
  shortTitle: 'Tenant Provisioning',
  description: 'Technical tenant provisioning process with idempotency, failure handling, lifecycle states, and ownership transfer.',
  status: 'Recorded',
  stage: 14,
  sections: [
    {
      id: '14.3.1',
      title: '1. Provisioning Workflow',
      content: `**9-Step Provisioning Process:**
1. Organization Creation Request
2. Validate Request (uniqueness, format, idempotency)
3. Create Tenant Record
4. Initialize Tenant Resources (storage, roles, permissions, audit)
5. Create Initial Membership (owner)
6. Apply Default Configuration
7. Create Initial Audit Events
8. Activate Tenant
9. Notify User

**Idempotency:**
- Each request has unique requestId
- Duplicate requests return existing tenant
- Prevents duplicate organizations

**Failure Handling:**
- Partial provisioning cleanup
- Retry mechanism
- Admin notification
- User notification with retry option

**6 Tenant Lifecycle States:**
- Provisioning: Creation in progress
- Active: Fully operational
- Failed: Provisioning failed
- Suspended: Temporarily disabled
- PendingClosure: Closure initiated
- Closed: Fully closed, data in retention

**Data Retention:**
- 90-day retention after closure
- Owner can request immediate deletion
- Legal holds prevent deletion
- Permanent deletion after retention period`
    }
  ]
};

export const stage14Doc4: Document = {
  id: 'user-invitation-membership-role',
  number: 4,
  title: 'User Invitation, Membership, and Role Lifecycle',
  shortTitle: 'User Management',
  description: 'Invitation lifecycle, membership management, role assignment with multiple roles, and offboarding process.',
  status: 'Recorded',
  stage: 14,
  sections: [
    {
      id: '14.4.1',
      title: '1. Invitation and Membership',
      content: `**Invitation Lifecycle:**
- Creation: Admin invites user via email
- Delivery: Email with secure token
- Acceptance: User accepts and joins organization
- Expiration: 7-day expiration (configurable)
- Cancellation: Admin can cancel pending invitations

**Membership States:**
- Active: User has access
- Suspended: Temporarily disabled
- Removed: Removed from organization

**Role Assignment:**
- Multiple roles per user supported
- System roles: Owner, Admin, Manager, Member
- Custom roles: Organization-defined
- Permission resolution:
  * Read: Most permissive scope wins
  * Write: Most restrictive scope wins
  * Approval: Explicit permission required

**Key Protections:**
- Last owner cannot be removed
- Last role cannot be revoked
- Complete audit trail for all changes
- Session revocation on membership change

**Offboarding Process:**
1. Reassign owned records
2. Revoke all roles
3. Remove membership
4. Revoke all sessions
5. Log offboarding
6. Notify user (optional)`
    }
  ]
};

export const stage14Doc5: Document = {
  id: 'subscription-plans-entitlements',
  number: 5,
  title: 'Subscription Plans and Entitlement Model',
  shortTitle: 'Subscriptions',
  description: 'Subscription plan architecture with entitlements, limit types, subscription lifecycle, and 3-tier entitlement evaluation.',
  status: 'Recorded',
  stage: 14,
  sections: [
    {
      id: '14.5.1',
      title: '1. Subscription and Entitlements',
      content: `**Plan Structure:**
- Pricing: Base price, currency, billing cycle, discounts
- Entitlements: Users, branches, modules, storage, automation, AI, API, support, retention
- Features: Advanced analytics, custom reports, API access, webhooks, SSO, audit logs, branding

**Example Plans:**
- Free: 3 users, 1 branch, basic modules, 1GB storage
- Professional: 25 users, 5 branches, all core modules, 50GB storage
- Enterprise: Unlimited users/branches/modules/storage

**Limit Types:**
- Hard: Cannot exceed, operation blocked
- Soft: Can exceed with warning, grace period
- Unlimited: No limit (represented as -1)

**3-Tier Entitlement Evaluation:**
1. User Authorization: Does user have permission?
2. Subscription Entitlement: Does subscription include feature?
3. Usage Limits: Is usage within limits?

**Subscription Lifecycle States:**
- Trial → Active → PastDue → GracePeriod → Suspended → Cancelled

**Limit Enforcement:**
- Hard limits: Block operation, require upgrade
- Soft limits: Warn user, allow operation
- Clear error messages with upgrade path
- Usage visibility in dashboard`
    }
  ]
};

export const stage14Docs: Document[] = [
  stage14Doc1,
  stage14Doc2,
  stage14Doc3,
  stage14Doc4,
  stage14Doc5
];
