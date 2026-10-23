# Metric and KPI Registry Specification

**Document ID:** BI-8.2  
**Stage:** 8 — Business Intelligence, Analytics, KPI Definitions, and Data Quality  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the central metric and KPI registry for the ClickIT platform. The registry serves as the single source of truth for all business metrics, ensuring consistency, traceability, and governance across the organization.

**Key Principles:**
- One authoritative definition per metric
- Complete metadata for every metric
- Version control for metric changes
- Clear ownership and approval workflows
- Comprehensive search and discovery
- Dependency tracking between metrics

---

## 2. Metric Registry Architecture

### 2.1 Registry Purpose

The metric registry provides:
- **Centralized Management:** Single repository for all metric definitions
- **Consistency:** Prevents duplicate or conflicting definitions
- **Traceability:** Links metrics to source data and business objectives
- **Governance:** Approval workflows and version control
- **Discovery:** Search and browse capabilities for users
- **Documentation:** Complete metadata and usage guidelines

### 2.2 Registry Components

**Metric Definition Store:**
- Stores all metric definitions
- Manages versions and history
- Tracks approval status
- Enforces naming conventions

**Metadata Repository:**
- Business context and purpose
- Calculation formulas and logic
- Source data dependencies
- Usage guidelines and examples
- Ownership and stewardship

**Dependency Graph:**
- Tracks relationships between metrics
- Identifies upstream and downstream dependencies
- Validates metric calculations
- Prevents circular dependencies

**Search and Discovery:**
- Full-text search across metrics
- Filter by domain, status, owner
- Browse by category and tag
- Related metrics suggestions

**Governance Workflows:**
- Metric proposal and review
- Approval and publication
- Deprecation and retirement
- Change management

---

## 3. Metric Definition Schema

### 3.1 Core Definition Structure

```typescript
interface MetricDefinition {
  // Identification
  id: string;                          // Unique identifier (e.g., "kpi-sales-001")
  name: string;                        // Human-readable name
  shortName: string;                   // Abbreviated name for displays
  description: string;                 // Detailed description
  businessQuestion: string;            // What business question does this answer?
  
  // Classification
  domain: MetricDomain;                // Business domain (sales, finance, etc.)
  category: MetricCategory;            // Sub-category within domain
  tags: string[];                      // Searchable tags
  industryRelevance: string[];         // Industries where applicable
  
  // Calculation
  formula: string;                     // Human-readable formula
  calculation: CalculationSpec;        // Detailed calculation specification
  unit: MetricUnit;                    // Unit of measurement
  precision: number;                   // Decimal places
  
  // Data Sources
  sourceEntities: string[];            // Source entity names
  sourceFields: SourceFieldSpec[];     // Required fields from sources
  filters: FilterSpec[];               // Standard filters
  dimensions: string[];                // Available dimensions for breakdown
  
  // Validation
  inclusionCriteria: string;           // What to include
  exclusionCriteria: string;           // What to exclude
  handlingRules: HandlingRules;        // How to handle special cases
  
  // Reporting
  reportingPeriods: ReportingPeriod[]; // Supported time periods
  timeZoneHandling: TimeZoneRule;      // Time zone rules
  currencyHandling: CurrencyRule;      // Currency conversion rules
  
  // Targets and Benchmarks
  target?: number;                     // Target value
  targetDirection: TargetDirection;    // Higher/lower/range is better
  benchmark?: number;                  // Industry benchmark
  threshold?: ThresholdSpec;           // Alert thresholds
  
  // Governance
  status: MetricStatus;                // Current status
  version: string;                     // Version number
  ownerId: string;                     // Metric owner user ID
  stewardId?: string;                  // Data steward user ID
  approvedBy?: string;                 // Approver user ID
  approvedAt?: Date;                   // Approval timestamp
  
  // Quality
  dataQualityRequirements: QualityReq[]; // Data quality requirements
  freshnessRequirement: string;        // How fresh data must be
  completenessRequirement: number;     // Minimum completeness %
  
  // Dependencies
  dependsOn: string[];                 // IDs of metrics this depends on
  usedBy: string[];                    // IDs of metrics that use this
  
  // Documentation
  examples: Example[];                 // Usage examples
  limitations: string[];               // Known limitations
  assumptions: string[];               // Calculation assumptions
  relatedMetrics: string[];            // Related metric IDs
  documentationUrl?: string;           // Link to detailed docs
  
  // Lifecycle
  createdAt: Date;                     // Creation timestamp
  updatedAt: Date;                     // Last update timestamp
  effectiveFrom: Date;                 // When this version became effective
  deprecatedAt?: Date;                 // Deprecation timestamp
  replacedBy?: string;                 // Replacement metric ID
  
  // Audit
  createdBy: string;                   // Creator user ID
  lastModifiedBy: string;              // Last modifier user ID
  changeHistory: ChangeRecord[];       // Change history
}
```

