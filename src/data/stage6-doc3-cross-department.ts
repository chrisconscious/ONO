import { Document } from './types';

export const stage6Doc3: Document = {
  id: 'cross-department-workflows',
  number: 3,
  title: 'Cross-Department Workflows',
  shortTitle: 'Cross-Dept Workflows',
  description: 'End-to-end workflows spanning multiple departments including lead-to-cash, demand-to-procurement, sale-to-delivery, and more.',
  stage: 6,
  status: 'Recorded',
  sections: [
    {
      id: '6.3.1',
      title: 'Lead to Cash Workflow',
      content: `**Workflow ID:** WF-XDEPT-001

**Business Purpose:**
End-to-end process from initial lead capture through to revenue recognition and performance analysis.

**Departments Involved:**
- Marketing (lead generation)
- Sales (qualification, closing)
- Finance (invoicing, payment)
- Operations/Delivery (fulfillment)
- Business Intelligence (analysis)

**Complete Workflow:**

**Phase 1: Lead Acquisition (Marketing)**
1. Marketing campaign launches
2. Lead captured from campaign
3. Lead source attributed to campaign
4. Lead assigned to sales team
**Handoff:** Marketing → Sales (lead record with source attribution)

**Phase 2: Qualification (Sales)**
5. Sales rep contacts lead
6. Lead qualified against BANT criteria
7. Lead converted to opportunity
**Handoff:** Sales internal (lead → opportunity)

**Phase 3: Opportunity Management (Sales)**
8. Opportunity progresses through pipeline
9. Proposal/quotation created
10. Negotiation and closing
11. Opportunity marked as Closed Won
**Handoff:** Sales → Operations (order/contract)

**Phase 4: Order Fulfillment (Operations)**
12. Order received from sales
13. Inventory reserved (if physical product)
14. Service delivery or product shipment
15. Delivery confirmed
**Handoff:** Operations → Finance (delivery confirmation)

**Phase 5: Invoicing (Finance)**
16. Invoice created from order
17. Invoice sent to customer
18. Payment received
19. Payment allocated to invoice
20. Revenue recognized
**Handoff:** Finance → BI (financial data)

**Phase 6: Performance Analysis (BI)**
21. Calculate campaign ROI
22. Measure sales cycle time
23. Analyze win/loss patterns
24. Generate insights and recommendations
**Feedback:** BI → Marketing (campaign effectiveness)
**Feedback:** BI → Sales (performance insights)

**Data Flow:**
- Lead (CRM) → Opportunity (Sales) → Order (Sales/Ops) → Invoice (Finance) → Payment (Finance) → Revenue (Finance) → Analytics (BI)

**Key Handoff Points:**
1. Marketing → Sales: Lead with source attribution
2. Sales → Operations: Confirmed order with requirements
3. Operations → Finance: Delivery confirmation
4. Finance → BI: Financial transactions

**Controls:**
- Lead source attribution preserved throughout
- Order cannot be created without qualified opportunity
- Invoice cannot be created without confirmed order
- Revenue cannot be recognized without payment
- All transitions audited

**Exception Handling:**
- Lead not qualified: Return to marketing for nurturing
- Order cannot be fulfilled: Alert sales and customer
- Payment not received: Collections process
- Delivery issues: Customer support case

**KPIs:**
- Lead-to-cash cycle time
- Campaign ROI
- Sales conversion rate
- Order fulfillment time
- Invoice collection time
- Customer lifetime value`
    },
    {
      id: '6.3.2',
      title: 'Demand to Procurement Workflow',
      content: `**Workflow ID:** WF-XDEPT-002

**Business Purpose:**
Manage the process from identifying a need for goods/services through to procurement, receipt, and payment.

**Departments Involved:**
- Operations/Sales (demand signal)
- Inventory (stock review)
- Procurement (purchasing)
- Finance (approval, payment)
- Receiving (inspection)

**Complete Workflow:**

**Phase 1: Demand Identification**
1. Stock falls below reorder point OR
2. Sales order requires inventory OR
3. Project requires materials
**Trigger:** Reorder alert, sales order, project request

**Phase 2: Stock Review (Inventory)**
4. Check current stock levels
5. Verify demand is legitimate
6. Calculate required quantity
7. Create purchase request
**Handoff:** Inventory → Procurement (purchase request)

**Phase 3: Purchase Request Approval**
8. Procurement reviews request
9. Check budget availability
10. Request approval if above threshold
11. Approval granted
**Handoff:** Procurement → Finance (approval)

**Phase 4: Purchase Order Creation (Procurement)**
12. Select supplier
13. Create purchase order
14. Send PO to supplier
15. Track supplier confirmation
**Handoff:** Procurement → Supplier (PO)

**Phase 5: Goods Receipt (Receiving)**
16. Goods arrive
17. Inspect against PO
18. Record receipt
19. Update inventory
20. Handle discrepancies (if any)
**Handoff:** Receiving → Inventory (stock update)
**Handoff:** Receiving → Finance (receipt confirmation)

**Phase 6: Invoice Processing (Finance)**
21. Supplier invoice received
22. Three-way match (PO, receipt, invoice)
23. Approve for payment
24. Schedule payment
25. Process payment
**Handoff:** Finance → Supplier (payment)

**Data Flow:**
- Demand Signal → Purchase Request → Purchase Order → Receipt → Stock Update → Invoice → Payment

**Key Handoff Points:**
1. Inventory → Procurement: Purchase request with justification
2. Procurement → Supplier: Purchase order
3. Receiving → Inventory: Stock level update
4. Finance → Supplier: Payment

**Controls:**
- Purchase request requires justification
- PO cannot exceed approved request
- Receipt must match PO (with tolerance)
- Three-way match required for payment
- All approvals audited

**Exception Handling:**
- Stock discrepancy: Investigation and adjustment
- Damaged goods: Return to supplier
- Price variance: Approval escalation
- Late delivery: Supplier performance tracking

**KPIs:**
- Procurement cycle time
- Supplier on-time delivery rate
- Purchase order accuracy
- Three-way match success rate
- Procurement cost savings`
    },
    {
      id: '6.3.3',
      title: 'Sale to Delivery Workflow',
      content: `**Workflow ID:** WF-XDEPT-003

**Business Purpose:**
Manage the process from closed sale through to customer delivery and confirmation.

**Departments Involved:**
- Sales (handoff)
- Operations/Projects (delivery)
- Customer Support (issues)
- Finance (invoicing trigger)

**Complete Workflow:**

**Phase 1: Sale Closure (Sales)**
1. Opportunity marked as Closed Won
2. Order/contract created
3. Delivery requirements documented
4. Handoff package prepared
**Handoff:** Sales → Operations (order with requirements)

**Phase 2: Delivery Planning (Operations)**
5. Review order requirements
6. Assign resources (team, equipment, materials)
7. Create project or delivery schedule
8. Confirm delivery date with customer
**Handoff:** Operations → Customer (confirmation)

**Phase 3: Delivery Execution**
9. Prepare product/service
10. Execute delivery
11. Track progress
12. Handle issues (if any)
**Handoff:** Operations → Customer (delivery)

**Phase 4: Delivery Confirmation**
13. Customer confirms receipt
14. Record delivery completion
15. Update order status
16. Trigger invoicing
**Handoff:** Operations → Finance (delivery confirmation)

**Phase 5: Post-Delivery Support**
17. Monitor for issues
18. Handle customer inquiries
19. Collect feedback
20. Close delivery record
**Handoff:** Operations → Support (if issues arise)

**Data Flow:**
- Order → Delivery Plan → Execution → Confirmation → Invoice Trigger

**Key Handoff Points:**
1. Sales → Operations: Order with complete requirements
2. Operations → Customer: Delivery confirmation
3. Operations → Finance: Delivery completion (triggers invoicing)

**Controls:**
- Order cannot be delivered without complete requirements
- Delivery requires customer confirmation
- Invoice only triggered after confirmed delivery
- Issues escalate to customer support

**Exception Handling:**
- Delivery delay: Customer notification and reschedule
- Product defect: Replacement or refund process
- Customer not available: Reschedule with tracking
- Scope change: Change order process

**KPIs:**
- On-time delivery rate
- Delivery cycle time
- Customer satisfaction
- Delivery issue rate
- Order accuracy`
    },
    {
      id: '6.3.4',
      title: 'Customer Issue to Business Improvement Workflow',
      content: `**Workflow ID:** WF-XDEPT-004

**Business Purpose:**
Transform customer complaints and issues into business improvements through root cause analysis and corrective action.

**Departments Involved:**
- Customer Support (issue handling)
- Operations (root cause)
- Quality/Process (improvement)
- Management (oversight)

**Complete Workflow:**

**Phase 1: Issue Capture (Support)**
1. Customer reports issue
2. Support case created
3. Issue classified and prioritized
4. Initial response to customer
**Handoff:** Support internal (case management)

**Phase 2: Issue Resolution (Support)**
5. Investigate issue
6. Resolve for customer
7. Close case with customer
8. Tag issue for analysis
**Handoff:** Support → Quality (issue data for analysis)

**Phase 3: Pattern Analysis (Quality/BI)**
9. Aggregate issue data
10. Identify patterns and trends
11. Root cause analysis
12. Prioritize improvements
**Handoff:** Quality → Management (improvement recommendations)

**Phase 4: Improvement Planning (Management)**
13. Review recommendations
14. Approve improvement initiatives
15. Assign ownership
16. Allocate resources
**Handoff:** Management → Operations (improvement projects)

**Phase 5: Implementation (Operations)**
17. Implement process changes
18. Update procedures
19. Train staff
20. Deploy improvements
**Handoff:** Operations → Quality (implementation confirmation)

**Phase 6: Measurement (Quality/BI)**
21. Monitor issue recurrence
22. Measure improvement effectiveness
23. Report results
24. Feedback loop to support
**Feedback:** Quality → Support (reduced issue rates)

**Data Flow:**
- Customer Issue → Support Case → Pattern Analysis → Root Cause → Improvement → Implementation → Measurement

**Key Handoff Points:**
1. Support → Quality: Issue data and patterns
2. Quality → Management: Improvement recommendations
3. Management → Operations: Approved improvements
4. Operations → Quality: Implementation confirmation

**Controls:**
- All issues must be logged
- Root cause analysis required for recurring issues
- Improvements require approval
- Effectiveness must be measured

**Exception Handling:**
- Unclear root cause: Additional investigation
- Improvement fails: Alternative solution
- Recurrence continues: Escalate to management

**KPIs:**
- Issue recurrence rate
- Time to resolution
- Customer satisfaction
- Improvement implementation rate
- Issue reduction percentage`
    },
    {
      id: '6.3.5',
      title: 'Budget Control Workflow',
      content: `**Workflow ID:** WF-XDEPT-005

**Business Purpose:**
Manage budget creation, monitoring, variance analysis, and corrective action across the organization.

**Departments Involved:**
- Finance (budget management)
- Department Managers (spending)
- Executive (oversight)
- BI (analysis)

**Complete Workflow:**

**Phase 1: Budget Creation (Finance)**
1. Define budget periods (monthly/quarterly/annual)
2. Collect department requirements
3. Create budget allocations
4. Executive approval
5. Publish budgets
**Handoff:** Finance → Departments (budget allocations)

**Phase 2: Spending Commitment (Departments)**
6. Department commits to expense/PO
7. Check budget availability
8. Reserve budget
9. Proceed with commitment
**Handoff:** Department → Finance (commitment notification)

**Phase 3: Actual Recording (Finance)**
10. Invoice/expense received
11. Record actual spending
12. Release budget reservation
13. Record actual against budget
**Handoff:** Finance → BI (actual data)

**Phase 4: Variance Monitoring (BI)**
14. Calculate variance (actual vs budget)
15. Identify significant variances
16. Generate variance reports
17. Alert on threshold breaches
**Handoff:** BI → Finance/Management (variance alerts)

**Phase 5: Variance Analysis (Finance/Management)**
18. Investigate variance causes
19. Determine if corrective action needed
20. Document explanations
21. Recommend adjustments
**Handoff:** Finance → Executive (variance report with recommendations)

**Phase 6: Corrective Action (Management)**
22. Review variance analysis
23. Approve budget adjustments OR
24. Approve spending controls OR
25. Accept variance with explanation
**Handoff:** Management → Finance (approved actions)

**Phase 7: Budget Adjustment (Finance)**
26. Update budget if approved
27. Communicate changes
28. Continue monitoring
**Feedback:** Finance → Departments (updated budgets)

**Data Flow:**
- Budget Creation → Commitment → Actual → Variance → Analysis → Action → Adjustment

**Key Handoff Points:**
1. Finance → Departments: Budget allocations
2. Departments → Finance: Spending commitments
3. BI → Management: Variance alerts
4. Management → Finance: Approved adjustments

**Controls:**
- Commitments cannot exceed budget
- Variances above threshold require explanation
- Budget adjustments require approval
- All variances documented

**Exception Handling:**
- Budget exceeded: Block commitment or request approval
- Unplanned expense: Emergency approval process
- Variance unexplained: Investigation required

**KPIs:**
- Budget variance percentage
- Budget utilization rate
- Forecast accuracy
- Variance investigation time
- Budget adjustment frequency`
    }
  ]
};
