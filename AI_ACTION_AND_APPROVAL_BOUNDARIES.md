# AI Action and Approval Boundaries

**Document ID:** AI-9.8  
**Stage:** 9 — AI/ML, Inference Engine, Decision Intelligence, and Model Governance  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the boundaries between AI-generated recommendations and actual business actions, ensuring human oversight for consequential operations.

**Key Principle:** AI recommends; humans decide and approve.

---

## 2. Action Classification

### 2.1 Class 1: Read-Only Assistance

**Description:** AI provides information, explanations, or analysis without taking action

**Examples:**
- Explaining metrics
- Summarizing reports
- Answering questions
- Analyzing trends
- Identifying patterns

**Authorization:**
- Requires read permission for data
- No approval needed
- No action taken

**Safety Controls:**
- Data access authorized
- Tenant isolation enforced
- Output validated

### 2.2 Class 2: Proposed Actions (User Confirmation Required)

**Description:** AI suggests actions that require user confirmation before execution

**Examples:**
- Drafting a follow-up email
- Proposing a purchase order
- Recommending a price change
- Suggesting a workflow change
- Creating a task

**Authorization:**
- Requires permission for action
- User must explicitly confirm
- Approval workflow if required

**Safety Controls:**
- Action preview shown
- Impact estimated
- Reversible if possible
- Full audit trail

**Example Flow:**
```
1. AI generates recommendation
2. User reviews recommendation
3. User clicks "Approve" or "Execute"
4. System validates permissions
5. System executes action
6. System logs action with AI recommendation context
```

### 2.3 Class 3: Restricted/High-Impact Actions

**Description:** Actions with significant business, financial, or legal impact

**Examples:**
- Financial transactions (payments, transfers)
- Permission changes
- Sensitive data modifications
- Contract modifications
- Destructive operations (deletes)
- Actions with legal implications

**Authorization:**
- Requires specific permission
- Requires approval from designated approver
- May require multi-party approval
- Enhanced audit logging

**Safety Controls:**
- Separation of duties enforced
- AI cannot self-approve
- Time-limited approval tokens
- Complete audit trail
- Rollback capability where possible

**Example Flow:**
```
1. AI generates recommendation
2. User reviews recommendation
3. User submits for approval
4. Approver reviews (with AI recommendation context)
5. Approver approves or rejects
6. If approved, system executes action
7. System logs with full audit trail
```

---

## 3. Approval Workflows

### 3.1 Approval Matrix

| Action Type | Risk Level | Approval Required | Approver |
|-------------|------------|-------------------|----------|
| View report | Low | None | - |
| Create task | Low | None | - |
| Send email | Medium | User confirmation | User |
| Create PO <$1K | Medium | User confirmation | User |
| Create PO >$1K | High | Manager approval | Manager |
| Create PO >$10K | Critical | Director approval | Director |
| Modify price | High | Manager approval | Sales Manager |
| Approve expense | High | Manager approval | Finance Manager |
| Delete record | Critical | Director approval | Department Head |
| Change permissions | Critical | Admin approval | System Admin |

### 3.2 Approval Workflow Implementation

```typescript
interface ApprovalRequest {
  id: string;
  type: 'ai_recommendation' | 'user_action';
  
  // Action details
  action: string;
  parameters: any;
  expectedImpact: any;
  
  // AI context
  aiRecommendation?: Recommendation;
  aiConfidence?: number;
  aiEvidence?: EvidenceItem[];
  
  // Requestor
  requestedBy: string;
  requestedAt: Date;
  reason: string;
  
  // Approval
  approverRole: string;
  approverId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  decidedAt?: Date;
  decisionReason?: string;
  
  // Execution
  executedAt?: Date;
  executedBy?: string;
  executionResult?: any;
  
  // Expiration
  expiresAt: Date;
}

async function requestApproval(request: ApprovalRequest): Promise<string> {
  // 1. Validate request
  validateApprovalRequest(request);
  
  // 2. Find approver
  const approver = await findApprover(request.approverRole, request.requestedBy);
  
  // 3. Create approval request
  const approvalId = await db.approvalRequest.create({
     {
      ...request,
      approverId: approver.id,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });
  
  // 4. Notify approver
  await notifyApprover(approver, approvalId);
  
  // 5. Log request
  await audit.log({
    action: 'approval.requested',
    approvalId,
    requestedBy: request.requestedBy,
    approver: approver.id,
    actionType: request.action
  });
  
  return approvalId;
}

async function approveRequest(approvalId: string, approverId: string, reason?: string) {
  // 1. Validate approver
  const approval = await db.approvalRequest.findUnique({ where: { id: approvalId } });
  if (approval.approverId !== approverId) {
    throw new Error('Unauthorized approver');
  }
  
  // 2. Check expiration
  if (approval.expiresAt < new Date()) {
    throw new Error('Approval request expired');
  }
  
  // 3. Update status
  await db.approvalRequest.update({
    where: { id: approvalId },
     {
      status: 'approved',
      decidedAt: new Date(),
      decisionReason: reason
    }
  });
  
  // 4. Execute action
  await executeApprovedAction(approval);
  
  // 5. Log approval
  await audit.log({
    action: 'approval.approved',
    approvalId,
    approver: approverId,
    reason
  });
}
```

