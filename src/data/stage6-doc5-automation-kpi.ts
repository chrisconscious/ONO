import { Document } from './types';

export const stage6Doc5: Document = {
  id: 'workflow-automation-specification',
  number: 5,
  title: 'Workflow Automation Specification',
  shortTitle: 'Automation Spec',
  description: 'Safe, configurable automation framework with risk levels, approval requirements, exception handling, and AI-assisted decision workflows.',
  stage: 6,
  status: 'Recorded',
  sections: [
    {
      id: '6.5.1',
      title: 'Automation Framework Overview',
      content: `**Purpose:**
Define a safe, configurable automation system that reduces manual work while maintaining control, auditability, and preventing unintended consequences.

**Core Principles:**
1. **Explicit Authorization:** All automation must be explicitly configured and approved
2. **Tenant Isolation:** Automation cannot cross tenant boundaries
3. **Audit Trail:** All automated actions fully logged
4. **Idempotency:** Duplicate triggers produce same result
5. **Failure Handling:** Clear error handling and recovery
6. **Human Oversight:** High-impact actions require approval
7. **No Infinite Loops:** Prevent recursive automation

**Automation Categories:**

**Low-Risk Automation (No Approval Required):**
- Notifications and reminders
- Status updates (non-financial)
- Data synchronization
- Report generation
- Task assignment (based on rules)

**Medium-Risk Automation (Manager Approval):**
- Lead assignment
- Order processing (standard)
- Inventory reorder (within limits)
- Invoice generation (from approved orders)
- Workflow routing

**High-Risk Automation (Director Approval):**
- Financial transactions
- Large purchases
- Contract modifications
- User permission changes
- Data exports

**Critical Automation (Executive Approval):**
- System-wide changes
- Bulk data modifications
- Integration changes
- Security policy changes`
    },
    {
      id: '6.5.2',
      title: 'Automation Rule Model',
      content: `**Automation Rule Structure:**

\`\`\`typescript
interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  
  // Trigger
  trigger: {
    type: 'event' | 'schedule' | 'webhook';
    event?: string;           // e.g., 'lead.created', 'invoice.paid'
    schedule?: string;        // Cron expression
    webhook?: string;         // Webhook URL
    conditions?: Condition[]; // Additional filters
  };
  
  // Actions
  actions: {
    type: AutomationActionType;
    config: Record<string, any>;
    order: number;            // Execution order
    onError: 'continue' | 'stop' | 'rollback';
  }[];
  
  // Safety
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  approvalPolicyId?: string;
  
  // Limits
  maxExecutionsPerDay?: number;
  maxExecutionsPerHour?: number;
  cooldownMinutes?: number;
  
  // Error handling
  retryPolicy: {
    maxRetries: number;
    retryDelayMinutes: number;
    backoffMultiplier: number;
  };
  
  // Audit
  logLevel: 'none' | 'minimal' | 'detailed';
  retainLogsDays: number;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  lastExecutedAt?: Date;
  executionCount: number;
  errorCount: number;
}

type AutomationActionType =
  | 'create_record'
  | 'update_record'
  | 'send_notification'
  | 'assign_user'
  | 'change_status'
  | 'create_task'
  | 'send_email'
  | 'call_webhook'
  | 'calculate_field'
  | 'approve_request';
\`\`\`

**Example Automation Rules:**

**Rule 1: Lead Assignment**
\`\`\`json
{
  "name": "Auto-assign leads by region",
  "trigger": {
    "type": "event",
    "event": "lead.created",
    "conditions": [
      { "field": "region", "operator": "is_not_null" }
    ]
  },
  "actions": [
    {
      "type": "assign_user",
      "config": {
        "assignmentRule": "region_based",
        "fallbackRole": "sales_manager"
      },
      "order": 1,
      "onError": "continue"
    },
    {
      "type": "send_notification",
      "config": {
        "template": "new_lead_assigned",
        "recipients": ["assignee"]
      },
      "order": 2,
      "onError": "continue"
    }
  ],
  "riskLevel": "low",
  "requiresApproval": false,
  "maxExecutionsPerHour": 100
}
\`\`\`

**Rule 2: Low Stock Alert**
\`\`\`json
{
  "name": "Alert on low stock",
  "trigger": {
    "type": "event",
    "event": "stock_level.changed",
    "conditions": [
      { "field": "quantity", "operator": "lte", "value": "reorder_point" }
    ]
  },
  "actions": [
    {
      "type": "send_notification",
      "config": {
        "template": "low_stock_alert",
        "recipients": ["inventory_manager", "purchasing_manager"]
      },
      "order": 1,
      "onError": "stop"
    },
    {
      "type": "create_task",
      "config": {
        "title": "Review low stock: {{product.name}}",
        "assignedTo": "purchasing_manager",
        "priority": "high",
        "dueInDays": 3
      },
      "order": 2,
      "onError": "continue"
    }
  ],
  "riskLevel": "low",
  "requiresApproval": false,
  "cooldownMinutes": 60
}
\`\`\`

**Rule 3: Invoice Generation**
\`\`\`json
{
  "name": "Auto-generate invoice on order completion",
  "trigger": {
    "type": "event",
    "event": "order.status_changed",
    "conditions": [
      { "field": "new_status", "operator": "eq", "value": "completed" }
    ]
  },
  "actions": [
    {
      "type": "create_record",
      "config": {
        "entity": "invoice",
        "data": {
          "customer_id": "{{order.customer_id}}",
          "order_id": "{{order.id}}",
          "amount": "{{order.total}}",
          "due_date": "{{order.completed_at + 30 days}}"
        }
      },
      "order": 1,
      "onError": "stop"
    },
    {
      "type": "send_notification",
      "config": {
        "template": "invoice_generated",
        "recipients": ["finance_team"]
      },
      "order": 2,
      "onError": "continue"
    }
  ],
  "riskLevel": "medium",
  "requiresApproval": true,
  "approvalPolicyId": "invoice_generation_approval"
}
\`\`\``
    },
    {
      id: '6.5.3',
      title: 'Exception Handling and Recovery',
      content: `**Purpose:**
Define comprehensive exception handling for all workflows to ensure data integrity, user experience, and system reliability.

**Exception Categories:**

**1. Data Validation Exceptions**
- Missing required fields
- Invalid data formats
- Constraint violations
- Duplicate records

**Handling:**
- Block operation
- Return specific error message
- Log validation failure
- No partial updates

**2. Authorization Exceptions**
- Insufficient permissions
- Tenant boundary violation
- Approval required but not granted
- Separation of duties violation

**Handling:**
- Block operation
- Return generic security error (no detail leakage)
- Log security event
- Alert on repeated attempts

**3. Business Rule Exceptions**
- Workflow transition violation
- Financial constraint breach
- Inventory shortage
- Budget exceeded

**Handling:**
- Block operation
- Return business rule error with context
- Log rule violation
- Suggest corrective action

**4. System Exceptions**
- Database connection failure
- External service timeout
- Memory/resource limits
- Unexpected errors

**Handling:**
- Retry with backoff (if idempotent)
- Return user-friendly error
- Log system error with stack trace
- Alert operations team
- Queue for retry (if applicable)

**5. Integration Exceptions**
- External API failure
- Data sync conflict
- Webhook delivery failure
- Authentication failure

**Handling:**
- Retry with exponential backoff
- Queue failed operations
- Notify integration owner
- Provide manual retry option
- Log integration error

**Recovery Strategies:**

**Strategy 1: Automatic Retry**
\`\`\`typescript
interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

async function executeWithRetry<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy
): Promise<T> {
  let attempt = 0;
  let delay = policy.initialDelayMs;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt >= policy.maxRetries) throw error;
      if (!isRetryable(error, policy)) throw error;
      
      await sleep(delay);
      delay = Math.min(delay * policy.backoffMultiplier, policy.maxDelayMs);
    }
  }
}
\`\`\`

**Strategy 2: Compensation (Rollback)**
\`\`\`typescript
interface CompensationStep {
  action: () => Promise<void>;
  description: string;
}

async function executeWithCompensation<T>(
  operation: () => Promise<T>,
  compensations: CompensationStep[]
): Promise<T> {
  const executed: CompensationStep[] = [];
  
  try {
    const result = await operation();
    return result;
  } catch (error) {
    // Execute compensations in reverse order
    for (const comp of executed.reverse()) {
      try {
        await comp.action();
      } catch (compError) {
        // Log compensation failure, continue with others
        log.error('Compensation failed', comp.description, compError);
      }
    }
    throw error;
  }
}
\`\`\`

**Strategy 3: Saga Pattern (Long-Running Transactions)**
\`\`\`typescript
interface SagaStep {
  execute: () => Promise<void>;
  compensate: () => Promise<void>;
  name: string;
}

class Saga {
  private steps: SagaStep[] = [];
  private executed: SagaStep[] = [];
  
  addStep(step: SagaStep): Saga {
    this.steps.push(step);
    return this;
  }
  
  async execute(): Promise<void> {
    try {
      for (const step of this.steps) {
        await step.execute();
        this.executed.push(step);
      }
    } catch (error) {
      // Compensate in reverse order
      for (const step of this.executed.reverse()) {
        try {
          await step.compensate();
        } catch (compError) {
          log.error('Saga compensation failed', step.name, compError);
          // Continue with other compensations
        }
      }
      throw error;
    }
  }
}
\`\`\`

**Strategy 4: Dead Letter Queue**
\`\`\`typescript
interface DeadLetterMessage {
  id: string;
  originalMessage: any;
  error: string;
  failedAt: Date;
  retryCount: number;
  maxRetries: number;
}

class DeadLetterQueue {
  async add(message: any, error: Error): Promise<void> {
    const deadLetter: DeadLetterMessage = {
      id: generateId(),
      originalMessage: message,
      error: error.message,
      failedAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    };
    
    await this.repository.save(deadLetter);
    await this.notifyOperations(deadLetter);
  }
  
  async retry(id: string): Promise<void> {
    const deadLetter = await this.repository.findById(id);
    if (!deadLetter) throw new Error('Dead letter not found');
    
    try {
      await this.processMessage(deadLetter.originalMessage);
      await this.repository.delete(id);
    } catch (error) {
      deadLetter.retryCount++;
      if (deadLetter.retryCount >= deadLetter.maxRetries) {
        await this.repository.markAsPermanentFailure(id);
      } else {
        await this.repository.update(deadLetter);
      }
    }
  }
}
\`\`\`

**Exception Handling by Workflow Type:**

**Financial Workflows:**
- Strict validation (no partial updates)
- Compensation for multi-step operations
- Audit trail for all exceptions
- Manual intervention required for resolution

**Inventory Workflows:**
- Idempotent operations (safe to retry)
- Automatic retry for transient failures
- Dead letter queue for permanent failures
- Manual reconciliation for discrepancies

**Customer-Facing Workflows:**
- User-friendly error messages
- Automatic retry where safe
- Notification on failure
- Manual fallback option

**Integration Workflows:**
- Exponential backoff retry
- Circuit breaker for repeated failures
- Dead letter queue
- Manual retry interface`
    },
    {
      id: '6.5.4',
      title: 'AI-Assisted Decision Workflows',
      content: `**Purpose:**
Define how AI and ML capabilities participate in business workflows while maintaining human oversight, evidence-based reasoning, and clear distinction between facts and predictions.

**Core Principles:**
1. **Evidence-Based:** All AI recommendations must cite supporting data
2. **Uncertainty Disclosure:** Confidence levels and limitations clearly stated
3. **Human Approval:** Material decisions require human approval
4. **No Fabrication:** AI cannot invent data or evidence
5. **Audit Trail:** All AI interactions logged with full context
6. **Tenant Isolation:** AI models and data tenant-specific
7. **Graceful Degradation:** System functions without AI if needed

**AI Participation Levels:**

**Level 1: Informational (No Approval Required)**
- Data summaries and insights
- Trend analysis
- Pattern detection
- Anomaly alerts

**Example:**
\`\`\`
AI Insight: "Sales in Q3 are 15% higher than Q2, primarily driven by Product A"
Evidence: Sales data from Q2 and Q3
Confidence: High (based on complete data)
Action: None (informational only)
\`\`\`

**Level 2: Suggestive (Manager Approval for Action)**
- Recommendations with clear actions
- Predictions with confidence intervals
- Optimization suggestions

**Example:**
\`\`\`
AI Recommendation: "Increase marketing spend for Product A by 20%"
Evidence: Q3 sales trends, customer acquisition cost analysis
Confidence: Medium (70% confidence interval)
Predicted Impact: 10-15% increase in sales
Required Approval: Marketing Manager
\`\`\`

**Level 3: Automated with Oversight (Pre-Approved Actions)**
- Routine decisions within approved parameters
- High-confidence predictions
- Low-risk actions

**Example:**
\`\`\`
AI Action: "Auto-assign lead to Sales Rep based on region and expertise"
Evidence: Lead region, rep territory, historical conversion rates
Confidence: High (90% match)
Risk Level: Low
Approval: Pre-approved by Sales Manager
\`\`\`

**Level 4: Autonomous (Executive Approval for Policy)**
- Fully automated decisions
- High-volume, low-risk operations
- Requires executive policy approval

**Example:**
\`\`\`
AI Policy: "Auto-reorder inventory when stock < reorder point"
Evidence: Historical demand, lead times, stock levels
Confidence: High
Risk Level: Low (within budget limits)
Approval: Executive approval for policy, not individual actions
\`\`\`

**AI Decision Workflow:**

**Step 1: Signal Detection**
- Identify business signal requiring analysis
- Validate data availability and quality
- Check tenant authorization

**Step 2: Context Retrieval**
- Gather relevant data (within authorization)
- Validate data freshness
- Check for missing information

**Step 3: Analysis**
- Apply appropriate analytical method:
  * Descriptive: What happened?
  * Diagnostic: Why did it happen?
  * Predictive: What might happen?
  * Prescriptive: What should we do?
- Calculate confidence levels
- Identify limitations

**Step 4: Recommendation Generation**
- Generate actionable recommendations
- Cite supporting evidence
- State assumptions and limitations
- Estimate potential impact (if defensible)

**Step 5: Approval Routing**
- Determine approval level based on:
  * Risk level
  * Financial impact
  * Confidence level
  * Policy requirements
- Route to appropriate approver

**Step 6: Execution**
- Upon approval, execute action
- Log execution with full context
- Monitor for issues

**Step 7: Outcome Measurement**
- Track actual outcomes
- Compare to predictions
- Calculate accuracy
- Feed back into model improvement

**AI Safety Controls:**

**Control 1: Data Authorization**
\`\`\`typescript
async function getAIContext(
  requestId: string,
  userId: string,
  tenantId: string,
  requiredData: string[]
): Promise<AIContext> {
  // Check user permissions for each data type
  for (const dataType of requiredData) {
    if (!await hasPermission(userId, 'read', dataType, tenantId)) {
      throw new AuthorizationError('Insufficient permissions for AI context');
    }
  }
  
  // Retrieve authorized data only
  const context = await retrieveAuthorizedData(tenantId, requiredData);
  
  // Log context retrieval
  await audit.log({
    event: 'ai.context_retrieved',
    requestId,
    userId,
    tenantId,
    dataTypes: requiredData
  });
  
  return context;
}
\`\`\`

**Control 2: Action Authorization**
\`\`\`typescript
async function executeAIAction(
  action: AIAction,
  userId: string,
  tenantId: string
): Promise<void> {
  // Check if action requires approval
  if (action.requiresApproval) {
    const approval = await requestApproval(action, userId);
    if (approval.status !== 'approved') {
      throw new ApprovalRequiredError('AI action requires approval');
    }
  }
  
  // Validate action is within tenant scope
  if (action.tenantId !== tenantId) {
    throw new TenantIsolationError('AI action violates tenant boundary');
  }
  
  // Execute action
  await executeAction(action);
  
  // Log execution
  await audit.log({
    event: 'ai.action_executed',
    action: action.type,
    userId,
    tenantId,
    confidence: action.confidence
  });
}
\`\`\`

**Control 3: Confidence Thresholds**
\`\`\`typescript
const CONFIDENCE_THRESHOLDS = {
  informational: 0.5,      // 50% confidence for insights
  recommendation: 0.7,     // 70% confidence for recommendations
  automated_low: 0.85,     // 85% confidence for low-risk automation
  automated_medium: 0.95,  // 95% confidence for medium-risk
  autonomous: 0.99         // 99% confidence for autonomous
};

function validateConfidence(
  confidence: number,
  level: keyof typeof CONFIDENCE_THRESHOLDS
): boolean {
  return confidence >= CONFIDENCE_THRESHOLDS[level];
}
\`\`\`

**AI Failure Handling:**

**Scenario 1: Insufficient Data**
- AI cannot generate reliable insight
- Return: "Insufficient data for analysis"
- Suggest: What data is needed
- No action taken

**Scenario 2: Low Confidence**
- AI prediction below threshold
- Return: "Low confidence prediction"
- Show: Confidence level and limitations
- Require: Manual review

**Scenario 3: Model Failure**
- ML model error or timeout
- Return: "AI service unavailable"
- Fallback: Manual process
- Alert: Operations team

**Scenario 4: Conflicting Recommendations**
- Multiple AI recommendations conflict
- Return: All recommendations with evidence
- Require: Human judgment
- Log: Conflict for analysis

**Audit and Monitoring:**

**Audit Trail:**
- All AI requests logged
- Context retrieval logged
- Recommendations logged with evidence
- Approvals logged
- Executions logged
- Outcomes logged

**Monitoring Metrics:**
- AI usage by module
- Confidence distributions
- Approval rates
- Prediction accuracy
- Outcome tracking
- Error rates`
    }
  ]
};