### 3.2 Supporting Types

```typescript
type MetricDomain = 
  | 'crm' 
  | 'sales' 
  | 'marketing' 
  | 'finance' 
  | 'inventory' 
  | 'projects' 
  | 'hr' 
  | 'support' 
  | 'operations' 
  | 'strategy';

type MetricCategory = 
  | 'acquisition' 
  | 'conversion' 
  | 'retention' 
  | 'revenue' 
  | 'cost' 
  | 'profitability' 
  | 'efficiency' 
  | 'quality' 
  | 'growth' 
  | 'risk';

interface CalculationSpec {
  type: 'simple' | 'ratio' | 'aggregation' | 'complex';
  numerator?: string;           // For ratio metrics
  denominator?: string;         // For ratio metrics
  aggregation?: AggregationType;
  formula?: string;             // For complex calculations
  steps?: CalculationStep[];    // Multi-step calculations
}

type AggregationType = 'sum' | 'count' | 'average' | 'min' | 'max' | 'median' | 'percentile';

interface CalculationStep {
  order: number;
  operation: string;
  input: string;
  output: string;
  description: string;
}

interface SourceFieldSpec {
  entity: string;
  field: string;
  required: boolean;
  validation?: string;
  transformation?: string;
}

interface FilterSpec {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
  value: any;
  description: string;
}

interface MetricUnit {
  type: 'currency' | 'percentage' | 'count' | 'duration' | 'ratio' | 'score' | 'custom';
  currency?: string;            // ISO 4217 code for currency units
  symbol?: string;              // Display symbol ($, %, etc.)
  customUnit?: string;          // Custom unit name
}

interface HandlingRules {
  nullValues: 'exclude' | 'include_as_zero' | 'error';
  duplicates: 'skip' | 'sum' | 'error';
  cancellations: 'exclude' | 'include' | 'separate_metric';
  refunds: 'exclude' | 'include' | 'separate_metric';
  corrections: 'use_latest' | 'use_original' | 'separate_metric';
  currencyConversion: 'at_transaction' | 'at_reporting' | 'error';
  timeZoneConversion: 'utc' | 'local' | 'user_preference';
}

interface ReportingPeriod {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  customDays?: number;          // For custom periods
  fiscalCalendar?: boolean;     // Use fiscal calendar
}

interface TimeZoneRule {
  defaultZone: string;          // IANA time zone
  conversionMethod: 'utc' | 'local' | 'user_preference';
  handleDaylightSaving: boolean;
}

interface CurrencyRule {
  baseCurrency: string;         // ISO 4217 code
  conversionMethod: 'transaction_date' | 'reporting_date' | 'average_rate';
  exchangeRateSource: string;   // Source of exchange rates
}

type MetricStatus = 'draft' | 'proposed' | 'under_review' | 'approved' | 'published' | 'deprecated' | 'archived';

type TargetDirection = 'higher_is_better' | 'lower_is_better' | 'target_range' | 'no_target';

interface ThresholdSpec {
  warning?: number;             // Warning threshold
  critical?: number;            // Critical threshold
  comparison: 'absolute' | 'percentage' | 'trend';
}

interface QualityReq {
  dimension: 'completeness' | 'consistency' | 'accuracy' | 'timeliness' | 'uniqueness';
  minimumScore: number;         // 0-100
  checkMethod: string;
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
}

interface Example {
  title: string;
  description: string;
  scenario: string;
  expectedValue: any;
  filters?: Record<string, any>;
  dimensions?: string[];
}

interface ChangeRecord {
  version: string;
  changedAt: Date;
  changedBy: string;
  changeType: 'created' | 'modified' | 'approved' | 'deprecated' | 'restored';
  description: string;
  previousVersion?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
```

