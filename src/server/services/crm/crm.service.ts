import { LeadStatus, OpportunityStage, Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import {
  buildForecast,
  buildLeadHistory,
  estimateOpportunityProbability,
  nextMonthKeys,
  scoreLead,
  type CurrencyForecast,
  type LeadHistory,
  type OpportunityHistory,
} from "@/lib/crm/scoring";

const OPEN_TASK_STATUSES: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
];

const OPEN_OPPORTUNITY_STAGES: OpportunityStage[] = [
  OpportunityStage.PROSPECTING,
  OpportunityStage.QUALIFICATION,
  OpportunityStage.PROPOSAL,
  OpportunityStage.NEGOTIATION,
];

const CLOSED_LEAD_STATUSES: LeadStatus[] = [LeadStatus.CONVERTED, LeadStatus.LOST];

/** Activity types that represent actual outreach to a person. */
const CONTACT_ACTIVITY_TYPES = new Set(["NOTE", "CALL", "MEETING", "EMAIL"]);

const DAY = 86_400_000;

export function daysSince(date: Date | null | undefined, now = new Date()) {
  if (!date) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY));
}

export async function loadLeadHistory(tenantId: string): Promise<LeadHistory> {
  const rows = await prisma.lead.findMany({
    where: { tenantId },
    select: { status: true, source: true },
  });
  return buildLeadHistory(rows);
}

/** Recomputes and stores the lead baseline with its explanation factors. */
export async function recomputeLeadScore(tenantId: string, leadId: string) {
  const [lead, history] = await Promise.all([
    prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: {
        id: true,
        status: true,
        email: true,
        phone: true,
        companyName: true,
        industry: true,
        source: true,
        ownerId: true,
        estimatedValue: true,
        createdAt: true,
        lastContactedAt: true,
      },
    }),
    loadLeadHistory(tenantId),
  ]);

  if (!lead) return null;

  const result = scoreLead({
    status: lead.status,
    email: lead.email,
    phone: lead.phone,
    companyName: lead.companyName,
    industry: lead.industry,
    source: lead.source,
    ownerId: lead.ownerId,
    estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
    createdAt: lead.createdAt,
    lastContactedAt: lead.lastContactedAt,
    history,
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      score: result.score,
      scoreMethod: result.method,
      scoreFactors: result.factors,
      scoreSampleSize: result.sampleSize,
      scoreUpdatedAt: new Date(),
    },
  });

  return result;
}

export async function loadOpportunityHistory(
  tenantId: string,
): Promise<OpportunityHistory> {
  const [closed, stageEvents] = await Promise.all([
    prisma.opportunity.findMany({
      where: { tenantId, stage: { in: ["CLOSED_WON", "CLOSED_LOST"] } },
      select: { stage: true, createdAt: true, closedAt: true },
    }),
    prisma.opportunityStageEvent.findMany({
      where: { tenantId },
      select: { toStage: true, opportunity: { select: { stage: true } } },
    }),
  ]);

  const won = closed.filter((item) => item.stage === "CLOSED_WON").length;
  const cycles = closed
    .filter((item) => item.closedAt)
    .map((item) => (item.closedAt!.getTime() - item.createdAt.getTime()) / DAY);

  const stageConversion: OpportunityHistory["stageConversion"] = {};
  for (const event of stageEvents) {
    const current = stageConversion[event.toStage] ?? { total: 0, won: 0 };
    current.total += 1;
    if (event.opportunity.stage === "CLOSED_WON") current.won += 1;
    stageConversion[event.toStage] = current;
  }

  return {
    closedCount: closed.length,
    wonCount: won,
    averageCycleDays:
      cycles.length > 0
        ? Math.round(cycles.reduce((sum, value) => sum + value, 0) / cycles.length)
        : null,
    stageConversion,
  };
}

/** Recomputes and stores an opportunity win baseline plus its factors. */
export async function recomputeOpportunityProbability(
  tenantId: string,
  opportunityId: string,
) {
  const [opportunity, history] = await Promise.all([
    prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId },
      select: {
        id: true,
        stage: true,
        amount: true,
        createdAt: true,
        stageChangedAt: true,
        expectedCloseDate: true,
        lastActivityAt: true,
      },
    }),
    loadOpportunityHistory(tenantId),
  ]);

  if (!opportunity) return null;

  const tasks = await prisma.task.findMany({
    where: {
      tenantId,
      relatedType: "OPPORTUNITY",
      relatedId: opportunityId,
      status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
    },
    select: { dueDate: true },
  });

  const now = new Date();
  const result = estimateOpportunityProbability({
    stage: opportunity.stage,
    amount: opportunity.amount ? Number(opportunity.amount) : null,
    createdAt: opportunity.createdAt,
    stageChangedAt: opportunity.stageChangedAt,
    expectedCloseDate: opportunity.expectedCloseDate,
    lastActivityAt: opportunity.lastActivityAt,
    openTasks: tasks.length,
    overdueTasks: tasks.filter(
      (task) => task.dueDate != null && task.dueDate.getTime() < now.getTime(),
    ).length,
    history,
  });

  await prisma.opportunity.update({
    where: { id: opportunity.id },
    data: {
      winProbability: result.probability,
      probabilityMethod: result.method,
      probabilityFactors: result.factors,
      probabilityUpdatedAt: now,
    },
  });

  return result;
}

export type CrmReference = {
  type: "lead" | "contact" | "company" | "opportunity" | "task";
  id: string;
  label: string;
};

