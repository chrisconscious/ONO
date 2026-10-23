# AI Task Routing and Reasoning Policy

**Document ID:** AI-9.2  
**Stage:** 9 — AI/ML, Inference Engine, Decision Intelligence, and Model Governance  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines how the ClickIT platform routes business questions and tasks to the appropriate intelligence mechanism. Not every problem requires AI, and not every AI task requires the same approach.

**Key Principle:** Use the simplest mechanism that reliably solves the problem.

---

## 2. Task Classification

### 2.1 Task Types

**Type 1: Deterministic Calculation**
- **Description:** Calculate a known metric using approved formula
- **Example:** "What was total revenue last month?"
- **Mechanism:** Analytics engine (Stage 8)
- **Confidence:** 100% (if data quality is sufficient)
- **When to Use:** Any question with a definitive, calculable answer

**Type 2: Rule-Based Decision**
- **Description:** Apply business rules to determine action or status
- **Example:** "Does this expense require approval?"
- **Mechanism:** Business rules engine
- **Confidence:** 100%
- **When to Use:** Compliance, validation, workflow transitions

**Type 3: Pattern Recognition**
- **Description:** Identify trends, anomalies, or patterns in data
- **Example:** "Why did sales decline this month?"
- **Mechanism:** Analytics + LLM explanation
- **Confidence:** High (if data quality sufficient)
- **When to Use:** Explaining observed phenomena

**Type 4: Prediction**
- **Description:** Forecast future outcomes based on historical patterns
- **Example:** "What will next quarter's revenue be?"
- **Mechanism:** ML model (if available and validated)
- **Confidence:** Variable (depends on model and data)
- **When to Use:** Future estimation with sufficient historical data

**Type 5: Recommendation**
- **Description:** Suggest actions to improve outcomes
- **Example:** "What should we do to improve cash flow?"
- **Mechanism:** Decision intelligence engine
- **Confidence:** Variable (depends on evidence quality)
- **When to Use:** Actionable guidance with evidence

**Type 6: Natural Language Query**
- **Description:** Answer questions using business knowledge
- **Example:** "What's our return policy?"
- **Mechanism:** RAG system or LLM
- **Confidence:** Variable (depends on knowledge base quality)
- **When to Use:** Questions about policies, procedures, general knowledge

**Type 7: Complex Analysis**
- **Description:** Multi-step analysis combining multiple data sources
- **Example:** "Which marketing campaigns are most effective?"
- **Mechanism:** Analytics + ML + LLM orchestration
- **Confidence:** Variable (depends on component quality)
- **When to Use:** Complex business questions requiring synthesis

### 2.2 Routing Decision Tree

```
User Question
    ↓
Is it a simple calculation?
    ├─→ YES → Analytics Engine (Type 1)
    └─→ NO ↓
    
Is it a rule-based decision?
    ├─→ YES → Rules Engine (Type 2)
    └─→ NO ↓
    
Does it require prediction?
    ├─→ YES → Is validated ML model available?
    │         ├─→ YES → ML Model (Type 4)
    │         └─→ NO → Explain limitation, suggest alternatives
    └─→ NO ↓
    
Does it require explanation or reasoning?
    ├─→ YES → Analytics + LLM (Type 3 or 7)
    └─→ NO ↓
    
Does it require business knowledge?
    ├─→ YES → RAG System (Type 6)
    └─→ NO ↓
    
Does it require recommendation?
    ├─→ YES → Decision Intelligence (Type 5)
    └─→ NO → Clarify question or explain limitation
```

---

## 3. Routing Rules

### 3.1 Priority Rules

**Rule 1: Deterministic Over Probabilistic**
- If a deterministic answer exists, use it
- Never use ML/LLM when simple calculation suffices
- Example: "What is total revenue?" → Analytics, not LLM

**Rule 2: Validated Models Only**
- Only use ML models that have passed evaluation criteria
- Never use experimental or unvalidated models in production
- Example: Use lead scoring model v2.1 (validated), not v3.0-beta

**Rule 3: Evidence Required**
- All AI outputs must cite verifiable evidence
- If evidence unavailable, abstain rather than guess
- Example: Cannot explain decline without data → Say "Insufficient data"

