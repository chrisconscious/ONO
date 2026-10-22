# Analytics Lineage and Reconciliation Specification

**Document ID:** BI-8.5  
**Stage:** 8 — Business Intelligence, Analytics, KPI Definitions, and Data Quality  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines data lineage and reconciliation requirements for the ClickIT analytics platform. It ensures complete traceability from analytical results back to source data and provides mechanisms for validating analytical accuracy.

**Key Principles:**
- Complete traceability from insights to source data
- Reconciliation between operational and analytical data
- Transparent handling of corrections and adjustments
- Clear distinction between historical facts and definition changes
- Audit trail for all analytical operations

---

## 2. Data Lineage

### 2.1 Lineage Requirements

**Lineage Chain:**
```
Dashboard/Report
    ↓
Metric Definition (formula, version, parameters)
    ↓
Calculation Execution (timestamp, filters, dimensions)
    ↓
Source Records (entity IDs, field values, timestamps)
    ↓
Operational Transactions (business events)
```

**Lineage Information:**
- **Metric Level:** Which metric definition was used (version, formula)
- **Calculation Level:** How it was calculated (parameters, filters, date range)
- **Source Level:** Which records were included (IDs, timestamps, values)
- **Transaction Level:** What business events occurred (details, actors, times)

### 2.2 Lineage Implementation

**Lineage Record:**
```typescript
interface LineageRecord {
  id: string;
  
  // Metric information
  metricId: string;
  metricVersion: string;
  metricName: string;
  
  // Calculation details
  calculatedAt: Date;
  parameters: {
    dateRange: { start: Date; end: Date };
    filters: Record<string, any>;
    dimensions: string[];
    aggregations: string[];
  };
  
  // Source data
  sourceEntities: {
    entity: string;
    recordCount: number;
    recordIds: string[];              // Sample of source IDs
    dateRange: { earliest: Date; latest: Date };
    dataQualityScore: number;
  }[];
  
  // Calculation result
  result: {
    value: number;
    unit: string;
    breakdown?: any[];                // Dimensional breakdown
    confidence?: number;              // 0-100
  };
  
  // Metadata
  calculationTime: number;            // milliseconds
  tenantId: string;
  userId: string;                     // Who requested calculation
  requestId: string;                  // Correlation ID
  
  // Audit
  createdAt: Date;
}
```

**Lineage Storage:**
- Store lineage records for all metric calculations
- Retain for minimum 7 years (or per regulatory requirements)
- Index by metric, date, and tenant for efficient retrieval
- Compress older lineage records to save storage

### 2.3 Lineage Querying

**Drill-Down API:**
```typescript
// Get lineage for a metric value
GET /api/v1/metrics/{metricId}/lineage
Query Parameters:
  - dateRange: Start and end dates
  - filters: Applied filters
  - dimensions: Applied dimensions

Response:
{
  "lineage": LineageRecord,
  "sourceRecords": {
    "entity": string,
    "records": any[],                 // Sample of source records
    "totalCount": number
  }[]
}
```

**Drill-Down Flow:**
1. User views metric on dashboard: "Total Revenue: $150,000"
2. User clicks drill-down icon
3. System retrieves lineage record
4. System fetches sample source records
5. User sees breakdown by dimension (e.g., by product)
6. User clicks on specific product
7. System shows invoice records for that product
8. User clicks on specific invoice
9. System shows full invoice details

**Permission Enforcement:**
- Each drill-down level checks user permissions
- Users only see records they are authorized to access
- Audit trail of all drill-down actions
- Respect data classification and sensitivity

---

## 3. Data Reconciliation

### 3.1 Reconciliation Requirements

**Reconciliation Types:**

**Operational to Analytical:**
- Verify analytical results match operational data
- Ensure no data loss in transformation
- Validate aggregation logic
- Confirm filtering and calculations

**Period to Period:**
- Verify continuity between periods
- Ensure no gaps or overlaps
- Validate period boundaries
- Confirm carry-forward balances

**Source to Target:**
- Verify ETL processes working correctly
- Ensure data completeness
- Validate transformations
- Confirm referential integrity

