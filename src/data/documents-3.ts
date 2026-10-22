import { Document } from './types';

export const doc9: Document = {
  id: 'ui-ux-requirements',
  number: 9,
  title: 'UI/UX Design Requirements',
  shortTitle: 'UI/UX Design',
  description: 'Authentication-first experience, screen inventory expectations, design principles, onboarding, accessibility and responsive behavior.',
  status: 'Recorded',
  sections: [
    {
      id: '9.1',
      title: '9.1 Design Principles',
      content: `**Core Principles:**
1. **Purposeful:** Every element serves a clear function. No decorative clutter.
2. **Professional:** Clean, trustworthy appearance appropriate for business software.
3. **Accessible:** Usable by people with diverse abilities (WCAG 2.1 AA).
4. **Responsive:** Excellent experience across desktop, tablet and mobile.
5. **Transparent:** System state always clear (loading, empty, error, success).
6. **Efficient:** Minimize clicks, support keyboard navigation, respect user time.
7. **Honest:** Never show fake metrics, nonfunctional controls or misleading states.
8. **Restrained:** Animations are purposeful and subtle, not distracting.

**Visual Direction:**
- Primary: Navy #172B4D (headers, primary navigation, key UI elements)
- Accent: Blue #2563EB (interactive elements, links, active states)
- Surfaces: Clean white and neutral grays
- Typography: Professional, readable, consistent hierarchy
- Icons: Consistent style, semantic meaning, adequate size
- Spacing: Generous whitespace, clear visual grouping
- Shadows: Subtle depth, consistent elevation system

**Anti-Patterns to Avoid:**
- Generic AI-dashboard patterns (glowing cards, unnecessary gradients)
- Fake metrics or placeholder data in production views
- Nonfunctional controls (buttons that don't work, fake charts)
- Excessive text without hierarchy
- Decorative elements without purpose
- Unnecessary animations that delay interaction`
    },
    {
      id: '9.2',
      title: '9.2 Authentication-First Experience',
      content: `**Entry Point:** The platform opens directly on the authentication page. No public marketing website in this project phase.

**Authentication Screens:**
- Sign In: Email/password with MFA option
- Sign Up / Request Access: Organization creation or join request
- Forgot Password: Secure password reset flow
- MFA Verification: TOTP or email code entry
- Session Expired: Re-authentication prompt
- Invitation Acceptance: Join existing organization

**Authentication UX Requirements:**
- Clear error messages (without revealing which field is wrong for security)
- Loading states during authentication
- "Remember me" option with appropriate security
- Smooth transition to application after authentication
- Accessible form labels and error announcements
- Mobile-optimized authentication experience`
    },
    {
      id: '9.3',
      title: '9.3 Application Shell and Navigation',
      content: `**Shell Components:**
- Top bar: Organization name, search, notifications, user menu
- Side navigation: Module navigation (collapsible on mobile)
- Breadcrumbs: Context within module hierarchy
- Content area: Module-specific content
- Footer: Minimal (version, support link)

**Navigation Patterns:**
- Primary: Side navigation for module access
- Secondary: Tabs within modules for sub-sections
- Contextual: Action menus, quick filters, related records
- Global: Search across all accessible content

**Navigation Requirements:**
- Current location always visible
- Back navigation works predictably
- Deep linking to specific records and views
- Keyboard navigation support (Tab, arrow keys, shortcuts)
- Navigation state preserved on refresh
- Mobile: Hamburger menu or bottom navigation`
    },
    {
      id: '9.4',
      title: '9.4 Screen Inventory by Module',
      content: `**Each module requires these screen types:**

List View:
- Sortable, filterable table/grid
- Bulk actions where applicable
- Pagination or infinite scroll
- Column visibility customization
- Export capability

Detail View:
- Complete record information
- Related records and activity
- Edit capability (with permissions)
- Status indicators and timeline
- Action buttons (context-appropriate)

Create/Edit Form:
- Validated inputs with inline errors
- Required field indicators
- Help text for complex fields
- Auto-save or explicit save
- Cancel/confirm for destructive changes

Search and Filter:
- Full-text search where applicable
- Faceted filters
- Saved filter presets
- Clear filter state indication

Analytics/Reports:
- Chart visualizations (accessible)
- Data tables with sorting
- Date range selection
- Export options
- Data freshness indicator

Empty States:
- Clear explanation of what belongs here
- Call-to-action to create first record
- Helpful guidance or tips

Permission States:
- "No access" message with explanation
- "Request access" option where applicable
- No broken layouts for restricted users`
    },
    {
      id: '9.5',
      title: '9.5 Onboarding Experience',
      content: `**Organization Onboarding Flow:**
1. Welcome and organization details
2. Industry selection (catalogue search + custom option)
3. Business activities description
4. Module selection (suggested based on industry)
5. Team structure setup (branches, departments)
6. User invitation (email invitations)
7. Configuration review and confirmation
8. First steps guidance

**Onboarding UX Requirements:**
- Progress indicator (step X of Y)
- Next, Previous, Skip controls on each step
- Ability to return to any completed step
- Clear indication of required vs. optional steps
- Helpful defaults with ability to customize
- Summary review before final confirmation
- Option to modify configuration later from settings

**First-Login Experience:**
- Role-aware dashboard (shows relevant modules)
- Guided tour option (dismissable, not forced)
- Quick-action shortcuts for common tasks
- Help and documentation access
- "What's next" suggestions based on setup state`
    },
    {
      id: '9.6',
      title: '9.6 Accessibility Requirements',
      content: `**WCAG 2.1 AA Compliance:**
- Perceivable: Text alternatives, captions, adaptable content, distinguishable
- Operable: Keyboard accessible, enough time, no seizures, navigable
- Understandable: Readable, predictable, input assistance
- Robust: Compatible with assistive technologies

**Specific Requirements:**
- All interactive elements keyboard accessible
- Visible focus indicators on all focusable elements
- Semantic HTML with appropriate ARIA attributes
- Color contrast minimum 4.5:1 for normal text
- Color not used as sole means of conveying information
- Screen reader announcements for dynamic content
- Reduced motion preference respected
- Touch targets minimum 44x44px on mobile
- Form labels always visible (not placeholder-only)
- Error messages associated with their fields
- Skip navigation links provided
- Language declared on all pages

**Testing:**
- Automated accessibility testing in CI pipeline
- Manual keyboard navigation testing
- Screen reader testing (NVDA, VoiceOver)
- Color contrast verification
- Focus order validation`
    },
    {
      id: '9.7',
      title: '9.7 Responsive Design Strategy',
      content: `**Breakpoints:**
- Mobile: < 768px (single column, stacked navigation)
- Tablet: 768px - 1024px (adaptive layout, collapsible sidebar)
- Desktop: > 1024px (full layout with sidebar)
- Wide: > 1440px (maximum content width, centered)

**Responsive Patterns:**
- Tables → Card layouts on mobile
- Side-by-side → Stacked on mobile
- Sidebar → Bottom nav or hamburger on mobile
- Multi-column charts → Single column scroll
- Modal dialogs → Full-screen on mobile
- Dropdown menus → Bottom sheets on mobile

**Touch Considerations:**
- Adequate touch target sizes
- No hover-dependent interactions
- Swipe gestures where natural (with alternatives)
- Form inputs sized for touch
- Scroll areas with momentum`
    }
  ]
};

