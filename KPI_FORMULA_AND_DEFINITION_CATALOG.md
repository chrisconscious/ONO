# KPI Formula and Definition Catalog

**Document ID:** BI-8.3  
**Stage:** 8 — Business Intelligence, Analytics, KPI Definitions, and Data Quality  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This catalog provides detailed formulas and definitions for all KPIs across the ClickIT platform. Each KPI includes complete calculation specifications, data requirements, and usage guidelines.

**Note:** This catalog builds upon the KPI definitions in Stage 6 (Business KPI and Outcome Catalog) and provides expanded detail for implementation.

---

## 2. CRM and Customer Acquisition KPIs

### KPI-CRM-001: Qualified Lead Rate

**Business Question:** What percentage of leads meet our qualification criteria?

**Formula:**
```
Qualified Lead Rate = (Qualified Leads / Total Leads) × 100
```

**Calculation Details:**
- **Numerator:** Count of leads with status = 'qualified' in period
- **Denominator:** Count of all leads created in period
- **Time Period:** Monthly, quarterly
- **Filters:** Date range, lead source, sales team

**Data Sources:**
- Lead entity (status field, createdDate field)

**Inclusion Criteria:**
- All leads created in the period
- Excludes test leads and duplicates

**Exclusion Criteria:**
- Leads marked as test or demo
- Duplicate leads (after deduplication)

**Handling Rules:**
- Null values: Exclude from calculation
- Duplicates: Use deduplicated count
- Cancellations: N/A for leads

**Dimensions:**
- Time (month, quarter)
- Lead source
- Sales team
- Region
- Industry

**Limitations:**
- Qualification criteria may vary by team
- Time lag between lead creation and qualification
- Subjective qualification decisions

**Verification:**
```sql
SELECT 
  COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_count,
  COUNT(*) as total_count,
  (COUNT(CASE WHEN status = 'qualified' THEN 1 END) * 100.0 / COUNT(*)) as rate
FROM leads
WHERE createdDate BETWEEN :startDate AND :endDate
  AND organizationId = :tenantId
  AND isTest = false;
```

---

### KPI-CRM-002: Lead Response Time

**Business Question:** How quickly do we respond to new leads?

**Formula:**
```
Lead Response Time = AVG(Time between lead creation and first activity)
```

**Calculation Details:**
- **Measure:** Average time in hours
- **Numerator:** Sum of (firstActivityDate - createdDate) for all leads
- **Denominator:** Count of leads with at least one activity
- **Time Period:** Monthly, quarterly
- **Filters:** Date range, lead source, sales team

**Data Sources:**
- Lead entity (createdDate)
- Activity entity (first activity per lead)

**Inclusion Criteria:**
- Leads with at least one activity
- Activities within 30 days of lead creation

**Exclusion Criteria:**
- Leads with no activities
- Test leads

**Handling Rules:**
- Null values: Exclude leads with no activities
- Multiple activities: Use first activity only
- Time zones: Convert to UTC before calculation

**Dimensions:**
- Time (month, quarter)
- Lead source
- Sales team
- Region

**Limitations:**
- "First activity" definition may vary
- Auto-responses may skew results
- Business hours not considered

