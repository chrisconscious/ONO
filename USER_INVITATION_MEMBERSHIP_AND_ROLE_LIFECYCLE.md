# User Invitation, Membership, and Role Lifecycle

**Document ID:** SAAS-14.4  
**Stage:** 14  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines how organizations invite users, manage memberships, and assign roles throughout the user lifecycle.

**Key Principles:**
- Invitations are secure and time-limited
- Memberships are explicitly managed
- Roles determine permissions
- Multiple roles supported per user
- Least privilege enforced
- Complete audit trail

---

## 2. Invitation Lifecycle

### 2.1 Invitation Creation

**Invitation Payload:**
```typescript
interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  departments?: string[];
  branches?: string[];
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  token: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  message?: string;
}
```

**Invitation Creation Process:**
1. Admin selects "Invite User"
2. Enters email address
3. Selects role(s)
4. Optionally assigns departments/branches
5. Adds personal message (optional)
6. System generates secure token
7. System sends invitation email
8. Invitation logged in audit trail

**Validation:**
- Email format valid
- Email not already member
- No pending invitation for same email
- Inviter has permission to invite
- Role is valid for organization

### 2.2 Invitation Delivery

**Email Content:**
```
Subject: You're invited to join [Organization Name] on ClickIT

Hi [Name],

[Inviter Name] has invited you to join [Organization Name] on ClickIT.

Role: [Role]
[Departments: X, Y, Z]
[Message: "Welcome to the team!"]

Accept Invitation: [Link with token]

This invitation expires in 7 days.

If you don't have an account, you'll be prompted to create one.
If you already have an account, you'll be added to the organization.

Questions? Contact [Inviter Email] or support@clickit.com

Best regards,
The ClickIT Team
```

**Delivery Methods:**
- Email (primary)
- In-app notification (if user has account)
- SMS (optional, if configured)

### 2.3 Invitation Acceptance

**Acceptance Flow:**
```
User clicks link → Verify token → Check expiration → 
Show acceptance page → Create/login account → 
Add membership → Assign roles → Redirect to organization
```

**Acceptance Process:**
```typescript
async function acceptInvitation(
  token: string,
  userId: string
): Promise<Membership> {
  // Verify token
  const invitation = await db.invitation.findFirst({
    where: {
      token,
      status: 'pending',
      expiresAt: { gt: new Date() },
    },
  });
  
  if (!invitation) {
    throw new Error('Invalid or expired invitation');
  }
  
  // Check if user already member
  const existingMembership = await db.membership.findFirst({
    where: {
      userId,
      organizationId: invitation.organizationId,
      status: 'active',
    },
  });
  
  if (existingMembership) {
    throw new Error('User already member of organization');
  }
  
  // Create membership
  const membership = await db.membership.create({
    data: {
      userId,
      organizationId: invitation.organizationId,
      status: 'active',
      joinedAt: new Date(),
    },
  });
  
  // Assign roles
  await db.membershipRole.create({
    data: {
      membershipId: membership.id,
      roleId: invitation.roleId,
    },
  });
  
  // Assign departments
  if (invitation.departments) {
    for (const deptId of invitation.departments) {
      await db.membershipDepartment.create({
        data: {
          membershipId: membership.id,
          departmentId: deptId,
        },
      });
    }
  }
  
  // Update invitation status
  await db.invitation.update({
    where: { id: invitation.id },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
    },
  });
  
  // Log acceptance
  await createAuditEvent(invitation.organizationId, {
    eventType: 'membership.created',
    actor: { type: 'user', id: userId },
    action: { type: 'accept', resource: 'invitation' },
    context: { invitationId: invitation.id },
  });
  
  return membership;
}
```

### 2.4 Invitation Expiration and Cancellation

**Expiration:**
- Invitations expire after 7 days (configurable)
- Expired invitations cannot be accepted
- Admin can resend expired invitation
- Expiration logged in audit trail

**Cancellation:**
- Admin can cancel pending invitations
- Cancelled invitations cannot be accepted
- Cancellation logged in audit trail
- User notified of cancellation

**Resending:**
- Admin can resend pending/expired invitations
- New token generated
- New expiration date set
- Resend logged in audit trail

---

## 3. Membership Management

### 3.1 Membership States

**Active:**
- User has access to organization
- Can perform actions based on roles
- Counted in subscription limits

**Suspended:**
- User temporarily disabled
- Cannot access organization
- Data preserved
- Can be reactivated

**Removed:**
- User removed from organization
- Cannot access organization
- Data preserved (owned records)
- Can be re-invited

