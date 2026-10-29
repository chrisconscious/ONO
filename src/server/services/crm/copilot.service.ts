import { OpportunityStage, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import {
  copilotModeLabel,
  detectCopilotIntent,
  suggestionsFor,
  type CopilotIntent,
} from "@/lib/crm/copilot";
import { forecastAssumptions } from "@/lib/crm/scoring";
import {
  daysSince,
  getCompanyDetail,
  getContactDetail,
  getCrmAnalytics,
  getCrmWorkspace,
  getDataQuality,
  getLeadDetail,
  getOpportunityDetail,
  getPipelineBoard,
  getSourcePerformance,
  recordHref,
} from "@/server/services/crm/crm.service";

export type CopilotScope = "workspace" | "lead" | "contact" | "company" | "opportunity";

export type CopilotPermissions = {
  leads: boolean;
  contacts: boolean;
  companies: boolean;
  opportunities: boolean;
  tasks: boolean;
  automation: boolean;
  analytics: boolean;
};

export type CopilotEvidence = {
  label: string;
  value: string;
  href?: string;
};

export type CopilotResult = {
  mode: "DETERMINISTIC" | "GENERATIVE";
  intent: CopilotIntent;
  scope: CopilotScope;
  headline: string;
  answer: string;
  bullets: string[];
  evidence: CopilotEvidence[];
  suggestions: string[];
  limitations: string[];
  modeLabel: string;
  generatedAt: string;
  provider: {
    configured: boolean;
    model: string | null;
    error: string | null;
  };
  draft: string | null;
  executed: false;
};

type ProviderConfig = {
  configured: boolean;
  apiKey: string | null;
  baseUrl: string;
  model: string | null;
  error: string | null;
};

/**
 * Reads the optional generative provider configuration.
 *
 * No provider is bundled. A provider is used only when an operator has
 * explicitly enabled it and supplied credentials on the server. The API key
 * never reaches the browser.
 */
function readProviderConfig(): ProviderConfig {
  const enabled = process.env.AI_PROVIDER_ENABLED === "true";
  const apiKey = process.env.AI_PROVIDER_API_KEY?.trim() || null;
  const model = process.env.AI_PROVIDER_MODEL?.trim() || null;
  const baseUrl =
    process.env.AI_PROVIDER_BASE_URL?.trim() || "https://api.openai.com/v1";

  if (!enabled) {
    return { configured: false, apiKey: null, baseUrl, model: null, error: null };
  }
  if (!apiKey || !model) {
    return {
      configured: false,
      apiKey: null,
      baseUrl,
      model: null,
      error:
        "AI_PROVIDER_ENABLED is set, but AI_PROVIDER_API_KEY or AI_PROVIDER_MODEL is missing. Deterministic analysis is used instead.",
    };
  }

  return { configured: true, apiKey, baseUrl, model, error: null };
}

export function copilotProviderConfigured() {
  return readProviderConfig().configured;
}

const money = (value: number, currency: string) =>
  `${currency} ${new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
  }).format(Math.round(value))}`;

const pct = (value: number | null) =>
  value == null ? "unavailable" : `${Math.round(value)}%`;

export async function runCopilot(params: {
  tenantId: string;
  userId: string;
  prompt: string;
  scope?: CopilotScope;
  recordId?: string | null;
  permissions: CopilotPermissions;
}): Promise<CopilotResult> {
  const scope = params.scope ?? "workspace";
  const { intent, recordId } = detectCopilotIntent(params.prompt, {
    recordId: params.recordId,
  });

  const analysis = await analyse({
    tenantId: params.tenantId,
    userId: params.userId,
    intent,
    recordId,
    scope,
    permissions: params.permissions,
  });

  const provider = readProviderConfig();
  let mode: CopilotResult["mode"] = "DETERMINISTIC";
  let answer = analysis.answer;
  let providerError = provider.error;

  if (provider.configured && analysis.eligibleForGeneration) {
    const generated = await generateWithProvider(provider, params.prompt, analysis);
    if (generated.text) {
      mode = "GENERATIVE";
      answer = generated.text;
    } else {
      providerError = generated.error;
    }
  }

  return {
    mode,
    intent,
    scope,
    headline: analysis.headline,
    answer,
    bullets: analysis.bullets,
    evidence: analysis.evidence,
    suggestions: suggestionsFor(scope),
    limitations:
      mode === "DETERMINISTIC" && provider.configured
        ? [
            ...analysis.limitations,
            providerError ??
              "The configured provider returned no usable text, so the deterministic analysis is shown.",
          ]
        : analysis.limitations,
    modeLabel: copilotModeLabel(mode),
    generatedAt: new Date().toISOString(),
    provider: {
      configured: provider.configured,
      model: provider.configured ? provider.model : null,
      error: providerError,
    },
    draft: analysis.draft,
    executed: false,
  };
}

type Analysis = {
  headline: string;
  answer: string;
  bullets: string[];
  evidence: CopilotEvidence[];
  limitations: string[];
  draft: string | null;
  eligibleForGeneration: boolean;
};

async function analyse(params: {
  tenantId: string;
  userId: string;
  intent: CopilotIntent;
  recordId: string | null;
  scope: CopilotScope;
  permissions: CopilotPermissions;
}): Promise<Analysis> {
  const baseLimitations = [
    "Answers are computed from the records visible to your workspace role.",
    "No message is sent and no record is changed by asking the copilot.",
  ];

  switch (params.intent) {
    case "CONTACT_TODAY":
      return contactToday(params, baseLimitations);
    case "LIKELY_CLOSE":
      return likelyClose(params, baseLimitations);
    case "NO_FOLLOW_UP":
      return noFollowUp(params, baseLimitations);
    case "AT_RISK":
      return atRisk(params, baseLimitations);
    case "INACTIVE_CUSTOMERS":
      return inactiveCustomers(params, baseLimitations);
    case "PIPELINE_SUMMARY":
      return pipelineSummary(params, baseLimitations);
    case "SOURCE_PERFORMANCE":
      return sourcePerformance(params, baseLimitations);
    case "LOST_REASONS":
      return lostReasons(params, baseLimitations);
    case "DATA_QUALITY":
      return dataQuality(params, baseLimitations);
    case "DRAFT_FOLLOW_UP":
      return draftFollowUp(params, baseLimitations);
    case "RECORD_SUMMARY":
      return recordSummary(params, baseLimitations);
    default:
      return help(baseLimitations);
  }
}

function help(limitations: string[]): Analysis {
  return {
    headline: "What this copilot can answer",
    answer:
      "I can analyse your CRM records directly. I cannot browse the internet, send messages, or change records. Ask about today's priorities, at-risk deals, pipeline, lead sources, lost reasons or data quality.",
    bullets: [
      "Which leads should I contact today?",
      "Which opportunities are most likely to close this month?",
      "Which deals are at risk?",
      "Summarise the sales pipeline.",
      "Which lead sources convert best?",
      "Which records have missing information?",
      "Open a record and ask for a summary or a follow-up draft.",
    ],
    evidence: [],
    limitations,
    draft: null,
    eligibleForGeneration: false,
  };
}

async function contactToday(
  params: { tenantId: string; userId: string; permissions: CopilotPermissions },
  limitations: string[],
): Promise<Analysis> {
  if (!params.permissions.tasks && !params.permissions.leads) {
    return denied("Contact priorities need lead or task access.", limitations);
  }

  const workspace = await getCrmWorkspace({
    tenantId: params.tenantId,
    userId: params.userId,
    features: {
      leads: params.permissions.leads,
      opportunities: params.permissions.opportunities,
      tasks: params.permissions.tasks,
      companies: params.permissions.companies,
      automation: params.permissions.automation,
    },
  });

  const items = workspace.priorities.slice(0, 8);
  if (items.length === 0) {
    return {
      headline: "No urgent follow-ups were found",
      answer:
        "There are no overdue tasks, stale high-scoring leads or stalled opportunities in the current data. Ask again after new activity is recorded.",
      bullets: [],
      evidence: [],
      limitations,
      draft: null,
      eligibleForGeneration: true,
    };
  }

  return {
    headline: `${items.length} follow-up${items.length === 1 ? "" : "s"} need attention`,
    answer:
      "These items come from stored tasks, lead inactivity and opportunity ageing. Each item states why it was selected; nothing here is invented.",
    bullets: items.map(
      (item) => `${item.title} — ${item.reason} (${item.detail})`,
    ),
    evidence: items.map((item) => ({
      label: item.kind,
      value: item.title,
      href: item.href,
    })),
    limitations,
    draft: null,
    eligibleForGeneration: true,
  };
}

async function likelyClose(
  params: { tenantId: string; permissions: CopilotPermissions },
  limitations: string[],
): Promise<Analysis> {
  if (!params.permissions.opportunities) {
    return denied("Opportunity access is required for this answer.", limitations);
  }

  const board = await getPipelineBoard(params.tenantId);
  const cards = board.cards
    .map((card) => {
      const expectedDays =
        card.expectedCloseDate == null
          ? null
          : Math.ceil(
              (card.expectedCloseDate.getTime() - Date.now()) / 86_400_000,
            );
      const inNextMonth = expectedDays != null && expectedDays <= 31;
      return { card, expectedDays, inNextMonth };
    })
    .sort(
      (a, b) =>
        (b.card.winProbability ?? 0) * (b.card.amount ?? 0) -
        (a.card.winProbability ?? 0) * (a.card.amount ?? 0),
    );

  const likely = cards.filter((entry) => entry.inNextMonth).slice(0, 5);
  const fallback = likely.length === 0 ? cards.slice(0, 5) : likely;

  if (fallback.length === 0) {
    return {
      headline: "No open opportunities exist",
      answer:
        "Forecasting needs open opportunities with a value and expected close date. The workspace currently has none, so no probability or revenue estimate can be produced.",
      bullets: [],
      evidence: [],
      limitations: [
        ...limitations,
        "No win probability is claimed when there is no opportunity history.",
      ],
      draft: null,
      eligibleForGeneration: true,
    };
  }

  return {
    headline:
      likely.length > 0
        ? "Highest weighted opportunities closing within a month"
        : "Highest weighted open opportunities",
    answer:
      "Ranking uses the stored win baseline multiplied by the opportunity amount. The baseline is a transparent statistical rule set, not a trained model. Close dates are the expected dates recorded on each deal.",
    bullets: fallback.map(
      ({ card, expectedDays }) =>
        `${card.name} — ${card.amount == null ? "no value" : money(card.amount, card.currency)}, ${card.winProbability ?? 0}% baseline${
          expectedDays != null
            ? expectedDays >= 0
              ? `, expected in ${expectedDays} day(s)`
              : `, expected date passed ${Math.abs(expectedDays)} day(s) ago`
            : ", no expected close date"
        }`,
    ),
    evidence: fallback.map(({ card }) => ({
      label: "opportunity",
      value: `${card.name}${card.company?.name ? ` · ${card.company.name}` : ""}`,
      href: `/app/opportunities/${card.id}`,
    })),
    limitations: [
      ...limitations,
      "Pipeline weighting is a statistical baseline; it is not a trained forecast.",
    ],
    draft: null,
    eligibleForGeneration: true,
  };
}

async function noFollowUp(
  params: { tenantId: string; permissions: CopilotPermissions },
  limitations: string[],
): Promise<Analysis> {
  if (!params.permissions.leads && !params.permissions.tasks) {
    return denied("Lead or task access is required for this answer.", limitations);
  }

  const now = new Date();
  const [tasks, leads] = await Promise.all([
    params.permissions.tasks
      ? prisma.task.findMany({
          where: {
            tenantId: params.tenantId,
            status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW] },
            dueDate: { lt: now },
            relatedType: { in: ["LEAD", "CONTACT", "COMPANY", "OPPORTUNITY"] },
          },
          orderBy: { dueDate: "asc" },
          take: 8,
          select: {
            id: true,
            title: true,
            dueDate: true,
            relatedType: true,
            relatedId: true,
          },
        })
      : [],
    params.permissions.leads
      ? prisma.lead.findMany({
          where: {
            tenantId: params.tenantId,
            status: { notIn: ["CONVERTED", "LOST", "UNQUALIFIED"] },
            OR: [
              { lastContactedAt: null, createdAt: { lt: new Date(now.getTime() - 14 * 86_400_000) } },
              { lastContactedAt: { lt: new Date(now.getTime() - 14 * 86_400_000) } },
            ],
          },
          orderBy: { score: "desc" },
          take: 8,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            lastContactedAt: true,
            createdAt: true,
            score: true,
          },
        })
      : [],
  ]);

  if (tasks.length === 0 && leads.length === 0) {
    return {
      headline: "No overdue follow-ups were found",
      answer:
        "There are no overdue CRM tasks and no open leads without contact for more than 14 days.",
      bullets: [],
      evidence: [],
      limitations,
      draft: null,
      eligibleForGeneration: true,
    };
  }

  return {
    headline: `${tasks.length} overdue task(s) and ${leads.length} inactive lead(s)`,
    answer:
      "Overdue tasks and leads without recent contact are listed with their real stored dates.",
    bullets: [
      ...tasks.map(
        (task) =>
          `Task: ${task.title} — overdue since ${task.dueDate?.toISOString().slice(0, 10)}`,
      ),
      ...leads.map((lead) => {
        const lastTouch = lead.lastContactedAt ?? lead.createdAt;
        return `Lead: ${lead.firstName} ${lead.lastName} — ${daysSince(lastTouch) ?? 0} day(s) without contact${
          lead.score != null ? `, baseline score ${lead.score}` : ""
        }`;
      }),
    ],
    evidence: [
      ...tasks.map((task) => ({
        label: "task",
        value: task.title,
        href: recordHref(task.relatedType, task.relatedId),
      })),
      ...leads.map((lead) => ({
        label: "lead",
        value: `${lead.firstName} ${lead.lastName}`,
        href: `/app/leads/${lead.id}`,
      })),
    ],
    limitations,
    draft: null,
    eligibleForGeneration: true,
  };
}