**Verification:**
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (first_activity - created_date)) / 3600) as avg_hours
FROM (
  SELECT 
    l.id,
    l.createdDate as created_date,
    MIN(a.createdDate) as first_activity
  FROM leads l
  LEFT JOIN activities a ON a.leadId = l.id
  WHERE l.createdDate BETWEEN :startDate AND :endDate
    AND l.organizationId = :tenantId
  GROUP BY l.id, l.createdDate
  HAVING MIN(a.createdDate) IS NOT NULL
) subquery;
```

---

### KPI-CRM-003: Lead-to-Customer Conversion Rate

**Business Question:** What percentage of leads become customers?

**Formula:**
```
Lead-to-Customer Conversion Rate = (Converted Leads / Total Leads) × 100
```

**Calculation Details:**
- **Numerator:** Count of leads with status = 'converted' in period
- **Denominator:** Count of all leads created in period (with sufficient time to convert)
- **Time Period:** Monthly, quarterly
- **Filters:** Date range, lead source, sales team

**Data Sources:**
- Lead entity (status field, createdDate field)
- Conversion entity (conversion records)

**Inclusion Criteria:**
- Leads created at least 90 days ago (to allow conversion time)
- All lead sources

**Exclusion Criteria:**
- Recent leads (< 90 days old)
- Test leads
- Duplicate leads

**Handling Rules:**
- Null values: Exclude from calculation
- Time lag: Use 90-day window for fair comparison
- Multiple conversions: Count lead once

**Dimensions:**
- Time (month, quarter)
- Lead source
- Sales team
- Region
- Industry

**Limitations:**
- 90-day window is arbitrary
- Conversion definition may vary
- Does not account for lead quality

**Verification:**
```sql
SELECT 
  COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_count,
  COUNT(*) as total_count,
  (COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / COUNT(*)) as rate
FROM leads
WHERE createdDate BETWEEN :startDate AND :endDate - INTERVAL '90 days'
  AND organizationId = :tenantId
  AND isTest = false;
```

---

## 3. Sales and Revenue KPIs

### KPI-SALES-007: Monthly Recurring Revenue (MRR)

**Business Question:** What is our predictable monthly revenue from subscriptions?

**Formula:**
```
MRR = SUM(Active subscription values normalized to monthly)
```

**Calculation Details:**
- **Measure:** Currency amount
- **Sum of:** All active subscriptions at end of period
- **Normalization:** Annual subscriptions ÷ 12, quarterly ÷ 3
- **Time Period:** Monthly
- **Filters:** Date, product type, customer segment

**Data Sources:**
- Subscription entity (status, value, billingCycle)
- Customer entity (status)

**Inclusion Criteria:**
- Active subscriptions only
- Excludes one-time purchases
- Includes trials converted to paid

**Exclusion Criteria:**
- Cancelled subscriptions
- Suspended accounts
- One-time purchases
- Free trials

**Handling Rules:**
- Currency conversion: Use transaction date rate
- Prorations: Include prorated amounts
- Upgrades/downgrades: Use new value from change date

**Dimensions:**
- Time (month)
- Product type
- Customer segment
- Region
- Sales team

**Limitations:**
- Does not include one-time revenue
- Churn impact may not be immediate
- Currency fluctuations affect comparison

**Verification:**
```sql
SELECT 
  SUM(
    CASE 
      WHEN billingCycle = 'monthly' THEN value
      WHEN billingCycle = 'quarterly' THEN value / 3
      WHEN billingCycle = 'annual' THEN value / 12
    END
  ) as mrr
FROM subscriptions
WHERE status = 'active'
  AND startDate <= :periodEnd
  AND (endDate IS NULL OR endDate > :periodEnd)
  AND organizationId = :tenantId;
```

---

### KPI-SALES-008: Sales Target Attainment

**Business Question:** How close are we to achieving our sales targets?

**Formula:**
```
Sales Target Attainment = (Actual Sales / Target Sales) × 100
```

**Calculation Details:**
- **Numerator:** Actual sales (closed-won opportunities) in period
- **Denominator:** Target sales for period
- **Time Period:** Monthly, quarterly, annual
- **Filters:** Date range, sales team, region

**Data Sources:**
- Opportunity entity (status, value, closedDate)
- SalesTarget entity (period, targetValue)

**Inclusion Criteria:**
- Closed-won opportunities in period
- Targets set for the period

**Exclusion Criteria:**
- Cancelled deals
- Opportunities still in pipeline
- Periods without targets

**Handling Rules:**
- Null values: Exclude from calculation
- Partial periods: Prorate target
- Currency: Convert to base currency

**Dimensions:**
- Time (month, quarter, year)
- Sales team
- Region
- Product
- Customer segment

**Limitations:**
- Targets may be unrealistic
- Does not account for market conditions
- Timing of deals may vary

**Verification:**
```sql
SELECT 
  SUM(o.value) as actual_sales,
  t.targetValue as target_sales,
  (SUM(o.value) * 100.0 / t.targetValue) as attainment
