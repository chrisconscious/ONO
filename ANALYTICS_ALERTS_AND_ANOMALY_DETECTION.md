# Analytics Alerts and Anomaly Detection Specification

**Document ID:** BI-8.7  
**Stage:** 8 — Business Intelligence, Analytics, KPI Definitions, and Data Quality  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines alert and anomaly detection requirements for the ClickIT analytics platform. It specifies how users are notified of meaningful changes, threshold breaches, and unusual patterns in business data.

**Key Principles:**
- Alerts are actionable and timely
- Anomalies are detected statistically, not arbitrarily
- Clear distinction between threshold alerts and anomaly detection
- Configurable alert rules per user/role
- Comprehensive audit trail for all alerts
- Minimize false positives

---

## 2. Alert Types

### 2.1 Threshold Alerts

**Definition:** Alerts triggered when a metric crosses a predefined threshold

**Types:**
- **Absolute Threshold:** Metric value exceeds fixed value (e.g., revenue < $100K)
- **Percentage Threshold:** Metric changes by percentage (e.g., sales down 20%)
- **Trend Threshold:** Metric trend breaks pattern (e.g., 3 consecutive declines)
- **Comparison Threshold:** Metric vs. target/budget (e.g., actual < 90% of target)

**Configuration:**
```typescript
interface ThresholdAlert {
  id: string;
  name: string;
  metricId: string;
  
  // Threshold definition
  type: 'absolute' | 'percentage' | 'trend' | 'comparison';
  condition: {
    operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne';
    value: number;
    comparisonType?: 'target' | 'budget' | 'previous_period';
  };
  
  // Severity
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Recipients
  recipients: string[];              // User IDs or role names
  channels: ('email' | 'in_app' | 'sms' | 'slack')[];
  
  // Behavior
  frequency: 'immediate' | 'hourly' | 'daily';
  deduplicationWindow: number;       // Minutes
  requiresAcknowledgment: boolean;
  
  // Metadata
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  lastTriggeredAt?: Date;
  triggerCount: number;
}
```

**Example Threshold Alerts:**

**Alert 1: Low Cash Position**
```typescript
{
  id: 'alert-finance-001',
  name: 'Low Cash Position',
  metricId: 'kpi-finance-cash-001',
  type: 'absolute',
  condition: { operator: 'lt', value: 100000 },
  severity: 'critical',
  recipients: ['cfo', 'finance_manager'],
  channels: ['email', 'sms'],
  frequency: 'immediate',
  deduplicationWindow: 60,
  requiresAcknowledgment: true,
  isActive: true
}
```

**Alert 2: Sales Target Miss**
```typescript
{
  id: 'alert-sales-001',
  name: 'Sales Target Miss',
  metricId: 'kpi-sales-attainment-001',
  type: 'comparison',
  condition: { operator: 'lt', value: 90, comparisonType: 'target' },
  severity: 'high',
  recipients: ['sales_manager', 'sales_director'],
  channels: ['email', 'in_app'],
  frequency: 'daily',
  deduplicationWindow: 1440,
  requiresAcknowledgment: false,
  isActive: true
}
```

### 2.2 Anomaly Detection

**Definition:** Alerts triggered when data patterns deviate significantly from expected behavior

**Detection Methods:**

**Statistical Methods:**
- **Z-Score:** Detect values > 3 standard deviations from mean
- **Moving Average:** Detect deviations from rolling average
- **Percentile:** Detect values outside normal percentile range
- **Seasonal Decomposition:** Detect anomalies in seasonal patterns

**Machine Learning Methods:**
- **Isolation Forest:** Detect outliers in multi-dimensional data
- **Autoencoders:** Detect anomalies using reconstruction error
- **Time Series Models:** Detect anomalies in temporal patterns

