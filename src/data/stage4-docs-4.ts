import { Document } from './types';

export const stage4Doc9: Document = {
  id: 'interaction-animation',
  number: 9,
  title: 'Interaction and Animation Guidelines',
  shortTitle: 'Interactions',
  description: 'Motion system, transitions, loading states, feedback animations, and interaction patterns.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'ANIM-1',
      title: '1. Motion Principles',
      content: `**Motion Principles:**
- Purposeful: Every animation serves a function (feedback, orientation, continuity)
- Subtle: Avoid flashy or distracting effects
- Fast: Keep transitions quick (150-300ms) to avoid delaying tasks
- Consistent: Use same easing and duration for similar interactions
- Accessible: Respect reduced-motion preferences

**Easing Functions:**
- Standard: ease (default for most transitions)
- Enter: ease-out (elements entering screen)
- Exit: ease-in (elements leaving screen)
- Emphasis: ease-in-out (attention-drawing animations)

**Duration Scale:**
\`\`\`
Instant: 0ms (state changes, color changes)
Fast: 150ms (hover states, button press)
Base: 200ms (dropdowns, tooltips, modals)
Slow: 300ms (page transitions, drawers)
Deliberate: 500ms (tutorial spotlights, celebrations)
\`\`\`

**Reduced Motion:**
- Detect: \`prefers-reduced-motion: reduce\` media query
- Behavior: Disable all non-essential animations
- Keep: Instant state changes (color, opacity)
- Remove: Transitions, transforms, movement
- Provide: Alternative feedback (text, sound where appropriate)

**Performance:**
- Use CSS transforms and opacity (GPU-accelerated)
- Avoid animating layout properties (width, height, top, left)
- Use \`will-change\` sparingly (only for complex animations)
- Test on low-powered devices
- Lazy-load animations for below-fold content`
    },
    {
      id: 'ANIM-2',
      title: '2. Component Animations',
      content: `**Buttons:**
- Hover: Background color transition (150ms ease)
- Active: Scale down slightly (0.98, 100ms)
- Focus: Outline appear (150ms ease)
- Loading: Spinner rotation (infinite, 1s linear)

**Dropdowns:**
- Open: Slide down + fade in (200ms ease-out)
- Close: Slide up + fade out (150ms ease-in)
- Transform origin: Top center

**Modals:**
- Open: Scale up from 0.95 to 1 + fade in (200ms ease-out)
- Close: Scale down to 0.95 + fade out (150ms ease-in)
- Overlay: Fade in (200ms)

**Drawers:**
- Open: Slide in from right (300ms ease-out)
- Close: Slide out to right (250ms ease-in)
- Overlay: Fade in (300ms)

**Tooltips:**
- Appear: Fade in + slight scale (150ms ease-out)
- Disappear: Fade out (100ms ease-in)
- Delay: 300ms before showing (prevent flicker)

**Tabs:**
- Active tab: Underline slide (200ms ease)
- Content: Fade in (150ms ease)

**Navigation:**
- Expand/collapse: Height transition (200ms ease)
- Active state: Left border slide (150ms ease)
- Submenu: Slide down (200ms ease-out)

**Cards:**
- Hover: Shadow increase + slight lift (200ms ease)
- Transform: translateY(-2px)

**Tables:**
- Row hover: Background fade (150ms ease)
- Sort indicator: Rotate arrow (200ms ease)
- Expand row: Height transition (200ms ease)

**Forms:**
- Field focus: Border color transition (150ms ease)
- Error state: Border shake (subtle, 300ms)
- Validation: Fade in error message (150ms ease)

**Charts:**
- Initial load: Draw animation (500ms ease-out)
- Data update: Smooth transition (300ms ease)
- Hover: Highlight segment (150ms ease)`
    },
    {
      id: 'ANIM-3',
      title: '3. Loading and Feedback States',
      content: `**Loading Indicators:**

**Skeleton Screens:**
- Match layout of loaded content
- Shimmer effect: Gradient moving left to right (1.5s infinite)
- Color: Gray 100 base, Gray 200 shimmer
- Use for: Initial page load, data fetching

**Spinners:**
- Size: 20px (inline), 40px (centered), 64px (full page)
- Color: Blue (#2563EB)
- Rotation: 360deg, 1s linear infinite
- Use for: Button loading, small component loading

**Progress Bars:**
- Height: 4px
- Color: Blue (#2563EB)
- Animation: Indeterminate (shimmer) or determinate (0-100%)
- Use for: File uploads, long operations

**Page Transitions:**
- Route change: Fade out (150ms) → fade in (150ms)
- Back navigation: Slide from left (200ms)
- Forward navigation: Slide from right (200ms)
- Modal open: Overlay fade + content scale

**Success Feedback:**
- Toast notification: Slide in from top (300ms ease-out)
- Icon: Check circle (green)
- Auto-dismiss: 5 seconds
- Manual dismiss: Click X button
- Sound: Optional subtle chime (respect user preferences)

**Error Feedback:**
- Toast notification: Slide in from top (300ms ease-out)
- Icon: X circle (red)
- Auto-dismiss: Never (manual dismiss required)
- Color: Red background, white text

**Inline Validation:**
- Error message: Fade in below field (150ms ease)
- Field border: Transition to red (150ms ease)
- Icon: Error icon appear (150ms ease)
- Shake: Subtle horizontal shake (300ms) on submit with errors

**Celebration (Rare):**
- Use only for significant achievements (completing onboarding, hitting major milestone)
- Confetti or checkmark animation (500ms)
- Keep subtle and professional
- Respect reduced-motion preferences`
    },
    {
      id: 'ANIM-4',
      title: '4. Interaction Patterns',
      content: `**Drag and Drop:**
- Lift: Scale up slightly (1.02), shadow increase
- Drag: Follow cursor with 50ms delay (smooth)
- Drop zone: Highlight with blue border
- Drop: Scale back to 1, shadow normal
- Cancel: Animate back to original position

**Swipe (Mobile):**
- Swipe threshold: 50px
- Swipe action: Reveal action buttons
- Swipe distance: Max 100px
- Release: Snap to action or return to original

**Pull to Refresh (Mobile):**
- Pull distance: 60px to trigger
- Indicator: Spinner appears at top
- Refresh: Spinner rotates
- Complete: Spinner fades, content updates

**Infinite Scroll:**
- Trigger: 200px from bottom
- Loading: Show spinner at bottom
- Load more: Append new items with fade-in
- End: Show "No more items" message

**Optimistic Updates:**
- Immediate: Update UI before server confirmation
- Success: Keep update, show subtle success indicator
- Failure: Revert to previous state, show error toast
- Loading: Show loading state on affected element

**Keyboard Shortcuts:**
- Display: "?" key shows shortcut overlay
- Overlay: Modal with list of shortcuts
- Activation: Press shortcut to trigger action
- Conflict: Show warning if shortcut already used

**Context Menus:**
- Trigger: Right-click or three-dot icon
- Position: Near cursor or icon
- Open: Fade in (150ms)
- Close: Fade out (100ms) or click outside
- Keyboard: Arrow keys to navigate, Enter to select

**Bulk Selection:**
- Checkbox: Click to select/deselect
- Shift+click: Select range
- Ctrl/Cmd+click: Toggle individual
- Select all: Checkbox in header
- Action bar: Slide up from bottom when items selected`
    }
  ]
};