FROM opportunities o
CROSS JOIN salesTargets t
WHERE o.status = 'closed_won'
  AND o.closedDate BETWEEN :startDate AND :endDate
  AND t.period = :period
  AND o.organizationId = :tenantId
  AND t.organizationId = :tenantId
GROUP BY t.targetValue;
```

---

## 4. Marketing KPIs

### KPI-MKT-006: Marketing Qualified Leads (MQL)

**Business Question:** How many leads meet marketing qualification criteria?

**Formula:**
```
MQL = Count of leads marked as marketing qualified
```

**Calculation Details:**
- **Measure:** Count
- **Count of:** Leads with marketingQualified = true
- **Time Period:** Monthly, quarterly
- **Filters:** Date range, campaign, channel

**Data Sources:**
- Lead entity (marketingQualified field, createdDate)
- Campaign entity (for campaign attribution)

**Inclusion Criteria:**
- Leads marked as marketing qualified
- All lead sources

**Exclusion Criteria:**
- Test leads
- Duplicate leads
- Leads not yet evaluated

**Handling Rules:**
- Null values: Treat as not qualified
- Re-qualification: Count once per period
- Time lag: Use qualification date

**Dimensions:**
- Time (month, quarter)
- Campaign
- Channel
- Content type
- Region

**Limitations:**
- MQL criteria may be subjective
- Qualification process may be inconsistent
- Does not measure quality beyond criteria

**Verification:**
```sql
SELECT COUNT(*) as mql_count
FROM leads
WHERE marketingQualified = true
  AND qualifiedDate BETWEEN :startDate AND :endDate
  AND organizationId = :tenantId
  AND isTest = false;
```

---

### KPI-MKT-007: Campaign Return on Investment (ROI)

**Business Question:** What is the financial return from our marketing campaigns?

**Formula:**
```
Campaign ROI = ((Revenue from Campaign - Campaign Cost) / Campaign Cost) × 100
```

**Calculation Details:**
- **Numerator:** Revenue attributable to campaign minus campaign cost
- **Denominator:** Total campaign cost
- **Time Period:** Per campaign lifetime
- **Filters:** Campaign, date range

**Data Sources:**
- Campaign entity (budget, spend)
- Lead entity (attribution to campaign)
- Opportunity entity (closed-won from campaign leads)
- Invoice entity (revenue from campaign customers)

**Inclusion Criteria:**
- All campaign costs
- Revenue from leads attributed to campaign
- Revenue within 12 months of lead creation

**Exclusion Criteria:**
- Revenue from non-campaign leads
- Costs not directly attributable to campaign
- Revenue beyond 12-month window

**Handling Rules:**
- Currency: Convert to base currency
- Attribution: Use first-touch attribution
- Time lag: Track revenue for 12 months post-campaign

**Dimensions:**
- Campaign
- Channel
- Time (campaign lifetime)
- Customer segment

**Limitations:**
- Attribution is complex and imperfect
- 12-month window is arbitrary
- Does not account for brand awareness
- May not capture long-term value

**Verification:**
```sql
WITH campaign_leads AS (
  SELECT id, createdDate
  FROM leads
  WHERE campaignId = :campaignId
    AND organizationId = :tenantId
),
campaign_revenue AS (
  SELECT SUM(i.total) as revenue
  FROM invoices i
  JOIN contacts c ON i.customerId = c.id
  JOIN campaign_leads cl ON c.id = cl.convertedContactId
  WHERE i.status = 'paid'
    AND i.invoiceDate <= cl.createdDate + INTERVAL '12 months'
    AND i.organizationId = :tenantId
)
SELECT 
  ((cr.revenue - c.totalSpend) * 100.0 / c.totalSpend) as roi
