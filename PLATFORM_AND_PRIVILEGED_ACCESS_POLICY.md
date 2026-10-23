# Platform and Privileged Access Policy

**Document ID:** SEC-7.5  
**Stage:** 7 — Security, Identity, Permissions, Privacy, and Audit Design  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the security policies for platform administration and privileged access in the ClickIT platform. It establishes strict controls to prevent unauthorized access to tenant data and ensure all privileged operations are properly authorized and audited.

**Key Principles:**
- Platform admins do NOT have unrestricted access to tenant data
- Tenant admins do NOT have unrestricted access to sensitive records
- All privileged access requires explicit authorization
- All privileged operations are fully audited
- Emergency access is time-limited and monitored
- Separation of duties for administrative functions

---

## 2. Platform Administrator Access

### 2.1 Platform Admin Permissions

**Allowed Operations:**
- Manage organizations (create, suspend, reactivate, delete)
- Manage platform settings and configuration
- View platform-wide analytics (aggregated, no tenant details)
- Manage subscriptions and billing
- Access platform audit logs
- Manage platform users (other platform admins)
- View platform health and performance metrics
- Configure platform-wide integrations

**Restricted Operations:**
- ❌ Cannot access tenant business data by default
- ❌ Cannot view tenant leads, contacts, invoices, etc.
- ❌ Cannot modify tenant records
- ❌ Cannot export tenant data
- ❌ Cannot access tenant audit logs
- ❌ Cannot impersonate tenant users

### 2.2 Platform Support Access

**Default Access:**
- View organization metadata (name, status, plan, industry)
- Access support tickets
- View platform health metrics
- Cannot access tenant business data

**Temporary Tenant Access:**
- Requires explicit tenant admin approval
- Time-limited (max 4 hours)
- Scope-limited (specific issue only)
- Fully audited
- Automatically revoked after time limit

**Access Request Process:**
1. Support agent identifies need for tenant data access
2. Support agent creates access request with:
   - Reason for access
   - Specific data needed
   - Time duration required
   - Expected actions
3. Tenant admin receives notification
4. Tenant admin approves or denies request
5. If approved:
   - Temporary access granted
   - Access logged with full details
   - Timer starts
6. Access automatically revoked after time limit
7. Support agent submits access report
8. Tenant admin reviews report

### 2.3 Emergency Access

**Emergency Scenarios:**
- Critical security incident
- Data corruption or loss
- Service outage affecting tenant
- Legal or compliance requirement

**Emergency Access Process:**
1. Platform admin identifies emergency
2. Platform admin creates emergency access request
3. Request requires approval from:
   - Security team lead
   - Platform operations lead
   - Legal/compliance (if applicable)
4. If approved:
   - Emergency access granted
   - Access logged with emergency flag
   - Incident ticket created
5. Access revoked when emergency resolved
6. Post-incident review required
7. Report to affected tenant (if data accessed)

**Emergency Access Controls:**
- Requires multi-party approval
- Time-limited (max 24 hours)
- Fully audited with enhanced logging
- Post-incident review mandatory
- Tenant notification required (unless legal hold)

---

## 3. Tenant Administrator Access

### 3.1 Tenant Admin Permissions

**Allowed Operations:**
- Manage organization settings
- Manage users and invitations
- Manage roles and permissions
- Manage branches and departments
- Configure modules and workflows
- View all organization data (except Highly Restricted)
- Access organization audit logs
- Manage integrations
- Configure industry settings

**Restricted Operations:**
- ❌ Cannot access Highly Restricted data without explicit permission
  - User passwords and credentials
  - API keys and secrets
  - Encryption keys
  - Health data (if applicable)
- ❌ Cannot approve own transactions
- ❌ Cannot modify audit logs
- ❌ Cannot bypass approval workflows
- ❌ Cannot access platform audit logs

### 3.2 Sensitive Data Access

**Highly Restricted Data:**
- Requires explicit permission grant
- Separate permission: `admin:sensitive:read`
- Access logged with enhanced audit
- Requires justification for access
- Time-limited access grants available

**Access Request Process:**
1. Tenant admin identifies need for sensitive data access
2. Tenant admin requests access with justification
3. Access reviewed by:
   - Security officer (if designated)
   - Compliance officer (if applicable)
   - Another tenant admin (separation of duties)
4. If approved:
   - Access granted for specific data
   - Time-limited (configurable)
   - Fully audited
5. Access automatically revoked after time limit

### 3.3 Tenant Admin Audit

**Audit Requirements:**
- All tenant admin actions logged
- Enhanced logging for sensitive operations
- Audit logs immutable (cannot be modified by tenant admin)
- Audit logs accessible to platform admins (for support)
- Audit logs retained for 7 years