export const stage6Doc6: Document = {
  id: 'business-kpi-catalog',
  number: 6,
  title: 'Business KPI and Outcome Catalog',
  shortTitle: 'KPI Catalog',
  description: 'Comprehensive catalog of business KPIs for financial, sales, marketing, and operational performance measurement.',
  stage: 6,
  status: 'Recorded',
  sections: [
    {
      id: '6.6.1',
      title: 'KPI Framework Overview',
      content: `**Purpose:**
Define a comprehensive catalog of business KPIs that measure operational effectiveness, financial performance, customer satisfaction, and strategic progress.

**KPI Categories:**
1. **Financial KPIs:** Revenue, profitability, cash flow
2. **Sales KPIs:** Pipeline, conversion, cycle time
3. **Marketing KPIs:** Acquisition, conversion, ROI
4. **Operational KPIs:** Efficiency, quality, delivery
5. **Customer KPIs:** Satisfaction, retention, lifetime value
6. **Employee KPIs:** Productivity, engagement, retention

**KPI Definition Template:**

\`\`\`typescript
interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  category: KPICategory;
  
  // Calculation
  formula: string;              // Human-readable formula
  calculation: {
    numerator?: string;         // For ratio KPIs
    denominator?: string;
    source?: string;            // For simple KPIs
    aggregation: 'sum' | 'count' | 'average' | 'min' | 'max' | 'ratio';
  };
  
  // Data sources
  dataSources: string[];        // Module names
  requiredFields: string[];     // Entity fields
  
  // Measurement
  unit: string;                 // $, %, days, count, etc.
  targetDirection: 'higher_is_better' | 'lower_is_better' | 'target_range';
  targetValue?: number;
  targetRange?: { min: number; max: number };
  
  // Reporting
  reportingPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  rollingPeriod?: number;       // e.g., 30 days, 90 days
  
  // Context
  industryRelevance: string[];  // Industry codes
  moduleRelevance: string[];    // Module names
  
  // Limitations
  limitations: string[];
  assumptions: string[];
  
  // Metadata
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  lastReviewedAt?: Date;
}
\`\`\`

**KPI Selection Principles:**
1. **Relevance:** KPI must measure something important to the business
2. **Actionable:** KPI should inform decisions
3. **Measurable:** Data must be available and reliable
4. **Timely:** KPI should be available when needed
5. **Understandable:** Clear definition and interpretation
6. **Comparable:** Can be compared over time or across segments`
    },
    {
      id: '6.6.2',
      title: 'Financial KPIs',
      content: `**KPI-FIN-001: Total Revenue**
- **Formula:** SUM(Invoice.total) WHERE status = 'paid'
- **Period:** Monthly, Quarterly, Annual
- **Unit:** Currency ($)
- **Direction:** Higher is better
- **Data Sources:** Finance (Invoice, Payment)
- **Limitations:** Recognized revenue may differ from cash received
- **Industry Relevance:** All industries

**KPI-FIN-002: Gross Profit Margin**
- **Formula:** (Revenue - COGS) / Revenue * 100
- **Period:** Monthly, Quarterly
- **Unit:** Percentage (%)
- **Direction:** Higher is better
- **Data Sources:** Finance (Invoice, InvoiceLine), Inventory (Product cost)
- **Limitations:** Requires accurate cost data
- **Industry Relevance:** Manufacturing, Retail, Services

**KPI-FIN-003: Operating Expense Ratio**
- **Formula:** Operating Expenses / Revenue * 100
- **Period:** Monthly, Quarterly
- **Unit:** Percentage (%)
- **Direction:** Lower is better
- **Data Sources:** Finance (Expense, Invoice)
- **Limitations:** Expense categorization must be consistent
- **Industry Relevance:** All industries

**KPI-FIN-004: Days Sales Outstanding (DSO)**
- **Formula:** (Accounts Receivable / Total Credit Sales) * Number of Days
- **Period:** Monthly
- **Unit:** Days
- **Direction:** Lower is better
- **Data Sources:** Finance (Invoice, Payment)
- **Limitations:** Assumes consistent sales pattern
- **Industry Relevance:** B2B, Services

**KPI-FIN-005: Cash Flow from Operations**
- **Formula:** Cash Inflows - Cash Outflows (operating activities)
- **Period:** Monthly, Quarterly
- **Unit:** Currency ($)
- **Direction:** Higher is better
- **Data Sources:** Finance (Payment, Expense)
- **Limitations:** Timing differences may affect accuracy
- **Industry Relevance:** All industries

**KPI-FIN-006: Budget Variance**
- **Formula:** (Actual - Budget) / Budget * 100
- **Period:** Monthly, Quarterly
- **Unit:** Percentage (%)
- **Direction:** Target range (typically -5% to +5%)
- **Data Sources:** Finance (Budget, Actual transactions)
- **Limitations:** Budget must be realistic and updated
- **Industry Relevance:** All industries`
    },
    {
      id: '6.6.3',
      title: 'Sales KPIs',
      content: `**KPI-SALES-001: Pipeline Value**
- **Formula:** SUM(Opportunity.value) WHERE status IN ('prospecting', 'qualification', 'proposal', 'negotiation')
- **Period:** Real-time, Weekly
- **Unit:** Currency ($)
- **Direction:** Higher is better
- **Data Sources:** Sales (Opportunity)
- **Limitations:** Includes deals that may not close
- **Industry Relevance:** All B2B industries

**KPI-SALES-002: Win Rate**
- **Formula:** (Closed Won Opportunities / Total Closed Opportunities) * 100
- **Period:** Monthly, Quarterly
- **Unit:** Percentage (%)
- **Direction:** Higher is better
- **Data Sources:** Sales (Opportunity)
- **Limitations:** May vary by deal size and complexity
- **Industry Relevance:** All sales-driven industries

**KPI-SALES-003: Average Deal Size**
- **Formula:** SUM(Opportunity.value) / COUNT(Opportunity) WHERE status = 'closed_won'
- **Period:** Monthly, Quarterly
- **Unit:** Currency ($)
- **Direction:** Higher is better (context-dependent)
- **Data Sources:** Sales (Opportunity)
- **Limitations:** May be skewed by outliers
- **Industry Relevance:** All sales-driven industries

**KPI-SALES-004: Sales Cycle Length**
- **Formula:** AVG(DATEDIFF(days, Opportunity.created_at, Opportunity.closed_at)) WHERE status = 'closed_won'
- **Period:** Monthly, Quarterly
- **Unit:** Days
- **Direction:** Lower is better
- **Data Sources:** Sales (Opportunity)
- **Limitations:** Excludes lost opportunities
- **Industry Relevance:** All sales-driven industries

**KPI-SALES-005: Lead Conversion Rate**
- **Formula:** (Converted Leads / Total Leads) * 100
- **Period:** Monthly, Quarterly
- **Unit:** Percentage (%)
- **Direction:** Higher is better
- **Data Sources:** CRM (Lead)
- **Limitations:** Time lag between lead creation and conversion
- **Industry Relevance:** All industries with lead generation

**KPI-SALES-006: Quota Attainment**
- **Formula:** (Actual Sales / Quota) * 100
- **Period:** Monthly, Quarterly, Annual
- **Unit:** Percentage (%)
- **Direction:** Higher is better (target: 100%)
- **Data Sources:** Sales (Opportunity, Quota)
- **Limitations:** Quota must be realistic
- **Industry Relevance:** Sales organizations`
    },
    {
      id: '6.6.4',
      title: 'Marketing KPIs',
      content: `**KPI-MKT-001: Customer Acquisition Cost (CAC)**
- **Formula:** Total Marketing Spend / Number of New Customers
- **Period:** Monthly, Quarterly
- **Unit:** Currency ($)
- **Direction:** Lower is better
- **Data Sources:** Marketing (Campaign, CampaignBudget), CRM (Lead, Contact)
- **Limitations:** Requires accurate spend tracking and customer attribution
- **Industry Relevance:** All industries with marketing

**KPI-MKT-002: Marketing ROI**
- **Formula:** (Revenue from Marketing - Marketing Spend) / Marketing Spend * 100
- **Period:** Quarterly, Annual
- **Unit:** Percentage (%)
- **Direction:** Higher is better
- **Data Sources:** Marketing (Campaign), Finance (Invoice), CRM (Lead attribution)
- **Limitations:** Attribution may be incomplete or delayed
- **Industry Relevance:** All industries with marketing

**KPI-MKT-003: Lead-to-Customer Conversion Rate**
- **Formula:** (New Customers / Total Leads) * 100
- **Period:** Monthly, Quarterly
- **Unit:** Percentage (%)
- **Direction:** Higher is better
- **Data Sources:** Marketing (Campaign), CRM (Lead, Contact)
- **Limitations:** Time lag between lead and conversion
- **Industry Relevance:** All industries

**KPI-MKT-004: Campaign Performance Score**
- **Formula:** Weighted average of leads generated, conversion rate, and ROI
- **Period:** Per campaign
- **Unit:** Score (0-100)
- **Direction:** Higher is better
- **Data Sources:** Marketing (Campaign, CampaignPerformance)
- **Limitations:** Requires defined weighting and benchmarks
- **Industry Relevance:** All industries with campaigns

**KPI-MKT-005: Channel Effectiveness**
- **Formula:** Conversion rate by channel
- **Period:** Monthly, Quarterly
- **Unit:** Percentage (%)
- **Direction:** Higher is better
- **Data Sources:** Marketing (Campaign, CampaignChannel), CRM (Lead source)
- **Limitations:** Channel attribution may be complex
- **Industry Relevance:** All industries with multi-channel marketing`
    },
    {
      id: '6.6.5',
      title: 'Operational KPIs',
      content: `**KPI-OPS-001: On-Time Delivery Rate**
- **Formula:** (On-Time Deliveries / Total Deliveries) * 100
- **Period:** Monthly, Quarterly
- **Unit:** Percentage (%)
- **Direction:** Higher is better
- **Data Sources:** Operations (Order, Delivery), Inventory (StockMovement)
- **Limitations:** Requires accurate delivery date tracking
- **Industry Relevance:** Manufacturing, Retail, Logistics

**KPI-OPS-002: Inventory Turnover**
- **Formula:** COGS / Average Inventory Value
- **Period:** Quarterly, Annual
- **Unit:** Times per period
- **Direction:** Higher is better (context-dependent)
- **Data Sources:** Finance (InvoiceLine), Inventory (StockLevel, Product)
- **Limitations:** Seasonal variations may affect interpretation
- **Industry Relevance:** Retail, Manufacturing, Distribution

**KPI-OPS-003: Order Fulfillment Cycle Time**
- **Formula:** AVG(DATEDIFF(hours, Order.created_at, Order.delivered_at))
- **Period:** Monthly
- **Unit:** Hours
- **Direction:** Lower is better
- **Data Sources:** Sales (Order), Operations (Delivery)
- **Limitations:** Excludes orders still in progress
- **Industry Relevance:** E-commerce, Manufacturing, Distribution

**KPI-OPS-004: Defect Rate**
- **Formula:** (Defective Units / Total Units Produced) * 100
- **Period:** Monthly
- **Unit:** Percentage (%)
- **Direction:** Lower is better
- **Data Sources:** Operations (Production, QualityInspection)
- **Limitations:** Requires quality inspection data
- **Industry Relevance:** Manufacturing

**KPI-OPS-005: Resource Utilization**
- **Formula:** (Billable Hours / Available Hours) * 100
- **Period:** Monthly
- **Unit:** Percentage (%)
- **Direction:** Target range (typically 70-85%)
- **Data Sources:** Projects (TimeEntry, Task), HR (Employee)
- **Limitations:** May not account for non-billable strategic work
- **Industry Relevance:** Professional services, Consulting

**KPI-OPS-006: Stockout Rate**
- **Formula:** (Stockout Incidents / Total SKU-Days) * 100
- **Period:** Monthly
- **Unit:** Percentage (%)
- **Direction:** Lower is better
- **Data Sources:** Inventory (StockLevel, StockMovement)
- **Limitations:** May not capture partial stockouts
- **Industry Relevance:** Retail, Manufacturing, Distribution`
    }
  ]
};
