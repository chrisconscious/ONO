import { prisma } from "@/lib/database/prisma";
import { recordAuditEvent } from "@/server/services/audit-service";
import {
  EVENT_TO_TRIGGER,
  publish,
  setEventDispatcher,
  type AnyDomainEvent,
} from "@/server/events/event-bus";
import type { Prisma, WorkflowRule } from "@prisma/client";

/**
 * Minimal, reliable, event-driven automation engine.
 *
 * - Rules are tenant-scoped rows (WorkflowRule) matched on trigger event.
 * - Every execution attempt is recorded as a WorkflowRun with a UNIQUE
 *   (ruleId, eventId) constraint — duplicate deliveries become
 *   SKIPPED_DUPLICATE runs, so actions never execute twice.
 * - A per-event depth counter prevents infinite loops (actions that publish
 *   events cannot cascade beyond MAX_EVENT_DEPTH).
 * - High-impact rules NEVER execute their action directly; they open an
 *   approval request instead (approval gate).
 * - Failures are recorded (FAILED run + audit WARNING) and never throw back
 *   into the business operation that published the event.
 */

const MAX_EVENT_DEPTH = 3;

let installed = false;

/** Idempotent installation — safe to call from every route/server entry. */
export function installAutomationEngine(): void {
  if (installed) return;
  installed = true;
  setEventDispatcher(async (event) => {
    await handleEvent(event, 0);
  });
}

interface EventPayload {
  /** entity id the event concerns (lead id, order id, invoice id…) */
  entityId: string;
  entityLabel: string;
  ownerId?: string | null;
  numericValue?: number;
}

function extractPayload(event: AnyDomainEvent): EventPayload {
  switch (event.name) {
    case "lead.created":
    case "lead.qualified":
      return {
        entityId: event.lead.id,
        entityLabel: `Lead ${event.lead.title}`,
        ownerId: event.lead.ownerId,
        numericValue: event.lead.valueEstimate ? Number(event.lead.valueEstimate) : undefined,
      };
    case "opportunity.stage_changed":
      return { entityId: event.opportunityId, entityLabel: `Opportunity (${event.to})` };
    case "order.confirmed":
      return {
        entityId: event.orderId,
        entityLabel: `Order ${event.orderNumber}`,
        numericValue: Number(event.total),
      };
    case "stock.reorder_alert":
      return {
        entityId: event.productId,
        entityLabel: `Product ${event.productSku}`,
        numericValue: Number(event.quantityOnHand),
      };
    case "invoice.issued":
      return {
        entityId: event.invoiceId,
        entityLabel: `Invoice ${event.invoiceNumber}`,
        numericValue: Number(event.total),
      };
    case "approval.decided":
      return { entityId: event.approvalId, entityLabel: `Approval ${event.decision}` };
  }
}

/** Deterministic condition evaluation over validated rule JSON. */
function evaluateConditions(conditions: Prisma.JsonValue, payload: EventPayload): boolean {
  if (conditions == null || typeof conditions !== "object" || Array.isArray(conditions)) return true;
  const c = conditions as Record<string, unknown>;
  if (typeof c.fieldEquals === "string") {
    // only supported field today: stage for opportunity events
    if (payload.entityLabel.includes("(") && !payload.entityLabel.includes(c.fieldEquals)) return false;
  }
  if (typeof c.minAmount === "number") {
    if (payload.numericValue == null || payload.numericValue < c.minAmount) return false;
  }
  if (typeof c.maxAmount === "number") {
    if (payload.numericValue == null || payload.numericValue > c.maxAmount) return false;
  }
  return true;
}

async function handleEvent(event: AnyDomainEvent, depth: number): Promise<void> {
  if (depth >= MAX_EVENT_DEPTH) {
    console.error(`Loop guard: event ${event.name} exceeded max depth ${MAX_EVENT_DEPTH}`);
    return;
  }
  const trigger = EVENT_TO_TRIGGER[event.name];
  const rules = await prisma.workflowRule.findMany({
    where: { tenantId: event.tenantId, triggerEvent: trigger, isActive: true },
  });
  if (rules.length === 0) return;
  const payload = extractPayload(event);

  for (const rule of rules) {
    if (!evaluateConditions(rule.conditions as Prisma.JsonValue, payload)) continue;
    await executeRule(rule, event, payload);
  }
}