**Audited Operations:**
- User management (create, update, delete, role changes)
- Role and permission changes
- Organization setting changes
- Module configuration changes
- Integration configuration
- Sensitive data access
- Audit log access
- Export operations

---

## 4. Privileged Access Management

### 4.1 Privileged Account Protection

**Requirements:**
- Strong password policy (minimum 16 characters)
- Mandatory MFA for all privileged accounts
- Separate accounts for administrative tasks
- No shared accounts
- Regular access reviews (quarterly)

**Privileged Account Types:**
- Platform Admin accounts
- Tenant Admin accounts
- Security Admin accounts
- Database Admin accounts
- Infrastructure Admin accounts

### 4.2 Privileged Session Management

**Session Controls:**
- Shorter session timeouts (4 hours)
- Mandatory re-authentication for sensitive operations
- Session recording for critical operations (optional)
- Real-time monitoring of privileged sessions
- Automatic session termination on inactivity

**Session Monitoring:**
- Real-time alerting for unusual activities
- Geographic anomaly detection
- Time-based anomaly detection
- Command pattern analysis

### 4.3 Privileged Access Review

**Review Process:**
1. Quarterly access review
2. Review all privileged accounts
3. Verify business justification for each account
4. Review recent activity
5. Remove unnecessary access
6. Document review results
7. Obtain management approval

**Review Checklist:**
- [ ] All privileged accounts have business justification
- [ ] MFA enabled for all privileged accounts
- [ ] No shared accounts
- [ ] No inactive accounts (90+ days)
- [ ] Access levels appropriate for role
- [ ] Recent activity reviewed
- [ ] Access removal requests processed

---

## 5. Separation of Duties

### 5.1 Platform-Level SoD

**Separation Requirements:**
- Platform admin cannot approve own changes
- Security admin cannot modify audit logs
- Database admin cannot access application data
- Infrastructure admin cannot modify application code

**Implementation:**
```typescript
// Example: Platform admin cannot approve own changes
async function approvePlatformChange(
  changeId: string,
  approverId: string
): Promise<void> {
  const change = await getPlatformChange(changeId);
  
  // Check separation of duties
  if (change.createdById === approverId) {
    throw new SeparationOfDutiesError(
      'Cannot approve own changes'
    );
  }
  
  // Approve change
  await updateChange(changeId, { approvedById: approverId });
}
```

### 5.2 Tenant-Level SoD

**Separation Requirements:**
- Expense submitter cannot approve own expense
- Invoice creator cannot approve own invoice
- User creator cannot assign admin roles to self
- Audit log viewer cannot modify audit logs

**Implementation:**
```typescript
// Example: Expense submitter cannot approve own expense
async function approveExpense(
  expenseId: string,
  approverId: string
): Promise<void> {
  const expense = await getExpense(expenseId);
  
  // Check separation of duties
  if (expense.createdById === approverId) {
    throw new SeparationOfDutiesError(
      'Cannot approve own expense'
    );
  }
  
  // Approve expense
  await updateExpense(expenseId, { approvedById: approverId });
}
```

---

## 6. Administrative Action Audit

### 6.1 Audit Log Schema

**Administrative Audit Log:**
```typescript
interface AdminAuditLog {
  id: string;
  timestamp: Date;
  actorId: string;
  actorType: 'platform_admin' | 'tenant_admin' | 'support';
  action: string;
  resourceType: string;
  resourceId?: string;
  targetTenantId?: string;  // For platform admin actions
  details: Record<string, any>;
  outcome: 'success' | 'failure';
  failureReason?: string;
  context: {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    mfaVerified: boolean;
  };
  isEmergency: boolean;
  isSensitiveAccess: boolean;
}
```

### 6.2 Audit Log Retention

**Retention Policy:**
- Platform admin audit logs: 10 years
- Tenant admin audit logs: 7 years
- Support access logs: 7 years
- Emergency access logs: 10 years
- Sensitive data access logs: 10 years

**Log Storage:**
- Immutable storage (cannot be modified)
- Encrypted at rest
- Backed up daily
- Replicated geographically
- Access restricted to security team

### 6.3 Audit Log Monitoring

**Monitoring Rules:**
- Alert on emergency access
- Alert on sensitive data access
- Alert on bulk data exports
- Alert on role/permission changes
- Alert on after-hours access
- Alert on access from new locations

**Alert Escalation:**
- Low: Log and review
- Medium: Notify security team
- High: Notify security team + management
- Critical: Notify security team + management + legal

---

## 7. Emergency Access Procedures

### 7.1 Emergency Access Request

