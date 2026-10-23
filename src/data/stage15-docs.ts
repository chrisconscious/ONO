import { Document } from './types';

export const stage15Doc1: Document = {
  id: 'complete-screen-inventory',
  number: 1,
  title: 'Complete Screen Inventory and Route Map',
  shortTitle: 'Screen Inventory',
  description: 'Comprehensive inventory of all screens, pages, dialogs, and routes organized by domain and delivery phase.',
  status: 'Recorded',
  stage: 15,
  sections: [
    {
      id: '15.1.1',
      title: '1. Screen Inventory Overview',
      content: `**Total Screens:** 87 screens across 11 domains

**Screen Distribution:**
- Authentication: 9 screens
- Organization Onboarding: 12 screens
- Main Application Shell: 6 screens
- CRM and Sales: 14 screens
- Inventory and Procurement: 10 screens
- Finance and Operations: 9 screens
- Business Intelligence and AI: 11 screens
- Organization Administration: 9 screens
- Platform Administration: 7 screens

**MVP Screens (Phase 1-2):** 42 screens
**Post-MVP Screens (Phase 3+):** 45 screens

**Screen Status:**
- Specified: 87 screens
- Implementation-Ready: 42 screens (MVP)
- Blocked by Dependencies: 0 screens
- Deferred: 0 screens`
    },
    {
      id: '15.1.2',
      title: '2. Authentication Screens',
      content: `**AUTH-001: Sign In**
- Route: /login
- Purpose: User authentication
- Roles: All users
- Phase: MVP
- Status: Specified

**AUTH-002: Registration**
- Route: /register
- Purpose: New user account creation
- Roles: New users
- Phase: MVP
- Status: Specified

**AUTH-003: Email Verification**
- Route: /verify-email?token={token}
- Purpose: Verify email address
- Roles: New users
- Phase: MVP
- Status: Specified

**AUTH-004: Password Recovery**
- Route: /forgot-password
- Purpose: Request password reset
- Roles: All users
- Phase: MVP
- Status: Specified

**AUTH-005: Password Reset**
- Route: /reset-password?token={token}
- Purpose: Set new password
- Roles: All users
- Phase: MVP
- Status: Specified

**AUTH-006: Invitation Acceptance**
- Route: /invite?token={token}
- Purpose: Accept organization invitation
- Roles: Invited users
- Phase: MVP
- Status: Specified

**AUTH-007: Session Expired**
- Route: /session-expired
- Purpose: Re-authenticate after session timeout
- Roles: All users
- Phase: MVP
- Status: Specified

**AUTH-008: Multi-Factor Authentication**
- Route: /mfa
- Purpose: Complete MFA verification
- Roles: Users with MFA enabled
- Phase: MVP
- Status: Specified

**AUTH-009: Organization Selection**
- Route: /select-organization
- Purpose: Select organization for multi-org users
- Roles: Users in multiple organizations
- Phase: MVP
- Status: Specified`
    },
    {
      id: '15.1.3',
      title: '3. Organization Onboarding Screens',
      content: `**ONBOARD-001: Create or Join Organization**
- Route: /onboarding/start
- Purpose: Choose to create new org or join existing
- Roles: New users
- Phase: MVP
- Status: Specified

**ONBOARD-002: Organization Basic Info**
- Route: /onboarding/basic-info
- Purpose: Enter organization name, industry, description
- Roles: Organization creators
- Phase: MVP
- Status: Specified

**ONBOARD-003: Industry Selection**
- Route: /onboarding/industry
- Purpose: Select industry from catalogue or custom
- Roles: Organization creators
- Phase: MVP
- Status: Specified

**ONBOARD-004: Regional Settings**
- Route: /onboarding/regional
- Purpose: Set country, timezone, currency, language
- Roles: Organization creators
- Phase: MVP
- Status: Specified

**ONBOARD-005: Initial Administrator**
- Route: /onboarding/admin
- Purpose: Confirm organization owner
- Roles: Organization creators
- Phase: MVP
- Status: Specified

**ONBOARD-006: Module Selection**
- Route: /onboarding/modules
- Purpose: Select initial modules
- Roles: Organization creators
- Phase: MVP
- Status: Specified

**ONBOARD-007: Team Invitation**
- Route: /onboarding/team
- Purpose: Invite team members (optional)
- Roles: Organization creators
- Phase: MVP
- Status: Specified

**ONBOARD-008: First Workflow**
- Route: /onboarding/first-workflow
- Purpose: Complete first meaningful workflow
- Roles: Organization creators
- Phase: MVP
- Status: Specified

**ONBOARD-009: Subscription Selection**
- Route: /onboarding/subscription
- Purpose: Select subscription plan
- Roles: Organization creators
- Phase: Post-MVP
- Status: Specified

**ONBOARD-010: Onboarding Completion**
- Route: /onboarding/complete
- Purpose: Celebrate setup completion
- Roles: Organization creators
- Phase: MVP
- Status: Specified

**ONBOARD-011: Resume Setup**
- Route: /onboarding/resume
- Purpose: Resume incomplete onboarding
- Roles: Organization admins
- Phase: MVP
- Status: Specified

**ONBOARD-012: Provisioning Status**
- Route: /onboarding/provisioning
- Purpose: Show provisioning progress
- Roles: Organization creators
- Phase: MVP
- Status: Specified`
    },
    {
      id: '15.1.4',
      title: '4. Main Application Shell Screens',
      content: `**SHELL-001: Dashboard**
- Route: /{orgSlug}/dashboard
- Purpose: Role-specific overview dashboard
- Roles: All authenticated users
- Phase: MVP
- Status: Specified

**SHELL-002: Global Search**
- Route: /{orgSlug}/search
- Purpose: Search across all modules
- Roles: All authenticated users
- Phase: MVP
- Status: Specified

**SHELL-003: Notifications**
- Route: /{orgSlug}/notifications
- Purpose: View all notifications
- Roles: All authenticated users
- Phase: MVP
- Status: Specified

**SHELL-004: User Profile**
- Route: /{orgSlug}/profile
- Purpose: View and edit user profile
- Roles: All authenticated users
- Phase: MVP
- Status: Specified

**SHELL-005: Access Denied**
- Route: /{orgSlug}/access-denied
- Purpose: Show permission denied message
- Roles: Users without access
- Phase: MVP
- Status: Specified

**SHELL-006: Module Unavailable**
- Route: /{orgSlug}/module-unavailable
- Purpose: Show module not included in subscription
- Roles: All authenticated users
- Phase: MVP
- Status: Specified`
    }
  ]
};