### 3.2 Membership Operations

**Suspend Membership:**
```typescript
async function suspendMembership(
  membershipId: string,
  suspendedBy: string,
  reason: string
): Promise<void> {
  await db.membership.update({
    where: { id: membershipId },
    data: {
      status: 'suspended',
      suspendedAt: new Date(),
      suspendedBy,
      suspensionReason: reason,
    },
  });
  
  // Revoke sessions
  await revokeUserSessions(membershipId);
  
  // Log suspension
  await createAuditEvent(membership.organizationId, {
    eventType: 'membership.suspended',
    actor: { type: 'user', id: suspendedBy },
    action: { type: 'suspend', resource: 'membership' },
    context: { reason },
  });
}
```

**Reactivate Membership:**
```typescript
async function reactivateMembership(
  membershipId: string,
  reactivatedBy: string
): Promise<void> {
  await db.membership.update({
    where: { id: membershipId },
    data: {
      status: 'active',
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null,
      reactivatedAt: new Date(),
      reactivatedBy,
    },
  });
  
  // Log reactivation
  await createAuditEvent(membership.organizationId, {
    eventType: 'membership.reactivated',
    actor: { type: 'user', id: reactivatedBy },
    action: { type: 'reactivate', resource: 'membership' },
  });
}
```

**Remove Membership:**
```typescript
async function removeMembership(
  membershipId: string,
  removedBy: string,
  reason: string
): Promise<void> {
  const membership = await db.membership.findUnique({
    where: { id: membershipId },
  });
  
  // Check if last owner
  if (membership.role === 'owner') {
    const ownerCount = await db.membership.count({
      where: {
        organizationId: membership.organizationId,
        role: 'owner',
        status: 'active',
      },
    });
    
    if (ownerCount === 1) {
      throw new Error('Cannot remove last owner. Transfer ownership first.');
    }
  }
  
  // Remove membership
  await db.membership.update({
    where: { id: membershipId },
    data: {
      status: 'removed',
      removedAt: new Date(),
      removedBy,
      removalReason: reason,
    },
  });
  
  // Revoke sessions
  await revokeUserSessions(membershipId);
  
  // Remove role assignments
  await db.membershipRole.deleteMany({
    where: { membershipId },
  });
  
  // Log removal
  await createAuditEvent(membership.organizationId, {
    eventType: 'membership.removed',
    actor: { type: 'user', id: removedBy },
    action: { type: 'remove', resource: 'membership' },
    context: { reason },
  });
}
```

### 3.3 Re-invitation

**Re-invite Removed User:**
- Admin can re-invite removed user
- New invitation created
- Previous membership history preserved
- User can accept and rejoin

---

## 4. Role Assignment

### 4.1 Role Types

**System Roles:**
- **Owner:** Full control, can delete organization
- **Admin:** Full administrative control
- **Manager:** Department/branch management
- **Member:** Standard user access

**Custom Roles:**
- Organization-defined roles
- Custom permission sets
- Can be assigned to multiple users

### 4.2 Multiple Roles

**Multiple Role Support:**
- Users can have multiple roles
- Permissions are union of all roles
- Most permissive scope applies for read
- Most restrictive scope applies for write
- Approval permissions not accumulated

**Example:**
```typescript
// User has Sales Rep and Finance Viewer roles
const userPermissions = {
  // From Sales Rep role
  'crm:lead:create': { scope: 'own' },
  'crm:lead:read': { scope: 'team' },
  
  // From Finance Viewer role
  'finance:invoice:read': { scope: 'organization' },
  
  // Resolved permissions
  resolved: {
    'crm:lead:create': { scope: 'own' },
    'crm:lead:read': { scope: 'team' },  // Most permissive
    'finance:invoice:read': { scope: 'organization' },
  }
};
```

### 4.3 Role Assignment Process

**Assign Role:**
```typescript
async function assignRole(
  membershipId: string,
  roleId: string,
  assignedBy: string
): Promise<void> {
  // Check if role already assigned
  const existing = await db.membershipRole.findFirst({
    where: { membershipId, roleId },
  });
  
  if (existing) {
    throw new Error('Role already assigned');
  }
  
  // Assign role
  await db.membershipRole.create({
    data: {
      membershipId,
      roleId,
      assignedAt: new Date(),
      assignedBy,
    },
  });
  
  // Log assignment
  const membership = await db.membership.findUnique({
    where: { id: membershipId },
  });
  
  await createAuditEvent(membership.organizationId, {
    eventType: 'membership.role_assigned',
    actor: { type: 'user', id: assignedBy },
    action: { type: 'assign', resource: 'role' },
    context: { membershipId, roleId },
  });
}
```