export const stage4Doc10: Document = {
  id: 'forms-tables-workflows',
  number: 10,
  title: 'Forms, Tables, and Workflow Interactions',
  shortTitle: 'Forms & Tables',
  description: 'Form patterns, table interactions, workflow visualization, and business operation UX.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'FT-1',
      title: '1. Form Design Patterns',
      content: `**Form Layout:**
- Max width: 640px (focused forms), 960px (complex forms)
- Field spacing: 16px vertical
- Section spacing: 32px vertical
- Label position: Above field (not inline)
- Required indicator: Asterisk (*) after label

**Field Types:**

**Text Input:**
- Single line for short text (name, email)
- Height: 40px
- Placeholder: Example format (not instructions)
- Helper text: Below field (Gray 500, 12px)
- Character count: If max length (bottom right)

**Textarea:**
- Multi-line for long text (description, notes)
- Min height: 80px, max height: 240px
- Auto-resize: Grow with content (up to max)
- Placeholder: Example or guidance

**Select Dropdown:**
- For predefined options
- Searchable if > 10 options
- Clear button: X icon to clear selection
- Group options if categorized

**Checkbox Group:**
- For multiple selections
- Vertical layout (one per line)
- Label: Right of checkbox
- Helper text: Below group if needed

**Radio Group:**
- For single selection from options
- Vertical layout (one per line)
- Label: Right of radio button
- Helper text: Below group if needed

**Date/Time Picker:**
- Calendar popup for date selection
- Time picker for time selection
- Preset options: Today, Yesterday, Last 7 days, etc.
- Clear button: X icon

**File Upload:**
- Drag and drop zone
- Click to browse
- Show file list with remove button
- Progress bar for uploads
- File type and size validation

**Toggle Switch:**
- For binary on/off settings
- Label: Left of toggle
- Helper text: Below if needed

**Form Validation:**

**Real-time Validation:**
- Validate on blur (field exit)
- Show error immediately
- Clear error when corrected
- Don't validate empty optional fields

**Submit Validation:**
- Validate all fields on submit
- Show all errors
- Focus first error field
- Scroll to first error if off-screen

**Error Messages:**
- Clear, specific, actionable
- Below field, red text, 12px
- Icon: Error icon (red)
- Example: "Email must be a valid email address"

**Success State:**
- Green checkmark icon (if inline validation)
- Brief success message (if form submission)
- Auto-clear after 3 seconds

**Form Actions:**
- Primary button: Save/Submit (right-aligned)
- Secondary button: Cancel (left of primary)
- Tertiary button: Save as draft (text link)
- Loading state: Button shows spinner, disabled
- Unsaved changes: Warn before navigating away`
    },
    {
      id: 'FT-2',
      title: '2. Table and List Patterns',
      content: `**Table Layout:**
- Full width within content area
- Sticky header (stays visible on scroll)
- Sticky first column (if many columns)
- Zebra striping: Alternate rows (Gray 50)
- Row height: 56px
- Cell padding: 12px 16px

**Table Features:**

**Sorting:**
- Click column header to sort
- Toggle: Ascending → Descending → None
- Indicator: Arrow icon (up/down)
- Multi-column sort: Shift+click

**Filtering:**
- Filter button above table
- Opens filter panel (slide down)
- Filter by: Column values, date ranges, status
- Active filters: Show as badges above table
- Clear all: Button to remove all filters

**Search:**
- Search input above table
- Searches across all visible columns
- Real-time filtering as user types
- Clear button: X icon

**Pagination:**
- Location: Below table
- Components: Items per page selector, page numbers, prev/next buttons
- Display: "Showing 1-50 of 234 results"
- Items per page: 25, 50, 100 (default 50)

**Bulk Actions:**
- Checkbox in first column
- Select all: Checkbox in header
- Action bar: Appears when items selected
- Actions: Edit, Delete, Export, etc. (based on permissions)
- Destructive actions: Require confirmation

**Column Configuration:**
- Settings icon above table
- Dropdown: Show/hide columns
- Reorder: Drag to reorder columns
- Save view: Save column configuration as named view

**Responsive Tables:**
- Desktop: Full table
- Tablet: Hide less important columns
- Mobile: Convert to card layout
  - Each row becomes a card
  - Key fields prominent
  - Other fields in secondary section
  - Swipe for actions

**Empty State:**
- Illustration: Relevant to table type
- Title: "No [items] yet"
- Description: Explain what belongs here
- Action: "Create first [item]" button
- Secondary: "Learn more" link

**Loading State:**
- Skeleton rows: Match table layout
- Shimmer effect
- Show 5-10 skeleton rows

**Error State:**
- Error icon and message
- Retry button
- Contact support link`
    },
    {
      id: 'FT-3',
      title: '3. Workflow and Status Visualization',
      content: `**Status Indicators:**

**Badge Component:**
- Height: 24px
- Padding: 4px 10px
- Border radius: 12px (pill)
- Font: 12px, weight 500

**Status Colors:**
- Active/Approved: Green background (#D1FAE5), Green text (#065F46)
- Pending/In Progress: Amber background (#FEF3C7), Amber text (#92400E)
- Draft/Inactive: Gray background (#F3F4F6), Gray text (#374151)
- Rejected/Failed: Red background (#FEE2E2), Red text (#991B1B)
- Archived: Gray background (#E5E7EB), Gray text (#6B7280)

**Timeline/History:**
- Vertical timeline for activity history
- Each entry: Icon, title, description, timestamp, user
- Connected by vertical line
- Expandable for details
- Filter by: Date range, user, action type

**Pipeline Visualization:**
- Kanban board for sales pipeline
- Columns: Stages (Lead, Qualified, Proposal, Negotiation, Won/Lost)
- Cards: Deal name, value, owner, days in stage
- Drag and drop between columns
- Column totals: Sum of deal values
- Filters: Owner, date range, value range

**Progress Indicators:**
- Linear progress bar: For single metric (0-100%)
- Step progress: For multi-step workflows (1 of 5)
- Circular progress: For compact display (donut chart)

**Approval Flow:**
- Horizontal flow diagram
- Nodes: Approvers (avatar + name)
- Arrows: Flow direction
- States: Pending (gray), Approved (green), Rejected (red)
- Current step: Highlighted
- Click node: See approval details

**Workflow Status:**
- Status badge: Current state
- Progress indicator: Steps completed
- Next action: What's needed
- Due date: If applicable
- Owner: Who's responsible

**Gantt Chart (Projects):**
- Horizontal bars for tasks
- Timeline: Days/weeks/months
- Dependencies: Arrows between tasks
- Milestones: Diamond markers
- Progress: Fill percentage
- Critical path: Highlighted in red
- Zoom: Adjust time scale`
    }
  ]
};

