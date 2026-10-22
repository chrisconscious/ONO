import { Document } from './types';

export const stage5Doc1: Document = {
  id: 'data-domain-catalog',
  number: 1,
  title: 'Data Domain Catalog',
  shortTitle: 'Data Domains',
  description: 'Complete catalogue of business data domains, their boundaries, ownership, and relationships.',
  status: 'Recorded',
  stage: 5,
  sections: [
    {
      id: 'DDC-1',
      title: '1. Platform and Organization Management Domain',
      content: `**Domain Purpose:**
Multi-tenant SaaS platform infrastructure, organization lifecycle, user management, authorization, and platform configuration.

**Core Entities:**
- Platform (singleton): Global platform configuration
- Organization (Tenant): Customer organization with subscription
- Branch: Physical or logical operating location
- Department: Functional grouping within branch
- Team: Collaborative unit within department
- User: Platform user account
- Membership: User-organization association with roles
- Invitation: Pending user invitation
- Role: Permission collection (system or custom)
- Permission: Atomic access right
- Industry: Industry classification (catalogue or custom)
- Subscription: Organization subscription plan
- AuditLog: Immutable operation record

**Tenant Ownership:**
- Platform: Platform-wide (single instance)
- Organization: Tenant-owned (each org has one)
- Branch/Department/Team: Tenant-owned
- User: Platform-wide (can belong to multiple orgs)
- Membership: Tenant-owned (org-specific)
- Role/Permission: Tenant-owned (org-specific)
- Industry: Platform-wide catalogue + tenant-owned custom
- AuditLog: Tenant-owned

**Key Relationships:**
- Organization → has many → Branch
- Branch → has many → Department
- Department → has many → Team
- User → has many → Membership (via different orgs)
- Membership → has many → Role
- Role → has many → Permission
- Organization → has one → Subscription
- Organization → has many → Industry (primary + secondary)

**Data Sensitivity:**
- Platform: Internal
- Organization: Confidential
- User: Confidential (PII)
- Membership: Internal
- Role/Permission: Internal
- AuditLog: Confidential

**Lifecycle:**
- Organization: Created → Active → Suspended → Archived → Deleted
- User: Created → Active → Deactivated → Deleted
- Membership: Created → Active → Deactivated → Removed
- Role: Created → Active → Deprecated → Deleted
- AuditLog: Created → Archived (immutable)

**Analytics Relevance:**
- User activity metrics
- Organization growth tracking
- Permission usage analysis
- Subscription utilization`
    },
    {
      id: 'DDC-2',
      title: '2. CRM and Customer Relationships Domain',
      content: `**Domain Purpose:**
Lead management, contact and company records, relationship tracking, communication history, and customer lifecycle.

**Core Entities:**
- Lead: Prospective customer
- Contact: Individual person (customer or prospect)
- Company: Business entity (customer or prospect)
- LeadSource: Origin of lead (website, referral, etc.)
- Activity: Interaction record (call, email, meeting)
- Communication: Message or document exchange
- FollowUp: Scheduled future action
- Conversion: Lead-to-customer transition record
- Tag: Classification label
- CustomField: Organization-specific extension field

**Tenant Ownership:**
- All entities: Tenant-owned

**Key Relationships:**
- Lead → belongs to → Company (optional)
- Lead → has many → Activity
- Lead → has many → Communication
- Lead → converts to → Contact + Company (via Conversion)
- Contact → belongs to → Company (optional)
- Contact → has many → Activity
- Company → has many → Contact
- Company → has many → Lead
- Company → has many → Activity
- Activity → polymorphic → Lead/Contact/Company/Opportunity
- Lead/Contact/Company → has many → Tag (many-to-many)
- Lead/Contact/Company → has many → CustomField

**Data Sensitivity:**
- Lead: Confidential (business opportunity)
- Contact: Confidential (PII)
- Company: Confidential
- Activity: Internal
- Communication: Confidential

**Lifecycle:**
- Lead: New → Contacted → Qualified → Converted/Lost
- Contact: Created → Active → Inactive → Archived
- Company: Created → Active → Inactive → Archived
- Activity: Created → Completed (immutable)

**Analytics Relevance:**
- Lead conversion rates
- Customer acquisition cost
- Activity volume and types
- Pipeline velocity
- Customer lifetime value`
    },
    {
      id: 'DDC-3',
      title: '3. Sales and Commercial Operations Domain',
      content: `**Domain Purpose:**
Sales pipeline management, opportunities, quotations, contracts, orders, and revenue tracking.

**Core Entities:**
- Pipeline: Sales process definition
- PipelineStage: Stage within pipeline
- Opportunity: Potential sale
- Product: Sellable item (shared with Inventory)
- PriceList: Pricing configuration
- Quotation: Price proposal to customer
- QuotationLine: Line item in quotation
- Contract: Formal agreement
- Order: Confirmed purchase order
- OrderLine: Line item in order
- Competitor: Competing company
- CompetitiveObservation: Competitor intelligence
- Discount: Price reduction rule
- RevenueRecord: Recognized revenue event

**Tenant Ownership:**
- All entities: Tenant-owned
- Product: Co-owned (Sales owns catalogue, Inventory owns stock)

**Key Relationships:**
- Pipeline → has many → PipelineStage
- Opportunity → belongs to → Pipeline
- Opportunity → belongs to → PipelineStage
- Opportunity → belongs to → Contact (primary)
- Opportunity → belongs to → Company
- Opportunity → has many → Quotation
- Opportunity → has one → Contract (when won)
- Opportunity → has one → Order (when confirmed)
- Quotation → has many → QuotationLine
- QuotationLine → belongs to → Product
- Contract → has many → Order
- Order → has many → OrderLine
- OrderLine → belongs to → Product
- Opportunity → has many → CompetitiveObservation
- CompetitiveObservation → belongs to → Competitor
- Order → generates → Invoice (in Finance domain)

**Data Sensitivity:**
- Opportunity: Confidential (business value)
- Quotation: Confidential (pricing)
- Contract: Confidential (legal)
- Order: Confidential
- RevenueRecord: Confidential (financial)

**Lifecycle:**
- Opportunity: Prospecting → Qualification → Proposal → Negotiation → Won/Lost
- Quotation: Draft → Sent → Accepted/Rejected/Expired
- Contract: Draft → Active → Completed/Expired/Terminated
- Order: Pending → Confirmed → Processing → Fulfilled → Completed

**Analytics Relevance:**
- Pipeline value and velocity
- Win/loss rates
- Average deal size
- Sales cycle length
- Revenue recognition
- Quotation conversion rates`
    },
    {
      id: 'DDC-4',
      title: '4. Marketing and Acquisition Domain',
      content: `**Domain Purpose:**
Marketing campaign management, lead generation, attribution tracking, and marketing performance analytics.

**Core Entities:**
- Campaign: Marketing initiative
- CampaignChannel: Channel used (email, social, etc.)
- CampaignBudget: Budget allocation
- LeadAttribution: Lead-to-campaign link
- ConversionEvent: Lead conversion tracking
- MarketingMetric: Performance measurement
- ChannelPerformance: Channel-specific metrics
- ContentAsset: Marketing content (document reference)
- LandingPage: Web page for campaign

**Tenant Ownership:**
- All entities: Tenant-owned

**Key Relationships:**
- Campaign → has many → CampaignChannel
- Campaign → has many → CampaignBudget
- Campaign → has many → LeadAttribution
- Campaign → has many → ConversionEvent
- Campaign → has many → MarketingMetric
- CampaignChannel → has many → ChannelPerformance
- LeadAttribution → belongs to → Lead (in CRM domain)
- LeadAttribution → belongs to → Campaign
- ConversionEvent → belongs to → Lead
- ContentAsset → belongs to → Campaign (optional)
- LandingPage → belongs to → Campaign (optional)

**Data Sensitivity:**
- Campaign: Internal
- CampaignBudget: Confidential
- LeadAttribution: Internal
- MarketingMetric: Internal

**Lifecycle:**
- Campaign: Planning → Active → Completed → Archived
- CampaignBudget: Allocated → Spent → Reconciled
- LeadAttribution: Created (immutable)
- ConversionEvent: Created (immutable)

**Analytics Relevance:**
- Campaign ROI
- Cost per lead
- Cost per acquisition
- Channel effectiveness
- Conversion rates by campaign
- Marketing contribution to revenue`
    }
  ]
};
