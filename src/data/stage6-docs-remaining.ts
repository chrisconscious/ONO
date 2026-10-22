import { Document } from './types';

export const stage6Doc7: Document = {
  id: 'industry-workflow-configuration',
  number: 7,
  title: 'Industry Workflow Configuration',
  shortTitle: 'Industry Workflows',
  description: 'Industry-specific workflow templates and custom workflow configuration for organizations with unique business processes.',
  stage: 6,
  status: 'Recorded',
  sections: [
    {
      id: '6.7.1',
      title: 'Industry-Specific Workflow Templates',
      content: `**Purpose:**
Enable organizations to configure workflows that match their industry-specific business processes while maintaining platform consistency and data integrity.

**Configuration Model:**

\`\`\`typescript
interface IndustryWorkflowTemplate {
  id: string;
  industryId: string;
  workflowType: string;           // e.g., 'lead_management', 'order_fulfillment'
  name: string;
  description: string;
  
  // Workflow definition
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
  approvals: ApprovalConfig[];
  automations: AutomationConfig[];
  
  // Industry-specific customizations
  customFields: CustomFieldConfig[];
  customStatuses: CustomStatusConfig[];
  customRoles: CustomRoleConfig[];
  
  // Validation
  requiredFields: string[];
  validationRules: ValidationRule[];
  
  // Metadata
  version: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  lastModifiedAt: Date;
}

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  order: number;
  isTerminal: boolean;
  color: string;                  // UI color coding
  requiredActions: string[];      // Actions required to exit stage
  allowedActions: string[];       // Actions allowed in this stage
}

interface WorkflowTransition {
  id: string;
  fromStageId: string;
  toStageId: string;
  name: string;
  conditions: TransitionCondition[];
  requiredApprovals: string[];
  notifications: NotificationConfig[];
}
\`\`\`

**Example: Retail Industry - Order Fulfillment Workflow**

\`\`\`json
{
  "industryId": "retail",
  "workflowType": "order_fulfillment",
  "name": "Retail Order Fulfillment",
  "stages": [
    {
      "id": "order_received",
      "name": "Order Received",
      "order": 1,
      "isTerminal": false,
      "color": "#3B82F6",
      "requiredActions": ["verify_payment", "check_inventory"],
      "allowedActions": ["cancel_order", "hold_order"]
    },
    {
      "id": "picking",
      "name": "Picking",
      "order": 2,
      "isTerminal": false,
      "color": "#F59E0B",
      "requiredActions": ["pick_items", "quality_check"],
      "allowedActions": ["report_shortage"]
    },
    {
      "id": "packing",
      "name": "Packing",
      "order": 3,
      "isTerminal": false,
      "color": "#8B5CF6",
      "requiredActions": ["pack_items", "generate_label"],
      "allowedActions": ["add_gift_wrap"]
    },
    {
      "id": "shipped",
      "name": "Shipped",
      "order": 4,
      "isTerminal": false,
      "color": "#10B981",
      "requiredActions": ["hand_to_carrier", "send_tracking"],
      "allowedActions": []
    },
    {
      "id": "delivered",
      "name": "Delivered",
      "order": 5,
      "isTerminal": true,
      "color": "#059669",
      "requiredActions": [],
      "allowedActions": ["initiate_return"]
    }
  ],
  "transitions": [
    {
      "id": "receive_to_pick",
      "fromStageId": "order_received",
      "toStageId": "picking",
      "name": "Start Picking",
      "conditions": [
        { "field": "payment_verified", "operator": "eq", "value": true },
        { "field": "inventory_available", "operator": "eq", "value": true }
      ],
      "requiredApprovals": [],
      "notifications": ["notify_warehouse_team"]
    }
  ],
  "customFields": [
    {
      "name": "gift_wrap",
      "type": "boolean",
      "label": "Gift Wrap",
      "applicableStages": ["packing"]
    },
    {
      "name": "delivery_instructions",
      "type": "text",
      "label": "Delivery Instructions",
      "applicableStages": ["order_received", "shipped"]
    }
  ]
}
\`\`\`

**Example: Manufacturing Industry - Production Workflow**

\`\`\`json
{
  "industryId": "manufacturing",
  "workflowType": "production_order",
  "name": "Manufacturing Production Order",
  "stages": [
    {
      "id": "planning",
      "name": "Production Planning",
      "order": 1,
      "isTerminal": false,
      "color": "#3B82F6",
      "requiredActions": ["define_bom", "schedule_resources"],
      "allowedActions": ["estimate_cost"]
    },
    {
      "id": "material_prep",
      "name": "Material Preparation",
      "order": 2,
      "isTerminal": false,
      "color": "#F59E0B",
      "requiredActions": ["issue_materials", "quality_check_materials"],
      "allowedActions": ["request_substitute"]
    },
    {
      "id": "production",
      "name": "Production",
      "order": 3,
      "isTerminal": false,
      "color": "#8B5CF6",
      "requiredActions": ["execute_production", "record_output"],
      "allowedActions": ["report_downtime", "adjust_schedule"]
    },
    {
      "id": "quality_control",
      "name": "Quality Control",
      "order": 4,
      "isTerminal": false,
      "color": "#EF4444",
      "requiredActions": ["inspect_output", "document_results"],
      "allowedActions": ["rework", "scrap"]
    },
    {
      "id": "completed",
      "name": "Completed",
      "order": 5,
      "isTerminal": true,
      "color": "#10B981",
      "requiredActions": ["update_inventory", "close_order"],
      "allowedActions": []
    }
  ],
  "customFields": [
    {
      "name": "batch_number",
      "type": "text",
      "label": "Batch Number",
      "applicableStages": ["production", "quality_control", "completed"]
    },
    {
      "name": "machine_id",
      "type": "text",
      "label": "Machine ID",
      "applicableStages": ["production"]
    },
    {
      "name": "operator_id",
      "type": "text",
      "label": "Operator ID",
      "applicableStages": ["production"]
    }
  ]
}
\`\`\``
    },
    {
      id: '6.7.2',
      title: 'Custom Workflow Configuration',
      content: `**Purpose:**
Allow organizations with unique or custom industries to define their own workflows when standard templates don't match their business processes.

**Custom Workflow Creation Process:**

**Step 1: Define Workflow Type**
- Select base workflow type (lead, opportunity, order, etc.)
- Choose to customize existing template or create from scratch
- Define workflow name and description

**Step 2: Define Stages**
- Create custom stages with names and descriptions
- Set stage order and terminal status
- Define required and allowed actions per stage
- Assign colors for UI visualization

**Step 3: Define Transitions**
- Create transitions between stages
- Set conditions for each transition
- Define required approvals
- Configure notifications

**Step 4: Configure Custom Fields**
- Add industry-specific fields
- Set field types and validation
- Assign fields to appropriate stages
- Define field visibility and editability

**Step 5: Configure Automations**
- Define automation rules
- Set triggers and actions
- Configure approval requirements
- Test automations

**Step 6: Validate and Activate**
- Review workflow configuration
- Test with sample data
- Activate workflow
- Train users

**Custom Workflow Example: Healthcare Patient Intake**

\`\`\`json
{
  "organizationId": "healthcare-clinic-123",
  "workflowType": "patient_intake",
  "name": "Patient Intake Process",
  "isCustom": true,
  "stages": [
    {
      "id": "registration",
      "name": "Patient Registration",
      "order": 1,
      "isTerminal": false,
      "requiredActions": ["collect_demographics", "verify_insurance"],
      "allowedActions": ["schedule_appointment"]
    },
    {
      "id": "triage",
      "name": "Triage",
      "order": 2,
      "isTerminal": false,
      "requiredActions": ["assess_vitals", "document_symptoms"],
      "allowedActions": ["prioritize"]
    },
    {
      "id": "consultation",
      "name": "Medical Consultation",
      "order": 3,
      "isTerminal": false,
      "requiredActions": ["examine_patient", "document_findings"],
      "allowedActions": ["order_tests", "prescribe_medication"]
    },
    {
      "id": "treatment",
      "name": "Treatment",
      "order": 4,
      "isTerminal": false,
      "requiredActions": ["administer_treatment", "document_procedures"],
      "allowedActions": ["monitor_patient"]
    },
    {
      "id": "discharge",
      "name": "Discharge",
      "order": 5,
      "isTerminal": true,
      "requiredActions": ["provide_instructions", "schedule_followup"],
      "allowedActions": ["generate_billing"]
    }
  ],
  "customFields": [
    {
      "name": "insurance_id",
      "type": "text",
      "label": "Insurance ID",
      "required": true,
      "applicableStages": ["registration"]
    },
    {
      "name": "blood_pressure",
      "type": "text",
      "label": "Blood Pressure",
      "required": true,
      "applicableStages": ["triage"]
    },
    {
      "name": "diagnosis_code",
      "type": "text",
      "label": "ICD-10 Code",
      "required": false,
      "applicableStages": ["consultation", "treatment"]
    },
    {
      "name": "prescription",
      "type": "text",
      "label": "Prescription",
      "required": false,
      "applicableStages": ["consultation", "treatment", "discharge"]
    }
  ],
  "complianceNotes": [
    "HIPAA compliance required for all patient data",
    "Audit trail must be maintained for all patient interactions",
    "Data retention policies must follow healthcare regulations"
  ]
}
\`\`\`

**Custom Workflow Validation:**

**Validation Rules:**
1. At least one stage must be defined
2. At least one terminal stage must exist
3. All stages must be reachable from start
4. All transitions must have valid from/to stages
5. Required fields must be populated before terminal stage
6. Custom fields must have valid types
7. Automations must not violate security policies

**Validation Process:**
\`\`\`typescript
function validateCustomWorkflow(workflow: CustomWorkflow): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Check stages
  if (workflow.stages.length === 0) {
    errors.push({ field: 'stages', message: 'At least one stage required' });
  }
  
  const terminalStages = workflow.stages.filter(s => s.isTerminal);
  if (terminalStages.length === 0) {
    errors.push({ field: 'stages', message: 'At least one terminal stage required' });
  }
  
  // Check transitions
  for (const transition of workflow.transitions) {
    if (!workflow.stages.find(s => s.id === transition.fromStageId)) {
      errors.push({ 
        field: 'transitions', 
        message: \`Invalid fromStageId: \${transition.fromStageId}\` 
      });
    }
    if (!workflow.stages.find(s => s.id === transition.toStageId)) {
      errors.push({ 
        field: 'transitions', 
        message: \`Invalid toStageId: \${transition.toStageId}\` 
      });
    }
  }
  
  // Check reachability
  const reachable = checkReachability(workflow);
  if (!reachable) {
    errors.push({ field: 'transitions', message: 'Not all stages are reachable' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
\`\`\``
    }
  ]
};