export const doc10: Document = {
  id: 'security-privacy',
  number: 10,
  title: 'Security, Privacy and Compliance Requirements',
  shortTitle: 'Security & Privacy',
  description: 'Security boundaries, privacy requirements, auditability and open compliance questions.',
  status: 'Recorded',
  sections: [
    {
      id: '10.1',
      title: '10.1 Security Boundaries',
      content: `**Tenant Isolation:**
- Zero cross-tenant data access by design
- Every query scoped to authenticated tenant
- Database-level row security policies
- Application-level middleware enforcement
- Automated testing for isolation violations
- Regular penetration testing

**Authentication Security:**
- Strong password requirements (configurable per tenant)
- Multi-factor authentication available and encouraged
- Session management with appropriate timeouts
- Secure session storage (httpOnly, secure, sameSite cookies)
- Brute-force protection (rate limiting, account lockout)
- Credential storage using industry-standard hashing (bcrypt/argon2)

**Authorization Security:**
- Default-deny policy (no access unless explicitly granted)
- Least privilege principle for all roles
- Server-side authorization on every endpoint
- No client-side-only authorization checks
- Permission changes require appropriate approval
- Role modifications audited

**API Security:**
- Authentication required on all endpoints (except public)
- Input validation on all parameters
- Output encoding to prevent injection
- Rate limiting per user and per tenant
- CORS properly configured
- Request size limits enforced`
    },
    {
      id: '10.2',
      title: '10.2 Data Protection',
      content: `**Encryption:**
- TLS 1.2+ for all data in transit
- AES-256 encryption at rest for database
- Encrypted file storage
- Sensitive field-level encryption (PII, credentials, financial data)
- Key management with rotation capability

**Sensitive Data Handling:**
- PII identified and classified
- Minimum necessary data collection
- Data masking in logs and error messages
- Secure deletion procedures
- Data export in standard formats
- Right to erasure support (where legally required)

**Backup and Recovery:**
- Automated daily backups (minimum)
- Point-in-time recovery capability
- Backup encryption
- Regular restore testing
- Geographic redundancy (where required)
- Recovery time and point objectives defined

**Data Retention:**
- Configurable retention policies per data type
- Automated archival of old records
- Legal hold capability
- Secure deletion after retention period
- Retention policy audit trail`
    },
    {
      id: '10.3',
      title: '10.3 Audit and Accountability',
      content: `**Audit Trail Requirements:**
- All authentication events (login, logout, failures, MFA)
- All authorization decisions (access granted, access denied)
- All data modifications (create, update, delete) with before/after
- All approval decisions (approved, rejected, delegated)
- All administrative actions (role changes, configuration changes)
- All data exports and bulk operations
- All integration activities (external API calls, webhook deliveries)
- All AI/ML activities (predictions, recommendations, actions)

**Audit Log Properties:**
- Immutable (append-only, no modification or deletion)
- Timestamped with UTC timezone
- Actor identified (user, system, integration)
- Action described with sufficient detail
- Resource identified (type, ID, tenant)
- Context captured (IP address, user agent where appropriate)
- Retained per retention policy
- Searchable and exportable by authorized administrators

**Audit Access:**
- Organization admins can access their tenant's audit logs
- Platform admins can access platform-level audit logs
- Audit logs cannot be modified by any user
- Audit log access itself is audited`
    },
    {
      id: '10.4',
      title: '10.4 AI/ML Security',
      content: `**Prompt Injection Prevention:**
- Input sanitization before LLM processing
- System prompts isolated from user data
- Output validation and filtering
- No direct execution of LLM-suggested code
- Sandboxed tool execution

**Model Security:**
- Model weights protected and access-controlled
- Training data access restricted and audited
- No cross-tenant training data mixing
- Model version integrity verification
- Adversarial input detection where feasible

**Tool-Use Security:**
- All tool calls authorized per user permissions
- Tool execution sandboxed
- Resource limits on tool execution (time, compute)
- Tool call audit logging
- Kill-switch for any tool

**Output Safety:**
- No fabrication of business evidence
- Uncertainty always disclosed
- Source attribution required
- Output cannot bypass authorization
- Hallucination detection where applicable`
    },
    {
      id: '10.5',
      title: '10.5 Privacy Requirements',
      content: `**Data Collection:**
- Purpose limitation: Data collected for specified, legitimate purposes
- Data minimization: Only collect what is necessary
- Transparency: Clear information about data handling
- Consent management: Where consent is the legal basis

**Privacy by Design:**
- Privacy considerations in architecture decisions
- Default privacy-protective settings
- Data protection impact assessments for new features
- Privacy review in development process

**User Rights Support:**
- Data access: Users can view their personal data
- Data portability: Export in standard formats
- Data correction: Users can correct inaccurate data
- Data deletion: Erasure where legally required
- Objection: Object to processing where applicable

**Third-Party Data:**
- Integration data handling documented
- Sub-processor management
- Data processing agreements where required
- Cross-border transfer considerations`
    },
    {
      id: '10.6',
      title: '10.6 Open Compliance Questions',
      content: `**Questions Requiring Legal/Compliance Review:**

1. **Data Residency:** What are the data residency requirements for target markets (Tanzania, East Africa, international)?

2. **Tanzania Data Protection:** Specific requirements under Tanzania's Personal Data Protection Act (2022) — what obligations apply?

3. **Financial Regulations:** If handling financial transactions, what regulatory requirements apply in target jurisdictions?

4. **Healthcare Data:** If supporting healthcare organizations, what health data protection requirements apply (HIPAA equivalent)?

5. **Industry-Specific:** Are there industry-specific data handling requirements for petroleum, mining, government sectors?

6. **Cross-Border:** What are the requirements for cross-border data transfer from/to Tanzania?

7. **Data Marketplace:** What legal framework is needed for the future data marketplace feature? Consent, aggregation, anonymization standards?

8. **AI Regulation:** What AI-specific regulations apply or are emerging in target markets?

9. **Records Retention:** What are the mandatory records retention periods for financial, HR and operational data in target jurisdictions?

10. **Breach Notification:** What are the breach notification requirements and timelines?

**Note:** These questions are recorded as open items. No compliance claims are made until reviewed by qualified legal counsel in each relevant jurisdiction.`
    }
  ]
};