async function atRisk(
  params: { tenantId: string; permissions: CopilotPermissions },
  limitations: string[],
): Promise<Analysis> {
  if (!params.permissions.opportunities) {
    return denied("Opportunity access is required for this answer.", limitations);
  }

  const now = new Date();
  const opportunities = await prisma.opportunity.findMany({
    where: {
      tenantId: params.tenantId,
      stage: { notIn: [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST] },
    },
    select: {
      id: true,
      name: true,
      stage: true,
      amount: true,
      currency: true,
      winProbability: true,
      stageChangedAt: true,
      expectedCloseDate: true,
      nextStep: true,
      company: { select: { name: true } },
    },
  });

  const risky = opportunities
    .map((opportunity) => {
      const stalled = daysSince(opportunity.stageChangedAt, now) ?? 0;
      const overdue =
        opportunity.expectedCloseDate != null &&
        opportunity.expectedCloseDate.getTime() < now.getTime();
      return { opportunity, stalled, overdue };
    })
    .filter((entry) => entry.stalled >= 21 || entry.overdue)
    .sort(
      (a, b) =>
        Number(b.opportunity.amount ?? 0) - Number(a.opportunity.amount ?? 0),
    )
    .slice(0, 8);

  if (risky.length === 0) {
    return {
      headline: "No stalled or overdue opportunities were found",
      answer:
        "Every open opportunity has moved stage within 21 days and has not passed its expected close date.",
      bullets: [],
      evidence: [],
      limitations,
      draft: null,
      eligibleForGeneration: true,
    };
  }

  return {
    headline: `${risky.length} opportunity(ies) show risk signals`,
    answer:
      "Risk is flagged only from stored dates: no stage movement for 21 days or more, or an expected close date that has passed.",
    bullets: risky.map(({ opportunity, stalled, overdue }) =>
      [
        opportunity.name,
        opportunity.company?.name ?? "no account",
        `${stalled} day(s) in stage`,
        overdue
          ? `expected close ${opportunity.expectedCloseDate?.toISOString().slice(0, 10)} has passed`
          : "close date not yet passed",
        opportunity.nextStep ? `next step: ${opportunity.nextStep}` : "no next step recorded",
      ].join(" — "),
    ),
    evidence: risky.map(({ opportunity }) => ({
      label: "opportunity",
      value: opportunity.name,
      href: `/app/opportunities/${opportunity.id}`,
    })),
    limitations,
    draft: null,
    eligibleForGeneration: true,
  };
}