**Rule 4: Authorization First**
- Check permissions before any AI operation
- Never bypass authorization for convenience
- Example: User can't see financial data → Don't calculate financial metrics

**Rule 5: Tenant Isolation Absolute**
- Never mix data from different tenants
- All AI operations tenant-scoped
- Example: Tenant A's data never influences Tenant B's predictions

### 3.2 Fallback Rules

**Fallback 1: Model Unavailable**
- If ML model unavailable, provide deterministic alternative
- Example: Demand forecasting model down → Show historical average

**Fallback 2: Insufficient Data**
- If data quality < threshold, explain limitation
- Example: Data completeness 70% → "Insufficient data for reliable prediction"

**Fallback 3: Low Confidence**
- If prediction confidence < threshold, flag uncertainty
- Example: Confidence 60% → "Low confidence prediction, use with caution"

**Fallback 4: Permission Denied**
- If user lacks permission, explain what's needed
- Example: No finance permission → "You need finance access to view this metric"

---

## 4. Reasoning Policies

### 4.1 Explanation Generation

**Policy 1: Cite Sources**
- Every claim must reference specific data
- Include record IDs, timestamps, values
- Example: "Revenue declined 15% (Source: Invoices #123-#456, Jan 2026)"

**Policy 2: Distinguish Fact from Inference**
- Clearly label observed facts vs. predictions vs. assumptions
- Example: "Revenue declined 15% (fact). This may be due to seasonality (inference)."

**Policy 3: Quantify Uncertainty**
- Always provide confidence levels for predictions
- Explain what affects confidence
- Example: "Predicted revenue: $450K ± $50K (80% confidence)"

**Policy 4: Acknowledge Limitations**
- State what the analysis cannot determine
- Explain data gaps or methodological constraints
- Example: "Analysis excludes Q4 data due to incomplete records"

**Policy 5: Avoid Causation Claims**
- Correlation ≠ causation
- Use careful language for relationships
- Example: "Sales decline correlates with reduced marketing spend" (not "caused by")

### 4.2 Recommendation Generation

**Policy 1: Evidence-Based**
- Recommendations must be supported by data
- Cite specific evidence for each recommendation
- Example: "Increase marketing spend (Evidence: 20% higher conversion in Q3)"

**Policy 2: Feasible**
- Recommendations must be actionable
- Consider user's permissions and resources
- Example: Don't recommend actions user cannot perform

**Policy 3: Ranked**
- Prioritize recommendations by expected impact
- Explain ranking criteria
- Example: "Top recommendation: X (Expected impact: $50K, Confidence: 75%)"

**Policy 4: Risk-Aware**
- Identify risks and constraints
- Explain potential downsides
- Example: "Risk: May require additional staff (Cost: $20K)"

**Policy 5: Measurable**
- Define success metrics
- Suggest evaluation timeline
- Example: "Measure conversion rate over next 30 days"

---

## 5. Intent Classification

### 5.1 Classification Methods

**Method 1: Keyword Matching (Fast, Simple)**
- Use keywords to identify task type
- Example: "forecast", "predict" → Prediction task
- Accuracy: ~80% for clear questions
- Latency: < 10ms

**Method 2: Rule-Based Classification (Accurate, Limited)**
- Use pattern matching for common question types
- Example: "What is/was/will be [metric]?" → Calculation
- Accuracy: ~90% for known patterns
- Latency: < 50ms

**Method 3: ML Classification (Flexible, Requires Training)**
- Train classifier on labeled examples
- Example: BERT or similar model
- Accuracy: ~95% with sufficient training data
- Latency: 100-500ms

**Recommended Approach:** Hybrid
- Start with rule-based for common patterns
- Fall back to ML for ambiguous questions
- Use keyword matching for fast path

### 5.2 Intent Categories

**Category: CALCULATE**
- Keywords: what is, how much, total, sum, average, count
- Examples:
  - "What is total revenue?"
  - "How many leads this month?"
  - "Average deal size?"
- Action: Route to analytics engine