export const stage4Doc11: Document = {
  id: 'accessibility-responsive',
  number: 11,
  title: 'Accessibility and Responsive Design Specification',
  shortTitle: 'Accessibility',
  description: 'WCAG 2.2 AA compliance, keyboard navigation, screen reader support, and responsive layouts.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'A11Y-1',
      title: '1. Accessibility Standards (WCAG 2.2 AA)',
      content: `**Target: WCAG 2.2 Level AA**

**Perceivable:**
- Text alternatives: All non-text content has alt text or aria-label
- Captions: Video content has captions
- Adaptable: Content can be presented in different ways without losing information
- Distinguishable: Sufficient contrast, text can be resized

**Operable:**
- Keyboard accessible: All functionality available via keyboard
- Enough time: Users can read and use content (no time limits except authentication)
- Seizures: No content that causes seizures (no flashing > 3 times/second)
- Navigable: Clear navigation, skip links, visible focus

**Understandable:**
- Readable: Clear language, define abbreviations
- Predictable: Consistent navigation and behavior
- Input assistance: Help users avoid and correct mistakes

**Robust:**
- Compatible: Work with current and future user agents (browsers, assistive technologies)

**Color Contrast:**
- Normal text: 4.5:1 minimum (Gray 800 on White = 12.6:1 ✓)
- Large text (18px+ bold or 24px+): 3:1 minimum
- UI components: 3:1 minimum
- Don't use color alone to convey information

**Focus Indicators:**
- Visible focus on all interactive elements
- 2px outline, offset 2px
- Color: Blue (#2563EB) or high contrast
- Never remove focus outline without replacement

**Keyboard Navigation:**
- Tab order: Logical, follows visual order
- Skip links: "Skip to main content", "Skip to navigation"
- Arrow keys: Navigate within components (menus, tabs, grids)
- Enter/Space: Activate buttons and links
- Escape: Close modals, dropdowns, popups
- Home/End: Jump to first/last item in list

**Screen Reader Support:**
- Semantic HTML: Use proper heading hierarchy (h1-h6)
- ARIA labels: For custom widgets, icons without text
- ARIA live regions: Announce dynamic content changes
- Role attributes: For custom components (button, dialog, etc.)
- Announce: Form errors, success messages, loading states`
    },
    {
      id: 'A11Y-2',
      title: '2. Responsive Design Strategy',
      content: `**Breakpoints:**
\`\`\`
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: 1024px - 1280px
Wide: > 1280px
\`\`\`

**Mobile-First Approach:**
- Design for mobile first, enhance for larger screens
- Use min-width media queries
- Test on real devices, not just browser resize

**Layout Adaptations:**

**Navigation:**
- Desktop: Left sidebar (280px, collapsible to 64px)
- Tablet: Left sidebar (collapsible)
- Mobile: Hamburger menu → full-screen overlay

**Tables:**
- Desktop: Full table with all columns
- Tablet: Hide less important columns
- Mobile: Convert to card layout (each row = card)

**Forms:**
- Desktop: Two-column layout for related fields
- Tablet: Single column
- Mobile: Single column, full-width inputs

**Dashboards:**
- Desktop: Grid layout (12 columns)
- Tablet: Grid layout (8 columns)
- Mobile: Stacked layout (single column)

**Modals:**
- Desktop: Centered, max-width 640px
- Tablet: Centered, max-width 640px
- Mobile: Full-screen or bottom sheet

**Touch Targets:**
- Minimum: 44px × 44px (iOS guideline)
- Recommended: 48px × 48px (Material guideline)
- Spacing: 8px between touch targets
- Apply to: Buttons, links, form controls, icons

**Text Sizing:**
- Base font: 16px (mobile), 14px (desktop)
- Allow user zoom: Don't disable zoom
- Relative units: Use rem, em, not px for text
- Test: 200% zoom should not break layout

**Images:**
- Responsive: Max-width 100%, height auto
- Lazy load: For below-fold images
- Alt text: Descriptive for meaningful images, empty for decorative
- Formats: Use modern formats (WebP, AVIF) with fallbacks`
    },
    {
      id: 'A11Y-3',
      title: '3. Testing and Validation',
      content: `**Automated Testing:**
- axe-core: Run in CI on every PR
- Lighthouse: Performance, accessibility, best practices
- Pa11y: Automated accessibility testing
- Coverage: All pages and key user flows

**Manual Testing:**
- Keyboard navigation: Tab through all pages
- Screen reader: Test with NVDA (Windows), VoiceOver (Mac/iOS)
- Zoom: Test at 200%, 400%
- Color contrast: Verify with contrast checker
- Mobile: Test on real devices (iOS Safari, Android Chrome)

**Accessibility Checklist:**

**Per Page:**
- [ ] Page has unique, descriptive title
- [ ] Language attribute set (lang="en")
- [ ] Skip links present
- [ ] Heading hierarchy logical (h1 → h2 → h3)
- [ ] Focus order logical
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Color contrast sufficient (4.5:1 for text)
- [ ] Images have alt text
- [ ] Forms have labels
- [ ] Error messages clear and associated with fields
- [ ] Dynamic content announced to screen readers

**Per Component:**
- [ ] Buttons have accessible names
- [ ] Icons have aria-label or aria-hidden
- [ ] Modals trap focus
- [ ] Dropdowns keyboard navigable
- [ ] Tables have proper headers (th)
- [ ] Charts have text alternatives
- [ ] Videos have captions
- [ ] Animations respect reduced-motion

**Testing Tools:**
- Browser: Chrome DevTools Accessibility panel
- Screen readers: NVDA (free, Windows), VoiceOver (built-in, Mac)
- Contrast: WebAIM Contrast Checker
- Validation: WAVE, axe DevTools
- Keyboard: Tab through entire flow

**Documentation:**
- Accessibility statement: Public-facing page
- Known issues: List with workarounds
- Contact: How to report accessibility issues
- Commitment: Statement of accessibility commitment

**Continuous Improvement:**
- Quarterly accessibility audit
- User testing with people with disabilities
- Stay updated on WCAG changes
- Train development team on accessibility`
    }
  ]
};

