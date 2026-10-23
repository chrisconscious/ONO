import { Document } from './types';

export const stage15Doc11: Document = {
  id: 'accessibility-responsive',
  number: 11,
  title: 'Accessibility and Responsive Acceptance Criteria',
  shortTitle: 'Accessibility',
  description: 'WCAG 2.2 AA compliance requirements and responsive design acceptance criteria.',
  status: 'Recorded',
  stage: 15,
  sections: [
    {
      id: '15.11.1',
      title: '1. WCAG 2.2 AA Compliance',
      content: `**Core Requirements:**

**1. Perceivable:**
- All images have alt text
- Color contrast ratio ≥ 4.5:1 for normal text
- Color contrast ratio ≥ 3:1 for large text
- Text can be resized up to 200% without loss of content
- Content can be presented in different ways without loss of information

**2. Operable:**
- All functionality available via keyboard
- No keyboard traps
- Users can skip repetitive content
- Page titles describe topic or purpose
- Link text describes destination
- Focus indicator visible on all interactive elements
- Touch targets ≥ 44x44px

**3. Understandable:**
- Page language identified
- Focus does not change unexpectedly
- Navigation consistent across pages
- Error identification and suggestions provided
- Form labels clear and descriptive

**4. Robust:**
- Valid HTML markup
- Name, role, value available for all UI components
- Status messages programmatically determined

**Testing Requirements:**
- Automated testing (axe-core, Lighthouse)
- Manual keyboard testing
- Screen reader testing (NVDA, VoiceOver)
- Color contrast verification
- Zoom testing (200%, 400%)
- Mobile device testing`
    },
    {
      id: '15.11.2',
      title: '2. Responsive Design',
      content: `**Breakpoints:**
\`\`\`css
/* Mobile first */
mobile: 0 - 639px
tablet: 640px - 1023px
desktop: 1024px - 1279px
wide: 1280px+
\`\`\`

**Responsive Behavior:**

**Navigation:**
- Mobile: Hamburger menu, bottom navigation
- Tablet: Collapsible sidebar
- Desktop: Full sidebar

**Tables:**
- Mobile: Card view or horizontal scroll
- Tablet: Reduced columns
- Desktop: Full table

**Forms:**
- Mobile: Single column, stacked
- Tablet: Two columns where appropriate
- Desktop: Multi-column layouts

**Dashboards:**
- Mobile: Stacked widgets, simplified view
- Tablet: 2-column grid
- Desktop: 3-4 column grid

**Modals:**
- Mobile: Full-screen or bottom sheet
- Tablet: Centered modal
- Desktop: Centered modal

**Touch Targets:**
- Minimum 44x44px
- Adequate spacing between targets
- No accidental taps

**Text Scaling:**
- Support browser zoom up to 200%
- No horizontal scroll at 200% zoom
- Text remains readable

**Orientation:**
- Support both portrait and landscape
- No fixed orientation requirements`
    }
  ]
};

