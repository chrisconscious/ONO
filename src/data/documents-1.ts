import { Document } from './types';

export const doc1: Document = {
  id: 'master-spec',
  number: 1,
  title: 'Master Project Specification',
  shortTitle: 'Master Spec',
  description: 'Product vision, objectives, users, requirements, constraints and success measures.',
  status: 'Recorded',
  sections: [
    {
      id: '1.1',
      title: '1.1 Product Vision',
      content: `The ClickIT AI-Powered Integrated Business Intelligence & Management Platform is a universal, configurable, multi-tenant business operating system that helps businesses manage their operations, connect departments, understand performance, anticipate problems, identify opportunities and make better decisions.

The platform goes beyond conventional business software that only stores records and displays charts. It connects operational data to business intelligence, predictions, recommendations, approved actions and measurable outcomes.

**Core Intelligence Cycle:**
1. Collect authorized operational data
2. Validate and organize the data
3. Calculate reliable business metrics
4. Identify trends, anomalies, inefficiencies and risks
5. Explain what is happening using available evidence
6. Predict possible future outcomes when suitable data and models exist
7. Evaluate potential business actions and their constraints
8. Recommend useful actions with supporting evidence and uncertainty
9. Allow authorized users to approve or reject actions
10. Execute only permitted actions
11. Measure the actual outcome and use the feedback to improve future decisions

**Fundamental Principle:** The system must distinguish observed facts, calculated metrics, model predictions, assumptions and recommendations. It must never fabricate business evidence or present uncertain predictions as established facts.`
    },
    {
      id: '1.2',
      title: '1.2 Objectives',
      content: `**Business Objectives:**
- Provide a unified platform for business operations management across all industries
- Connect operational data to actionable intelligence and measurable outcomes
- Support businesses of varying sizes from small enterprises to large organizations
- Enable data-driven decision making with appropriate uncertainty disclosure
- Reduce operational inefficiencies through intelligent automation and recommendations
- Maintain strict data isolation and security across all tenants

**Technical Objectives:**
- Build a scalable, multi-tenant SaaS platform
- Implement modular architecture supporting industry-specific extensions
- Deliver reliable business intelligence with transparent data lineage
- Integrate ML/AI capabilities with appropriate evaluation and monitoring
- Maintain strict type safety and schema-first development practices
- Ensure accessibility and responsive design across all interfaces

**User Objectives:**
- Reduce time spent on manual data collection and report generation
- Provide clear visibility into business performance and trends
- Surface risks and opportunities before they become critical
- Support collaborative decision-making with evidence-based recommendations
- Enable non-technical users to access powerful analytics`
    },
    {
      id: '1.3',
      title: '1.3 Target Users',
      content: `**Primary Users:**
- Business owners and CEOs seeking operational visibility
- Department managers requiring performance insights
- Operations staff managing day-to-day workflows
- Finance teams handling invoicing, payments and reporting
- Sales and marketing teams managing customer relationships

**Secondary Users:**
- Platform administrators managing the SaaS infrastructure
- Organization administrators configuring tenant settings
- Integration specialists connecting external systems
- Analysts reviewing business intelligence outputs

**User Principles:**
- Users may hold multiple roles (e.g., small business owner handling sales, marketing and finance)
- Authorization must control specific actions and data scopes, not merely page visibility
- The platform must serve users with varying technical proficiency
- Role-aware interfaces should surface relevant functionality without overwhelming users`
    },
    {
      id: '1.4',
      title: '1.4 Key Requirements Summary',
      content: `**Functional Requirements:**
- REQ-F001: Multi-tenant organization management with branch/department structure
- REQ-F002: Universal industry support with extensible catalogue
- REQ-F003: CRM and customer relationship management
- REQ-F004: Sales pipeline and commercial workflow management
- REQ-F005: Financial management (invoicing, payments, reporting)
- REQ-F006: Inventory and procurement management
- REQ-F007: Project and operations management
- REQ-F008: Workforce and HR management
- REQ-F009: Customer support case management
- REQ-F010: Document management and communication
- REQ-F011: Strategy, KPI and performance tracking
- REQ-F012: Business intelligence dashboards and analytics
- REQ-F013: ML-powered forecasting and prediction
- REQ-F014: Inference intelligence engine for decision support
- REQ-F015: External system integrations

**Non-Functional Requirements:**
- REQ-NF001: Strict tenant isolation with zero cross-tenant data leakage
- REQ-NF002: Role-based and attribute-based authorization
- REQ-NF003: Full audit trail for business-critical operations
- REQ-NF004: Responsive design supporting desktop, tablet and mobile
- REQ-NF005: WCAG 2.1 AA accessibility compliance
- REQ-NF006: Sub-2-second page load for authenticated views
- REQ-NF007: 99.9% uptime target for production deployment
- REQ-NF008: Encrypted data at rest and in transit
- REQ-NF009: Automated backup and disaster recovery
- REQ-NF010: Comprehensive monitoring and alerting`
    },
    {
      id: '1.5',
      title: '1.5 Constraints',
      content: `**Technical Constraints:**
- Strict TypeScript with no \`any\` types
- Schema-first development approach
- No secrets in source code
- Tenant scope enforced on every tenant-owned operation
- No unnecessary rewrites or dependencies
- Implementation changes must be reviewable and documented

**Business Constraints:**
- Must not fabricate business evidence
- Must not present uncertain predictions as established facts
- AI must not invent regulatory requirements without verification
- Custom industries must not be prevented from using the platform
- Platform administrators must not have unrestricted access to tenant data
- Data marketplace must not sell customer records

**Development Constraints:**
- Documentation and planning must precede implementation
- Each phase must have clear acceptance criteria
- Architecture decisions must be documented and approved
- No phase may begin until its dependencies are satisfied`
    },
    {
      id: '1.6',
      title: '1.6 Success Measures',
      content: `**Product Success:**
- Organizations can complete onboarding without manual intervention
- Users can access relevant business metrics within first session
- Recommended actions are demonstrably based on evidence
- Prediction accuracy meets defined evaluation thresholds
- Tenant isolation is verified through penetration testing

**Technical Success:**
- All modules pass integration tests before deployment
- Zero critical security vulnerabilities in production
- Database migrations are reversible and reviewed
- API contracts are validated against schemas
- Build pipeline completes within acceptable time limits

**Business Success:**
- Platform supports 20+ industries without custom code per industry
- Organizations can configure roles and permissions without developer assistance
- Business intelligence outputs are traceable to source data
- ML models are monitored for drift and recalibrated when needed
- Customer satisfaction scores meet defined targets`
    }
  ]
};