export async function addCrmActivity(params: {
  tenantId: string;
  userId?: string | null;
  type:
    | "NOTE"
    | "CALL"
    | "MEETING"
    | "EMAIL"
    | "TASK"
    | "STATUS_CHANGE"
    | "STAGE_CHANGE"
    | "CONVERSION"
    | "SYSTEM";
  subject: string;
  body?: string | null;
  source?: "HUMAN" | "SYSTEM" | "AUTOMATION";
  reference: CrmReference;
  metadata?: Prisma.InputJsonValue;
}) {
  const where =
    params.reference.type === "lead"
      ? { leadId: params.reference.id }
      : params.reference.type === "contact"
        ? { contactId: params.reference.id }
        : params.reference.type === "company"
          ? { companyId: params.reference.id }
          : params.reference.type === "opportunity"
            ? { opportunityId: params.reference.id }
            : { taskId: params.reference.id };

  const exists = await ownsReference(params.tenantId, params.reference);
  if (!exists) return null;

  const activity = await prisma.crmActivity.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId ?? null,
      type: params.type,
      subject: params.subject,
      body: params.body ?? null,
      source: params.source ?? "HUMAN",
      metadata: params.metadata,
      ...where,
    },
  });

  // Only a logged human interaction counts as contact. Status changes,
  // conversions and automation events are activity, not outreach.
  const isContact = CONTACT_ACTIVITY_TYPES.has(params.type);

  if (isContact && params.reference.type === "lead") {
    await prisma.lead.update({
      where: { id: params.reference.id },
      data: { lastContactedAt: new Date() },
    });
    await recomputeLeadScore(params.tenantId, params.reference.id);
  }
  if (params.reference.type === "opportunity") {
    await prisma.opportunity.update({
      where: { id: params.reference.id },
      data: { lastActivityAt: new Date() },
    });
    await recomputeOpportunityProbability(params.tenantId, params.reference.id);
  }
  if (isContact && params.reference.type === "contact") {
    await prisma.contact.update({
      where: { id: params.reference.id },
      data: { lastContactedAt: new Date() },
    });
  }
  if (isContact && params.reference.type === "company") {
    await prisma.company.update({
      where: { id: params.reference.id },
      data: { lastInteractionAt: new Date() },
    });
  }

  return activity;
}

async function ownsReference(tenantId: string, reference: CrmReference) {
  switch (reference.type) {
    case "lead":
      return prisma.lead.findFirst({
        where: { id: reference.id, tenantId },
        select: { id: true },
      });
    case "contact":
      return prisma.contact.findFirst({
        where: { id: reference.id, tenantId },
        select: { id: true },
      });
    case "company":
      return prisma.company.findFirst({
        where: { id: reference.id, tenantId },
        select: { id: true },
      });
    case "opportunity":
      return prisma.opportunity.findFirst({
        where: { id: reference.id, tenantId },
        select: { id: true },
      });
    case "task":
      return prisma.task.findFirst({
        where: { id: reference.id, tenantId },
        select: { id: true },
      });
  }
}

export async function listRecordTimeline(params: {
  tenantId: string;
  leadId?: string;
  contactId?: string;
  companyId?: string;
  opportunityId?: string;
  take?: number;
}) {
  return prisma.crmActivity.findMany({
    where: {
      tenantId: params.tenantId,
      ...(params.leadId ? { leadId: params.leadId } : {}),
      ...(params.contactId ? { contactId: params.contactId } : {}),
      ...(params.companyId ? { companyId: params.companyId } : {}),
      ...(params.opportunityId ? { opportunityId: params.opportunityId } : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: params.take ?? 50,
    select: {
      id: true,
      type: true,
      subject: true,
      body: true,
      source: true,
      occurredAt: true,
      user: { select: { name: true, email: true } },
      metadata: true,
    },
  });
}

export async function getLeadDetail(tenantId: string, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, tenantId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      convertedContact: { select: { id: true, firstName: true, lastName: true } },
      convertedCompany: { select: { id: true, name: true } },
      convertedOpportunity: { select: { id: true, name: true, stage: true } },
    },
  });
  if (!lead) return null;

  const [timeline, tasks] = await Promise.all([
    listRecordTimeline({ tenantId, leadId }),
    prisma.task.findMany({
      where: { tenantId, relatedType: "LEAD", relatedId: leadId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: { select: { name: true, email: true } },
      },
    }),
  ]);

  return { lead, timeline, tasks };
}

export async function getContactDetail(tenantId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId },
    include: {
      company: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });
  if (!contact) return null;

  const [timeline, tasks] = await Promise.all([
    listRecordTimeline({ tenantId, contactId }),
    prisma.task.findMany({
      where: { tenantId, relatedType: "CONTACT", relatedId: contactId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: { select: { name: true, email: true } },
      },
    }),
  ]);

  return { contact, timeline, tasks };
}

export async function getCompanyDetail(tenantId: string, companyId: string) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, tenantId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      contacts: {
        orderBy: { lastName: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          title: true,
          status: true,
        },
      },
      opportunities: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          stage: true,
          amount: true,
          currency: true,
          winProbability: true,
          expectedCloseDate: true,
          owner: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (!company) return null;

  const [timeline, tasks] = await Promise.all([
    listRecordTimeline({ tenantId, companyId }),
    prisma.task.findMany({
      where: { tenantId, relatedType: "COMPANY", relatedId: companyId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: { select: { name: true, email: true } },
      },
    }),
  ]);

  return { company, timeline, tasks };
}

export async function getOpportunityDetail(
  tenantId: string,
  opportunityId: string,
) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, tenantId },
    include: {
      company: { select: { id: true, name: true, industry: true } },
      owner: { select: { id: true, name: true, email: true } },
      stageEvents: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          fromStage: true,
          toStage: true,
          createdAt: true,
          source: true,
          actor: { select: { name: true, email: true } },
        },
      },
      quotations: {
        select: {
          id: true,
          quoteNumber: true,
          status: true,
          total: true,
          currency: true,
        },
      },
    },
  });
  if (!opportunity) return null;

  const [timeline, tasks] = await Promise.all([
    listRecordTimeline({ tenantId, opportunityId }),
    prisma.task.findMany({
      where: { tenantId, relatedType: "OPPORTUNITY", relatedId: opportunityId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: { select: { name: true, email: true } },
      },
    }),
  ]);

  return { opportunity, timeline, tasks };
}

