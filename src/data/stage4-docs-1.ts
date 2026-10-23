import { Document } from './types';

export const stage4Doc1: Document = {
  id: 'design-system',
  number: 1,
  title: 'UI/UX Design System',
  shortTitle: 'Design System',
  description: 'Visual identity, design tokens, component specifications, typography, spacing, and reusable patterns.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'DS-1',
      title: '1. Color Palette',
      content: `**Primary Colors:**
- Navy: #172B4D (headers, primary navigation, key UI elements)
- Blue: #2563EB (interactive elements, links, active states, CTAs)
- White: #FFFFFF (surfaces, backgrounds)

**Neutral Palette:**
- Gray 50: #F9FAFB (subtle backgrounds)
- Gray 100: #F3F4F6 (borders, dividers)
- Gray 200: #E5E7EB (disabled states, subtle borders)
- Gray 300: #D1D5DB (placeholder text, icons)
- Gray 400: #9CA3AF (secondary text)
- Gray 500: #6B7280 (body text)
- Gray 600: #4B5563 (emphasis text)
- Gray 700: #374151 (headings)
- Gray 800: #1F2937 (primary text)
- Gray 900: #111827 (high contrast text)

**Semantic Colors:**
- Success: #10B981 (green-500) — confirmed actions, positive metrics
- Warning: #F59E0B (amber-500) — attention needed, pending states
- Error: #EF4444 (red-500) — failures, destructive actions, critical alerts
- Info: #3B82F6 (blue-500) — informational messages, neutral highlights

**Status Colors:**
- Active/Approved: Success green
- Pending/In Progress: Warning amber
- Rejected/Failed: Error red
- Draft/Inactive: Gray 400
- Archived: Gray 300

**Data Visualization:**
- Primary series: #2563EB (blue)
- Secondary series: #10B981 (green)
- Tertiary series: #F59E0B (amber)
- Quaternary series: #8B5CF6 (violet)
- Quinary series: #EC4899 (pink)
- Use consistent color mapping across all charts
- Ensure sufficient contrast for accessibility (4.5:1 minimum)

**Dark Mode (Future Scope):**
- Not in initial release
- Design tokens prepared for future implementation
- All colors defined as CSS variables for easy theming`
    },
    {
      id: 'DS-2',
      title: '2. Typography',
      content: `**Font Family:**
- Primary: Inter (sans-serif) — clean, professional, highly readable
- Monospace: JetBrains Mono — for code, technical data, IDs

**Type Scale:**
\`\`\`
Display: 36px / 2.25rem, font-weight 700, line-height 1.2
H1: 30px / 1.875rem, font-weight 700, line-height 1.3
H2: 24px / 1.5rem, font-weight 600, line-height 1.3
H3: 20px / 1.25rem, font-weight 600, line-height 1.4
H4: 18px / 1.125rem, font-weight 600, line-height 1.4
Body Large: 16px / 1rem, font-weight 400, line-height 1.5
Body: 14px / 0.875rem, font-weight 400, line-height 1.5
Body Small: 13px / 0.8125rem, font-weight 400, line-height 1.5
Caption: 12px / 0.75rem, font-weight 400, line-height 1.4
Overline: 11px / 0.6875rem, font-weight 600, line-height 1.3, letter-spacing 0.05em, uppercase
\`\`\`

**Usage Guidelines:**
- H1: Page titles (one per page)
- H2: Section headings
- H3: Subsection headings, card titles
- H4: Component labels, form group titles
- Body Large: Lead paragraphs, important statements
- Body: Default text, descriptions, content
- Body Small: Secondary text, metadata, timestamps
- Caption: Labels, hints, helper text
- Overline: Category labels, navigation items

**Font Weights:**
- 400 (Regular): Body text, descriptions
- 500 (Medium): Emphasis, buttons, labels
- 600 (Semibold): Headings, important values
- 700 (Bold): Page titles, critical metrics

**Text Colors:**
- Primary text: Gray 800 (#1F2937)
- Secondary text: Gray 500 (#6B7280)
- Tertiary text: Gray 400 (#9CA3AF)
- Disabled text: Gray 300 (#D1D5DB)
- Link text: Blue (#2563EB)
- Error text: Error red (#EF4444)`
    },
    {
      id: 'DS-3',
      title: '3. Spacing and Layout',
      content: `**Spacing Scale (4px base):**
\`\`\`
0: 0px
1: 4px (0.25rem)
2: 8px (0.5rem)
3: 12px (0.75rem)
4: 16px (1rem)
5: 20px (1.25rem)
6: 24px (1.5rem)
7: 28px (1.75rem)
8: 32px (2rem)
10: 40px (2.5rem)
12: 48px (3rem)
16: 64px (4rem)
20: 80px (5rem)
\`\`\`

**Common Spacing Patterns:**
- Component padding: 16px (4)
- Card padding: 24px (6)
- Section spacing: 32px (8)
- Page margin: 24px (6) desktop, 16px (4) mobile
- Form field gap: 16px (4)
- Button gap: 12px (3)
- Icon + text gap: 8px (2)

**Layout Grid:**
- Desktop: 12-column grid, 24px gutters
- Tablet: 8-column grid, 16px gutters
- Mobile: 4-column grid, 16px gutters

**Content Widths:**
- Max content width: 1280px
- Reading width: 720px (for long-form content)
- Form width: 640px (for focused forms)
- Sidebar width: 280px (collapsible to 64px)

**Breakpoints:**
\`\`\`
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: 1024px - 1280px
Wide: > 1280px
\`\`\`

**Responsive Behavior:**
- Mobile-first approach
- Stack layouts on mobile, side-by-side on desktop
- Hide secondary information on small screens
- Convert tables to card layouts on mobile
- Collapse navigation to hamburger menu`
    },
    {
      id: 'DS-4',
      title: '4. Component Specifications',
      content: `**Buttons:**

**Primary Button:**
- Background: Blue (#2563EB)
- Text: White (#FFFFFF)
- Padding: 10px 20px
- Border radius: 6px
- Font: 14px, weight 500
- Hover: Darken 10%
- Active: Darken 15%
- Disabled: Gray 200 background, Gray 400 text
- Focus: 2px blue outline, 2px offset

**Secondary Button:**
- Background: White
- Border: 1px Gray 300
- Text: Gray 700
- Hover: Gray 50 background
- Active: Gray 100 background

**Tertiary Button:**
- Background: Transparent
- Text: Blue (#2563EB)
- Hover: Blue 50 background
- No border

**Destructive Button:**
- Background: Error red (#EF4444)
- Text: White
- Hover: Darken 10%
- Use only for irreversible actions

**Icon Button:**
- Size: 36px × 36px
- Icon: 20px × 20px
- Background: Transparent
- Hover: Gray 100 background
- Border radius: 6px

**Form Controls:**

**Text Input:**
- Height: 40px
- Padding: 10px 12px
- Border: 1px Gray 300
- Border radius: 6px
- Font: 14px
- Placeholder: Gray 400
- Focus: Blue border, blue ring (2px, offset 2px)
- Error: Red border, red ring
- Disabled: Gray 100 background, Gray 400 text

**Select Dropdown:**
- Same as text input
- Chevron icon on right (16px)
- Dropdown menu: White background, shadow, 6px radius
- Option height: 40px
- Selected option: Blue 50 background

**Checkbox:**
- Size: 20px × 20px
- Border: 2px Gray 300
- Border radius: 4px
- Checked: Blue background, white checkmark
- Focus: Blue ring

**Radio Button:**
- Size: 20px × 20px
- Border: 2px Gray 300
- Border radius: 50%
- Selected: Blue dot (8px) in center
- Focus: Blue ring

**Toggle Switch:**
- Width: 44px, height: 24px
- Background: Gray 200 (off), Blue (on)
- Knob: White, 20px diameter
- Transition: 200ms ease

**Cards:**
- Background: White
- Border: 1px Gray 200
- Border radius: 8px
- Padding: 24px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Hover: Shadow increases (0 4px 6px rgba(0,0,0,0.1))

**Tables:**
- Header: Gray 50 background, Gray 700 text, 14px semibold
- Row height: 56px
- Cell padding: 12px 16px
- Border: 1px Gray 200 (between rows)
- Hover: Gray 50 background
- Selected: Blue 50 background
- Striped: Alternate rows Gray 50

**Modals/Dialogs:**
- Background: White
- Border radius: 12px
- Padding: 32px
- Shadow: 0 20px 25px rgba(0,0,0,0.1)
- Overlay: Black 50% opacity
- Max width: 640px (default), 960px (large)
- Close button: Top right, 32px × 32px

**Drawers:**
- Width: 480px (default), 640px (large)
- Slide from right
- Background: White
- Shadow: -4px 0 12px rgba(0,0,0,0.1)
- Overlay: Black 30% opacity

**Tooltips:**
- Background: Gray 800
- Text: White, 12px
- Padding: 6px 10px
- Border radius: 4px
- Arrow: 6px
- Delay: 300ms before showing
- Max width: 240px

**Badges:**
- Height: 24px
- Padding: 4px 10px
- Border radius: 12px (pill)
- Font: 12px, weight 500
- Variants: Default (Gray), Success (Green), Warning (Amber), Error (Red), Info (Blue)

**Avatars:**
- Sizes: 24px, 32px, 40px, 48px, 64px
- Border radius: 50%
- Background: Gray 200 (if no image)
- Initials: White text on colored background
- Status indicator: 8px dot (bottom right)`
    },
    {
      id: 'DS-5',
      title: '5. Icons and Illustrations',
      content: `**Icon Library:**
- Lucide React (consistent with approved stack)
- Style: Outline, 1.5px stroke weight
- Sizes: 16px, 20px, 24px, 32px
- Color: Inherit from parent (usually Gray 600)

**Icon Usage:**
- Navigation: 20px
- Buttons: 16px or 20px (depending on button size)
- Form fields: 16px (left side, inside input)
- Status indicators: 16px
- Empty states: 48px or 64px
- Feature highlights: 32px

**Icon Principles:**
- Use icons to reinforce meaning, not replace text
- Always pair icons with labels in navigation
- Use consistent icon for same concept across app
- Avoid decorative icons without purpose
- Ensure sufficient contrast (4.5:1)

**Illustrations:**
- Empty states: Simple, friendly illustrations (line art style)
- Onboarding: Step-by-step visual guides
- Error states: Empathetic, solution-oriented
- Style: Consistent with brand (navy, blue, white palette)
- Avoid: Cartoonish, overly complex, or generic stock illustrations

**Data Visualization Icons:**
- Trend up: Arrow up right (green)
- Trend down: Arrow down right (red)
- Trend flat: Arrow right (gray)
- Alert: Exclamation triangle (amber)
- Info: Info circle (blue)
- Success: Check circle (green)
- Error: X circle (red)`
    },
    {
      id: 'DS-6',
      title: '6. Design Tokens',
      content: `**CSS Custom Properties:**
\`\`\`css
:root {
  /* Colors */
  --color-primary: #172B4D;
  --color-accent: #2563EB;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Neutrals */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;

  /* Z-index */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-popover: 400;
  --z-tooltip: 500;
}
\`\`\`

**Token Usage:**
- All components use design tokens, not hardcoded values
- Tokens enable consistent theming and future dark mode
- Document token usage in component documentation
- Avoid creating new tokens without review`
    }
  ]
};