### 3.2 Reconciliation Process

**Reconciliation Check:**
```typescript
interface ReconciliationCheck {
  id: string;
  name: string;
  description: string;
  
  // What to reconcile
  sourceType: 'operational' | 'analytical' | 'external';
  sourceQuery: string;               // Query to get source data
  targetType: 'operational' | 'analytical' | 'external';
  targetQuery: string;               // Query to get target data
  
  // Comparison
  comparisonField: string;           // Field to compare
  tolerance: number;                 // Acceptable difference (e.g., 0.01 for 1%)
  comparisonMethod: 'exact' | 'tolerance' | 'statistical';
  
  // Execution
  frequency: 'daily' | 'weekly' | 'monthly';
  scope: {
    dateRange?: { start: Date; end: Date };
    tenantId?: string;
    entities?: string[];
  };
  
  // Actions
  notifyOnMismatch: boolean;
  notifyRoles: string[];
  createTicket: boolean;
  blockProcessing: boolean;
  
  // Metadata
  isActive: boolean;
  ownerId: string;
  lastRunAt?: Date;
  lastResult?: ReconciliationResult;
}

interface ReconciliationResult {
  checkId: string;
  executedAt: Date;
  status: 'matched' | 'mismatch' | 'error';
  
  // Source data
  sourceValue: number;
  sourceCount: number;
  sourceSample?: any[];
  
  // Target data
  targetValue: number;
  targetCount: number;
  targetSample?: any[];
  
  // Comparison
  difference: number;
  differencePercentage: number;
  withinTolerance: boolean;
  
  // Details
  mismatchedRecords?: any[];         // Sample of mismatched records
  errorMessage?: string;
  executionTime: number;
}
```

**Example Reconciliation Checks:**

**Check 1: Revenue Reconciliation**
```typescript
{
  id: 'rec-finance-001',
  name: 'Revenue Reconciliation',
  description: 'Verify analytical revenue matches operational invoices',
  sourceType: 'operational',
  sourceQuery: `
    SELECT SUM(total) as revenue
    FROM invoices
    WHERE status = 'paid'
      AND invoiceDate BETWEEN :startDate AND :endDate
      AND organizationId = :tenantId
  `,
  targetType: 'analytical',
  targetQuery: `
    SELECT value as revenue
    FROM metricAggregates
    WHERE metricId = 'kpi-finance-revenue-001'
      AND periodStart = :startDate
      AND periodEnd = :endDate
      AND organizationId = :tenantId
  `,
  comparisonField: 'revenue',
  tolerance: 0.01,                   // 1% tolerance
  comparisonMethod: 'tolerance',
  frequency: 'daily',
  notifyOnMismatch: true,
  notifyRoles: ['finance_manager', 'data_steward'],
  createTicket: true,
  isActive: true,
  ownerId: 'finance_director'
}
```

**Check 2: Inventory Reconciliation**
```typescript
{
  id: 'rec-inventory-001',
  name: 'Inventory Balance Reconciliation',
  description: 'Verify analytical inventory matches operational stock levels',
  sourceType: 'operational',
  sourceQuery: `
    SELECT SUM(quantity) as total_stock
    FROM stockLevels
    WHERE organizationId = :tenantId
      AND lastUpdated >= :asOfDate
  `,
  targetType: 'analytical',
  targetQuery: `
    SELECT value as total_stock
    FROM metricAggregates
    WHERE metricId = 'kpi-inventory-stock-001'
      AND periodEnd = :asOfDate
      AND organizationId = :tenantId
  `,
  comparisonField: 'total_stock',
  tolerance: 0,                      // Exact match required
  comparisonMethod: 'exact',
  frequency: 'daily',
  notifyOnMismatch: true,
  notifyRoles: ['inventory_manager'],
  createTicket: true,
  isActive: true,
  ownerId: 'inventory_director'
}
```

### 3.3 Reconciliation Reporting