**Category: EXPLAIN**
- Keywords: why, explain, reason, cause, factor
- Examples:
  - "Why did sales decline?"
  - "Explain the revenue drop"
  - "What caused the stockout?"
- Action: Route to analytics + LLM

**Category: PREDICT**
- Keywords: forecast, predict, expect, will be, next
- Examples:
  - "What will revenue be next quarter?"
  - "Forecast demand for Product A"
  - "Predict lead conversion"
- Action: Route to ML model (if available)

**Category: RECOMMEND**
- Keywords: should, recommend, suggest, improve, optimize
- Examples:
  - "What should we do to improve cash flow?"
  - "Recommend actions to increase sales"
  - "How can we reduce costs?"
- Action: Route to decision intelligence

**Category: COMPARE**
- Keywords: compare, vs, versus, difference, better
- Examples:
  - "Compare Q1 vs Q2 performance"
  - "Which product sells better?"
  - "Difference between regions?"
- Action: Route to analytics + LLM

**Category: SUMMARIZE**
- Keywords: summarize, overview, brief, highlight
- Examples:
  - "Summarize this month's performance"
  - "Give me an overview of sales"
  - "Highlight key metrics"
- Action: Route to analytics + LLM

**Category: SEARCH**
- Keywords: find, show, list, get, retrieve
- Examples:
  - "Find overdue invoices"
  - "Show me top customers"
  - "List pending approvals"
- Action: Route to database query (with authorization)

---

## 6. Context Selection

### 6.1 Context Requirements by Task

**Calculation Tasks:**
- Required: Metric definition, date range, filters
- Optional: Dimensions for breakdown
- Example: Revenue calculation needs invoice data, date range

**Explanation Tasks:**
- Required: Metric data, time series, related metrics
- Optional: External factors, contextual information
- Example: Revenue decline explanation needs trend data, segment breakdown

**Prediction Tasks:**
- Required: Historical data, features, model version
- Optional: External indicators, seasonal factors
- Example: Demand forecast needs sales history, seasonality

**Recommendation Tasks:**
- Required: Current situation, business objectives, constraints
- Optional: Historical actions and outcomes, benchmarks
- Example: Cash flow recommendation needs current position, receivables, payables

### 6.2 Context Retrieval Strategy

**Strategy 1: Minimal Context**
- Retrieve only data needed for task
- Minimize token usage and latency
- Use for simple calculations

**Strategy 2: Comprehensive Context**
- Retrieve related data for richer analysis
- Include trends, comparisons, context
- Use for explanations and recommendations

**Strategy 3: Iterative Context**
- Start with minimal context
- Expand if initial analysis insufficient
- Use for complex questions

**Recommended:** Task-dependent
- Simple tasks: Minimal context
- Complex tasks: Comprehensive context
- Ambiguous tasks: Iterative context

---

## 7. Quality Gates

### 7.1 Pre-Execution Gates

**Gate 1: Authorization Check**
- Verify user has permission for requested operation
- Check tenant isolation
- Verify data scope
- Block if unauthorized

**Gate 2: Data Quality Check**
- Verify data completeness >= threshold
- Check data freshness
- Validate data consistency
- Flag if quality insufficient

**Gate 3: Model Availability Check**
- Verify required models are deployed
- Check model health status
- Validate model version
- Fallback if unavailable

**Gate 4: Resource Check**
- Verify sufficient compute resources
- Check rate limits
- Validate cost constraints
- Throttle if needed

### 7.2 Post-Execution Gates

**Gate 5: Output Validation**
- Verify output format correct
- Check for sensitive data leakage
- Validate citations present
- Reject if invalid

**Gate 6: Confidence Check**
- Verify confidence >= threshold
- Check uncertainty bounds reasonable
- Flag if low confidence
- Warn user if needed

**Gate 7: Fact-Check**
- Verify cited sources exist
- Check calculations correct
- Validate logical consistency
- Correct if errors found

---

## 8. Examples

### 8.1 Example 1: Simple Calculation

**Question:** "What was total revenue last month?"

