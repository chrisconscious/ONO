# Organization Setup and Industry Configuration

**Document ID:** SAAS-14.2  
**Stage:** 14 — User Onboarding, Organization Setup, Tenant Provisioning, Subscriptions, Billing, and SaaS Administration  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines how organizations are set up and configured, with special attention to industry selection and configuration. The platform must support any industry, including those not in the predefined catalogue, without blocking onboarding.

**Key Principles:**
- Universal core available to all organizations
- Industry configuration enhances but doesn't restrict
- "Other" option always available for unlisted industries
- Configuration is flexible and can evolve
- No silent restrictions based on industry

---

## 2. Organization Setup Workflow

### 2.1 Setup Sequence

```
1. Basic Information
   ↓
2. Industry Selection
   ↓
3. Regional Settings
   ↓
4. Initial Administrator
   ↓
5. Module Selection
   ↓
6. Team Invitation (Optional)
   ↓
7. First Workflow
```

### 2.2 Step 1: Basic Information

**Required Fields:**
- **Organization Name:** Legal or trading name (unique within platform)
  - Validation: 2-200 characters, no special characters except hyphens
  - Uniqueness: Checked at organization level
  
- **Industry Selection:** From catalogue or "Other"
  - See Section 3 for industry configuration details
  
- **Business Description:** Required if "Other" selected
  - Validation: 10-1000 characters
  - Purpose: Helps platform suggest appropriate configuration

**Optional Fields:**
- **Organization Logo:** Image file (PNG, JPG, max 2MB)
  - Displayed in UI, emails, reports
  - Can be updated later
  
- **Website URL:** Organization website
  - Validation: Valid URL format
  - Used for email links, integrations
  
- **Company Size:** Employee range
  - Options: 1-10, 11-50, 51-200, 201-1000, 1000+
  - Used for recommendations, not restrictions

**Validation Rules:**
- Organization name must be unique
- At least one field must indicate business type (industry or description)
- Logo must meet size and format requirements

### 2.3 Step 2: Industry Selection

**Industry Catalogue:**
- Searchable list of predefined industries
- Categories for easy browsing
- "Other — my industry is not listed" option always visible

**Selection Process:**
1. User searches or browses industry catalogue
2. User selects industry OR chooses "Other"
3. If "Other" selected:
   - User enters custom industry name
   - User provides business description
   - Platform suggests configuration based on description
4. User reviews and confirms selection

**Industry Configuration:**
- Predefined industries have suggested configuration:
  - Default terminology
  - Recommended modules
  - Industry-specific workflows
  - Relevant KPIs
- Custom industries use universal configuration:
  - Standard terminology
  - User selects modules
  - Universal workflows
  - User defines KPIs

**No Blocking:**
- Industry selection never blocks onboarding
- "Other" option always available
- Custom industries fully supported
- Configuration can be changed later

### 2.4 Step 3: Regional Settings

**Required Fields:**
- **Country:** Operating country
  - Affects: Tax rules, compliance, currency defaults
  - Options: Standard country list
  
- **Time Zone:** Primary time zone
  - Affects: Scheduling, reporting, notifications
  - Options: Standard time zone list
  - Default: Based on country selection
  
- **Currency:** Default currency
  - Affects: Financial operations, reporting
  - Options: Standard currency list (ISO 4217)
  - Default: Based on country selection
  
- **Language:** Default UI language
  - Affects: Interface language, email templates
  - Options: Supported languages
  - Default: Based on country selection

**Optional Fields:**
- **Date Format:** Preferred date format
  - Options: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
  - Default: Based on country
  
- **Number Format:** Preferred number format
  - Options: 1,000.00 or 1.000,00
  - Default: Based on country

**Validation Rules:**
- Country must be valid ISO code
- Time zone must be valid IANA time zone
- Currency must be valid ISO 4217 code
- Language must be supported

### 2.5 Step 4: Initial Administrator

**Required Actions:**
- **Confirm Owner:** Verify current user is organization owner
  - Current user automatically becomes owner
  - Owner has full administrative control
  
