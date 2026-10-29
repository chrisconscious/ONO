/**
 * Automation definition types and pure evaluation helpers.
 *
 * The browser may edit a definition, but only the server validates, resolves
 * record variables and executes actions. These helpers contain no I/O so they
 * can be unit tested and reused by the server.
 */

export const AUTOMATION_TRIGGERS = [
  "LEAD_CREATED",
  "LEAD_STATUS_CHANGED",
  "LEAD_ASSIGNED",
  "LEAD_INACTIVE",
  "OPPORTUNITY_CREATED",
  "OPPORTUNITY_STAGE_CHANGED",
  "OPPORTUNITY_WON",
  "OPPORTUNITY_STALLED",
  "TASK_OVERDUE",
] as const;

export type AutomationTrigger = (typeof AUTOMATION_TRIGGERS)[number];

export const AUTOMATION_TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  LEAD_CREATED: "Lead created",
  LEAD_STATUS_CHANGED: "Lead status changed",
  LEAD_ASSIGNED: "Lead assigned",
  LEAD_INACTIVE: "Lead inactive",
  OPPORTUNITY_CREATED: "Opportunity created",
  OPPORTUNITY_STAGE_CHANGED: "Opportunity stage changed",
  OPPORTUNITY_WON: "Opportunity won",
  OPPORTUNITY_STALLED: "Opportunity stalled",
  TASK_OVERDUE: "Task overdue",
};

export const AUTOMATION_CONDITION_FIELDS = [
  "source",
  "status",
  "stage",
  "score",
  "amount",
  "industry",
  "companyName",
  "inactiveDays",
  "stalledDays",
  "overdueDays",
] as const;

export type AutomationConditionField =
  (typeof AUTOMATION_CONDITION_FIELDS)[number];

export const AUTOMATION_CONDITION_LABELS: Record<
  AutomationConditionField,
  string
> = {
  source: "Lead source",
  status: "Lead status",
  stage: "Opportunity stage",
  score: "Lead score",
  amount: "Value or amount",
  industry: "Industry",
  companyName: "Company name",
  inactiveDays: "Days without activity",
  stalledDays: "Days in current stage",
  overdueDays: "Days overdue",
};

export const AUTOMATION_NUMERIC_FIELDS = new Set<AutomationConditionField>([
  "score",
  "amount",
  "inactiveDays",
  "stalledDays",
  "overdueDays",
]);

export const AUTOMATION_OPERATORS = [
  "equals",
  "not_equals",
  "contains",
  "gte",
  "lte",
  "is_set",
  "is_empty",
] as const;

export type AutomationOperator = (typeof AUTOMATION_OPERATORS)[number];

export const AUTOMATION_OPERATOR_LABELS: Record<AutomationOperator, string> = {
  equals: "Equals",
  not_equals: "Does not equal",
  contains: "Contains",
  gte: "Is at least",
  lte: "Is at most",
  is_set: "Is set",
  is_empty: "Is empty",
};

export type AutomationCondition = {
  field: AutomationConditionField;
  operator: AutomationOperator;
  value: string;
};

export const AUTOMATION_ACTION_TYPES = [
  "CREATE_TASK",
  "ASSIGN_LEAD_OWNER",
  "UPDATE_LEAD_STATUS",
  "CREATE_NOTIFICATION",
  "SET_OPPORTUNITY_NEXT_STEP",
] as const;

export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPES)[number];

export const AUTOMATION_ACTION_LABELS: Record<AutomationActionType, string> = {
  CREATE_TASK: "Create a follow-up task",
  ASSIGN_LEAD_OWNER: "Assign the lead owner",
  UPDATE_LEAD_STATUS: "Update lead status",
  CREATE_NOTIFICATION: "Notify a workspace user",
  SET_OPPORTUNITY_NEXT_STEP: "Set the opportunity next step",
};

export type AutomationAction = {
  type: AutomationActionType;
  params: Record<string, string>;
};

export type AutomationDefinition = {
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
};

export type AutomationEvaluationContext = {
  source?: string | null;
  status?: string | null;
  stage?: string | null;
  score?: number | null;
  amount?: number | null;
  industry?: string | null;
  companyName?: string | null;
  inactiveDays?: number | null;
  stalledDays?: number | null;
  overdueDays?: number | null;
};

const LEAD_TRIGGERS = new Set<AutomationTrigger>([
  "LEAD_CREATED",
  "LEAD_STATUS_CHANGED",
  "LEAD_ASSIGNED",
  "LEAD_INACTIVE",
]);

const OPPORTUNITY_TRIGGERS = new Set<AutomationTrigger>([
  "OPPORTUNITY_CREATED",
  "OPPORTUNITY_STAGE_CHANGED",
  "OPPORTUNITY_WON",
  "OPPORTUNITY_STALLED",
]);

export function isAutomationTrigger(value: string): value is AutomationTrigger {
  return (AUTOMATION_TRIGGERS as readonly string[]).includes(value);
}