export const doc2: Document = {
  id: 'module-inventory',
  number: 2,
  title: 'Module and Feature Inventory',
  shortTitle: 'Modules',
  description: 'Complete module inventory, submodules, key entities, workflows, permissions and dependencies.',
  status: 'Recorded',
  sections: [
    {
      id: '2.1',
      title: '2.1 Organization and Administration',
      content: `**Submodules:**
- Tenant management (create, configure, suspend, delete)
- Branch and location management
- Department and team structure
- User management and invitations
- Role and permission configuration
- Feature flags and module activation
- Audit trail and activity logs
- Organization settings and preferences

**Key Entities:**
- Organization (tenant), Branch, Department, Team
- User, Membership, Invitation
- Role, Permission, PermissionGroup
- AuditLog, ActivityRecord
- FeatureFlag, ModuleConfig

**Workflows:**
- Organization onboarding → industry selection → module configuration → user invitation
- User invitation → acceptance → role assignment → first login
- Role modification → permission recalculation → access update → audit log

**Permissions:**
- Organization admin: full tenant configuration
- Department manager: department-scoped user and data management
- Platform admin: platform infrastructure only (no tenant data access by default)

**Dependencies:** Foundation for all other modules. Must be implemented first.`
    },
    {
      id: '2.2',
      title: '2.2 CRM and Customer Relationships',
      content: `**Submodules:**
- Lead management (capture, qualification, scoring)
- Contact management (individuals and companies)
- Activity tracking (calls, emails, meetings, notes)
- Communication history
- Follow-up scheduling and reminders
- Lead ownership and assignment rules
- Duplicate detection and merging
- Lead-to-customer conversion

**Key Entities:**
- Lead, Contact, Company
- LeadSource, Activity, Communication
- FollowUp, Assignment, Conversion
- Tag, CustomField

**Workflows:**
- Lead capture → qualification → assignment → nurturing → conversion or rejection
- Contact creation → activity logging → relationship building → opportunity generation
- Duplicate detection → review → merge or mark distinct

**Permissions:**
- Sales rep: own leads and contacts
- Sales manager: team leads and contacts
- Marketing: lead sources and campaign attribution

**Dependencies:** Organization module (for users/roles). Feeds into Sales module.`
    },
    {
      id: '2.3',
      title: '2.3 Sales and Commercial Management',
      content: `**Submodules:**
- Opportunity management and pipeline
- Product and service catalogue
- Pricing rules and discount structures
- Quotation and proposal generation
- Competitor tracking
- Contract management
- Order processing
- Revenue tracking and sales performance

**Key Entities:**
- Opportunity, PipelineStage, Deal
- Product, Service, PriceList, Discount
- Quotation, Proposal, Competitor
- Contract, Order, OrderLine
- RevenueRecord, SalesPerformance

**Workflows:**
- Opportunity creation → qualification → proposal → negotiation → close (won/lost)
- Quotation creation → review → approval → send → follow-up → conversion
- Contract drafting → approval → signing → activation → renewal/expiry

**Permissions:**
- Sales rep: own opportunities and quotations
- Sales manager: team pipeline visibility and approval
- Finance: contract and revenue visibility

**Dependencies:** CRM module (for contacts/companies). Products module (for catalogue). Finance module (for revenue).`
    },
    {
      id: '2.4',
      title: '2.4 Marketing',
      content: `**Submodules:**
- Campaign management (planning, execution, tracking)
- Lead acquisition and attribution
- Campaign performance analytics
- Customer acquisition cost calculation
- Channel performance comparison
- Marketing ROI measurement

**Key Entities:**
- Campaign, CampaignChannel, CampaignBudget
- LeadAttribution, ConversionRecord
- MarketingMetric, ChannelPerformance
- ContentAsset, LandingPage

**Workflows:**
- Campaign planning → budget approval → execution → lead generation → attribution → performance review
- Content creation → approval → publication → performance tracking → optimization

**Permissions:**
- Marketer: own campaigns and content
- Marketing manager: team campaigns and budget approval
- Sales: visibility into lead sources from marketing

**Dependencies:** CRM module (for lead tracking). Finance module (for budget and ROI).`
    },
    {
      id: '2.5',
      title: '2.5 Finance',
      content: `**Submodules:**
- Invoice management (creation, sending, tracking)
- Payment processing and recording
- Expense management and approval
- Budget planning and tracking
- Accounts receivable management
- Accounts payable management
- Cash flow monitoring and forecasting
- Financial reporting (P&L, balance sheet, cash flow statement)
- Tax calculation and reporting support

**Key Entities:**
- Invoice, InvoiceLine, Payment, PaymentMethod
- Expense, ExpenseCategory, ExpenseApproval
- Budget, BudgetLine, BudgetPeriod
- Receivable, Payable, JournalEntry
- FinancialReport, CashFlowProjection
- TaxRule, TaxRecord

**Workflows:**
- Invoice creation → review → approval → send → payment receipt → reconciliation
- Expense submission → approval chain → recording → reimbursement
- Budget creation → approval → allocation → tracking → variance analysis
- Period-end close → reconciliation → reporting → review

**Permissions:**
- Accountant: transaction recording and reporting
- Finance manager: approval authority and budget management
- Business owner: full financial visibility
- Department manager: department budget visibility only

**Dependencies:** Organization module. Sales module (for revenue). Inventory module (for COGS).`
    },
    {
      id: '2.6',
      title: '2.6 Inventory and Procurement',
      content: `**Submodules:**
- Product and SKU management
- Warehouse and location management
- Stock movement tracking
- Stock valuation (FIFO, weighted average, etc.)
- Supplier management
- Purchase request and approval
- Purchase order management
- Receiving and quality inspection
- Reorder rules and automation
- Procurement analytics

**Key Entities:**
- Product, SKU, ProductCategory, ProductVariant
- Warehouse, StorageLocation
- StockMovement, StockLevel, StockValuation
- Supplier, SupplierContract
- PurchaseRequest, PurchaseOrder, OrderLine
- ReceivingRecord, QualityInspection
- ReorderRule, ProcurementMetric

**Workflows:**
- Purchase request → approval → PO creation → supplier confirmation → receiving → inspection → stock update → payment
- Stock level check → reorder trigger → purchase request → fulfillment
- Stock adjustment → reason recording → approval → ledger update

**Permissions:**
- Inventory staff: stock movements and counts
- Procurement officer: purchase requests and orders
- Finance: valuation and payment approval
- Operations manager: full inventory visibility

**Dependencies:** Organization module. Finance module (for payments). Sales module (for demand signals).`
    },
    {
      id: '2.7',
      title: '2.7 Projects and Operations',
      content: `**Submodules:**
- Project management (creation, planning, tracking)
- Deliverable and milestone management
- Task management and assignment
- Resource allocation and scheduling
- Approval workflows
- Recurring workflow templates
- Operational performance tracking
- Time tracking (where applicable)

**Key Entities:**
- Project, ProjectPhase, Deliverable, Milestone
- Task, TaskAssignment, TaskDependency
- ResourceAllocation, Schedule, TimeEntry
- ApprovalRequest, ApprovalResponse
- WorkflowTemplate, WorkflowInstance
- OperationalMetric

**Workflows:**
- Project initiation → planning → execution → monitoring → closure
- Task creation → assignment → progress → completion → review
- Recurring workflow trigger → instance creation → execution → completion → next trigger

**Permissions:**
- Project team member: own tasks and time entries
- Project manager: project planning and team assignments
- Operations manager: cross-project visibility and resource allocation

**Dependencies:** Organization module (for users/teams). Finance module (for project budgets).`
    },
    {
      id: '2.8',
      title: '2.8 Workforce and HR',
      content: `**Submodules:**
- Employee records management
- Role and responsibility assignment
- Workforce allocation and capacity planning
- Staffing and scheduling
- Assignment tracking
- Authorized workforce reporting

**Key Entities:**
- Employee, EmployeeRecord, EmploymentHistory
- Responsibility, Competency, Certification
- WorkforceAllocation, CapacityPlan
- StaffingRequirement, Assignment
- WorkforceReport

**Workflows:**
- Employee onboarding → record creation → role assignment → training → active duty
- Staffing request → approval → assignment → tracking → completion
- Performance review cycle → self-assessment → manager review → goal setting

**Permissions:**
- Employee: own records and assignments
- HR manager: all employee records within scope
- Department manager: department team visibility
- Business owner: full workforce visibility

**Dependencies:** Organization module. Projects module (for assignments).`
    }
  ]
};

