import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";
import type { TenantContext } from "@/lib/auth/session";
import {
  createActivitySchema,
  createCompanySchema,
  createContactSchema,
  createFollowUpSchema,
  createLeadSchema,
  paginationQuerySchema,
  updateLeadSchema,
} from "@/lib/validation/schemas";
import type { LeadStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { publish } from "@/server/events/event-bus";

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function createLead(input: unknown, ctx: TenantContext) {
  const data = createLeadSchema.parse(input);
  if (data.sourceId) {
    const src = await prisma.leadSource.findFirst({
      where: { id: data.sourceId, tenantId: ctx.tenantId },
    });
    if (!src) throw ApiError.validation("sourceId does not belong to this organization");
  }
  if (data.ownerId) {
    const owner = await prisma.membership.findFirst({
      where: { userId: data.ownerId, tenantId: ctx.tenantId, isActive: true },
    });
    if (!owner) throw ApiError.validation("ownerId is not an active member of this organization");
  }
  if (data.campaignId) {
    const camp = await prisma.campaign.findFirst({
      where: { id: data.campaignId, tenantId: ctx.tenantId },
    });
    if (!camp) throw ApiError.validation("campaignId does not belong to this organization");
  }
  // Duplicate detection: same normalized email within the tenant blocks silent dupes.
  if (data.email) {
    const dupe = await prisma.lead.findFirst({
      where: {
        tenantId: ctx.tenantId,
        email: { equals: data.email.trim().toLowerCase() },
        status: { notIn: ["LOST", "DO_NOT_CONTACT"] },
      },
    });
    if (dupe) throw ApiError.conflict(`An open lead with this email already exists (${dupe.id})`);
  }
  const lead = await prisma.lead.create({
    data: {
      tenantId: ctx.tenantId,
      title: data.title,
      company: data.company,
      email: data.email,
      phone: data.phone,
      sourceId: data.sourceId,
      ownerId: data.ownerId ?? ctx.user.id,
      valueEstimate: data.valueEstimate !== undefined ? new Prisma.Decimal(data.valueEstimate) : undefined,
      notes: data.notes,
    },
  });
  // Campaign attribution: only recorded when the lead actually came from a campaign.
  if (data.campaignId) {
    await prisma.campaign.update({
      where: { id: data.campaignId },
      data: { leadsCount: { increment: 1 } },
    });
    await prisma.activity.create({
      data: {
        tenantId: ctx.tenantId,
        type: "NOTE",
        subject: `Attributed to campaign ${data.campaignId}`,
        leadId: lead.id,
      },
    });
  }
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "crm.lead.create",
    entityType: "Lead",
    entityId: lead.id,
    summary: `Lead '${lead.title}' created`,
  });
  await publish({
    name: "lead.created",
    tenantId: ctx.tenantId,
    actorUserId: ctx.user.id,
    membershipId: ctx.membershipId,
    eventId: `lead.created:${lead.id}`,
    lead,
  });
  return lead;
}

const LEAD_STATUS_EDGES: Record<LeadStatus, readonly LeadStatus[]> = {
  NEW: ["CONTACTED", "QUALIFIED", "LOST", "DO_NOT_CONTACT"],
  CONTACTED: ["QUALIFIED", "PROPOSAL", "LOST", "DO_NOT_CONTACT", "NEW"],
  QUALIFIED: ["PROPOSAL", "WON", "LOST", "DO_NOT_CONTACT"],
  PROPOSAL: ["WON", "LOST", "QUALIFIED"],
  WON: [],
  LOST: ["NEW"], // re-qualify
  DO_NOT_CONTACT: ["NEW"],
};

export function isLegalLeadStatusTransition(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_STATUS_EDGES[from].includes(to);
}