- **Admin Account Setup:** Configure admin preferences
  - Notification preferences
  - Default dashboard
  - Time zone (if different from organization)

**Owner Responsibilities:**
- Full administrative control
- Can invite other administrators
- Can transfer ownership
- Can close organization

**Multiple Administrators:**
- Owner can invite additional administrators
- Each administrator has full control
- Ownership is separate from administrator role
- Last owner cannot be removed without transfer

### 2.6 Step 5: Module Selection

**Module Categories:**
- **Core Modules:** Always available (CRM, Tasks, Documents)
- **Business Modules:** Optional (Sales, Inventory, Finance, Projects)
- **Advanced Modules:** Optional (BI, AI, Automation)
- **Integration Modules:** Optional (APIs, Webhooks)

**Selection Process:**
1. Platform recommends modules based on industry
2. User reviews recommendations
3. User selects/deselects modules
4. User configures basic module settings
5. Selection confirmed

**Module Configuration:**
- Each module has basic settings:
  - Terminology preferences
  - Default workflows
  - Notification preferences
  - Integration settings
- Advanced configuration available later
- Configuration can be changed anytime

**Industry-Specific Defaults:**
- Predefined industries get recommended modules
- Custom industries get universal recommendations
- User can override any recommendation
- No modules forced on user

### 2.7 Step 6: Team Invitation (Optional)

**Invitation Process:**
1. User enters team member emails
2. User assigns initial roles
3. Invitations sent via email
4. Team members accept invitations
5. Users added to organization

**Role Assignment:**
- Owner can assign any role
- Roles determine permissions
- Multiple roles can be assigned
- Roles can be changed later

**Skip Option:**
- Team invitation is optional
- Can be done later from organization settings
- Owner can use platform alone initially

### 2.8 Step 7: First Workflow

**Guided Workflow:**
1. Platform identifies user's primary need
2. Recommends first workflow
3. Provides step-by-step guidance
4. Celebrates completion
5. Suggests next steps

**Examples:**
- **CRM:** Create first lead
- **Sales:** Create first opportunity
- **Inventory:** Add first product
- **Finance:** Create first invoice
- **Projects:** Create first task

**Success Celebration:**
- Clear success message
- Summary of achievement
- Suggestions for next steps
- Link to documentation

---

## 3. Industry Configuration

### 3.1 Industry Catalogue

**Catalogue Structure:**
```
Industries
├── Technology & Software
│   ├── Software Development
│   ├── IT Services
│   ├── SaaS
│   └── Hardware
├── Professional Services
│   ├── Consulting
│   ├── Legal
│   ├── Accounting
│   └── Marketing
├── Retail & E-commerce
│   ├── Physical Retail
│   ├── Online Retail
│   ├── Wholesale
│   └── Marketplace
├── Manufacturing
│   ├── Discrete Manufacturing
│   ├── Process Manufacturing
│   └── Assembly
├── Healthcare
│   ├── Medical Practice
│   ├── Hospital
│   ├── Pharmacy
│   └── Medical Devices
├── Education
│   ├── K-12
│   ├── Higher Education
│   ├── Training
│   └── EdTech
├── Finance & Insurance
│   ├── Banking
│   ├── Insurance
│   ├── Investment
│   └── Fintech
├── Construction & Real Estate
│   ├── Construction
│   ├── Real Estate
│   ├── Property Management
│   └── Architecture
├── Transportation & Logistics
│   ├── Trucking
│   ├── Shipping
│   ├── Warehousing
│   └── Delivery
├── Hospitality & Tourism
│   ├── Hotel
│   ├── Restaurant
│   ├── Travel Agency
│   └── Event Planning
└── Other (Custom)
```

**Catalogue Management:**
- Platform maintains predefined industries
- Industries can be added/updated over time
- Each industry has configuration profile
- Users can suggest new industries

### 3.2 Industry Configuration Profile

**Profile Components:**

