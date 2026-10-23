import { Document } from './types';

export const stage13Doc1: Document = {
  id: 'product-capability-catalog',
  number: 1,
  title: 'Product Capability Catalog',
  shortTitle: 'Capability Catalog',
  description: 'Comprehensive catalog of all product capabilities organized by domain with dependencies, priorities, and delivery phases.',
  status: 'Recorded',
  stage: 13,
  sections: [
    {
      id: '13.1.1',
      title: '1. Capability Overview',
      content: `**Total Capabilities:** 39 capabilities across 15 domains

**By Priority:**
- Critical (MVP): 8 capabilities
- High (MVP): 6 capabilities
- Medium (Post-MVP): 13 capabilities
- Low (Post-MVP): 12 capabilities

**By Status:**
- Approved: 24 capabilities
- Proposed: 15 capabilities
- Deferred: 0 capabilities
- Blocked: 0 capabilities

**By Phase:**
- Phase 1 (Foundation): 6 capabilities
- Phase 2 (Core CRM): 7 capabilities
- Phase 3 (Inventory): 2 capabilities
- Phase 4 (Operational Workflows): 6 capabilities
- Phase 5 (BI and Decision Support): 4 capabilities
- Phase 6 (AI/ML): 3 capabilities
- Phase 7 (Industry and Integrations): 6 capabilities
- Phase 8 (SaaS Maturity): 5 capabilities

**Key Capabilities:**
- CAP-001 to CAP-006: Platform foundation (authentication, organization, membership, RBAC, data scope, audit)
- CAP-007 to CAP-012: Core CRM and sales (leads, contacts, activities, opportunities, quotations, products)
- CAP-013 to CAP-014: Inventory and procurement
- CAP-015 to CAP-018: Operational workflows (invoicing, expenses, projects, tasks)
- CAP-019 to CAP-021: Business automation (workflows, rules, automation)
- CAP-022 to CAP-025: Business intelligence (dashboards, metrics, reports, data quality)
- CAP-026 to CAP-028: AI/ML capabilities (insights, forecasting, assistant)
- CAP-029 to CAP-031: Integrations (APIs, webhooks, import/export)
- CAP-032 to CAP-039: Platform maturity (subscriptions, admin, industry, marketplace, support)`
    }
  ]
};

export const stage13Doc2: Document = {
  id: 'mvp-scope-acceptance',
  number: 2,
  title: 'MVP Scope and Acceptance Criteria',
  shortTitle: 'MVP Scope',
  description: 'Precise MVP definition including target customers, user roles, core journeys, included/excluded capabilities, and success criteria.',
  status: 'Proposed',
  stage: 13,
  sections: [
    {
      id: '13.2.1',
      title: '1. MVP Definition',
      content: `**MVP Objective:** Deliver a secure, multi-tenant SaaS platform with core CRM and sales capabilities that enables small to medium B2B services businesses to manage customer relationships and track sales opportunities.

**Target Customer:**
- Small B2B services businesses (10-50 employees)
- Professional services, consulting, IT services, marketing agencies
- Currently using spreadsheets or basic CRM
- Need: Lead management, pipeline visibility, team collaboration

**Target Timeline:** 3-4 months from development start to MVP release

**Included Capabilities (14):**
- CAP-001 to CAP-006: Platform foundation
- CAP-007 to CAP-010: Core CRM (leads, contacts, activities, opportunities)
- CAP-012: Product catalog (basic)
- CAP-018: Task management
- CAP-022: Operational dashboards (basic)
- CAP-038: Monitoring (basic)

**Excluded Capabilities:**
- Inventory and procurement (Phase 3)
- Financial accounting (Phase 4)
- Advanced workflows and automation (Phase 4)
- Business intelligence and analytics (Phase 5)
- AI/ML capabilities (Phase 6)
- External integrations (Phase 7)
- Industry-specific configurations (Phase 7)
- SaaS maturity features (Phase 8)

**Success Criteria:**
- Technical: System is secure, multi-tenant, performant
- User: Users can complete core workflows end-to-end
- Business: At least one customer successfully uses platform
- Operational: Platform is deployable and supportable

**Pilot Requirements:**
- 3-5 pilot customers
- 80%+ user adoption
- 4.0+ satisfaction score
- Zero critical bugs

**Risks and Limitations:**
- No inventory management (product businesses need Phase 3)
- No financial accounting (use external tools)
- No external integrations (manual data entry)
- No AI capabilities (manual analysis)`
    }
  ]
};

