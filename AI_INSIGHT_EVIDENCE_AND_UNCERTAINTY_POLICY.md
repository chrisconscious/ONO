# AI Insight Evidence and Uncertainty Policy

**Document ID:** BI-8.9  
**Stage:** 8 — Business Intelligence, Analytics, KPI Definitions, and Data Quality  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the policy for AI-generated insights in the ClickIT platform. It establishes requirements for evidence-based insights, uncertainty disclosure, and the clear separation between facts, calculations, predictions, assumptions, and recommendations.

**Key Principles:**
- All AI insights must cite evidence
- Uncertainty always disclosed
- Clear distinction between facts and predictions
- No fabrication of data or relationships
- Human approval for consequential actions
- Complete audit trail

---

## 2. Insight Types and Requirements

### 2.1 Descriptive Insights

**Definition:** Explain what happened and why

**Requirements:**
- Must cite specific data sources
- Must show supporting evidence
- Must indicate data freshness
- Must not imply causation without evidence

**Example:**
```
Revenue declined 15% in Q4 compared to Q3.

Evidence:
- Q3 Revenue: $500,000 (150 invoices)
- Q4 Revenue: $425,000 (127 invoices)
- Primary driver: 23% decline in enterprise segment
- Contributing factor: 2 major customers reduced orders

Data Quality: 98% complete, last updated 2 hours ago
Confidence: High (based on complete data)
```

### 2.2 Diagnostic Insights

**Definition:** Explain why something happened

**Requirements:**
- Must identify contributing factors
- Must show correlation vs. causation
- Must cite supporting data
- Must acknowledge limitations

**Example:**
```
The revenue decline appears correlated with reduced sales activity.

Contributing Factors:
- Sales calls decreased 30% in Q4
- Proposal rate decreased 25%
- Win rate remained stable at 32%

Correlation Analysis:
- Strong correlation (r=0.85) between call volume and revenue
- Correlation does not imply causation
- Other factors may contribute (market conditions, seasonality)

Data Quality: 95% complete
Confidence: Medium (correlation-based, not causal)
Limitations: Does not account for external market factors
```

### 2.3 Predictive Insights

**Definition:** Estimate what might happen

**Requirements:**
- Must state prediction clearly
- Must provide confidence interval
- Must cite model and training data
- Must explain assumptions
- Must acknowledge limitations

**Example:**
```
Based on current trends, Q1 revenue is forecast to be $400,000 ± $50,000.

Prediction Details:
- Point forecast: $400,000
- 80% confidence interval: $350,000 - $450,000
- Model: Time series (ARIMA)
- Training data: 24 months of historical revenue
- Key drivers: Seasonal patterns, current pipeline

Assumptions:
- Historical patterns continue
- No major market disruptions
- Sales team capacity remains stable

Limitations:
- Does not account for new product launches
- Does not account for competitor actions
- Accuracy decreases with forecast horizon

Confidence: Medium (75%)
Data Quality: 98% complete
```

### 2.4 Prescriptive Insights (Recommendations)

**Definition:** Suggest what actions to take

**Requirements:**
- Must state recommendation clearly
- Must explain expected impact
- Must cite supporting evidence
- Must identify risks and constraints
- Must require approval for consequential actions

**Example:**
```
Recommendation: Increase marketing spend by 20% in enterprise segment.

Expected Impact:
- Projected revenue increase: $50,000 - $75,000
- Expected ROI: 2.5x - 3.5x
- Timeline: 3-6 months

Supporting Evidence:
- Enterprise segment shows 40% higher conversion rate
- Current marketing spend below industry benchmark
- Historical data shows 2.8x average ROI for enterprise campaigns

Risks:
- Market conditions may change
- Competitor response uncertain
- Execution risk (team capacity)

Constraints:
- Requires $25,000 additional budget
- Requires marketing team approval
- Requires 2-week setup time

Approval Required: Yes (Finance Manager)
Confidence: Medium (70%)
```

---

## 3. Evidence Requirements

### 3.1 Evidence Types

**Direct Evidence:**
- Specific data records cited
- Exact values and timestamps
- Source entity and field names
- Data quality indicators

**Statistical Evidence:**
- Correlation coefficients
- Statistical significance levels
- Confidence intervals
- Sample sizes

**Trend Evidence:**
- Time series data
- Trend direction and magnitude
- Seasonal patterns
- Anomaly detection

**Comparative Evidence:**
- Period-over-period comparisons
- Benchmark comparisons
- Peer comparisons (if available)
- Industry standards

### 3.2 Evidence Citation

