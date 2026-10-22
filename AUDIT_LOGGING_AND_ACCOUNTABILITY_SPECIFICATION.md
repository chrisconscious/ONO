# Audit Logging and Accountability Specification

**Document ID:** SEC-7.8  
**Stage:** 7 — Security, Identity, Permissions, Privacy, and Audit Design  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the comprehensive audit logging requirements for the ClickIT platform. Audit logging provides accountability, enables security monitoring, supports compliance requirements, and facilitates incident investigation.

**Key Principles:**
- Comprehensive logging of all security-relevant events
- Immutable audit trail (cannot be modified or deleted)
- Tamper-evident logging
- Complete context for each event
- Protection of sensitive data in logs
- Retention according to regulatory requirements
- Separation from application debugging logs

---

## 2. Audit Event Model

### 2.1 Audit Event Schema

**Core Schema:**
```typescript
interface AuditEvent {
  // Event identification
  id: string;                    // Unique event ID (UUID)
  timestamp: Date;               // Event timestamp (UTC)
  eventType: string;             // Event type classification
  
  // Actor information
  actor: {
    type: 'user' | 'system' | 'integration' | 'anonymous';
    id?: string;                 // User ID, system ID, or integration ID
    name?: string;               // Actor name (for display)
    ipAddress: string;           // Source IP address
    userAgent?: string;          // User agent string
    sessionId?: string;          // Session ID (if applicable)
  };
  
  // Tenant context
  tenant: {
    id: string;                  // Organization/tenant ID
    name?: string;               // Tenant name (for display)
  };
  
  // Action details
  action: {
    type: string;                // Action type (create, read, update, delete, etc.)
    resource: string;            // Resource type (lead, invoice, user, etc.)
    resourceId?: string;         // Specific resource ID
    resourceName?: string;       // Resource name (for display)
  };
  
  // Outcome
  outcome: {
    status: 'success' | 'failure' | 'partial';
    reason?: string;             // Failure reason (if applicable)
    errorCode?: string;          // Error code (if applicable)
  };
  
  // Change details (for update operations)
  changes?: {
    before?: Record<string, any>;  // Previous values
    after?: Record<string, any>;   // New values
    fields?: string[];             // Changed field names
  };
  
  // Context
  context?: {
    correlationId?: string;      // Request correlation ID
    requestId?: string;          // Request ID
    workflowId?: string;         // Workflow ID (if applicable)
    approvalId?: string;         // Approval ID (if applicable)
    metadata?: Record<string, any>;  // Additional context
  };
  
  // Security classification
  sensitivity: 'public' | 'internal' | 'confidential' | 'highly_restricted';
  
  // Retention
  retention: {
    retentionDays: number;       // How long to keep
    legalHold?: boolean;         // Under legal hold?
  };
}
```

### 2.2 Event Type Classification

**Authentication Events:**
- `auth.login.success` - Successful login
- `auth.login.failure` - Failed login attempt
- `auth.logout` - User logout
- `auth.session.create` - Session created
- `auth.session.destroy` - Session destroyed
- `auth.password.change` - Password changed
- `auth.password.reset.request` - Password reset requested
- `auth.password.reset.complete` - Password reset completed
- `auth.mfa.enable` - MFA enabled
- `auth.mfa.disable` - MFA disabled
- `auth.mfa.verify` - MFA verification

**Authorization Events:**
- `auth.permission.check` - Permission check (success/failure)
- `auth.role.assign` - Role assigned to user
- `auth.role.revoke` - Role revoked from user
- `auth.permission.grant` - Permission granted
- `auth.permission.revoke` - Permission revoked

**User Management Events:**
- `user.create` - User account created
- `user.update` - User account updated
- `user.delete` - User account deleted
- `user.suspend` - User account suspended
- `user.reactivate` - User account reactivated
- `user.invite` - User invited to organization
- `user.invite.accept` - Invitation accepted
- `user.invite.decline` - Invitation declined

**Data Access Events:**
- `data.read` - Data read operation
- `data.create` - Data created
- `data.update` - Data updated
- `data.delete` - Data deleted (soft or hard)
- `data.export` - Data exported
- `data.import` - Data imported