async function inactiveCustomers(
  params: { tenantId: string; permissions: CopilotPermissions },
  limitations: string[],
): Promise<Analysis> {
  if (!params.permissions.companies) {
    return denied("Account access is required for this answer.", limitations);
  }

  const now = new Date();
  const companies = await prisma.company.findMany({
    where: { tenantId: params.tenantId },
    select: {
      id: true,
      name: true,
      lastInteractionAt: true,
      createdAt: true,
      _count: { select: { opportunities: true, contacts: true } },
    },
  });

  const inactive = companies
    .map((company) => {
      const last = company.lastInteractionAt ?? company.createdAt;
      return { company, days: daysSince(last, now) ?? 0 };
    })
    .filter((entry) => entry.days >= 45 && entry.company._count.opportunities > 0)
    .sort((a, b) => b.days - a.days)
    .slice(0, 8);

  if (inactive.length === 0) {
    return {
      headline: "No inactive accounts were found",
      answer:
        "No account with an opportunity has been quiet for 45 days or more.",
      bullets: [],
      evidence: [],
      limitations,
      draft: null,
      eligibleForGeneration: true,
    };
  }

  return {
    headline: `${inactive.length} account(s) have been quiet for 45+ days`,
    answer:
      "Account inactivity uses the last interaction recorded from CRM activity. Accounts without an opportunity are excluded.",
    bullets: inactive.map(
      ({ company, days }) =>
        `${company.name} — ${days} day(s) since last interaction, ${company._count.opportunities} opportunity(ies), ${company._count.contacts} contact(s)`,
    ),
    evidence: inactive.map(({ company }) => ({
      label: "account",
      value: company.name,
      href: `/app/companies/${company.id}`,
    })),
    limitations,
    draft: null,
    eligibleForGeneration: true,
  };
}