**Routing:**
1. Intent: CALCULATE
2. Mechanism: Analytics engine
3. Context: Invoice data, last month, tenant scope
4. Execution: Calculate SUM(invoice.total) WHERE status='paid' AND month='last'
5. Output: { value: 425000, unit: 'USD', period: '2025-12' }

**Response:**
"Total revenue last month (December 2025) was $425,000."

### 8.2 Example 2: Explanation with LLM

**Question:** "Why did sales decline this month?"

**Routing:**
1. Intent: EXPLAIN
2. Mechanism: Analytics + LLM
3. Context: Sales data, trends, segments, products
4. Execution:
   - Calculate month-over-month change
   - Identify top contributors to decline
   - Generate explanation with LLM
5. Output: Insight with evidence and explanation

**Response:**
"Sales declined 15% this month compared to last month ($425K vs $500K).

Contributing factors:
- Enterprise segment down 23% (largest contributor)
- Product A sales down 30%
- Customer acquisition cost up 18%

Data quality: 98% complete, last updated 2 hours ago.

Note: This analysis identifies correlations, not causation. External factors like seasonality or market conditions may also contribute."

### 8.3 Example 3: Prediction with ML

**Question:** "What will next quarter's revenue be?"

**Routing:**
1. Intent: PREDICT
2. Mechanism: ML model (revenue_forecast_v2.1)
3. Context: Historical revenue, seasonality, pipeline
4. Execution:
   - Load model v2.1
   - Prepare features
   - Generate prediction with confidence interval
5. Output: Prediction with uncertainty

**Response:**
"Next quarter (Q1 2026) revenue is forecast to be $450,000 ± $50,000 (80% confidence).

Prediction details:
- Model: Revenue Forecast v2.1
- Training  24 months of historical data
- Key drivers: Seasonal patterns, current pipeline
- Confidence: Medium (75%)

Limitations:
- Does not account for new product launches
- Assumes historical patterns continue
- Accuracy decreases with forecast horizon"

### 8.4 Example 4: Recommendation

**Question:** "What should we do to improve cash flow?"

**Routing:**
1. Intent: RECOMMEND
2. Mechanism: Decision intelligence
3. Context: Cash position, receivables, payables, trends
4. Execution:
   - Analyze current cash position
   - Identify improvement opportunities
   - Generate recommendations with evidence
5. Output: Prioritized recommendations

**Response:**
"Based on your current cash position ($120K) and trends, here are recommended actions:

1. **Accelerate receivables collection** (Priority: High)
   - 15 invoices overdue by 30+ days ($85K total)
   - Expected impact: +$60K in 30 days
   - Confidence: High (85%)
   - Action: Send payment reminders

2. **Negotiate extended payment terms** (Priority: Medium)
   - Top 3 suppliers account for 40% of payables
   - Expected impact: +$30K cash retention
   - Confidence: Medium (70%)
   - Action: Contact suppliers

3. **Reduce discretionary spending** (Priority: Low)
   - Marketing spend 20% over budget
   - Expected impact: +$15K savings
   - Confidence: High (90%)
   - Action: Review marketing budget

Risks:
- Aggressive collection may strain customer relationships
- Supplier negotiations may not succeed

Success metrics:
- Measure cash position in 30 days
- Target: $180K+ (50% improvement)"

---

## 9. Acceptance Criteria

### 9.1 Routing Accuracy

- [ ] Intent classification accuracy > 90%
- [ ] Correct mechanism selected > 95% of time
- [ ] Fallbacks triggered appropriately
- [ ] No unauthorized operations executed

### 9.2 Reasoning Quality

- [ ] All outputs cite evidence
- [ ] Confidence levels accurate
- [ ] Limitations clearly stated
- [ ] No hallucinations or fabrications

### 9.3 Performance

- [ ] Routing latency < 100ms
- [ ] End-to-end latency < 5 seconds
- [ ] Resource utilization optimized
- [ ] Cost per request tracked

---

## 10. References

- Stage 2: AI/ML and Inference Architecture
- Stage 7: AI/ML Security and Data Boundaries
- Stage 8: BI Analytics Architecture Specification
- Industry standards: AI routing patterns, intent classification

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** AI Architect