---

## 4. Metric Lifecycle Management

### 4.1 Lifecycle States

```
Draft → Proposed → Under Review → Approved → Published → Deprecated → Archived
```

**Draft:**
- Initial metric definition
- Not yet submitted for review
- Can be edited freely
- Not visible to end users

**Proposed:**
- Submitted for review
- Awaiting stakeholder input
- Limited visibility (owner and reviewers)
- Can be revised based on feedback

**Under Review:**
- Formal review process
- Business and technical validation
- Data quality assessment
- Approval workflow in progress

**Approved:**
- Review complete and approved
- Ready for publication
- Final checks before going live
- Version locked

**Published:**
- Live and available to users
- Can be used in dashboards and reports
- Changes require new version
- Active monitoring

**Deprecated:**
- Marked for retirement
- Still available but discouraged
- Replacement metric identified
- Migration period active

**Archived:**
- No longer available
- Historical reference only
- Cannot be used in new dashboards
- Retained for audit purposes

### 4.2 Approval Workflow

**Workflow Steps:**

1. **Proposal Submission**
   - Metric owner completes definition
   - Provides business justification
   - Identifies data sources
   - Submits for review

2. **Business Review**
   - Business stakeholder validates purpose
   - Confirms alignment with objectives
   - Reviews target and thresholds
   - Approves or requests changes

3. **Technical Review**
   - Data architect validates calculation
   - Checks data source availability
   - Assesses performance impact
   - Validates data quality requirements

4. **Security Review**
   - Security team reviews access requirements
   - Validates tenant isolation
   - Checks data classification
   - Approves permission model

5. **Final Approval**
   - BI governance committee review
   - Final sign-off
   - Publication authorization
   - Communication plan

**Approval Roles:**
- **Metric Owner:** Proposes and maintains metric
- **Business Stakeholder:** Validates business value
- **Data Architect:** Validates technical feasibility
- **Security Reviewer:** Validates security requirements
- **BI Governance:** Final approval authority

### 4.3 Version Management

**Versioning Rules:**
- Major version (1.0.0 → 2.0.0): Breaking changes to formula or logic
- Minor version (1.0.0 → 1.1.0): Non-breaking changes (filters, dimensions)
- Patch version (1.0.0 → 1.0.1): Documentation or metadata updates

**Version History:**
```typescript
interface MetricVersion {
  version: string;
  definition: MetricDefinition;
  effectiveFrom: Date;
  effectiveTo?: Date;
  changeSummary: string;
  changeReason: string;
  approvedBy: string;
  approvedAt: Date;
}
```

**Historical Reporting:**
- Users can select which metric version to use
- Default to latest approved version
- Ability to recalculate with historical versions
- Clear indication of version used in reports

### 4.4 Deprecation and Retirement

**Deprecation Process:**
1. Identify replacement metric (if applicable)
2. Notify all users of deprecation
3. Set deprecation date (minimum 90 days notice)
4. Provide migration guidance
5. Monitor usage during deprecation period
6. Archive after deprecation period

**Deprecation Notice:**
```typescript
interface DeprecationNotice {
  metricId: string;
  deprecatedAt: Date;
  retireAt: Date;
  reason: string;
  replacementMetricId?: string;
  migrationGuide: string;
  affectedDashboards: string[];
  affectedUsers: string[];
}
```

---

## 5. Metric Governance

### 5.1 Governance Model

**Metric Governance Committee:**
- **Chair:** BI Director or Chief Data Officer
- **Members:**
  - Business unit representatives
  - Data architects
  - Security representatives
  - Finance representatives (for financial metrics)
  - IT representatives

**Responsibilities:**
- Approve new metrics
- Resolve metric conflicts
- Set metric standards
- Review metric performance
- Approve metric changes
- Manage metric lifecycle

