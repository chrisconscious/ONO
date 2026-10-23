import { Document } from './types';

export const stage4Doc13: Document = {
  id: 'open-decisions-stage4',
  number: 13,
  title: 'Open Decisions and Assumptions (Stage 4 Update)',
  shortTitle: 'Open Decisions',
  description: 'Updated from Stages 1-3. Preserves all previous entries and adds Stage 4 findings.',
  status: 'Updated',
  stage: 4,
  sections: [
    {
      id: 'OD4-1',
      title: '1. Decisions Still Requiring Approval',
      content: `**From Stages 1-3 (Unchanged):**
- Authentication provider (NextAuth, Clerk, Auth0, Supabase, or custom)
- Cloud provider (AWS, GCP, Azure, Vercel)
- Target market compliance requirements (legal review)
- Development team size and skills
- Timeline and budget
- All ADRs from Stage 2 (modular monolith, Next.js, PostgreSQL+Prisma, Python ML, RLS+middleware, selective events)
- Stage 3 decisions (pnpm, Turborepo, Vitest, Playwright)

**From Stage 4 (New):**
- Dark mode scope: Not in initial release (proposed)
- AI assistant interface: Floating chat panel (proposed)
- Tutorial approach: Interactive spotlight-based (proposed)
- Icon library: Lucide React (proposed)
- Typography: Inter + JetBrains Mono (proposed)

**All decisions documented with rationale in respective Stage 4 documents.**`
    },
    {
      id: 'OD4-2',
      title: '2. Assumptions Validated in Stage 4',
      content: `**Design Assumptions:**
- ASSUMPTION-015: Inter font is acceptable for the platform
- ASSUMPTION-016: Lucide React icons are compatible with the approved stack
- ASSUMPTION-017: Navy (#172B4D) and Blue (#2563EB) palette is approved
- ASSUMPTION-018: No dark mode required for initial release
- ASSUMPTION-019: WCAG 2.2 AA is the target accessibility standard
- ASSUMPTION-020: Mobile-first responsive design is acceptable

**UX Assumptions:**
- ASSUMPTION-021: Split-screen authentication layout is acceptable for desktop
- ASSUMPTION-022: Left sidebar navigation is the primary navigation pattern
- ASSUMPTION-023: Role-specific dashboards are valuable for different user types
- ASSUMPTION-024: AI assistant as floating chat panel is acceptable
- ASSUMPTION-025: Interactive tutorial with spotlight is preferred over video

**All assumptions require validation before implementation.**`
    },
    {
      id: 'OD4-3',
      title: '3. Open Questions for Design Review',
      content: `**Design Review Questions:**

**Group A (Foundations):**
- Is the navy/blue/white palette approved for the brand?
- Are the proposed typography choices (Inter, JetBrains Mono) acceptable?
- Is the component set comprehensive enough for initial release?

**Group B (Onboarding/Navigation):**
- Is the 6-8 step onboarding flow appropriate length?
- Should organization switching be in initial release?
- Are the proposed navigation groups logical?

**Group C (CRM/Sales):**
- Is Kanban or list view preferred for pipeline?
- Should bulk actions be in initial release?
- Are the proposed form patterns clear enough?

**Group D (Finance/Operations):**
- Are the financial workflows accurate for target industries?
- Should Gantt charts be in initial release?
- Are approval flows clear enough?

**Group E (BI/AI):**
- Is the 7-step intelligence cycle clear to users?
- Should AI assistant be in initial release or phased?
- Are dashboard widgets appropriate for each role?

**Group F (Admin):**
- Are admin interfaces comprehensive enough?
- Should integration configuration be in initial release?
- Is audit log presentation clear enough?

**Group G (Accessibility/Responsive):**
- Is WCAG 2.2 AA achievable within timeline?
- Are responsive breakpoints appropriate?
- Should all animations be in initial release?`
    }
  ]
};