export const stage15Doc2: Document = {
  id: 'design-system-tokens',
  number: 2,
  title: 'Design System and Visual Token Specification',
  shortTitle: 'Design Tokens',
  description: 'Complete design token specification including colors, typography, spacing, elevation, and semantic tokens.',
  status: 'Recorded',
  stage: 15,
  sections: [
    {
      id: '15.2.1',
      title: '1. Design Token Architecture',
      content: `**Token Categories:**
- Color tokens (primitive and semantic)
- Typography tokens
- Spacing tokens
- Border and radius tokens
- Shadow and elevation tokens
- Motion tokens
- Z-index tokens

**Token Naming Convention:**
\`\`\`
{category}-{property}-{variant}-{state}

Examples:
- color-primary-500
- color-text-primary
- spacing-md
- radius-lg
- shadow-md
- motion-duration-fast
\`\`\`

**Token Hierarchy:**
1. Primitive tokens (raw values)
2. Semantic tokens (context-specific)
3. Component tokens (component-specific)

**Theme Support:**
- Light theme (default)
- Dark theme (future)
- High contrast theme (accessibility)`
    },
    {
      id: '15.2.2',
      title: '2. Color Tokens',
      content: `**Primitive Color Tokens:**
\`\`\`typescript
const colors = {
  // Brand colors
  navy: {
    50: '#E8EEF4',
    100: '#C5D4E3',
    200: '#9FB5CE',
    300: '#7996B9',
    400: '#5C7EA8',
    500: '#172B4D', // Primary
    600: '#142541',
    700: '#101E35',
    800: '#0D1729',
    900: '#09101D',
  },
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#2563EB', // Primary
    600: '#1D4ED8',
    700: '#1E40AF',
    800: '#1E3A8A',
    900: '#1E3A5F',
  },
  // Neutral colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};
\`\`\`

**Semantic Color Tokens:**
\`\`\`typescript
const semanticColors = {
  // Text
  text: {
    primary: 'gray.800',
    secondary: 'gray.500',
    tertiary: 'gray.400',
    disabled: 'gray.300',
    inverse: 'white',
    link: 'blue.500',
    error: 'error',
    success: 'success',
    warning: 'warning',
  },
  
  // Backgrounds
  background: {
    primary: 'white',
    secondary: 'gray.50',
    tertiary: 'gray.100',
    inverse: 'navy.500',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Borders
  border: {
    default: 'gray.200',
    strong: 'gray.300',
    focus: 'blue.500',
    error: 'error',
    success: 'success',
  },
  
  // Interactive
  interactive: {
    primary: 'blue.500',
    primaryHover: 'blue.600',
    primaryActive: 'blue.700',
    secondary: 'gray.100',
    secondaryHover: 'gray.200',
    disabled: 'gray.200',
  },
  
  // Status
  status: {
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
  },
};
\`\`\``
    },
    {
      id: '15.2.3',
      title: '3. Typography Tokens',
      content: `**Font Family Tokens:**
\`\`\`typescript
const fonts = {
  primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};
\`\`\`

**Font Size Tokens:**
\`\`\`typescript
const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.8125rem',  // 13px
  base: '0.875rem', // 14px
  lg: '1rem',       // 16px
  xl: '1.125rem',   // 18px
  '2xl': '1.25rem', // 20px
  '3xl': '1.5rem',  // 24px
  '4xl': '1.875rem',// 30px
  '5xl': '2.25rem', // 36px
};
\`\`\`

**Font Weight Tokens:**
\`\`\`typescript
const fontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};
\`\`\`

**Line Height Tokens:**
\`\`\`typescript
const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.5,
  loose: 1.75,
};
\`\`\`

**Typography Styles:**
\`\`\`typescript
const typography = {
  display: {
    fontSize: '5xl',
    fontWeight: 'bold',
    lineHeight: 'tight',
  },
  h1: {
    fontSize: '4xl',
    fontWeight: 'bold',
    lineHeight: 'tight',
  },
  h2: {
    fontSize: '3xl',
    fontWeight: 'semibold',
    lineHeight: 'tight',
  },
  h3: {
    fontSize: '2xl',
    fontWeight: 'semibold',
    lineHeight: 'normal',
  },
  h4: {
    fontSize: 'xl',
    fontWeight: 'semibold',
    lineHeight: 'normal',
  },
  bodyLg: {
    fontSize: 'lg',
    fontWeight: 'normal',
    lineHeight: 'relaxed',
  },
  body: {
    fontSize: 'base',
    fontWeight: 'normal',
    lineHeight: 'relaxed',
  },
  bodySm: {
    fontSize: 'sm',
    fontWeight: 'normal',
    lineHeight: 'relaxed',
  },
  caption: {
    fontSize: 'xs',
    fontWeight: 'normal',
    lineHeight: 'normal',
  },
  overline: {
    fontSize: 'xs',
    fontWeight: 'semibold',
    lineHeight: 'normal',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
};
\`\`\``
    }
  ]
};