FROM campaigns c
CROSS JOIN campaign_revenue cr
WHERE c.id = :campaignId;
```

---

## 5. Finance KPIs

### KPI-FIN-007: Current Ratio

**Business Question:** Can we cover our short-term liabilities with short-term assets?

**Formula:**
```
Current Ratio = Current Assets / Current Liabilities
```

**Calculation Details:**
- **Numerator:** Sum of current assets (cash, receivables, inventory)
- **Denominator:** Sum of current liabilities (payables, short-term debt)
- **Time Period:** Monthly, quarterly
- **Filters:** Date, business unit

**Data Sources:**
- Account entity (type, balance)
- Invoice entity (accounts receivable)
- Bill entity (accounts payable)
- Inventory entity (inventory value)

**Inclusion Criteria:**
- All current assets
- All current liabilities
- As of period end date

**Exclusion Criteria:**
- Long-term assets and liabilities
- Off-balance sheet items

**Handling Rules:**
- Currency: Convert to base currency
- Valuation: Use book value
- Timing: Use period-end balances

**Dimensions:**
- Time (month, quarter)
- Business unit
- Currency

**Limitations:**
- Does not indicate quality of assets
- Timing differences may affect ratio
- Industry norms vary significantly

**Verification:**
```sql
SELECT 
  (SELECT SUM(balance) FROM accounts WHERE type IN ('cash', 'receivable', 'inventory') 
   AND asOfDate = :periodEnd AND organizationId = :tenantId) as current_assets,
  (SELECT SUM(balance) FROM accounts WHERE type IN ('payable', 'short_term_debt') 
   AND asOfDate = :periodEnd AND organizationId = :tenantId) as current_liabilities,
  (SELECT SUM(balance) FROM accounts WHERE type IN ('cash', 'receivable', 'inventory') 
   AND asOfDate = :periodEnd AND organizationId = :tenantId) /
  (SELECT SUM(balance) FROM accounts WHERE type IN ('payable', 'short_term_debt') 
   AND asOfDate = :periodEnd AND organizationId = :tenantId) as current_ratio;
```

---

## 6. Inventory and Procurement KPIs

### KPI-INV-007: Inventory Accuracy

**Business Question:** How well do our recorded inventory levels match physical counts?

**Formula:**
```
Inventory Accuracy = (Correct SKU Counts / Total SKU Counts) × 100
```

**Calculation Details:**
- **Numerator:** Count of SKUs where system quantity = physical count
- **Denominator:** Total count of SKUs audited
- **Time Period:** Per audit cycle
- **Filters:** Warehouse, product category

**Data Sources:**
- StockLevel entity (system quantity)
- InventoryAudit entity (physical count)

**Inclusion Criteria:**
- All SKUs included in audit
- Audits completed in period

**Exclusion Criteria:**
- SKUs not audited
- In-transit inventory
- Damaged goods

**Handling Rules:**
- Tolerance: Allow ±2% variance
- Timing: Use audit date
- Locations: Audit by location

**Dimensions:**
- Warehouse
- Product category
- Time (audit cycle)
- SKU value tier

**Limitations:**
- Audit frequency may vary
- Does not indicate root cause of inaccuracies
- Timing of audit affects results

**Verification:**
```sql
SELECT 
  COUNT(CASE WHEN ABS(sl.quantity - ia.physicalCount) <= (sl.quantity * 0.02) THEN 1 END) as correct_count,
  COUNT(*) as total_count,
  (COUNT(CASE WHEN ABS(sl.quantity - ia.physicalCount) <= (sl.quantity * 0.02) THEN 1 END) * 100.0 / COUNT(*)) as accuracy