**Configuration:**
```typescript
interface AnomalyDetectionRule {
  id: string;
  name: string;
  metricId: string;
  
  // Detection method
  method: 'z_score' | 'moving_average' | 'percentile' | 'isolation_forest' | 'autoencoder';
  parameters: {
    sensitivity: number;             // 0-100, higher = more sensitive
    windowSize?: number;             // For moving average
    standardDeviations?: number;     // For z-score
    percentile?: number;             // For percentile method
  };
  
  // Context
  baseline: {
    type: 'historical' | 'seasonal' | 'custom';
    period: number;                  // Days of historical data
    seasonalAdjustment: boolean;
  };
  
  // Severity
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Recipients
  recipients: string[];
  channels: ('email' | 'in_app' | 'slack')[];
  
  // Behavior
  minConfidence: number;             // 0-100, minimum confidence to alert
  deduplicationWindow: number;
  requiresAcknowledgment: boolean;
  
  // Metadata
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}
```

**Example Anomaly Detection:**

**Rule 1: Unusual Sales Spike**
```typescript
{
  id: 'anomaly-sales-001',
  name: 'Unusual Sales Spike',
  metricId: 'kpi-sales-revenue-001',
  method: 'z_score',
  parameters: {
    sensitivity: 80,
    standardDeviations: 3
  },
  baseline: {
    type: 'seasonal',
    period: 90,
    seasonalAdjustment: true
  },
  severity: 'medium',
  recipients: ['sales_manager'],
  channels: ['in_app'],
  minConfidence: 70,
  deduplicationWindow: 1440,
  requiresAcknowledgment: false,
  isActive: true
}
```

---

## 3. Alert Management

### 3.1 Alert Lifecycle

```
Alert Triggered
    ↓
Alert Created (status: 'new')
    ↓
Notification Sent
    ↓
Alert Acknowledged (status: 'acknowledged') [optional]
    ↓
Investigation Started (status: 'investigating')
    ↓
Resolution Applied (status: 'resolved')
    ↓
Alert Closed (status: 'closed')
```

**Alert States:**
- **New:** Alert just triggered, not yet viewed
- **Acknowledged:** Alert viewed, not yet investigated
- **Investigating:** Under investigation
- **Resolved:** Issue resolved, alert can be closed
- **Closed:** Alert resolved and closed
- **Suppressed:** Alert temporarily suppressed

### 3.2 Alert Deduplication

**Deduplication Rules:**
- Same metric + same condition = single alert
- Within deduplication window = no new alert
- Different severity = new alert
- Different metric = new alert

**Implementation:**
```typescript
async function shouldCreateAlert(alert: ThresholdAlert): Promise<boolean> {
  const recentAlert = await getRecentAlert(
    alert.metricId,
    alert.condition,
    alert.deduplicationWindow
  );
  
  if (recentAlert && recentAlert.severity === alert.severity) {
    return false; // Duplicate
  }
  
  return true;
}
```

### 3.3 Alert Suppression

**Suppression Rules:**
- Maintenance windows
- Known issues with workarounds
- Holiday periods
- User-requested suppression

**Suppression Configuration:**
```typescript
interface AlertSuppression {
  id: string;
  alertId?: string;                  // Specific alert or null for all
  metricId?: string;                 // Specific metric or null for all
  reason: string;
  suppressedBy: string;
  suppressedAt: Date;
  expiresAt: Date;
  isActive: boolean;
}
```

---

## 4. Alert Notification

### 4.1 Notification Channels

**Email:**
- Detailed alert information
- Links to dashboard and metric
- Action buttons (acknowledge, investigate)
- HTML and plain text versions

**In-App:**
- Real-time notification center
- Badge indicators
- Click-through to details
- Mark as read/unread

**SMS:**
- Critical alerts only
- Brief message with key information
- Link to full details
- Opt-in required

**Slack/Teams:**
- Integration with messaging platforms
- Rich message formatting
- Interactive buttons
- Threaded conversations

### 4.2 Notification Content