**Terminology Configuration:**
```typescript
interface IndustryTerminology {
  modules: Record<string, string>;      // Module name overrides
  entities: Record<string, string>;     // Entity name overrides
  fields: Record<string, string>;       // Field label overrides
  statuses: Record<string, string>;     // Status name overrides
  actions: Record<string, string>;      // Action name overrides
}

// Example for Real Estate
const realEstateTerminology: IndustryTerminology = {
  modules: {
    'crm': 'Client Management',
    'sales': 'Property Sales',
  },
  entities: {
    'lead': 'Prospect',
    'contact': 'Client',
    'opportunity': 'Property Listing',
  },
  fields: {
    'opportunity.value': 'Listing Price',
    'lead.source': 'Lead Source',
  },
  statuses: {
    'opportunity.stage.proposal': 'Under Contract',
    'opportunity.stage.closed_won': 'Sold',
  },
};
```

**Module Recommendations:**
```typescript
interface IndustryModuleRecommendations {
  recommended: string[];      // Highly recommended modules
  optional: string[];         // Optionally useful modules
  notRecommended: string[];   // Typically not needed
}

// Example for Manufacturing
const manufacturingModules: IndustryModuleRecommendations = {
  recommended: ['inventory', 'procurement', 'projects'],
  optional: ['finance', 'hr', 'bi'],
  notRecommended: [],
};
```

**Workflow Templates:**
```typescript
interface IndustryWorkflowTemplate {
  name: string;
  description: string;
  stages: WorkflowStage[];
  defaultFields: string[];
  automations: Automation[];
}

// Example for Consulting
const consultingWorkflow: IndustryWorkflowTemplate = {
  name: 'Client Engagement',
  description: 'Standard consulting engagement workflow',
  stages: [
    { name: 'Prospect', probability: 10 },
    { name: 'Qualification', probability: 25 },
    { name: 'Proposal', probability: 50 },
    { name: 'Negotiation', probability: 75 },
    { name: 'Engaged', probability: 100 },
  ],
  defaultFields: ['industry', 'company_size', 'budget_range'],
  automations: [
    {
      trigger: 'stage_change',
      condition: 'stage == "Proposal"',
      action: 'generate_proposal_document',
    },
  ],
};
```

**KPI Definitions:**
```typescript
interface IndustryKPIDefinition {
  name: string;
  description: string;
  formula: string;
  unit: string;
  target?: number;
  category: string;
}

// Example for Retail
const retailKPIs: IndustryKPIDefinition[] = [
  {
    name: 'Inventory Turnover',
    description: 'How many times inventory is sold and replaced',
    formula: 'cost_of_goods_sold / average_inventory',
    unit: 'times',
    target: 6,
    category: 'inventory',
  },
  {
    name: 'Gross Margin',
    description: 'Profit margin after cost of goods sold',
    formula: '(revenue - cogs) / revenue * 100',
    unit: 'percentage',
    target: 40,
    category: 'finance',
  },
];
```

### 3.3 Custom Industry Configuration

**Custom Industry Process:**
1. User selects "Other — my industry is not listed"
2. User enters custom industry name
3. User provides business description
4. Platform analyzes description
5. Platform suggests configuration (optional)
6. User reviews and confirms

**AI-Assisted Configuration:**
```typescript
async function suggestCustomIndustryConfiguration(
  industryName: string,
  description: string
): Promise<IndustryConfiguration> {
  // Use LLM to analyze description
  const analysis = await llm.analyze(description);
  
  // Suggest terminology
  const terminology = suggestTerminology(analysis);
  
  // Recommend modules
  const modules = recommendModules(analysis);
  
  // Suggest workflows
  const workflows = suggestWorkflows(analysis);
  
  // Suggest KPIs
  const kpis = suggestKPIs(analysis);
  
  return {
    terminology,
    modules,
    workflows,
    kpis,
  };
}
```

**User Control:**
- All suggestions are optional
- User can accept, modify, or reject
- Configuration can be changed later
- No suggestions are forced

### 3.4 Configuration Management