FROM stockLevels sl
JOIN inventoryAudits ia ON ia.skuId = sl.skuId AND ia.warehouseId = sl.warehouseId
WHERE ia.auditDate BETWEEN :startDate AND :endDate
  AND sl.organizationId = :tenantId;
```

---

## 7. Projects and Operations KPIs

### KPI-PRJ-007: Project Schedule Variance

**Business Question:** Are projects on track to meet their deadlines?

**Formula:**
```
Schedule Variance (SV) = Earned Value (EV) - Planned Value (PV)
```

**Calculation Details:**
- **Earned Value:** Budgeted cost of work completed
- **Planned Value:** Budgeted cost of work scheduled
- **Time Period:** As of status date
- **Filters:** Project, date

**Data Sources:**
- Project entity (budget, planned completion)
- Task entity (status, completion percentage)
- Milestone entity (planned vs actual dates)

**Inclusion Criteria:**
- All tasks and milestones
- As of status date

**Exclusion Criteria:**
- Cancelled projects
- Tasks not yet started

**Handling Rules:**
- Completion: Use task completion percentage
- Budget: Use original budget
- Timing: Use status date

**Dimensions:**
- Project
- Time (status date)
- Project phase
- Project manager

**Limitations:**
- Requires accurate task completion tracking
- Does not account for quality
- May not reflect critical path

**Verification:**
```sql
SELECT 
  SUM(t.budget * t.completionPercentage / 100) as earned_value,
  SUM(t.budget * planned_completion / 100) as planned_value,
  (SUM(t.budget * t.completionPercentage / 100) - SUM(t.budget * planned_completion / 100)) as schedule_variance
FROM tasks t
WHERE t.projectId = :projectId
  AND t.organizationId = :tenantId
  AND t.statusDate = :statusDate;
```

---

## 8. Customer Support KPIs

### KPI-SUP-007: First Contact Resolution (FCR)

**Business Question:** What percentage of support cases are resolved on first contact?

**Formula:**
```
FCR = (Cases Resolved on First Contact / Total Cases) × 100
```

**Calculation Details:**
- **Numerator:** Count of cases resolved without follow-up
- **Denominator:** Total cases closed in period
- **Time Period:** Monthly, quarterly
- **Filters:** Support team, case type, priority

**Data Sources:**
- Case entity (status, resolutionDate, contactCount)
- CaseActivity entity (interaction records)

**Inclusion Criteria:**
- All closed cases
- Cases with contactCount = 1

**Exclusion Criteria:**
- Cases still open
- Cases reopened after closure
- Test cases

**Handling Rules:**
- Reopened cases: Exclude from FCR
- Multiple contacts: Count as not FCR
- Time window: Resolution within 24 hours

**Dimensions:**
- Time (month, quarter)
- Support team
- Case type
- Priority
- Channel (email, phone, chat)

**Limitations:**
- Definition of "first contact" may vary
- Does not measure quality of resolution
- Customer satisfaction not captured

**Verification:**
```sql
SELECT 
  COUNT(CASE WHEN contactCount = 1 THEN 1 END) as fcr_count,
  COUNT(*) as total_count,
  (COUNT(CASE WHEN contactCount = 1 THEN 1 END) * 100.0 / COUNT(*)) as fcr_rate
FROM cases
WHERE status = 'closed'
  AND resolutionDate BETWEEN :startDate AND :endDate
  AND organizationId = :tenantId
  AND isTest = false;
```

---

## 9. Summary

This catalog provides detailed formulas and definitions for key KPIs across all business domains. Each KPI includes:

- Complete calculation specifications
- Data source requirements
- Inclusion and exclusion criteria
- Handling rules for special cases
- Available dimensions for analysis
- Known limitations
- SQL verification queries

**Next Steps:**
1. Review and approve KPI definitions
2. Implement calculation engines
3. Build data quality checks
4. Create dashboard visualizations
5. Establish monitoring and alerting

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** BI Architect / Business Analysts