---

## 4. AI Self-Approval Prevention

### 4.1 Separation of Duties

**Rule:** AI cannot approve its own recommendations

**Implementation:**
```typescript
async function executeAIRecommendation(recommendation: Recommendation, userId: string) {
  // 1. Check if approval required
  if (recommendation.approvalRequired) {
    // 2. Verify approver is different from AI
    const approver = await getApprover(recommendation.approverRole);
    if (approver.id === userId) {
      throw new Error('Cannot approve own recommendation');
    }
    
    // 3. Request approval
    const approvalId = await requestApproval({
      type: 'ai_recommendation',
      action: recommendation.action,
      parameters: recommendation.parameters,
      aiRecommendation: recommendation,
      requestedBy: userId,
      approverRole: recommendation.approverRole
    });
    
    // 4. Wait for approval
    return { status: 'pending_approval', approvalId };
  }
  
  // 5. Execute if no approval required
  return await executeAction(recommendation.action, recommendation.parameters);
}
```

### 4.2 Audit Trail

**Required Audit Fields:**
- AI recommendation ID
- User who requested action
- Approver (if required)
- Action taken
- Timestamp
- Outcome
- AI model versions used
- Evidence citations

---

## 5. Idempotency and Duplicate Prevention

### 5.1 Idempotency Keys

```typescript
interface ActionExecution {
  idempotencyKey: string;
  action: string;
  parameters: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  createdAt: Date;
  executedAt?: Date;
}

async function executeWithIdempotency(key: string, action: () => Promise<any>) {
  // 1. Check if already executed
  const existing = await db.actionExecution.findUnique({
    where: { idempotencyKey: key }
  });
  
  if (existing) {
    if (existing.status === 'completed') {
      return existing.result; // Return cached result
    }
    if (existing.status === 'executing') {
      throw new Error('Action already in progress');
    }
  }
  
  // 2. Create execution record
  const execution = await db.actionExecution.create({
     {
      idempotencyKey: key,
      action: action.toString(),
      status: 'executing',
      createdAt: new Date()
    }
  });
  
  try {
    // 3. Execute action
    const result = await action();
    
    // 4. Update status
    await db.actionExecution.update({
      where: { id: execution.id },
       { status: 'completed', result, executedAt: new Date() }
    });
    
    return result;
  } catch (error) {
    // 5. Handle failure
    await db.actionExecution.update({
      where: { id: execution.id },
       { status: 'failed', result: error.message }
    });
    
    throw error;
  }
}
```

---

## 6. Rollback and Compensation

### 6.1 Rollback Strategy

**Reversible Actions:**
- Keep track of previous state
- Provide undo capability
- Time-limited rollback window

**Irreversible Actions:**
- Require extra confirmation
- Create compensating transactions
- Document rollback limitations

### 6.2 Compensation Example

```typescript
async function executeWithCompensation(action: () => Promise<any>, compensate: () => Promise<void>) {
  try {
    const result = await action();
    return result;
  } catch (error) {
    // Attempt compensation
    try {
      await compensate();
    } catch (compensationError) {
      // Log compensation failure
      await audit.log({
        action: 'compensation.failed',
        originalError: error.message,
        compensationError: compensationError.message
      });
    }
    
    throw error;
  }
}
```

---

## 7. Acceptance Criteria

- [ ] All actions classified by risk level
- [ ] Approval workflows enforced
- [ ] AI cannot self-approve
- [ ] Idempotency keys prevent duplicates
- [ ] Complete audit trail for all actions
- [ ] Rollback capability where possible
- [ ] User confirmation required for Class 2 actions
- [ ] Multi-party approval for Class 3 actions

---

**Document Status:** Recorded  
**Owner:** AI Architect / Security Architect