export type PipelineCard = {
  id: string;
  name: string;
  stage: string;
  amount: number | null;
  currency: string;
  winProbability: number | null;
  probabilityMethod: string | null;
  expectedCloseDate: Date | null;
  stageChangedAt: Date;
  company: { id: string; name: string } | null;
  owner: { name: string | null; email: string } | null;
  overdueTasks: number;
};

export async function getPipelineBoard(tenantId: string) {
  const [opportunities, overdueTasks] = await Promise.all([
    prisma.opportunity.findMany({
      where: { tenantId, stage: { in: OPEN_OPPORTUNITY_STAGES } },
      orderBy: [{ expectedCloseDate: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        stage: true,
        amount: true,
        currency: true,
        winProbability: true,
        probabilityMethod: true,
        expectedCloseDate: true,
        stageChangedAt: true,
        company: { select: { id: true, name: true } },
        owner: { select: { name: true, email: true } },
      },
    }),
    prisma.task.groupBy({
      by: ["relatedId"],
      where: {
        tenantId,
        relatedType: "OPPORTUNITY",
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
        dueDate: { lt: new Date() },
      },
      _count: { _all: true },
    }),
  ]);

  const overdueMap = new Map(
    overdueTasks.map((entry) => [entry.relatedId, entry._count._all]),
  );

  const cards: PipelineCard[] = opportunities.map((opportunity) => ({
    id: opportunity.id,
    name: opportunity.name,
    stage: opportunity.stage,
    amount: opportunity.amount ? Number(opportunity.amount) : null,
    currency: opportunity.currency,
    winProbability: opportunity.winProbability,
    probabilityMethod: opportunity.probabilityMethod,
    expectedCloseDate: opportunity.expectedCloseDate,
    stageChangedAt: opportunity.stageChangedAt,
    company: opportunity.company,
    owner: opportunity.owner,
    overdueTasks: overdueMap.get(opportunity.id) ?? 0,
  }));

  const stages = [
    "PROSPECTING",
    "QUALIFICATION",
    "PROPOSAL",
    "NEGOTIATION",
  ].map((stage) => {
    const stageCards = cards.filter((card) => card.stage === stage);
    const totals = new Map<string, number>();
    const weighted = new Map<string, number>();
    for (const card of stageCards) {
      totals.set(card.currency, (totals.get(card.currency) ?? 0) + (card.amount ?? 0));
      weighted.set(
        card.currency,
        (weighted.get(card.currency) ?? 0) +
          ((card.amount ?? 0) * (card.winProbability ?? 0)) / 100,
      );
    }
    return {
      stage,
      count: stageCards.length,
      cards: stageCards,
      totals: [...totals.entries()].map(([currency, value]) => ({ currency, value })),
      weighted: [...weighted.entries()].map(([currency, value]) => ({
        currency,
        value,
      })),
    };
  });

  return { stages, cards };
}

export async function convertLead(params: {
  tenantId: string;
  userId: string;
  leadId: string;
  opportunityName?: string;
  amount?: number | null;
  expectedCloseDate?: Date | null;
}) {
  const lead = await prisma.lead.findFirst({
    where: { id: params.leadId, tenantId: params.tenantId },
  });
  if (!lead) return { error: "Lead not found in this workspace." } as const;
  if (lead.status === "CONVERTED" || lead.convertedAt) {
    return { error: "This lead has already been converted." } as const;
  }

  const companyName = lead.companyName?.trim() || `${lead.firstName} ${lead.lastName}`;
  const existingCompany = await prisma.company.findFirst({
    where: {
      tenantId: params.tenantId,
      name: { equals: companyName, mode: "insensitive" },
    },
    select: { id: true, name: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    const company =
      existingCompany ??
      (await tx.company.create({
        data: {
          tenantId: params.tenantId,
          name: companyName,
          industry: lead.industry,
          email: lead.email,
          phone: lead.phone,
          ownerId: lead.ownerId,
          lastInteractionAt: new Date(),
        },
        select: { id: true, name: true },
      }));

    const contact = await tx.contact.create({
      data: {
        tenantId: params.tenantId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        title: lead.jobTitle,
        ownerId: lead.ownerId,
        companyId: company.id,
        lastContactedAt: new Date(),
      },
      select: { id: true, firstName: true, lastName: true },
    });

    const opportunity = await tx.opportunity.create({
      data: {
        tenantId: params.tenantId,
        name:
          params.opportunityName?.trim() ||
          `${company.name} opportunity`,
        companyId: company.id,
        stage: "QUALIFICATION",
        amount: params.amount ?? (lead.estimatedValue ? Number(lead.estimatedValue) : null),
        currency: lead.currency,
        probability: 25,
        winProbability: 25,
        probabilityMethod: "RULE_BASELINE_V1",
        expectedCloseDate:
          params.expectedCloseDate ??
          lead.expectedConversionDate ??
          new Date(Date.now() + 30 * DAY),
        ownerId: lead.ownerId,
        nextStep: "Qualify the opportunity and confirm the buying process.",
        lastActivityAt: new Date(),
      },
      select: { id: true, name: true },
    });

    const updated = await tx.lead.update({
      where: { id: lead.id },
      data: {
        status: "CONVERTED",
        convertedAt: new Date(),
        qualifiedAt: lead.qualifiedAt ?? new Date(),
        convertedCompanyId: company.id,
        convertedContactId: contact.id,
        convertedOpportunityId: opportunity.id,
      },
    });

    await tx.opportunityStageEvent.create({
      data: {
        tenantId: params.tenantId,
        opportunityId: opportunity.id,
        toStage: "QUALIFICATION",
        source: "CONVERSION",
        actorId: params.userId,
      },
    });

    await tx.crmActivity.createMany({
      data: [
        {
          tenantId: params.tenantId,
          userId: params.userId,
          type: "CONVERSION",
          subject: "Lead converted",
          body: `Converted into company "${company.name}" and opportunity "${opportunity.name}".`,
          source: "SYSTEM",
          leadId: lead.id,
          companyId: company.id,
          contactId: contact.id,
          opportunityId: opportunity.id,
        },
        {
          tenantId: params.tenantId,
          userId: params.userId,
          type: "SYSTEM",
          subject: "Account created from lead",
          body: `Created from lead ${lead.firstName} ${lead.lastName}.`,
          source: "SYSTEM",
          companyId: company.id,
          contactId: contact.id,
        },
        {
          tenantId: params.tenantId,
          userId: params.userId,
          type: "SYSTEM",
          subject: "Opportunity created from lead",
          body: `Created from lead ${lead.firstName} ${lead.lastName}.`,
          source: "SYSTEM",
          opportunityId: opportunity.id,
        },
      ],
    });

    return { updated, company, contact, opportunity };
  });

  await recomputeLeadScore(params.tenantId, lead.id).catch(() => null);
  await recomputeOpportunityProbability(params.tenantId, result.opportunity.id).catch(
    () => null,
  );

  return {
    lead: result.updated,
    companyId: result.company.id,
    contactId: result.contact.id,
    opportunityId: result.opportunity.id,
  };
}

export async function changeOpportunityStage(params: {
  tenantId: string;
  userId: string;
  opportunityId: string;
  stage: OpportunityStage;
  lostReason?: string | null;
  wonReason?: string | null;
  source?: "HUMAN" | "AUTOMATION";
}) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: params.opportunityId, tenantId: params.tenantId },
  });
  if (!opportunity) return { error: "Opportunity not found in this workspace." } as const;
  if (opportunity.stage === params.stage) {
    return { error: "The opportunity is already in that stage." } as const;
  }
  if (
    opportunity.stage === "CLOSED_WON" ||
    opportunity.stage === "CLOSED_LOST"
  ) {
    return {
      error:
        "Closed opportunities cannot be reopened here. Create a new opportunity to preserve the sales history.",
    } as const;
  }
  if (params.stage === "CLOSED_LOST" && !params.lostReason?.trim()) {
    return { error: "A lost reason is required when closing an opportunity as lost." } as const;
  }

  const closed = params.stage === "CLOSED_WON" || params.stage === "CLOSED_LOST";
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.opportunity.update({
      where: { id: opportunity.id },
      data: {
        stage: params.stage,
        stageChangedAt: now,
        lastActivityAt: now,
        closedAt: closed ? now : null,
        lostReason:
          params.stage === "CLOSED_LOST"
            ? params.lostReason?.trim() ?? null
            : opportunity.lostReason,
        wonReason:
          params.stage === "CLOSED_WON"
            ? params.wonReason?.trim() ?? null
            : opportunity.wonReason,
        winProbability:
          params.stage === "CLOSED_WON"
            ? 100
            : params.stage === "CLOSED_LOST"
              ? 0
              : undefined,
      },
    });

    await tx.opportunityStageEvent.create({
      data: {
        tenantId: params.tenantId,
        opportunityId: opportunity.id,
        fromStage: opportunity.stage,
        toStage: params.stage,
        amount: opportunity.amount,
        source: params.source ?? "HUMAN",
        actorId: params.userId,
      },
    });

    await tx.crmActivity.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        type: "STAGE_CHANGE",
        subject: `Stage changed from ${opportunity.stage.replaceAll("_", " ")} to ${params.stage.replaceAll("_", " ")}`,
        body:
          params.stage === "CLOSED_LOST"
            ? `Lost reason: ${params.lostReason}`
            : params.stage === "CLOSED_WON"
              ? params.wonReason
                ? `Won reason: ${params.wonReason}`
                : "Opportunity marked won."
              : null,
        source: params.source === "AUTOMATION" ? "AUTOMATION" : "HUMAN",
        opportunityId: opportunity.id,
        companyId: opportunity.companyId,
      },
    });

    return record;
  });

  if (!closed) {
    await recomputeOpportunityProbability(params.tenantId, opportunity.id);
  }

  return {
    opportunity: updated,
    fromStage: opportunity.stage,
    toStage: params.stage,
    companyId: opportunity.companyId,
  };
}