export const doc11: Document = {
  id: 'development-roadmap',
  number: 11,
  title: 'Development Roadmap',
  shortTitle: 'Roadmap',
  description: 'All 26 phases, dependencies, deliverables, acceptance criteria and phase gates.',
  status: 'Recorded',
  sections: [
    {
      id: '11.1',
      title: '11.1 Phase Overview',
      content: `**26-Phase Development Roadmap:**

| Phase | Name | Dependencies | Status |
|-------|------|-------------|--------|
| 1 | Master Requirements & Specification | None | In Progress |
| 2 | Architecture & Technical Contracts | Phase 1 | Pending |
| 3 | Repository & Development Infrastructure | Phase 2 | Pending |
| 4 | UI/UX Design System & Screen Inventory | Phase 2 | Pending |
| 5 | Authentication, Organization & Access | Phases 3, 4 | Pending |
| 6 | Application Shell & Navigation | Phase 5 | Pending |
| 7 | Shared Frontend Components | Phase 6 | Pending |
| 8 | Database Schema & Data Integrity | Phase 2 | Pending |
| 9 | Backend APIs & Business Rules | Phase 8 | Pending |
| 10 | Shared Infrastructure Services | Phases 8, 9 | Pending |
| 11 | CRM & Relationship Management | Phases 7, 9 | Pending |
| 12 | Sales, Marketing & Commercial | Phase 11 | Pending |
| 13 | Finance | Phases 9, 12 | Pending |
| 14 | Inventory & Procurement | Phases 9, 13 | Pending |
| 15 | Projects, Workforce & Operations | Phases 9, 14 | Pending |
| 16 | Data Quality & Analytics Data Model | Phases 9, 11-15 | Pending |
| 17 | Business Metrics & Analytics Services | Phase 16 | Pending |
| 18 | Dashboards, Reports & Drill-Downs | Phase 17 | Pending |
| 19 | ML Data Pipelines & Feature Engineering | Phase 16 | Pending |
| 20 | ML Models & Evaluation | Phase 19 | Pending |
| 21 | Model Serving & Inference Services | Phase 20 | Pending |
| 22 | Inference Intelligence Engine | Phases 18, 21 | Pending |
| 23 | AI Assistant & Controlled Automation | Phase 22 | Pending |
| 24 | Integrations & SaaS Administration | Phases 10, 23 | Pending |
| 25 | Full-System Verification | All above | Pending |
| 26 | Production Deployment & Handover | Phase 25 | Pending |`
    },
    {
      id: '11.2',
      title: '11.2 Phase Details (1-8)',
      content: `**Phase 1: Master Requirements & Specification**
- Deliverables: All 13 specification documents
- Gate: All documents reviewed and approved
- Status: IN PROGRESS

**Phase 2: Architecture & Technical Contracts**
- Deliverables: Architecture Decision Records, API contracts, technology selections
- Gate: Architecture approved, technology stack confirmed
- Dependencies: Phase 1 complete

**Phase 3: Repository & Development Infrastructure**
- Deliverables: Repository structure, CI/CD pipeline, development environment, linting/formatting
- Gate: Team can build, test and deploy from clean checkout
- Dependencies: Phase 2 complete

**Phase 4: UI/UX Design System & Screen Inventory**
- Deliverables: Component library, design tokens, screen inventory, interaction patterns
- Gate: Design system approved, screen inventory complete
- Dependencies: Phase 2 complete

**Phase 5: Authentication, Organization & Access**
- Deliverables: Auth flow, tenant management, user management, role/permission system
- Gate: Users can authenticate, organizations configured, permissions enforced
- Dependencies: Phases 3, 4 complete

**Phase 6: Application Shell & Navigation**
- Deliverables: App layout, navigation system, routing, loading/error states
- Gate: Navigation works across all planned modules (placeholder content)
- Dependencies: Phase 5 complete

**Phase 7: Shared Frontend Components**
- Deliverables: Form components, table components, modal system, notification system
- Gate: All shared components documented and tested
- Dependencies: Phase 6 complete

**Phase 8: Database Schema & Data Integrity**
- Deliverables: Complete schema, migrations, seed data, integrity tests
- Gate: Schema supports all module entities, migrations tested
- Dependencies: Phase 2 complete`
    },
    {
      id: '11.3',
      title: '11.3 Phase Details (9-16)',
      content: `**Phase 9: Backend APIs & Business Rules**
- Deliverables: API endpoints, business logic, validation, error handling
- Gate: All core APIs functional with tests
- Dependencies: Phase 8 complete

**Phase 10: Shared Infrastructure Services**
- Deliverables: File storage, notifications, background jobs, caching, search
- Gate: All infrastructure services operational
- Dependencies: Phases 8, 9 complete

**Phase 11: CRM & Relationship Management**
- Deliverables: Leads, contacts, companies, activities, full CRM workflow
- Gate: Complete lead-to-contact workflow functional
- Dependencies: Phases 7, 9 complete

**Phase 12: Sales, Marketing & Commercial**
- Deliverables: Opportunities, pipeline, quotations, orders, campaigns
- Gate: Complete opportunity-to-order workflow functional
- Dependencies: Phase 11 complete

**Phase 13: Finance**
- Deliverables: Invoices, payments, expenses, budgets, financial reports
- Gate: Complete invoice-to-payment workflow, financial reports accurate
- Dependencies: Phases 9, 12 complete

**Phase 14: Inventory & Procurement**
- Deliverables: Products, warehouses, stock, suppliers, purchase orders
- Gate: Complete procure-to-stock workflow functional
- Dependencies: Phases 9, 13 complete

**Phase 15: Projects, Workforce & Operations**
- Deliverables: Projects, tasks, workforce, workflows, operational tracking
- Gate: Complete project lifecycle workflow functional
- Dependencies: Phases 9, 14 complete

**Phase 16: Data Quality & Analytics Data Model**
- Deliverables: Analytics schema, ETL processes, data quality monitoring
- Gate: Operational data reliably flows to analytics layer
- Dependencies: Phases 9, 11-15 complete`
    },
    {
      id: '11.4',
      title: '11.4 Phase Details (17-26)',
      content: `**Phase 17: Business Metrics & Analytics Services**
- Deliverables: Metric definitions, calculation services, data freshness tracking
- Gate: All core metrics calculated correctly and verifiably
- Dependencies: Phase 16 complete

**Phase 18: Dashboards, Reports & Drill-Downs**
- Deliverables: Dashboard system, report builder, drill-down paths
- Gate: Users can view, interact with and export analytics
- Dependencies: Phase 17 complete

**Phase 19: ML Data Pipelines & Feature Engineering**
- Deliverables: Feature store, training data pipelines, validation
- Gate: Features computed correctly, training data versioned
- Dependencies: Phase 16 complete

**Phase 20: ML Models & Evaluation**
- Deliverables: Trained models, evaluation results, deployment criteria
- Gate: Models meet performance thresholds on validation data
- Dependencies: Phase 19 complete

**Phase 21: Model Serving & Inference Services**
- Deliverables: Inference API, model registry, monitoring
- Gate: Models serving predictions with latency and accuracy targets
- Dependencies: Phase 20 complete

**Phase 22: Inference Intelligence Engine**
- Deliverables: Orchestration engine, recommendation system, approval gateway
- Gate: End-to-end recommendation-to-action workflow functional
- Dependencies: Phases 18, 21 complete

**Phase 23: AI Assistant & Controlled Automation**
- Deliverables: AI assistant interface, automated workflows, safety controls
- Gate: AI features operational with appropriate safety boundaries
- Dependencies: Phase 22 complete

**Phase 24: Integrations & SaaS Administration**
- Deliverables: Integration framework, admin panel, subscription management
- Gate: External integrations functional, platform administration complete
- Dependencies: Phases 10, 23 complete

**Phase 25: Full-System Verification**
- Deliverables: Integration tests, security audit, performance testing, UAT
- Gate: All acceptance criteria met, no critical issues
- Dependencies: All previous phases complete

**Phase 26: Production Deployment & Handover**
- Deliverables: Production deployment, monitoring, documentation, training
- Gate: System live, monitoring active, handover complete
- Dependencies: Phase 25 complete`
    },
    {
      id: '11.5',
      title: '11.5 Phase Gate Criteria',
      content: `**General Gate Criteria (apply to all phases):**
- All deliverables completed and reviewed
- Automated tests passing (unit, integration where applicable)
- No critical or high-severity issues open
- Documentation updated
- Dependencies verified as satisfied
- Phase-specific acceptance criteria met

**Quality Gates:**
- Code review completed for all changes
- Security review for authentication/authorization changes
- Performance testing for data-intensive features
- Accessibility testing for UI changes
- Tenant isolation testing for multi-tenant features

**Release Gates:**
- Phase 25 (Full Verification) must pass before production
- Security penetration test completed
- Disaster recovery test completed
- Monitoring and alerting verified
- Documentation complete and accurate`
    }
  ]
};