**Meeting Cadence:**
- Monthly governance meetings
- Ad-hoc meetings for urgent issues
- Quarterly metric portfolio review
- Annual metric strategy review

### 5.2 Naming Conventions

**Metric ID Format:**
```
kpi-{domain}-{category}-{sequence}

Examples:
- kpi-sales-conversion-001
- kpi-finance-revenue-001
- kpi-marketing-cac-001
```

**Metric Name Format:**
- Title case
- Clear and descriptive
- No abbreviations (except universally understood)
- Include unit if not obvious

**Examples:**
- ✅ "Customer Acquisition Cost"
- ✅ "Monthly Recurring Revenue"
- ❌ "CAC" (too abbreviated)
- ❌ "customer acquisition cost" (not title case)

### 5.3 Ownership and Stewardship

**Metric Owner:**
- Accountable for metric definition and accuracy
- Responsible for business context and usage
- Approves changes to metric
- Primary contact for questions

**Data Steward:**
- Responsible for data quality
- Monitors source data
- Investigates data issues
- Coordinates with data sources

**Ownership Assignment:**
```typescript
interface MetricOwnership {
  metricId: string;
  ownerId: string;              // Primary owner
  ownerName: string;
  ownerRole: string;
  stewardId?: string;           // Data steward
  stewardName?: string;
  businessUnit: string;
  contactEmail: string;
  backupOwnerId?: string;       // Backup owner
  lastReviewDate: Date;
  nextReviewDate: Date;
}
```

### 5.4 Quality Standards

**Minimum Quality Requirements:**
- **Completeness:** ≥ 95% of required data present
- **Accuracy:** ≥ 99% of values correct
- **Consistency:** No conflicting values
- **Timeliness:** Data refreshed within SLA
- **Uniqueness:** No duplicate records

**Quality Monitoring:**
```typescript
interface MetricQualityReport {
  metricId: string;
  reportDate: Date;
  completeness: number;         // 0-100
  accuracy: number;             // 0-100
  consistency: number;          // 0-100
  timeliness: number;           // 0-100
  uniqueness: number;           // 0-100
  overallScore: number;         // 0-100
  issues: QualityIssue[];
  recommendations: string[];
}

interface QualityIssue {
  type: 'missing_data' | 'invalid_value' | 'duplicate' | 'stale' | 'inconsistent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedRecords: number;
  recommendedAction: string;
}
```

---

## 6. Metric Discovery and Usage

### 6.1 Search and Browse

**Search Capabilities:**
- Full-text search across name, description, tags
- Filter by domain, category, status
- Filter by owner, business unit
- Filter by data source
- Filter by industry relevance

**Browse Options:**
- By domain (hierarchical)
- By category (hierarchical)
- By business unit
- By data source
- By popularity (most used)
- By recent additions

**Search Results:**
```typescript
interface MetricSearchResult {
  metricId: string;
  name: string;
  description: string;
  domain: MetricDomain;
  category: MetricCategory;
  status: MetricStatus;
  ownerName: string;
  usageCount: number;           // How many dashboards use this
  lastCalculatedAt: Date;
  relevanceScore: number;       // Search relevance
}
```

### 6.2 Metric Documentation

**Documentation Page:**
- **Overview:** Name, description, business question
- **Formula:** Calculation logic with examples
- **Data Sources:** Source entities and fields
- **Filters and Dimensions:** Available options
- **Examples:** Usage scenarios
- **Limitations:** Known constraints
- **Related Metrics:** Connections to other metrics
- **Change History:** Version history
- **Usage:** Dashboards and reports using this metric