export const stage6Doc8: Document = {
  id: 'workflow-acceptance-criteria',
  number: 8,
  title: 'Workflow Acceptance Criteria',
  shortTitle: 'Acceptance Criteria',
  description: 'Comprehensive acceptance criteria framework for validating workflow implementations across functional, security, data integrity, and performance dimensions.',
  stage: 6,
  status: 'Recorded',
  sections: [
    {
      id: '6.8.1',
      title: 'Acceptance Criteria Framework',
      content: `**Purpose:**
Define comprehensive acceptance criteria for all workflows to ensure they meet business requirements, security standards, and user expectations before implementation.

**Acceptance Criteria Categories:**

1. **Functional Criteria:** Workflow performs required actions correctly
2. **Security Criteria:** Workflow enforces authorization and tenant isolation
3. **Data Integrity Criteria:** Workflow maintains data consistency
4. **Performance Criteria:** Workflow meets performance requirements
5. **Usability Criteria:** Workflow is intuitive and user-friendly
6. **Audit Criteria:** Workflow provides complete audit trail
7. **Exception Criteria:** Workflow handles errors gracefully

**Acceptance Criteria Template:**

\`\`\`typescript
interface WorkflowAcceptanceCriteria {
  workflowId: string;
  
  // Functional criteria
  functional: {
    criterion: string;
    testScenario: string;
    expectedResult: string;
    priority: 'must_have' | 'should_have' | 'nice_to_have';
  }[];
  
  // Security criteria
  security: {
    criterion: string;
    testScenario: string;
    expectedResult: string;
    priority: 'must_have' | 'should_have' | 'nice_to_have';
  }[];
  
  // Data integrity criteria
  dataIntegrity: {
    criterion: string;
    testScenario: string;
    expectedResult: string;
    priority: 'must_have' | 'should_have' | 'nice_to_have';
  }[];
  
  // Performance criteria
  performance: {
    criterion: string;
    metric: string;
    target: string;
    measurement: string;
  }[];
  
  // Usability criteria
  usability: {
    criterion: string;
    testScenario: string;
    expectedResult: string;
  }[];
  
  // Audit criteria
  audit: {
    criterion: string;
    testScenario: string;
    expectedResult: string;
  }[];
  
  // Exception criteria
  exceptions: {
    criterion: string;
    testScenario: string;
    expectedResult: string;
  }[];
}
\`\`\``
    },
    {
      id: '6.8.2',
      title: 'Lead Management Workflow Acceptance Criteria',
      content: `**Workflow:** WF-CRM-001 (Lead Management)

**Functional Criteria:**

1. **Lead Creation**
   - Criterion: System creates lead with all required fields
   - Test: Create lead with name, email, source
   - Expected: Lead created with status "New"
   - Priority: Must have

2. **Lead Assignment**
   - Criterion: Lead automatically assigned based on rules
   - Test: Create lead in region X
   - Expected: Lead assigned to sales rep for region X
   - Priority: Must have

3. **Status Transitions**
   - Criterion: Lead status changes follow defined transitions
   - Test: Change status from New to Contacted
   - Expected: Status changes, activity logged
   - Priority: Must have

4. **Lead Conversion**
   - Criterion: Qualified lead converts to opportunity
   - Test: Convert qualified lead
   - Expected: Opportunity created, lead marked as converted
   - Priority: Must have

**Security Criteria:**

1. **Tenant Isolation**
   - Criterion: Users only see leads in their tenant
   - Test: User from tenant A tries to access tenant B lead
   - Expected: Access denied
   - Priority: Must have

2. **Permission Enforcement**
   - Criterion: Only authorized users can modify leads
   - Test: User without edit permission tries to update lead
   - Expected: Update blocked, error message shown
   - Priority: Must have

3. **Data Scope**
   - Criterion: Users only see leads within their scope
   - Test: Sales rep with "own" scope tries to view team leads
   - Expected: Only own leads visible
   - Priority: Must have

**Data Integrity Criteria:**

1. **Required Fields**
   - Criterion: Lead cannot be saved without required fields
   - Test: Try to save lead without email
   - Expected: Validation error, save blocked
   - Priority: Must have

2. **Duplicate Detection**
   - Criterion: System detects duplicate leads
   - Test: Create lead with existing email
   - Expected: Duplicate warning shown
   - Priority: Should have

3. **Audit Trail**
   - Criterion: All lead changes are logged
   - Test: Update lead status
   - Expected: Audit log entry created with actor, timestamp, changes
   - Priority: Must have

**Performance Criteria:**

1. **Lead List Load Time**
   - Criterion: Lead list loads within acceptable time
   - Metric: Page load time
   - Target: < 2 seconds for 1000 leads
   - Measurement: Automated performance test

2. **Lead Search**
   - Criterion: Search returns results quickly
   - Metric: Search response time
   - Target: < 1 second
   - Measurement: Automated performance test

**Usability Criteria:**

1. **Clear Status Indicators**
   - Criterion: Lead status clearly visible
   - Test: View lead list
   - Expected: Status badges with colors visible
   - Priority: Must have

2. **Intuitive Transitions**
   - Criterion: Status change options are clear
   - Test: View lead detail
   - Expected: Available transitions clearly shown
   - Priority: Must have

**Audit Criteria:**

1. **Complete Audit Trail**
   - Criterion: All lead operations logged
   - Test: Create, update, delete lead
   - Expected: All operations in audit log
   - Priority: Must have

2. **Actor Attribution**
   - Criterion: Audit log shows who performed action
   - Test: Update lead as user X
   - Expected: Audit log shows user X
   - Priority: Must have

**Exception Criteria:**

1. **Invalid Email**
   - Criterion: System handles invalid email gracefully
   - Test: Enter invalid email format
   - Expected: Validation error, clear message
   - Priority: Must have

2. **Assignment Failure**
   - Criterion: System handles assignment rule failure
   - Test: Create lead with no matching rule
   - Expected: Lead created unassigned, notification to manager
   - Priority: Must have`
    }
  ]
};

