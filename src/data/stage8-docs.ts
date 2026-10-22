import { Document } from './types';

export const stage8Doc1: Document = {
  id: 'bi-analytics-architecture',
  number: 1,
  title: 'BI Analytics Architecture Specification',
  shortTitle: 'BI Architecture',
  description: 'Comprehensive business intelligence architecture including data flow, layers, components, and implementation roadmap.',
  status: 'Recorded',
  stage: 8,
  sections: [
    {
      id: '8.1.1',
      title: 'Architecture Overview',
      content: `**9-Layer Analytics Architecture:**
1. Operational Data (source of truth)
2. Data Validation & Normalization
3. Metric Calculation Engine
4. Analytical Aggregation
5. Dashboards & Reports
6. AI-Assisted Interpretation
7. Recommendations & Decision Support
8. Authorized Actions & Execution
9. Outcome Measurement & Feedback

**Implementation Phases:**
- Phase 1 (Months 1-3): Direct queries, basic dashboards
- Phase 2 (Months 4-6): Pre-aggregated tables, AI insights
- Phase 3 (Months 7-12): Full ETL pipeline, advanced analytics

**Performance Targets:**
- Simple dashboards: < 2 seconds
- Complex dashboards: < 5 seconds
- Drill-down queries: < 3 seconds`
    }
  ]
};

export const stage8Doc2: Document = {
  id: 'metric-kpi-registry',
  number: 2,
  title: 'Metric and KPI Registry Specification',
  shortTitle: 'Metric Registry',
  description: 'Central registry for all metrics with governance, versioning, ownership, and quality standards.',
  status: 'Recorded',
  stage: 8,
  sections: [
    {
      id: '8.2.1',
      title: 'Registry Overview',
      content: `**Metric Definition Schema:**
- Unique ID, name, description
- Formula and calculation logic
- Data sources and dependencies
- Dimensions and filters
- Targets and thresholds
- Quality requirements
- Ownership and approval

**Lifecycle States:**
Draft → Proposed → Under Review → Approved → Published → Deprecated → Archived

**Governance:**
- Metric Governance Committee
- Naming conventions
- Ownership and stewardship
- Quality standards (≥95% for critical metrics)`
    }
  ]
};

export const stage8Doc3: Document = {
  id: 'kpi-formula-catalog',
  number: 3,
  title: 'KPI Formula and Definition Catalog',
  shortTitle: 'KPI Catalog',
  description: 'Detailed formulas and definitions for all KPIs across CRM, sales, marketing, finance, inventory, projects, and support.',
  status: 'Recorded',
  stage: 8,
  sections: [
    {
      id: '8.3.1',
      title: 'KPI Catalog Overview',
      content: `**KPIs by Domain:**
- CRM: Qualified Lead Rate, Lead Response Time, Lead-to-Customer Conversion
- Sales: MRR, Sales Target Attainment, Pipeline Value, Win Rate
- Marketing: MQL, Campaign ROI, CAC, Marketing ROI
- Finance: Total Revenue, Gross Margin, DSO, Current Ratio, Cash Flow
- Inventory: Stock Turnover, Stockout Rate, Inventory Accuracy
- Projects: Schedule Variance, On-Time Delivery, Resource Utilization
- Support: FCR, Resolution Time, Customer Satisfaction

**Each KPI Includes:**
- Complete formula and calculation details
- Data sources and required fields
- Inclusion/exclusion criteria
- Handling rules for special cases
- Available dimensions
- Known limitations
- SQL verification queries`
    }
  ]
};

export const stage8Doc4: Document = {
  id: 'data-quality-freshness',
  number: 4,
  title: 'Data Quality and Freshness Specification',
  shortTitle: 'Data Quality',
  description: 'Data quality dimensions, checks, monitoring, freshness requirements, and issue resolution workflows.',
  status: 'Recorded',
  stage: 8,
  sections: [
    {
      id: '8.4.1',
      title: 'Data Quality Overview',
      content: `**Quality Dimensions:**
- Completeness (≥95% for critical metrics)
- Accuracy (≥99% for financial data)
- Consistency (≥99%)
- Timeliness (≥95% within SLA)
- Uniqueness (≥99.9%)
- Validity (≥99%)

**Quality Checks:**
- Structural checks (formats, types, ranges)
- Business logic checks (totals match, dates valid)
- Statistical checks (outliers, distributions)
- Cross-reference checks (relationships valid)

**Freshness Categories:**
- Real-Time: < 1 minute
- Near Real-Time: < 15 minutes
- Hourly: < 1 hour
- Daily: < 24 hours
- Weekly: < 7 days

**Issue Resolution:**
Detection → Classification → Assignment → Investigation → Fix → Verification → Documentation`
    }
  ]
};