**Example Documentation:**
```markdown
# Customer Acquisition Cost (CAC)

## Business Question
How much does it cost to acquire a new customer?

## Formula
Total Marketing Spend / Number of New Customers

## Calculation Details
- **Numerator:** Sum of all marketing campaign costs in the period
- **Denominator:** Count of new customers acquired in the period
- **Time Period:** Monthly, quarterly, or annual
- **Currency:** Base currency of the organization

## Data Sources
- Marketing Campaign Budgets (CampaignBudget entity)
- New Customer Records (Contact entity with createdDate in period)

## Filters
- Date range
- Marketing channel
- Campaign type
- Business unit

## Dimensions
- Time (month, quarter, year)
- Marketing channel
- Campaign
- Business unit
- Region

## Examples
**Example 1: Monthly CAC by Channel**
- Period: January 2026
- Dimension: Marketing channel
- Result: Email ($50), Social ($75), Paid Ads ($120)

**Example 2: Quarterly CAC Trend**
- Period: Q4 2025
- Comparison: vs Q3 2025
- Result: $85 (↓ 10% from $95)

## Limitations
- Requires accurate marketing spend tracking
- Attribution may be incomplete for multi-touch journeys
- Time lag between marketing spend and customer acquisition

## Related Metrics
- Marketing ROI (kpi-marketing-roi-001)
- Lead Conversion Rate (kpi-sales-conversion-001)
- Customer Lifetime Value (kpi-customer-ltv-001)
```

### 6.3 Usage Tracking

**Usage Metrics:**
- Number of dashboards using metric
- Number of reports using metric
- Number of users accessing metric
- Query frequency
- Export frequency

**Usage Analytics:**
```typescript
interface MetricUsage {
  metricId: string;
  period: string;               // e.g., "2026-01"
  dashboardCount: number;
  reportCount: number;
  uniqueUsers: number;
  queryCount: number;
  exportCount: number;
  averageLoadTime: number;      // milliseconds
  errorCount: number;
}
```

---

## 7. Integration with Other Systems

### 7.1 Dashboard Integration

**Dashboard Builder Integration:**
- Metric picker with search and filter
- Drag-and-drop metric selection
- Automatic formula application
- Dimension and filter configuration
- Real-time preview

**Dashboard Rendering:**
- Fetch metric definition
- Apply user selections (filters, dimensions)
- Execute calculation
- Format result with unit
- Display with metadata (freshness, quality)

### 7.2 Report Integration

**Report Builder Integration:**
- Metric catalog browser
- Metric selection with preview
- Parameter configuration
- Layout design
- Export options

**Report Generation:**
- Fetch metric definitions
- Execute calculations for report period
- Apply formatting
- Generate output (PDF, Excel, etc.)
- Include metric metadata

### 7.3 AI Integration

**AI Context Retrieval:**
- Fetch relevant metrics for user question
- Provide metric definitions and formulas
- Include data quality information
- Supply historical trends

**AI Insight Generation:**
- Use metric definitions to calculate values
- Cite metric sources and formulas
- Explain metric changes using definitions
- Recommend related metrics

### 7.4 Export Integration

**Export Formats:**
- CSV: Metric values with metadata
- Excel: Formatted with charts
- PDF: Report with metric documentation
- JSON: Structured metric data

**Export Content:**
```typescript
interface MetricExport {
  metric: MetricDefinition;
  parameters: {
    dateRange: { start: Date; end: Date };
    filters: Record<string, any>;
    dimensions: string[];
  };
  results: {
    values: any[];
    totals?: any;
    averages?: any;
  };
  metadata: {
    calculatedAt: Date;
    dataQuality: MetricQualityReport;
    sourceRecordCount: number;
    calculationTime: number;
  };
}
```

---

## 8. API Design

### 8.1 Registry API Endpoints

**List Metrics:**
```
GET /api/v1/metrics
Query Parameters:
  - domain: Filter by domain
  - category: Filter by category
  - status: Filter by status
  - search: Full-text search
  - page: Page number
  - pageSize: Items per page

Response:
{
  "metrics": MetricSearchResult[],
  "total": number,
  "page": number,
  "pageSize": number
}
```

**Get Metric Definition:**
```
GET /api/v1/metrics/{metricId}

Response:
{
  "metric": MetricDefinition
}
```

**Create Metric:**
```
POST /api/v1/metrics

Request Body:
{
  "name": string,
  "description": string,
  "formula": string,
  ...
}

Response:
{
  "metric": MetricDefinition,
  "status": "draft"
}
```

**Update Metric:**
```
PUT /api/v1/metrics/{metricId}

Request Body:
{
  "name": string,
  "description": string,
  ...
}

Response:
{
  "metric": MetricDefinition,
  "version": string
}
```

