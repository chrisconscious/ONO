import { describe, expect, it } from "vitest";
import {
  COPILOT_INTENTS,
  COPILOT_SUGGESTIONS,
  copilotModeLabel,
  detectCopilotIntent,
  suggestionsFor,
} from "@/lib/crm/copilot";

describe("copilot intent detection", () => {
  it("maps priority questions onto the bounded contact intent", () => {
    expect(detectCopilotIntent("Which leads should I contact today?").intent).toBe(
      "CONTACT_TODAY",
    );
    expect(
      detectCopilotIntent("What should I do next?").intent,
    ).toBe("CONTACT_TODAY");
  });

  it("distinguishes pipeline, risk and follow-up questions", () => {
    expect(
      detectCopilotIntent("Which opportunities are most likely to close this month?")
        .intent,
    ).toBe("LIKELY_CLOSE");
    expect(detectCopilotIntent("Which deals are at risk?").intent).toBe(
      "AT_RISK",
    );
    expect(
      detectCopilotIntent("Which records have not been followed up?").intent,
    ).toBe("NO_FOLLOW_UP");
  });

  it("returns HELP for empty or unsupported prompts", () => {
    expect(detectCopilotIntent("   ")).toEqual({
      intent: "HELP",
      recordId: null,
    });
    expect(detectCopilotIntent("Tell me a joke").intent).toBe("HELP");
  });

  it("binds a record summary to the supplied record", () => {
    const result = detectCopilotIntent(
      "Summarise this opportunity and its main risks.",
      { recordId: "opp_123" },
    );

    expect(result.intent).toBe("RECORD_SUMMARY");
    expect(result.recordId).toBe("opp_123");
  });

  it("only ever returns declared intents", () => {
    const prompts = [
      "Who should I call today?",
      "Forecast the month",
      "Which sources convert best?",
      "Why did we lose deals?",
      "What data is missing?",
      "Draft a follow-up for this lead",
      "Summarise the sales pipeline",
      "random text",
    ];

    for (const prompt of prompts) {
      const { intent } = detectCopilotIntent(prompt);
      expect(COPILOT_INTENTS).toContain(intent);
    }
  });
});

describe("copilot presentation", () => {
  it("provides scope suggestions with a workspace fallback", () => {
    expect(suggestionsFor("opportunity")).toEqual(
      COPILOT_SUGGESTIONS.opportunity,
    );
    expect(suggestionsFor("unknown-scope")).toEqual(
      COPILOT_SUGGESTIONS.workspace,
    );
  });

  it("labels deterministic output honestly", () => {
    const label = copilotModeLabel("DETERMINISTIC");
    expect(label).toContain("No generative model is configured");
    expect(label).toContain("directly from CRM records");
  });

  it("labels generative output with its grounding requirement", () => {
    expect(copilotModeLabel("GENERATIVE")).toContain(
      "grounded in the evidence supplied by this workspace",
    );
  });
});