export async function updateLead(id: string, input: unknown, ctx: TenantContext) {
  const data = updateLeadSchema.parse(input);
  const existing = await prisma.lead.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!existing) throw ApiError.notFound("Lead not found");

  if (data.status && !isLegalLeadStatusTransition(existing.status, data.status)) {
    throw ApiError.validation(`Illegal lead status transition ${existing.status} -> ${data.status}`);
  }
  // VIEWER has no crm.write; owners/managers/admins can edit. MEMBER+ can edit any lead in tenant.
  const lead = await prisma.lead.update({
    where: { id: existing.id },
    data: {
      title: data.title,
      company: data.company,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      status: data.status,
      sourceId: data.sourceId,
      ownerId: data.ownerId,
      valueEstimate:
        data.valueEstimate !== undefined ? new Prisma.Decimal(data.valueEstimate) : undefined,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "crm.lead.update",
    entityType: "Lead",
    entityId: lead.id,
    summary: `Lead '${lead.title}' updated${data.status ? ` (status -> ${data.status})` : ""}`,
  });
  if (data.status === "QUALIFIED" && existing.status !== "QUALIFIED") {
    await publish({
      name: "lead.qualified",
      tenantId: ctx.tenantId,
      actorUserId: ctx.user.id,
      membershipId: ctx.membershipId,
      eventId: `lead.qualified:${lead.id}:${randomUUID()}`,
      lead,
    });
  }
  return lead;
}

export async function listLeads(
  rawQuery: URLSearchParams,
  ctx: TenantContext,
) {
  const query = paginationQuerySchema.parse(Object.fromEntries(rawQuery));
  const where: Prisma.LeadWhereInput = {
    tenantId: ctx.tenantId,
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { company: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const statusParam = rawQuery.get("status");
  if (statusParam) where.status = statusParam as LeadStatus;

  const [total, items] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { source: { select: { name: true } } },
    }),
  ]);
  return { total, page: query.page, pageSize: query.pageSize, items };
}

export async function getLead(id: string, ctx: TenantContext) {
  const lead = await prisma.lead.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: {
      source: true,
      activities: { orderBy: { occurredAt: "desc" }, take: 50 },
      followUps: { orderBy: { dueAt: "asc" } },
      opportunity: true,
    },
  });
  if (!lead) throw ApiError.notFound("Lead not found");
  return lead;
}

export async function deleteLead(id: string, ctx: TenantContext) {
  const lead = await prisma.lead.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!lead) throw ApiError.notFound("Lead not found");
  await prisma.lead.delete({ where: { id: lead.id } });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "crm.lead.delete",
    entityType: "Lead",
    entityId: lead.id,
    severity: "WARNING",
    summary: `Lead '${lead.title}' deleted`,
  });
  return { deleted: true };
}