**Financial Events:**
- `finance.invoice.create` - Invoice created
- `finance.invoice.approve` - Invoice approved
- `finance.invoice.pay` - Invoice paid
- `finance.payment.create` - Payment recorded
- `finance.payment.approve` - Payment approved
- `finance.expense.create` - Expense created
- `finance.expense.approve` - Expense approved
- `finance.budget.create` - Budget created
- `finance.budget.approve` - Budget approved

**Approval Events:**
- `approval.request` - Approval requested
- `approval.approve` - Approval granted
- `approval.reject` - Approval rejected
- `approval.delegate` - Approval delegated
- `approval.escalate` - Approval escalated

**Administrative Events:**
- `admin.organization.create` - Organization created
- `admin.organization.update` - Organization updated
- `admin.organization.suspend` - Organization suspended
- `admin.settings.update` - Settings updated
- `admin.integration.create` - Integration created
- `admin.integration.update` - Integration updated
- `admin.integration.delete` - Integration deleted

**Security Events:**
- `security.breach.attempt` - Security breach attempt detected
- `security.tenant.isolation.violation` - Tenant isolation violation
- `security.privilege.escalation.attempt` - Privilege escalation attempt
- `security.sensitive.data.access` - Sensitive data accessed
- `security.emergency.access` - Emergency access granted
- `security.account.lockout` - Account locked out

**AI/Automation Events:**
- `ai.recommendation.generate` - AI recommendation generated
- `ai.recommendation.approve` - AI recommendation approved
- `ai.recommendation.reject` - AI recommendation rejected
- `ai.action.execute` - AI action executed
- `automation.rule.create` - Automation rule created
- `automation.rule.execute` - Automation rule executed
- `automation.rule.failure` - Automation rule failed

**System Events:**
- `system.startup` - System started
- `system.shutdown` - System shutdown
- `system.backup.create` - Backup created
- `system.backup.restore` - Backup restored
- `system.migration.run` - Database migration run
- `system.config.change` - System configuration changed

---

## 3. Logging Requirements

### 3.1 What to Log

**Must Log (Security-Critical):**
- All authentication events (success and failure)
- All authorization decisions (allow and deny)
- All privilege changes
- All sensitive data access
- All administrative actions
- All approval decisions
- All data exports
- All security incidents
- All tenant isolation violations
- All AI/ML actions with material impact

**Should Log (Operational):**
- All data create/update/delete operations
- All workflow state changes
- All integration activities
- All automation executions
- All file uploads/downloads
- All search operations
- All report generations

**May Log (Debugging):**
- Detailed request/response data (non-sensitive)
- Performance metrics
- Cache operations
- Queue operations

**Never Log:**
- Passwords or password hashes
- API keys or secrets
- Credit card numbers
- Full credit card CVV
- Session tokens
- Encryption keys
- Sensitive personal data (unless required for audit)
- Full request/response bodies with sensitive data

### 3.2 Log Enrichment

**Context Enrichment:**
```typescript
async function enrichAuditEvent(event: Partial<AuditEvent>): Promise<AuditEvent> {
  return {
    ...event,
    id: generateUUID(),
    timestamp: new Date(),
    actor: {
      ...event.actor,
      ipAddress: getClientIP(),
      userAgent: getUserAgent(),
      sessionId: getSessionId(),
    },
    tenant: {
      id: getTenantId(),
      name: await getTenantName(),
    },
    context: {
      correlationId: getCorrelationId(),
      requestId: getRequestId(),
    },
    sensitivity: classifyEventSensitivity(event),
    retention: getRetentionPeriod(event.eventType),
  };
}
```

### 3.3 Log Sanitization

**Sanitization Rules:**
```typescript
const SANITIZE_FIELDS = [
  'password',
  'passwordHash',
  'secret',
  'token',
  'apiKey',
  'creditCard',
  'cvv',
  'ssn',
  'bankAccount',
];

function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  for (const field of SANITIZE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
```

---

## 4. Audit Log Storage

### 4.1 Storage Architecture

**Storage Strategy:**
- Primary: PostgreSQL database (audit schema)
- Backup: Encrypted object storage (daily)
- Archive: Cold storage after 1 year
- Retention: Per event type (3-10 years)