**Configuration Storage:**
```typescript
interface OrganizationConfiguration {
  organizationId: string;
  industry: {
    id: string;
    name: string;
    isCustom: boolean;
    description?: string;
  };
  terminology: IndustryTerminology;
  modules: {
    activated: string[];
    settings: Record<string, any>;
  };
  workflows: {
    templates: IndustryWorkflowTemplate[];
    custom: Workflow[];
  };
  kpis: {
    definitions: IndustryKPIDefinition[];
    custom: KPIDefinition[];
  };
  regional: {
    country: string;
    timezone: string;
    currency: string;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}
```

**Configuration Changes:**
- All changes logged in audit trail
- Some changes require approval
- Changes can affect all users
- Changes can be rolled back (if supported)

**Configuration Validation:**
- Terminology must be valid
- Modules must be available
- Workflows must be valid
- KPIs must be calculable

---

## 4. Post-Setup Configuration

### 4.1 Organization Settings

**Editable Settings:**
- Organization name, logo, description
- Industry configuration
- Regional settings
- Module settings
- User management
- Integration settings
- Notification preferences

**Setting Categories:**
- **General:** Basic organization information
- **Appearance:** Branding, themes
- **Regional:** Country, timezone, currency, language
- **Industry:** Terminology, workflows, KPIs
- **Modules:** Per-module configuration
- **Users:** Invitation, roles, permissions
- **Integrations:** External systems, APIs
- **Notifications:** Email, in-app, SMS preferences
- **Security:** Password policy, MFA, session settings
- **Billing:** Subscription, payment methods

### 4.2 Configuration Permissions

**Who Can Configure:**
- **Organization Owner:** Full configuration access
- **Administrators:** Most configuration access
- **Managers:** Limited configuration (own department)
- **Users:** Personal preferences only

**Permission Matrix:**
| Setting | Owner | Admin | Manager | User |
|---------|-------|-------|---------|------|
| Organization name | ✓ | ✓ | ✗ | ✗ |
| Industry config | ✓ | ✓ | ✗ | ✗ |
| Regional settings | ✓ | ✓ | ✗ | ✗ |
| Module settings | ✓ | ✓ | Partial | ✗ |
| User management | ✓ | ✓ | Own dept | ✗ |
| Integrations | ✓ | ✓ | ✗ | ✗ |
| Notifications | ✓ | ✓ | ✓ | Own |
| Security | ✓ | ✗ | ✗ | ✗ |
| Billing | ✓ | ✗ | ✗ | ✗ |

### 4.3 Configuration Audit

**Audit Trail:**
- All configuration changes logged
- Includes: who, what, when, before/after
- Retained for organization lifetime
- Accessible to owners and admins

**Audit Events:**
- `organization.settings.updated`
- `organization.industry.changed`
- `organization.modules.configured`
- `organization.users.invited`
- `organization.roles.assigned`

---

## 5. Acceptance Criteria

### 5.1 Organization Setup

- [ ] Organization can be created with required fields
- [ ] Industry selection works (including "Other")
- [ ] Custom industries fully supported
- [ ] Regional settings configurable
- [ ] Initial administrator established
- [ ] Modules can be selected
- [ ] Team can be invited
- [ ] First workflow guided

### 5.2 Industry Configuration

- [ ] Industry catalogue searchable
- [ ] "Other" option always available
- [ ] Custom industries don't block setup
- [ ] Terminology configurable
- [ ] Modules recommendable
- [ ] Workflows templateable
- [ ] KPIs definable
- [ ] Configuration changeable

### 5.3 Post-Setup

- [ ] Settings editable by authorized users
- [ ] Permissions enforced correctly
- [ ] Changes logged in audit trail
- [ ] Configuration validated
- [ ] Changes can be rolled back (if supported)

---

## 6. References

- Stage 2: Industry Configuration Architecture
- Stage 4: UI/UX Design (onboarding screens)
- Stage 5: Data Model (organization entities)
- Stage 13: Product Strategy (industry expansion)

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Product Manager / Business Analyst
