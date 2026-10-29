/**
 * Deterministic intent recognition for the CRM copilot.
 *
 * The copilot answers only from authorized workspace data. When no generative
 * provider is configured, these intents drive real database queries instead of
 * returning fabricated prose.
 */

export const COPILOT_INTENTS = [
  "CONTACT_TODAY",
  "LIKELY_CLOSE",
  "NO_FOLLOW_UP",
  "AT_RISK",
  "INACTIVE_CUSTOMERS",
  "PIPELINE_SUMMARY",
  "SOURCE_PERFORMANCE",
  "LOST_REASONS",
  "DATA_QUALITY",
  "DRAFT_FOLLOW_UP",
  "RECORD_SUMMARY",
  "HELP",
] as const;

export type CopilotIntent = (typeof COPILOT_INTENTS)[number];

const patterns: Array<{ intent: CopilotIntent; patterns: RegExp[] }> = [
  {
    intent: "CONTACT_TODAY",
    patterns: [
      /contact today/i,
      /call today/i,
      /who should i (?:contact|call|reach)/i,
      /today'?s priorities/i,
      /what should i do (?:today|next)/i,
    ],
  },
  {
    intent: "LIKELY_CLOSE",
    patterns: [
      /likely to close/i,
      /most likely/i,
      /close this month/i,
      /best opportunities/i,
      /hot deals/i,
      /forecast/i,
    ],
  },
  {
    intent: "NO_FOLLOW_UP",
    patterns: [
      /not (?:been )?(?:contacted|followed up)/i,
      /no follow.?up/i,
      /follow.?up gap/i,
      /overdue follow/i,
    ],
  },
  {
    intent: "AT_RISK",
    patterns: [/at risk/i, /stalled/i, /stuck/i, /slipping/i, /risk of losing/i],
  },
  {
    intent: "INACTIVE_CUSTOMERS",
    patterns: [
      /inactive customer/i,
      /becoming inactive/i,
      /retention/i,
      /customers.*(?:quiet|dormant)/i,
    ],
  },
  {
    intent: "PIPELINE_SUMMARY",
    patterns: [/pipeline/i, /summary/i, /overview/i, /how are we doing/i],
  },
  {
    intent: "SOURCE_PERFORMANCE",
    patterns: [
      /lead source/i,
      /source.*(?:best|perform|convert)/i,
      /which source/i,
      /best customers/i,
    ],
  },
  {
    intent: "LOST_REASONS",
    patterns: [/lost/i, /why.*(?:lose|lost)/i, /loss reason/i],
  },
  {
    intent: "DATA_QUALITY",
    patterns: [
      /missing information/i,
      /data quality/i,
      /incomplete/i,
      /duplicate/i,
      /clean.?up/i,
    ],
  },
  {
    intent: "DRAFT_FOLLOW_UP",
    patterns: [
      /draft.*(?:email|message|follow.?up)/i,
      /write.*(?:email|follow.?up)/i,
      /prepare.*(?:email|message)/i,
    ],
  },
  {
    intent: "RECORD_SUMMARY",
    patterns: [
      /summar/i,
      /meeting brief/i,
      /what do we know about/i,
      /account brief/i,
      /next action/i,
      /next step/i,
    ],
  },
];

const idPattern = /\b([a-z0-9]{20,})\b/i;

/** Maps a natural-language prompt onto a supported, bounded intent. */
export function detectCopilotIntent(
  prompt: string,
  reference?: { recordId?: string | null },
): { intent: CopilotIntent; recordId: string | null } {
  const text = prompt.trim();
  const recordId = reference?.recordId ?? text.match(idPattern)?.[1] ?? null;

  if (!text) return { intent: "HELP", recordId };

  if (recordId && /summar|brief|next|risk|draft|follow/i.test(text)) {
    return { intent: "RECORD_SUMMARY", recordId };
  }

  for (const entry of patterns) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return { intent: entry.intent, recordId };
    }
  }

  return { intent: "HELP", recordId };
}

export const COPILOT_SUGGESTIONS: Record<string, string[]> = {
  workspace: [
    "Which leads should I contact today?",
    "Which opportunities are most likely to close this month?",
    "Which deals are at risk?",
    "Summarise the sales pipeline.",
    "Which lead sources convert best?",
    "Which records have missing information?",
  ],
  lead: [
    "Summarise this lead and recommend the next action.",
    "Draft a follow-up message for this lead.",
    "What information is missing on this lead?",
  ],
  opportunity: [
    "Summarise this opportunity and its main risks.",
    "What should I do next to improve this opportunity?",
    "Draft a follow-up message for this opportunity.",
  ],
  company: [
    "Summarise this account and its latest interactions.",
    "Prepare a meeting brief for this account.",
    "Which open opportunities belong to this account?",
  ],
  contact: [
    "Summarise this contact and recommend the next action.",
    "Draft a follow-up message for this contact.",
  ],
};

export function suggestionsFor(scope: string) {
  return COPILOT_SUGGESTIONS[scope] ?? COPILOT_SUGGESTIONS.workspace;
}

/** Honest label used everywhere the copilot result is rendered. */
export function copilotModeLabel(mode: "DETERMINISTIC" | "GENERATIVE") {
  return mode === "GENERATIVE"
    ? "Generative model response grounded in the evidence supplied by this workspace."
    : "Deterministic workspace analysis. No generative model is configured, so answers are computed directly from CRM records.";
}
