# Analytics Security and Tenant Boundaries

**Document ID:** BI-8.10  
**Stage:** 8 — Business Intelligence, Analytics, KPI Definitions, and Data Quality  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines security requirements for analytics and business intelligence in the ClickIT platform. It ensures tenant isolation, data protection, and permission enforcement throughout the analytics lifecycle.

**Key Principles:**
- Tenant isolation enforced at every layer
- User permissions respected in all analytics
- Data classification applied to analytical outputs
- Complete audit trail for all analytics operations
- No cross-tenant data leakage through analytics
- Export security matches view security

---

## 2. Tenant Isolation in Analytics

### 2.1 Isolation Enforcement Points

**Data Retrieval:**
- All queries include tenant filter
- RLS policies on all analytical tables
- Middleware validates tenant context
- No cross-tenant joins or unions

**Metric Calculation:**
- Metrics calculated per tenant
- No shared metric calculations
- Tenant-scoped aggregations
- Tenant-specific baselines

**Dashboard Rendering:**
- Dashboards tenant-scoped
- Widget data filtered by tenant
- No cross-tenant comparisons
- Tenant-specific configurations

**AI Insights:**
- AI context retrieval tenant-scoped
- Models trained per tenant (or with explicit isolation)
- Predictions tenant-specific
- No cross-tenant learning

**Exports:**
- Exports contain only tenant data
- Export permissions tenant-scoped
- No cross-tenant data in exports
- Export audit trail per tenant

### 2.2 Isolation Testing

**Test Scenarios:**
```typescript
describe('Analytics Tenant Isolation', () => {
  it('should prevent cross-tenant metric access', async () => {
    const tenant1Metric = await calculateMetric('kpi-sales-001', { tenantId: 'tenant1' });
    const tenant2Metric = await calculateMetric('kpi-sales-001', { tenantId: 'tenant2' });
    
    expect(tenant1Metric.value).not.toBe(tenant2Metric.value);
  });
  
  it('should prevent cross-tenant dashboard access', async () => {
    const tenant1Dashboard = await getDashboard('dashboard-001', { tenantId: 'tenant1' });
    
    await expect(
      getDashboard('dashboard-001', { tenantId: 'tenant2' })
    ).rejects.toThrow(NotFoundError);
  });
  
  it('should prevent cross-tenant AI insights', async () => {
    const tenant1Insight = await generateInsight('revenue_trend', { tenantId: 'tenant1' });
    
    expect(tenant1Insight.data).not.toContain('tenant2');
  });
  
  it('should prevent cross-tenant exports', async () => {
    const tenant1Export = await exportData('leads', { tenantId: 'tenant1' });
    
    expect(tenant1Export.data.every(record => record.organizationId === 'tenant1')).toBe(true);
  });
});
```

---

## 3. Permission Enforcement

### 3.1 Permission Checks

**Dashboard Access:**
- Check user has `dashboard:read` permission
- Check dashboard is assigned to user's role
- Check tenant membership active
- Log access attempt

**Metric Access:**
- Check user has `metric:read` permission
- Check metric classification allows access
- Check data scope (own/team/department/org)
- Log access attempt

**Drill-Down Access:**
- Check user has permission for target entity
- Check data scope for target records
- Check classification allows access
- Log drill-down action

**Export Access:**
- Check user has `export` permission
- Check export classification allows export
- Check data scope for export
- Log export action

### 3.2 Permission Implementation

**Permission Check Function:**
```typescript
async function checkAnalyticsPermission(
  userId: string,
  action: 'read' | 'export' | 'admin',
  resource: string,
  resourceId: string,
  tenantId: string
): Promise<boolean> {
  // 1. Check user has permission
  const hasPermission = await db.permission.findFirst({
    where: {
      userId,
      action,
      resource,
      organizationId: tenantId
    }
  });
  
  if (!hasPermission) return false;
  
  // 2. Check data scope
  const resource_data = await getResource(resource, resourceId);
  if (!await isInScope(userId, resource_data, tenantId)) {
    return false;
  }
  
  // 3. Check classification
  const classification = getResourceClassification(resource);
  if (!await canAccessClassification(userId, classification, tenantId)) {
    return false;
  }
  
  return true;
}
```

---

## 4. Data Classification in Analytics

### 4.1 Classification Application

**Analytical Data Classification:**
- **Public:** Aggregated platform statistics (if approved)
- **Internal:** Standard dashboards and reports
- **Confidential:** Detailed financial and customer analytics
- **Highly Restricted:** Executive summaries with sensitive data

**Classification Rules:**
```typescript
const ANALYTICS_CLASSIFICATION = {
  // Dashboard data
  'dashboard.standard': 'internal',
  'dashboard.executive': 'confidential',
  'dashboard.financial': 'confidential',
  
  // Metric data
  'metric.operational': 'internal',
  'metric.financial': 'confidential',
  'metric.hr': 'confidential',
  'metric.executive': 'highly_restricted',
  
  // Report data
  'report.standard': 'internal',
  'report.financial': 'confidential',
  'report.executive': 'highly_restricted',
  
  // AI insights
  'insight.operational': 'internal',
  'insight.financial': 'confidential',
  'insight.recommendation': 'confidential',
};
```

### 4.2 Classification Enforcement

**Access Control:**
- Check user can access classification level
- Mask sensitive fields in exports
- Redact PII in reports
- Encrypt sensitive analytical data