**Citation Format:**
```typescript
interface EvidenceCitation {
  type: 'data_record' | 'statistical' | 'trend' | 'comparative';
  source: {
    entity: string;
    field?: string;
    recordIds?: string[];
    dateRange?: { start: Date; end: Date };
  };
  value: any;
  context: string;
  confidence?: number;               // 0-100
  limitations?: string[];
}
```

**Example Citation:**
```typescript
{
  type: 'data_record',
  source: {
    entity: 'Invoice',
    field: 'total',
    recordIds: ['inv-001', 'inv-002', 'inv-003'],
    dateRange: { start: '2025-10-01', end: '2025-12-31' }
  },
  value: { sum: 425000, count: 127 },
  context: 'Q4 2025 invoice totals',
  confidence: 98,
  limitations: ['Excludes cancelled invoices']
}
```

### 3.3 Evidence Quality

**Quality Indicators:**
- **Data Completeness:** Percentage of required data present
- **Data Freshness:** How current the data is
- **Sample Size:** Number of records supporting insight
- **Statistical Significance:** p-value or confidence level
- **Data Quality Score:** Overall quality rating

**Quality Thresholds:**
- **High Confidence:** ≥ 90% quality, ≥ 100 records, p < 0.05
- **Medium Confidence:** 70-89% quality, 30-99 records, p < 0.10
- **Low Confidence:** < 70% quality, < 30 records, p ≥ 0.10

---

## 4. Uncertainty Disclosure

### 4.1 Uncertainty Types

**Data Uncertainty:**
- Missing data
- Inaccurate data
- Incomplete data
- Stale data

**Model Uncertainty:**
- Model error (MAE, RMSE)
- Model drift
- Limited training data
- Extrapolation beyond training range

**Methodological Uncertainty:**
- Correlation vs. causation
- Assumptions in calculations
- Simplifications in models
- External factors not captured

### 4.2 Uncertainty Communication

**Confidence Levels:**
```typescript
interface ConfidenceLevel {
  level: 'high' | 'medium' | 'low' | 'very_low';
  range: { min: number; max: number };
  description: string;
  color: string;                     // For UI display
  icon: string;                      // For UI display
}

const CONFIDENCE_LEVELS = {
  high: { range: { min: 80, max: 100 }, description: 'Strong evidence', color: 'green', icon: '✓' },
  medium: { range: { min: 60, max: 79 }, description: 'Moderate evidence', color: 'yellow', icon: '~' },
  low: { range: { min: 40, max: 59 }, description: 'Weak evidence', color: 'orange', icon: '!' },
  very_low: { range: { min: 0, max: 39 }, description: 'Very weak evidence', color: 'red', icon: '✗' }
};
```

**Uncertainty Display:**
```
Confidence: Medium (72%)
━━━━━━━━━━━━━━━━━━━━━━━━
Evidence Strength: Moderate
Data Quality: 85% complete
Sample Size: 67 records
Statistical Significance: p < 0.10

Limitations:
• Based on correlation, not causation
• Does not account for external factors
• Limited historical data (12 months)
```

### 4.3 Uncertainty in Recommendations

**Risk Disclosure:**
```typescript
interface RecommendationRisk {
  type: 'execution' | 'market' | 'data' | 'model';
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation?: string;
}
```

**Example Risk Disclosure:**
```
Risks:
1. Execution Risk (Medium likelihood, High impact)
   - Marketing team may not have capacity
   - Mitigation: Confirm team availability before approval

2. Market Risk (Low likelihood, High impact)
   - Competitor may launch competing product
   - Mitigation: Monitor competitor activity

3. Data Risk (Medium likelihood, Medium impact)
   - Historical data may not represent future
   - Mitigation: Review forecast monthly and adjust
```

---

## 5. Prohibited Practices

### 5.1 Fabrication

**Prohibited:**
- Inventing data points not in source
- Creating fake citations or evidence
- Fabricating statistical relationships
- Inventing customer quotes or feedback

**Detection:**
- Cross-check all citations against source data
- Verify statistical calculations
- Validate data quality indicators
- Audit trail of all evidence

### 5.2 Misrepresentation

**Prohibited:**
- Presenting correlation as causation
- Hiding uncertainty or limitations
- Exaggerating confidence levels
- Omitting contradictory evidence

**Requirements:**
- Clearly state correlation vs. causation
- Always disclose uncertainty
- Present balanced evidence
- Acknowledge limitations

### 5.3 Unauthorized Actions

**Prohibited:**
- AI executing actions without approval
- AI modifying business records
- AI accessing unauthorized data
- AI bypassing permission checks

**Requirements:**
- All consequential actions require approval
- AI operates within permission boundaries
- Complete audit trail of all actions
- Human oversight for high-risk actions