/** Convert a lead into company + contact (+ optional opportunity). Transactional. */
export async function convertLead(id: string, ctx: TenantContext) {
  const lead = await prisma.lead.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!lead) throw ApiError.notFound("Lead not found");
  if (lead.convertedContactId) throw ApiError.conflict("Lead already converted");
  if (lead.status === "LOST" || lead.status === "DO_NOT_CONTACT") {
    throw ApiError.validation(`Cannot convert a lead in status ${lead.status}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    let company = lead.company
      ? await tx.company.findFirst({ where: { tenantId: ctx.tenantId, name: lead.company } })
      : null;
    if (lead.company && !company) {
      company = await tx.company.create({
        data: { tenantId: ctx.tenantId, name: lead.company },
      });
    }
    const contact = await tx.contact.create({
      data: {
        tenantId: ctx.tenantId,
        firstName: lead.title.slice(0, 100),
        lastName: "-",
        email: lead.email,
        phone: lead.phone,
        companyId: company?.id,
        notes: lead.notes,
      },
    });
    const opportunity = await tx.opportunity.create({
      data: {
        tenantId: ctx.tenantId,
        name: `${lead.title} — opportunity`,
        stage: "IDENTIFICATION",
        amount: lead.valueEstimate ?? undefined,
        leadId: lead.id,
        companyId: company?.id,
        ownerId: lead.ownerId,
      },
    });
    await tx.lead.update({
      where: { id: lead.id },
      data: { convertedContactId: contact.id, convertedCompanyId: company?.id ?? null, status: "WON" },
    });
    // Historical activities/followUps remain linked to the lead row — nothing is erased.
    return { company, contact, opportunity };
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "crm.lead.convert",
    entityType: "Lead",
    entityId: lead.id,
    summary: `Lead '${lead.title}' converted to contact + opportunity`,
  });
  return result;
}

// ---------------------------------------------------------------------------
// Companies / contacts / activities / follow-ups
// ---------------------------------------------------------------------------

export async function createCompany(input: unknown, ctx: TenantContext) {
  const data = createCompanySchema.parse(input);
  try {
    const company = await prisma.company.create({
      data: { tenantId: ctx.tenantId, ...data },
    });
    await recordAuditEvent({
      tenantId: ctx.tenantId,
      userId: ctx.user.id,
      membershipId: ctx.membershipId,
      action: "crm.company.create",
      entityType: "Company",
      entityId: company.id,
      summary: `Company '${company.name}' created`,
    });
    return company;
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      throw ApiError.conflict(`Company '${data.name}' already exists`);
    }
    throw e;
  }
}

export async function listCompanies(rawQuery: URLSearchParams, ctx: TenantContext) {
  const query = paginationQuerySchema.parse(Object.fromEntries(rawQuery));
  const where: Prisma.CompanyWhereInput = {
    tenantId: ctx.tenantId,
    ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return { total, page: query.page, pageSize: query.pageSize, items };
}

export async function createContact(input: unknown, ctx: TenantContext) {
  const data = createContactSchema.parse(input);
  if (data.companyId) {
    const c = await prisma.company.findFirst({
      where: { id: data.companyId, tenantId: ctx.tenantId },
    });
    if (!c) throw ApiError.validation("companyId does not belong to this organization");
  }
  const contact = await prisma.contact.create({
    data: { tenantId: ctx.tenantId, ...data },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "crm.contact.create",
    entityType: "Contact",
    entityId: contact.id,
    summary: `Contact ${contact.firstName} ${contact.lastName} created`,
  });
  return contact;
}

export async function listContacts(rawQuery: URLSearchParams, ctx: TenantContext) {
  const query = paginationQuerySchema.parse(Object.fromEntries(rawQuery));
  const where: Prisma.ContactWhereInput = {
    tenantId: ctx.tenantId,
    ...(query.search
      ? {
          OR: [
            { firstName: { contains: query.search, mode: "insensitive" } },
            { lastName: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      orderBy: { lastName: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { company: { select: { id: true, name: true } } },
    }),
  ]);
  return { total, page: query.page, pageSize: query.pageSize, items };
}

export async function createActivity(input: unknown, ctx: TenantContext) {
  const data = createActivitySchema.parse(input);
  if (!data.leadId && !data.contactId) {
    throw ApiError.validation("An activity must reference a lead or a contact");
  }
  if (data.leadId) {
    const l = await prisma.lead.findFirst({ where: { id: data.leadId, tenantId: ctx.tenantId } });
    if (!l) throw ApiError.validation("leadId does not belong to this organization");
  }
  if (data.contactId) {
    const c = await prisma.contact.findFirst({
      where: { id: data.contactId, tenantId: ctx.tenantId },
    });
    if (!c) throw ApiError.validation("contactId does not belong to this organization");
  }
  return prisma.activity.create({
    data: {
      tenantId: ctx.tenantId,
      type: data.type,
      subject: data.subject,
      body: data.body,
      occurredAt: data.occurredAt ?? new Date(),
      leadId: data.leadId,
      contactId: data.contactId,
      assignedTo: data.assignedTo,
    },
  });
}

export async function createFollowUp(input: unknown, ctx: TenantContext) {
  const data = createFollowUpSchema.parse(input);
  if (!data.leadId && !data.contactId) {
    throw ApiError.validation("A follow-up must reference a lead or a contact");
  }
  if (data.leadId) {
    const l = await prisma.lead.findFirst({ where: { id: data.leadId, tenantId: ctx.tenantId } });
    if (!l) throw ApiError.validation("leadId does not belong to this organization");
  }
  if (data.contactId) {
    const c = await prisma.contact.findFirst({
      where: { id: data.contactId, tenantId: ctx.tenantId },
    });
    if (!c) throw ApiError.validation("contactId does not belong to this organization");
  }
  const followUp = await prisma.followUp.create({
    data: {
      tenantId: ctx.tenantId,
      leadId: data.leadId,
      contactId: data.contactId,
      dueAt: data.dueAt,
      note: data.note,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "crm.followup.create",
    entityType: "FollowUp",
    entityId: followUp.id,
    summary: `Follow-up scheduled for ${data.dueAt.toISOString()}`,
  });
  return followUp;
}

export async function completeFollowUp(id: string, ctx: TenantContext) {
  const fu = await prisma.followUp.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!fu) throw ApiError.notFound("Follow-up not found");
  if (fu.completedAt) throw ApiError.conflict("Follow-up already completed");
  return prisma.followUp.update({
    where: { id: fu.id },
    data: { completedAt: new Date() },
  });
}