export const stage13Doc3: Document = {
  id: 'feature-prioritization-matrix',
  number: 3,
  title: 'Feature Prioritization and Decision Matrix',
  shortTitle: 'Prioritization Matrix',
  description: 'Rational feature prioritization framework using weighted scoring across 8 dimensions with MoSCoW classification.',
  status: 'Recorded',
  stage: 13,
  sections: [
    {
      id: '13.3.1',
      title: '1. Prioritization Framework',
      content: `**Method:** Weighted Scoring with MoSCoW Classification

**Scoring Criteria (8 dimensions, 1-5 scale):**
1. Business Value (25%): Revenue impact, efficiency gain
2. Customer Pain (20%): Problem severity, current workaround quality
3. Strategic Alignment (15%): Vision fit, competitive differentiation
4. Implementation Effort (15%): Development time, complexity
5. Dependencies (10%): Prerequisites, blocking factors
6. Security/Compliance (5%): Security concerns, regulatory requirements
7. Data Readiness (5%): Data model completeness, data availability
8. Technical Risk (5%): Uncertainty, feasibility concerns

**MoSCoW Classification:**
- **Must Have:** Score ≥ 4.0 AND critical for MVP
- **Should Have:** Score ≥ 3.5 AND important for Phase 2-3
- **Could Have:** Score ≥ 3.0 AND nice to have
- **Won't Have (this release):** Score < 3.0 OR deferred

**Key Decisions:**
- MVP includes Phase 1 (Foundation) and Phase 2 (Core CRM)
- AI/ML deferred to Phase 6 (requires data foundation)
- Inventory deferred to Phase 3 (not needed by primary target)
- Financial accounting deferred to Phase 4 (regulatory complexity)
- Integrations deferred to Phase 7 (foundation must be stable)

**Prioritization Assumptions:**
- Target market is small B2B services businesses
- Customers need CRM before other capabilities
- AI capabilities are differentiators, not requirements
- Technical architecture is sound (validated in Phase 1)`
    }
  ]
};

export const stage13Doc4: Document = {
  id: 'phased-delivery-roadmap',
  number: 4,
  title: 'Phased Product Delivery Roadmap',
  shortTitle: 'Delivery Roadmap',
  description: '8-phase delivery roadmap from foundation through SaaS maturity with duration, deliverables, exit criteria, and dependencies.',
  status: 'Recorded',
  stage: 13,
  sections: [
    {
      id: '13.4.1',
      title: '1. Roadmap Overview',
      content: `**Total Timeline:** 72+ weeks (18+ months) to full maturity

**Phase 0: Product Readiness (4 weeks)**
- Finalize specifications, assemble team, setup infrastructure
- Exit: Ready to start development

**Phase 1: Secure Foundation (6 weeks)**
- Authentication, organization, membership, RBAC, audit, monitoring
- Exit: Platform is secure and operational

**Phase 2: Core CRM (8 weeks) - MVP**
- Leads, contacts, opportunities, tasks, dashboards
- Exit: MVP complete, ready for pilot

**Phase 3: Inventory (8 weeks)**
- Products, stock, procurement
- Exit: Inventory management operational

**Phase 4: Operational Workflows (12 weeks)**
- Invoicing, expenses, projects, workflows
- Exit: Business workflows automated

**Phase 5: BI & Analytics (10 weeks)**
- Metrics, reports, data quality
- Exit: Insights and reporting available

**Phase 6: AI/ML (12+ weeks)**
- AI insights, forecasting, assistant
- Exit: AI capabilities operational

**Phase 7: Integrations & Industry (12 weeks)**
- APIs, webhooks, industry config
- Exit: Platform is extensible

**Phase 8: SaaS Maturity (ongoing)**
- Subscriptions, platform admin, marketplace
- Exit: Platform is mature SaaS

**Critical Path:** Foundation → CRM → BI → AI (36 weeks)

**Parallel Opportunities:**
- Inventory and Operational Workflows can be parallel
- Integration design can start during Phase 6
- Industry configuration can start during Phase 5`
    }
  ]
};

