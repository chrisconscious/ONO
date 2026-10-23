# Data Quality and Freshness Specification

**Document ID:** BI-8.4  
**Stage:** 8 — Business Intelligence, Analytics, KPI Definitions, and Data Quality  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines data quality and freshness requirements for the ClickIT analytics platform. It establishes standards for ensuring analytical results are trustworthy, complete, and timely.

**Key Principles:**
- Data quality is measurable and monitorable
- Freshness is clearly communicated to users
- Quality issues are detected and reported proactively
- Users can assess data reliability before making decisions
- Quality requirements vary by metric and use case

---

## 2. Data Quality Dimensions

### 2.1 Quality Dimensions

**Completeness:**
- **Definition:** Percentage of required data present
- **Measurement:** (Records with required fields / Total records) × 100
- **Target:** ≥ 95% for critical metrics, ≥ 90% for standard metrics
- **Example:** 98% of invoices have customer ID, issue date, and total amount

**Accuracy:**
- **Definition:** Percentage of data values that are correct
- **Measurement:** (Correct values / Total values) × 100
- **Target:** ≥ 99% for financial data, ≥ 95% for operational data
- **Example:** 99.5% of invoice totals match line item sums

**Consistency:**
- **Definition:** Absence of conflicting values across related records
- **Measurement:** (Consistent records / Total records) × 100
- **Target:** ≥ 99%
- **Example:** Customer name is same across all their invoices

**Timeliness:**
- **Definition:** Data is available when needed
- **Measurement:** (Data available within SLA / Total data) × 100
- **Target:** ≥ 95% within SLA
- **Example:** 98% of daily metrics available by 8 AM

**Uniqueness:**
- **Definition:** Absence of duplicate records
- **Measurement:** (Unique records / Total records) × 100
- **Target:** ≥ 99.9%
- **Example:** 99.95% of leads are unique (no duplicates)

**Validity:**
- **Definition:** Data conforms to defined formats and ranges
- **Measurement:** (Valid values / Total values) × 100
- **Target:** ≥ 99%
- **Example:** 99.8% of email addresses have valid format

### 2.2 Quality Scoring

**Overall Quality Score:**
```
Quality Score = (Completeness + Accuracy + Consistency + Timeliness + Uniqueness + Validity) / 6
```

**Quality Levels:**
- **Excellent:** 95-100% - Data is highly reliable
- **Good:** 90-94% - Data is reliable with minor issues
- **Fair:** 80-89% - Data is usable with caution
- **Poor:** 70-79% - Data has significant issues
- **Critical:** < 70% - Data is not reliable

---

## 3. Data Quality Checks

### 3.1 Check Types

**Structural Checks:**
- Required fields present
- Data types correct
- Formats valid (email, phone, date)
- Values within expected ranges
- Referential integrity maintained

**Business Logic Checks:**
- Invoice total = sum of line items
- Payment amount ≤ invoice amount
- Start date ≤ end date
- Quantity ≥ 0
- Status transitions valid

**Statistical Checks:**
- Values within normal distribution
- No unusual outliers
- Trends within expected bounds
- Seasonal patterns consistent

**Cross-Reference Checks:**
- Related records consistent
- Parent-child relationships valid
- Aggregations match details
- Foreign keys valid

### 3.2 Check Implementation

**Quality Check Definition:**
```typescript
interface QualityCheck {
  id: string;
  name: string;
  description: string;
  entity: string;                    // Entity to check
  type: 'structural' | 'business' | 'statistical' | 'cross_reference';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Check logic
  condition: string;                 // Check condition (e.g., "total > 0")
  query?: string;                    // SQL query for complex checks
  
  // Thresholds
  warningThreshold: number;          // Warning if below this %
  criticalThreshold: number;         // Critical if below this %
  
  // Execution
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  scope: 'all' | 'recent' | 'custom';
  sampleSize?: number;               // For sampling checks
  
  // Actions
  notifyOnFailure: boolean;
  notifyRoles: string[];
  createTicket: boolean;
  blockProcessing: boolean;          // Block if critical failure
  
  // Metadata
  isActive: boolean;
  ownerId: string;
  lastRunAt?: Date;
  lastResult?: QualityCheckResult;
}

interface QualityCheckResult {
  checkId: string;
  executedAt: Date;
  status: 'passed' | 'warning' | 'critical' | 'error';
  totalRecords: number;
  passedRecords: number;
  failedRecords: number;
  passRate: number;                  // 0-100
  failedSamples?: any[];             // Sample of failed records
  errorMessage?: string;
  executionTime: number;             // milliseconds
}
```

