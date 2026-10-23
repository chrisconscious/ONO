# Model Training and Evaluation Policy

**Document ID:** AI-9.5  
**Stage:** 9 — AI/ML, Inference Engine, Decision Intelligence, and Model Governance  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This policy defines standards for training and evaluating ML models in the ClickIT platform.

**Key Principles:**
- Reproducible training with versioned data and code
- Rigorous validation to prevent overfitting
- Baseline comparisons required
- Business value over statistical metrics
- Human approval for production deployment

---

## 2. Training Process

### 2.1 Standard Workflow

```
1. Problem Definition
   ↓
2. Data Assessment
   ↓
3. Dataset Preparation (versioned, split)
   ↓
4. Feature Engineering (versioned)
   ↓
5. Baseline Model
   ↓
6. Model Training (with hyperparameters)
   ↓
7. Validation (cross-validation, holdout)
   ↓
8. Evaluation (metrics, bias, calibration)
   ↓
9. Comparison to Baseline
   ↓
10. Documentation
    ↓
11. Review and Approval
    ↓
12. Deployment (if approved)
```

### 2.2 Dataset Preparation

**Splitting Strategy:**
- **Time-based split:** Train on past, validate/test on future (preferred for time series)
- **Random split:** For non-temporal data (stratified for classification)
- **Recommended split:** 70% train, 15% validation, 15% test

**Data Versioning:**
```typescript
interface DatasetVersion {
  id: string;
  name: string;
  version: string;
  sourceQuery: string;
  filters: Record<string, any>;
  recordCount: number;
  dateRange: { start: Date; end: Date };
  splitMethod: 'time' | 'random' | 'stratified';
  splitRatios: { train: number; validation: number; test: number };
  createdAt: Date;
  createdBy: string;
  checksum: string;
}
```

**Leakage Prevention:**
- No future data in training set
- No target variable in features
- No data from test set used in training
- Feature engineering applied after split

### 2.3 Feature Engineering

**Feature Versioning:**
```typescript
interface FeatureDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  calculation: string;
  inputFeatures: string[];
  outputType: 'numeric' | 'categorical' | 'boolean';
  normalization?: 'none' | 'min_max' | 'standard' | 'log';
  missingValueHandling: 'drop' | 'mean' | 'median' | 'interpolate';
  createdAt: Date;
}
```

**Consistency Requirement:**
- Same feature engineering in training and serving
- Version features with code
- Document all transformations

---

## 3. Evaluation Framework

### 3.1 Evaluation Metrics by Task

**Classification:**
- Primary: AUC-ROC, F1-score
- Secondary: Precision, Recall, Accuracy
- Business: Conversion rate improvement, cost reduction

**Regression:**
- Primary: MAE, RMSE, MAPE
- Secondary: R², MAPE by segment
- Business: Forecast accuracy, cost savings

**Ranking:**
- Primary: NDCG, MAP
- Secondary: Precision@K, Recall@K
- Business: Recommendation quality

**Clustering:**
- Primary: Silhouette score, Davies-Bouldin index
- Secondary: Cluster stability
- Business: Segment quality, actionability

### 3.2 Baseline Comparison

**Baseline Types:**
- **Naive:** Always predict mean/mode
- **Simple:** Moving average, linear trend
- **Business rule:** Current heuristic approach
- **Previous model:** Last production version

**Comparison Requirements:**
```typescript
interface BaselineComparison {
  baselineModel: string;
  baselineMetrics: Record<string, number>;
  newModelMetrics: Record<string, number>;
  improvement: Record<string, number>;
  improvementPercentage: Record<string, number>;
  statisticallySignificant: boolean;
  pValue?: number;
}
```

**Minimum Improvement:**
- Statistical: p < 0.05
- Practical: > 5% improvement on primary metric
- Business: Demonstrable value

### 3.3 Validation Strategy

**Cross-Validation:**
- **K-fold:** For non-temporal data (k=5 or 10)
- **Time-series:** Expanding window or sliding window
- **Stratified:** For imbalanced classification

**Holdout Validation:**
- Separate test set not used in training
- Final evaluation on test set
- Report both validation and test metrics

**Calibration:**
- Probability predictions must be calibrated
- Use Platt scaling or isotonic regression
- Report calibration error

---

## 4. Bias and Fairness

### 4.1 Bias Detection

**Metrics:**
- **Demographic parity:** P(Y=1|A=0) = P(Y=1|A=1)
- **Equal opportunity:** TPR equal across groups
- **Predictive parity:** PPV equal across groups

**Protected Attributes:**
- Gender, age, ethnicity (where applicable)
- Geography, company size
- Industry, business type

**Testing:**
```typescript
interface FairnessMetrics {
  demographicParity: number;
  equalOpportunity: number;
  predictiveParity: number;
  disparateImpact: number;
  
  byGroup: Record<string, {
    positiveRate: number;
    truePositiveRate: number;
    falsePositiveRate: number;
  }>;
}
```

### 4.2 Mitigation Strategies

**Pre-processing:**
- Re-weighting samples
- Removing biased features
- Adding fairness constraints

**In-processing:**
- Adversarial debiasing
- Fairness constraints in loss function

**Post-processing:**
- Different thresholds per group
- Calibrated predictions

---

## 5. Approval Process

### 5.1 Review Checklist

**Technical Review:**
- [ ] Data quality sufficient
- [ ] Leakage prevented
- [ ] Baseline comparison done
- [ ] Metrics meet thresholds
- [ ] Calibration acceptable
- [ ] Bias within limits
- [ ] Latency acceptable

**Business Review:**
- [ ] Business problem addressed
- [ ] Success metrics defined
- [ ] ROI positive
- [ ] Stakeholder buy-in
- [ ] Integration plan ready

**Security Review:**
- [ ] Tenant isolation verified
- [ ] Authorization enforced
- [ ] Data privacy protected
- [ ] Audit trail complete

### 5.2 Approval Gates

**Gate 1: Experiment Approval**
- Problem definition reviewed
- Data assessment complete
- Approach approved

**Gate 2: Model Approval**
- Evaluation results reviewed
- Baseline comparison done
- Business value demonstrated

**Gate 3: Deployment Approval**
- All checks passed
- Monitoring ready
- Rollback plan defined
- Stakeholders notified

---

## 6. Documentation Requirements

### 6.1 Model Card

```typescript
interface ModelCard {
  // Overview
  name: string;
  version: string;
  description: string;
  intendedUse: string;
  limitations: string[];
  
  // Training
  trainingData: {
    source: string;
    size: number;
    dateRange: { start: Date; end: Date };
    preprocessing: string[];
  };
  algorithm: string;
  hyperparameters: Record<string, any>;
  
  // Evaluation
  metrics: Record<string, number>;
  validationMethod: string;
  baselineComparison: BaselineComparison;
  
  // Fairness
  fairnessMetrics?: FairnessMetrics;
  biasMitigation?: string[];
  
  // Deployment
  latency: number;
  resourceRequirements: any;
  monitoring: string[];
  
  // Governance
  owner: string;
  approvedBy: string;
  approvedAt: Date;
  expiresAt?: Date;
}
```

---

## 7. Acceptance Criteria

- [ ] All models have model cards
- [ ] Baseline comparisons documented
- [ ] Evaluation metrics appropriate for task
- [ ] Bias and fairness assessed
- [ ] Approval process followed
- [ ] Documentation complete
- [ ] Reproducibility verified

---

**Document Status:** Recorded  
**Owner:** ML Engineer / Data Scientist