**Reconciliation Report:**
```typescript
interface ReconciliationReport {
  date: Date;
  checksRun: number;
  checksPassed: number;
  checksFailed: number;
  passRate: number;
  
  // Failed checks
  failedChecks: {
    checkId: string;
    checkName: string;
    sourceValue: number;
    targetValue: number;
    difference: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved';
  }[];
  
  // Summary
  totalVariance: number;
  largestVariance: {
    checkName: string;
    variance: number;
    variancePercentage: number;
  };
  
  // Trends
  trend: {
    current: number;                 // Current pass rate
    previous: number;                // Previous period pass rate
    change: number;                  // Percentage change
  };
}
```

**Reconciliation Dashboard:**
- Overall reconciliation status
- Failed checks by severity
- Variance trends over time
- Top variances requiring attention
- Resolution status of open issues

---

## 4. Handling Corrections and Adjustments

### 4.1 Correction Types

**Transaction Corrections:**
- **Correction:** Fixing an error in a transaction (e.g., wrong amount)
- **Reversal:** Canceling a transaction (e.g., cancelled order)
- **Adjustment:** Modifying a transaction for business reasons (e.g., discount)
- **Reclassification:** Moving transaction to different category (e.g., re-categorizing expense)

**Impact on Analytics:**
- **Retroactive:** Correction applies to original transaction date
- **Prospective:** Correction applies from correction date forward
- **Separate:** Correction recorded as separate transaction

### 4.2 Correction Handling Rules

**Rule 1: Preserve Historical Accuracy**
- Original transactions remain in operational data
- Corrections recorded as new transactions
- Analytical results can be recalculated with corrections
- Users can choose to view original or corrected results

**Rule 2: Clear Audit Trail**
- All corrections logged with reason
- Link between original and correction recorded
- Correction approval workflow (if required)
- Full audit trail in analytical lineage

**Rule 3: Configurable Behavior**
```typescript
interface CorrectionHandling {
  metricId: string;
  correctionType: 'retroactive' | 'prospective' | 'separate';
  
  // Retroactive handling
  retroactive?: {
    recalculateHistorical: boolean;   // Recalculate past periods
    versioning: 'overwrite' | 'new_version';  // How to handle versions
    notifyUsers: boolean;             // Notify dashboard users
  };
  
  // Prospective handling
  prospective?: {
    effectiveDate: Date;              // When correction takes effect
    adjustOpeningBalance: boolean;    // Adjust opening balance
  };
  
  // Separate handling
  separate?: {
    separateMetricId: string;         // Record as separate metric
    linkToOriginal: boolean;          // Link to original metric
  };
}
```

### 4.3 Correction Examples

**Example 1: Invoice Correction (Retroactive)**
```
Scenario: Invoice #123 for $1,000 was recorded on Jan 15. On Feb 10, discovered amount should be $1,200.

Handling:
1. Create correction transaction: +$200 on Feb 10
2. Link correction to original invoice
3. Recalculate January revenue: $1,000 → $1,200
4. Create new metric version: v1.1 (effective Feb 10)
5. Notify users of recalculation
6. Update lineage to show correction

Result:
- January revenue shows $1,200 (corrected)
- Lineage shows original $1,000 + correction $200
- Users can view original or corrected version
```

**Example 2: Order Cancellation (Separate)**
```
Scenario: Order #456 for $5,000 was recorded on Jan 20. On Feb 5, order cancelled.

Handling:
1. Create cancellation transaction: -$5,000 on Feb 5
2. Link cancellation to original order
3. Do NOT recalculate January (order was valid in January)
4. Record cancellation in February
5. Update lineage to show cancellation

Result:
- January revenue includes $5,000 (order was valid)
- February revenue includes -$5,000 (cancellation)
- Net effect: $0 over both months
- Lineage shows order + cancellation
```

---

## 5. Historical Reporting

### 5.1 Historical Reporting Requirements

**Version Selection:**
- Users can select which metric version to use
- Default to latest approved version
- Ability to view historical versions
- Clear indication of version used

**Recalculation:**
- Ability to recalculate historical periods
- Apply current definitions to past data
- Compare original vs. recalculated results
- Document reasons for recalculation

**Point-in-Time Reporting:**
- View metrics as they were at a specific date
- Use metric versions effective at that date
- Preserve historical accuracy
- Support audit and compliance requirements