**Database Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type VARCHAR(100) NOT NULL,
  actor_type VARCHAR(20) NOT NULL,
  actor_id UUID,
  actor_name VARCHAR(200),
  actor_ip_address INET NOT NULL,
  actor_user_agent TEXT,
  actor_session_id UUID,
  tenant_id UUID NOT NULL,
  tenant_name VARCHAR(200),
  action_type VARCHAR(50) NOT NULL,
  action_resource VARCHAR(100) NOT NULL,
  action_resource_id UUID,
  action_resource_name VARCHAR(500),
  outcome_status VARCHAR(20) NOT NULL,
  outcome_reason TEXT,
  outcome_error_code VARCHAR(50),
  changes JSONB,
  context JSONB,
  sensitivity VARCHAR(30) NOT NULL,
  retention_days INTEGER NOT NULL,
  legal_hold BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_action_resource ON audit_logs(action_resource);
CREATE INDEX idx_audit_logs_sensitivity ON audit_logs(sensitivity);

-- RLS for tenant isolation
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON audit_logs
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### 4.2 Log Immutability

**Immutability Requirements:**
- Audit logs cannot be updated after creation
- Audit logs cannot be deleted (except per retention policy)
- Audit logs cannot be modified by any user (including admins)
- Database triggers prevent updates/deletes
- Application code enforces immutability

**Immutability Enforcement:**
```sql
-- Prevent updates
CREATE OR REPLACE FUNCTION prevent_audit_log_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs cannot be updated';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_update();

-- Prevent deletes (except via retention job)
CREATE OR REPLACE FUNCTION prevent_audit_log_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW IS NULL THEN
    -- Allow deletion only via retention job
    IF current_user != 'audit_retention_job' THEN
      RAISE EXCEPTION 'Audit logs cannot be deleted';
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_delete();
```

### 4.3 Log Retention

**Retention Policy:**
```typescript
const RETENTION_POLICY = {
  // Security events: 10 years
  'auth.*': 3650,
  'security.*': 3650,
  
  // Administrative events: 7 years
  'admin.*': 2555,
  'user.*': 2555,
  
  // Financial events: 7 years (legal requirement)
  'finance.*': 2555,
  
  // Data access events: 3 years
  'data.*': 1095,
  
  // System events: 1 year
  'system.*': 365,
  
  // Default: 3 years
  '*': 1095,
};

function getRetentionPeriod(eventType: string): number {
  for (const [pattern, days] of Object.entries(RETENTION_POLICY)) {
    if (eventType.match(pattern.replace('*', '.*'))) {
      return days;
    }
  }
  return 1095; // Default 3 years
}
```

**Retention Job:**
```typescript
async function runRetentionJob() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 1095); // 3 years
  
  // Delete expired logs (not under legal hold)
  await db.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      legalHold: false,
    },
  });
  
  // Archive old logs to cold storage
  await archiveOldLogs(cutoffDate);
}
```

---

## 5. Audit Log Access

### 5.1 Access Control

**Access Rules:**
- Organization admins can view their organization's audit logs
- Platform admins can view platform-level audit logs
- Platform support can view tenant audit logs with explicit approval
- Users can view their own audit events
- No one can modify or delete audit logs

**Access Implementation:**
```typescript
async function getAuditLogs(
  filters: AuditLogFilters,
  context: AuthContext
): Promise<AuditEvent[]> {
  // Verify permission
  if (!await hasPermission(context.userId, 'admin:audit:read', context.tenantId)) {
    throw new ForbiddenError('Cannot access audit logs');
  }
  
  // Apply tenant filter
  filters.tenantId = context.tenantId;
  
  // Query logs
  return await db.auditLog.findMany({
    where: filters,
    orderBy: { timestamp: 'desc' },
    take: 1000, // Limit results
  });
}
```

### 5.2 Audit Log Queries

**Common Queries:**
```typescript
// Get all events for a specific resource
async function getResourceAuditHistory(resourceId: string): Promise<AuditEvent[]> {
  return await db.auditLog.findMany({
    where: {
      'action.resourceId': resourceId,
    },
    orderBy: { timestamp: 'desc' },
  });
}

// Get all events by a specific user
async function getUserAuditHistory(userId: string): Promise<AuditEvent[]> {
  return await db.auditLog.findMany({
    where: {
      'actor.id': userId,
    },
    orderBy: { timestamp: 'desc' },
  });
}

// Get all security events
async function getSecurityEvents(): Promise<AuditEvent[]> {
  return await db.auditLog.findMany({
    where: {
      eventType: { startsWith: 'security.' },
    },
    orderBy: { timestamp: 'desc' },
  });
}

// Get all failed login attempts
async function getFailedLogins(): Promise<AuditEvent[]> {
  return await db.auditLog.findMany({
    where: {
      eventType: 'auth.login.failure',
    },
    orderBy: { timestamp: 'desc' },
  });
}
```