**Export Controls:**
- Highly Restricted: Requires explicit approval
- Confidential: Requires export permission
- Internal: Standard export permissions
- Public: No restrictions

---

## 5. Cached Data Security

### 5.1 Cache Isolation

**Cache Key Structure:**
```typescript
function getCacheKey(tenantId: string, metricId: string, parameters: any): string {
  return `tenant:${tenantId}:metric:${metricId}:${hash(parameters)}`;
}
```

**Cache Access:**
- All cache keys include tenant ID
- Cache access requires tenant context
- No shared cache entries across tenants
- Cache invalidation on tenant changes

### 5.2 Cache Security

**Encryption:**
- Encrypt sensitive cached data
- Use tenant-specific encryption keys
- Rotate keys regularly

**Expiration:**
- Set appropriate TTL per metric
- Invalidate on source data changes
- Clear cache on tenant suspension

**Access Control:**
- Validate tenant context on cache access
- Check permissions before returning cached data
- Log all cache access

---

## 6. Audit Logging

### 6.1 Analytics Audit Events

**Logged Events:**
- Dashboard access
- Metric calculation
- Drill-down actions
- Export operations
- AI insight generation
- Report generation
- Permission denials

**Audit Record:**
```typescript
interface AnalyticsAuditRecord {
  id: string;
  timestamp: Date;
  eventType: string;
  
  // Actor
  userId: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  
  // Tenant
  tenantId: string;
  tenantName: string;
  
  // Action
  action: string;
  resource: string;
  resourceId?: string;
  
  // Details
  parameters?: any;
  result?: any;
  
  // Outcome
  outcome: 'success' | 'failure';
  failureReason?: string;
  
  // Context
  sessionId: string;
  requestId: string;
}
```

### 6.2 Audit Monitoring

**Monitoring Rules:**
- Alert on unusual access patterns
- Alert on permission denials
- Alert on large exports
- Alert on off-hours access
- Alert on cross-tenant access attempts

**Reporting:**
- Daily analytics access summary
- Weekly analytics usage report
- Monthly security audit report
- Quarterly compliance report

---

## 7. Platform-Wide Analytics

### 7.1 Platform Statistics

**Allowed Platform Statistics:**
- Total number of tenants
- Total number of users
- Platform uptime and performance
- Feature usage (anonymized)
- Support ticket volume

**Prohibited Platform Statistics:**
- Tenant revenue or financial data
- Tenant customer data
- Tenant operational data
- Any tenant-specific business data

### 7.2 Platform Analytics Security

**Data Aggregation:**
- Aggregate across all tenants
- Anonymize all tenant identifiers
- Remove any tenant-specific patterns
- Validate no tenant can be identified

**Access Control:**
- Platform admins only
- Multi-party approval for access
- Complete audit trail
- Time-limited access grants

**Usage Restrictions:**
- Cannot be used to infer tenant data
- Cannot be shared externally
- Cannot be used for competitive analysis
- Must comply with privacy policies

---

## 8. Future Data Marketplace

### 8.1 Marketplace Security Requirements

**Participation Requirements:**
- Explicit tenant consent
- Separate legal agreement
- Clear data usage policies
- Opt-in only (not automatic)

**Data Protection:**
- Aggregation to prevent identification
- Anonymization of PII
- Differential privacy techniques
- Re-identification risk assessment

**Access Control:**
- Approved researchers only
- Purpose-limited access
- Time-limited access
- Complete audit trail

**Governance:**
- Independent ethics review
- Regular compliance audits
- Transparent reporting
- Tenant right to withdraw

### 8.2 Marketplace Prohibitions

**Prohibited Uses:**
- Re-identification of tenants
- Competitive intelligence
- Direct marketing to tenants
- Any use not explicitly approved

**Prohibited Data:**
- Tenant business data
- Customer PII
- Financial records
- Operational details

---

## 9. Acceptance Criteria

### 9.1 Tenant Isolation Requirements

- [ ] All analytics queries tenant-scoped
- [ ] RLS policies on all analytical tables
- [ ] No cross-tenant data in dashboards
- [ ] No cross-tenant data in exports
- [ ] No cross-tenant data in AI insights
- [ ] Tenant isolation tested automatically
- [ ] Penetration testing validates isolation

### 9.2 Permission Requirements

- [ ] Dashboard access permission-checked
- [ ] Metric access permission-checked
- [ ] Drill-down access permission-checked
- [ ] Export access permission-checked
- [ ] Permission denials logged
- [ ] Permission tests automated

### 9.3 Data Protection Requirements

- [ ] Data classification applied to analytics
- [ ] Sensitive data encrypted
- [ ] PII masked in exports
- [ ] Cache isolation enforced
- [ ] Audit logging complete
- [ ] Platform statistics anonymized

### 9.4 Marketplace Requirements

- [ ] Participation requires explicit consent
- [ ] Data fully anonymized
- [ ] Re-identification risk assessed
- [ ] Access control enforced
- [ ] Audit trail complete
- [ ] Governance framework in place

---

## 10. References

- Stage 7: Multi-Tenant Security Controls
- Stage 7: Data Classification and Privacy Policy
- Stage 7: Audit Logging and Accountability Specification
- Industry standards: ISO 27001, SOC 2

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Security Architect / BI Architect