### 5.2 Historical Reporting Implementation

**Version Management:**
```typescript
interface MetricVersionHistory {
  metricId: string;
  versions: {
    version: string;
    definition: MetricDefinition;
    effectiveFrom: Date;
    effectiveTo?: Date;              // Null if current version
    changeSummary: string;
    changeReason: string;
  }[];
}

// Get metric version effective at specific date
function getMetricVersionAtDate(metricId: string, date: Date): MetricVersion {
  const history = getMetricVersionHistory(metricId);
  return history.versions.find(v => 
    v.effectiveFrom <= date && 
    (v.effectiveTo === null || v.effectiveTo > date)
  );
}
```

**Historical Query:**
```typescript
// Calculate metric using specific version
async function calculateMetricWithVersion(
  metricId: string,
  version: string,
  parameters: CalculationParameters
): Promise<MetricResult> {
  const definition = getMetricVersion(metricId, version);
  
  // Use definition's formula and logic
  const result = await executeCalculation(definition, parameters);
  
  // Record lineage with version
  await recordLineage({
    metricId,
    metricVersion: version,
    ...result,
    ...parameters
  });
  
  return result;
}
```

---

## 6. Reconciliation Monitoring

### 6.1 Monitoring Requirements

**Continuous Monitoring:**
- Run reconciliation checks on schedule
- Alert on mismatches exceeding tolerance
- Track reconciliation trends
- Monitor resolution of issues

**Alerting:**
```typescript
interface ReconciliationAlert {
  checkId: string;
  checkName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  sourceValue: number;
  targetValue: number;
  difference: number;
  differencePercentage: number;
  detectedAt: Date;
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved';
  assignedTo?: string;
  resolvedAt?: Date;
  resolution?: string;
}
```

**Alert Thresholds:**
- **Critical:** Difference > 5% or > $10,000
- **High:** Difference > 2% or > $5,000
- **Medium:** Difference > 1% or > $1,000
- **Low:** Difference > 0.5% or > $100

### 6.2 Monitoring Dashboard

**Reconciliation Dashboard:**
- Overall reconciliation health
- Failed checks by severity
- Variance trends
- Open issues requiring attention
- Resolution metrics (time to resolve, resolution rate)

**Drill-Down:**
- Click on failed check to see details
- View source and target data
- Investigate root cause
- Track resolution progress

---

## 7. Acceptance Criteria

### 7.1 Lineage Requirements

- [ ] All metric calculations record lineage
- [ ] Lineage includes metric version and parameters
- [ ] Lineage includes source record IDs
- [ ] Lineage is queryable for drill-down
- [ ] Drill-down respects user permissions
- [ ] Lineage retained for minimum 7 years
- [ ] Lineage accessible via API

### 7.2 Reconciliation Requirements

- [ ] Reconciliation checks defined for critical metrics
- [ ] Checks run on schedule (daily/weekly/monthly)
- [ ] Mismatches detected and alerted
- [ ] Reconciliation dashboard functional
- [ ] Issues tracked and resolved
- [ ] Reconciliation reports generated
- [ ] Trends monitored and reported

### 7.3 Correction Handling Requirements

- [ ] Corrections recorded with audit trail
- [ ] Correction handling rules configurable per metric
- [ ] Retroactive corrections recalculate history
- [ ] Prospective corrections apply from effective date
- [ ] Separate corrections recorded as new transactions
- [ ] Users can view original and corrected results
- [ ] Correction approval workflows functional

### 7.4 Historical Reporting Requirements

- [ ] Metric versions tracked and managed
- [ ] Users can select metric version for reporting
- [ ] Historical reports use appropriate versions
- [ ] Point-in-time reporting functional
- [ ] Recalculation capabilities available
- [ ] Version changes documented and communicated

---

## 8. References

- Stage 5: Data Domain Catalog
- Stage 6: Business KPI and Outcome Catalog
- Stage 7: Audit Logging and Accountability Specification
- Industry standards: IIA (Institute of Internal Auditors) Reconciliation Standards

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** BI Architect / Data Steward