### 5.3 Audit Log Export

**Export Requirements:**
- Export requires explicit permission
- Export logged with full details
- Export format: JSON or CSV
- Export size limits enforced
- Export rate limiting

**Export Implementation:**
```typescript
async function exportAuditLogs(
  filters: AuditLogFilters,
  format: 'json' | 'csv',
  context: AuthContext
): Promise<string> {
  // Verify permission
  if (!await hasPermission(context.userId, 'admin:audit:export', context.tenantId)) {
    throw new ForbiddenError('Cannot export audit logs');
  }
  
  // Log export request
  await logAuditEvent({
    eventType: 'audit.export',
    action: { type: 'export', resource: 'audit_log' },
    context: { filters, format },
  });
  
  // Query logs
  const logs = await db.auditLog.findMany({
    where: filters,
    orderBy: { timestamp: 'desc' },
  });
  
  // Format export
  if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  } else {
    return convertToCSV(logs);
  }
}
```

---

## 6. Audit Log Monitoring

### 6.1 Real-Time Monitoring

**Monitoring Rules:**
```typescript
const MONITORING_RULES = [
  {
    name: 'Failed login spike',
    condition: (events) => {
      const recent = events.filter(e => 
        e.eventType === 'auth.login.failure' &&
        e.timestamp > Date.now() - 300000 // Last 5 minutes
      );
      return recent.length > 10;
    },
    severity: 'high',
    action: 'alert_security_team',
  },
  {
    name: 'Privilege escalation attempt',
    condition: (events) => {
      return events.some(e => 
        e.eventType === 'security.privilege.escalation.attempt'
      );
    },
    severity: 'critical',
    action: 'alert_security_team_and_management',
  },
  {
    name: 'Tenant isolation violation',
    condition: (events) => {
      return events.some(e => 
        e.eventType === 'security.tenant.isolation.violation'
      );
    },
    severity: 'critical',
    action: 'alert_security_team_and_management',
  },
  {
    name: 'Sensitive data access',
    condition: (events) => {
      return events.some(e => 
        e.eventType === 'security.sensitive.data.access'
      );
    },
    severity: 'high',
    action: 'alert_security_team',
  },
  {
    name: 'Bulk data export',
    condition: (events) => {
      const recent = events.filter(e => 
        e.eventType === 'data.export' &&
        e.timestamp > Date.now() - 3600000 // Last hour
      );
      return recent.length > 5;
    },
    severity: 'medium',
    action: 'alert_security_team',
  },
];
```

### 6.2 Anomaly Detection

**Detection Patterns:**
- Unusual login times (outside business hours)
- Unusual login locations (geographic anomalies)
- Unusual access patterns (bulk operations)
- Unusual permission changes
- Unusual data exports
- Unusual API call patterns

**Detection Implementation:**
```typescript
async function detectAnomalies(userId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  
  // Check login time anomalies
  const recentLogins = await getRecentLogins(userId, 30); // Last 30 days
  const unusualTimeLogins = recentLogins.filter(login => 
    !isBusinessHours(login.timestamp)
  );
  if (unusualTimeLogins.length > 3) {
    anomalies.push({
      type: 'unusual_login_time',
      severity: 'medium',
      details: { count: unusualTimeLogins.length },
    });
  }
  
  // Check login location anomalies
  const locations = recentLogins.map(l => l.actor.ipAddress);
  const uniqueLocations = new Set(locations);
  if (uniqueLocations.size > 5) {
    anomalies.push({
      type: 'multiple_locations',
      severity: 'high',
      details: { locationCount: uniqueLocations.size },
    });
  }
  
  return anomalies;
}
```

---

## 7. Audit Log Analysis

### 7.1 Security Analysis

