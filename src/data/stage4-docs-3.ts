import { Document } from './types';

export const stage4Doc6: Document = {
  id: 'onboarding-tutorial',
  number: 6,
  title: 'Onboarding and Guided Tutorial Specification',
  shortTitle: 'Onboarding',
  description: 'Onboarding flow, guided tutorials, contextual help, and first-time user experience.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'ONB-1',
      title: '1. Onboarding Flow',
      content: `**Onboarding Principles:**
- Progressive disclosure: Show only what's needed at each step
- Clear progress: Visual indicator of completion
- Skip option: Allow experienced users to bypass
- Contextual: Adapt to user's role and industry
- Reversible: Users can revisit settings later

**Onboarding Steps (6-8 steps total):**

**Step 1: Welcome**
- Welcome message with user's name
- Brief platform overview (1-2 sentences)
- "Let's get started" button
- Estimated time: "This will take about 5 minutes"

**Step 2: Organization Details**
- Organization name (pre-filled from invitation if available)
- Industry selection (from catalogue or custom)
- Business description (optional)
- Progress: 1 of 6

**Step 3: Module Selection**
- Show recommended modules based on industry
- Toggle switches to activate/deactivate
- Brief description of each module
- "Use recommended" button for quick setup
- Progress: 2 of 6

**Step 4: Team Structure**
- Create branches/departments (optional)
- Simple tree builder
- Skip option: "Set up later"
- Progress: 3 of 6

**Step 5: Invite Team**
- Email input (multiple)
- Role selection for each invitee
- Skip option: "Invite later"
- Progress: 4 of 6

**Step 6: Import Data (Optional)**
- Options: Import from CSV, connect to existing system, start fresh
- Skip option: "Start with sample data" or "Skip for now"
- Progress: 5 of 6

**Step 7: Review & Confirm**
- Summary of all choices
- Edit links for each section
- "Complete setup" button
- Progress: 6 of 6

**Step 8: Tutorial Offer**
- "Would you like a quick tour?"
- Options: "Yes, show me around" or "No, I'll explore on my own"
- If yes: Start guided tutorial
- If no: Go to dashboard

**Progress Indicator:**
- Stepper component at top
- Shows completed steps (checkmarks)
- Current step highlighted
- Future steps grayed out
- Click completed steps to go back

**Navigation:**
- Back button: Return to previous step
- Next button: Continue to next step
- Skip link: Skip optional steps
- Progress text: "Step X of Y"

**Data Persistence:**
- Auto-save draft after each step
- Resume if user leaves and returns
- Clear draft after completion`
    },
    {
      id: 'ONB-2',
      title: '2. Guided Tutorial System',
      content: `**Tutorial Principles:**
- Interactive: Highlight real UI elements
- Concise: 1-2 sentences per step
- Contextual: Teach what user needs at that moment
- Skippable: Always provide skip option
- Restartable: Can restart from settings

**Tutorial Structure:**

**Step 1: Dashboard Overview**
- Highlight: Dashboard area
- Message: "This is your dashboard. It shows key metrics and recent activity."
- Action: None (informational)
- Duration: 5 seconds or click "Next"

**Step 2: Navigation**
- Highlight: Left sidebar
- Message: "Use the navigation to access different modules. Click CRM to see your leads and contacts."
- Action: User clicks CRM (or "Next" to skip)
- Duration: Until action or 10 seconds

**Step 3: Creating a Lead**
- Highlight: "+ New" button
- Message: "Click here to create a new lead, contact, or other record."
- Action: User clicks button (or "Next")
- Duration: Until action or 10 seconds

**Step 4: Lead Form**
- Highlight: Lead form
- Message: "Fill in the lead details. Required fields are marked with an asterisk."
- Action: None (informational)
- Duration: 5 seconds or "Next"

**Step 5: Saving**
- Highlight: Save button
- Message: "Click Save to create the lead. You can also cancel to discard changes."
- Action: User clicks Save (or "Next")
- Duration: Until action or 10 seconds

**Step 6: Lead List**
- Highlight: Lead list
- Message: "Your leads appear here. Use filters and search to find specific leads."
- Action: None (informational)
- Duration: 5 seconds or "Next"

**Step 7: Completion**
- Message: "Great! You're ready to start using ClickIT. You can restart this tour anytime from Settings."
- Action: "Go to Dashboard" button
- Duration: Until action

**Tutorial UI:**

**Spotlight Overlay:**
- Dimmed background (black 50% opacity)
- Highlighted element: Full color, no dimming
- Spotlight border: 2px solid Blue, 8px radius
- Subtle pulse animation (2 seconds, then stops)

**Tooltip:**
- Position: Near highlighted element (auto-positioned to avoid overflow)
- Background: White
- Border: 1px Gray 200
- Border radius: 8px
- Padding: 16px
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
- Max width: 320px
- Arrow: Points to highlighted element

**Tooltip Content:**
- Step indicator: "Step 3 of 7"
- Message: Clear, concise instruction
- Buttons: "Skip tour" (text link), "Back" (if not first step), "Next" (primary button)
- Progress bar: Thin line at top showing completion

**Keyboard Navigation:**
- Tab: Move focus within tooltip
- Enter: Activate focused button
- Escape: Skip tour (with confirmation)
- Arrow keys: Navigate between steps (optional)

**Accessibility:**
- Screen reader announces: "Tutorial step 3 of 7: [message]"
- Focus trapped within tooltip
- Skip link clearly announced
- Reduced motion: Disable pulse animation

**Tutorial Management:**
- Store completion status per user
- Allow restart from Settings → Help → Restart tutorial
- Track which steps completed
- Resume if interrupted`
    },
    {
      id: 'ONB-3',
      title: '3. Contextual Help and Empty States',
      content: `**Contextual Help:**

**Help Icons:**
- Location: Next to complex field labels or section titles
- Icon: Info circle (Gray 400, 16px)
- Hover: Show tooltip with explanation
- Click: Open help panel (if detailed)
- Tooltip: Max 200 characters, plain language

**Help Panel:**
- Slide-in from right
- Width: 400px
- Content: Detailed explanation, examples, links to documentation
- Close button: Top right
- Can be opened from multiple help icons

**Tooltips:**
- Delay: 300ms before showing
- Position: Auto (above, below, left, right based on space)
- Max width: 240px
- Auto-hide: On mouse leave or after 5 seconds
- Keyboard: Show on focus, hide on blur

**Empty States:**

**List Empty State:**
\`\`\`
[Illustration: Relevant to module, friendly style]

[Title] No leads yet

[Description] Leads are potential customers. Create your first lead to start tracking your sales pipeline.

[Primary button] Create your first lead

[Secondary link] Learn more about leads
\`\`\`

**Dashboard Empty State:**
\`\`\`
[Illustration: Dashboard/chart style]

[Title] Welcome to your dashboard

[Description] Your dashboard will show key metrics and insights once you start using ClickIT. Here's how to get started:

[Bullet list]
• Add your first leads and contacts
• Create opportunities to track deals
• Invite team members to collaborate

[Primary button] Take a tour

[Secondary link] View documentation
\`\`\`

**Search Empty State:**
\`\`\`
[Icon: Search (Gray 400, 48px)]

[Title] No results found

[Description] We couldn't find anything matching "[search term]". Try a different search or check your filters.

[Secondary link] Clear filters
\`\`\`

**Error Empty State:**
\`\`\`
[Icon: Error (Red, 48px)]

[Title] Unable to load data

[Description] Something went wrong while loading your data. This might be a temporary issue.

[Primary button] Try again

[Secondary link] Contact support
\`\`\`

**Permission Denied State:**
\`\`\`
[Icon: Lock (Gray 400, 48px)]

[Title] Access restricted

[Description] You don't have permission to view this page. Contact your administrator if you believe this is an error.

[Secondary link] Go to dashboard
\`\`\`

**Empty State Principles:**
- Always provide clear next action
- Use friendly, encouraging tone
- Include illustration for visual appeal
- Link to documentation for learning
- Never blame the user`
    }
  ]
};