async function pipelineSummary(
  params: { tenantId: string; permissions: CopilotPermissions },
  limitations: string[],
): Promise<Analysis> {
  if (!params.permissions.opportunities) {
    return denied("Opportunity access is required for this answer.", limitations);
  }

  const [board, analytics] = await Promise.all([
    getPipelineBoard(params.tenantId),
    params.permissions.analytics
      ? getCrmAnalytics(params.tenantId, 6)
      : Promise.resolve(null),
  ]);

  const totals = new Map<string, { open: number; weighted: number }>();
  for (const card of board.cards) {
    const current = totals.get(card.currency) ?? { open: 0, weighted: 0 };
    current.open += card.amount ?? 0;
    current.weighted += ((card.amount ?? 0) * (card.winProbability ?? 0)) / 100;
    totals.set(card.currency, current);
  }

  const stageLines = board.stages.map(
    (stage) =>
      `${stage.stage.toLowerCase().replaceAll("_", " ")}: ${stage.count} deal(s)${
        stage.totals.length
          ? `, ${stage.totals.map((item) => money(item.value, item.currency)).join(" + ")}`
          : ""
      }`,
  );

  return {
    headline:
      board.cards.length > 0
        ? `${board.cards.length} open opportunit${board.cards.length === 1 ? "y" : "ies"}`
        : "The open pipeline is empty",
    answer:
      board.cards.length > 0
        ? "Pipeline totals are reported per currency and never summed across currencies. Weighted value uses the stored win baseline."
        : "No open opportunities are recorded, so no pipeline value or weighted forecast exists.",
    bullets: [
      ...[...totals.entries()].map(
        ([currency, value]) =>
          `${currency}: open ${money(value.open, currency)}, weighted ${money(value.weighted, currency)}`,
      ),
      ...stageLines,
      ...(analytics
        ? [
            `Closed in the recorded history: ${analytics.totals.wonCount} won, ${analytics.totals.lostCount} lost, win rate ${pct(analytics.totals.winRate)}.`,
          ]
        : []),
    ],
    evidence: board.stages
      .filter((stage) => stage.count > 0)
      .map((stage) => ({
        label: "stage",
        value: `${stage.stage.replaceAll("_", " ")} · ${stage.count}`,
        href: "/app/crm/pipeline",
      })),
    limitations: [
      ...limitations,
      ...forecastAssumptions().slice(-1),
    ],
    draft: null,
    eligibleForGeneration: true,
  };
}

