import { Document } from './types';

export const stage6Doc4: Document = {
  id: 'approval-delegation-framework',
  number: 4,
  title: 'Approval and Delegation Framework',
  shortTitle: 'Approval Framework',
  description: 'Configurable approval system with delegation, escalation, expiration, and separation of duties enforcement.',
  stage: 6,
  status: 'Recorded',
  sections: [
    {
      id: '6.4.1',
      title: 'Approval Framework Overview',
      content: `**Purpose:**
Define a configurable, auditable approval system that enforces separation of duties, prevents unauthorized actions, and maintains complete audit trails.

**Core Principles:**
1. **Configurable Thresholds:** Approval requirements based on value, risk, or policy
2. **Separation of Duties:** Approvers cannot approve their own submissions
3. **Delegation Support:** Temporary approval authority during absence
4. **Escalation Paths:** Automatic escalation for overdue approvals
5. **Complete Audit Trail:** Every approval decision recorded with context
6. **Multi-Level Approvals:** Support for sequential or parallel approval chains

**Approval Types:**
- Financial approvals (expenses, payments, discounts)
- Procurement approvals (purchase requests, purchase orders)
- Contract approvals (terms, commitments)
- Data access approvals (sensitive data, exports)
- Workflow approvals (status changes, exceptions)
- AI action approvals (automated actions with material impact)

**Approval States:**
- Pending: Awaiting approver action
- Approved: Authorized to proceed
- Rejected: Denied with reason
- Delegated: Transferred to another approver
- Escalated: Moved to higher authority
- Expired: Not actioned within time limit`
    },
    {
      id: '6.4.2',
      title: 'Approval Configuration Model',
      content: `**Approval Policy Structure:**

\`\`\`typescript
interface ApprovalPolicy {
  id: string;
  name: string;
  description: string;
  entityType: string;           // e.g., 'Expense', 'PurchaseOrder'
  action: string;               // e.g., 'create', 'approve', 'delete'
  
  // Trigger conditions
  conditions: {
    field: string;              // e.g., 'amount', 'risk_level'
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'in';
    value: any;
  }[];
  
  // Approval chain
  approvalChain: {
    level: number;
    approverType: 'role' | 'user' | 'manager' | 'department_head';
    approverValue: string;      // role name, user id, or 'manager'
    parallel: boolean;          // true = parallel with same level
    required: boolean;          // false = optional approver
  }[];
  
  // Delegation rules
  delegation: {
    allowed: boolean;
    maxLevels: number;          // how many levels can delegate
    requireNotification: boolean;
  };
  
  // Escalation rules
  escalation: {
    enabled: boolean;
    timeoutHours: number;
    escalateTo: 'next_level' | 'specific_user' | 'role';
    escalateToValue?: string;
  };
  
  // Expiration
  expiration: {
    enabled: boolean;
    timeoutHours: number;
    actionOnExpiry: 'reject' | 'escalate' | 'notify';
  };
  
  // Notifications
  notifications: {
    onRequest: boolean;
    onApproval: boolean;
    onRejection: boolean;
    onDelegation: boolean;
    onEscalation: boolean;
  };
  
  isActive: boolean;
  priority: number;             // for multiple matching policies
}
\`\`\`

**Example Policies:**

**Policy 1: Expense Approval**
\`\`\`json
{
  "name": "Expense Approval Policy",
  "entityType": "Expense",
  "action": "create",
  "conditions": [
    { "field": "amount", "operator": "gt", "value": 100 }
  ],
  "approvalChain": [
    {
      "level": 1,
      "approverType": "manager",
      "approverValue": "manager",
      "parallel": false,
      "required": true
    },
    {
      "level": 2,
      "approverType": "role",
      "approverValue": "finance_manager",
      "parallel": false,
      "required": true
    }
  ],
  "delegation": {
    "allowed": true,
    "maxLevels": 1,
    "requireNotification": true
  },
  "escalation": {
    "enabled": true,
    "timeoutHours": 48,
    "escalateTo": "next_level"
  }
}
\`\`\`

**Policy 2: Purchase Order Approval**
\`\`\`json
{
  "name": "Purchase Order Approval Policy",
  "entityType": "PurchaseOrder",
  "action": "create",
  "conditions": [
    { "field": "total_amount", "operator": "gt", "value": 1000 }
  ],
  "approvalChain": [
    {
      "level": 1,
      "approverType": "department_head",
      "approverValue": "department_head",
      "parallel": false,
      "required": true
    },
    {
      "level": 2,
      "approverType": "role",
      "approverValue": "procurement_manager",
      "parallel": false,
      "required": true
    },
    {
      "level": 3,
      "approverType": "role",
      "approverValue": "finance_director",
      "parallel": false,
      "required": true
    }
  ],
  "delegation": {
    "allowed": true,
    "maxLevels": 2,
    "requireNotification": true
  },
  "escalation": {
    "enabled": true,
    "timeoutHours": 72,
    "escalateTo": "next_level"
  }
}
\`\`\``
    },
    {
      id: '6.4.3',
      title: 'Delegation Framework',
      content: `**Purpose:**
Allow temporary transfer of approval authority when approvers are unavailable (vacation, illness, travel).

**Delegation Model:**

\`\`\`typescript
interface Delegation {
  id: string;
  delegatorId: string;          // Original approver
  delegateId: string;           // Temporary approver
  entityType: string;           // What can be approved
  action: string;               // What action can be approved
  
  // Time period
  startDate: Date;
  endDate: Date;
  
  // Scope
  scope: 'all' | 'specific';    // All pending or specific types
  specificTypes?: string[];     // If scope = 'specific'
  
  // Limits
  maxValue?: number;            // Maximum value delegate can approve
  maxCount?: number;            // Maximum number of approvals
  
  // Notifications
  notifyDelegator: boolean;     // Notify when delegate acts
  notifyDelegate: boolean;      // Notify delegate of new requests
  
  // Status
  status: 'active' | 'expired' | 'revoked';
  
  // Audit
  createdAt: Date;
  createdBy: string;
  revokedAt?: Date;
  revokedBy?: string;
  revokeReason?: string;
}
\`\`\`

**Delegation Rules:**

1. **Eligibility:**
   - User must have approval permission for the entity type
   - Delegate must have at least equivalent permissions
   - Cannot delegate to self
   - Cannot delegate if already delegating (no chains)

2. **Time Limits:**
   - Maximum delegation period: 30 days (configurable)
   - Auto-expiration at end date
   - Early revocation allowed by delegator

3. **Scope Limits:**
   - Can delegate all approval types or specific types
   - Can set maximum value limits
   - Can set maximum count limits

4. **Notifications:**
   - Delegate notified of new approval requests
   - Delegator notified of delegate actions (optional)
   - Both notified of delegation start/end

5. **Audit Trail:**
   - All delegations logged
   - All delegated approvals logged with both delegator and delegate
   - Revocations logged with reason

**Delegation Workflow:**

1. **Create Delegation:**
   - Approver selects delegate
   - Set time period
   - Set scope and limits
   - Submit for activation

2. **Activate Delegation:**
   - System validates delegate permissions
   - Activation logged
   - Notifications sent

3. **During Delegation:**
   - New approval requests routed to delegate
   - Delegate can approve/reject/escalate
   - Actions logged with both users

4. **End Delegation:**
   - Auto-expire at end date OR
   - Manual revocation by delegator
   - Pending requests return to delegator
   - Deactivation logged

**Example Scenario:**

Manager Alice goes on vacation for 2 weeks:
1. Alice creates delegation to Bob (her backup)
2. Period: 2024-01-15 to 2024-01-29
3. Scope: All expense approvals up to $10,000
4. During vacation:
   - Expense requests route to Bob
   - Bob approves/rejects as needed
   - Alice notified of Bob's actions
5. After vacation:
   - Delegation auto-expires
   - New requests return to Alice
   - Bob's actions remain in audit trail`
    },
    {
      id: '6.4.4',
      title: 'Escalation and Expiration',
      content: `**Escalation Framework:**

**Purpose:**
Ensure approval requests are actioned in timely manner and do not stall due to approver unavailability.

**Escalation Triggers:**
1. **Timeout:** Approval not actioned within configured time
2. **Delegation Failure:** Delegate also unavailable
3. **Conflict of Interest:** Approver cannot approve (self-approval attempt)
4. **Policy Violation:** Approval would violate policy

**Escalation Paths:**

\`\`\`typescript
interface EscalationRule {
  id: string;
  policyId: string;
  
  // Trigger
  timeoutHours: number;
  
  // Escalation target
  target: {
    type: 'next_level' | 'specific_user' | 'role' | 'manager_of_approver';
    value?: string;             // user id or role name
  };
  
  // Actions
  actions: {
    notifyOriginalApprover: boolean;
    notifyEscalationTarget: boolean;
    notifyRequestor: boolean;
    autoApprove: boolean;       // Rare, for low-risk items
    autoReject: boolean;        // Rare, for expired requests
  };
  
  // Limits
  maxEscalations: number;       // Prevent infinite escalation
  cooldownHours: number;        // Time between escalations
}
\`\`\`

**Escalation Workflow:**

1. **Detection:**
   - Background job checks pending approvals
   - Identifies requests past timeout
   - Validates escalation rules

2. **Escalation Execution:**
   - Move request to escalation target
   - Send notifications
   - Log escalation event
   - Reset timeout for new approver

3. **Multi-Level Escalation:**
   - If not actioned, escalate again
   - Follow escalation chain
   - Stop at maxEscalations limit

4. **Final Escalation:**
   - If max escalations reached:
     - Notify administrators
     - Flag for manual intervention
     - Do not auto-approve/reject (unless configured)

**Expiration Framework:**

**Purpose:**
Handle approval requests that cannot be resolved within acceptable timeframes.

**Expiration Triggers:**
1. **Absolute Timeout:** Request not resolved within maximum time
2. **Stale Request:** No activity for extended period
3. **Obsolete Request:** Underlying record changed or deleted

**Expiration Actions:**

\`\`\`typescript
interface ExpirationRule {
  id: string;
  policyId: string;
  
  // Trigger
  maxAgeHours: number;
  
  // Action
  action: 'reject' | 'escalate_to_admin' | 'notify_and_keep';
  
  // Notification
  notifyRequestor: boolean;
  notifyApprovers: boolean;
  notifyAdmins: boolean;
  
  // Reason
  rejectionReason: string;      // Template for auto-rejection
}
\`\`\`

**Expiration Workflow:**

1. **Detection:**
   - Background job checks approval age
   - Identifies expired requests

2. **Action Execution:**
   - **Reject:** Auto-reject with reason, notify all parties
   - **Escalate to Admin:** Flag for manual review
   - **Notify and Keep:** Send reminder, keep pending

3. **Post-Expiration:**
   - Log expiration event
   - Update request status
   - Notify relevant parties
   - Prevent further action on expired request

**Example Scenarios:**

**Scenario 1: Timeout Escalation**
- Expense approval pending for 48 hours
- Escalation rule: Escalate to next level after 24 hours
- Action:
  1. Move to next approver
  2. Notify original approver
  3. Notify new approver
  4. Log escalation

**Scenario 2: Expiration with Rejection**
- Purchase request pending for 30 days
- Expiration rule: Reject after 30 days
- Action:
  1. Auto-reject with reason "Expired - no action taken"
  2. Notify requestor
  3. Notify all approvers
  4. Log expiration

**Scenario 3: Multi-Level Escalation**
- Contract approval pending
- Level 1 approver unavailable
- Escalate to Level 2
- Level 2 also unavailable
- Escalate to Level 3
- Level 3 approves
- All actions logged with full chain`
    },
    {
      id: '6.4.5',
      title: 'Separation of Duties',
      content: `**Purpose:**
Prevent conflicts of interest and fraud by ensuring no single user can control all aspects of a transaction.

**Separation of Duties Rules:**

**Rule 1: Self-Approval Prevention**
\`\`\`
IF submitter_id == approver_id THEN
  REJECT approval
  LOG "Self-approval attempt blocked"
\`\`\`

**Application:**
- Expense reports
- Purchase requests
- Invoice approvals
- Any financial transaction

**Rule 2: Creator-Approver Separation**
\`\`\`
IF record.created_by == current_approver THEN
  REJECT approval
  LOG "Creator cannot approve own record"
\`\`\`

**Application:**
- All approval workflows
- Prevents circumvention via record modification

**Rule 3: Sequential Approval Separation**
\`\`\`
FOR each approval_level IN approval_chain:
  IF level_n.approver == level_n-1.approver THEN
    REJECT approval chain
    LOG "Same approver at multiple levels"
\`\`\`

**Application:**
- Multi-level approval chains
- Ensures independent review at each level

**Rule 4: Functional Separation**
\`\`\`
IF user.has_role('procurement') AND user.has_role('payment_approval') THEN
  FLAG for review
  LOG "User has conflicting roles"
\`\`\`

**Application:**
- Role assignment
- Prevents concentration of conflicting permissions

**Rule 5: Transaction Segmentation**
\`\`\`
IF transaction.total > single_approval_limit THEN
  REQUIRE multiple approvers
  REQUIRE different departments
\`\`\`

**Application:**
- Large transactions
- High-value purchases
- Cross-departmental oversight

**Enforcement Mechanisms:**

1. **Pre-Submission Check:**
   - Validate approval chain before submission
   - Reject if separation of duties violated
   - Notify requestor of issue

2. **Approval-Time Check:**
   - Validate approver identity
   - Check for conflicts
   - Block if violation detected

3. **Audit Monitoring:**
   - Regular review of approval patterns
   - Flag unusual patterns
   - Investigate potential violations

**Exception Handling:**

**Emergency Override:**
- Rare cases where separation cannot be maintained
- Requires executive approval
- Full audit trail
- Post-transaction review

**Override Workflow:**
1. Requestor documents business justification
2. Executive reviews and approves override
3. Transaction proceeds with single approver
4. Audit log flags override
5. Compliance reviews within 24 hours

**Example Scenarios:**

**Scenario 1: Self-Approval Attempt**
- Manager submits expense report
- System routes to manager for approval
- System detects self-approval
- Re-routes to manager's manager
- Logs attempt

**Scenario 2: Conflicting Roles**
- User has both procurement and payment roles
- System flags during role assignment
- Requires justification
- May require additional controls
- Monitored for violations

**Scenario 3: Large Transaction**
- Purchase order for $100,000
- Single approval limit: $50,000
- System requires:
  - Procurement manager approval
  - Finance director approval
  - Different departments
- All approvals logged

**Audit and Compliance:**

**Audit Trail:**
- All approval attempts logged
- Separation violations logged
- Overrides logged with justification
- Regular compliance reports

**Compliance Reports:**
- Self-approval attempts
- Override frequency
- Segregation violations
- Approval patterns

**Monitoring:**
- Real-time violation detection
- Periodic compliance reviews
- Trend analysis
- Anomaly detection`
    }
  ]
};