**Request Template:**
```
Emergency Access Request
========================
Requestor: [Name, Email]
Reason: [Detailed explanation]
Data Needed: [Specific data or systems]
Duration: [Hours needed]
Actions Planned: [What will be done]
Impact if Denied: [Business impact]
Approved By: [Names of approvers]
```

### 7.2 Emergency Access Approval

**Approval Workflow:**
1. Requestor submits emergency request
2. Security team lead reviews and approves
3. Platform operations lead reviews and approves
4. Legal/compliance reviews (if data access involved)
5. All approvals documented
6. Access granted with enhanced monitoring
7. Timer starts

### 7.3 Emergency Access Execution

**Execution Controls:**
- Access logged with emergency flag
- Real-time monitoring enabled
- Session recording (if applicable)
- Command logging
- Automatic timeout

**Post-Access Requirements:**
1. Access report submitted within 24 hours
2. Report includes:
   - Actions taken
   - Data accessed
   - Changes made
   - Justification validation
3. Report reviewed by security team
4. Report shared with affected tenant (unless legal hold)
5. Incident ticket closed

### 7.4 Emergency Access Review

**Review Process:**
1. Post-incident review within 48 hours
2. Review participants:
   - Requestor
   - Approvers
   - Security team
   - Affected tenant (if applicable)
3. Review agenda:
   - Was emergency justified?
   - Was access scope appropriate?
   - Were proper procedures followed?
   - What can be improved?
4. Review document created
5. Improvements implemented
6. Lessons learned documented

---

## 8. Access Revocation

### 8.1 Immediate Revocation Scenarios

**Scenarios:**
- Employee termination
- Security incident
- Policy violation
- Compromised credentials
- Legal requirement

**Revocation Process:**
1. Identify accounts to revoke
2. Revoke all active sessions
3. Disable accounts
4. Revoke API keys and tokens
5. Remove from all groups and roles
6. Log revocation event
7. Notify relevant parties

### 8.2 Scheduled Revocation

**Scheduled Scenarios:**
- Temporary access expiration
- Contract end date
- Project completion
- Time-limited grants

**Revocation Process:**
1. Identify expiring access
2. Send reminder notifications (7 days, 3 days, 1 day)
3. Automatically revoke on expiration
4. Log revocation event
5. Notify relevant parties

---

## 9. Security Testing

### 9.1 Privileged Access Tests

**Test Scenarios:**
- Platform admin cannot access tenant data without approval
- Tenant admin cannot access Highly Restricted data without permission
- Emergency access requires multi-party approval
- Support access is time-limited
- Separation of duties enforced
- All privileged actions logged
- Access revocation works correctly

**Test Execution:**
```typescript
describe('Privileged Access', () => {
  it('should prevent platform admin from accessing tenant data', async () => {
    const platformAdmin = await createPlatformAdmin();
    const tenant = await createTenant();
    const lead = await createLead(tenant.id);
    
    await expect(
      getLead(lead.id, platformAdmin)
    ).rejects.toThrow(ForbiddenError);
  });
  
  it('should require approval for emergency access', async () => {
    const platformAdmin = await createPlatformAdmin();
    const tenant = await createTenant();
    
    await expect(
      requestEmergencyAccess(tenant.id, platformAdmin)
    ).rejects.toThrow(ApprovalRequiredError);
  });
  
  it('should enforce separation of duties', async () => {
    const admin = await createTenantAdmin();
    const expense = await createExpense({ createdById: admin.id });
    
    await expect(
      approveExpense(expense.id, admin)
    ).rejects.toThrow(SeparationOfDutiesError);
  });
});
```

---

## 10. Compliance and Legal

### 10.1 Regulatory Requirements

**Applicable Regulations:**
- GDPR (if EU data subjects)
- Tanzania Data Protection Act (if applicable)
- Industry-specific regulations (healthcare, finance, etc.)
- Contractual requirements

**Compliance Controls:**
- Data access logging
- Right to access (data subject requests)
- Right to erasure (data deletion)
- Data portability (data export)
- Breach notification procedures

### 10.2 Legal Hold

**Legal Hold Process:**
1. Legal team issues hold notice
2. Identify relevant data
3. Prevent data deletion or modification
4. Preserve audit logs
5. Document hold scope
6. Notify IT and security teams
7. Monitor compliance

**Hold Duration:**
- Until legal team releases hold
- Or as specified in hold notice
- Data preserved even after normal retention period

---

## 11. References

- Stage 2: Tenancy and Authorization Architecture
- Stage 3: Security Engineering Controls
- Stage 6: Approval and Delegation Framework
- NIST SP 800-53 (Security and Privacy Controls)
- ISO 27001 (Information Security Management)
- CIS Controls (Center for Internet Security)

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Security Architect