export const stage8Doc5: Document = {
  id: 'analytics-lineage-reconciliation',
  number: 5,
  title: 'Analytics Lineage and Reconciliation Specification',
  shortTitle: 'Lineage & Reconciliation',
  description: 'Data lineage tracking, reconciliation processes, correction handling, and historical reporting requirements.',
  status: 'Recorded',
  stage: 8,
  sections: [
    {
      id: '8.5.1',
      title: 'Lineage and Reconciliation Overview',
      content: `**Lineage Chain:**
Dashboard → Metric Definition → Calculation → Source Records → Transactions

**Reconciliation Types:**
- Operational to Analytical
- Period to Period
- Source to Target

**Correction Handling:**
- Retroactive: Recalculate history
- Prospective: Apply from effective date
- Separate: Record as new transaction

**Historical Reporting:**
- Version selection for metrics
- Point-in-time reporting
- Recalculation capabilities
- Complete audit trail`
    }
  ]
};

export const stage8Doc6: Document = {
  id: 'dashboard-reporting-requirements',
  number: 6,
  title: 'Dashboard and Reporting Requirements',
  shortTitle: 'Dashboards & Reports',
  description: 'Dashboard types, features, states, reporting capabilities, accessibility, and performance requirements.',
  status: 'Recorded',
  stage: 8,
  sections: [
    {
      id: '8.6.1',
      title: 'Dashboard Overview',
      content: `**Dashboard Types:**
- Executive: Strategic overview, high-level KPIs
- Sales: Pipeline, performance, forecasts
- Finance: Financial health, cash flow, budgets
- Operations: Projects, resources, delivery
- Support: Cases, SLA, satisfaction

**Core Features:**
- Filtering and drill-down
- Comparisons (period-over-period, actual vs. target)
- Visualizations (charts, tables, funnels)
- Real-time updates
- Customization
- Export (PDF, Excel, CSV, PowerPoint)

**States:**
- Loading (skeleton, progressive)
- Empty (no data, no access)
- Error (data error, permission error, system error)
- Partial data (missing data, stale data)

**Performance:**
- Simple dashboards: < 2 seconds
- Complex dashboards: < 5 seconds
- Support 1000+ concurrent users
- WCAG 2.2 AA compliant`
    }
  ]
};

export const stage8Doc7: Document = {
  id: 'analytics-alerts-anomaly',
  number: 7,
  title: 'Analytics Alerts and Anomaly Detection',
  shortTitle: 'Alerts & Anomalies',
  description: 'Threshold alerts, anomaly detection methods, alert management, notification channels, and monitoring.',
  status: 'Recorded',
  stage: 8,
  sections: [
    {
      id: '8.7.1',
      title: 'Alerts and Anomaly Overview',
      content: `**Alert Types:**
- Threshold Alerts: Absolute, percentage, trend, comparison
- Anomaly Detection: Z-score, moving average, percentile, ML methods

**Alert Management:**
- Lifecycle: New → Acknowledged → Investigating → Resolved → Closed
- Deduplication within time windows
- Suppression for maintenance/known issues
- Severity levels: Low, Medium, High, Critical

**Notification Channels:**
- Email (detailed with links)
- In-app (real-time notifications)
- SMS (critical alerts only)
- Slack/Teams (integration)

**Anomaly Detection:**
- Baseline calculation (historical, seasonal)
- Confidence scoring (0-100)
- Alert generation when confidence > threshold
- False positive rate < 10%`
    }
  ]
};

export const stage8Doc8: Document = {
  id: 'forecasting-predictive-analytics',
  number: 8,
  title: 'Forecasting and Predictive Analytics Specification',
  shortTitle: 'Forecasting',
  description: 'Forecasting use cases, architecture, model training, prediction output, monitoring, and human oversight.',
  status: 'Recorded',
  stage: 8,
  sections: [
    {
      id: '8.8.1',
      title: 'Forecasting Overview',
      content: `**Use Cases:**
- Sales Forecasting: Revenue predictions with confidence intervals
- Demand Forecasting: Product demand for inventory optimization
- Cash Flow Forecasting: Future cash position predictions
- Customer Churn Prediction: Churn probability by customer
- Lead Conversion Scoring: Conversion likelihood by lead

**Architecture:**
Data Preparation → Feature Engineering → Model Training → Evaluation → Deployment → Prediction → Validation

**Model Requirements:**
- Minimum data requirements enforced
- Baseline comparisons required
- Confidence intervals calculated
- Uncertainty always disclosed
- Human oversight for high-risk predictions

**Monitoring:**
- Performance tracking over time
- Drift detection (data and concept)
- Retraining triggers
- Model versioning and lineage`
    }
  ]
};