**Example Quality Checks:**

**Check 1: Invoice Total Validation**
```typescript
{
  id: 'qc-finance-001',
  name: 'Invoice Total Validation',
  description: 'Verify invoice total equals sum of line items',
  entity: 'Invoice',
  type: 'business',
  severity: 'critical',
  condition: 'total = SUM(lineItems.amount)',
  query: `
    SELECT i.id, i.total, SUM(li.amount) as calculated_total
    FROM invoices i
    JOIN invoiceLines li ON li.invoiceId = i.id
    WHERE i.organizationId = :tenantId
      AND i.createdDate >= :startDate
    GROUP BY i.id, i.total
    HAVING i.total != SUM(li.amount)
  `,
  warningThreshold: 99,
  criticalThreshold: 95,
  frequency: 'daily',
  scope: 'recent',
  notifyOnFailure: true,
  notifyRoles: ['finance_manager', 'data_steward'],
  createTicket: true,
  blockProcessing: false,
  isActive: true,
  ownerId: 'finance_director'
}
```

**Check 2: Lead Email Validation**
```typescript
{
  id: 'qc-crm-001',
  name: 'Lead Email Format Validation',
  description: 'Verify lead email addresses have valid format',
  entity: 'Lead',
  type: 'structural',
  severity: 'medium',
  condition: 'email MATCHES email_regex',
  query: `
    SELECT id, email
    FROM leads
    WHERE organizationId = :tenantId
      AND email IS NOT NULL
      AND email NOT LIKE '%_@__%.__%'
  `,
  warningThreshold: 95,
  criticalThreshold: 90,
  frequency: 'daily',
  scope: 'all',
  notifyOnFailure: true,
  notifyRoles: ['crm_manager'],
  createTicket: false,
  blockProcessing: false,
  isActive: true,
  ownerId: 'crm_manager'
}
```

### 3.3 Quality Monitoring

**Real-Time Monitoring:**
- Validate data on entry
- Block invalid data (if critical)
- Log validation results
- Alert on patterns

**Batch Monitoring:**
- Run scheduled quality checks
- Calculate quality scores
- Generate quality reports
- Trigger remediation workflows

**Quality Dashboard:**
```typescript
interface QualityDashboard {
  overallScore: number;              // 0-100
  dimensionScores: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
    uniqueness: number;
    validity: number;
  };
  entityScores: Record<string, number>;  // Score by entity
  trend: {
    current: number;
    previous: number;
    change: number;                  // Percentage change
  };
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  lastUpdated: Date;
}
```

---

## 4. Data Freshness

### 4.1 Freshness Definitions

**Data Freshness:**
- **Definition:** How current the data is
- **Measurement:** Time since last update
- **Communication:** Display "as of" timestamp on all analytics

**Freshness Categories:**
- **Real-Time:** < 1 minute old
- **Near Real-Time:** < 15 minutes old
- **Hourly:** < 1 hour old
- **Daily:** < 24 hours old
- **Weekly:** < 7 days old
- **Stale:** > 7 days old

### 4.2 Freshness Requirements

**By Data Type:**
```typescript
const FRESHNESS_REQUIREMENTS = {
  // Operational data
  'lead': { target: 'real_time', sla: '5 minutes' },
  'contact': { target: 'real_time', sla: '5 minutes' },
  'opportunity': { target: 'real_time', sla: '5 minutes' },
  'invoice': { target: 'real_time', sla: '5 minutes' },
  'payment': { target: 'real_time', sla: '5 minutes' },
  
  // Aggregated data
  'daily_metrics': { target: 'hourly', sla: '1 hour' },
  'weekly_metrics': { target: 'daily', sla: '24 hours' },
  'monthly_metrics': { target: 'daily', sla: '24 hours' },
  
  // Analytical data
  'dashboard_data': { target: 'hourly', sla: '1 hour' },
  'report_data': { target: 'daily', sla: '24 hours' },
  'ai_context': { target: 'hourly', sla: '1 hour' },
};
```

