import { Document } from './types';

export const stage6Doc1: Document = {
  id: 'core-business-workflow-catalog',
  number: 1,
  title: 'Core Business Workflow Catalog',
  shortTitle: 'Workflow Catalog',
  description: 'Comprehensive specifications for all core business workflows including organization setup, lead management, opportunity management, and more.',
  stage: 6,
  status: 'Recorded',
  sections: [
    {
      id: '6.1.1',
      title: 'Organization Setup and Onboarding Workflow',
      content: `**Workflow ID:** WF-ORG-001

**Business Purpose:**
Enable new organizations to configure their ClickIT platform instance, establish organizational structure, invite users, and begin operations.

**Trigger:**
- New organization signup completed
- Platform admin creates organization manually

**Preconditions:**
- Valid organization name and primary contact
- Industry selected (or custom industry defined)
- Subscription plan confirmed

**Participants:**
- Organization Owner (primary)
- Platform Admin (support)

**Workflow Steps:**

1. **Organization Profile Setup**
   - Enter organization name, description, logo
   - Select primary industry from catalogue OR define custom industry
   - Configure business activities and description
   - Set default currency, timezone, locale
   - **Status:** Draft → Configured

2. **Organizational Structure**
   - Create branches/locations (optional)
   - Create departments within branches
   - Create teams within departments
   - **Status:** Structure Defined

3. **Module Configuration**
   - Review AI-suggested modules based on industry
   - Activate/deactivate modules as needed
   - Configure module-specific settings
   - **Status:** Modules Configured

4. **User Invitation**
   - Invite initial users via email
   - Assign roles to invited users
   - Set permission scopes (branch/department/team)
   - **Status:** Users Invited

5. **Initial Data Setup**
   - Import existing data (optional)
   - Configure integrations (optional)
   - Set up notification preferences
   - **Status:** Ready for Operation

6. **Activation**
   - Review configuration summary
   - Accept terms of service
   - Activate organization
   - **Status:** Active

**Business Rules:**
- Organization cannot operate without at least one active user with admin role
- Custom industries must provide business description
- Module activation is reversible but data may be archived
- User invitations expire after 7 days (configurable)

**Notifications:**
- Email invitation sent to each user
- Reminder sent 24 hours before invitation expires
- Organization owner notified when users accept

**Audit Events:**
- Organization created
- Structure modified
- Modules activated/deactivated
- Users invited/accepted
- Organization activated

**Exception Handling:**
- Invalid industry: Allow custom industry entry
- User invitation fails: Retry or manual creation
- Module configuration error: Rollback to previous state

**Completion Criteria:**
- Organization status = Active
- At least one user with admin role
- Core modules activated
- Organization can create business records

**KPIs:**
- Time to activation
- User invitation acceptance rate
- Configuration completion rate`
    },
    {
      id: '6.1.2',
      title: 'Lead Management Workflow',
      content: `**Workflow ID:** WF-CRM-001

**Business Purpose:**
Capture, qualify, and convert prospective customers into active opportunities while maintaining complete interaction history.

**Trigger:**
- Manual lead creation
- Web form submission
- Campaign response
- Import from external system
- Referral

**Preconditions:**
- Valid contact information (email or phone)
- Lead source identified

**Participants:**
- Marketing (lead generation)
- Sales Representative (qualification)
- Sales Manager (oversight)

**Workflow Steps:**

1. **Lead Capture**
   - Record lead information (name, contact, company)
   - Assign lead source
   - Auto-assign to sales rep (based on rules) or leave unassigned
   - **Status:** New

2. **Initial Contact**
   - Sales rep reviews lead information
   - Make initial contact (call, email, meeting)
   - Log activity with outcome
   - **Status:** New → Contacted

3. **Qualification**
   - Assess lead against qualification criteria:
     * Budget authority
     * Need for product/service
     * Timeline for purchase
     * Decision-making process
   - Score lead (manual or automated)
   - **Status:** Contacted → Qualified / Unqualified

4. **Nurturing (if not ready)**
   - Schedule follow-up activities
   - Send relevant content
   - Monitor engagement
   - **Status:** Qualified → Nurturing

5. **Conversion to Opportunity**
   - Confirm genuine buying intent
   - Create opportunity record
   - Link to lead for history
   - **Status:** Qualified → Converted (lead), Opportunity created

6. **Disqualification**
   - Document reason for disqualification
   - Move to nurture pool or archive
   - **Status:** Unqualified

**Business Rules:**
- Lead cannot be converted without minimum qualification criteria met
- Lead scoring uses deterministic rules OR ML predictions (clearly distinguished)
- Uncontacted leads flagged after 48 hours (configurable)
- Unqualified leads require documented reason
- Lead ownership transfers require manager approval

**Required Fields:**
- Name (first + last OR company name)
- Contact method (email OR phone)
- Lead source

**Status Transitions:**
- New → Contacted (initial outreach logged)
- Contacted → Qualified (qualification criteria met)
- Contacted → Unqualified (does not meet criteria)
- Qualified → Converted (opportunity created)
- Qualified → Nurturing (not ready to buy)
- Nurturing → Qualified (ready to engage)
- Any → Unqualified (disqualified with reason)

**Notifications:**
- New lead assigned to sales rep
- Lead uncontacted for 48 hours → manager alert
- Lead qualified → opportunity creation prompt
- Lead unqualified → marketing feedback

**Audit Events:**
- Lead created
- Status changed
- Owner changed
- Score changed
- Converted to opportunity
- Unqualified with reason

**Exception Handling:**
- Duplicate lead detected: Merge or mark as duplicate
- Invalid contact info: Request correction or archive
- Ownership dispute: Manager resolution
- Conversion failure: Return to qualified status

**Integration Points:**
- Marketing campaigns (lead source tracking)
- Email systems (activity logging)
- Calendar (meeting scheduling)

**KPIs:**
- Lead response time
- Lead-to-opportunity conversion rate
- Average lead score
- Time in each status
- Lead source effectiveness`
    },
    {
      id: '6.1.3',
      title: 'Opportunity Management Workflow',
      content: `**Workflow ID:** WF-SALES-001

**Business Purpose:**
Manage sales opportunities through qualification, proposal, negotiation, and closure while tracking probability, value, and next steps.

**Trigger:**
- Lead conversion
- Direct opportunity creation
- Renewal opportunity from existing customer

**Preconditions:**
- Valid customer/contact identified
- Potential deal value estimated
- Sales stage defined

**Participants:**
- Sales Representative (owner)
- Sales Manager (approval/oversight)
- Pre-sales/Technical (support)
- Finance (pricing approval)

**Workflow Steps:**

1. **Opportunity Creation**
   - Link to customer/contact
   - Define opportunity name and description
   - Estimate deal value and close date
   - Assign to sales rep
   - **Status:** Prospecting

2. **Qualification**
   - Confirm budget, authority, need, timeline (BANT)
   - Identify decision makers
   - Assess competition
   - Update probability
   - **Status:** Prospecting → Qualification

3. **Needs Analysis**
   - Document customer requirements
   - Identify pain points
   - Map to solution capabilities
   - **Status:** Qualification → Needs Analysis

4. **Proposal/Quote Development**
   - Create proposal or quotation
   - Configure pricing and terms
   - Request approvals if needed (discounts, special terms)
   - **Status:** Needs Analysis → Proposal

5. **Proposal Presentation**
   - Send proposal to customer
   - Track delivery and receipt
   - **Status:** Proposal → Negotiation

6. **Negotiation**
   - Handle objections
   - Revise proposal if needed (version control)
   - Negotiate terms and pricing
   - **Status:** Negotiation (multiple revisions possible)

7. **Closure**
   - **Won:** Customer accepts, create order/contract
   - **Lost:** Document loss reason, update forecast
   - **Status:** Negotiation → Closed Won / Closed Lost

**Business Rules:**
- Opportunity value must be positive number
- Probability must be 0-100%
- Close date must be in future (unless closed)
- Proposals require version tracking (no silent overwrites)
- Discounts above threshold require manager approval
- Lost opportunities require documented reason
- Won opportunities cannot be reopened (create new if needed)

**Required Fields:**
- Customer/contact link
- Opportunity name
- Estimated value
- Expected close date
- Sales stage
- Owner

**Status Transitions:**
- Prospecting → Qualification (initial assessment done)
- Qualification → Needs Analysis (qualified to proceed)
- Needs Analysis → Proposal (requirements documented)
- Proposal → Negotiation (proposal sent)
- Negotiation → Closed Won (deal accepted)
- Negotiation → Closed Lost (deal lost)
- Any stage → Closed Lost (abandoned)

**Approvals Required:**
- Discount > 10%: Sales manager
- Discount > 20%: Finance manager
- Non-standard terms: Legal review
- Value > threshold: Director approval

**Notifications:**
- Opportunity assigned to rep
- Approval required for discount
- Opportunity stalled (no activity for X days)
- Close date approaching (7 days)
- Opportunity won/lost → manager notification

**Audit Events:**
- Opportunity created
- Stage changed
- Value changed
- Probability changed
- Owner changed
- Proposal created/sent
- Proposal revised
- Won/lost with reason

**Exception Handling:**
- Customer unresponsive: Escalate or mark as at-risk
- Competitor wins: Document competitive intelligence
- Pricing error: Revision with approval
- Scope change: Update value and timeline

**Integration Points:**
- CRM (customer data)
- Quotation system (proposal generation)
- Calendar (meetings and follow-ups)
- Document management (proposals, contracts)

**KPIs:**
- Win rate by stage
- Average deal size
- Sales cycle length
- Pipeline velocity
- Forecast accuracy
- Conversion rate by stage`
    }
  ]
};
