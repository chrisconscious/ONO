# ML Use Case and Readiness Catalog

**Document ID:** AI-9.4  
**Stage:** 9 — AI/ML, Inference Engine, Decision Intelligence, and Model Governance  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This catalog documents candidate ML use cases across all business domains, with readiness assessments and implementation criteria.

**Readiness Levels:**
- **Not Ready:** Insufficient or unreliable data
- **Research Candidate:** Worth investigating
- **Evaluation Ready:** Suitable data and baseline exist
- **Approved for Pilot:** Evaluation meets requirements
- **Approved for Production:** Operational and governance criteria satisfied
- **Retired:** Model no longer suitable or supported

---

## 2. CRM and Sales Use Cases

### UC-001: Lead Conversion Scoring

**Business Problem:** Prioritize leads based on conversion likelihood

**Target Variable:** Binary (converted / not converted)

**Required Data:**
- Lead attributes (source, industry, size)
- Interaction history (emails, calls, meetings)
- Time-based features (days since creation, engagement velocity)
- Minimum: 1000 leads with known outcomes

**Readiness:** Evaluation Ready
- Data available: ✓
- Quality sufficient: ✓ (85% complete)
- Baseline defined: ✓ (manual scoring)
- Model candidates: Logistic regression, XGBoost

**Evaluation Metrics:**
- Primary: AUC-ROC > 0.75
- Secondary: Precision@10, Recall@50
- Business: Conversion rate improvement > 10%

**Deployment Criteria:**
- AUC-ROC > 0.75 on validation set
- Calibration error < 5%
- Latency < 100ms
- Human approval required

**Risks:**
- Data drift if sales process changes
- Bias toward certain lead sources
- Overfitting to historical patterns

---

### UC-002: Sales Forecasting

**Business Problem:** Predict future sales revenue

**Target Variable:** Continuous (revenue amount)

**Required Data:**
- Historical sales data (24+ months)
- Pipeline data (opportunities by stage)
- Seasonal patterns
- Minimum: 24 months of data, 50+ closed deals

**Readiness:** Evaluation Ready
- Data available: ✓
- Quality sufficient: ✓ (95% complete)
- Baseline defined: ✓ (moving average)
- Model candidates: ARIMA, Prophet, XGBoost

**Evaluation Metrics:**
- Primary: MAPE < 15%
- Secondary: RMSE, MAE
- Business: Forecast accuracy improvement > 20%

**Deployment Criteria:**
- MAPE < 15% on validation set
- Stability across quarters
- Latency < 500ms
- Confidence intervals provided

**Risks:**
- Market disruptions not captured
- Seasonal pattern changes
- New product launches not in training data

---

### UC-003: Customer Churn Prediction

**Business Problem:** Identify customers at risk of churning

**Target Variable:** Binary (churned / retained)

**Required Data:**
- Customer activity history (12+ months)
- Support interactions
- Payment history
- Minimum: 500 customers with known churn status

**Readiness:** Research Candidate
- Data available: ✓
- Quality sufficient: Partial (70% complete)
- Baseline defined: ✓ (manual review)
- Model candidates: Random forest, gradient boosting

**Evaluation Metrics:**
- Primary: AUC-ROC > 0.80
- Secondary: Precision, Recall, F1
- Business: Churn reduction > 15%

**Deployment Criteria:**
- AUC-ROC > 0.80
- False positive rate < 20%
- Actionable insights provided
- Human review required

**Risks:**
- Churn definition may vary
- External factors not captured
- Imbalanced dataset (few churners)

---

## 3. Finance Use Cases

### UC-004: Cash Flow Forecasting

**Business Problem:** Predict future cash position

**Target Variable:** Continuous (cash balance)

**Required Data:**
- Historical cash flows (12+ months)
- Accounts receivable aging
- Accounts payable schedule
- Recurring revenue/expenses

**Readiness:** Evaluation Ready
- Data available: ✓
- Quality sufficient: ✓ (98% complete)
- Baseline defined: ✓ (historical average)
- Model candidates: Time series models, regression

**Evaluation Metrics:**
- Primary: MAPE < 10%
- Secondary: Directional accuracy > 80%
- Business: Cash position accuracy improvement

**Deployment Criteria:**
- MAPE < 10%
- 4-week forecast horizon
- Confidence intervals provided
- Daily updates

**Risks:**
- Unexpected large transactions
- Customer payment behavior changes
- Seasonal variations

---