export const doc12: Document = {
  id: 'open-decisions',
  number: 12,
  title: 'Open Decisions and Assumptions',
  shortTitle: 'Open Decisions',
  description: 'Unknowns, conflicting requirements, assumptions, risks and decisions requiring approval.',
  status: 'Recorded',
  sections: [
    {
      id: '12.1',
      title: '12.1 Decisions Requiring Approval',
      content: `**DECISION-001: Backend Architecture**
- Question: Next.js server capabilities vs. dedicated backend service?
- Options: A) Next.js API routes, B) Separate Express/Fastify service, C) Hybrid
- Recommendation: Start with Next.js (Option A) for simplicity, extract if needed
- Impact: Development speed, deployment complexity, team skills required
- Status: PENDING APPROVAL

**DECISION-002: Authentication Provider**
- Question: Which authentication solution to use?
- Options: NextAuth.js, Clerk, Auth0, Supabase Auth, custom
- Factors: Cost, control, MFA support, SSO capability, developer experience
- Status: PENDING APPROVAL

**DECISION-003: Database ORM**
- Question: Prisma vs. Drizzle vs. raw SQL?
- Factors: Type safety, migration management, performance, team preference
- Status: PENDING APPROVAL

**DECISION-004: Cloud Provider**
- Question: AWS, GCP, Azure, or other?
- Factors: Target market, compliance needs, cost, team expertise
- Status: PENDING APPROVAL

**DECISION-005: Real-time Strategy**
- Question: WebSockets, SSE, or polling for real-time updates?
- Factors: Use case requirements, infrastructure complexity, scalability
- Status: PENDING APPROVAL

**DECISION-006: ML Infrastructure**
- Question: Self-hosted ML vs. managed ML services?
- Factors: Cost, control, scalability, team expertise
- Status: PENDING APPROVAL

**DECISION-007: Multi-language Support**
- Question: Is internationalization (i18n) required for initial release?
- Factors: Target market languages, development complexity
- Status: PENDING APPROVAL

**DECISION-008: Mobile Application**
- Question: Responsive web only, or native mobile app as well?
- Factors: User needs, development cost, maintenance burden
- Status: PENDING APPROVAL`
    },
    {
      id: '12.2',
      title: '12.2 Assumptions to Validate',
      content: `**ASSUMPTION-001:** The target market includes Tanzania and East Africa primarily, with potential for international expansion.
- Validation needed: Confirm target geography and any data residency implications.

**ASSUMPTION-002:** The initial user base will be small-to-medium businesses (SMBs) with potential to serve larger organizations.
- Validation needed: Confirm target organization size and implications for architecture.

**ASSUMPTION-003:** English will be the primary language for the initial release.
- Validation needed: Confirm language requirements.

**ASSUMPTION-004:** The development team has experience with TypeScript, React and PostgreSQL.
- Validation needed: Confirm team skills and training needs.

**ASSUMPTION-005:** Internet connectivity in the target market may be intermittent, requiring offline-capable features or graceful degradation.
- Validation needed: Confirm connectivity assumptions and required offline capabilities.

**ASSUMPTION-006:** The platform will be offered as a SaaS subscription service.
- Validation needed: Confirm business model and pricing strategy.

**ASSUMPTION-007:** Existing authentication system (if any) should be preserved where working.
- Validation needed: Confirm if existing auth exists and its status.

**ASSUMPTION-008:** The data marketplace is a future feature, not required for initial release.
- Validation needed: Confirm timeline expectations for marketplace feature.`
    },
    {
      id: '12.3',
      title: '12.3 Identified Risks',
      content: `**RISK-001: Scope Complexity**
- Description: The platform scope is very large (20+ modules, ML, multi-industry)
- Impact: Extended development timeline, potential for incomplete features
- Mitigation: Strict phase gating, MVP approach per module, clear prioritization
- Probability: HIGH

**RISK-002: ML Accuracy Expectations**
- Description: ML predictions may not meet user expectations without sufficient data
- Impact: User dissatisfaction, loss of trust in AI features
- Mitigation: Clear uncertainty communication, minimum data thresholds, progressive rollout
- Probability: MEDIUM

**RISK-003: Multi-Tenant Security**
- Description: Cross-tenant data leakage could be catastrophic
- Impact: Legal liability, loss of all customers, reputational damage
- Mitigation: Defense-in-depth, automated testing, penetration testing, RLS policies
- Probability: LOW (with proper controls)

**RISK-004: Industry Configuration Complexity**
- Description: Supporting all industries with appropriate configuration is complex
- Impact: Generic experience that doesn't serve any industry well
- Mitigation: Strong universal core, curated industry profiles, extension framework
- Probability: MEDIUM

**RISK-005: Performance at Scale**
- Description: Analytics and AI features may not perform well with large datasets
- Impact: Slow dashboards, delayed insights, poor user experience
- Mitigation: Analytics data model, pre-aggregation, query optimization, caching
- Probability: MEDIUM

**RISK-006: Regulatory Compliance**
- Description: Operating across multiple jurisdictions creates compliance complexity
- Impact: Legal risk, potential fines, market access restrictions
- Mitigation: Legal review, privacy-by-design, configurable data handling
- Probability: MEDIUM`
    },
    {
      id: '12.4',
      title: '12.4 Potential Conflicts',
      content: `**CONFLICT-001: Simplicity vs. Comprehensiveness**
- Tension: Universal platform must be simple enough for SMBs but comprehensive enough for enterprises
- Proposed resolution: Role-aware interfaces, progressive disclosure, configurable complexity

**CONFLICT-002: AI Automation vs. Human Control**
- Tension: AI should automate where possible but humans must maintain control
- Proposed resolution: Recommendations require approval, automation is opt-in, clear human override

**CONFLICT-003: Industry Specificity vs. Universal Core**
- Tension: Industry-specific features add value but increase complexity
- Proposed resolution: Strong universal core + optional industry extensions + custom configuration

**CONFLICT-004: Data Richness vs. Privacy**
- Tension: More data enables better AI but increases privacy obligations
- Proposed resolution: Data minimization by default, explicit consent for optional data, privacy-by-design

**CONFLICT-005: Speed of Development vs. Quality**
- Tension: Large scope creates pressure to ship quickly vs. need for reliability
- Proposed resolution: Phase-gated development, quality gates, no shortcuts on security`
    },
    {
      id: '12.5',
      title: '12.5 Items Needing Clarification',
      content: `**CLARIFICATION-001:** Is there an existing codebase or authentication system to preserve?
- Impact: Affects Phase 3 and Phase 5 approach

**CLARIFICATION-002:** What is the expected timeline for each phase?
- Impact: Affects resource planning and scope negotiation

**CLARIFICATION-003:** What is the development team size and composition?
- Impact: Affects parallelism and phase sequencing

**CLARIFICATION-004:** Are there specific compliance certifications required (ISO 27001, SOC 2, etc.)?
- Impact: Affects security architecture and documentation requirements

**CLARIFICATION-005:** What is the budget range for cloud infrastructure?
- Impact: Affects technology choices and architecture decisions

**CLARIFICATION-006:** Are there existing integrations that must be supported from day one?
- Impact: Affects Phase 24 prioritization

**CLARIFICATION-007:** What is the expected initial tenant count?
- Impact: Affects scaling strategy and infrastructure sizing

**CLARIFICATION-008:** Is there a preference for self-hosted vs. managed services for ML?
- Impact: Affects ML architecture decisions`
    }
  ]
};