export type PriorityItem = {
  id: string;
  kind: "task" | "lead" | "opportunity" | "company" | "data";
  title: string;
  detail: string;
  href: string;
  severity: "high" | "medium" | "low";
  reason: string;
};

export async function getCrmWorkspace(params: {
  tenantId: string;
  userId: string;
  features: {
    leads: boolean;
    opportunities: boolean;
    tasks: boolean;
    companies: boolean;
    automation: boolean;
  };
}) {
  const { tenantId, userId, features } = params;
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - 7 * DAY);
  const stalledCutoff = new Date(now.getTime() - 21 * DAY);

  const [
    leadStats,
    hotLeads,
    staleLeads,
    opportunities,
    taskRows,
    overdueTaskRows,
    recentTimeline,
    automationFailures,
    totalOpenTasks,
    dueTodayTasks,
  ] = await Promise.all([
    features.leads
      ? prisma.lead.aggregate({
          where: { tenantId },
          _count: { _all: true },
          _avg: { score: true },
        })
      : null,
    features.leads
      ? prisma.lead.findMany({
          where: {
            tenantId,
            status: { notIn: CLOSED_LEAD_STATUSES },
            score: { gte: 70 },
          },
          orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
          take: 5,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            score: true,
            lastContactedAt: true,
            createdAt: true,
            owner: { select: { name: true, email: true } },
          },
        })
      : [],
    features.leads
      ? prisma.lead.findMany({
          where: {
            tenantId,
            status: { notIn: CLOSED_LEAD_STATUSES },
            OR: [
              { lastContactedAt: { lt: staleCutoff } },
              { lastContactedAt: null, createdAt: { lt: staleCutoff } },
            ],
          },
          orderBy: [{ score: "desc" }, { updatedAt: "asc" }],
          take: 5,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            status: true,
            score: true,
            lastContactedAt: true,
            createdAt: true,
            owner: { select: { name: true, email: true } },
          },
        })
      : [],
    features.opportunities
      ? prisma.opportunity.findMany({
          where: { tenantId, stage: { in: OPEN_OPPORTUNITY_STAGES } },
          select: {
            id: true,
            name: true,
            stage: true,
            amount: true,
            currency: true,
            winProbability: true,
            expectedCloseDate: true,
            stageChangedAt: true,
            company: { select: { id: true, name: true } },
            owner: { select: { name: true, email: true } },
          },
        })
      : [],
    features.tasks
      ? prisma.task.findMany({
          where: {
            tenantId,
            status: { in: OPEN_TASK_STATUSES },
            relatedType: { in: ["LEAD", "CONTACT", "COMPANY", "OPPORTUNITY"] },
          },
          orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
          take: 8,
          select: {
            id: true,
            title: true,
            dueDate: true,
            priority: true,
            relatedType: true,
            relatedId: true,
            assignee: { select: { name: true, email: true } },
          },
        })
      : [],
    features.tasks
      ? prisma.task.findMany({
          where: {
            tenantId,
            status: { in: OPEN_TASK_STATUSES },
            dueDate: { lt: now },
            relatedType: { in: ["LEAD", "CONTACT", "COMPANY", "OPPORTUNITY"] },
          },
          orderBy: { dueDate: "asc" },
          take: 5,
          select: {
            id: true,
            title: true,
            dueDate: true,
            priority: true,
            relatedType: true,
            relatedId: true,
            assignee: { select: { name: true, email: true } },
          },
        })
      : [],
    prisma.crmActivity.findMany({
      where: { tenantId },
      orderBy: { occurredAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        subject: true,
        occurredAt: true,
        source: true,
        leadId: true,
        companyId: true,
        opportunityId: true,
        contactId: true,
        user: { select: { name: true, email: true } },
      },
    }),
    features.automation
      ? prisma.automationRun.count({
          where: { tenantId, status: "FAILED", startedAt: { gt: staleCutoff } },
        })
      : 0,
    features.tasks
      ? prisma.task.count({
          where: { tenantId, status: { in: OPEN_TASK_STATUSES } },
        })
      : 0,
    features.tasks
      ? prisma.task.count({
          where: {
            tenantId,
            status: { in: OPEN_TASK_STATUSES },
            dueDate: {
              gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
              lt: new Date(
                Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
              ),
            },
          },
        })
      : 0,
  ]);

  const priorities: PriorityItem[] = [];

  for (const task of overdueTaskRows) {
    priorities.push({
      id: `task:${task.id}`,
      kind: "task",
      title: task.title,
      detail: `${task.relatedType?.toLowerCase() ?? "CRM"} follow-up${
        task.assignee?.name ? ` assigned to ${task.assignee.name}` : ""
      }`,
      href: recordHref(task.relatedType, task.relatedId),
      severity: task.priority === "HIGH" || task.priority === "URGENT" ? "high" : "medium",
      reason: task.dueDate
        ? `Overdue since ${task.dueDate.toISOString().slice(0, 10)}.`
        : "Overdue follow-up.",
    });
  }

  for (const lead of staleLeads.slice(0, 3)) {
    const lastTouch = lead.lastContactedAt ?? lead.createdAt;
    priorities.push({
      id: `lead:${lead.id}`,
      kind: "lead",
      title: `${lead.firstName} ${lead.lastName}${lead.companyName ? ` · ${lead.companyName}` : ""}`,
      detail: lead.owner?.name ?? lead.owner?.email ?? "Unassigned lead",
      href: `/app/leads/${lead.id}`,
      severity: lead.score != null && lead.score >= 70 ? "high" : "medium",
      reason: `No contact for ${daysSince(lastTouch, now) ?? 0} days${
        lead.score != null ? `; baseline score ${lead.score}` : ""
      }.`,
    });
  }

  const atRisk = opportunities
    .filter(
      (opportunity) =>
        opportunity.stageChangedAt < stalledCutoff ||
        (opportunity.expectedCloseDate != null &&
          opportunity.expectedCloseDate < now),
    )
    .sort((a, b) => Number(b.amount ?? 0) - Number(a.amount ?? 0))
    .slice(0, 3);

  for (const opportunity of atRisk) {
    priorities.push({
      id: `opportunity:${opportunity.id}`,
      kind: "opportunity",
      title: opportunity.name,
      detail: opportunity.company?.name ?? "No account",
      href: `/app/opportunities/${opportunity.id}`,
      severity: "high",
      reason:
        opportunity.expectedCloseDate != null && opportunity.expectedCloseDate < now
          ? `Expected close date passed on ${opportunity.expectedCloseDate.toISOString().slice(0, 10)}.`
          : `No stage movement for ${daysSince(opportunity.stageChangedAt, now) ?? 0} days.`,
    });
  }

  const closingSoon = opportunities
    .filter(
      (opportunity) =>
        opportunity.expectedCloseDate != null &&
        opportunity.expectedCloseDate >= now &&
        opportunity.expectedCloseDate.getTime() <= now.getTime() + 30 * DAY,
    )
    .sort(
      (a, b) =>
        (a.expectedCloseDate?.getTime() ?? 0) - (b.expectedCloseDate?.getTime() ?? 0),
    )
    .slice(0, 3);

  for (const opportunity of closingSoon) {
    priorities.push({
      id: `closing:${opportunity.id}`,
      kind: "opportunity",
      title: opportunity.name,
      detail: opportunity.company?.name ?? "No account",
      href: `/app/opportunities/${opportunity.id}`,
      severity: "medium",
      reason: `Expected to close on ${opportunity.expectedCloseDate?.toISOString().slice(0, 10)} with a ${opportunity.winProbability ?? 0}% baseline.`,
    });
  }

  const severityRank = { high: 0, medium: 1, low: 2 } as const;
  priorities.sort(
    (a, b) =>
      severityRank[a.severity] - severityRank[b.severity] ||
      a.kind.localeCompare(b.kind),
  );

  const openPipeline = new Map<string, number>();
  const weightedPipeline = new Map<string, number>();
  for (const opportunity of opportunities) {
    const currency = opportunity.currency || "TZS";
    openPipeline.set(
      currency,
      (openPipeline.get(currency) ?? 0) + Number(opportunity.amount ?? 0),
    );
    weightedPipeline.set(
      currency,
      (weightedPipeline.get(currency) ?? 0) +
        (Number(opportunity.amount ?? 0) * (opportunity.winProbability ?? 0)) / 100,
    );
  }

  return {
    totals: {
      leads: leadStats?._count._all ?? 0,
      averageLeadScore:
        leadStats?._avg.score != null ? Math.round(leadStats._avg.score) : null,
      openOpportunities: opportunities.length,
      openPipeline: [...openPipeline.entries()].map(([currency, value]) => ({
        currency,
        value,
      })),
      weightedPipeline: [...weightedPipeline.entries()].map(([currency, value]) => ({
        currency,
        value,
      })),
      openTasks: totalOpenTasks,
      dueTodayTasks,
      overdueTasks: overdueTaskRows.length,
      automationFailures,
    },
    priorities: priorities.slice(0, 12),
    hotLeads,
    staleLeads,
    atRisk,
    closingSoon,
    recentTimeline,
    upcomingTasks: taskRows,
    userId,
  };
}