**Calculate Metric:**
```
POST /api/v1/metrics/{metricId}/calculate

Request Body:
{
  "dateRange": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  },
  "filters": {
    "department": "sales"
  },
  "dimensions": ["region"]
}

Response:
{
  "metricId": string,
  "value": number,
  "unit": MetricUnit,
  "breakdown": any[],
  "metadata": {
    "calculatedAt": Date,
    "dataQuality": MetricQualityReport,
    "sourceRecordCount": number
  }
}
```

### 8.2 Authorization

**Permission Model:**
- `metrics:read`: View metric definitions
- `metrics:create`: Create new metrics
- `metrics:update`: Update metric definitions
- `metrics:delete`: Delete metrics
- `metrics:approve`: Approve metrics
- `metrics:calculate`: Execute metric calculations
- `metrics:export`: Export metric data

**Tenant Isolation:**
- All metrics tenant-scoped
- RLS policies on metric tables
- Middleware enforcement
- Audit logging

---

## 9. Testing and Validation

### 9.1 Metric Calculation Tests

**Test Categories:**
- **Unit Tests:** Individual calculation logic
- **Integration Tests:** End-to-end calculation
- **Data Quality Tests:** Validate data quality checks
- **Performance Tests:** Query performance
- **Security Tests:** Tenant isolation

**Test Scenarios:**
```typescript
describe('Metric Calculation', () => {
  it('should calculate total revenue correctly', async () => {
    // Setup test data
    await createInvoice({ total: 1000, status: 'paid' });
    await createInvoice({ total: 2000, status: 'paid' });
    await createInvoice({ total: 500, status: 'pending' });
    
    // Calculate metric
    const result = await calculateMetric('kpi-finance-revenue-001', {
      dateRange: { start: '2026-01-01', end: '2026-01-31' }
    });
    
    // Verify result
    expect(result.value).toBe(3000); // Only paid invoices
  });
  
  it('should enforce tenant isolation', async () => {
    const tenant1Metric = await calculateMetric('kpi-sales-001', { tenantId: 'tenant1' });
    const tenant2Metric = await calculateMetric('kpi-sales-001', { tenantId: 'tenant2' });
    
    expect(tenant1Metric.value).not.toBe(tenant2Metric.value);
  });
});
```

### 9.2 Data Quality Tests

**Test Scenarios:**
- Missing required fields
- Invalid data types
- Duplicate records
- Stale data
- Inconsistent values

**Quality Validation:**
```typescript
describe('Data Quality', () => {
  it('should detect missing required fields', async () => {
    const qualityReport = await validateDataQuality('kpi-sales-001');
    
    expect(qualityReport.completeness).toBeLessThan(100);
    expect(qualityReport.issues).toContainEqual(
      expect.objectContaining({ type: 'missing_data' })
    );
  });
});
```

---

## 10. Acceptance Criteria

### 10.1 Functional Requirements

- [ ] All metrics have complete definitions
- [ ] Metrics can be searched and browsed
- [ ] Metric calculations are accurate and reproducible
- [ ] Metric versions are tracked and managed
- [ ] Approval workflows function correctly
- [ ] Metric documentation is complete and accessible
- [ ] Usage tracking provides insights
- [ ] Integration with dashboards and reports works

### 10.2 Non-Functional Requirements

- [ ] Metric search returns results in < 1 second
- [ ] Metric calculation completes in < 5 seconds
- [ ] Registry supports 1000+ metrics
- [ ] API response time < 500ms
- [ ] 99.9% uptime for registry service

### 10.3 Security Requirements

- [ ] All metrics tenant-scoped
- [ ] User permissions enforced
- [ ] Audit trail complete
- [ ] Sensitive metrics protected
- [ ] Export permissions match view permissions

---

## 11. References

- Stage 2: System Architecture
- Stage 5: Data Domain Catalog
- Stage 6: Business KPI and Outcome Catalog
- Stage 7: Multi-Tenant Security Controls
- Industry standards: DAMA-DMBOK (Data Management Body of Knowledge)

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** BI Architect / Data Governance Lead