export const doc13: Document = {
  id: 'project-status',
  number: 13,
  title: 'Project Status',
  shortTitle: 'Status',
  description: 'Current stage, approved decisions, completed documentation, unresolved issues and next permitted action.',
  status: 'Recorded',
  sections: [
    {
      id: '13.1',
      title: '13.1 Current Stage',
      content: `**Stage:** 1 — Master Project Requirements, System Vision and Development Control

**Stage Status:** Documentation in progress

**Stage Objective:** Document and organize the complete project vision, requirements, constraints and development roadmap before any implementation begins.

**Authorization:** Documentation and planning only. No implementation code, database migrations, UI implementation, model training or inference engine development.`
    },
    {
      id: '13.2',
      title: '13.2 Completed Documentation',
      content: `**Documents Created (Stage 1):**

| # | Document | Status |
|---|----------|--------|
| 1 | Master Project Specification | Recorded |
| 2 | Module and Feature Inventory | Recorded |
| 3 | Industry Adaptation Specification | Recorded |
| 4 | Roles and Permission Model | Recorded |
| 5 | Business Workflow Catalog | Recorded |
| 6 | System Architecture Plan | Proposed (pending approval) |
| 7 | Database and Data Domain Plan | Recorded |
| 8 | AI/ML and Inference Specification | Recorded |
| 9 | UI/UX Design Requirements | Recorded |
| 10 | Security, Privacy and Compliance Requirements | Recorded |
| 11 | Development Roadmap | Recorded |
| 12 | Open Decisions and Assumptions | Recorded |
| 13 | Project Status | Recorded |

**Traceability Matrix:** Requirements documented with IDs (REQ-F001 through REQ-F015, REQ-NF001 through REQ-NF010). Full traceability matrix to be completed as requirements are refined.`
    },
    {
      id: '13.3',
      title: '13.3 Approved Decisions',
      content: `**Confirmed Decisions:**
1. Product is a universal, multi-tenant business platform
2. All industries must be supported (not limited to predefined list)
3. Custom industries must never prevent platform usage
4. Intelligence cycle must distinguish facts from predictions
5. AI must not fabricate evidence or present uncertainty as fact
6. Tenant isolation is non-negotiable
7. Default-deny authorization model
8. Platform admins cannot access tenant data by default
9. Modular monolith architecture (proposed, pending formal approval)
10. 26-phase development roadmap (sequence recorded, pending approval)
11. Strict TypeScript with no \`any\` types
12. Schema-first development approach
13. Documentation must precede implementation

**Pending Decisions:**
- See Document 12 (Open Decisions and Assumptions) for 8 decisions requiring approval
- See Document 6 (Architecture Plan) for 8 ADRs requiring approval`
    },
    {
      id: '13.4',
      title: '13.4 Unresolved Issues',
      content: `**Unresolved Items:**

1. No existing codebase confirmed — need to clarify if starting from scratch
2. Authentication provider not yet selected
3. Cloud provider not yet selected
4. Target market geography and compliance requirements need legal review
5. Development team size and skills not confirmed
6. Timeline expectations not established
7. Budget constraints not defined
8. Mobile application requirements not clarified
9. Internationalization requirements not confirmed
10. Data residency requirements for Tanzania and other jurisdictions need legal analysis

**Blocking Issues:** None — documentation can proceed without these answers, but they will be needed before implementation begins.`
    },
    {
      id: '13.5',
      title: '13.5 Next Permitted Action',
      content: `**Current Permission:** Documentation and planning ONLY.

**Recommended Next Phase:** Phase 2 — Architecture and Technical Contracts

**Phase 2 Scope (when authorized):**
- Finalize architecture decisions (ADR-001 through ADR-008)
- Define API contracts and data schemas
- Select technology stack with justification
- Define module boundaries and interfaces
- Create technical specification for each module
- Establish development standards and conventions

**Prerequisites for Phase 2:**
- Phase 1 documentation approved by project owner
- Open decisions resolved or explicitly deferred
- Architecture direction confirmed

**STOPPING POINT:** This documentation stage is complete. Awaiting explicit instruction to proceed to Phase 2 or to modify any documented requirements.`
    }
  ]
};