export const stage13Doc5: Document = {
  id: 'module-dependency-sequence',
  number: 5,
  title: 'Module Dependency and Release Sequence',
  shortTitle: 'Dependencies',
  description: 'Module dependency map with critical path analysis, parallel development opportunities, and optimal release sequence.',
  status: 'Recorded',
  stage: 13,
  sections: [
    {
      id: '13.5.1',
      title: '1. Dependency Analysis',
      content: `**Dependency Types:**
- Hard Dependencies: Must be built first
- Soft Dependencies: Work better with dependency
- Optional Dependencies: Can integrate optionally

**Critical Path:**
Authentication → Organization → Membership → RBAC → Data Scope → Audit → Lead Management → Opportunity/Pipeline → Invoicing → Metric Definitions → AI Insights → Forecasting

**Critical Path Duration:** 56 weeks (14 months)

**Bottlenecks:**
1. Foundation (Phase 1): All modules depend on it
2. CRM (Phase 2): BI and AI depend on CRM data
3. Metrics (Phase 5): AI depends on metrics

**Parallel Development:**
- After Foundation: CRM, Product Catalog, Task Management
- After CRM: Inventory, Operational Workflows, BI foundation
- After BI: AI, Integration design, Industry configuration

**Release Sequence:**
1. Foundation (Week 1-6)
2. Core CRM (Week 7-14)
3. Inventory (Week 15-22) [parallel with 4]
4. Operational Workflows (Week 15-26) [parallel with 3]
5. BI & Analytics (Week 27-36)
6. AI/ML (Week 37-48)
7. Integrations & Industry (Week 49-60)
8. SaaS Maturity (Week 61+)

**Integration Points:**
- Foundation → CRM (Week 6-7)
- CRM → Inventory (Week 14-15)
- CRM → Operational Workflows (Week 14-15)
- CRM → BI (Week 14-27)
- BI → AI (Week 36-37)`
    }
  ]
};

export const stage13Doc6: Document = {
  id: 'success-metrics-measurement',
  number: 6,
  title: 'Product Success Metrics and Measurement Plan',
  shortTitle: 'Success Metrics',
  description: 'Comprehensive success metrics framework covering product usage, business value, technical performance, and customer success.',
  status: 'Recorded',
  stage: 13,
  sections: [
    {
      id: '13.6.1',
      title: '1. Metrics Framework',
      content: `**Metric Categories:**

**Product Usage Metrics:**
- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- Feature adoption rates (lead creation, opportunity updates, task completion)
- Engagement depth (sessions per user, time per session, feature depth)

**Business Value Metrics:**
- Time savings (lead qualification time, opportunity cycle time, task completion time)
- Revenue impact (pipeline coverage, win rate, average deal size)
- Decision quality (forecast accuracy, data-driven decisions)

**Technical Performance Metrics:**
- Availability (system uptime, API availability)
- Performance (API response time, dashboard load time, query time)
- Reliability (error rate, bug escape rate, MTTR)

**Customer Success Metrics:**
- Satisfaction (CSAT, NPS, feature satisfaction)
- Retention (customer retention, user retention, churn rate)
- Expansion (feature expansion, seat expansion)

**Success Criteria by Phase:**

**MVP Success:**
- DAU > 50% of invited users
- Lead creation rate > 60%
- System uptime > 99.9%
- CSAT > 4.0/5.0

**Phase 3 Success:**
- DAU > 70% of invited users
- Opportunity update rate > 70%
- Inventory accuracy > 99%
- NPS > 30

**Phase 5 Success:**
- DAU > 80% of invited users
- Forecast accuracy > 80%
- Report usage > 50% of managers
- Feature expansion > 50%

**Measurement Plan:**
- Automated data collection (logs, metrics, traces)
- Manual collection (surveys, interviews, tickets)
- Daily/weekly/monthly/quarterly reporting
- Dashboards for real-time visibility
- Regular metric reviews and adjustments`
    }
  ]
};