export const doc3: Document = {
  id: 'industry-adaptation',
  number: 3,
  title: 'Industry Adaptation Specification',
  shortTitle: 'Industry Adaptation',
  description: 'Extensible industry catalogue, custom-industry onboarding, industry profiles, configuration rules and extension framework.',
  status: 'Recorded',
  sections: [
    {
      id: '3.1',
      title: '3.1 Universal Industry Support Principle',
      content: `The platform must support businesses across ALL industries, not only a predefined list. The industry catalogue is illustrative and extensible.

**Mandatory Capabilities:**
1. Search a broad, extensible industry catalogue
2. Select a relevant industry and sub-industry where appropriate
3. Select multiple business activities when operating across industries
4. Choose "Other — my industry is not listed" option
5. Enter a custom industry name and description
6. Review and adjust AI-suggested configuration
7. Use the platform fully regardless of industry selection

**Core Principle:** A custom industry must never prevent a business from using the platform. The universal business-management core is always available.`
    },
    {
      id: '3.2',
      title: '3.2 Industry Catalogue Structure',
      content: `**Catalogue Architecture:**
- IndustryCategory (top-level grouping)
- Industry (specific industry with metadata)
- SubIndustry (optional specialization)
- BusinessActivity (cross-cutting activities)

**Pre-defined Industries (Initial Catalogue):**
1. Technology, software and IT services
2. Retail, wholesale and distribution
3. Manufacturing
4. Agriculture, livestock and fisheries
5. Healthcare and life sciences
6. Education and training
7. Banking, finance and insurance
8. Construction, engineering and real estate
9. Transport, logistics and mobility
10. Petroleum, oil and gas
11. Renewable energy and utilities
12. Hospitality, tourism and food services
13. Professional and consulting services
14. Media, entertainment and communications
15. Telecommunications
16. Mining and natural resources
17. Government, nonprofit and public services
18. Automotive and equipment services
19. Property management
20. Import, export and international trade

**Extension Mechanism:**
- Community-contributed industry profiles (reviewed and approved)
- Organization-specific custom industries
- Platform-curated additions based on demand
- Version-controlled industry configurations`
    },
    {
      id: '3.3',
      title: '3.3 Industry Profile Configuration',
      content: `Each industry profile provides:

**Suggested Configuration:**
- Recommended modules to activate
- Suggested terminology and labels
- Default workflow templates
- Common metric definitions
- Relevant compliance considerations (informational, not prescriptive)
- Typical role structures

**Configuration Rules:**
- Industry profiles provide suggestions, not mandatory requirements
- Organizations can override any suggestion
- Custom terminology does not affect data integrity
- Module activation is always under organization control
- AI suggestions require human review and approval

**Profile Components:**
\`\`\`
IndustryProfile {
  id: string
  name: string
  description: string
  category: IndustryCategory
  suggestedModules: ModuleKey[]
  terminology: Record<string, string>
  workflowTemplates: WorkflowTemplate[]
  metricDefinitions: MetricDefinition[]
  complianceNotes: ComplianceNote[]
  typicalRoles: RoleTemplate[]
  version: string
  status: 'draft' | 'reviewed' | 'approved' | 'deprecated'
}
\`\`\``
    },
    {
      id: '3.4',
      title: '3.4 Custom Industry Onboarding Flow',
      content: `**Step 1: Industry Search**
- User searches the catalogue by keyword
- Results include industries, sub-industries and related activities
- "Not found? Add your industry" prompt always visible

**Step 2: Custom Industry Entry**
- User enters custom industry name
- User describes company activities, products and services
- System acknowledges the custom industry

**Step 3: AI-Assisted Configuration**
- System suggests module activation based on description
- System suggests terminology mappings
- System suggests initial metric definitions
- All suggestions are clearly marked as "suggested" and editable

**Step 4: Configuration Review**
- User reviews all suggested configuration
- User accepts, modifies or rejects each suggestion
- User can add custom modules, metrics and workflows
- Configuration is saved and applied

**Step 5: Confirmation**
- System confirms the configuration
- User can modify configuration at any time from settings
- System logs the configuration choices for future improvement

**Constraint:** AI must not invent regulatory requirements, financial rules or critical business processes without verification. Suggestions are advisory only.`
    },
    {
      id: '3.5',
      title: '3.5 Extension Framework',
      content: `**Extension Points:**
- Custom fields on any entity (within defined boundaries)
- Custom workflow steps and approval rules
- Custom metric definitions and calculations
- Custom report templates
- Custom dashboard widgets
- Custom notification rules
- Integration hooks for external systems

**Extension Boundaries:**
- Custom fields cannot modify system-critical data structures
- Custom workflows cannot bypass security controls
- Custom metrics cannot access unauthorized data scopes
- Extensions are validated before activation
- Extensions are scoped to the defining organization

**Extension Review Process:**
- Organization-created extensions are private to that organization
- Extensions may be submitted for community review
- Platform team reviews community extensions for quality and security
- Approved extensions become available in the shared catalogue
- Extension authors receive attribution`
    },
    {
      id: '3.6',
      title: '3.6 Industry-Specific Workflow Examples',
      content: `**Logistics:**
- Dispatch planning → vehicle assignment → route optimization → delivery tracking → proof of delivery → trip profitability calculation

**Petroleum Transportation:**
- Transport order → vehicle/driver assignment → loading → transit monitoring → delivery → cost allocation → customer invoicing

**Retail:**
- Product receipt → shelf placement → POS sale → stock deduction → reorder evaluation → demand forecasting

**Manufacturing:**
- Production order → material requisition → production execution → quality control → finished goods receipt → cost calculation

**Construction:**
- Project bid → contract award → material procurement → construction phases → progress reporting → milestone billing → completion

**Professional Services:**
- Client inquiry → proposal → contract → project staffing → delivery → time/cost tracking → invoicing → profitability analysis

**Agriculture:**
- Season planning → input procurement → planting → cultivation → harvest → quality grading → storage/sale → yield analysis

**Healthcare:**
- Appointment scheduling → patient check-in → consultation → treatment → records update → billing → follow-up (with appropriate data protection)

**Education:**
- Enrollment → class assignment → attendance tracking → assessment → grading → progress reporting → certification`
    }
  ]
};