export const stage15Doc12: Document = {
  id: 'design-handoff-process',
  number: 12,
  title: 'Design-to-Development Handoff and Approval Process',
  shortTitle: 'Handoff Process',
  description: 'Process for transitioning from design to development with approval gates and quality checks.',
  status: 'Recorded',
  stage: 15,
  sections: [
    {
      id: '15.12.1',
      title: '1. Handoff Workflow',
      content: `**Handoff Stages:**

**Stage 1: Design Complete**
- All screens specified
- Component inventory created
- Interaction contracts defined
- Accessibility requirements documented
- Status: "Design Complete"

**Stage 2: Design Review**
- Product manager review
- Engineering lead review
- Security review (if applicable)
- Accessibility review
- Status: "In Review"

**Stage 3: Revisions (if needed)**
- Address feedback
- Update specifications
- Re-review
- Status: "Changes Required"

**Stage 4: Design Approved**
- All reviewers approve
- Specifications finalized
- Status: "Approved"

**Stage 5: Development Ready**
- All dependencies resolved
- API contracts defined
- Data models confirmed
- Status: "Ready for Development"

**Stage 6: In Development**
- Development in progress
- Regular check-ins
- Status: "In Development"

**Stage 7: Development Complete**
- Code complete
- Unit tests passing
- Status: "Development Complete"

**Stage 8: Design QA**
- Visual QA against specifications
- Interaction QA
- Accessibility QA
- Status: "In QA"

**Stage 9: QA Passed**
- All QA checks passed
- Status: "QA Passed"

**Stage 10: Released**
- Deployed to production
- Status: "Released"`
    },
    {
      id: '15.12.2',
      title: '2. Approval Gates',
      content: `**Gate 1: Design Approval**
- Reviewers: Product Manager, Engineering Lead
- Criteria:
  - Meets user requirements
  - Follows design system
  - Accessible (WCAG 2.2 AA)
  - Responsive design
  - All states defined
- Approval: Both reviewers must approve

**Gate 2: Technical Approval**
- Reviewers: Engineering Lead, Security Lead (if applicable)
- Criteria:
  - Technically feasible
  - Performance acceptable
  - Security requirements met
  - API contracts defined
  - Data model compatible
- Approval: Both reviewers must approve

**Gate 3: Development Approval**
- Reviewers: Engineering Lead, QA Lead
- Criteria:
  - Code complete
  - Unit tests passing
  - Code review approved
  - Documentation updated
- Approval: Both reviewers must approve

**Gate 4: QA Approval**
- Reviewers: QA Lead, Product Manager
- Criteria:
  - Visual QA passed
  - Interaction QA passed
  - Accessibility QA passed
  - Performance QA passed
  - Security QA passed (if applicable)
- Approval: Both reviewers must approve

**Escalation Process:**
- If reviewers disagree, escalate to Product Director
- Product Director makes final decision
- Decision documented with rationale`
    }
  ]
};

export const stage15Doc13: Document = {
  id: 'ai-implementation-governance',
  number: 13,
  title: 'AI-Assisted UI Implementation Governance',
  shortTitle: 'AI Governance',
  description: 'Rules and processes for using AI coding assistants while maintaining design conformance.',
  status: 'Recorded',
  stage: 15,
  sections: [
    {
      id: '15.13.1',
      title: '1. AI Implementation Rules',
      content: `**What AI Assistants CAN Do:**

**1. Generate Boilerplate:**
- Component structure
- TypeScript interfaces
- Basic styling
- Test scaffolding

**2. Implement Specified Designs:**
- Follow screen specifications exactly
- Use approved components
- Apply design tokens correctly
- Implement documented interactions

**3. Write Tests:**
- Unit tests for components
- Integration tests for workflows
- Accessibility tests
- Performance tests

**4. Refactor Code:**
- Improve code quality
- Optimize performance
- Fix bugs (with approval)
- Update dependencies

**What AI Assistants CANNOT Do:**

**1. Invent Features:**
- No unapproved screens
- No unapproved interactions
- No unapproved business logic
- No unapproved data models

**2. Change Design:**
- No visual changes without approval
- No interaction changes without approval
- No component changes without approval
- No design token changes without approval

**3. Modify Architecture:**
- No routing changes without approval
- No state management changes without approval
- No API contract changes without approval
- No data model changes without approval

**4. Skip Requirements:**
- No omitting accessibility requirements
- No omitting error states
- No omitting loading states
- No omitting empty states`
    },
    {
      id: '15.13.2',
      title: '2. Design Conformance Review',
      content: `**Review Process:**

**1. Automated Checks:**
- Design token usage validation
- Component usage validation
- Accessibility audit (axe-core)
- Performance audit (Lighthouse)
- TypeScript type checking
- ESLint rules

**2. Manual Review:**
- Visual comparison to specifications
- Interaction testing
- Accessibility testing (screen reader)
- Responsive testing (multiple devices)
- Cross-browser testing

**3. Review Checklist:**
- [ ] Matches screen specification
- [ ] Uses approved components
- [ ] Applies design tokens correctly
- [ ] All states implemented (loading, empty, error)
- [ ] Accessibility requirements met
- [ ] Responsive design works
- [ ] Interactions match specification
- [ ] Performance acceptable
- [ ] Code quality standards met
- [ ] Tests passing

**4. Non-Conformance Handling:**
- Minor issues: Fix before merge
- Major issues: Return to AI for correction
- Design questions: Escalate to design team
- Architecture questions: Escalate to engineering lead

**5. Approval Requirements:**
- All automated checks must pass
- Manual review must approve
- Product manager must approve (for MVP screens)
- Design lead must approve (for design changes)`
    }
  ]
};

export const stage15DocsFinal: Document[] = [
  stage15Doc11,
  stage15Doc12,
  stage15Doc13
];