export const stage6Doc9: Document = {
  id: 'project-status-stage6',
  number: 9,
  title: 'Project Status (Stage 6 Update)',
  shortTitle: 'Project Status',
  description: 'Updated project status reflecting Stage 6 completion with workflow specifications, business rules, and approval frameworks.',
  stage: 6,
  status: 'Updated',
  sections: [
    {
      id: 'PS6-1',
      title: '1. Current Stage',
      content: `**Stage:** 6 — Core Business Workflows and Business Rules Specification

**Stage Status:** Documentation complete

**Stage Objective:** Define comprehensive business workflows, rules, approval frameworks, automation specifications, and cross-department processes for the ClickIT platform.

**Authorization:** Documentation and business analysis only. No implementation of workflows, business logic, automation, or database changes.`
    },
    {
      id: 'PS6-2',
      title: '2. Completed Documentation',
      content: `**Stage 6 Documents Created:**

1. **Core Business Workflow Catalog** - Detailed specifications for organization setup, lead management, opportunity management, and more
2. **Business Rules Catalog** - Comprehensive catalog of validation, workflow, authorization, financial, and inventory rules
3. **Cross-Department Workflows** - End-to-end workflows including lead-to-cash, demand-to-procurement, sale-to-delivery, and more
4. **Approval and Delegation Framework** - Configurable approval system with delegation, escalation, and separation of duties
5. **Workflow Automation Specification** - Automation framework with safety controls, exception handling, and AI-assisted decisions
6. **Business KPI and Outcome Catalog** - Comprehensive KPI definitions for financial, sales, marketing, and operational metrics
7. **Industry Workflow Configuration** - Industry-specific and custom workflow templates
8. **Workflow Acceptance Criteria** - Acceptance criteria framework with examples
9. **Project Status (Updated)** - Current stage and next steps

**Total Stage 6 Documents:** 9

**Total Project Documents:** 68 across 6 stages (13 + 13 + 12 + 14 + 7 + 9)`
    },
    {
      id: 'PS6-3',
      title: '3. Key Workflow Decisions',
      content: `**Workflow Modeling Standards:**
- Consistent workflow documentation template
- Clear status transitions with business rules
- Complete audit trail requirements
- Exception handling for all workflows
- Cross-department handoff points defined

**Approval Framework:**
- Configurable approval policies based on value/risk
- Delegation support for temporary absence
- Escalation paths for overdue approvals
- Separation of duties enforcement
- Complete audit trail for all approvals

**Automation Framework:**
- Risk-based automation levels (low/medium/high/critical)
- Explicit authorization for all automation
- Idempotency and failure handling
- Human oversight for high-impact actions
- Complete audit trail

**Business Rules:**
- Data validation rules (email, phone, monetary, dates)
- Workflow transition rules (status changes, approvals)
- Authorization rules (tenant isolation, permissions, scope)
- Financial control rules (calculations, allocations, duplicates)
- Inventory control rules (availability, reorder, movements)

**Cross-Department Workflows:**
- Lead to Cash (Marketing → Sales → Operations → Finance → BI)
- Demand to Procurement (Operations → Inventory → Procurement → Finance)
- Sale to Delivery (Sales → Operations → Customer → Finance)
- Customer Issue to Improvement (Support → Quality → Management → Operations)
- Budget Control (Finance → Departments → BI → Management)

**AI-Assisted Decisions:**
- Four participation levels (informational → suggestive → automated → autonomous)
- Evidence-based recommendations with confidence levels
- Human approval for material decisions
- Complete audit trail
- Graceful degradation without AI

**KPI Framework:**
- Financial KPIs (revenue, profit, cash flow, DSO)
- Sales KPIs (pipeline, win rate, deal size, cycle time)
- Marketing KPIs (CAC, ROI, conversion, channel effectiveness)
- Operational KPIs (delivery, inventory, fulfillment, quality)
- Clear definitions with data sources and limitations`
    },
    {
      id: 'PS6-4',
      title: '4. What Was Inspected',
      content: `**Existing Documentation Reviewed:**
- Stage 1: Master requirements, module inventory, workflow catalog (5 workflows)
- Stage 2: System architecture, module dependencies, API contracts, data architecture
- Stage 3: Repository structure, development environment, engineering standards, testing strategy
- Stage 4: UI/UX design system, screen inventory, navigation, dashboards
- Stage 5: Data domain catalog, entity catalog, logical data model, ER diagrams, tenant ownership

**Key Insights:**
- Stage 1 had basic workflow catalog with 5 workflows
- Stage 6 expands to comprehensive workflow specifications
- All workflows align with data model from Stage 5
- All workflows support UI/UX from Stage 4
- All workflows enforce security from Stage 2/3`
    },
    {
      id: 'PS6-5',
      title: '5. Conflicts with Previous Stages',
      content: `**No Conflicts Found:**
- All workflows consistent with Stage 1 requirements
- All workflows support Stage 2 architecture
- All workflows align with Stage 3 engineering standards
- All workflows match Stage 4 UI/UX specifications
- All workflows use Stage 5 data model entities

**Enhancements:**
- Stage 6 provides detailed workflow specifications beyond Stage 1 overview
- Stage 6 adds business rules catalog not in previous stages
- Stage 6 adds approval framework not in previous stages
- Stage 6 adds automation framework not in previous stages
- Stage 6 adds KPI catalog not in previous stages`
    },
    {
      id: 'PS6-6',
      title: '6. Recommended Next Stage',
      content: `**Next Phase:** Phase 7 — Shared Frontend Components

**Phase 7 Scope:**
- Design system implementation (components, tokens, styles)
- Shared UI component library
- Form components with validation
- Table and list components
- Modal and drawer components
- Navigation components
- Loading and error states

**Prerequisites for Phase 7:**
- Stage 6 documentation approved
- Repository structure implemented (Stage 3)
- Development environment set up (Stage 3)
- Authentication system ready (Phase 5)
- Application shell ready (Phase 6)

**Alternative Next Phase:**
If business logic implementation is preferred before UI:
- Phase 9 (from roadmap): Backend APIs and Business Rules
- Implement workflow engines
- Implement business rules
- Implement approval framework
- Implement automation framework

**STOPPING POINT:** Stage 6 documentation is complete. Awaiting explicit instruction to proceed to Phase 7 or Phase 9, or to create additional Stage 6 documents.

**No implementation files or infrastructure were created or modified during this stage.**`
    }
  ]
};
