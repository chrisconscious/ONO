import { Document } from './types';

export const stage15Doc7: Document = {
  id: 'forms-tables-patterns',
  number: 7,
  title: 'Forms, Tables, and Data-Dense UI Patterns',
  shortTitle: 'Data-Dense Patterns',
  description: 'Patterns for forms, tables, and data-dense interfaces with validation, sorting, filtering, and bulk operations.',
  status: 'Recorded',
  stage: 15,
  sections: [
    {
      id: '15.7.1',
      title: '1. Form Patterns',
      content: `**Form Layout:**
\`\`\`
┌─────────────────────────────────────┐
│ Form Header                         │
│ Title + Description                 │
├─────────────────────────────────────┤
│ Form Sections:                      │
│ ┌─────────────────────────────────┐│
│ │ Section 1: Basic Information    ││
│ │ Field 1                         ││
│ │ Field 2                         ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ Section 2: Details              ││
│ │ Field 3                         ││
│ │ Field 4                         ││
│ └─────────────────────────────────┘│
├─────────────────────────────────────┤
│ Form Actions:                       │
│ [Cancel] [Save Draft] [Submit]      │
└─────────────────────────────────────┘
\`\`\`

**Form Validation:**
- Real-time validation on blur
- Inline error messages below fields
- Error summary at top on submit
- Required field indicators (*)
- Character counters for text fields
- Format validation (email, phone, URL)

**Form States:**
- Empty: Show placeholder text
- Filled: Show entered value
- Valid: Show success state (green border)
- Invalid: Show error state (red border + message)
- Disabled: Gray out field, show tooltip
- Loading: Show spinner in submit button

**Form Types:**
- Create form: All fields empty
- Edit form: Pre-populated with existing data
- View form: Read-only display
- Inline edit: Edit within table row
- Modal form: Edit in modal dialog
- Drawer form: Edit in side drawer

**Field Types:**
- Text input (single line)
- Textarea (multi-line)
- Select (dropdown)
- Multi-select (checkboxes)
- Date picker
- Time picker
- Date-time picker
- Number input
- Currency input
- Percentage input
- File upload
- Rich text editor
- Tag input
- Autocomplete`
    },
    {
      id: '15.7.2',
      title: '2. Table Patterns',
      content: `**Table Layout:**
\`\`\`
┌─────────────────────────────────────────────┐
│ Table Toolbar:                              │
│ [Search] [Filters ▼] [Columns ▼] [Export ▼]│
├─────────────────────────────────────────────┤
│ Bulk Actions (when rows selected):          │
│ ☑ 3 selected [Delete] [Export] [Assign]     │
├─────────────────────────────────────────────┤
│ Table Header:                               │
│ ☐ | Name ↑ | Company | Status | Actions     │
├─────────────────────────────────────────────┤
│ Table Rows:                                 │
│ ☐ | John   | Acme    | Active | [⋮]         │
│ ☐ | Jane   | TechCo  | Pending| [⋮]         │
│ ☐ | Bob    | Startup | Active | [⋮]         │
├─────────────────────────────────────────────┤
│ Pagination:                                 │
│ Rows per page: [50 ▼]                       │
│ Showing 1-50 of 247        [< 1 2 3 ... >] │
└─────────────────────────────────────────────┘
\`\`\`

**Table Features:**
- Sortable columns (click header)
- Resizable columns (drag edge)
- Reorderable columns (drag header)
- Column visibility toggle
- Row selection (checkbox)
- Bulk actions
- Inline editing
- Expandable rows
- Sticky header
- Sticky first column

**Table States:**
- Loading: Skeleton rows
- Empty: "No data found" message
- Error: "Unable to load data" message
- No results: "No results match your filters"

**Responsive Behavior:**
- Desktop: Full table with all columns
- Tablet: Hide less important columns
- Mobile: Convert to card view or horizontal scroll

**Performance:**
- Virtual scrolling for large datasets
- Lazy loading for images
- Debounced search input
- Paginated data loading`
    }
  ]
};