export function isAutomationActionType(
  value: string,
): value is AutomationActionType {
  return (AUTOMATION_ACTION_TYPES as readonly string[]).includes(value);
}

export function isAutomationConditionField(
  value: string,
): value is AutomationConditionField {
  return (AUTOMATION_CONDITION_FIELDS as readonly string[]).includes(value);
}

export function isAutomationOperator(value: string): value is AutomationOperator {
  return (AUTOMATION_OPERATORS as readonly string[]).includes(value);
}

/** Validates a definition and returns readable errors for the API and UI. */
export function validateAutomationDefinition(
  definition: AutomationDefinition,
): string[] {
  const errors: string[] = [];

  if (!isAutomationTrigger(definition.trigger)) {
    errors.push("Choose a supported trigger.");
    return errors;
  }

  if (definition.actions.length === 0) {
    errors.push("Add at least one action.");
  }
  if (definition.actions.length > 5) {
    errors.push("A workflow can have at most five actions.");
  }
  if (definition.conditions.length > 5) {
    errors.push("A workflow can have at most five conditions.");
  }

  for (const condition of definition.conditions) {
    if (!isAutomationConditionField(condition.field)) {
      errors.push("A condition uses an unsupported field.");
      continue;
    }
    if (!isAutomationOperator(condition.operator)) {
      errors.push("A condition uses an unsupported operator.");
      continue;
    }
    if (
      !["is_set", "is_empty"].includes(condition.operator) &&
      condition.value.trim() === ""
    ) {
      errors.push(`Condition "${AUTOMATION_CONDITION_LABELS[condition.field]}" needs a value.`);
    }
    if (
      AUTOMATION_NUMERIC_FIELDS.has(condition.field) &&
      !["is_set", "is_empty"].includes(condition.operator) &&
      Number.isNaN(Number(condition.value))
    ) {
      errors.push(`Condition "${AUTOMATION_CONDITION_LABELS[condition.field]}" needs a number.`);
    }
  }

  for (const action of definition.actions) {
    if (!isAutomationActionType(action.type)) {
      errors.push("A workflow uses an unsupported action.");
      continue;
    }

    const leadAction =
      action.type === "ASSIGN_LEAD_OWNER" ||
      action.type === "UPDATE_LEAD_STATUS";
    const opportunityAction = action.type === "SET_OPPORTUNITY_NEXT_STEP";

    if (leadAction && !LEAD_TRIGGERS.has(definition.trigger)) {
      errors.push(`${AUTOMATION_ACTION_LABELS[action.type]} is only available for lead triggers.`);
    }
    if (opportunityAction && !OPPORTUNITY_TRIGGERS.has(definition.trigger)) {
      errors.push(
        `${AUTOMATION_ACTION_LABELS[action.type]} is only available for opportunity triggers.`,
      );
    }

    if (action.type === "CREATE_TASK" && !action.params.title?.trim()) {
      errors.push("Create-task actions need a task title.");
    }
    if (action.type === "ASSIGN_LEAD_OWNER" && !action.params.ownerId?.trim()) {
      errors.push("Assign-owner actions need an owner.");
    }
    if (
      action.type === "UPDATE_LEAD_STATUS" &&
      !["CONTACTED", "QUALIFIED", "UNQUALIFIED"].includes(action.params.status)
    ) {
      errors.push(
        "Automation may set a lead to contacted, qualified or unqualified. Conversion and loss require a person.",
      );
    }
    if (action.type === "CREATE_NOTIFICATION" && !action.params.title?.trim()) {
      errors.push("Notification actions need a title.");
    }
    if (
      action.type === "SET_OPPORTUNITY_NEXT_STEP" &&
      !action.params.nextStep?.trim()
    ) {
      errors.push("Next-step actions need the next step text.");
    }
  }

  return [...new Set(errors)];
}

/** Evaluates all conditions with AND semantics. */
export function evaluateAutomationConditions(
  conditions: AutomationCondition[],
  context: AutomationEvaluationContext,
): { matched: boolean; details: Array<{ field: string; matched: boolean }> } {
  const details = conditions.map((condition) => ({
    field: condition.field,
    matched: evaluateCondition(condition, context),
  }));

  return {
    matched: details.every((detail) => detail.matched),
    details,
  };
}

export function evaluateCondition(
  condition: AutomationCondition,
  context: AutomationEvaluationContext,
): boolean {
  const raw = context[condition.field];
  const value = condition.value.trim();

  if (condition.operator === "is_empty") {
    return raw === null || raw === undefined || String(raw).trim() === "";
  }
  if (condition.operator === "is_set") {
    return raw !== null && raw !== undefined && String(raw).trim() !== "";
  }
  if (raw === null || raw === undefined) return false;

  if (AUTOMATION_NUMERIC_FIELDS.has(condition.field)) {
    const numeric = Number(raw);
    const target = Number(value);
    if (Number.isNaN(numeric) || Number.isNaN(target)) return false;
    if (condition.operator === "equals") return numeric === target;
    if (condition.operator === "not_equals") return numeric !== target;
    if (condition.operator === "gte") return numeric >= target;
    if (condition.operator === "lte") return numeric <= target;
    return false;
  }

  const actual = String(raw).toLowerCase();
  const expected = value.toLowerCase();

  switch (condition.operator) {
    case "equals":
      return actual === expected;
    case "not_equals":
      return actual !== expected;
    case "contains":
      return actual.includes(expected);
    default:
      return false;
  }
}