**By Metric Criticality:**
- **Critical Metrics:** Real-time or near real-time (e.g., cash position)
- **Important Metrics:** Hourly (e.g., sales pipeline)
- **Standard Metrics:** Daily (e.g., monthly trends)
- **Historical Metrics:** Weekly or monthly (e.g., year-over-year)

### 4.3 Freshness Monitoring

**Freshness Check:**
```typescript
interface FreshnessCheck {
  metricId: string;
  lastCalculatedAt: Date;
  expectedFrequency: string;         // 'real_time', 'hourly', 'daily', etc.
  maxAge: number;                    // Maximum age in seconds
  currentAge: number;                // Current age in seconds
  isStale: boolean;
  severity: 'ok' | 'warning' | 'critical';
}

function checkFreshness(metricId: string): FreshnessCheck {
  const metric = getMetric(metricId);
  const lastCalculated = metric.lastCalculatedAt;
  const currentAge = (Date.now() - lastCalculated.getTime()) / 1000;
  const maxAge = getMaxAge(metric.expectedFrequency);
  
  return {
    metricId,
    lastCalculatedAt: lastCalculated,
    expectedFrequency: metric.expectedFrequency,
    maxAge,
    currentAge,
    isStale: currentAge > maxAge,
    severity: currentAge > maxAge * 2 ? 'critical' : 
              currentAge > maxAge ? 'warning' : 'ok'
  };
}
```

**Freshness Alerts:**
- Warning: Data older than expected frequency
- Critical: Data older than 2× expected frequency
- Notification: Alert metric owner and data steward
- Dashboard: Display freshness indicator

### 4.4 Freshness Communication

**User-Facing Indicators:**
```typescript
interface FreshnessIndicator {
  metricId: string;
  lastUpdated: Date;
  age: string;                       // "2 minutes ago", "1 hour ago"
  status: 'fresh' | 'stale' | 'critical';
  message: string;                   // User-friendly message
}

// Display examples:
// "Last updated: 2 minutes ago" ✓
// "Last updated: 2 hours ago (expected: hourly)" ⚠️
// "Last updated: 2 days ago (expected: daily)" ❌
```

**Dashboard Display:**
- Show "as of" timestamp on all metrics
- Color-code freshness status (green/yellow/red)
- Provide refresh button for stale data
- Explain why data might be stale

---

## 5. Data Quality Issues

### 5.1 Issue Classification

**Issue Types:**
- **Missing Data:** Required fields empty
- **Invalid Data:** Values outside expected ranges or formats
- **Duplicate Data:** Same record appears multiple times
- **Inconsistent Data:** Conflicting values across records
- **Stale Data:** Data not updated within SLA
- **Orphaned Data:** Records without required relationships
- **Corrupted Data:** Data damaged or unreadable

**Severity Levels:**
- **Critical:** Blocks business operations or financial reporting
- **High:** Significantly impacts decision-making
- **Medium:** Affects some analyses but workarounds exist
- **Low:** Minor issue with minimal impact

### 5.2 Issue Detection

**Automated Detection:**
- Quality checks run on schedule
- Anomaly detection for unusual patterns
- User reports via feedback mechanism
- System monitoring for data pipeline failures

**Manual Detection:**
- User observations during analysis
- Data steward reviews
- Audit findings
- External reports

### 5.3 Issue Resolution

**Resolution Workflow:**
```
Issue Detected
    ↓
Classify and Prioritize
    ↓
Assign to Owner
    ↓
Investigate Root Cause
    ↓
Develop Fix
    ↓
Apply Fix
    ↓
Verify Resolution
    ↓
Document and Close
```

**Resolution Actions:**
- **Missing Data:** Request from source, manual entry, or exclude from analysis
- **Invalid Data:** Correct at source, apply transformation, or exclude
- **Duplicate Data:** Merge records, delete duplicates, or apply deduplication rules
- **Inconsistent Data:** Reconcile at source, apply consistency rules
- **Stale Data:** Trigger refresh, investigate pipeline failure
- **Orphaned Data:** Create missing relationships or delete orphans
- **Corrupted Data:** Restore from backup, rebuild from source

