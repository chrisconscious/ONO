import { Document } from './types';

export const stage7Doc13: Document = {
  id: 'open-decisions-stage7',
  number: 13,
  title: 'Open Decisions and Assumptions (Stage 7 Update)',
  shortTitle: 'Open Decisions',
  description: 'Updated from Stages 1-6. Preserves all previous entries and adds Stage 7 security findings.',
  status: 'Updated',
  stage: 7,
  sections: [
    {
      id: 'OD7-1',
      title: '1. Decisions Still Requiring Approval',
      content: `**From Stages 1-6 (Unchanged):**
- Authentication provider (NextAuth, Clerk, Auth0, Supabase, or custom)
- Cloud provider (AWS, GCP, Azure, Vercel)
- Target market compliance requirements (legal review)
- Development team size and skills
- Timeline and budget
- All ADRs from Stage 2 (modular monolith, Next.js, PostgreSQL+Prisma, Python ML, RLS+middleware, selective events)
- Stage 3 decisions (pnpm, Turborepo, Vitest, Playwright)
- Stage 4 decisions (dark mode scope, AI assistant interface, tutorial approach, icon library, typography)
- Stage 6 decisions (workflow automation risk levels, approval thresholds, KPI definitions)

**From Stage 7 (New):**
- Security: Multi-factor authentication requirement (mandatory for all users - proposed)
- Security: Password policy (12 characters minimum with complexity - proposed)
- Security: Session timeout (8 hours - proposed)
- Security: Audit log retention (7 years - proposed)
- Security: Backup encryption (AES-256 - proposed)
- Security: Incident response team structure (proposed)
- Security: Penetration testing frequency (quarterly - proposed)
- Privacy: Data retention policies per classification (proposed)
- Privacy: Cross-border data transfer mechanisms (requires legal review)
- Privacy: AI data processing consent model (proposed)

**All decisions documented with rationale in respective Stage 7 documents.**`
    },
    {
      id: 'OD7-2',
      title: '2. Assumptions Validated in Stage 7',
      content: `**Security Assumptions:**
- ASSUMPTION-026: Three-layer tenant isolation (RLS + middleware + service) is sufficient
- ASSUMPTION-027: RBAC + ABAC combined model meets authorization requirements
- ASSUMPTION-028: bcrypt/argon2 password hashing is acceptable
- ASSUMPTION-029: AES-256 encryption is sufficient for data at rest
- ASSUMPTION-030: TLS 1.3 is required for all data in transit
- ASSUMPTION-031: Quarterly penetration testing is sufficient
- ASSUMPTION-032: 7-year audit log retention meets compliance requirements

**Privacy Assumptions:**
- ASSUMPTION-033: Four-level data classification (Public, Internal, Confidential, Highly Restricted) is appropriate
- ASSUMPTION-034: Data minimization principles can be enforced technically
- ASSUMPTION-035: Consent management system can be implemented as specified
- ASSUMPTION-036: Right to erasure can be implemented within 30 days
- ASSUMPTION-037: Cross-border data transfers can be managed with standard contractual clauses

**AI Security Assumptions:**
- ASSUMPTION-038: Prompt injection can be mitigated with input sanitization
- ASSUMPTION-039: AI tenant isolation can be enforced at context retrieval level
- ASSUMPTION-040: AI action approval workflows can be integrated with existing approval framework
- ASSUMPTION-041: Model provider security requirements can be enforced contractually

**All assumptions require validation before implementation.**`
    },
    {
      id: 'OD7-3',
      title: '3. Open Questions for Security Review',
      content: `**Security Review Questions:**

**Authentication:**
- Should MFA be mandatory for all users or optional?
- What password complexity requirements should be enforced?
- Should we support passwordless authentication (WebAuthn)?
- What is the acceptable session timeout duration?

**Authorization:**
- Should we implement attribute-based access control (ABAC) in addition to RBAC?
- How should we handle cross-department data access?
- Should we implement just-in-time access provisioning?
- What is the maximum acceptable approval chain length?

**Tenant Isolation:**
- Is three-layer isolation (RLS + middleware + service) sufficient?
- Should we implement separate databases per tenant for high-security tenants?
- How should we handle tenant data deletion requests?
- What is the acceptable RTO/RPO for tenant data?

**Data Protection:**
- What encryption algorithms should be used for different data classifications?
- Should we implement client-side encryption for highly restricted data?
- How should we handle encryption key rotation?
- What is the acceptable key management approach?

**AI Security:**
- Should we implement AI output filtering for sensitive data?
- How should we handle AI model updates and versioning?
- What is the acceptable false positive rate for AI security controls?
- Should we implement AI-specific audit logging?

**Compliance:**
- What specific regulations apply to our target markets?
- Should we pursue SOC 2, ISO 27001, or other certifications?
- How should we handle data subject access requests?
- What is the acceptable data breach notification timeline?

**Incident Response:**
- What is the acceptable incident response time for each severity level?
- Should we establish a dedicated security operations center (SOC)?
- How should we coordinate with law enforcement in case of incidents?
- What is the acceptable incident communication timeline?`
    },
    {
      id: 'OD7-4',
      title: '4. Security Risks Requiring Attention',
      content: `**Critical Risks:**
- RISK-SEC-001: Cross-tenant data access if RLS policies misconfigured
  - Mitigation: Comprehensive RLS testing, automated validation
  - Status: Controls designed, implementation pending
  
- RISK-SEC-002: AI prompt injection leading to unauthorized actions
  - Mitigation: Input sanitization, output validation, action approval
  - Status: Controls designed, implementation pending
  
- RISK-SEC-003: Credential theft leading to account takeover
  - Mitigation: MFA, strong password policy, session security
  - Status: Controls designed, implementation pending

**High Risks:**
- RISK-SEC-004: SQL injection in custom queries
  - Mitigation: Parameterized queries, input validation, WAF
  - Status: Controls designed, implementation pending
  
- RISK-SEC-005: Sensitive data exposure in logs
  - Mitigation: Log sanitization, field-level encryption
  - Status: Controls designed, implementation pending
  
- RISK-SEC-006: Integration credential compromise
  - Mitigation: Encrypted storage, rotation, least privilege
  - Status: Controls designed, implementation pending

**Medium Risks:**
- RISK-SEC-007: AI model provider data leakage
  - Mitigation: Provider security requirements, data minimization
  - Status: Controls designed, implementation pending
  
- RISK-SEC-008: Backup data compromise
  - Mitigation: Encryption, access control, secure storage
  - Status: Controls designed, implementation pending
  
- RISK-SEC-009: Insider threat (privileged users)
  - Mitigation: Separation of duties, audit logging, monitoring
  - Status: Controls designed, implementation pending

**All risks documented in SECURITY_THREAT_MODEL.md with detailed mitigation plans.**`
    }
  ]
};