**Revoke Role:**
```typescript
async function revokeRole(
  membershipId: string,
  roleId: string,
  revokedBy: string
): Promise<void> {
  // Check if last role
  const roleCount = await db.membershipRole.count({
    where: { membershipId },
  });
  
  if (roleCount === 1) {
    throw new Error('Cannot revoke last role. Assign another role first.');
  }
  
  // Revoke role
  await db.membershipRole.delete({
    where: {
      membershipId_roleId: { membershipId, roleId },
    },
  });
  
  // Log revocation
  const membership = await db.membership.findUnique({
    where: { id: membershipId },
  });
  
  await createAuditEvent(membership.organizationId, {
    eventType: 'membership.role_revoked',
    actor: { type: 'user', id: revokedBy },
    action: { type: 'revoke', resource: 'role' },
    context: { membershipId, roleId },
  });
}
```

---

## 5. Department and Branch Assignment

### 5.1 Department Assignment

**Assign Department:**
```typescript
async function assignDepartment(
  membershipId: string,
  departmentId: string,
  assignedBy: string
): Promise<void> {
  await db.membershipDepartment.create({
    data: {
      membershipId,
      departmentId,
      assignedAt: new Date(),
      assignedBy,
    },
  });
  
  // Log assignment
  const membership = await db.membership.findUnique({
    where: { id: membershipId },
  });
  
  await createAuditEvent(membership.organizationId, {
    eventType: 'membership.department_assigned',
    actor: { type: 'user', id: assignedBy },
    action: { type: 'assign', resource: 'department' },
    context: { membershipId, departmentId },
  });
}
```

### 5.2 Branch Assignment

**Assign Branch:**
- Similar to department assignment
- User can be assigned to multiple branches
- Branch determines data scope

---

## 6. Offboarding

### 6.1 Offboarding Process

**Offboarding Steps:**
1. Remove user from all teams/projects
2. Reassign owned records (if needed)
3. Revoke all roles
4. Remove membership
5. Revoke all sessions
6. Log offboarding
7. Notify user (optional)

**Record Reassignment:**
```typescript
async function reassignOwnedRecords(
  userId: string,
  organizationId: string,
  newOwnerId: string
): Promise<void> {
  // Reassign leads
  await db.lead.updateMany({
    where: {
      organizationId,
      ownerId: userId,
    },
    data: { ownerId: newOwnerId },
  });
  
  // Reassign contacts
  await db.contact.updateMany({
    where: {
      organizationId,
      ownerId: userId,
    },
    data: { ownerId: newOwnerId },
  });
  
  // Reassign other owned records...
}
```

### 6.2 Session Revocation

**Revoke All Sessions:**
```typescript
async function revokeUserSessions(
  membershipId: string
): Promise<void> {
  const membership = await db.membership.findUnique({
    where: { id: membershipId },
  });
  
  await db.session.deleteMany({
    where: {
      userId: membership.userId,
      organizationId: membership.organizationId,
    },
  });
}
```

---

## 7. Acceptance Criteria

### 7.1 Invitations

- [ ] Invitations can be created
- [ ] Invitations sent via email
- [ ] Invitations expire after 7 days
- [ ] Invitations can be cancelled
- [ ] Invitations can be resent
- [ ] Acceptance creates membership

### 7.2 Memberships

- [ ] Memberships can be suspended
- [ ] Memberships can be reactivated
- [ ] Memberships can be removed
- [ ] Last owner cannot be removed
- [ ] Removed users can be re-invited
- [ ] All changes logged

### 7.3 Roles

- [ ] Multiple roles can be assigned
- [ ] Roles can be revoked
- [ ] Last role cannot be revoked
- [ ] Permission resolution works correctly
- [ ] Role changes logged

### 7.4 Departments/Branches

- [ ] Users can be assigned to departments
- [ ] Users can be assigned to branches
- [ ] Multiple assignments supported
- [ ] Assignments affect data scope
- [ ] Changes logged

### 7.5 Offboarding

- [ ] Owned records can be reassigned
- [ ] All sessions revoked
- [ ] All roles removed
- [ ] Membership removed
- [ ] Offboarding logged

---

## 8. References

- Stage 5: Data Model (membership entities)
- Stage 7: Security Architecture (authorization)
- Stage 12: Deployment and Operations (user management)

---

**Document Status:** Recorded  
**Owner:** Backend Lead / Security Architect