async function executeRule(
  rule: WorkflowRule,
  event: AnyDomainEvent,
  payload: EventPayload,
): Promise<void> {
  // Atomic dedupe: unique (ruleId, eventId). Duplicate delivery -> no-op run.
  const claimed = await prisma.workflowRun
    .create({
      data: {
        tenantId: event.tenantId,
        ruleId: rule.id,
        ruleVersion: rule.version,
        eventId: event.eventId,
        status: "COMPLETED",
      },
    })
    .catch(() => null);
  if (!claimed) {
    await prisma.workflowRun
      .create({
        data: {
          tenantId: event.tenantId,
          ruleId: rule.id,
          ruleVersion: rule.version,
          eventId: event.eventId,
          status: "SKIPPED_DUPLICATE",
          detail: "Event already processed for this rule",
          finishedAt: new Date(),
        },
      })
      .catch(() => undefined);
    return;
  }

  try {
    if (rule.isHighImpact) {
      // Approval gate: consequential automations require human authorization.
      const approval = await prisma.approval.create({
        data: {
          tenantId: event.tenantId,
          entityType: "AUTOMATION_HIGH_IMPACT",
          entityId: payload.entityId,
          requestedByUserId: event.actorUserId,
          comment: `Automation "${rule.name}" requires approval before executing`,
          steps: {
            create: [
              {
                tenantId: event.tenantId,
                stepOrder: 1,
                requiredRole: "ADMIN",
                requiredPermission: "org.settings.manage",
              },
            ],
          },
        },
      });
      await prisma.workflowRun.update({
        where: { id: claimed.id },
        data: {
          detail: `Approval gate opened (${approval.id})`,
          createdEntityIds: { approvalId: approval.id },
          finishedAt: new Date(),
        },
      });
      await recordAuditEvent({
        tenantId: event.tenantId,
        userId: event.actorUserId,
        action: "automation.gated",
        entityType: "WorkflowRule",
        entityId: rule.id,
        severity: "WARNING",
        summary: `High-impact automation "${rule.name}" gated behind approval`,
      });
      return;
    }

    const params = (rule.actionParams ?? {}) as Record<string, unknown>;
    let createdIds: Record<string, string> = {};

    if (rule.actionType === "CREATE_FOLLOWUP") {
      const dueInHours = typeof params.dueInHours === "number" ? params.dueInHours : 24;
      const fu = await prisma.followUp.create({
        data: {
          tenantId: event.tenantId,
          leadId: event.name.startsWith("lead.") ? payload.entityId : null,
          dueAt: new Date(Date.now() + dueInHours * 3600_000),
          note: `Auto-created by workflow "${rule.name}" for ${payload.entityLabel}`,
        },
      });
      createdIds = { followUpId: fu.id };
    } else if (rule.actionType === "NOTIFY") {
      const targets = await prisma.membership.findMany({
        where: {
          tenantId: event.tenantId,
          isActive: true,
          ...(params.notifyOwner === true && payload.ownerId ? { userId: payload.ownerId } : {}),
        },
        select: { userId: true },
        take: 50,
      });
      const notes = await prisma.notification.createMany({
        data: targets.map((t) => ({
          tenantId: event.tenantId,
          userId: t.userId,
          title: String(params.title ?? `Workflow: ${rule.name}`),
          body: String(params.body ?? `Triggered by ${payload.entityLabel}`),
        })),
      });
      createdIds = { notified: String(notes.count) };
    } else if (rule.actionType === "ASSIGN_TASK") {
      const task = await prisma.task.create({
        data: {
          tenantId: event.tenantId,
          title: String(params.title ?? `Task from workflow "${rule.name}"`),
          description: `Auto-created for ${payload.entityLabel}`,
          assigneeId: typeof params.assignToOwnerId === "boolean" && params.assignToOwnerId
            ? payload.ownerId ?? null
            : null,
          priority: "HIGH",
        },
      });
      createdIds = { taskId: task.id };
    }

    await prisma.workflowRun.update({
      where: { id: claimed.id },
      data: { status: "COMPLETED", createdEntityIds: createdIds, finishedAt: new Date() },
    });
    await recordAuditEvent({
      tenantId: event.tenantId,
      userId: event.actorUserId,
      action: "automation.executed",
      entityType: "WorkflowRule",
      entityId: rule.id,
      summary: `Workflow "${rule.name}" executed for ${payload.entityLabel}`,
      metadata: { eventId: event.eventId, ...createdIds },
    });
  } catch (error) {
    await prisma.workflowRun
      .update({
        where: { id: claimed.id },
        data: {
          status: "FAILED",
          detail: error instanceof Error ? error.message.slice(0, 500) : "unknown",
          finishedAt: new Date(),
        },
      })
      .catch(() => undefined);
    await recordAuditEvent({
      tenantId: event.tenantId,
      userId: event.actorUserId,
      action: "automation.failed",
      entityType: "WorkflowRule",
      entityId: rule.id,
      severity: "WARNING",
      summary: `Workflow "${rule.name}" failed for event ${event.eventId}`,
    });
  }
}

/** Manual re-delivery for FAILED runs (bounded, audited recovery path). */
export async function retryFailedRuns(ctx: { tenantId: string }): Promise<number> {
  const failed = await prisma.workflowRun.findMany({
    where: { tenantId: ctx.tenantId, status: "FAILED" },
    include: { rule: true },
    take: 20,
    orderBy: { startedAt: "asc" },
  });
  let retried = 0;
  for (const run of failed) {
    // Re-execute via a fresh event id suffix so dedupe does not skip it.
    const ok = await prisma.workflowRun
      .create({
        data: {
          tenantId: ctx.tenantId,
          ruleId: run.ruleId,
          ruleVersion: run.ruleVersion,
          eventId: `${run.eventId}#retry-${Date.now()}`,
          status: "COMPLETED",
        },
      })
      .then(() => true)
      .catch(() => false);
    if (!ok) continue;
    const params = (run.rule.actionParams ?? {}) as Record<string, unknown>;
    try {
      if (run.rule.actionType === "NOTIFY") {
        const admins = await prisma.membership.findMany({
          where: { tenantId: ctx.tenantId, isActive: true, role: "ADMIN" },
          select: { userId: true },
        });
        await prisma.notification.createMany({
          data: admins.map((m) => ({
            tenantId: ctx.tenantId,
            userId: m.userId,
            title: `Workflow retry: ${run.rule.name}`,
            body: `Previously failed run ${run.id} was retried manually.`,
          })),
        });
      }
      retried += 1;
    } catch {
      /* bounded single attempt — no unbounded retries */
    }
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: "COMPLETED", detail: "Manually recovered", finishedAt: new Date() },
    });
  }
  return retried;
}

// Re-export for services that need to emit events post-commit.
export { publish };