export const stage15Doc8: Document = {
  id: 'loading-empty-error-ux',
  number: 8,
  title: 'Loading, Empty, Error, and Recovery UX',
  shortTitle: 'State UX',
  description: 'UX patterns for loading states, empty states, error states, and recovery flows.',
  status: 'Recorded',
  stage: 15,
  sections: [
    {
      id: '15.8.1',
      title: '1. Loading States',
      content: `**Loading Types:**

**1. Page Load:**
- Full-page skeleton matching layout
- Progress bar at top (optional)
- No interactive elements until loaded

**2. Component Load:**
- Skeleton for specific component
- Spinner overlay for small components
- Shimmer animation for cards/tables

**3. Action Load:**
- Button shows spinner
- Button text changes to "Loading..."
- Button disabled during load
- Prevent double-submission

**4. Infinite Scroll:**
- Spinner at bottom of list
- "Loading more..." message
- Skeleton rows for table

**Loading Duration Guidelines:**
- < 100ms: No loading indicator needed
- 100ms - 1s: Spinner or skeleton
- 1s - 3s: Skeleton with progress indication
- > 3s: Progress bar with percentage
- > 10s: Warning message with cancel option

**Skeleton Design:**
- Match actual content layout
- Use gray colors (gray.200, gray.300)
- Animate with shimmer effect
- Avoid jarring layout shifts`
    },
    {
      id: '15.8.2',
      title: '2. Empty States',
      content: `**Empty State Types:**

**1. First-Time Empty:**
- Illustration or icon
- Friendly message
- Clear call-to-action
- Example: "No leads yet. Create your first lead to get started."

**2. Filtered Empty:**
- Message explaining no results
- Suggestion to adjust filters
- Option to clear filters
- Example: "No leads match your filters. Try adjusting your search criteria."

**3. Error Empty:**
- Error message
- Retry button
- Contact support link
- Example: "Unable to load leads. Please try again."

**Empty State Design:**
- Centered content
- Muted colors (gray.400, gray.500)
- Clear hierarchy (icon → message → action)
- Consistent spacing

**Empty State Messages by Context:**
- List: "No [items] found"
- Search: "No results for '[query]'"
- Filter: "No [items] match your filters"
- Error: "Unable to load [items]"
- Permission: "You don't have access to [items]"`
    },
    {
      id: '15.8.3',
      title: '3. Error States',
      content: `**Error Types:**

**1. Validation Error:**
- Inline error below field
- Red border on field
- Error icon
- Clear error message
- Example: "Email is required"

**2. Form Error:**
- Error summary at top
- List of all errors
- Links to error fields
- Example: "Please fix the following errors: ..."

**3. API Error:**
- Toast notification (transient)
- Inline error (persistent)
- Retry button
- Example: "Failed to save. Please try again."

**4. System Error:**
- Full-page error screen
- Error code
- Contact support link
- Example: "Something went wrong. Please contact support."

**5. Permission Error:**
- Clear message
- No sensitive data exposed
- Contact admin link
- Example: "You don't have permission to access this resource."

**Error Handling Principles:**
- Be specific but not technical
- Provide actionable next steps
- Don't expose sensitive information
- Log errors for debugging
- Offer retry when appropriate
- Preserve user input on error`
    }
  ]
};

export const stage15Doc9: Document = {
  id: 'role-aware-ui',
  number: 9,
  title: 'Role-Aware UI and Permission Presentation',
  shortTitle: 'Role-Aware UI',
  description: 'How the UI adapts based on user roles, permissions, and subscription entitlements.',
  status: 'Recorded',
  stage: 15,
  sections: [
    {
      id: '15.9.1',
      title: '1. Permission-Based UI Adaptation',
      content: `**UI Adaptation Strategies:**

**1. Hide (Not Allowed):**
- Remove navigation item
- Remove button/action
- Remove entire section
- Use when: User has no permission and no path to gain permission

**2. Disable (Not Available):**
- Gray out button
- Show tooltip explaining why disabled
- Use when: User might gain permission later or needs to understand limitation

**3. Show with Lock (Upgrade Required):**
- Show feature with lock icon
- Show upgrade prompt on click
- Use when: Feature requires higher subscription tier

**4. Show with Request (Permission Required):**
- Show feature with "Request Access" button
- Send request to admin
- Use when: User needs admin approval

**Permission Check Flow:**
\`\`\`typescript
function renderAction(action: Action, user: User) {
  // 1. Check subscription entitlement
  if (!user.subscription.includes(action.requiredPlan)) {
    return <UpgradePrompt feature={action.name} />;
  }
  
  // 2. Check user permission
  if (!user.permissions.includes(action.requiredPermission)) {
    if (action.canRequestPermission) {
      return <RequestPermissionButton action={action} />;
    }
    if (action.showDisabled) {
      return <DisabledButton action={action} />;
    }
    return null; // Hide completely
  }
  
  // 3. Check data scope
  if (!user.hasAccessToData(action.dataScope)) {
    return <DisabledButton action={action} reason="No access to this data" />;
  }
  
  // 4. Render action
  return <ActionButton action={action} />;
}
\`\`\``
    },
    {
      id: '15.9.2',
      title: '2. Role-Specific Dashboards',
      content: `**Dashboard Variations by Role:**

**Sales Rep Dashboard:**
- My leads (count, recent)
- My opportunities (pipeline value, stages)
- My tasks (due today, overdue)
- My activities (recent)
- My performance (quota attainment)

**Sales Manager Dashboard:**
- Team leads (count, conversion rate)
- Team opportunities (pipeline value, win rate)
- Team tasks (completion rate)
- Team performance (quota attainment by rep)
- Forecast (team forecast vs target)

**Admin Dashboard:**
- Organization metrics (users, storage, usage)
- System health (uptime, errors)
- Recent activity (audit log)
- Pending approvals (count)
- Subscription status (plan, usage, billing)

**Executive Dashboard:**
- Revenue (actual vs target)
- Pipeline (value, velocity)
- Customer metrics (acquisition, retention)
- Team performance (productivity, efficiency)
- Strategic KPIs (growth, profitability)

**Dashboard Configuration:**
- Role determines default dashboard
- Users can customize layout
- Admins can set organization defaults
- Widgets respect data scope permissions`
    }
  ]
};