export const stage4Doc7: Document = {
  id: 'bi-decision-ux',
  number: 7,
  title: 'Business Intelligence and Decision UX',
  shortTitle: 'BI & Decision UX',
  description: 'Intelligence experience connecting metrics to explanations, predictions, recommendations, and approvals.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'BI-1',
      title: '1. Intelligence Cycle UX',
      content: `**Intelligence Cycle (7 Steps):**

**Step 1: What is happening? (Observation)**
- Show verified metric or operational fact
- Display data source and freshness
- Example: "Revenue down 12% this month vs. last month"
- UI: KPI card with trend indicator, data source badge

**Step 2: Why is it happening? (Explanation)**
- Present contributing factors with evidence
- Show correlation, not just causation
- Example: "Retail segment down 23%, wholesale up 5%"
- UI: Expandable insight card with evidence list

**Step 3: What might happen next? (Prediction)**
- Show prediction ONLY when data and validated model support it
- Clearly label as prediction, not fact
- Show confidence level and uncertainty range
- Example: "If trend continues, Q4 revenue may be $X (±Y%)"
- UI: Prediction card with confidence meter, disclaimer

**Step 4: What could we do? (Options)**
- Present practical, context-aware options
- Based on business rules and historical patterns
- Example: "Option A: Review pricing. Option B: Increase marketing. Option C: Focus on wholesale."
- UI: Options list with pros/cons

**Step 5: What action is proposed? (Recommendation)**
- State specific action with expected impact
- Show assumptions, risks, uncertainty
- Example: "Recommend reviewing retail pricing. Expected impact: +8% revenue. Assumption: Price elasticity unchanged."
- UI: Recommendation card with full details

**Step 6: Who must approve it? (Approval)**
- Apply organization's permission and approval rules
- Show approval chain
- Example: "Requires approval from Finance Manager"
- UI: Approval flow diagram, approve/reject buttons

**Step 7: What happened afterward? (Outcome)**
- Track actual outcome vs. prediction
- Measure impact of action taken
- Example: "After price review, retail revenue up 10% in 30 days"
- UI: Outcome card with before/after comparison

**UI Components:**

**Insight Card:**
- Icon: Lightbulb (Blue)
- Title: Clear statement
- Evidence: Bullet list of supporting data
- Confidence: High/Medium/Low badge
- Data freshness: "Based on data from 2 hours ago"
- Actions: "Learn more", "Dismiss"

**Prediction Card:**
- Icon: Trend line (Blue)
- Title: Prediction statement
- Prediction: Value with uncertainty range
- Confidence meter: Visual indicator (0-100%)
- Disclaimer: "This is a prediction based on historical data. Actual results may vary."
- Model info: "Based on [model name] v[version]"
- Actions: "View details", "Dismiss"

**Recommendation Card:**
- Icon: Check circle (Green)
- Title: Recommended action
- Expected impact: Quantified benefit
- Assumptions: List of assumptions
- Risks: List of potential risks
- Confidence: High/Medium/Low
- Approval required: Yes/No
- Actions: "Approve", "Reject", "Modify", "Learn more"`
    },
    {
      id: 'BI-2',
      title: '2. Insights Panel',
      content: `**Insights Panel Design:**

**Location:**
- Dedicated "Insights" page in Intelligence module
- Also shown as widget on dashboards
- Accessible from notification bell (if urgent)

**Layout:**
- List of insight cards
- Sorted by: Priority (high to low), then recency
- Filter by: Type (observation, prediction, recommendation), module, date range
- Search: Full-text search across insights

**Insight Card (Expanded View):**

\`\`\`
[Icon] [Type badge: Observation/Prediction/Recommendation]

[Title] Revenue down 12% this month

[Evidence section]
Contributing factors:
• Retail segment down 23% (largest contributor)
• Wholesale segment up 5% (offsetting partially)
• Customer acquisition cost increased 18%
• Average deal size decreased 8%

[Data freshness] Based on data from 2 hours ago

[Actions]
[View detailed analysis] [Dismiss] [Share]
\`\`\`

**Prediction Card (Expanded View):**

\`\`\`
[Icon] [Type badge: Prediction]

[Title] Q4 revenue forecast: $1.2M (±15%)

[Prediction details]
Forecast: $1.2M
Confidence: 72%
Range: $1.02M - $1.38M

[Methodology]
Based on: Historical trends, seasonality, pipeline data
Model: Revenue Forecast v2.3
Training data: Last 24 months

[Disclaimer]
This is a prediction based on historical patterns and current pipeline. Actual results may vary due to market conditions, team performance, and other factors.

[Actions]
[View forecast details] [Adjust assumptions] [Dismiss]
\`\`\`

**Recommendation Card (Expanded View):**

\`\`\`
[Icon] [Type badge: Recommendation]

[Title] Review retail pricing strategy

[Expected impact]
Revenue increase: +8% (estimated $96K/month)
Confidence: Medium (65%)

[Action plan]
1. Analyze current pricing vs. competitors
2. Identify products with highest price elasticity
3. Test 5-10% price increase on top 10 products
4. Monitor impact over 30 days

[Assumptions]
• Price elasticity remains stable
• Competitors don't respond immediately
• Customer retention unaffected

[Risks]
• Customer pushback on price increases
• Competitor price matching
• Market demand sensitivity

[Approval required]
Yes — Finance Manager approval needed

[Actions]
[Approve] [Reject] [Request changes] [Learn more]
\`\`\`

**Empty States:**
- No insights: "No insights yet. Insights will appear as you use ClickIT and data accumulates."
- No predictions: "Not enough data for predictions yet. Continue using the platform to enable forecasting."
- No recommendations: "No recommendations at this time. Recommendations are generated based on your business patterns and goals."`
    },
    {
      id: 'BI-3',
      title: '3. AI Assistant Interface',
      content: `**AI Assistant Design:**

**Location:**
- Floating button (bottom right) on all pages
- Click to open chat panel
- Also accessible from keyboard shortcut (Cmd/Ctrl + /)

**Chat Panel:**
- Width: 400px
- Height: 600px (max)
- Position: Bottom right, above floating button
- Slide-up animation

**Layout:**
\`\`\`
[Header]
AI Assistant [Close button]

[Chat history]
[Scrollable area with messages]

User: What are my top opportunities this quarter?
Assistant: Your top 5 opportunities this quarter are:
1. Acme Corp — $150K (80% probability)
2. TechStart — $95K (65% probability)
3. GlobalTech — $80K (70% probability)
...

[Quick actions]
[View pipeline] [Create opportunity] [Export report]

[Input area]
[Text input: "Ask me anything..."]
[Send button]
\`\`\`

**Message Types:**

**User Message:**
- Background: Blue 50
- Alignment: Right
- Avatar: User avatar (small)

**Assistant Message:**
- Background: White
- Alignment: Left
- Avatar: AI icon (small)
- Content: Text, lists, tables, charts (as needed)
- Actions: Contextual buttons below message

**Quick Actions:**
- Appear below assistant messages
- Buttons for common follow-up actions
- Example: After showing opportunities: [View pipeline] [Create opportunity]

**Tool Execution:**
- When AI uses a tool, show progress:
\`\`\`
Assistant: Let me check your pipeline...
[Loading indicator] Searching opportunities...
Assistant: Found 23 opportunities matching your criteria.
\`\`\`

**Confirmation for Actions:**
- For write operations, show confirmation:
\`\`\`
Assistant: I can create a task for you. Here's what I'll create:
- Title: Follow up with Acme Corp
- Due: Next Friday
- Assigned to: You

[Confirm] [Cancel]
\`\`\`

**Error Handling:**
- If AI can't help: "I'm not sure how to help with that. Try asking about leads, opportunities, or reports."
- If tool fails: "I encountered an error while [action]. Please try again or contact support."
- If unauthorized: "You don't have permission to [action]. Contact your administrator."

**Accessibility:**
- Screen reader announces new messages
- Keyboard navigation: Tab through messages, Enter to activate buttons
- Focus management: Focus input after sending message
- Reduced motion: Disable slide animations`
    }
  ]
};

