import { OpportunityStage } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import {
  addCrmActivity,
  recomputeLeadScore,
  recomputeOpportunityProbability,
} from "@/server/services/crm/crm.service";
import { dispatchRecordEvent } from "@/server/services/crm/automation.service";
import type { ResourceKey } from "@/lib/resources/registry";

export type CrmSnapshot = {
  status: string | null;
  ownerId: string | null;
  stage: OpportunityStage | null;
};

const CRM_KEYS: ResourceKey[] = ["leads", "contacts", "companies", "opportunities", "tasks"];

export function isCrmResource(key: ResourceKey) {
  return CRM_KEYS.includes(key);
}

/**
 * Reads the fields needed to compare a record before and after a mutation.
 * Only leads and opportunities currently raise automations.
 */
export async function readCrmSnapshot(
  key: ResourceKey,
  tenantId: string,
  id: string,
): Promise<CrmSnapshot | null> {
  if (key === "leads") {
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
      select: { status: true, ownerId: true },
    });
    return lead ? { status: lead.status, ownerId: lead.ownerId, stage: null } : null;
  }
  if (key === "opportunities") {
    const opportunity = await prisma.opportunity.findFirst({
      where: { id, tenantId },
      select: { stage: true, ownerId: true },
    });
    return opportunity
      ? { status: opportunity.stage, ownerId: opportunity.ownerId, stage: opportunity.stage }
      : null;
  }
  return { status: null, ownerId: null, stage: null };
}

/**
 * Post-write CRM processing: timeline entries, score refreshes and automation
 * dispatch. Automation failures are logged and never fail the user's request.
 */
export async function processCrmWrite(params: {
  key: ResourceKey;
  tenantId: string;
  actorId: string;
  id: string;
  created: boolean;
  previous: CrmSnapshot | null;
}) {
  try {
    if (params.key === "leads") {
      await processLeadWrite(params);
    } else if (params.key === "opportunities") {
      await processOpportunityWrite(params);
    }
  } catch (error) {
    console.error(`CRM post-write processing failed for ${params.key}:`, error);
  }
}

async function processLeadWrite(params: {
  tenantId: string;
  actorId: string;
  id: string;
  created: boolean;
  previous: CrmSnapshot | null;
}) {
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, tenantId: params.tenantId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      ownerId: true,
      updatedAt: true,
    },
  });
  if (!lead) return;

  if (params.created) {
    await addCrmActivity({
      tenantId: params.tenantId,
      userId: params.actorId,
      type: "SYSTEM",
      subject: "Lead created",
      body: `Lead ${lead.firstName} ${lead.lastName} was captured.`,
      reference: { type: "lead", id: lead.id, label: `${lead.firstName} ${lead.lastName}` },
      metadata: { status: lead.status },
    }).catch(() => null);

    await dispatchRecordEvent({
      tenantId: params.tenantId,
      actorId: params.actorId,
      trigger: "LEAD_CREATED",
      recordType: "lead",
      recordId: lead.id,
      eventKey: "created",
    }).catch((error) => {
      console.error("Lead-created automation failed:", error);
    });
  } else if (params.previous) {
    if (params.previous.status !== lead.status) {
      await addCrmActivity({
        tenantId: params.tenantId,
        userId: params.actorId,
        type: "STATUS_CHANGE",
        subject: `Status changed from ${humanise(params.previous.status)} to ${humanise(lead.status)}`,
        reference: { type: "lead", id: lead.id, label: `${lead.firstName} ${lead.lastName}` },
        metadata: { from: params.previous.status, to: lead.status },
      }).catch(() => null);

      await dispatchRecordEvent({
        tenantId: params.tenantId,
        actorId: params.actorId,
        trigger: "LEAD_STATUS_CHANGED",
        recordType: "lead",
        recordId: lead.id,
        eventKey: `status:${lead.status}:${lead.updatedAt.getTime()}`,
      }).catch((error) => {
        console.error("Lead-status automation failed:", error);
      });
    }

    if (params.previous.ownerId !== lead.ownerId) {
      await addCrmActivity({
        tenantId: params.tenantId,
        userId: params.actorId,
        type: "SYSTEM",
        subject: lead.ownerId ? "Lead owner assigned" : "Lead unassigned",
        reference: { type: "lead", id: lead.id, label: `${lead.firstName} ${lead.lastName}` },
        metadata: { ownerId: lead.ownerId },
      }).catch(() => null);

      await dispatchRecordEvent({
        tenantId: params.tenantId,
        actorId: params.actorId,
        trigger: "LEAD_ASSIGNED",
        recordType: "lead",
        recordId: lead.id,
        eventKey: `owner:${lead.ownerId ?? "none"}:${lead.updatedAt.getTime()}`,
      }).catch((error) => {
        console.error("Lead-assignment automation failed:", error);
      });
    }
  }

  await recomputeLeadScore(params.tenantId, lead.id).catch(() => null);
}

async function processOpportunityWrite(params: {
  tenantId: string;
  actorId: string;
  id: string;
  created: boolean;
  previous: CrmSnapshot | null;
}) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: params.id, tenantId: params.tenantId },
    select: {
      id: true,
      name: true,
      stage: true,
      stageChangedAt: true,
      companyId: true,
      updatedAt: true,
    },
  });
  if (!opportunity) return;

  if (params.created) {
    await addCrmActivity({
      tenantId: params.tenantId,
      userId: params.actorId,
      type: "SYSTEM",
      subject: "Opportunity created",
      body: `Opportunity ${opportunity.name} entered ${humanise(opportunity.stage)}.`,
      source: "SYSTEM",
      reference: { type: "opportunity", id: opportunity.id, label: opportunity.name },
      metadata: { stage: opportunity.stage },
    }).catch(() => null);

    await dispatchRecordEvent({
      tenantId: params.tenantId,
      actorId: params.actorId,
      trigger: "OPPORTUNITY_CREATED",
      recordType: "opportunity",
      recordId: opportunity.id,
      eventKey: "created",
    }).catch((error) => {
      console.error("Opportunity-created automation failed:", error);
    });
  } else if (params.previous && params.previous.stage !== opportunity.stage) {
    await addCrmActivity({
      tenantId: params.tenantId,
      userId: params.actorId,
      type: "STAGE_CHANGE",
      subject: `Stage changed from ${humanise(params.previous.stage)} to ${humanise(opportunity.stage)}`,
      reference: { type: "opportunity", id: opportunity.id, label: opportunity.name },
      metadata: { from: params.previous.stage, to: opportunity.stage },
    }).catch(() => null);

    await dispatchRecordEvent({
      tenantId: params.tenantId,
      actorId: params.actorId,
      trigger:
        opportunity.stage === "CLOSED_WON"
          ? "OPPORTUNITY_WON"
          : "OPPORTUNITY_STAGE_CHANGED",
      recordType: "opportunity",
      recordId: opportunity.id,
      eventKey: `stage:${opportunity.stage}:${opportunity.updatedAt.getTime()}`,
    }).catch((error) => {
      console.error("Opportunity-stage automation failed:", error);
    });
  }

  await recomputeOpportunityProbability(params.tenantId, opportunity.id).catch(() => null);
}

function humanise(value: string | null) {
  if (!value) return "unset";
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}