**Alert Notification Template:**
```
Subject: [CRITICAL] Low Cash Position - $85,000

Alert: Low Cash Position
Severity: Critical
Metric: Cash Position
Current Value: $85,000
Threshold: < $100,000
Triggered: Jan 29, 2026 2:30 PM

Description:
Cash position has fallen below the critical threshold of $100,000. 
Current cash position is $85,000, which is 15% below the threshold.

Actions:
[View Dashboard] [Acknowledge Alert] [Investigate]

This alert requires immediate acknowledgment.
```

---

## 5. Anomaly Detection Implementation

### 5.1 Detection Pipeline

```
Data Ingestion
    ↓
Data Validation
    ↓
Baseline Calculation
    ↓
Anomaly Detection
    ↓
Confidence Scoring
    ↓
Alert Generation
    ↓
Notification
```

### 5.2 Baseline Calculation

**Historical Baseline:**
```typescript
interface Baseline {
  metricId: string;
  period: number;                    // Days of history
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    min: number;
    max: number;
    percentiles: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
    };
  };
  seasonalPatterns?: {
    dayOfWeek: number[];
    monthOfYear: number[];
  };
  calculatedAt: Date;
  validUntil: Date;
}
```

**Seasonal Adjustment:**
- Detect day-of-week patterns
- Detect month-of-year patterns
- Detect holiday effects
- Adjust baseline accordingly

### 5.3 Anomaly Scoring

**Confidence Score:**
```typescript
function calculateAnomalyScore(
  value: number,
  baseline: Baseline,
  method: string
): number {
  switch (method) {
    case 'z_score':
      const zScore = Math.abs((value - baseline.statistics.mean) / baseline.statistics.standardDeviation);
      return Math.min(100, zScore * 20); // Convert to 0-100 scale
    
    case 'percentile':
      const percentile = calculatePercentile(value, baseline);
      return Math.abs(50 - percentile) * 2; // Distance from 50th percentile
    
    default:
      return 0;
  }
}
```

---

## 6. Alert Monitoring and Reporting

### 6.1 Alert Metrics

**Key Metrics:**
- Total alerts triggered (by severity)
- Alert acknowledgment rate
- Mean time to acknowledge (MTTA)
- Mean time to resolve (MTTR)
- False positive rate
- Alert suppression rate

**Alert Dashboard:**
- Active alerts by severity
- Alert trends over time
- Top alerting metrics
- Alert resolution status
- Alert performance metrics

### 6.2 Alert Reporting

**Daily Alert Summary:**
- Alerts triggered in last 24 hours
- Alerts by severity
- Alerts by metric
- Unacknowledged alerts
- Overdue alerts

**Weekly Alert Review:**
- Alert volume trends
- Alert resolution rates
- False positive analysis
- Alert rule effectiveness
- Recommendations for rule tuning

---

## 7. Acceptance Criteria

### 7.1 Threshold Alert Requirements

- [ ] Threshold alerts configurable per metric
- [ ] Multiple threshold types supported
- [ ] Alerts trigger immediately when threshold crossed
- [ ] Deduplication prevents alert spam
- [ ] Notifications sent via configured channels
- [ ] Alert lifecycle tracked (new → acknowledged → resolved)
- [ ] Alert audit trail complete

### 7.2 Anomaly Detection Requirements

- [ ] Multiple detection methods available
- [ ] Baseline calculated from historical data
- [ ] Seasonal patterns detected and adjusted
- [ ] Confidence scores calculated
- [ ] Anomalies trigger alerts when confidence > threshold
- [ ] False positive rate < 10%
- [ ] Detection performance monitored

### 7.3 Notification Requirements

- [ ] Email notifications functional
- [ ] In-app notifications real-time
- [ ] SMS notifications for critical alerts
- [ ] Slack/Teams integration working
- [ ] Notification content clear and actionable
- [ ] Users can configure notification preferences

---

## 8. References

- Stage 6: Business KPI and Outcome Catalog
- Stage 7: Audit Logging and Accountability Specification
- Industry standards: ITIL Incident Management

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** BI Architect / Operations Manager