export const doc4: Document = {
  id: 'roles-permissions',
  number: 4,
  title: 'Roles and Permission Model',
  shortTitle: 'Roles & Permissions',
  description: 'Organizational structure, role catalogue, permission model, data scopes and approval boundaries.',
  status: 'Recorded',
  sections: [
    {
      id: '4.1',
      title: '4.1 Organizational Structure',
      content: `**Hierarchy:**
\`\`\`
Platform (SaaS Provider)
└── Organization (Tenant)
    ├── Branch / Location
    │   ├── Department
    │   │   ├── Team
    │   │   │   └── User (Member)
    │   │   └── Team
    │   └── Department
    └── Branch / Location
\`\`\`

**Key Principles:**
- Organizations are fully isolated from each other (tenant isolation)
- Branches represent physical or logical operating locations
- Departments group related functions within a branch
- Teams are flexible groupings within departments
- Users can belong to multiple teams/departments
- A user may hold multiple roles simultaneously

**Membership Model:**
- User has one or more Memberships within an Organization
- Each Membership can have different role assignments per scope
- Membership defines the user's access boundaries within the tenant`
    },
    {
      id: '4.2',
      title: '4.2 Role Catalogue',
      content: `**Platform-Level Roles:**
- Platform Super Admin: Infrastructure and tenant management only
- Platform Support: Tenant support tools (no raw data access by default)
- Platform Billing: Subscription and usage management

**Organization-Level Roles (Examples — Not Exhaustive):**
- Business Owner / CEO: Full organizational visibility and approval authority
- General Manager: Cross-department operational visibility
- Organization Admin: Tenant configuration, user management, module settings
- Department Manager: Department-scoped management and approvals
- Team Lead: Team-scoped task and people management

**Functional Roles (Examples — Not Exhaustive):**
- Sales Manager: Sales team oversight, pipeline approval
- Sales Representative: Own leads, opportunities and quotations
- Marketing Manager: Campaign management and budget approval
- Marketing Specialist: Campaign execution and content
- Finance Manager: Financial approvals, reporting, budget authority
- Accountant: Transaction recording, reconciliation, reporting
- Operations Manager: Cross-functional operational visibility
- Inventory Manager: Stock management, procurement approval
- Procurement Officer: Purchase requests and supplier management
- Project Manager: Project planning, team assignment, delivery tracking
- Project Team Member: Assigned tasks and time tracking
- HR Manager: Employee records, workforce planning
- Customer Support Agent: Support cases and customer communication
- Support Manager: Team oversight, escalation, satisfaction metrics

**Role Principles:**
- Roles are examples, not a fixed list
- Organizations can create custom roles
- Roles define permission sets, not individual user identities
- A single user can hold multiple roles
- Small business users may combine many functional roles
- Role combinations must not weaken security guarantees`
    },
    {
      id: '4.3',
      title: '4.3 Permission Model',
      content: `**Permission Types:**
- Action permissions: What operations a user can perform (create, read, update, delete, approve, export)
- Data scope permissions: Which records a user can access (own, team, department, branch, organization)
- Field-level permissions: Which fields are visible or editable (for sensitive data)
- Feature permissions: Which modules and features are accessible

**Authorization Approach:**
- Role-Based Access Control (RBAC): Roles map to permission sets
- Attribute-Based Access Control (ABAC): Additional conditions based on record attributes
- Combined: Both RBAC and ABAC evaluated together
- Default-Deny: No access unless explicitly granted
- Least Privilege: Minimum necessary permissions for each role

**Permission Evaluation:**
\`\`\`
CanAccess(user, action, resource) =
  hasActionPermission(user.role, action, resource.type)
  AND isInDataScope(user.scope, resource)
  AND hasFieldPermission(user.role, resource.sensitivity)
  AND not isDeniedByPolicy(user, action, resource)
\`\`\`

**Data Scopes:**
- Own: Records created by or assigned to the user
- Team: Records belonging to the user's team(s)
- Department: Records within the user's department
- Branch: Records within the user's branch
- Organization: All records within the tenant
- Custom: Organization-defined scope rules`
    },
    {
      id: '4.4',
      title: '4.4 Approval Boundaries',
      content: `**Approval Workflow Model:**
- Approval policies define which actions require approval
- Approval chains define the sequence of approvers
- Delegation rules allow temporary approval authority transfer
- Escalation rules handle timeout and absence scenarios

**Approval Categories:**
- Financial approvals: Expenses, payments, budget changes above thresholds
- Procurement approvals: Purchase orders above value thresholds
- Contract approvals: Contracts requiring legal/management review
- Access approvals: Role changes, sensitive data access requests
- Data export approvals: Bulk data exports or sensitive reports
- Action execution: AI-recommended actions requiring human approval

**Approval Principles:**
- Approval boundaries are configurable by organization admins
- Approval chains cannot be bypassed by any user (including admins)
- All approvals are audited with timestamp, approver and decision
- Rejected actions are logged with reason
- Approval delegation has time limits and scope limits
- Self-approval is prohibited for financial transactions`
    },
    {
      id: '4.5',
      title: '4.5 Tenant Isolation Rules',
      content: `**Isolation Guarantees:**
- Every database query includes tenant scope filter
- API endpoints validate tenant ownership before returning data
- Background jobs are scoped to their tenant
- File storage paths include tenant identifiers
- Analytics and reports are tenant-scoped
- AI/ML models are tenant-scoped (no cross-tenant training data)
- Audit logs are tenant-scoped

**Platform Admin Access:**
- Platform admins manage infrastructure, not tenant data
- Platform admins cannot view tenant business records by default
- Support access to tenant data requires explicit tenant consent
- Support access is time-limited and fully audited
- Emergency access requires multi-party approval and is logged

**Technical Implementation:**
- Tenant ID on every tenant-owned record
- Middleware enforcement on all API routes
- Database-level row security policies (where supported)
- Automated testing for tenant isolation
- Regular penetration testing for cross-tenant access`
    },
    {
      id: '4.6',
      title: '4.6 Multi-Role User Handling',
      content: `**Scenario: Small Business Owner**
A single user may act as CEO, sales manager, finance manager and operations manager.

**Handling:**
- User receives the union of permissions from all assigned roles
- Conflicting permissions resolve to the more restrictive option for security-critical actions
- The more permissive option applies for access scope (read visibility)
- Approval requirements still apply regardless of how many roles the user holds
- Self-approval prohibition applies even when the user holds all roles

**Scenario: Cross-Department Manager**
A department manager may need visibility into another department's data for collaboration.

**Handling:**
- Explicit cross-department permissions can be granted by organization admin
- Cross-department access is logged and auditable
- Time-limited access grants are supported
- Access can be scoped to specific record types or projects

**Permission Conflict Resolution:**
- Deny always overrides Allow for security-critical operations
- Allow applies for read visibility across scopes
- Approval requirements are never bypassed by role accumulation
- Custom policies can define organization-specific resolution rules`
    }
  ]
};