export const stage13Doc7: Document = {
  id: 'scope-change-governance',
  number: 7,
  title: 'Scope Change and Backlog Governance',
  shortTitle: 'Scope Governance',
  description: 'Scope change management process, backlog governance framework, and scope creep prevention strategies.',
  status: 'Recorded',
  stage: 13,
  sections: [
    {
      id: '13.7.1',
      title: '1. Scope Change Management',
      content: `**Scope Change Principles:**
1. Vision Alignment: All changes must align with product vision
2. Value-Driven: Changes must deliver measurable value
3. Impact Assessment: All changes must be assessed for impact
4. Approval Authority: Changes require appropriate approval level
5. Transparency: All changes must be documented and communicated

**Change Categories:**
- Minor (Product Manager approval, 1-2 days)
- Moderate (Product Owner + Engineering Lead, 3-5 days)
- Major (Executive Sponsor + leads, 1-2 weeks)
- Strategic (Executive Leadership Team, 2-4 weeks)

**Change Process:**
1. Submit change request with justification
2. Impact analysis (technical, schedule, budget, resource, risk)
3. Approval decision (approve/reject/modify)
4. Implementation planning
5. Communication to stakeholders
6. Execution and monitoring

**Backlog Governance:**
- Backlog hierarchy: Product → Phase → Release → Sprint → Stories/Tasks
- Prioritization framework: Business value (25%), customer impact (20%), strategic alignment (15%), effort (15%), dependencies (10%), risk (10%), technical debt (5%)
- Refinement sessions: Weekly grooming, estimation, splitting, prioritization
- Definition of Ready: Clear description, dependencies resolved, estimated, prioritized, designs complete

**Scope Creep Prevention:**
- Clear MVP definition with stakeholder sign-off
- Formal change control process
- Regular scope reviews (weekly, monthly, quarterly)
- Stakeholder education on change process
- Visual scope management

**Scope Creep Response:**
1. Identify the scope creep
2. Document the unauthorized change
3. Assess impact on project
4. Communicate to stakeholders
5. Decide to formalize or revert
6. Take appropriate action
7. Learn and prevent recurrence`
    }
  ]
};

export const stage13Doc8: Document = {
  id: 'industry-expansion-strategy',
  number: 8,
  title: 'Industry Expansion and Configuration Strategy',
  shortTitle: 'Industry Strategy',
  description: 'Strategy for expanding platform to serve different industries with universal core, configuration model, and expansion roadmap.',
  status: 'Recorded',
  stage: 13,
  sections: [
    {
      id: '13.8.1',
      title: '1. Industry Strategy',
      content: `**Industry Strategy Principles:**
1. Universal Core First: Build strong foundation before industry features
2. Configuration Over Customization: Prefer configuration over code changes
3. Extension Over Modification: Extend platform rather than modifying core
4. Data-Driven Prioritization: Prioritize based on customer demand and market opportunity

**Configuration Model:**
- Layer 1: Platform Defaults (universal, cannot override)
- Layer 2: Industry Profiles (industry-specific, can override)
- Layer 3: Organization Configuration (org-specific, can override)
- Layer 4: User Preferences (user-specific, can override)

**Configuration Categories:**
- Terminology (module names, field labels, status names)
- Workflows (pipeline stages, approval workflows, automation rules)
- Fields (custom fields, validation, visibility, requirements)
- Dashboards (layouts, widgets, filters, refresh intervals)
- Reports (templates, filters, schedules, distribution)

**Industry Expansion Roadmap:**
- Phase 1-5: Universal foundation (all industries, generic)
- Phase 7: Initial industry profiles (Professional Services, Technology, Manufacturing)
- Phase 8+: Industry expansion (Retail, Healthcare, Finance, Education, etc.)

**Industry Prioritization Framework:**
- Customer Demand (30%): Number of customers, feature requests, retention
- Market Opportunity (25%): Market size, growth rate, competition
- Strategic Value (20%): Vision alignment, differentiation, revenue potential
- Implementation Complexity (15%): Technical, integration, compliance complexity
- Resource Availability (10%): Domain expertise, development capacity, support capacity

**Custom Industry Support:**
- Organizations can select "Other - My industry is not listed"
- Custom industry profiles are organization-scoped
- Custom configurations cannot affect other organizations
- Custom configurations must pass validation
- Custom configurations are audited`
    }
  ]
};