**Resolution Tracking:**
```typescript
interface QualityIssue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  
  // Details
  entity: string;
  recordIds: string[];
  description: string;
  detectedAt: Date;
  detectedBy: string;                // 'automated' | user ID
  
  // Assignment
  assignedTo: string;
  assignedAt: Date;
  
  // Resolution
  rootCause?: string;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  
  // Verification
  verifiedAt?: Date;
  verifiedBy?: string;
  
  // Impact
  affectedMetrics: string[];
  affectedDashboards: string[];
  businessImpact?: string;
}
```

---

## 6. Data Quality Reporting

### 6.1 Quality Reports

**Daily Quality Report:**
```typescript
interface DailyQualityReport {
  date: Date;
  overallScore: number;
  dimensionScores: Record<string, number>;
  
  // Issues summary
  newIssues: number;
  resolvedIssues: number;
  openIssues: number;
  
  // By severity
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  
  // By entity
  entityScores: Record<string, number>;
  
  // Top issues
  topIssues: QualityIssue[];
  
  // Trends
  trend: {
    current: number;
    previous: number;
    change: number;
  };
}
```

**Weekly Quality Summary:**
- Overall quality trend
- Issue resolution rate
- Data freshness compliance
- Top quality concerns
- Improvement actions

**Monthly Quality Review:**
- Quality performance vs. targets
- Issue patterns and root causes
- Data quality improvement initiatives
- Quality governance recommendations

### 6.2 Quality Communication

**User Notifications:**
- Alert when data quality drops below threshold
- Notify when critical issues detected
- Inform when stale data detected
- Update on issue resolution

**Stakeholder Reports:**
- Executive summary of data quality
- Detailed quality metrics
- Issue tracking and resolution
- Improvement roadmap

---

## 7. Data Quality Governance

### 7.1 Roles and Responsibilities

**Data Quality Owner:**
- Accountable for data quality in their domain
- Defines quality requirements
- Monitors quality metrics
- Drives quality improvements

**Data Steward:**
- Responsible for day-to-day quality management
- Investigates and resolves issues
- Validates data corrections
- Maintains quality documentation

**Data Quality Team:**
- Defines quality standards
- Develops quality checks
- Monitors overall quality
- Reports on quality metrics

**Business Users:**
- Report quality issues
- Validate quality improvements
- Provide feedback on data usability

### 7.2 Quality Standards

**Minimum Standards:**
- All critical metrics: ≥ 95% quality score
- All important metrics: ≥ 90% quality score
- All standard metrics: ≥ 85% quality score
- Data freshness: ≥ 95% within SLA

**Quality Gates:**
- Data cannot be used in dashboards if quality < 80%
- Critical metrics require quality ≥ 95%
- Financial metrics require quality ≥ 99%
- All metrics require freshness within SLA

### 7.3 Quality Improvement

**Continuous Improvement:**
- Regular quality reviews
- Root cause analysis
- Process improvements
- Automation of quality checks
- Training and awareness

**Quality Initiatives:**
- Data cleansing projects
- Source system improvements
- Integration enhancements
- Quality monitoring expansion
- User education programs

---

## 8. Acceptance Criteria

### 8.1 Quality Requirements

- [ ] All metrics have defined quality requirements
- [ ] Quality checks implemented for critical metrics
- [ ] Quality scores calculated and displayed
- [ ] Freshness indicators shown on all analytics
- [ ] Quality issues detected and tracked
- [ ] Resolution workflows functional
- [ ] Quality reports generated automatically
- [ ] Stakeholders notified of quality issues

### 8.2 Freshness Requirements

- [ ] Freshness requirements defined for all metrics
- [ ] Freshness monitored continuously
- [ ] Stale data alerts triggered appropriately
- [ ] Refresh mechanisms functional
- [ ] Freshness communicated clearly to users
- [ ] SLA compliance tracked and reported

### 8.3 Governance Requirements

- [ ] Quality roles defined and assigned
- [ ] Quality standards documented
- [ ] Quality reviews conducted regularly
- [ ] Improvement initiatives tracked
- [ ] Quality metrics reported to stakeholders

---

## 9. References

- Stage 5: Data Domain Catalog
- Stage 7: Data Classification and Privacy Policy
- Industry standards: DAMA-DMBOK (Data Management Body of Knowledge)
- Data Quality Framework: ISO 8000 (Data Quality)

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Data Quality Manager / Data Stewards