---

## 6. AI Insight Workflow

### 6.1 Insight Generation Process

```
User Question or Trigger
    ↓
Identify Relevant Data (with permission checks)
    ↓
Validate Data Quality and Freshness
    ↓
Calculate Metrics (using approved definitions)
    ↓
Analyze Patterns and Trends
    ↓
Generate Insight (with evidence)
    ↓
Assess Confidence and Uncertainty
    ↓
Format Insight (with citations)
    ↓
Present to User (with limitations)
    ↓
User Reviews and Acts (with approval if needed)
    ↓
Track Outcomes (for feedback)
```

### 6.2 Insight Validation

**Pre-Presentation Checks:**
- All evidence cited and verifiable
- Confidence level appropriate
- Uncertainty disclosed
- Limitations stated
- No prohibited practices
- Permissions respected

**Validation Checklist:**
```typescript
interface InsightValidation {
  insightId: string;
  
  // Evidence validation
  evidenceCited: boolean;
  evidenceVerifiable: boolean;
  evidenceQuality: number;
  
  // Confidence validation
  confidenceLevel: string;
  confidenceJustified: boolean;
  uncertaintyDisclosed: boolean;
  
  // Limitations validation
  limitationsStated: boolean;
  limitationsAccurate: boolean;
  
  // Prohibited practices check
  noFabrication: boolean;
  noMisrepresentation: boolean;
  noUnauthorizedActions: boolean;
  
  // Permission check
  dataAccessAuthorized: boolean;
  userPermissionsValid: boolean;
  
  // Overall
  isValid: boolean;
  validationErrors: string[];
}
```

---

## 7. Audit and Accountability

### 7.1 Audit Trail

**Insight Audit Record:**
```typescript
interface InsightAuditRecord {
  id: string;
  insightId: string;
  insightType: 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive';
  
  // Generation
  generatedAt: Date;
  generatedBy: string;               // 'ai' | user ID
  modelId?: string;                  // If AI-generated
  modelVersion?: string;
  
  // Evidence
  evidenceCitations: EvidenceCitation[];
  dataSources: string[];
  dataQualityScore: number;
  
  // Confidence
  confidenceLevel: string;
  confidenceScore: number;
  uncertaintyRange?: any;
  
  // Presentation
  presentedTo: string[];             // User IDs
  presentationFormat: string;
  
  // User Response
  userAction?: 'accepted' | 'rejected' | 'modified' | 'ignored';
  userFeedback?: string;
  actionTaken?: string;
  
  // Outcome (for prescriptive insights)
  outcomeTracked?: boolean;
  actualOutcome?: any;
  expectedOutcome?: any;
  variance?: number;
  
  // Audit
  createdAt: Date;
  tenantId: string;
}
```

### 7.2 Accountability

**AI Accountability:**
- AI insights clearly labeled as AI-generated
- Model version and training data disclosed
- Limitations and uncertainty stated
- No claim of infallibility

**User Accountability:**
- Users responsible for acting on insights
- Users must verify critical insights
- Users must approve consequential actions
- Users accountable for outcomes

**Organizational Accountability:**
- Organization responsible for AI governance
- Organization must validate AI performance
- Organization must address AI failures
- Organization must maintain audit trail

---

## 8. Acceptance Criteria

### 8.1 Evidence Requirements

- [ ] All insights cite specific evidence
- [ ] Evidence verifiable against source data
- [ ] Data quality indicators displayed
- [ ] Evidence citations include source and context
- [ ] No fabricated or misrepresented evidence

### 8.2 Uncertainty Requirements

- [ ] Confidence levels calculated and displayed
- [ ] Uncertainty ranges provided for predictions
- [ ] Limitations clearly stated
- [ ] Correlation vs. causation distinguished
- [ ] Low-confidence insights flagged

### 8.3 Prohibited Practices

- [ ] No fabrication of data or evidence
- [ ] No misrepresentation of relationships
- [ ] No unauthorized actions by AI
- [ ] No bypassing of permission checks
- [ ] No hiding of uncertainty or limitations

### 8.4 Audit Requirements

- [ ] All insights logged with full audit trail
- [ ] Evidence citations stored
- [ ] User actions tracked
- [ ] Outcomes measured (for prescriptive insights)
- [ ] Audit logs immutable and tamper-evident

---

## 9. References

- Stage 6: AI-Assisted Decision Workflows
- Stage 7: AI/ML Security and Data Boundaries
- Stage 8: Forecasting and Predictive Analytics Specification
- Industry standards: AI Ethics Guidelines (EU, IEEE)

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** AI Architect / BI Governance Lead