export const stage13Doc9: Document = {
  id: 'delivery-risks-capacity',
  number: 9,
  title: 'Delivery Risks and Capacity Assessment',
  shortTitle: 'Risks & Capacity',
  description: 'Comprehensive risk assessment across 6 categories with mitigation strategies, capacity planning, team structure, and budget assessment.',
  status: 'Recorded',
  stage: 13,
  sections: [
    {
      id: '13.9.1',
      title: '1. Risk Assessment',
      content: `**Risk Categories:**
1. Technical Risks: Architecture, integration, performance, security
2. Product Risks: Scope, requirements, market fit, competition
3. Resource Risks: Team capacity, skills, availability, budget
4. Schedule Risks: Timeline, dependencies, delays, milestones
5. Quality Risks: Testing, defects, user experience, reliability
6. Operational Risks: Deployment, monitoring, support, maintenance

**Critical Risks:**
1. Multi-Tenant Security Failure (Risk Score: 10)
   - Mitigation: Comprehensive security testing, penetration testing, RLS validation
   - Contingency: Security review and redesign

2. Performance at Scale (Risk Score: 12)
   - Mitigation: Performance testing, query optimization, caching, indexing
   - Contingency: Database optimization, read replicas, sharding

3. MVP Scope Creep (Risk Score: 16)
   - Mitigation: Strict scope control, clear MVP definition, stakeholder alignment
   - Contingency: Reduce scope further

4. Team Capacity Shortfall (Risk Score: 12)
   - Mitigation: Realistic capacity planning, prioritize critical path, hire early
   - Contingency: Extend timeline or reduce scope

**Capacity Assessment:**

**Core Team (MVP - Phase 1-2):** 8 FTE
- Product Manager (1)
- Engineering Lead (1)
- Frontend Developers (2)
- Backend Developers (2)
- DevOps Engineer (0.5)
- QA Engineer (1)
- UX/UI Designer (0.5)

**Extended Team (Phase 3+):** 11.5 FTE
- Add Data Engineer (1)
- Add AI/ML Engineer (1)
- Add Security Engineer (0.5)
- Add Technical Writer (0.5)
- Add Customer Success (1)

**Budget Assessment:**
- Phase 1-2 (6 months): $520,000
- Phase 1-8 (18 months): $2,145,000
- Contingency reserve: 15% of total budget

**Skills Gaps:**
- AI/ML expertise (Phase 6)
- Security expertise (Phase 1+)
- Data engineering expertise (Phase 3+)

**Mitigation Strategies:**
- Technical: Architecture validation, security-first, performance engineering, quality engineering
- Product: Customer validation, agile development, scope management, market analysis
- Resource: Capacity planning, skills development, team health, budget management
- Schedule: Realistic planning, dependency management, progress tracking, milestone management

**Contingency Plans:**
- Schedule contingency: Reduce scope, add resources, extend timeline
- Budget contingency: Reduce scope, optimize costs, request additional budget
- Resource contingency: Hire contractors, cross-train, reduce scope
- Technical contingency: Simplify approach, use proven technologies, engage experts`
    }
  ]
};

export const stage13Docs: Document[] = [
  stage13Doc1,
  stage13Doc2,
  stage13Doc3,
  stage13Doc4,
  stage13Doc5,
  stage13Doc6,
  stage13Doc7,
  stage13Doc8,
  stage13Doc9
];