### UC-005: Expense Anomaly Detection

**Business Problem:** Identify unusual expense patterns

**Target Variable:** Binary (anomalous / normal)

**Required Data:**
- Historical expenses (6+ months)
- Expense categories and amounts
- User and department information
- Minimum: 10,000 expense records

**Readiness:** Evaluation Ready
- Data available: ✓
- Quality sufficient: ✓ (95% complete)
- Baseline defined: ✓ (statistical thresholds)
- Model candidates: Isolation forest, autoencoders

**Evaluation Metrics:**
- Primary: Precision > 70%
- Secondary: Recall > 60%
- Business: Fraud detection improvement

**Deployment Criteria:**
- Precision > 70%
- False positive rate < 30%
- Real-time detection
- Human review required

**Risks:**
- Legitimate unusual expenses flagged
- Seasonal spending patterns
- New expense types not in training

---

## 4. Inventory and Operations Use Cases

### UC-006: Demand Forecasting

**Business Problem:** Predict product demand for inventory optimization

**Target Variable:** Continuous (units sold)

**Required Data:**
- Historical sales by product (24+ months)
- Seasonal patterns
- Promotions and marketing activities
- Minimum: 100 products with 24 months data

**Readiness:** Approved for Pilot
- Data available: ✓
- Quality sufficient: ✓ (90% complete)
- Baseline defined: ✓ (moving average)
- Model candidates: Prophet, LSTM, XGBoost

**Evaluation Metrics:**
- Primary: MAPE < 20%
- Secondary: Stockout reduction > 30%
- Business: Inventory cost reduction > 15%

**Deployment Criteria:**
- MAPE < 20% for top 50 products
- Stockout reduction demonstrated
- Integration with reorder system
- Weekly retraining

**Risks:**
- New products not in training
- Promotional effects not captured
- Supply chain disruptions

---

### UC-007: Project Delay Prediction

**Business Problem:** Identify projects at risk of delay

**Target Variable:** Binary (delayed / on-time)

**Required Data:**
- Historical project data (12+ months)
- Task completion rates
- Resource allocation
- Minimum: 50 projects with known outcomes

**Readiness:** Research Candidate
- Data available: Partial
- Quality sufficient: Partial (75% complete)
- Baseline defined: ✓ (manual assessment)
- Model candidates: Random forest, gradient boosting

**Evaluation Metrics:**
- Primary: AUC-ROC > 0.75
- Secondary: Precision, Recall
- Business: On-time delivery improvement > 20%

**Deployment Criteria:**
- AUC-ROC > 0.75
- Early warning (2+ weeks before deadline)
- Actionable recommendations
- Human review required

**Risks:**
- Limited training data
- Project uniqueness
- External dependencies not captured

---

## 5. Marketing Use Cases

### UC-008: Campaign Performance Estimation

**Business Problem:** Predict campaign ROI before launch

**Target Variable:** Continuous (ROI percentage)

**Required Data:**
- Historical campaign data (12+ months)
- Campaign attributes (channel, budget, audience)
- Performance metrics (leads, conversions, revenue)
- Minimum: 50 campaigns with known outcomes

**Readiness:** Research Candidate
- Data available: ✓
- Quality sufficient: Partial (80% complete)
- Baseline defined: ✓ (historical average)
- Model candidates: Regression, gradient boosting

**Evaluation Metrics:**
- Primary: MAPE < 25%
- Secondary: Directional accuracy > 70%
- Business: Budget allocation improvement

**Deployment Criteria:**
- MAPE < 25%
- Confidence intervals provided
- Integration with campaign planning
- Human review required

**Risks:**
- Market conditions change
- Campaign uniqueness
- Attribution complexity

---

## 6. Readiness Assessment Framework

### 6.1 Data Readiness

**Criteria:**
- Volume: Sufficient records for training (minimum 500-1000)
- Quality: Completeness > 85%, accuracy > 95%
- Coverage: Represents business scenarios
- Freshness: Recent enough to be relevant
- Labels: Ground truth available for supervised learning

**Assessment:**
```typescript
interface DataReadiness {
  volume: 'insufficient' | 'marginal' | 'sufficient' | 'excellent';
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  coverage: 'limited' | 'partial' | 'good' | 'comprehensive';
  freshness: 'stale' | 'aging' | 'current' | 'real-time';
  labels: 'none' | 'partial' | 'complete' | 'verified';
  
  overallScore: number; // 0-100
  recommendation: 'not_ready' | 'research' | 'evaluation' | 'pilot' | 'production';
}
```