export const stage15Doc3: Document = {
  id: 'component-inventory',
  number: 3,
  title: 'Reusable Component Inventory and Contracts',
  shortTitle: 'Component Inventory',
  description: 'Complete component catalog with contracts, variants, and usage guidelines.',
  status: 'Recorded',
  stage: 15,
  sections: [
    {
      id: '15.3.1',
      title: '1. Component Architecture',
      content: `**Component Layers:**
1. Primitive components (buttons, inputs, etc.)
2. Composite components (forms, tables, etc.)
3. Pattern components (search filters, pagination, etc.)
4. Feature components (lead card, opportunity summary, etc.)

**Component Categories:**
- Application structure (6 components)
- Data display (12 components)
- Forms and actions (15 components)
- Business-specific (11 components)
- Feedback and states (8 components)

**Total Components:** 52 reusable components

**Component Naming Convention:**
\`\`\`
{Category}{Component}{Variant}

Examples:
- ButtonPrimary
- InputText
- TableData
- CardLead
- ModalConfirmation
\`\`\``
    },
    {
      id: '15.3.2',
      title: '2. Application Structure Components',
      content: `**APP-001: ApplicationShell**
- Purpose: Main application layout container
- Variants: Default, Compact
- Props: children, sidebarCollapsed, theme
- Slots: header, sidebar, main, footer
- Accessibility: Landmark regions, skip links
- Responsive: Mobile menu, collapsible sidebar

**APP-002: MainNavigation**
- Purpose: Primary navigation menu
- Variants: Expanded, Collapsed
- Props: items, activeItem, onNavigate
- Accessibility: Keyboard navigation, ARIA labels
- Responsive: Hamburger menu on mobile

**APP-003: PageHeader**
- Purpose: Page title and actions
- Props: title, subtitle, actions, breadcrumbs
- Slots: title, actions, breadcrumbs
- Accessibility: Heading hierarchy

**APP-004: Breadcrumbs**
- Purpose: Navigation trail
- Props: items, maxItems
- Accessibility: ARIA breadcrumb pattern

**APP-005: OrganizationSwitcher**
- Purpose: Switch between organizations
- Props: organizations, currentOrg, onSwitch
- Accessibility: Dropdown menu pattern

**APP-006: UserMenu**
- Purpose: User account menu
- Props: user, onLogout, onProfile
- Accessibility: Menu button pattern`
    }
  ]
};

export const stage15Docs: Document[] = [
  stage15Doc1,
  stage15Doc2,
  stage15Doc3
];