**Analysis Queries:**
```typescript
// Analyze failed login attempts
async function analyzeFailedLogins(): Promise<FailedLoginAnalysis> {
  const failedLogins = await db.auditLog.findMany({
    where: { eventType: 'auth.login.failure' },
    orderBy: { timestamp: 'desc' },
    take: 1000,
  });
  
  return {
    totalAttempts: failedLogins.length,
    uniqueIPs: new Set(failedLogins.map(l => l.actor.ipAddress)).size,
    uniqueUsers: new Set(failedLogins.map(l => l.actor.id)).size,
    topIPs: getTopIPs(failedLogins),
    topUsers: getTopUsers(failedLogins),
    timeDistribution: getTimeDistribution(failedLogins),
  };
}

// Analyze permission denials
async function analyzePermissionDenials(): Promise<PermissionDenialAnalysis> {
  const denials = await db.auditLog.findMany({
    where: {
      eventType: 'auth.permission.check',
      outcome: { status: 'failure' },
    },
    orderBy: { timestamp: 'desc' },
    take: 1000,
  });
  
  return {
    totalDenials: denials.length,
    topPermissions: getTopPermissions(denials),
    topUsers: getTopUsers(denials),
    timeDistribution: getTimeDistribution(denials),
  };
}
```

### 7.2 Compliance Reporting

**Compliance Reports:**
```typescript
// Generate compliance report
async function generateComplianceReport(
  period: { start: Date; end: Date }
): Promise<ComplianceReport> {
  const events = await db.auditLog.findMany({
    where: {
      timestamp: { gte: period.start, lte: period.end },
    },
  });
  
  return {
    period,
    totalEvents: events.length,
    authenticationEvents: events.filter(e => e.eventType.startsWith('auth.')).length,
    authorizationEvents: events.filter(e => e.eventType.startsWith('auth.permission')).length,
    dataAccessEvents: events.filter(e => e.eventType.startsWith('data.')).length,
    administrativeEvents: events.filter(e => e.eventType.startsWith('admin.')).length,
    securityEvents: events.filter(e => e.eventType.startsWith('security.')).length,
    failedEvents: events.filter(e => e.outcome.status === 'failure').length,
    sensitiveDataAccess: events.filter(e => e.sensitivity === 'highly_restricted').length,
  };
}
```

---

## 8. Audit Log Testing

### 8.1 Audit Logging Tests

**Test Scenarios:**
```typescript
describe('Audit Logging', () => {
  it('should log all authentication events', async () => {
    const user = await createUser();
    
    // Login
    await login(user.email, user.password);
    
    // Verify audit log
    const logs = await getAuditLogs({ eventType: 'auth.login.success' });
    expect(logs).toHaveLength(1);
    expect(logs[0].actor.id).toBe(user.id);
  });
  
  it('should log failed login attempts', async () => {
    await login('wrong@email.com', 'wrongpassword');
    
    const logs = await getAuditLogs({ eventType: 'auth.login.failure' });
    expect(logs).toHaveLength(1);
    expect(logs[0].outcome.status).toBe('failure');
  });
  
  it('should log data access events', async () => {
    const user = await createUser();
    const lead = await createLead();
    
    await getLead(lead.id, user);
    
    const logs = await getAuditLogs({
      eventType: 'data.read',
      action: { resource: 'lead' },
    });
    expect(logs).toHaveLength(1);
  });
  
  it('should log permission denials', async () => {
    const user = await createUserWithoutPermission('crm:lead:read');
    const lead = await createLead();
    
    await expect(getLead(lead.id, user)).rejects.toThrow();
    
    const logs = await getAuditLogs({
      eventType: 'auth.permission.check',
      outcome: { status: 'failure' },
    });
    expect(logs).toHaveLength(1);
  });
  
  it('should not log sensitive data', async () => {
    const user = await createUser();
    await changePassword(user.id, 'newpassword');
    
    const logs = await getAuditLogs({
      eventType: 'auth.password.change',
    });
    
    // Verify password not in logs
    const logString = JSON.stringify(logs);
    expect(logString).not.toContain('newpassword');
    expect(logString).toContain('[REDACTED]');
  });
  
  it('should enforce audit log immutability', async () => {
    const log = await createAuditLog();
    
    await expect(updateAuditLog(log.id, {})).rejects.toThrow();
    await expect(deleteAuditLog(log.id)).rejects.toThrow();
  });
});
```

---

## 9. References

- Stage 2: Data Architecture Plan
- Stage 3: Security Engineering Controls
- Stage 5: Data Architecture Plan
- NIST SP 800-92 (Guide to Computer Security Log Management)
- ISO 27001 (Information Security Management)
- GDPR Article 30 (Records of processing activities)

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Security Architect