### 6.2 Business Readiness

**Criteria:**
- Clear business problem defined
- Success metrics identified
- Stakeholder buy-in
- Integration points identified
- Change management plan

**Assessment:**
```typescript
interface BusinessReadiness {
  problemDefinition: 'unclear' | 'partial' | 'clear' | 'well-defined';
  successMetrics: 'none' | 'identified' | 'defined' | 'validated';
  stakeholderBuyIn: 'none' | 'partial' | 'strong' | 'committed';
  integrationPlan: 'none' | 'draft' | 'defined' | 'ready';
  changeManagement: 'none' | 'planned' | 'ready' | 'executing';
  
  overallScore: number; // 0-100
  recommendation: 'not_ready' | 'research' | 'evaluation' | 'pilot' | 'production';
}
```

### 6.3 Technical Readiness

**Criteria:**
- Infrastructure available
- Team skills present
- Tools and frameworks ready
- Monitoring capabilities
- Deployment pipeline

**Assessment:**
```typescript
interface TechnicalReadiness {
  infrastructure: 'none' | 'partial' | 'ready' | 'production-grade';
  teamSkills: 'none' | 'learning' | 'competent' | 'expert';
  toolsReady: 'none' | 'partial' | 'ready' | 'optimized';
  monitoring: 'none' | 'basic' | 'comprehensive' | 'advanced';
  deployment: 'none' | 'manual' | 'automated' | 'ci-cd';
  
  overallScore: number; // 0-100
  recommendation: 'not_ready' | 'research' | 'evaluation' | 'pilot' | 'production';
}
```

---

## 7. Prioritization Framework

### 7.1 Priority Score

```typescript
function calculatePriority(useCase: MLUseCase): number {
  const businessValue = useCase.businessImpact * 0.4; // 40% weight
  const dataReadiness = useCase.dataReadiness.overallScore * 0.3; // 30% weight
  const feasibility = useCase.technicalFeasibility * 0.2; // 20% weight
  const urgency = useCase.businessUrgency * 0.1; // 10% weight
  
  return businessValue + dataReadiness + feasibility + urgency;
}
```

### 7.2 Prioritization Matrix

**High Priority (Score > 80):**
- UC-001: Lead Conversion Scoring (85)
- UC-006: Demand Forecasting (82)

**Medium Priority (Score 60-80):**
- UC-002: Sales Forecasting (75)
- UC-004: Cash Flow Forecasting (72)
- UC-005: Expense Anomaly Detection (68)

**Low Priority (Score < 60):**
- UC-003: Customer Churn Prediction (58)
- UC-007: Project Delay Prediction (55)
- UC-008: Campaign Performance Estimation (52)

---

## 8. Implementation Roadmap

### Phase 1 (Months 1-3): Foundation
- UC-001: Lead Conversion Scoring (pilot)
- UC-006: Demand Forecasting (pilot)

### Phase 2 (Months 4-6): Expansion
- UC-002: Sales Forecasting
- UC-004: Cash Flow Forecasting
- UC-005: Expense Anomaly Detection

### Phase 3 (Months 7-12): Advanced
- UC-003: Customer Churn Prediction
- UC-007: Project Delay Prediction
- UC-008: Campaign Performance Estimation

---

## 9. Acceptance Criteria

### 9.1 Use Case Documentation

- [ ] Business problem clearly defined
- [ ] Target variable specified
- [ ] Data requirements documented
- [ ] Readiness assessment completed
- [ ] Evaluation metrics defined
- [ ] Deployment criteria specified
- [ ] Risks identified
- [ ] Priority score calculated

### 9.2 Readiness Assessment

- [ ] Data readiness evaluated
- [ ] Business readiness evaluated
- [ ] Technical readiness evaluated
- [ ] Overall readiness level assigned
- [ ] Gaps identified and documented
- [ ] Remediation plan created

### 9.3 Prioritization

- [ ] Priority scores calculated
- [ ] Use cases ranked
- [ ] Implementation roadmap defined
- [ ] Resource requirements estimated
- [ ] Dependencies identified

---

## 10. References

- Stage 2: AI/ML and Inference Architecture
- Stage 6: Business KPI and Outcome Catalog
- Stage 8: Forecasting and Predictive Analytics Specification
- Stage 9: Model Training and Evaluation Policy

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Data Scientist / ML Engineer