export function recordHref(type: string | null, id: string | null) {
  if (!id) return "/app/crm";
  switch (type) {
    case "LEAD":
      return `/app/leads/${id}`;
    case "CONTACT":
      return `/app/contacts/${id}`;
    case "COMPANY":
      return `/app/companies/${id}`;
    case "OPPORTUNITY":
      return `/app/opportunities/${id}`;
    default:
      return "/app/crm";
  }
}

export type DataQualityIssue = {
  key: string;
  label: string;
  count: number;
  description: string;
  sample: Array<{ id: string; label: string; href: string }>;
};

export async function getDataQuality(tenantId: string): Promise<{
  score: number;
  issues: DataQualityIssue[];
}> {
  const [leads, contacts, companies] = await Promise.all([
    prisma.lead.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        ownerId: true,
        updatedAt: true,
        status: true,
      },
    }),
    prisma.contact.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyId: true,
      },
    }),
    prisma.company.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, phone: true, industry: true },
    }),
  ]);

  const activeLeads = leads.filter((lead) => lead.status !== "CONVERTED");
  const missingContact = activeLeads.filter((lead) => !lead.email && !lead.phone);
  const unassigned = activeLeads.filter((lead) => !lead.ownerId);
  const stale = activeLeads.filter((lead) => daysSince(lead.updatedAt) != null && (daysSince(lead.updatedAt) ?? 0) > 30);
  const companiesMissing = companies.filter(
    (company) => !company.email || !company.phone || !company.industry,
  );
  const contactsMissing = contacts.filter((contact) => !contact.email && !contact.phone);

  const duplicateLeads = findDuplicateGroups(
    activeLeads.map((lead) => ({
      id: lead.id,
      label: `${lead.firstName} ${lead.lastName}`,
      keys: [
        lead.email ? `email:${lead.email.trim().toLowerCase()}` : "",
        lead.phone ? `phone:${normalisePhone(lead.phone)}` : "",
      ].filter(Boolean),
    })),
  );

  const duplicateCompanies = findDuplicateGroups(
    companies.map((company) => ({
      id: company.id,
      label: company.name,
      keys: [`name:${company.name.trim().toLowerCase()}`],
    })),
  );

  const issues: DataQualityIssue[] = [
    {
      key: "leads_missing_contact",
      label: "Leads without contact details",
      count: missingContact.length,
      description: "Open leads with neither an email address nor a phone number.",
      sample: missingContact.slice(0, 3).map((lead) => ({
        id: lead.id,
        label: `${lead.firstName} ${lead.lastName}`,
        href: `/app/leads/${lead.id}`,
      })),
    },
    {
      key: "leads_unassigned",
      label: "Unassigned leads",
      count: unassigned.length,
      description: "Open leads with no workspace owner.",
      sample: unassigned.slice(0, 3).map((lead) => ({
        id: lead.id,
        label: `${lead.firstName} ${lead.lastName}`,
        href: `/app/leads/${lead.id}`,
      })),
    },
    {
      key: "leads_stale",
      label: "Stale leads",
      count: stale.length,
      description: "Open leads with no recorded change for more than 30 days.",
      sample: stale.slice(0, 3).map((lead) => ({
        id: lead.id,
        label: `${lead.firstName} ${lead.lastName}`,
        href: `/app/leads/${lead.id}`,
      })),
    },
    {
      key: "duplicate_leads",
      label: "Possible duplicate leads",
      count: duplicateLeads.length,
      description: "Leads sharing an email address or phone number. Nothing is merged automatically.",
      sample: duplicateLeads.slice(0, 3).map((entry) => ({
        id: entry.ids[0],
        label: entry.label,
        href: `/app/leads/${entry.ids[0]}`,
      })),
    },
    {
      key: "companies_incomplete",
      label: "Incomplete accounts",
      count: companiesMissing.length,
      description: "Accounts missing a phone number, email address or industry.",
      sample: companiesMissing.slice(0, 3).map((company) => ({
        id: company.id,
        label: company.name,
        href: `/app/companies/${company.id}`,
      })),
    },
    {
      key: "duplicate_companies",
      label: "Possible duplicate accounts",
      count: duplicateCompanies.length,
      description: "Accounts with the same normalised name. Review before merging.",
      sample: duplicateCompanies.slice(0, 3).map((entry) => ({
        id: entry.ids[0],
        label: entry.label,
        href: `/app/companies/${entry.ids[0]}`,
      })),
    },
    {
      key: "contacts_missing_contact",
      label: "Contacts without contact details",
      count: contactsMissing.length,
      description: "Contacts with neither an email address nor a phone number.",
      sample: contactsMissing.slice(0, 3).map((contact) => ({
        id: contact.id,
        label: `${contact.firstName} ${contact.lastName}`,
        href: `/app/contacts/${contact.id}`,
      })),
    },
  ].filter((issue) => issue.count > 0);

  const totalRecords = leads.length + contacts.length + companies.length;
  const issueCount = issues.reduce((sum, issue) => sum + issue.count, 0);
  const score =
    totalRecords === 0
      ? 100
      : Math.max(0, Math.round(100 - (issueCount / totalRecords) * 100));

  return { score, issues };
}

function normalisePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function findDuplicateGroups(
  records: Array<{ id: string; label: string; keys: string[] }>,
) {
  const groups = new Map<string, Array<{ id: string; label: string }>>();
  for (const record of records) {
    for (const key of record.keys) {
      const list = groups.get(key) ?? [];
      if (!list.some((entry) => entry.id === record.id)) {
        list.push({ id: record.id, label: record.label });
      }
      groups.set(key, list);
    }
  }

  const seen = new Set<string>();
  return [...groups.values()]
    .filter((group) => group.length > 1)
    .filter((group) => {
      const signature = group
        .map((entry) => entry.id)
        .sort()
        .join(":");
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .map((group) => ({ ids: group.map((entry) => entry.id), label: group[0].label }));
}

export async function getSourcePerformance(tenantId: string) {
  const rows = await prisma.lead.findMany({
    where: { tenantId },
    select: { source: true, status: true, createdAt: true },
  });

  const groups = new Map<
    string,
    { source: string; total: number; converted: number; lost: number }
  >();

  for (const row of rows) {
    const source = row.source?.trim() || "Unrecorded";
    const current = groups.get(source.toLowerCase()) ?? {
      source,
      total: 0,
      converted: 0,
      lost: 0,
    };
    current.total += 1;
    if (row.status === "CONVERTED") current.converted += 1;
    if (row.status === "LOST" || row.status === "UNQUALIFIED") current.lost += 1;
    groups.set(source.toLowerCase(), current);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      conversionRate: group.total > 0 ? (group.converted / group.total) * 100 : 0,
    }))
    .sort((a, b) => b.converted - a.converted || b.total - a.total);
}