export const stage7Doc14: Document = {
  id: 'project-status-stage7',
  number: 14,
  title: 'Project Status (Stage 7 Update)',
  shortTitle: 'Status',
  description: 'Updated project status reflecting Stage 7 completion with comprehensive security specifications.',
  status: 'Updated',
  stage: 7,
  sections: [
    {
      id: 'PS7-1',
      title: '1. Current Stage',
      content: `**Stage:** 7 — Security, Identity, Permissions, Privacy, and Audit Design

**Stage Status:** Documentation complete

**Stage Objective:** Define comprehensive security specifications including threat modeling, authentication, authorization, tenant isolation, data protection, audit logging, AI security, and incident response.

**Authorization:** Documentation and security analysis only. No implementation of authentication, authorization, security middleware, database policies, or audit systems.`
    },
    {
      id: 'PS7-2',
      title: '2. Completed Documentation',
      content: `**Stage 1 Documents (13):** Requirements, modules, industry adaptation, roles, workflows, architecture plan, database plan, AI/ML spec, UI/UX, security, roadmap, open decisions, project status.

**Stage 2 Documents (13):** System architecture, ADRs, tech stack, module dependencies, API/event contracts, data architecture, tenancy/authorization, industry configuration, AI/ML architecture, reliability, implementation sequence, updated decisions, updated status.

**Stage 3 Documents (12):** Repository structure, development environment, engineering standards, testing strategy, CI/CD, database migrations, security controls, AI/ML DevOps, observability, implementation sequence, updated decisions, updated status.

**Stage 4 Documents (14):** Design system, screen inventory, navigation, dashboards, authentication UX, onboarding, BI UX, industry UX, interactions, forms/tables, accessibility, acceptance criteria, updated decisions, updated status.

**Stage 5 Documents (7):** Data domain catalog, business entity catalog, logical data model, entity relationship diagrams, tenant data ownership matrix, data integrity and business invariants, updated project status.

**Stage 6 Documents (9):** Core business workflow catalog, business rules catalog, cross-department workflows, approval and delegation framework, workflow automation specification, business KPI and outcome catalog, industry workflow configuration, workflow acceptance criteria, updated project status.

**Stage 7 Documents (12):**
1. Security Threat Model
2. Identity and Authentication Specification
3. Authorization and Permission Matrix
4. Multi-Tenant Security Controls
5. Platform and Privileged Access Policy
6. API and Application Security Requirements
7. Data Classification and Privacy Policy
8. Audit Logging and Accountability Specification
9. AI/ML Security and Data Boundaries
10. File, Export, and Integration Security
11. Security Testing and Acceptance Criteria
12. Security Incident Response Plan
13. Open Decisions and Assumptions (Updated)
14. Project Status (Updated)

**Total: 80 documents across 7 stages.**`
    },
    {
      id: 'PS7-3',
      title: '3. Key Security Decisions',
      content: `**Threat Model:**
- 26 critical threats identified across 7 categories
- Defense-in-depth strategy with multiple security layers
- Risk-based prioritization (Critical, High, Medium, Low)
- Comprehensive mitigation strategies for each threat

**Authentication:**
- Session-based authentication with secure cookies
- Multi-factor authentication support (TOTP, SMS, Email)
- Strong password requirements (configurable per tenant)
- Account lockout and rate limiting
- Suspicious login detection

**Authorization:**
- Combined RBAC + ABAC model
- Granular permissions (action + resource + scope)
- Data scope enforcement (own/team/department/branch/org)
- Approval workflows for sensitive operations
- Separation of duties enforcement

**Tenant Isolation:**
- Three-layer defense: RLS + middleware + service checks
- No cross-tenant foreign keys
- Tenant context from session (never from client)
- Comprehensive isolation testing
- Complete audit trail

**Data Protection:**
- Four-level classification (Public, Internal, Confidential, Highly Restricted)
- Encryption in transit (TLS 1.3) and at rest (AES-256)
- Field-level encryption for PII
- Data minimization and purpose limitation
- Retention policies per classification

**Audit Logging:**
- Comprehensive audit event model
- Immutable audit logs (cannot be modified)
- 7-year retention for security events
- Real-time monitoring and alerting
- Anomaly detection

**AI Security:**
- Tenant-scoped AI context retrieval
- Authorization before data reaches models
- Prompt injection prevention
- Action approval for consequential operations
- Complete audit trail

**Incident Response:**
- Defined incident response team structure
- Four severity levels (Critical, High, Medium, Low)
- Comprehensive response procedures
- Communication plans (internal and external)
- Post-incident review and improvement`
    },
    {
      id: 'PS7-4',
      title: '4. What Was Inspected',
      content: `**Existing Documentation Reviewed:**
- All 68 documents from Stages 1-6
- Existing security controls from Stage 3
- Tenancy and authorization architecture from Stage 2
- Data architecture and classification from Stage 5
- Workflow and approval frameworks from Stage 6

**Security Standards Reviewed:**
- OWASP Top 10
- NIST Cybersecurity Framework
- NIST SP 800-53 (Security and Privacy Controls)
- ISO 27001 (Information Security Management)
- GDPR (if applicable)
- Industry best practices

**Existing Repository:**
- Documentation viewer from Stages 1-6
- Vite + React 18 + TypeScript 5.7 + Tailwind CSS 4
- No existing security implementation
- No authentication or authorization code
- No audit logging implementation`
    },
    {
      id: 'PS7-5',
      title: '5. Conflicts with Previous Stages',
      content: `**No Conflicts Found:**
- Security model consistent with Stage 1 requirements
- Security model consistent with Stage 2 architecture
- Security model consistent with Stage 3 engineering standards
- Security model supports Stage 4 UI/UX requirements
- Security model supports Stage 5 data model
- Security model supports Stage 6 workflows

**Enhancements:**
- Stage 7 provides comprehensive security specifications beyond Stage 2/3 overview
- Stage 7 adds detailed threat model not in previous stages
- Stage 7 adds complete authorization matrix not in previous stages
- Stage 7 adds incident response plan not in previous stages
- Stage 7 adds security testing strategy not in previous stages

**Alignment:**
- All security controls align with modular monolith architecture
- All security controls support multi-tenant isolation
- All security controls support configurable roles and permissions
- All security controls support industry adaptation
- All security controls support AI/ML capabilities`
    },
    {
      id: 'PS7-6',
      title: '6. Recommended Next Stage',
      content: `**Next Phase:** Phase 8 — Database Schema and Data Integrity

**Phase 8 Scope:**
- Implement Prisma schema based on Stage 5 logical data model
- Create initial database migrations
- Implement Row-Level Security (RLS) policies
- Set up seed data for development
- Implement tenant context management
- Test tenant isolation at database level
- Implement audit logging at database level

**Prerequisites for Phase 8:**
- Stage 7 documentation approved (security specifications)
- Repository structure implemented (Stage 3)
- Development environment set up (Stage 3)
- Authentication provider selected
- All security decisions approved

**Alternative Next Phase:**
If frontend implementation is preferred:
- Phase 7 (from roadmap): Shared Frontend Components
- Implement design system components
- Implement shared UI components
- Implement form components
- Implement table and list components

**STOPPING POINT:** Stage 7 documentation is complete. Awaiting explicit instruction to proceed to Phase 8 (Database Schema) or Phase 7 (Frontend Components), or to create additional Stage 7 documents.

**No implementation files or infrastructure were created or modified during this stage.**`
    }
  ]
};