export const stage15Doc10: Document = {
  id: 'bi-ai-interface',
  number: 10,
  title: 'BI and AI Decision Interface Specification',
  shortTitle: 'BI/AI Interface',
  description: 'Interface specifications for business intelligence, AI insights, and decision support features.',
  status: 'Recorded',
  stage: 15,
  sections: [
    {
      id: '15.10.1',
      title: '1. BI Dashboard Interface',
      content: `**Dashboard Components:**

**1. KPI Card:**
\`\`\`
┌─────────────────────┐
│ Revenue             │
│ $1.2M               │
│ ↑ 15% vs last month │
│ [View details →]    │
└─────────────────────┘
\`\`\`

**2. Trend Chart:**
- Line chart for time series
- Bar chart for comparisons
- Area chart for cumulative
- Interactive tooltips
- Zoom and pan controls
- Time range selector

**3. Data Table:**
- Sortable columns
- Filterable rows
- Exportable data
- Drill-down links
- Inline editing (if permitted)

**4. Insight Card:**
\`\`\`
┌─────────────────────────────────────┐
│ 💡 Insight                          │
├─────────────────────────────────────┤
│ Revenue declined 15% this month.    │
│                                     │
│ Contributing factors:               │
│ • Enterprise segment down 23%       │
│ • Customer acquisition cost up 18%  │
│                                     │
│ [View analysis] [Dismiss]           │
└─────────────────────────────────────┘
\`\`\`

**Data Freshness Indicators:**
- "Updated 2 minutes ago" (green)
- "Updated 1 hour ago" (yellow)
- "Updated 1 day ago" (orange)
- "Updated 1 week ago" (red)
- Click to refresh`
    },
    {
      id: '15.10.2',
      title: '2. AI Recommendation Interface',
      content: `**Recommendation Card:**
\`\`\`
┌─────────────────────────────────────┐
│ 🤖 Recommendation                   │
├─────────────────────────────────────┤
│ Increase marketing spend by 20%     │
│                                     │
│ Expected Impact:                    │
│ • Revenue: +$50K (±$10K)            │
│ • Confidence: 75%                   │
│                                     │
│ Evidence:                           │
│ • Q3 campaign achieved 25% lift     │
│ • Current spend below benchmark     │
│                                     │
│ Risks:                              │
│ • Market conditions may change      │
│ • Requires $25K additional budget   │
│                                     │
│ [Approve] [Reject] [Modify]         │
│                                     │
│ Requires: Finance Manager approval  │
└─────────────────────────────────────┘
\`\`\`

**AI Confidence Display:**
- High confidence (80-100%): Green badge
- Medium confidence (60-79%): Yellow badge
- Low confidence (40-59%): Orange badge
- Very low confidence (<40%): Red badge

**Evidence Citation:**
- Link to source data
- Show data freshness
- Indicate data quality
- Allow drill-down to source

**AI Limitations Disclosure:**
- "Based on historical data"
- "Does not account for [factor]"
- "Confidence may vary by segment"
- "Review before acting on critical decisions"

**AI Action Approval:**
- Low-risk actions: Auto-execute with notification
- Medium-risk actions: Require user confirmation
- High-risk actions: Require manager approval
- Critical actions: Require executive approval`
    }
  ]
};

export const stage15DocsExtended: Document[] = [
  stage15Doc7,
  stage15Doc8,
  stage15Doc9,
  stage15Doc10
];
