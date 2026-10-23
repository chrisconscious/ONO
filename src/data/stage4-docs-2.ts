import { Document } from './types';

export const stage4Doc3: Document = {
  id: 'navigation-architecture',
  number: 3,
  title: 'Information Architecture and Navigation',
  shortTitle: 'Navigation',
  description: 'Global navigation structure, module organization, breadcrumbs, search, and navigation patterns.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'NAV-1',
      title: '1. Global Navigation Structure',
      content: `**Navigation Layout:**
- Left sidebar (collapsible) for primary navigation
- Top bar for global actions (search, notifications, user menu)
- Breadcrumbs for context within modules
- Contextual actions within each page

**Primary Navigation Groups:**

**Workspace (Top)**
- Dashboard (role-specific)
- Recent (recently viewed records)
- Favorites (user-starred items)

**CRM**
- Leads
- Contacts
- Companies
- Activities

**Sales**
- Opportunities
- Pipeline
- Quotations
- Orders
- Contracts

**Marketing**
- Campaigns
- Performance

**Finance**
- Invoices
- Payments
- Expenses
- Budgets
- Reports

**Operations**
- Inventory
- Procurement
- Projects
- Workforce

**Support**
- Cases
- Knowledge Base

**Intelligence**
- Dashboards
- Reports
- Insights
- Recommendations

**Settings (Bottom)**
- Organization
- Users & Roles
- Integrations
- Audit Log
- Profile

**Navigation Rules:**
- Only show modules user has permission to access
- Group related modules together
- Show active state clearly (blue left border + blue text)
- Collapse to icons on small screens or when manually collapsed
- Expand on hover when collapsed
- Remember user's collapsed/expanded preference`
    },
    {
      id: 'NAV-2',
      title: '2. Navigation States',
      content: `**Default State:**
- Background: White
- Text: Gray 600
- Icon: Gray 500
- No border

**Hover State:**
- Background: Gray 50
- Text: Gray 800
- Icon: Gray 700
- Transition: 150ms ease

**Active State:**
- Background: Blue 50 (#EFF6FF)
- Text: Blue (#2563EB)
- Icon: Blue (#2563EB)
- Left border: 3px solid Blue
- Font weight: 500

**Focus State:**
- Outline: 2px Blue, offset 2px
- Same colors as hover

**Expanded Submenu:**
- Parent item: Active state
- Submenu items: Indented 16px
- Submenu background: White
- Submenu items: Same states as primary

**Collapsed State (Icons Only):**
- Width: 64px
- Icons: 24px, centered
- Tooltip on hover showing full label
- Active: Blue icon + left border
- Submenu: Flyout on hover

**Mobile Navigation:**
- Hamburger menu in top bar
- Full-screen overlay when open
- Same structure as desktop
- Close button (X) in top right
- Swipe left to close

**Badge Indicators:**
- Notification count on "Dashboard" (if pending approvals)
- Task count on "Projects" (if assigned tasks)
- Case count on "Support" (if unassigned cases)
- Badge: Red circle with white number, max "99+"
- Position: Top right of nav item`
    },
    {
      id: 'NAV-3',
      title: '3. Top Bar Components',
      content: `**Top Bar Layout (Left to Right):**

**Left Section:**
- Logo (ClickIT mark, 32px × 32px)
- Organization name (clickable → organization switcher if multi-org)

**Center Section:**
- Global search input (width: 400px desktop, hidden on mobile)
- Placeholder: "Search leads, contacts, invoices..."
- Keyboard shortcut: Cmd/Ctrl + K
- Search results: Dropdown with categorized results

**Right Section:**
- Create button (blue, "+ New" with dropdown for quick create options)
- Notifications bell (with badge for unread count)
- User avatar (clickable → profile menu)

**Global Search:**
- Searches across all accessible modules
- Results grouped by type (Leads, Contacts, Invoices, etc.)
- Shows top 5 results per category
- "View all results" link for each category
- Recent searches (last 10)
- Keyboard navigation (arrow keys, enter to select)
- Escape to close

**Notifications Panel:**
- Slide-down panel from bell icon
- Tabs: All, Unread, Mentions
- Notification items: Icon, title, description, timestamp, read/unread state
- Mark as read on click
- "Mark all as read" button
- "View all notifications" link
- Empty state: "No notifications"

**User Menu:**
- Dropdown from avatar
- Items: Profile, Settings, Help & Support, Sign Out
- Divider before Sign Out
- Shows user name and email at top

**Quick Create Dropdown:**
- Triggered by "+ New" button
- Options based on permissions: Lead, Contact, Opportunity, Invoice, Task, etc.
- Each option opens create form in modal or navigates to create page
- Most frequently used items at top
- Customizable order`
    },
    {
      id: 'NAV-4',
      title: '4. Breadcrumbs and Context',
      content: `**Breadcrumb Pattern:**
- Location: Below top bar, above page content
- Format: Module > Section > Current Page
- Example: CRM > Leads > John Doe (Acme Corp)
- Separator: Chevron icon (Gray 400)
- Links: All except last item are clickable
- Last item: Gray 800, not clickable (current page)
- Truncation: If path too long, truncate middle with "..."

**Breadcrumb Examples:**
\`\`\`
Dashboard
CRM > Leads
CRM > Leads > John Doe
CRM > Leads > John Doe > Edit
Sales > Opportunities > Q4 Enterprise Deal
Finance > Invoices > INV-2024-001
Projects > Website Redesign > Tasks
Settings > Users & Roles
\`\`\`

**Page Header:**
- Location: Below breadcrumbs
- Components:
  - Page title (H1)
  - Subtitle/description (optional)
  - Action buttons (right-aligned)
  - Tabs (if multiple views)

**Page Header Examples:**

**List Page:**
\`\`\`
[Title] Leads
[Subtitle] Manage and track all sales leads
[Actions] [+ Create Lead] [Filter] [Export]
[Tabs] All | My Leads | Unassigned
\`\`\`

**Detail Page:**
\`\`\`
[Back] ← Back to Leads
[Title] John Doe
[Subtitle] Acme Corp • Qualified • Owner: Sarah Chen
[Actions] [Edit] [Convert to Opportunity] [More ⋮]
\`\`\`

**Edit Page:**
\`\`\`
[Back] ← Back to John Doe
[Title] Edit Lead
[Subtitle] Update lead information
[Actions] [Save] [Cancel]
\`\`\``
    },
    {
      id: 'NAV-5',
      title: '5. Contextual Navigation',
      content: `**Within List Pages:**
- Filters: Collapsible filter panel above table
- Views: Saved view selector (dropdown)
- Bulk actions: Appear when items selected (floating bar)
- Pagination: Bottom of table (prev/next, page numbers, items per page)

**Within Detail Pages:**
- Tabs: For related information (Activity, Notes, Documents, etc.)
- Related records: Sidebar or section showing related items
- Quick actions: Context menu (⋮) for additional actions
- Status indicator: Prominent status badge

**Within Forms:**
- Sections: Group related fields with dividers
- Progress: For multi-step forms (stepper component)
- Validation: Inline errors below fields
- Save behavior: Auto-save draft or explicit save button

**Contextual Menus:**
- Trigger: Three-dot icon (⋮) or right-click
- Position: Below trigger, aligned right
- Items: Edit, Delete, Archive, etc. (based on permissions)
- Destructive actions: Red text, separator above
- Keyboard: Arrow keys to navigate, Enter to select, Escape to close

**Empty States:**
- Illustration: Friendly, relevant to context
- Title: Clear explanation (e.g., "No leads yet")
- Description: What belongs here and why it's empty
- Call-to-action: Primary button to create first item
- Secondary action: Link to documentation or tutorial

**Loading States:**
- Skeleton screens: Match layout of loaded content
- Spinners: For buttons and small components
- Progress bars: For long operations (uploads, exports)
- Shimmer effect: Subtle animation on skeletons

**Error States:**
- Icon: Error icon (red)
- Title: Clear error message
- Description: What went wrong and how to fix
- Action: Retry button or contact support link
- Tone: Empathetic, solution-oriented`
    }
  ]
};

