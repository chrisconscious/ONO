import { Document } from './types';

export const stage6Doc2: Document = {
  id: 'business-rules-catalog',
  number: 2,
  title: 'Business Rules Catalog',
  shortTitle: 'Business Rules',
  description: 'Comprehensive catalog of business rules including validation, workflow, authorization, financial, and inventory control rules.',
  stage: 6,
  status: 'Recorded',
  sections: [
    {
      id: '6.2.1',
      title: 'Data Validation Rules',
      content: `**Rule ID:** BR-VAL-001
**Name:** Email Format Validation
**Domain:** CRM, Organization, User Management
**Description:** All email addresses must conform to RFC 5322 standard format.
**Condition:** Any field marked as email type
**Required Behavior:** Reject invalid formats, accept valid formats
**Validation Logic:** Regex pattern matching for email structure
**Severity:** Error (blocks save)
**Exception Handling:** None - strict validation
**Audit:** Log validation failures
**Related Entities:** Lead, Contact, User, Company
**Verification:** Unit tests with valid/invalid email samples

---

**Rule ID:** BR-VAL-002
**Name:** Phone Number Format Validation
**Domain:** CRM, Organization
**Description:** Phone numbers must be in E.164 international format or locally acceptable format.
**Condition:** Any field marked as phone type
**Required Behavior:** Accept E.164 format (+[country code][number]) or local formats
**Validation Logic:** Pattern matching with country code detection
**Severity:** Warning (allows save with warning)
**Exception Handling:** Allow manual override with reason
**Audit:** Log format warnings
**Related Entities:** Lead, Contact, User, Company
**Verification:** Test with international and local formats

---

**Rule ID:** BR-VAL-003
**Name:** Monetary Value Precision
**Domain:** Finance, Sales, Inventory
**Description:** All monetary values must use 2 decimal places for display, 4 for calculation.
**Condition:** Any currency field
**Required Behavior:** Store with 4 decimal precision, display with 2
**Validation Logic:** Decimal type enforcement, rounding rules
**Severity:** Error (blocks save if violated)
**Exception Handling:** None - strict precision
**Audit:** Log precision violations
**Related Entities:** Invoice, Payment, Opportunity, Product
**Verification:** Test rounding and precision across calculations

---

**Rule ID:** BR-VAL-004
**Name:** Date Range Validation
**Domain:** All modules
**Description:** End dates must be after start dates; future dates must be validated.
**Condition:** Date range fields (start/end, from/to)
**Required Behavior:** Reject invalid ranges, warn on far future dates
**Validation Logic:** Date comparison, threshold checking
**Severity:** Error for invalid range, Warning for far future
**Exception Handling:** Allow override with justification for far future
**Audit:** Log date validation events
**Related Entities:** Project, Contract, Subscription, Campaign
**Verification:** Test boundary conditions and edge cases

---

**Rule ID:** BR-VAL-005
**Name:** Required Field Validation
**Domain:** All modules
**Description:** Fields marked as required must have non-empty values.
**Condition:** Any field with required=true
**Required Behavior:** Block save if required field is empty
**Validation Logic:** Null/empty check
**Severity:** Error (blocks save)
**Exception Handling:** None - strict requirement
**Audit:** Log required field violations
**Related Entities:** All entities
**Verification:** Test all required fields across all entities`
    },
    {
      id: '6.2.2',
      title: 'Workflow Transition Rules',
      content: `**Rule ID:** BR-WF-001
**Name:** Lead Qualification Requirements
**Domain:** CRM
**Description:** Lead cannot transition to Qualified status without meeting minimum criteria.
**Condition:** Lead status change from Contacted to Qualified
**Required Behavior:** Verify budget, authority, need, and timeline information exists
**Validation Logic:** Check required fields populated, BANT criteria met
**Severity:** Error (blocks transition)
**Exception Handling:** Manager override with documented justification
**Audit:** Log qualification attempt and result
**Related Entities:** Lead
**Verification:** Test qualification with complete/incomplete data

---

**Rule ID:** BR-WF-002
**Name:** Opportunity Stage Progression
**Domain:** Sales
**Description:** Opportunities must progress through defined stages in sequence.
**Condition:** Opportunity stage change
**Required Behavior:** Enforce stage order (no skipping stages)
**Validation Logic:** Stage sequence validation
**Severity:** Error (blocks invalid transition)
**Exception Handling:** Manager approval for stage skip with reason
**Audit:** Log stage transition with previous and new stage
**Related Entities:** Opportunity
**Verification:** Test valid and invalid stage transitions

---

**Rule ID:** BR-WF-003
**Name:** Invoice Status Transition
**Domain:** Finance
**Description:** Invoices follow strict status flow: Draft → Sent → Paid/Overdue.
**Condition:** Invoice status change
**Required Behavior:** Enforce status sequence, prevent backward transitions
**Validation Logic:** Status machine validation
**Severity:** Error (blocks invalid transition)
**Exception Handling:** None - strict financial control
**Audit:** Log all status changes with actor and timestamp
**Related Entities:** Invoice
**Verification:** Test all valid and invalid status transitions

---

**Rule ID:** BR-WF-004
**Name:** Purchase Order Approval Threshold
**Domain:** Procurement
**Description:** Purchase orders above configured threshold require approval.
**Condition:** PO creation or modification
**Required Behavior:** Route for approval if value > threshold
**Validation Logic:** Value comparison against threshold
**Severity:** Workflow routing (not error)
**Exception Handling:** Emergency approval with post-audit
**Audit:** Log approval routing and decisions
**Related Entities:** PurchaseOrder
**Verification:** Test below/at/above threshold scenarios

---

**Rule ID:** BR-WF-005
**Name:** Project Budget Approval
**Domain:** Projects
**Description:** Projects cannot start without approved budget.
**Condition:** Project status change to Active
**Required Behavior:** Verify budget approval exists
**Validation Logic:** Check budget approval status
**Severity:** Error (blocks activation)
**Exception Handling:** None - financial control
**Audit:** Log budget approval verification
**Related Entities:** Project, Budget
**Verification:** Test project activation with/without budget approval`
    },
    {
      id: '6.2.3',
      title: 'Authorization Rules',
      content: `**Rule ID:** BR-AUTH-001
**Name:** Tenant Isolation
**Domain:** All modules
**Description:** Users can only access data within their tenant boundary.
**Condition:** Any data access
**Required Behavior:** Filter all queries by tenant_id
**Validation Logic:** Automatic tenant context injection
**Severity:** Security violation (blocks access)
**Exception Handling:** None - absolute security boundary
**Audit:** Log all access attempts (successful and failed)
**Related Entities:** All tenant-scoped entities
**Verification:** Penetration testing, cross-tenant access attempts

---

**Rule ID:** BR-AUTH-002
**Name:** Role-Based Access Control
**Domain:** All modules
**Description:** Users can only perform actions permitted by their assigned roles.
**Condition:** Any action attempt
**Required Behavior:** Check user roles against required permissions
**Validation Logic:** Permission matrix lookup
**Severity:** Error (blocks unauthorized action)
**Exception Handling:** Request additional permissions
**Audit:** Log permission checks and denials
**Related Entities:** All entities
**Verification:** Test all role/permission combinations

---

**Rule ID:** BR-AUTH-003
**Name:** Data Scope Enforcement
**Domain:** All modules
**Description:** Users can only access records within their authorized scope (own/team/department/branch/org).
**Condition:** Data read/write operations
**Required Behavior:** Filter records by scope level
**Validation Logic:** Scope hierarchy validation
**Severity:** Error (blocks out-of-scope access)
**Exception Handling:** Request scope expansion
**Audit:** Log scope violations
**Related Entities:** All scoped entities
**Verification:** Test scope boundaries at each level

---

**Rule ID:** BR-AUTH-004
**Name:** Approval Authority
**Domain:** Finance, Procurement, Sales
**Description:** Only users with approval permission can approve transactions.
**Condition:** Approval action
**Required Behavior:** Verify approver has approval permission
**Validation Logic:** Permission check for approve action
**Severity:** Error (blocks unauthorized approval)
**Exception Handling:** None - separation of duties
**Audit:** Log approval attempts and authority
**Related Entities:** Invoice, PO, Expense, Discount
**Verification:** Test approval with/without permission

---

**Rule ID:** BR-AUTH-005
**Name:** Self-Approval Prevention
**Domain:** Finance, Procurement
**Description:** Users cannot approve their own submissions.
**Condition:** Approval action where submitter = approver
**Required Behavior:** Reject self-approvals
**Validation Logic:** Compare submitter_id and approver_id
**Severity:** Error (blocks self-approval)
**Exception Handling:** None - separation of duties
**Audit:** Log self-approval attempts
**Related Entities:** Expense, PurchaseRequest, Invoice
**Verification:** Test self-approval scenarios`
    },
    {
      id: '6.2.4',
      title: 'Financial Control Rules',
      content: `**Rule ID:** BR-FIN-001
**Name:** Invoice Total Calculation
**Domain:** Finance
**Description:** Invoice total must equal sum of line items plus tax minus discounts.
**Condition:** Invoice creation or modification
**Required Behavior:** Auto-calculate total, prevent manual override
**Validation Logic:** Sum(line_items) + tax - discounts = total
**Severity:** Error (blocks invalid total)
**Exception Handling:** None - financial integrity
**Audit:** Log total calculation
**Related Entities:** Invoice, InvoiceLine
**Verification:** Test calculation with various line items, taxes, discounts

---

**Rule ID:** BR-FIN-002
**Name:** Payment Allocation Limit
**Domain:** Finance
**Description:** Payment allocation cannot exceed invoice outstanding balance.
**Condition:** Payment allocation
**Required Behavior:** Validate allocation amount <= outstanding balance
**Validation Logic:** Compare allocation to balance
**Severity:** Error (blocks over-allocation)
**Exception Handling:** None - financial control
**Audit:** Log allocation validation
**Related Entities:** Payment, Invoice
**Verification:** Test allocation at/over balance

---

**Rule ID:** BR-FIN-003
**Name:** Duplicate Invoice Detection
**Domain:** Finance
**Description:** Prevent duplicate invoice creation based on vendor, amount, and date.
**Condition:** Invoice creation
**Required Behavior:** Check for similar invoices, warn or block
**Validation Logic:** Match vendor_id, amount (±tolerance), date (±days)
**Severity:** Warning (allows override with reason)
**Exception Handling:** Manual override with justification
**Audit:** Log duplicate check and override
**Related Entities:** Invoice
**Verification:** Test duplicate detection with variations

---

**Rule ID:** BR-FIN-004
**Name:** Budget Variance Threshold
**Domain:** Finance, Projects
**Description:** Alert when actual spending exceeds budget by configured threshold.
**Condition:** Expense recording or budget check
**Required Behavior:** Calculate variance, trigger alert if > threshold
**Validation Logic:** (actual - budget) / budget > threshold
**Severity:** Warning (alert, not block)
**Exception Handling:** Budget adjustment approval
**Audit:** Log variance calculation and alerts
**Related Entities:** Budget, Expense, Project
**Verification:** Test variance at/below/above threshold

---

**Rule ID:** BR-FIN-005
**Name:** Currency Conversion Rate
**Domain:** Finance
**Description:** Multi-currency transactions must use approved exchange rates.
**Condition:** Multi-currency transaction
**Required Behavior:** Apply configured exchange rate, log rate used
**Validation Logic:** Rate lookup and application
**Severity:** Error if no rate available
**Exception Handling:** Manual rate entry with approval
**Audit:** Log exchange rate used
**Related Entities:** Invoice, Payment, Expense
**Verification:** Test conversion with various currencies and rates`
    },
    {
      id: '6.2.5',
      title: 'Inventory Control Rules',
      content: `**Rule ID:** BR-INV-001
**Name:** Stock Availability Check
**Domain:** Inventory, Sales
**Description:** Cannot commit stock that is not available.
**Condition:** Stock reservation or sales order
**Required Behavior:** Verify available stock >= requested quantity
**Validation Logic:** Compare available quantity to request
**Severity:** Error (blocks commitment)
**Exception Handling:** Backorder with customer approval
**Audit:** Log stock check result
**Related Entities:** Product, StockLevel, SalesOrder
**Verification:** Test commitment at/over available stock

---

**Rule ID:** BR-INV-002
**Name:** Reorder Point Alert
**Domain:** Inventory
**Description:** Alert when stock falls below configured reorder point.
**Condition:** Stock level change
**Required Behavior:** Check if stock <= reorder point, trigger alert
**Validation Logic:** Compare stock to reorder_point
**Severity:** Warning (alert, not block)
**Exception Handling:** Acknowledge alert, create purchase request
**Audit:** Log reorder alert
**Related Entities:** Product, StockLevel
**Verification:** Test alert at/above/below reorder point

---

**Rule ID:** BR-INV-003
**Name:** Stock Movement Audit Trail
**Domain:** Inventory
**Description:** All stock movements must be recorded with reason and actor.
**Condition:** Any stock movement
**Required Behavior:** Create movement record with full details
**Validation Logic:** Require movement_type, quantity, reason, actor
**Severity:** Error (blocks unrecorded movement)
**Exception Handling:** None - audit requirement
**Audit:** All movements are audit records
**Related Entities:** StockMovement, Product
**Verification:** Test all movement types with/without required fields

---

**Rule ID:** BR-INV-004
**Name:** Negative Stock Prevention
**Domain:** Inventory
**Description:** Prevent stock levels from going negative (unless configured to allow).
**Condition:** Stock reduction
**Required Behavior:** Block if resulting stock < 0 (when not allowed)
**Validation Logic:** Check (current - reduction) >= 0
**Severity:** Error (blocks negative stock)
**Exception Handling:** Configuration to allow negative stock with warning
**Audit:** Log negative stock prevention
**Related Entities:** StockLevel, StockMovement
**Verification:** Test reduction at/over current stock

---

**Rule ID:** BR-INV-005
**Name:** Lot/Batch Traceability
**Domain:** Inventory (regulated industries)
**Description:** Track stock by lot/batch for recall and compliance.
**Condition:** Stock receipt or movement
**Required Behavior:** Record lot/batch number, expiry date
**Validation Logic:** Require lot information for tracked products
**Severity:** Error (blocks untracked movement)
**Exception Handling:** None - regulatory requirement
**Audit:** Log lot tracking
**Related Entities:** StockMovement, Product
**Verification:** Test lot tracking for regulated products`
    }
  ]
};