export const stage4Doc14: Document = {
  id: 'project-status-stage4',
  number: 14,
  title: 'Project Status (Stage 4 Update)',
  shortTitle: 'Status',
  description: 'Updated project status reflecting Stage 4 completion. Current stage, deliverables, and next steps.',
  status: 'Updated',
  stage: 4,
  sections: [
    {
      id: 'PS4-1',
      title: '1. Current Stage',
      content: `**Stage:** 4 — Complete UI/UX Design and Screen Specification

**Stage Status:** Documentation complete

**Stage Objective:** Define the complete user experience, design system, screen inventory, navigation, interaction patterns, onboarding, animations, responsive behavior, accessibility standards, and role-specific user journeys.

**Authorization:** Documentation and design planning only. No implementation code, components, styling, authentication changes, screens, or animations created.`
    },
    {
      id: 'PS4-2',
      title: '2. Completed Documentation',
      content: `**Stage 1 Documents (13):** Requirements, modules, industry adaptation, roles, workflows, architecture plan, database plan, AI/ML spec, UI/UX requirements, security, roadmap, open decisions, project status.

**Stage 2 Documents (13):** System architecture, ADRs, tech stack, module dependencies, API/event contracts, data architecture, tenancy/authorization, industry configuration, AI/ML architecture, reliability, implementation sequence, updated decisions, updated status.

**Stage 3 Documents (12):** Repository structure, development environment, engineering standards, testing strategy, CI/CD, database migrations, security controls, AI/ML DevOps, observability, implementation sequence, updated decisions, updated status.

**Stage 4 Documents (14):**
1. UI/UX Design System
2. Complete Screen Inventory
3. Information Architecture and Navigation
4. Role-Specific Dashboard Specifications
5. Authentication and Account Access UX
6. Onboarding and Guided Tutorial Specification
7. Business Intelligence and Decision UX
8. Industry-Adaptive UX Specification
9. Interaction and Animation Guidelines
10. Forms, Tables, and Workflow Interactions
11. Accessibility and Responsive Design Specification
12. UI/UX Acceptance Criteria
13. Open Decisions and Assumptions (Updated)
14. Project Status (Updated)

**Total: 52 documents across 4 stages.**`
    },
    {
      id: 'PS4-3',
      title: '3. Key Design Decisions',
      content: `**Visual Identity:**
- Primary navy: #172B4D
- Primary blue: #2563EB
- Typography: Inter (sans) + JetBrains Mono (monospace)
- Icons: Lucide React (outline, 1.5px stroke)
- Spacing: 4px base scale
- Border radius: 4px (sm), 6px (md), 8px (lg), 12px (xl)

**Navigation:**
- Left sidebar (collapsible) for primary navigation
- Top bar for global actions (search, notifications, user menu)
- Breadcrumbs for context
- Role-based navigation (only show permitted modules)

**Authentication:**
- Split-screen layout for desktop (image + form)
- Single column for mobile
- MFA support with 6-digit code input
- Password recovery flow
- Session management with expiry warnings

**Onboarding:**
- 6-8 step guided flow
- Industry selection (catalogue + custom)
- Module activation with AI suggestions
- Team setup and invitations
- Optional guided tutorial

**Dashboards:**
- Role-specific dashboards (CEO, Sales Manager, Sales Rep, Finance, etc.)
- KPI cards, charts, tables, insights, recommendations
- Customizable widget layout
- Data freshness indicators

**Intelligence:**
- 7-step intelligence cycle (observation → explanation → prediction → options → recommendation → approval → outcome)
- Insight cards with evidence
- Prediction cards with confidence and uncertainty
- Recommendation cards with approval flows
- AI assistant as floating chat panel

**Industry Adaptation:**
- Searchable industry catalogue
- Custom industry support (never blocked)
- Configurable terminology
- Module activation per industry
- AI-assisted configuration suggestions

**Accessibility:**
- WCAG 2.2 AA target
- Keyboard navigation throughout
- Screen reader support
- Color contrast 4.5:1 minimum
- Reduced-motion preferences respected

**Responsive:**
- Mobile-first approach
- Breakpoints: 640px, 1024px, 1280px
- Tables convert to cards on mobile
- Navigation collapses to hamburger on mobile`
    },
    {
      id: 'PS4-4',
      title: '4. What Was Inspected',
      content: `**Existing Repository:**
- Documentation viewer from Stages 1-3
- Vite + React 18 + TypeScript 5.7 + Tailwind CSS 4
- No existing design system or components
- No existing screens beyond documentation viewer

**Previous Stage Review:**
- Reviewed all 38 documents from Stages 1-3
- Verified consistency with architectural decisions
- Confirmed UI/UX requirements from Stage 1 (Document 9)
- Aligned with security and accessibility requirements

**Design Consistency:**
- All designs align with Stage 1 UI/UX requirements
- All designs support Stage 2 architecture (modular monolith, multi-tenant)
- All designs support Stage 3 engineering standards (TypeScript, accessibility)
- No conflicts with previous stages`
    },
    {
      id: 'PS4-5',
      title: '5. Conflicts with Previous Stages',
      content: `**No Conflicts Found:**
- Stage 4 designs are consistent with Stage 1 requirements
- Stage 4 designs are consistent with Stage 2 architecture
- Stage 4 designs are consistent with Stage 3 engineering standards
- All accessibility requirements met (WCAG 2.2 AA)
- All security requirements respected (tenant isolation, permissions)
- All business requirements supported (all modules, all industries)

**Clarifications:**
- Dark mode not in initial release (consistent with Stage 1 scope)
- AI assistant is optional feature (can be phased)
- Tutorial is optional (user can skip)
- All designs are implementable within approved architecture`
    },
    {
      id: 'PS4-6',
      title: '6. Recommended Next Stage',
      content: `**Next Phase:** Phase 5 — Authentication, Organization, and Access Foundation

**Phase 5 Scope:**
- Authentication implementation (sign-in, MFA, password recovery)
- Organization and tenant management
- User management and invitations
- Role and permission system
- Session management
- Initial database schema for auth/organization

**Prerequisites for Phase 5:**
- Stage 4 documentation approved
- All technology decisions confirmed (ADR-001 through ADR-006)
- Authentication provider selected
- Repository structure approved (Stage 3)

**STOPPING POINT:** Stage 4 documentation is complete. Awaiting explicit instruction to proceed to Phase 5 or to modify any design decisions.

**No implementation files or infrastructure were created or modified during this stage.**`
    }
  ]
};