export async function getCrmAnalytics(tenantId: string, months = 6) {
  const safeMonths = Math.min(12, Math.max(3, months));
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (safeMonths - 1), 1),
  );

  const [leads, opportunities, tasks, activities, lostReasons, stageEvents] =
    await Promise.all([
      prisma.lead.findMany({
        where: { tenantId, createdAt: { gte: start } },
        select: { createdAt: true, convertedAt: true, source: true, status: true },
      }),
      prisma.opportunity.findMany({
        where: { tenantId },
        select: {
          stage: true,
          amount: true,
          currency: true,
          winProbability: true,
          createdAt: true,
          closedAt: true,
          expectedCloseDate: true,
          lostReason: true,
          stageChangedAt: true,
        },
      }),
      prisma.task.findMany({
        where: {
          tenantId,
          createdAt: { gte: start },
          relatedType: { in: ["LEAD", "CONTACT", "COMPANY", "OPPORTUNITY"] },
        },
        select: { status: true, dueDate: true, completedAt: true, createdAt: true },
      }),
      prisma.crmActivity.findMany({
        where: { tenantId, occurredAt: { gte: start } },
        select: { type: true, occurredAt: true, source: true },
      }),
      prisma.opportunity.groupBy({
        by: ["lostReason"],
        where: { tenantId, stage: "CLOSED_LOST", lostReason: { not: null } },
        _count: { _all: true },
      }),
      prisma.opportunityStageEvent.findMany({
        where: { tenantId, createdAt: { gte: start } },
        select: { fromStage: true, toStage: true, createdAt: true },
      }),
    ]);

  const buckets = Array.from({ length: safeMonths }).map((_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    return {
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
      leads: 0,
      converted: 0,
      won: 0,
      lost: 0,
      activities: 0,
    };
  });
  const indexes = new Map(buckets.map((bucket, index) => [bucket.key, index]));
  const keyOf = (date: Date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

  for (const lead of leads) {
    const index = indexes.get(keyOf(lead.createdAt));
    if (index !== undefined) buckets[index].leads += 1;
    if (lead.convertedAt) {
      const convertedIndex = indexes.get(keyOf(lead.convertedAt));
      if (convertedIndex !== undefined) buckets[convertedIndex].converted += 1;
    }
  }

  const won = opportunities.filter((item) => item.stage === "CLOSED_WON");
  const lost = opportunities.filter((item) => item.stage === "CLOSED_LOST");
  for (const opportunity of opportunities) {
    if (!opportunity.closedAt) continue;
    const index = indexes.get(keyOf(opportunity.closedAt));
    if (index === undefined) continue;
    if (opportunity.stage === "CLOSED_WON") buckets[index].won += 1;
    if (opportunity.stage === "CLOSED_LOST") buckets[index].lost += 1;
  }

  for (const activity of activities) {
    const index = indexes.get(keyOf(activity.occurredAt));
    if (index !== undefined) buckets[index].activities += 1;
  }

  const open = opportunities.filter(
    (item) => item.stage !== "CLOSED_WON" && item.stage !== "CLOSED_LOST",
  );
  const completedTasks = tasks.filter(
    (task) => task.status === "DONE" || task.completedAt != null,
  );
  const overdueTasks = tasks.filter(
    (task) =>
      task.dueDate != null &&
      task.status !== "DONE" &&
      task.status !== "CANCELLED" &&
      task.dueDate.getTime() < now.getTime(),
  );

  const cycles = won
    .filter((item) => item.closedAt)
    .map((item) => (item.closedAt!.getTime() - item.createdAt.getTime()) / DAY);

  const forecasts: CurrencyForecast[] = buildForecast(
    opportunities.map((item) => ({
      id: "",
      name: "",
      amount: item.amount ? Number(item.amount) : null,
      currency: item.currency,
      stage: item.stage,
      winProbability: item.winProbability,
      expectedCloseDate: item.expectedCloseDate,
      closedAt: item.closedAt,
    })),
    nextMonthKeys(4, now),
  );

  const stageFunnel = ["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION"].map(
    (stage) => ({
      stage,
      count: open.filter((item) => item.stage === stage).length,
      value: open
        .filter((item) => item.stage === stage)
        .reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
    }),
  );

  const currencyGroup = (items: typeof opportunities) => {
    const grouped = new Map<string, number>();
    for (const item of items) {
      const currency = item.currency || "TZS";
      grouped.set(currency, (grouped.get(currency) ?? 0) + Number(item.amount ?? 0));
    }
    return [...grouped.entries()].map(([currency, value]) => ({ currency, value }));
  };

  const weightedCurrencyGroup = (items: typeof opportunities) => {
    const grouped = new Map<string, number>();
    for (const item of items) {
      const currency = item.currency || "TZS";
      grouped.set(
        currency,
        (grouped.get(currency) ?? 0) +
          (Number(item.amount ?? 0) * (item.winProbability ?? 0)) / 100,
      );
    }
    return [...grouped.entries()].map(([currency, value]) => ({ currency, value }));
  };

  return {
    months: safeMonths,
    buckets,
    sourcePerformance: await getSourcePerformance(tenantId),
    stageFunnel,
    lostReasons: lostReasons.map((entry) => ({
      reason: entry.lostReason ?? "Unrecorded",
      count: entry._count._all,
    })),
    stageTransitions: stageEvents.reduce<Record<string, number>>((acc, event) => {
      const key = `${event.fromStage ?? "START"}→${event.toStage}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
    forecasts,
    totals: {
      leadsInPeriod: leads.length,
      convertedInPeriod: leads.filter((lead) => lead.convertedAt).length,
      wonCount: won.length,
      lostCount: lost.length,
      wonValue: won.reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
      winRate:
        won.length + lost.length > 0
          ? (won.length / (won.length + lost.length)) * 100
          : null,
      averageDealSize:
        won.length > 0
          ? won.reduce((sum, item) => sum + Number(item.amount ?? 0), 0) / won.length
          : null,
      averageCycleDays:
        cycles.length > 0
          ? Math.round(cycles.reduce((sum, value) => sum + value, 0) / cycles.length)
          : null,
      openPipeline: open.reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
      weightedPipeline: open.reduce(
        (sum, item) =>
          sum + (Number(item.amount ?? 0) * (item.winProbability ?? 0)) / 100,
        0,
      ),
      openPipelineByCurrency: currencyGroup(open),
      weightedPipelineByCurrency: weightedCurrencyGroup(open),
      wonValueByCurrency: currencyGroup(won),
      activityCount: activities.length,
      tasksCreated: tasks.length,
      tasksCompleted: completedTasks.length,
      followUpCompletionRate:
        tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : null,
      overdueTasks: overdueTasks.length,
    },
  };
}

export type CrmSearchResult = {
  type: "lead" | "contact" | "company" | "opportunity";
  id: string;
  title: string;
  meta: string;
  href: string;
};

export async function searchCrm(params: {
  tenantId: string;
  query: string;
  can: { leads: boolean; contacts: boolean; companies: boolean; opportunities: boolean };
}): Promise<CrmSearchResult[]> {
  const q = params.query.trim();
  if (q.length < 2) return [];
  const take = 5;

  const [leads, contacts, companies, opportunities] = await Promise.all([
    params.can.leads
      ? prisma.lead.findMany({
          where: {
            tenantId: params.tenantId,
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { companyName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          },
          take,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            status: true,
            score: true,
          },
        })
      : [],
    params.can.contacts
      ? prisma.contact.findMany({
          where: {
            tenantId: params.tenantId,
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          },
          take,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: { select: { name: true } },
          },
        })
      : [],
    params.can.companies
      ? prisma.company.findMany({
          where: {
            tenantId: params.tenantId,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { industry: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          },
          take,
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, industry: true },
        })
      : [],
    params.can.opportunities
      ? prisma.opportunity.findMany({
          where: {
            tenantId: params.tenantId,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          },
          take,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            stage: true,
            amount: true,
            currency: true,
            company: { select: { name: true } },
          },
        })
      : [],
  ]);

  return [
    ...leads.map((lead) => ({
      type: "lead" as const,
      id: lead.id,
      title: `${lead.firstName} ${lead.lastName}`,
      meta: [lead.companyName, lead.status, lead.score != null ? `score ${lead.score}` : null]
        .filter(Boolean)
        .join(" · "),
      href: `/app/leads/${lead.id}`,
    })),
    ...contacts.map((contact) => ({
      type: "contact" as const,
      id: contact.id,
      title: `${contact.firstName} ${contact.lastName}`,
      meta: [contact.company?.name, contact.email].filter(Boolean).join(" · "),
      href: `/app/contacts/${contact.id}`,
    })),
    ...companies.map((company) => ({
      type: "company" as const,
      id: company.id,
      title: company.name,
      meta: company.industry ?? "Account",
      href: `/app/companies/${company.id}`,
    })),
    ...opportunities.map((opportunity) => ({
      type: "opportunity" as const,
      id: opportunity.id,
      title: opportunity.name,
      meta: [opportunity.company?.name, opportunity.stage, opportunity.currency]
        .filter(Boolean)
        .join(" · "),
      href: `/app/opportunities/${opportunity.id}`,
    })),
  ];
}