export const stage8Doc9: Document = {
  id: 'ai-insight-evidence-uncertainty',
  number: 9,
  title: 'AI Insight Evidence and Uncertainty Policy',
  shortTitle: 'AI Evidence Policy',
  description: 'AI insight types, evidence requirements, uncertainty disclosure, prohibited practices, and audit requirements.',
  status: 'Recorded',
  stage: 8,
  sections: [
    {
      id: '8.9.1',
      title: 'AI Insight Policy Overview',
      content: `**Insight Types:**
- Descriptive: What happened and why (must cite data)
- Diagnostic: Why something happened (correlation vs. causation)
- Predictive: What might happen (confidence intervals required)
- Prescriptive: What to do (approval required for actions)

**Evidence Requirements:**
- All insights must cite specific evidence
- Evidence must be verifiable against source data
- Data quality indicators displayed
- Statistical evidence with significance levels
- No fabrication or misrepresentation

**Uncertainty Disclosure:**
- Confidence levels: High (80-100%), Medium (60-79%), Low (40-59%), Very Low (<40%)
- Uncertainty ranges for predictions
- Limitations clearly stated
- Assumptions explicitly listed

**Prohibited Practices:**
- No fabricating data or evidence
- No misrepresenting relationships
- No unauthorized actions by AI
- No bypassing permission checks

**Audit Requirements:**
- Complete audit trail for all insights
- Evidence citations stored
- User actions tracked
- Outcomes measured for prescriptive insights`
    }
  ]
};

export const stage8Doc10: Document = {
  id: 'analytics-security-tenant-boundaries',
  number: 10,
  title: 'Analytics Security and Tenant Boundaries',
  shortTitle: 'Analytics Security',
  description: 'Tenant isolation in analytics, permission enforcement, data classification, cache security, and marketplace requirements.',
  status: 'Recorded',
  stage: 8,
  sections: [
    {
      id: '8.10.1',
      title: 'Analytics Security Overview',
      content: `**Tenant Isolation:**
- Enforced at all layers: data retrieval, calculation, dashboards, AI, exports
- RLS policies on all analytical tables
- No cross-tenant joins or comparisons
- Automated isolation testing

**Permission Enforcement:**
- Dashboard access permission-checked
- Metric access permission-checked
- Drill-down access permission-checked
- Export access permission-checked
- All denials logged

**Data Classification:**
- Public: Aggregated platform statistics
- Internal: Standard dashboards
- Confidential: Detailed financial/customer analytics
- Highly Restricted: Executive summaries with sensitive data

**Cache Security:**
- All cache keys include tenant ID
- Tenant-specific encryption
- Appropriate TTL per metric
- Access validation on cache read

**Platform-Wide Analytics:**
- Only anonymized aggregate statistics
- No tenant-specific business data
- Multi-party approval for access
- Complete audit trail

**Future Data Marketplace:**
- Explicit tenant consent required
- Full anonymization and aggregation
- Re-identification risk assessment
- Independent ethics review`
    }
  ]
};

export const stage8Doc11: Document = {
  id: 'bi-acceptance-verification',
  number: 11,
  title: 'BI Acceptance and Verification Criteria',
  shortTitle: 'Acceptance Criteria',
  description: 'Comprehensive acceptance criteria for metrics, data quality, reporting periods, freshness, security, AI insights, and system reliability.',
  status: 'Recorded',
  stage: 8,
  sections: [
    {
      id: '8.11.1',
      title: 'Acceptance Criteria Overview',
      content: `**Metric Verification:**
- All metrics have unique, complete definitions
- Calculations traceable to source records
- Refunds and corrections handled correctly
- Reporting periods consistent
- Data freshness communicated accurately

**Security Verification:**
- Users see only authorized metrics and records
- Exports enforce same security as views
- AI insights cite evidence and disclose uncertainty
- Predictions require sufficient data
- Tenant isolation verified at all levels

**Industry Verification:**
- Industry-specific metrics configurable
- Custom metrics supported
- No core changes required for new industries

**System Reliability:**
- Analytics failures detectable and recoverable
- Historical reports use appropriate versions
- Sensitive data protected
- Recommendations trackable to outcomes

**Release-Blocking Criteria:**
- No tenant isolation failures
- No permission bypasses
- No data leakage
- Calculation errors < 1%
- Complete audit trail
- All security tests pass

**Severity Thresholds:**
- Critical: Cannot release (tenant isolation, permission bypass, data leakage)
- High: Should fix before release (quality < 90%, SLA violations > 5%)
- Medium: Nice to fix (UI/UX issues, documentation gaps)`
    }
  ]
};