async function sourcePerformance(
  params: { tenantId: string; permissions: CopilotPermissions },
  limitations: string[],
): Promise<Analysis> {
  if (!params.permissions.leads) {
    return denied("Lead access is required for this answer.", limitations);
  }

  const sources = await getSourcePerformance(params.tenantId);
  if (sources.length === 0) {
    return {
      headline: "No lead sources are recorded",
      answer:
        "Source performance needs captured leads. No leads exist in this workspace yet, so no conversion rate can be calculated.",
      bullets: [],
      evidence: [],
      limitations,
      draft: null,
      eligibleForGeneration: true,
    };
  }

  return {
    headline: `${sources.length} lead source(s) have recorded outcomes`,
    answer:
      "Conversion rate is converted leads divided by all leads from that source. Small samples are shown as counts rather than treated as reliable.",
    bullets: sources.map(
      (source) =>
        `${source.source} — ${source.converted}/${source.total} converted (${source.conversionRate.toFixed(1)}%), ${source.lost} lost or unqualified`,
    ),
    evidence: [],
    limitations: [
      ...limitations,
      "Source conversion is descriptive. It is not a statistical significance test.",
    ],
    draft: null,
    eligibleForGeneration: true,
  };
}

async function lostReasons(
  params: { tenantId: string; permissions: CopilotPermissions },
  limitations: string[],
): Promise<Analysis> {
  if (!params.permissions.opportunities && !params.permissions.leads) {
    return denied("Lead or opportunity access is required for this answer.", limitations);
  }

  const [opportunities, leads] = await Promise.all([
    params.permissions.opportunities
      ? prisma.opportunity.groupBy({
          by: ["lostReason"],
          where: {
            tenantId: params.tenantId,
            stage: OpportunityStage.CLOSED_LOST,
            lostReason: { not: null },
          },
          _count: { _all: true },
        })
      : [],
    params.permissions.leads
      ? prisma.lead.groupBy({
          by: ["lostReason"],
          where: {
            tenantId: params.tenantId,
            status: "LOST",
            lostReason: { not: null },
          },
          _count: { _all: true },
        })
      : [],
  ]);

  if (opportunities.length === 0 && leads.length === 0) {
    return {
      headline: "No recorded loss reasons",
      answer:
        "No closed-lost opportunity or lost lead has a recorded reason, so loss patterns cannot be summarised.",
      bullets: [],
      evidence: [],
      limitations,
      draft: null,
      eligibleForGeneration: true,
    };
  }

  return {
    headline: "Recorded loss reasons",
    answer:
      "Counts include only records where a person recorded a reason. Blank reasons are excluded rather than guessed.",
    bullets: [
      ...opportunities.map(
        (entry) => `Opportunity: ${entry.lostReason} — ${entry._count._all}`,
      ),
      ...leads.map((entry) => `Lead: ${entry.lostReason} — ${entry._count._all}`),
    ],
    evidence: [],
    limitations,
    draft: null,
    eligibleForGeneration: true,
  };
}