export function describeAutomationCondition(condition: AutomationCondition) {
  const label = AUTOMATION_CONDITION_LABELS[condition.field];
  const operator = AUTOMATION_OPERATOR_LABELS[condition.operator];
  if (condition.operator === "is_set" || condition.operator === "is_empty") {
    return `${label} ${operator.toLowerCase()}`;
  }
  return `${label} ${operator.toLowerCase()} ${condition.value}`;
}

export function describeAutomationAction(action: AutomationAction) {
  switch (action.type) {
    case "CREATE_TASK":
      return `Create task "${action.params.title}"`;
    case "ASSIGN_LEAD_OWNER":
      return "Assign the lead to the configured owner";
    case "UPDATE_LEAD_STATUS":
      return `Set lead status to ${String(action.params.status).toLowerCase()}`;
    case "CREATE_NOTIFICATION":
      return `Notify: ${action.params.title}`;
    case "SET_OPPORTUNITY_NEXT_STEP":
      return `Set next step: ${action.params.nextStep}`;
    default:
      return "Unsupported action";
  }
}

export type AutomationTemplate = {
  id: string;
  name: string;
  description: string;
  definition: AutomationDefinition;
};

/** Ready-to-configure templates. They are never active until a user saves them. */
export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "new-lead-follow-up",
    name: "New lead follow-up",
    description:
      "Create a follow-up task and notify the owner when a lead is captured.",
    definition: {
      trigger: "LEAD_CREATED",
      conditions: [],
      actions: [
        {
          type: "CREATE_TASK",
          params: {
            title: "Follow up with the new lead",
            dueInDays: "1",
            assignee: "record_owner",
            priority: "HIGH",
          },
        },
        {
          type: "CREATE_NOTIFICATION",
          params: {
            title: "New lead needs follow-up",
            body: "A new lead was captured. Review it and complete the follow-up task.",
            audience: "record_owner",
          },
        },
      ],
    },
  },
  {
    id: "lead-inactivity",
    name: "Lead inactivity",
    description:
      "Create a follow-up task when a lead has had no activity for 14 days.",
    definition: {
      trigger: "LEAD_INACTIVE",
      conditions: [
        { field: "inactiveDays", operator: "gte", value: "14" },
        { field: "status", operator: "not_equals", value: "CONVERTED" },
      ],
      actions: [
        {
          type: "CREATE_TASK",
          params: {
            title: "Re-engage the inactive lead",
            dueInDays: "2",
            assignee: "record_owner",
            priority: "MEDIUM",
          },
        },
      ],
    },
  },
  {
    id: "high-priority-lead",
    name: "High-priority lead",
    description:
      "Notify the owner and create a task when a lead score reaches 70 or more.",
    definition: {
      trigger: "LEAD_STATUS_CHANGED",
      conditions: [{ field: "score", operator: "gte", value: "70" }],
      actions: [
        {
          type: "CREATE_TASK",
          params: {
            title: "Prioritise this high-scoring lead",
            dueInDays: "1",
            assignee: "record_owner",
            priority: "HIGH",
          },
        },
        {
          type: "CREATE_NOTIFICATION",
          params: {
            title: "High-priority lead",
            body: "A lead reached a score of 70 or more and needs attention.",
            audience: "record_owner",
          },
        },
      ],
    },
  },
  {
    id: "opportunity-stalled",
    name: "Opportunity stalled",
    description:
      "Create a next-step task when a deal remains in its stage for 21 days.",
    definition: {
      trigger: "OPPORTUNITY_STALLED",
      conditions: [{ field: "stalledDays", operator: "gte", value: "21" }],
      actions: [
        {
          type: "CREATE_TASK",
          params: {
            title: "Review the stalled opportunity",
            dueInDays: "2",
            assignee: "record_owner",
            priority: "HIGH",
          },
        },
        {
          type: "CREATE_NOTIFICATION",
          params: {
            title: "Opportunity stalled",
            body: "A deal has not moved stage for 21 days.",
            audience: "record_owner",
          },
        },
      ],
    },
  },
  {
    id: "won-handover",
    name: "Won opportunity handover",
    description:
      "Create an onboarding task when an opportunity is marked won.",
    definition: {
      trigger: "OPPORTUNITY_WON",
      conditions: [],
      actions: [
        {
          type: "CREATE_TASK",
          params: {
            title: "Start customer onboarding",
            dueInDays: "3",
            assignee: "record_owner",
            priority: "HIGH",
          },
        },
      ],
    },
  },
];