export const stage4Doc8: Document = {
  id: 'industry-adaptive-ux',
  number: 8,
  title: 'Industry-Adaptive UX Specification',
  shortTitle: 'Industry UX',
  description: 'Industry selection, custom industries, configurable terminology, and industry-specific workflows.',
  status: 'Recorded',
  stage: 4,
  sections: [
    {
      id: 'IND-1',
      title: '1. Industry Selection Experience',
      content: `**Industry Selection Screen:**

**Layout:**
- Search input at top (full width)
- Category tabs below (Technology, Retail, Manufacturing, etc.)
- Industry grid (cards) below tabs
- "Other" option at bottom

**Search Behavior:**
- Real-time filtering as user types
- Searches: Industry names, descriptions, keywords
- Shows matching industries across all categories
- Highlights matching text
- "No results? Define custom industry" link

**Category Tabs:**
- Horizontal scrollable list
- Active tab: Blue underline
- "All" tab shows all industries
- Categories: Technology, Retail, Manufacturing, Healthcare, Education, Finance, Construction, Logistics, Agriculture, Professional Services, etc.

**Industry Cards:**
- Grid layout (3 columns desktop, 2 tablet, 1 mobile)
- Card content:
  - Icon (industry-specific)
  - Industry name
  - Brief description (1-2 lines)
  - "Select" button
- Hover: Subtle shadow increase
- Selected: Blue border, checkmark icon

**"Other" Option:**
- Prominent card at bottom
- Icon: Plus circle
- Text: "My industry is not listed"
- Click: Opens custom industry form

**Custom Industry Form:**
\`\`\`
[Back arrow] Define your industry

[Industry name input]
Label: "Industry name"
Placeholder: "e.g., Renewable Energy Consulting"
Required: yes

[Description textarea]
Label: "Describe your business activities"
Placeholder: "What does your organization do? What products or services do you provide?"
Required: yes
Max length: 500 characters

[Products/Services input]
Label: "Key products or services"
Placeholder: "e.g., Solar panel installation, energy audits"
Optional

[Continue button]
\`\`\`

**After Selection:**
- Show confirmation: "Great! You've selected [industry name]."
- Brief description of what this means: "We'll customize your experience with relevant modules, terminology, and workflows."
- "Continue" button to proceed to module configuration

**AI Assistance (Optional):**
- After industry selection, offer AI suggestions:
- "Based on your industry, we recommend activating these modules: [list]"
- "We suggest using these terms: [mapping]"
- User can accept, modify, or reject each suggestion
- Clear label: "AI suggestions (optional)"`
    },
    {
      id: 'IND-2',
      title: '2. Configurable Terminology',
      content: `**Terminology Customization:**

**Purpose:**
- Different industries use different terms for same concepts
- Example: "Lead" vs. "Prospect" vs. "Opportunity"
- Allow organizations to use familiar language

**Terminology Settings:**
- Location: Settings → Organization → Terminology
- List of standard terms with custom alternatives
- Search/filter functionality
- Reset to defaults option

**Terminology Table:**
\`\`\`
Standard Term    | Custom Term      | Context
-----------------|------------------|------------------
Lead             | Prospect         | CRM module
Opportunity      | Deal             | Sales module
Quotation        | Proposal         | Sales module
Invoice          | Bill             | Finance module
Customer         | Client           | CRM module
Employee         | Team Member      | HR module
Project          | Engagement       | Projects module
\`\`\`

**Edit Behavior:**
- Click cell to edit
- Inline editing with save/cancel
- Validation: Max 50 characters, no special characters
- Preview: Show how term appears in UI
- Save: Apply immediately across application

**Application:**
- Terminology changes apply globally
- Affects: Navigation labels, buttons, form labels, reports
- Does NOT affect: Database field names, API contracts
- Requires page refresh to see all changes

**Default Values:**
- Pre-populated with industry-standard terms
- Based on selected industry during onboarding
- Can be customized at any time

**Accessibility:**
- Screen reader announces custom terms
- Consistent usage across application
- Clear indication when using custom terminology`
    },
    {
      id: 'IND-3',
      title: '3. Module Activation and Configuration',
      content: `**Module Activation:**

**During Onboarding:**
- Show recommended modules based on industry
- Toggle switches to activate/deactivate
- Brief description of each module
- "Use recommended" button for quick setup

**Module Card:**
\`\`\`
[Icon] [Module name]

[Brief description]

[Toggle switch] Active/Inactive

[Learn more link]
\`\`\`

**After Onboarding:**
- Location: Settings → Modules
- Same interface as onboarding
- Can activate/deactivate at any time
- Warning if deactivating module with data: "This module contains data. Deactivating will hide it but not delete it."

**Module Configuration:**

**Per-Module Settings:**
- Each module has its own settings page
- Location: Settings → [Module Name]
- Configuration options vary by module

**Example: CRM Settings**
\`\`\`
CRM Settings

[Lead Management]
Default lead status: New
Auto-assign leads: Yes/No
Assignment rules: [Configure]

[Contact Management]
Duplicate detection: Yes/No
Merge criteria: [Configure]

[Activity Tracking]
Default activity types: Call, Email, Meeting
Require activity logging: Yes/No
\`\`\`

**Example: Finance Settings**
\`\`\`
Finance Settings

[Invoice Management]
Invoice numbering: Automatic/Manual
Prefix: INV-
Default payment terms: Net 30

[Expense Management]
Approval threshold: $[amount]
Receipt required: Yes/No

[Currency]
Base currency: USD
Enable multi-currency: Yes/No
\`\`\`

**Industry-Specific Defaults:**
- Pre-configured based on selected industry
- Example: Retail industry → inventory module activated by default
- Example: Professional services → projects module activated by default
- User can override any default

**Module Dependencies:**
- Some modules require others (e.g., Sales requires CRM)
- Show dependency warning when deactivating required module
- Prevent deactivation if dependent module active`
    }
  ]
};