async function dataQuality(
  params: { tenantId: string; permissions: CopilotPermissions },
  limitations: string[],
): Promise<Analysis> {
  if (
    !params.permissions.leads &&
    !params.permissions.contacts &&
    !params.permissions.companies
  ) {
    return denied("CRM read access is required for this answer.", limitations);
  }

  const quality = await getDataQuality(params.tenantId);
  if (quality.issues.length === 0) {
    return {
      headline: "No data-quality issues were detected",
      answer:
        "The configured checks found no missing contact details, unassigned leads, stale leads or exact duplicates.",
      bullets: [],
      evidence: [],
      limitations,
      draft: null,
      eligibleForGeneration: true,
    };
  }

  return {
    headline: `Data-quality score ${quality.score}/100 with ${quality.issues.length} issue type(s)`,
    answer:
      "Each count comes from a direct query. Duplicate detection compares normalised email, phone and account name; nothing is merged automatically.",
    bullets: quality.issues.map(
      (issue) => `${issue.label} — ${issue.count}. ${issue.description}`,
    ),
    evidence: quality.issues.flatMap((issue) =>
      issue.sample.map((item) => ({
        label: issue.key,
        value: item.label,
        href: item.href,
      })),
    ),
    limitations,
    draft: null,
    eligibleForGeneration: true,
  };
}