export const stage4Doc2: Document = {
  id: 'screen-inventory',
  number: 2,
  title: 'Complete Screen Inventory',
  shortTitle: 'Screen Inventory',
  description: 'Comprehensive list of all screens across all modules with specifications, states, and acceptance criteria.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'SI-1',
      title: '1. Authentication Screens',
      content: `**AUTH-001: Sign In**
- Purpose: User authentication
- Entry: App launch, session expiry
- Components: Email input, password input, show/hide toggle, "Remember me" checkbox, "Forgot password?" link, Submit button
- States: Empty, loading, error (invalid credentials), success (redirect)
- Validation: Email format, password required
- Mobile: Single column, full-width form
- Acceptance: User can sign in with valid credentials, sees clear error for invalid credentials

**AUTH-002: Forgot Password**
- Purpose: Initiate password reset
- Entry: "Forgot password?" link on sign-in
- Components: Email input, submit button, back to sign-in link
- States: Empty, loading, success (email sent message), error
- Validation: Email format, email must exist
- Acceptance: User receives reset email, can return to sign-in

**AUTH-003: Reset Password**
- Purpose: Set new password via reset link
- Entry: Email link with token
- Components: New password input, confirm password input, submit button
- States: Empty, loading, success (password updated), error (invalid/expired token)
- Validation: Password strength, passwords match
- Acceptance: User can set new password and sign in

**AUTH-004: Multi-Factor Authentication**
- Purpose: Second factor verification (if enabled)
- Entry: After password verification
- Components: Code input (6 digits), verify button, resend code link
- States: Empty, loading, success, error (invalid code)
- Validation: 6-digit code format
- Acceptance: User can complete MFA and access app

**AUTH-005: Invitation Acceptance**
- Purpose: Join organization via invitation
- Entry: Email invitation link
- Components: Organization name display, user details (pre-filled), password setup, accept button
- States: Empty, loading, success (redirect to app), error (invalid/expired invitation)
- Validation: Password strength, required fields
- Acceptance: User can accept invitation and access organization`
    },
    {
      id: 'SI-2',
      title: '2. Onboarding Screens',
      content: `**ONBOARD-001: Welcome**
- Purpose: Introduce platform, collect initial info
- Entry: After invitation acceptance or first sign-in
- Components: Welcome message, organization name input, continue button
- States: Empty, loading, error
- Acceptance: User can enter organization name and proceed

**ONBOARD-002: Industry Selection**
- Purpose: Select industry from catalogue or define custom
- Entry: After welcome
- Components: Search input, industry categories, industry list, "Other" option, custom industry form (if "Other" selected), continue button, progress indicator
- States: Empty, searching, no results, custom industry form, loading
- Validation: Industry required OR custom name + description required
- Acceptance: User can select industry or define custom, cannot proceed without selection

**ONBOARD-003: Business Activities**
- Purpose: Describe organization's activities
- Entry: After industry selection
- Components: Textarea for activities description, products/services input, continue button, progress indicator
- States: Empty, loading
- Validation: Activities description required
- Acceptance: User can describe activities and proceed

**ONBOARD-004: Module Configuration**
- Purpose: Activate relevant modules
- Entry: After business activities
- Components: Module list with descriptions, toggle switches, AI suggestions (if applicable), continue button, progress indicator
- States: Default (AI suggestions), customized, loading
- Acceptance: User can review and adjust module activation

**ONBOARD-005: Team Setup**
- Purpose: Configure organization structure
- Entry: After module configuration
- Components: Branch/department structure, invite team members (email inputs), continue button, progress indicator, skip option
- States: Empty, loading, invitations sent
- Validation: Email format for invitations
- Acceptance: User can set up structure and invite team, or skip

**ONBOARD-006: Configuration Review**
- Purpose: Review and confirm all settings
- Entry: After team setup
- Components: Summary of all choices (industry, modules, team), edit links for each section, confirm button, progress indicator
- States: Review, loading, success (redirect to dashboard)
- Acceptance: User can review all settings, edit if needed, confirm and access app

**ONBOARD-007: First-Time Tutorial**
- Purpose: Guided introduction to key features
- Entry: After onboarding completion (optional)
- Components: Tutorial overlay, step indicators, next/previous/skip buttons, highlighted UI elements
- States: Step 1-N, completed, skipped
- Acceptance: User can complete tutorial, skip, or restart later`
    },
    {
      id: 'SI-3',
      title: '3. Organization & Administration Screens',
      content: `**ORG-001: Organization Profile**
- Purpose: View and edit organization details
- Entry: Settings → Organization
- Components: Organization name, industry, description, logo upload, save button
- Permissions: Organization admin
- States: View, edit, loading, saving, success, error
- Acceptance: Admin can update organization details

**ORG-002: Branches & Departments**
- Purpose: Manage organizational structure
- Entry: Settings → Structure
- Components: Tree view of branches/departments, add/edit/delete buttons, drag-to-reorder
- Permissions: Organization admin
- States: Empty, tree view, editing, loading
- Acceptance: Admin can create/edit/delete branches and departments

**ORG-003: Users & Invitations**
- Purpose: Manage users and send invitations
- Entry: Settings → Users
- Components: User list (table), invite button, invite form (email, role), search/filter, bulk actions
- Permissions: Organization admin
- States: Empty, list view, invite form, loading, sending
- Acceptance: Admin can invite users, view user list, manage roles

**ORG-004: Roles & Permissions**
- Purpose: Configure roles and permission sets
- Entry: Settings → Roles
- Components: Role list, role detail (permission matrix), create/edit role
- Permissions: Organization admin
- States: List view, detail view, edit mode, loading
- Acceptance: Admin can create custom roles, assign permissions

**ORG-005: Audit Log**
- Purpose: View audit trail of all actions
- Entry: Settings → Audit Log
- Components: Filterable log table (date, user, action, resource), export button
- Permissions: Organization admin
- States: Empty, list view, filtering, exporting, loading
- Acceptance: Admin can view and export audit logs

**ORG-006: Integrations**
- Purpose: Configure external integrations
- Entry: Settings → Integrations
- Components: Integration list, connect/disconnect buttons, configuration forms
- Permissions: Organization admin
- States: Empty, list view, configuration form, loading, connecting
- Acceptance: Admin can configure integrations`
    },
    {
      id: 'SI-4',
      title: '4. CRM Module Screens',
      content: `**CRM-001: Leads List**
- Purpose: View and manage all leads
- Entry: Navigation → CRM → Leads
- Components: Lead table (name, company, status, owner, created), search, filters (status, owner, source), create button, bulk actions
- Permissions: CRM read
- States: Empty, list view, filtering, loading
- Mobile: Card layout instead of table
- Acceptance: User can view, search, filter leads

**CRM-002: Lead Detail**
- Purpose: View and edit lead information
- Entry: Click lead in list
- Components: Lead info (name, contact, company, status, owner), activity timeline, related records, edit button, convert button
- Permissions: CRM read (view), CRM write (edit)
- States: View, edit, loading, converting
- Acceptance: User can view lead details, edit if permitted

**CRM-003: Create/Edit Lead**
- Purpose: Create new lead or edit existing
- Entry: Create button or edit button on detail
- Components: Form (name*, email, phone, company, source, status, owner, notes), save/cancel buttons
- Permissions: CRM create (create), CRM write (edit)
- States: Empty form, filling, saving, success, error
- Validation: Name required, email format
- Acceptance: User can create/edit lead with validation

**CRM-004: Contacts List**
- Purpose: View and manage contacts
- Entry: Navigation → CRM → Contacts
- Components: Contact table, search, filters, create button
- Permissions: CRM read
- States: Empty, list view, loading
- Acceptance: User can view contacts

**CRM-005: Contact Detail**
- Purpose: View contact information and activity
- Entry: Click contact in list
- Components: Contact info, activity timeline, related leads/opportunities, edit button
- Permissions: CRM read/write
- States: View, edit, loading
- Acceptance: User can view contact details

**CRM-006: Companies List**
- Purpose: View and manage companies
- Entry: Navigation → CRM → Companies
- Components: Company table, search, filters, create button
- Permissions: CRM read
- States: Empty, list view, loading
- Acceptance: User can view companies

**CRM-007: Company Detail**
- Purpose: View company information and related records
- Entry: Click company in list
- Components: Company info, contacts list, leads, opportunities, activity timeline
- Permissions: CRM read
- States: View, loading
- Acceptance: User can view company details and related records

**CRM-008: Activities**
- Purpose: Log and view activities (calls, emails, meetings)
- Entry: Lead/contact detail → Activities tab, or Navigation → CRM → Activities
- Components: Activity list (type, date, subject, user), log activity button, filters
- Permissions: CRM read/write
- States: Empty, list view, logging activity, loading
- Acceptance: User can log and view activities`
    }
  ]
};