export const stage4Doc4: Document = {
  id: 'role-dashboards',
  number: 4,
  title: 'Role-Specific Dashboard Specifications',
  shortTitle: 'Dashboards',
  description: 'Dashboard experiences for different user roles with KPIs, widgets, and role-relevant information.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'DASH-1',
      title: '1. Dashboard Framework',
      content: `**Dashboard Principles:**
- Role-relevant: Show what matters for user's responsibilities
- Actionable: Connect metrics to actions and decisions
- Current: Show data freshness and last updated time
- Customizable: Allow users to rearrange widgets (within role constraints)
- Performant: Load within 2 seconds, lazy-load non-critical widgets

**Dashboard Layout:**
- Grid system: 12 columns
- Widget sizes: Small (3 cols), Medium (6 cols), Large (12 cols)
- Default layout: Optimized for role, user can customize
- Responsive: Stack widgets on mobile

**Widget Types:**
- KPI Card: Single metric with trend indicator
- Chart: Line, bar, pie, area charts
- Table: Top items list with key metrics
- List: Recent activity or tasks
- Alert: Exception or attention-needed item
- Quick Action: Button for common task

**Common Dashboard Elements:**
- Time period selector: Today, This Week, This Month, This Quarter, This Year, Custom
- Comparison: vs. previous period, vs. target
- Refresh button: Manual refresh with last updated timestamp
- Customize button: Enter edit mode to rearrange widgets
- Full-screen mode: For focused viewing`
    },
    {
      id: 'DASH-2',
      title: '2. Business Owner / CEO Dashboard',
      content: `**User Goals:**
- Understand overall business health
- Identify trends and anomalies
- Make strategic decisions
- Monitor key performance indicators

**Key Questions:**
- How is the business performing overall?
- What are the top opportunities and risks?
- Where should I focus attention?
- Are we on track to meet targets?

**Dashboard Widgets:**

**Row 1: Key Metrics (4 KPI cards)**
- Revenue (This Month): $X vs. $Y target (↑/↓ Z%)
- Profit Margin: X% vs. Y% last month
- Active Customers: X (↑/↓ Z from last month)
- Cash Flow: $X positive/negative

**Row 2: Performance Charts (2 large widgets)**
- Revenue Trend (Line chart, last 12 months, with target line)
- Sales Pipeline (Funnel chart, stages with values)

**Row 3: Insights & Actions (2 medium widgets)**
- AI Insights (3-5 key insights with evidence)
  - "Revenue down 12% in retail segment — recommend reviewing pricing"
  - "Customer acquisition cost increased 23% — evaluate marketing channels"
- Pending Approvals (List of items awaiting approval)
  - Invoice #1234 — $15,000 — From: John Doe
  - Expense Report — $2,300 — From: Jane Smith

**Row 4: Operational Overview (3 small widgets)**
- Top Opportunities (Table, top 5 by value)
- Recent Activity (List, last 10 significant events)
- Team Performance (Bar chart, by department)

**Data Sources:**
- All modules (aggregated)
- Refresh: Every 15 minutes
- Freshness indicator: "Updated 2 minutes ago"

**Empty State:**
- "Welcome to ClickIT! Start by adding your first leads and customers to see insights here."
- Quick start guide link`
    },
    {
      id: 'DASH-3',
      title: '3. Sales Manager Dashboard',
      content: `**User Goals:**
- Monitor team performance
- Track pipeline health
- Identify coaching opportunities
- Forecast revenue

**Key Questions:**
- Is the team on track to hit targets?
- Which deals need attention?
- Where are the bottlenecks?
- Who needs coaching?

**Dashboard Widgets:**

**Row 1: Team Metrics (4 KPI cards)**
- Team Revenue (This Month): $X vs. $Y target
- Pipeline Value: $X (X deals)
- Win Rate: X% (vs. Y% last month)
- Avg. Deal Size: $X

**Row 2: Pipeline & Performance (2 large widgets)**
- Pipeline by Stage (Funnel chart with values)
- Team Performance (Bar chart, revenue by rep)

**Row 3: Deals & Activities (2 medium widgets)**
- Deals at Risk (Table, deals stalled or overdue)
  - Deal name, owner, stage, days in stage, value
- Recent Activities (List, team activities last 7 days)

**Row 4: Coaching & Insights (2 small widgets)**
- AI Recommendations
  - "John has 5 deals stuck in Proposal stage — consider coaching"
  - "Win rate dropped 15% — review qualification criteria"
- Upcoming Follow-ups (List, overdue and due today)

**Permissions:**
- Sees team data (all reps in department)
- Cannot see other departments' data
- Can approve deals above threshold

**Empty State:**
- "No pipeline data yet. Create your first opportunity to see insights."`
    },
    {
      id: 'DASH-4',
      title: '4. Sales Representative Dashboard',
      content: `**User Goals:**
- Manage my pipeline
- Prioritize daily activities
- Track personal performance
- Follow up on leads and opportunities

**Key Questions:**
- What should I work on today?
- Which deals need follow-up?
- How am I performing vs. target?
- What's my commission potential?

**Dashboard Widgets:**

**Row 1: My Metrics (4 KPI cards)**
- My Revenue (This Month): $X vs. $Y target
- My Pipeline: $X (X deals)
- My Win Rate: X%
- Commission (Projected): $X

**Row 2: Today's Priorities (1 large widget)**
- Today's Tasks (List with checkboxes)
  - ☐ Follow up with Acme Corp — Proposal sent 3 days ago
  - ☐ Call John Doe — Demo scheduled 2:00 PM
  - ☐ Send quote to TechStart — Requested yesterday
  - ☐ Update CRM — 5 leads need status update

**Row 3: Pipeline & Activities (2 medium widgets)**
- My Pipeline (Kanban board or list view, my deals by stage)
- Recent Activities (List, my activities last 7 days)

**Row 4: Leads & Insights (2 small widgets)**
- New Leads (List, unassigned or assigned to me, last 7 days)
- AI Suggestions
  - "Acme Corp deal 80% likely to close — send follow-up email"
  - "3 leads haven't been contacted in 5 days — prioritize outreach"

**Permissions:**
- Sees only own data
- Cannot see team members' data
- Can edit own records

**Empty State:**
- "Welcome! Start by creating your first lead or opportunity."`
    },
    {
      id: 'DASH-5',
      title: '5. Finance Manager Dashboard',
      content: `**User Goals:**
- Monitor cash flow and financial health
- Track receivables and payables
- Manage budgets
- Ensure compliance and accuracy

**Key Questions:**
- What's our cash position?
- Which invoices are overdue?
- Are we within budget?
- Any financial risks or anomalies?

**Dashboard Widgets:**

**Row 1: Financial Metrics (4 KPI cards)**
- Cash Balance: $X (↑/↓ from last month)
- Accounts Receivable: $X (X invoices outstanding)
- Accounts Payable: $X (X bills due)
- Net Profit (This Month): $X

**Row 2: Cash Flow & Receivables (2 large widgets)**
- Cash Flow Trend (Line chart, last 12 months, inflow vs. outflow)
- Aging Receivables (Bar chart, by age bucket: 0-30, 31-60, 61-90, 90+ days)

**Row 3: Actions & Alerts (2 medium widgets)**
- Overdue Invoices (Table, top 10 by amount)
  - Invoice #, Customer, Amount, Days Overdue, Actions (Send Reminder)
- Pending Approvals (List)
  - Expense reports, purchase orders, payments awaiting approval

**Row 4: Budget & Insights (2 small widgets)**
- Budget vs. Actual (Bar chart, by department)
- AI Insights
  - "Collections down 18% — consider reviewing payment terms"
  - "Marketing spend 23% over budget — review approvals"

**Permissions:**
- Sees all financial data (within scope)
- Can approve transactions
- Cannot see non-financial operational data (unless permitted)

**Empty State:**
- "No financial data yet. Create your first invoice or expense to see insights."`
    },
    {
      id: 'DASH-6',
      title: '6. Additional Role Dashboards',
      content: `**Operations Manager Dashboard:**
- Inventory levels and stock alerts
- Project status and resource allocation
- Procurement pipeline
- Operational KPIs (efficiency, quality, delivery)

**Project Manager Dashboard:**
- Active projects (status, progress, budget)
- My tasks (assigned, due dates, priority)
- Team workload and capacity
- Milestones and deadlines
- Risks and blockers

**HR / Workforce Manager Dashboard:**
- Employee count and headcount vs. budget
- Open positions and hiring pipeline
- Attendance and leave overview
- Performance review status
- Upcoming reviews and anniversaries

**Customer Support Manager Dashboard:**
- Open cases (by priority, status)
- Average resolution time
- Customer satisfaction score
- Team workload and response times
- SLA compliance

**Marketing Manager Dashboard:**
- Campaign performance (leads generated, conversion rate)
- Marketing spend vs. budget
- Channel performance comparison
- Customer acquisition cost
- ROI by campaign

**Inventory Manager Dashboard:**
- Stock levels (by warehouse, product category)
- Low stock alerts
- Pending purchase orders
- Stock movement trends
- Supplier performance

**Organization Administrator Dashboard:**
- User count and active users
- Pending invitations
- System health and integrations
- Recent audit events
- License usage (if applicable)

**SaaS Platform Administrator Dashboard:**
- Tenant count and growth
- Platform health and performance
- Support tickets
- Billing and subscriptions
- System alerts and incidents

**Common Patterns:**
- All dashboards follow same layout framework
- Widgets are role-specific but use common components
- All dashboards support customization within role constraints
- All dashboards show data freshness and last updated time
- All dashboards have empty states with guidance`
    }
  ]
};

