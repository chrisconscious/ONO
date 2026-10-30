import { describe, expect, it } from "vitest";
import {
  AUTOMATION_TEMPLATES,
  describeAutomationAction,
  describeAutomationCondition,
  evaluateAutomationConditions,
  evaluateCondition,
  isAutomationActionType,
  isAutomationConditionField,
  isAutomationOperator,
  isAutomationTrigger,
  validateAutomationDefinition,
  type AutomationCondition,
  type AutomationDefinition,
} from "@/lib/crm/automation";

function workflow(
  overrides: Partial<AutomationDefinition> = {},
): AutomationDefinition {
  return {
    trigger: "LEAD_STATUS_CHANGED",
    conditions: [
      { field: "status", operator: "equals", value: "QUALIFIED" },
    ],
    actions: [
      { type: "CREATE_TASK", params: { title: "Follow up with qualified lead" } },
    ],
    ...overrides,
  };
}

describe("automation definition validation", () => {
  it("accepts a safe lead workflow", () => {
    expect(validateAutomationDefinition(workflow())).toEqual([]);
  });

  it("requires at least one action and limits the definition size", () => {
    expect(validateAutomationDefinition(workflow({ actions: [] }))).toContain(
      "Add at least one action.",
    );

    const tooManyActions = Array.from({ length: 6 }).map(() => ({
      type: "CREATE_TASK" as const,
      params: { title: "Task" },
    }));
    expect(
      validateAutomationDefinition(workflow({ actions: tooManyActions })),
    ).toContain("A workflow can have at most five actions.");
  });

  it("refuses consequential lead status changes", () => {
    const errors = validateAutomationDefinition(
      workflow({
        actions: [
          {
            type: "UPDATE_LEAD_STATUS",
            params: { status: "CONVERTED" },
          },
        ],
      }),
    );

    expect(errors).toContain(
      "Automation may set a lead to contacted, qualified or unqualified. Conversion and loss require a person.",
    );
  });

  it("rejects actions that do not belong to the trigger type", () => {
    const errors = validateAutomationDefinition(
      workflow({
        trigger: "OPPORTUNITY_STAGE_CHANGED",
        conditions: [],
        actions: [
          { type: "ASSIGN_LEAD_OWNER", params: { ownerId: "user_1" } },
        ],
      }),
    );

    expect(errors).toContain(
      "Assign the lead owner is only available for lead triggers.",
    );
  });

  it("validates numeric and required action parameters", () => {
    const errors = validateAutomationDefinition(
      workflow({
        conditions: [
          { field: "score", operator: "gte", value: "not-a-number" },
        ],
        actions: [{ type: "CREATE_TASK", params: {} }],
      }),
    );

    expect(errors).toContain('Condition "Lead score" needs a number.');
    expect(errors).toContain("Create-task actions need a task title.");
  });

  it("rejects unsupported union members without throwing", () => {
    const errors = validateAutomationDefinition({
      trigger: "UNKNOWN_TRIGGER" as AutomationDefinition["trigger"],
      conditions: [],
      actions: [],
    });

    expect(errors).toEqual(["Choose a supported trigger."]);
  });

  it("exposes type guards and documented templates", () => {
    expect(isAutomationTrigger("LEAD_CREATED")).toBe(true);
    expect(isAutomationTrigger("LEAD_DELETED")).toBe(false);
    expect(isAutomationActionType("CREATE_TASK")).toBe(true);
    expect(isAutomationConditionField("score")).toBe(true);
    expect(isAutomationOperator("contains")).toBe(true);
    expect(AUTOMATION_TEMPLATES.length).toBeGreaterThan(0);
    for (const template of AUTOMATION_TEMPLATES) {
      expect(validateAutomationDefinition(template.definition)).toEqual([]);
    }
  });
});

describe("automation condition evaluation", () => {
  it("compares numeric fields numerically", () => {
    const condition: AutomationCondition = {
      field: "score",
      operator: "gte",
      value: "70",
    };

    expect(evaluateCondition(condition, { score: 80 })).toBe(true);
    expect(evaluateCondition(condition, { score: 60 })).toBe(false);
    expect(evaluateCondition(condition, { score: null })).toBe(false);
  });

  it("compares text case-insensitively and supports contains", () => {
    expect(
      evaluateCondition(
        { field: "source", operator: "equals", value: "Website" },
        { source: "website" },
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { field: "industry", operator: "contains", value: "ret" },
        { industry: "Retail" },
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { field: "industry", operator: "not_equals", value: "Retail" },
        { industry: "Retail" },
      ),
    ).toBe(false);
  });

  it("distinguishes missing values from recorded values", () => {
    expect(
      evaluateCondition(
        { field: "companyName", operator: "is_empty", value: "" },
        { companyName: "   " },
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { field: "companyName", operator: "is_set", value: "" },
        { companyName: "Example Ltd" },
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { field: "companyName", operator: "is_set", value: "" },
        { companyName: null },
      ),
    ).toBe(false);
  });

  it("requires every condition to match", () => {
    const conditions: AutomationCondition[] = [
      { field: "status", operator: "equals", value: "QUALIFIED" },
      { field: "score", operator: "gte", value: "70" },
    ];

    const bothMatch = evaluateAutomationConditions(conditions, {
      status: "QUALIFIED",
      score: 85,
    });
    expect(bothMatch.matched).toBe(true);
    expect(bothMatch.details).toHaveLength(2);

    const oneFails = evaluateAutomationConditions(conditions, {
      status: "QUALIFIED",
      score: 40,
    });
    expect(oneFails.matched).toBe(false);
    expect(oneFails.details[1].matched).toBe(false);
  });

  it("renders human-readable explanations", () => {
    expect(
      describeAutomationCondition({
        field: "score",
        operator: "gte",
        value: "70",
      }),
    ).toContain("70");
    expect(
      describeAutomationAction({
        type: "UPDATE_LEAD_STATUS",
        params: { status: "CONTACTED" },
      }),
    ).toContain("contacted");
  });
});