async function recordSummary(
  params: {
    tenantId: string;
    recordId: string | null;
    scope: CopilotScope;
    permissions: CopilotPermissions;
  },
  limitations: string[],
): Promise<Analysis> {
  if (!params.recordId) {
    return {
      headline: "Open a record first",
      answer:
        "Record summaries need a specific lead, contact, account or opportunity. Open a record and use the copilot panel there.",
      bullets: [],
      evidence: [],
      limitations,
      draft: null,
      eligibleForGeneration: false,
    };
  }

  if (params.scope === "opportunity" && params.permissions.opportunities) {
    const detail = await getOpportunityDetail(params.tenantId, params.recordId);
    if (!detail) return notFound(limitations);
    const { opportunity } = detail;
    return {
      headline: opportunity.name,
      answer: `This opportunity is in ${opportunity.stage.replaceAll("_", " ").toLowerCase()} with a stored win baseline of ${opportunity.winProbability ?? 0}%. ${
        opportunity.probabilityMethod === "HISTORICAL_STAGE_BASELINE_V1"
          ? "The baseline blends historical workspace outcomes."
          : "The baseline uses stage and activity rules because historical outcomes are limited."
      }`,
      bullets: [
        opportunity.company?.name ? `Account: ${opportunity.company.name}` : "No account linked.",
        opportunity.amount != null
          ? `Value: ${money(Number(opportunity.amount), opportunity.currency)}`
          : "No value recorded.",
        opportunity.expectedCloseDate
          ? `Expected close: ${opportunity.expectedCloseDate.toISOString().slice(0, 10)}`
          : "No expected close date.",
        opportunity.nextStep ? `Next step: ${opportunity.nextStep}` : "No next step recorded.",
        `${detail.tasks.filter((task) => task.status !== "DONE").length} open task(s) linked.`,
        `${detail.timeline.length} timeline entr${detail.timeline.length === 1 ? "y" : "ies"} recorded.`,
      ],
      evidence: [
        {
          label: "opportunity",
          value: opportunity.name,
          href: `/app/opportunities/${opportunity.id}`,
        },
      ],
      limitations,
      draft: null,
      eligibleForGeneration: true,
    };
  }

  if (params.scope === "lead" && params.permissions.leads) {
    const detail = await getLeadDetail(params.tenantId, params.recordId);
    if (!detail) return notFound(limitations);
    const { lead } = detail;
    return {
      headline: `${lead.firstName} ${lead.lastName}`,
      answer: `This lead is ${lead.status.toLowerCase()} with a baseline score of ${lead.score ?? "not calculated"}. The score is a transparent rule set over recorded fields and outcomes, not a trained model.`,
      bullets: [
        lead.companyName ? `Company: ${lead.companyName}` : "No company recorded.",
        lead.email ? `Email: ${lead.email}` : "No email recorded.",
        lead.phone ? `Phone: ${lead.phone}` : "No phone recorded.",
        lead.source ? `Source: ${lead.source}` : "No source recorded.",
        lead.lastContactedAt
          ? `Last contact: ${lead.lastContactedAt.toISOString().slice(0, 10)}`
          : "No contact logged.",
        `${detail.timeline.length} timeline entr${detail.timeline.length === 1 ? "y" : "ies"} recorded.`,
      ],
      evidence: [
        {
          label: "lead",
          value: `${lead.firstName} ${lead.lastName}`,
          href: `/app/leads/${lead.id}`,
        },
      ],
      limitations,
      draft: null,
      eligibleForGeneration: true,
    };
  }

  if (params.scope === "company" && params.permissions.companies) {
    const detail = await getCompanyDetail(params.tenantId, params.recordId);
    if (!detail) return notFound(limitations);
    const { company } = detail;
    const open = company.opportunities.filter(
      (opportunity) =>
        opportunity.stage !== "CLOSED_WON" && opportunity.stage !== "CLOSED_LOST",
    );
    return {
      headline: company.name,
      answer: `This account has ${company.contacts.length} contact(s) and ${open.length} open opportunit${open.length === 1 ? "y" : "ies"}.`,
      bullets: [
        company.industry ? `Industry: ${company.industry}` : "No industry recorded.",
        company.lastInteractionAt
          ? `Last interaction: ${company.lastInteractionAt.toISOString().slice(0, 10)}`
          : "No interaction logged.",
        ...open.map(
          (opportunity) =>
            `${opportunity.name} — ${opportunity.stage.replaceAll("_", " ").toLowerCase()}${
              opportunity.amount != null
                ? `, ${money(Number(opportunity.amount), opportunity.currency)}`
                : ""
            }`,
        ),
      ],
      evidence: [
        { label: "account", value: company.name, href: `/app/companies/${company.id}` },
      ],
      limitations,
      draft: null,
      eligibleForGeneration: true,
    };
  }

  if (params.scope === "contact" && params.permissions.contacts) {
    const detail = await getContactDetail(params.tenantId, params.recordId);
    if (!detail) return notFound(limitations);
    const { contact } = detail;
    return {
      headline: `${contact.firstName} ${contact.lastName}`,
      answer: `This contact is ${contact.status.toLowerCase()}. ${
        contact.company?.name ? `They belong to ${contact.company.name}.` : "No account is linked."
      }`,
      bullets: [
        contact.title ? `Title: ${contact.title}` : "No title recorded.",
        contact.email ? `Email: ${contact.email}` : "No email recorded.",
        contact.phone ? `Phone: ${contact.phone}` : "No phone recorded.",
        contact.lastContactedAt
          ? `Last contact: ${contact.lastContactedAt.toISOString().slice(0, 10)}`
          : "No contact logged.",
      ],
      evidence: [
        {
          label: "contact",
          value: `${contact.firstName} ${contact.lastName}`,
          href: `/app/contacts/${contact.id}`,
        },
      ],
      limitations,
      draft: null,
      eligibleForGeneration: true,
    };
  }

  return denied("Your role cannot read that record type.", limitations);
}