export const stage4Doc5: Document = {
  id: 'auth-ux',
  number: 5,
  title: 'Authentication and Account Access UX',
  shortTitle: 'Authentication UX',
  description: 'Detailed authentication experience including sign-in, MFA, password recovery, and session management.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'AUTH-1',
      title: '1. Sign-In Screen Design',
      content: `**Desktop Layout (Split Screen):**

**Left Side (50% width):**
- High-quality business-oriented image or illustration
- Natural composition with negative space
- Subtle overlay (navy gradient, 20% opacity)
- Optional: Brand tagline or value proposition (1-2 lines max)
- No excessive marketing copy

**Right Side (50% width):**
- White background
- Centered form (max width: 400px)
- Vertical padding: 80px top/bottom

**Form Layout:**
\`\`\`
[Logo: ClickIT mark + wordmark]

Sign in to your account

[Email input]
Label: "Email address"
Placeholder: "you@company.com"
Type: email
Auto-complete: email
Required: yes

[Password input]
Label: "Password"
Type: password
Show/hide toggle: Eye icon (right side of input)
Auto-complete: current-password
Required: yes

[Remember me checkbox] [Forgot password? link]

[Sign in button] (full width, primary blue)

Don't have an account? Contact your administrator
\`\`\`

**Form States:**

**Empty State:**
- All fields empty
- Sign in button enabled but shows validation on submit

**Filling State:**
- Fields show user input
- Real-time validation (email format)
- Password strength indicator (optional)

**Loading State:**
- Sign in button shows spinner
- Button text: "Signing in..."
- Button disabled
- Inputs disabled

**Error State:**
- Inline error below relevant field (red text, error icon)
- Form-level error banner at top (if general error)
- Example: "Invalid email or password. Please try again."
- Fields remain filled (except password)
- Focus on first error field

**Success State:**
- Brief loading (300ms)
- Redirect to dashboard or intended destination
- No success message (redirect is implicit success)

**Mobile Layout:**
- Single column, full width
- Logo at top
- Form below
- Image removed (or shown as small header graphic)
- Padding: 24px horizontal, 40px top`
    },
    {
      id: 'AUTH-2',
      title: '2. Multi-Factor Authentication',
      content: `**MFA Screen Design:**

**Layout:**
- Same split-screen as sign-in (or single column on mobile)
- Form width: 400px max

**Form Layout:**
\`\`\`
[Back arrow] Two-factor authentication

Enter the 6-digit code from your authenticator app

[Code input]
Type: text
Input mode: numeric
Pattern: [0-9]*
Max length: 6
Auto-focus: yes
Auto-format: Add space after 3 digits (123 456)
Paste support: Yes, auto-format pasted code

[Verify button] (full width, primary blue)

Didn't receive a code? Resend
\`\`\`

**Input Behavior:**
- Single input field (not 6 separate inputs)
- Auto-formatting: Spaces for readability
- Paste support: Accept pasted codes, strip spaces
- Auto-submit: When 6 digits entered (optional, with delay)
- Backspace: Clear last digit

**States:**

**Empty:**
- Code input focused
- Verify button disabled

**Filling:**
- Show entered digits
- Verify button enabled when 6 digits

**Verifying:**
- Verify button shows spinner
- Button text: "Verifying..."
- Input disabled

**Invalid Code:**
- Error message: "Invalid code. Please try again."
- Input cleared
- Input focused
- Shake animation (subtle)

**Success:**
- Brief loading (300ms)
- Redirect to app

**Resend Flow:**
- Click "Resend" link
- Show confirmation: "Code sent to your device"
- Disable resend for 60 seconds
- Show countdown timer

**Accessibility:**
- Screen reader announces: "Enter your 6-digit verification code"
- Error announced: "Invalid code. Please try again."
- Keyboard: Tab to input, type digits, Enter to submit`
    },
    {
      id: 'AUTH-3',
      title: '3. Password Recovery Flow',
      content: `**Forgot Password Screen:**

**Form Layout:**
\`\`\`
[Back arrow] Forgot password?

Enter your email address and we'll send you a link to reset your password.

[Email input]
Label: "Email address"
Placeholder: "you@company.com"
Type: email
Required: yes

[Send reset link button] (full width, primary blue)

Remember your password? Sign in
\`\`\`

**States:**

**Empty:**
- Email input empty
- Button enabled

**Submitting:**
- Button shows spinner
- Button text: "Sending..."

**Success:**
- Replace form with success message:
\`\`\`
[Check icon] Check your email

We sent a password reset link to [email].
The link will expire in 1 hour.

Didn't receive the email? Check your spam folder or try again.

[Back to sign in]
\`\`\`
- Do NOT reveal if email exists (security)
- Same message for valid and invalid emails

**Error:**
- Network error: "Unable to send email. Please try again."
- Form remains, error shown

**Reset Password Screen (from email link):**

**Form Layout:**
\`\`\`
Reset your password

Create a new password for your account.

[New password input]
Label: "New password"
Type: password
Show/hide toggle: yes
Password strength indicator: yes (weak/medium/strong)
Requirements list:
  ✓ At least 8 characters
  ✓ Contains uppercase letter
  ✓ Contains lowercase letter
  ✓ Contains number
  (Optional: Contains special character)

[Confirm password input]
Label: "Confirm new password"
Type: password
Show/hide toggle: yes
Validation: Must match new password

[Reset password button] (full width, primary blue)
\`\`\`

**States:**

**Valid Token:**
- Form shown as above
- Real-time validation

**Invalid/Expired Token:**
- Error message: "This reset link is invalid or has expired."
- Link to request new reset: "Request a new reset link"

**Submitting:**
- Button shows spinner
- Button text: "Resetting..."

**Success:**
- Success message: "Your password has been reset."
- Auto-redirect to sign-in after 3 seconds
- Manual link: "Sign in now"

**Accessibility:**
- Password requirements announced to screen reader
- Strength indicator updates dynamically
- Match validation announced on blur`
    },
    {
      id: 'AUTH-4',
      title: '4. Session Management',
      content: `**Session Expiry:**

**Detection:**
- Check session validity on every API call
- Detect 401 Unauthorized responses
- Check session timestamp periodically (every 5 minutes)

**Expiry Warning (5 minutes before):**
- Toast notification: "Your session will expire in 5 minutes"
- "Extend session" button
- Auto-extend on user activity (mouse move, key press)

**Session Expired:**
- Modal overlay: "Your session has expired"
- Message: "For your security, please sign in again."
- "Sign in" button
- Preserve current URL to redirect after sign-in
- Do NOT show error (expiry is normal)

**Sign Out:**
- User menu → Sign Out
- Confirmation: None (sign out is reversible)
- Clear session data
- Redirect to sign-in page
- Show toast: "You have been signed out"

**Concurrent Sessions:**
- Allow multiple simultaneous sessions (different devices/browsers)
- Option to sign out all other sessions (in profile settings)
- Show active sessions list (device, location, last active)

**Security Features:**
- Session timeout: 8 hours (configurable per tenant)
- Absolute timeout: 24 hours (must re-authenticate)
- Secure cookies: httpOnly, secure, sameSite=strict
- CSRF protection on all state-changing requests
- Rate limiting on authentication endpoints

**Remember Me:**
- Checkbox on sign-in form
- Extends session to 30 days
- Still requires re-authentication for sensitive actions
- Stored in secure, httpOnly cookie

**Accessibility:**
- Session expiry modal has focus trap
- Screen reader announces: "Your session has expired. Please sign in again."
- Keyboard: Tab to sign-in button, Enter to proceed`
    }
  ]
};