export const stage4Doc12: Document = {
  id: 'ux-acceptance-criteria',
  number: 12,
  title: 'UI/UX Acceptance Criteria',
  shortTitle: 'Acceptance Criteria',
  description: 'Review groups, acceptance criteria, and validation checklist for UI/UX implementation.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'AC-1',
      title: '1. Design Review Groups',
      content: `**Group A: Design Foundations and Authentication**
- Design system (colors, typography, spacing, components)
- Authentication screens (sign-in, MFA, password recovery)
- Session management
- Review focus: Visual consistency, brand alignment, security UX

**Group B: Onboarding, Organization Setup, and Navigation**
- Onboarding flow (6-8 steps)
- Organization administration (profile, structure, users, roles)
- Global navigation (sidebar, top bar, breadcrumbs)
- Review focus: First-time experience, clarity, learnability

**Group C: Shared Components and Core CRM/Sales Workflows**
- Shared components (forms, tables, modals, drawers)
- CRM module (leads, contacts, companies, activities)
- Sales module (opportunities, pipeline, quotations, orders)
- Review focus: Component reusability, workflow efficiency

**Group D: Finance, Inventory, Procurement, Projects, and Workforce**
- Finance module (invoices, payments, expenses, budgets)
- Inventory module (products, stock, suppliers, purchasing)
- Projects module (projects, tasks, milestones)
- Workforce module (employees, assignments)
- Review focus: Business accuracy, operational efficiency

**Group E: Dashboards, Analytics, AI, and Decision Intelligence**
- Role-specific dashboards
- Business intelligence (metrics, reports, drill-downs)
- AI insights and recommendations
- Decision intelligence (approval flows, outcome tracking)
- Review focus: Actionable intelligence, evidence transparency

**Group F: Administration, Integrations, and Future Scope**
- Organization settings
- Integration configuration
- Audit logs
- Future: Data marketplace (clearly marked as future)
- Review focus: Administrative efficiency, security controls

**Group G: Mobile Responsiveness, Accessibility, Animations, and Error States**
- Responsive layouts (mobile, tablet, desktop)
- Accessibility (WCAG 2.2 AA compliance)
- Animations and interactions
- Error states and feedback
- Review focus: Universal usability, inclusive design`
    },
    {
      id: 'AC-2',
      title: '2. Acceptance Criteria by Group',
      content: `**Group A Acceptance:**
- [ ] Design tokens defined and documented
- [ ] All components have all states (default, hover, active, focus, disabled, error)
- [ ] Authentication screens work on desktop and mobile
- [ ] Password show/hide toggle functional
- [ ] MFA input accepts paste, auto-formats
- [ ] Error messages clear and actionable
- [ ] Loading states smooth and informative
- [ ] Accessibility: Keyboard navigation, screen reader support

**Group B Acceptance:**
- [ ] Onboarding flow complete (all steps)
- [ ] Industry selection works (catalogue + custom)
- [ ] Module activation intuitive
- [ ] Navigation reflects user permissions
- [ ] Breadcrumbs accurate and clickable
- [ ] Global search functional
- [ ] Mobile navigation usable
- [ ] Accessibility: Skip links, focus management

**Group C Acceptance:**
- [ ] Forms validate correctly (real-time + submit)
- [ ] Tables sortable, filterable, searchable
- [ ] Bulk actions work with permission checks
- [ ] Modals and drawers accessible
- [ ] CRM workflows complete (lead → contact → opportunity)
- [ ] Sales pipeline visualized (Kanban or list)
- [ ] Responsive: Tables convert to cards on mobile
- [ ] Accessibility: Form labels, error announcements

**Group D Acceptance:**
- [ ] Financial calculations accurate
- [ ] Invoice workflow complete (create → send → paid)
- [ ] Inventory tracking functional
- [ ] Project management features complete
- [ ] Approval workflows enforced
- [ ] Data integrity maintained
- [ ] Responsive layouts
- [ ] Accessibility: Complex forms navigable

**Group E Acceptance:**
- [ ] Dashboards show role-relevant KPIs
- [ ] Metrics traceable to source data
- [ ] Predictions clearly labeled as predictions
- [ ] Recommendations show evidence and uncertainty
- [ ] Approval flows enforced
- [ ] Outcome tracking functional
- [ ] Empty states with guidance
- [ ] Accessibility: Charts have text alternatives

**Group F Acceptance:**
- [ ] Organization settings configurable
- [ ] User and role management functional
- [ ] Audit log complete and searchable
- [ ] Integration configuration works
- [ ] Security controls enforced
- [ ] Future features clearly marked
- [ ] Accessibility: Admin interfaces usable

**Group G Acceptance:**
- [ ] Responsive on mobile (320px+), tablet, desktop
- [ ] Touch targets minimum 44px
- [ ] Keyboard navigation complete
- [ ] Screen reader tested (NVDA, VoiceOver)
- [ ] Color contrast WCAG AA compliant
- [ ] Reduced-motion preferences respected
- [ ] Animations purposeful and subtle
- [ ] Error states clear and recoverable`
    },
    {
      id: 'AC-3',
      title: '3. Final Validation Checklist',
      content: `**Before Implementation:**

**Design Completeness:**
- [ ] All modules have screen specifications
- [ ] All screens have all states (loading, empty, error, success)
- [ ] All components documented with design tokens
- [ ] Responsive layouts defined for all breakpoints
- [ ] Accessibility requirements specified
- [ ] Animation guidelines documented

**Consistency:**
- [ ] Design system applied consistently
- [ ] Navigation patterns consistent across modules
- [ ] Form patterns consistent
- [ ] Table patterns consistent
- [ ] Error handling consistent
- [ ] Terminology consistent (or intentionally customized)

**Feasibility:**
- [ ] Designs implementable within approved architecture
- [ ] No conflicts with security requirements
- [ ] No conflicts with business requirements
- [ ] Performance considerations addressed
- [ ] Accessibility achievable with proposed approach

**User-Centered:**
- [ ] Supports all user roles (owner, manager, staff, admin)
- [ ] Supports all industries (including custom)
- [ ] Progressive disclosure (not overwhelming)
- [ ] Clear information hierarchy
- [ ] Actionable intelligence (not just data display)
- [ ] Helpful empty states and error messages

**Quality:**
- [ ] No fake metrics or invented data
- [ ] No nonfunctional controls
- [ ] No decorative elements without purpose
- [ ] Professional, enterprise appearance
- [ ] Clear visual hierarchy
- [ ] Sufficient whitespace

**Review Sign-Off:**
- [ ] Group A reviewed and approved
- [ ] Group B reviewed and approved
- [ ] Group C reviewed and approved
- [ ] Group D reviewed and approved
- [ ] Group E reviewed and approved
- [ ] Group F reviewed and approved
- [ ] Group G reviewed and approved
- [ ] Final validation complete`
    }
  ]
};