async function draftFollowUp(
  params: {
    tenantId: string;
    recordId: string | null;
    scope: CopilotScope;
    permissions: CopilotPermissions;
  },
  limitations: string[],
): Promise<Analysis> {
  if (!params.recordId) {
    return {
      headline: "Open a contact, lead or opportunity first",
      answer:
        "A follow-up draft needs a record. Open one and ask again; the draft will use only facts stored on that record.",
      bullets: [],
      evidence: [],
      limitations,
      draft: null,
      eligibleForGeneration: false,
    };
  }

  let recipient = "there";
  let context = "our recent conversation";
  let href = "/app/crm";
  const signature = "the team";

  if (params.scope === "lead" && params.permissions.leads) {
    const detail = await getLeadDetail(params.tenantId, params.recordId);
    if (!detail) return notFound(limitations);
    recipient = `${detail.lead.firstName} ${detail.lead.lastName}`.trim();
    context = detail.lead.notes?.trim() || "our recent conversation";
    href = `/app/leads/${detail.lead.id}`;
  } else if (params.scope === "contact" && params.permissions.contacts) {
    const detail = await getContactDetail(params.tenantId, params.recordId);
    if (!detail) return notFound(limitations);
    recipient = `${detail.contact.firstName} ${detail.contact.lastName}`.trim();
    context = detail.contact.notes?.trim() || "our recent conversation";
    href = `/app/contacts/${detail.contact.id}`;
  } else if (params.scope === "opportunity" && params.permissions.opportunities) {
    const detail = await getOpportunityDetail(params.tenantId, params.recordId);
    if (!detail) return notFound(limitations);
    recipient = detail.opportunity.company?.name ?? "there";
    context = detail.opportunity.nextStep?.trim() || "the opportunity we discussed";
    href = `/app/opportunities/${detail.opportunity.id}`;
  } else {
    return denied("Your role cannot read the record needed for this draft.", limitations);
  }

  const draft = [
    `Hello ${recipient},`,
    "",
    `I am following up on ${context}.`,
    "",
    "Please let me know if you would like to continue the conversation or if there is anything you need from us to move forward.",
    "",
    "Kind regards,",
    signature,
  ].join("\n");

  return {
    headline: "Draft prepared — not sent",
    answer:
      "This is a deterministic template built from the record's stored facts. No message was sent and no external provider was contacted. Edit it before using it anywhere.",
    bullets: [
      "Review the greeting and context before sending.",
      "Add any commitment, price or date only if it is accurate.",
    ],
    evidence: [{ label: "record", value: recipient, href }],
    limitations: [
      ...limitations,
      "Drafting is not delivery. This workspace has no confirmed email or messaging provider configured.",
    ],
    draft,
    eligibleForGeneration: true,
  };
}

function denied(message: string, limitations: string[]): Analysis {
  return {
    headline: "Not available for your role",
    answer: message,
    bullets: [],
    evidence: [],
    limitations,
    draft: null,
    eligibleForGeneration: false,
  };
}

function notFound(limitations: string[]): Analysis {
  return {
    headline: "Record not found",
    answer:
      "That record does not exist in the active workspace, or your role cannot read it.",
    bullets: [],
    evidence: [],
    limitations,
    draft: null,
    eligibleForGeneration: false,
  };
}

const SYSTEM_PROMPT = `You are a CRM assistant inside a multi-tenant CRM.
You will receive a user question and a JSON evidence packet computed from the user's own workspace.
Rules:
- Use only the evidence packet. Do not add facts, names, dates or numbers that are not present.
- Never invent probabilities, forecasts or customer history.
- If the evidence is insufficient, say so plainly.
- Never claim that a message was sent, a record was changed or an action was taken.
- Keep the answer concise, practical and in English.
- Use currency codes exactly as provided and never sum different currencies.
Return plain text only.`;

async function generateWithProvider(
  provider: ProviderConfig,
  prompt: string,
  analysis: Analysis,
): Promise<{ text: string | null; error: string | null }> {
  if (!provider.apiKey || !provider.model) {
    return { text: null, error: "Provider credentials are incomplete." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${provider.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.1,
        max_tokens: 700,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              question: prompt,
              deterministicAnalysis: {
                headline: analysis.headline,
                answer: analysis.answer,
                bullets: analysis.bullets,
              },
              evidence: analysis.evidence,
              limitations: analysis.limitations,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        text: null,
        error: `The configured AI provider returned HTTP ${response.status}. Deterministic analysis is shown instead.`,
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return {
        text: null,
        error:
          "The configured AI provider returned an empty response. Deterministic analysis is shown instead.",
      };
    }

    return { text, error: null };
  } catch (error) {
    return {
      text: null,
      error:
        error instanceof Error && error.name === "AbortError"
          ? "The AI provider timed out. Deterministic analysis is shown instead."
          : "The AI provider could not be reached. Deterministic analysis is shown instead.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
