import { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import {
  evaluateAutomationConditions,
  isAutomationActionType,
  isAutomationConditionField,
  isAutomationOperator,
  isAutomationTrigger,
  validateAutomationDefinition,
  type AutomationAction,
  type AutomationCondition,
  type AutomationDefinition,
  type AutomationEvaluationContext,
  type AutomationTrigger,
} from "@/lib/crm/automation";
import {
  addCrmActivity,
  daysSince,
  recomputeLeadScore,
} from "@/server/services/crm/crm.service";

const DAY = 86_400_000;

export type WorkflowInput = {
  name: string;
  description?: string | null;
  trigger: string;
  conditions: unknown;
  actions: unknown;
  isActive?: boolean;
};

function toDefinition(input: WorkflowInput): {
  definition: AutomationDefinition;
  errors: string[];
} {
  const conditions = Array.isArray(input.conditions)
    ? input.conditions
        .filter(
          (value): value is Record<string, unknown> =>
            typeof value === "object" && value !== null,
        )
        .map((value) => ({
          field: String(value.field ?? ""),
          operator: String(value.operator ?? ""),
          value: String(value.value ?? ""),
        }))
    : [];

  const actions = Array.isArray(input.actions)
    ? input.actions
        .filter(
          (value): value is Record<string, unknown> =>
            typeof value === "object" && value !== null,
        )
        .map((value) => ({
          type: String(value.type ?? ""),
          params:
            typeof value.params === "object" && value.params !== null
              ? Object.fromEntries(
                  Object.entries(value.params as Record<string, unknown>).map(
                    ([key, item]) => [key, String(item ?? "")],
                  ),
                )
              : {},
        }))
    : [];

  const definition: AutomationDefinition = {
    trigger: input.trigger as AutomationTrigger,
    conditions: conditions.filter(
      (condition): condition is AutomationCondition =>
        isAutomationConditionField(condition.field) &&
        isAutomationOperator(condition.operator),
    ),
    actions: actions.filter(
      (action): action is AutomationAction => isAutomationActionType(action.type),
    ),
  };

  const errors: string[] = [];
  if (!isAutomationTrigger(input.trigger)) {
    errors.push("Choose a supported trigger.");
  }
  if (conditions.length !== definition.conditions.length) {
    errors.push("A condition uses an unsupported field or operator.");
  }
  if (actions.length !== definition.actions.length) {
    errors.push("An action uses an unsupported type.");
  }
  errors.push(...validateAutomationDefinition(definition));

  return { definition, errors: [...new Set(errors)] };
}

export async function listAutomationWorkflows(tenantId: string) {
  return prisma.automationWorkflow.findMany({
    where: { tenantId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: {
      createdBy: { select: { name: true, email: true } },
      updatedBy: { select: { name: true, email: true } },
      runs: {
        orderBy: { startedAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          trigger: true,
          attempts: true,
          summary: true,
          error: true,
          startedAt: true,
          finishedAt: true,
        },
      },
      _count: { select: { runs: true } },
    },
  });
}

export async function getAutomationWorkflow(tenantId: string, workflowId: string) {
  return prisma.automationWorkflow.findFirst({
    where: { id: workflowId, tenantId },
    include: {
      runs: {
        orderBy: { startedAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function createAutomationWorkflow(params: {
  tenantId: string;
  actorId: string;
  input: WorkflowInput;
}) {
  const { definition, errors } = toDefinition(params.input);
  if (errors.length) return { error: errors.join(" ") } as const;

  return prisma.automationWorkflow.create({
    data: {
      tenantId: params.tenantId,
      name: params.input.name.trim(),
      description: params.input.description?.trim() || null,
      trigger: definition.trigger,
      conditions: definition.conditions as unknown as Prisma.InputJsonValue,
      actions: definition.actions as unknown as Prisma.InputJsonValue,
      isActive: params.input.isActive ?? false,
      createdById: params.actorId,
      updatedById: params.actorId,
    },
  });
}

export async function updateAutomationWorkflow(params: {
  tenantId: string;
  actorId: string;
  workflowId: string;
  input: WorkflowInput;
}) {
  const existing = await prisma.automationWorkflow.findFirst({
    where: { id: params.workflowId, tenantId: params.tenantId },
    select: { id: true },
  });
  if (!existing) return { error: "Workflow not found in this workspace." } as const;

  const { definition, errors } = toDefinition(params.input);
  if (errors.length) return { error: errors.join(" ") } as const;

  return prisma.automationWorkflow.update({
    where: { id: existing.id },
    data: {
      name: params.input.name.trim(),
      description: params.input.description?.trim() || null,
      trigger: definition.trigger,
      conditions: definition.conditions as unknown as Prisma.InputJsonValue,
      actions: definition.actions as unknown as Prisma.InputJsonValue,
      isActive: params.input.isActive ?? false,
      updatedById: params.actorId,
    },
  });
}

export async function deleteAutomationWorkflow(params: {
  tenantId: string;
  workflowId: string;
}) {
  const existing = await prisma.automationWorkflow.findFirst({
    where: { id: params.workflowId, tenantId: params.tenantId },
    select: { id: true },
  });
  if (!existing) return { error: "Workflow not found in this workspace." } as const;
  await prisma.automationWorkflow.delete({ where: { id: existing.id } });
  return { ok: true } as const;
}

type RunContext = {
  tenantId: string;
  actorId: string | null;
  trigger: AutomationTrigger;
  leadId?: string;
  opportunityId?: string;
  companyId?: string;
  contactId?: string;
  taskId?: string;
  recordOwnerId: string | null;
  values: AutomationEvaluationContext;
};

function contextForRecord(params: {
  tenantId: string;
  actorId: string | null;
  trigger: AutomationTrigger;
  recordType: "lead" | "opportunity" | "task";
  record: Record<string, unknown>;
}): RunContext {
  const { record, tenantId, actorId, trigger } = params;

  if (params.recordType === "lead") {
    const createdAt = record.createdAt as Date;
    const lastContactedAt = record.lastContactedAt as Date | null;
    return {
      tenantId,
      actorId,
      trigger,
      leadId: record.id as string,
      recordOwnerId: (record.ownerId as string | null) ?? null,
      values: {
        source: record.source as string | null,
        status: record.status as string | null,
        industry: record.industry as string | null,
        companyName: record.companyName as string | null,
        score: record.score as number | null,
        amount:
          record.estimatedValue != null ? Number(record.estimatedValue) : null,
        inactiveDays: daysSince(lastContactedAt ?? createdAt),
      },
    };
  }

  if (params.recordType === "opportunity") {
    return {
      tenantId,
      actorId,
      trigger,
      opportunityId: record.id as string,
      companyId: (record.companyId as string | null) ?? undefined,
      recordOwnerId: (record.ownerId as string | null) ?? null,
      values: {
        stage: record.stage as string | null,
        companyName:
          (record.company as { name?: string } | null)?.name ?? null,
        score: record.winProbability as number | null,
        amount: record.amount != null ? Number(record.amount) : null,
        stalledDays: daysSince(record.stageChangedAt as Date),
        overdueDays:
          typeof record.overdueDays === "number" ? record.overdueDays : null,
      },
    };
  }

  return {
    tenantId,
    actorId,
    trigger,
    taskId: record.id as string,
    recordOwnerId: (record.assigneeId as string | null) ?? null,
    values: {
      overdueDays:
        record.dueDate != null
          ? daysSince(record.dueDate as Date)
          : null,
    },
  };
}

async function loadRunContext(params: {
  tenantId: string;
  actorId: string | null;
  trigger: AutomationTrigger;
  recordType: "lead" | "opportunity" | "task";
  recordId: string;
}): Promise<RunContext | { error: string }> {
  if (params.recordType === "lead") {
    const lead = await prisma.lead.findFirst({
      where: { id: params.recordId, tenantId: params.tenantId },
    });
    if (!lead) return { error: "Lead not found in this workspace." };
    return contextForRecord({
      tenantId: params.tenantId,
      actorId: params.actorId,
      trigger: params.trigger,
      recordType: "lead",
      record: lead as unknown as Record<string, unknown>,
    });
  }

  if (params.recordType === "opportunity") {
    const opportunity = await prisma.opportunity.findFirst({
      where: { id: params.recordId, tenantId: params.tenantId },
      include: { company: { select: { name: true } } },
    });
    if (!opportunity) return { error: "Opportunity not found in this workspace." };
    return contextForRecord({
      tenantId: params.tenantId,
      actorId: params.actorId,
      trigger: params.trigger,
      recordType: "opportunity",
      record: opportunity as unknown as Record<string, unknown>,
    });
  }

  const task = await prisma.task.findFirst({
    where: { id: params.recordId, tenantId: params.tenantId },
  });
  if (!task) return { error: "Task not found in this workspace." };
  return contextForRecord({
    tenantId: params.tenantId,
    actorId: params.actorId,
    trigger: params.trigger,
    recordType: "task",
    record: task as unknown as Record<string, unknown>,
  });
}

async function resolveAssignee(
  tenantId: string,
  ctx: RunContext,
  requested: string | undefined,
): Promise<string | null> {
  if (requested === "record_owner") return ctx.recordOwnerId;
  if (requested === "actor") return ctx.actorId;
  if (requested) {
    const membership = await prisma.membership.findFirst({
      where: { tenantId, userId: requested, status: "ACTIVE" },
      select: { userId: true },
    });
    return membership?.userId ?? null;
  }
  return ctx.recordOwnerId ?? ctx.actorId;
}

function relatedTarget(ctx: RunContext) {
  if (ctx.leadId) return { relatedType: "LEAD", relatedId: ctx.leadId };
  if (ctx.opportunityId)
    return { relatedType: "OPPORTUNITY", relatedId: ctx.opportunityId };
  if (ctx.taskId) return { relatedType: "TASK", relatedId: ctx.taskId };
  return { relatedType: null, relatedId: null };
}

async function runActions(
  tx: Prisma.TransactionClient,
  name: string,
  actions: AutomationAction[],
  ctx: RunContext,
) {
  const summary: Array<{ action: string; result: string }> = [];
  const target = relatedTarget(ctx);

  for (const action of actions) {
    switch (action.type) {
      case "CREATE_TASK": {
        const assigneeId = await resolveAssignee(
          ctx.tenantId,
          ctx,
          action.params.assignee,
        );
        const dueInDays = Number(action.params.dueInDays ?? 1);
        const task = await tx.task.create({
          data: {
            tenantId: ctx.tenantId,
            title: action.params.title.trim(),
            description: action.params.description?.trim() || `Created by automation "${name}".`,
            status: TaskStatus.TODO,
            priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(
              action.params.priority,
            )
              ? action.params.priority
              : "MEDIUM",
            assigneeId,
            dueDate: new Date(Date.now() + Math.max(0, dueInDays) * DAY),
            relatedType: target.relatedType,
            relatedId: target.relatedId,
          },
          select: { id: true },
        });
        summary.push({ action: action.type, result: `Task ${task.id} created.` });
        break;
      }

      case "ASSIGN_LEAD_OWNER": {
        if (!ctx.leadId) throw new Error("Assign-owner action requires a lead.");
        const ownerId = await resolveAssignee(
          ctx.tenantId,
          ctx,
          action.params.ownerId,
        );
        if (!ownerId) throw new Error("The configured owner is not an active member.");
        await tx.lead.update({
          where: { id: ctx.leadId },
          data: { ownerId },
        });
        summary.push({ action: action.type, result: "Lead owner updated." });
        break;
      }

      case "UPDATE_LEAD_STATUS": {
        if (!ctx.leadId) throw new Error("Status action requires a lead.");
        const status = action.params.status;
        if (!["CONTACTED", "QUALIFIED", "UNQUALIFIED"].includes(status)) {
          throw new Error("The requested status is not permitted for automation.");
        }
        await tx.lead.update({
          where: { id: ctx.leadId },
          data: { status: status as "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" },
        });
        summary.push({ action: action.type, result: `Lead status set to ${status}.` });
        break;
      }

      case "CREATE_NOTIFICATION": {
        const userId = await resolveAssignee(
          ctx.tenantId,
          ctx,
          action.params.audience === "actor" ? "actor" : "record_owner",
        );
        if (!userId) {
          summary.push({
            action: action.type,
            result: "Skipped because no recipient is assigned.",
          });
          break;
        }
        const href = ctx.leadId
          ? `/app/leads/${ctx.leadId}`
          : ctx.opportunityId
            ? `/app/opportunities/${ctx.opportunityId}`
            : "/app/crm";
        await tx.notification.create({
          data: {
            tenantId: ctx.tenantId,
            userId,
            type: ctx.leadId ? "LEAD" : "OPPORTUNITY",
            title: action.params.title.trim(),
            body: action.params.body?.trim() || `Automation "${name}" triggered.`,
            href,
          },
        });
        summary.push({ action: action.type, result: "In-app notification created." });
        break;
      }

      case "SET_OPPORTUNITY_NEXT_STEP": {
        if (!ctx.opportunityId) {
          throw new Error("Next-step action requires an opportunity.");
        }
        await tx.opportunity.update({
          where: { id: ctx.opportunityId },
          data: {
            nextStep: action.params.nextStep.trim(),
            lastActivityAt: new Date(),
          },
        });
        summary.push({
          action: action.type,
          result: "Opportunity next step updated.",
        });
        break;
      }

      default:
        throw new Error("Unsupported automation action.");
    }
  }

  return summary;
}

async function executeWorkflow(params: {
  workflow: {
    id: string;
    name: string;
    trigger: AutomationTrigger;
    conditions: Prisma.JsonValue;
    actions: Prisma.JsonValue;
  };
  ctx: RunContext;
  idempotencyKey: string;
}) {
  const existing = await prisma.automationRun.findUnique({
    where: {
      workflowId_idempotencyKey: {
        workflowId: params.workflow.id,
        idempotencyKey: params.idempotencyKey,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return { status: "duplicate" as const, runId: existing.id };
  }

  const conditions = Array.isArray(params.workflow.conditions)
    ? (params.workflow.conditions as unknown as AutomationCondition[])
    : [];
  const evaluation = evaluateAutomationConditions(conditions, params.ctx.values);
  if (!evaluation.matched) {
    return { status: "skipped" as const, runId: null };
  }

  const actions = Array.isArray(params.workflow.actions)
    ? (params.workflow.actions as unknown as AutomationAction[])
    : [];

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const outcome = await prisma.$transaction(async (tx) => {
        const summary = await runActions(
          tx,
          params.workflow.name,
          actions,
          params.ctx,
        );
        const run = await tx.automationRun.create({
          data: {
            tenantId: params.ctx.tenantId,
            workflowId: params.workflow.id,
            actorId: params.ctx.actorId,
            status: "SUCCEEDED",
            trigger: params.workflow.trigger,
            idempotencyKey: params.idempotencyKey,
            attempts: attempt,
            summary: summary as unknown as Prisma.InputJsonValue,
            finishedAt: new Date(),
          },
        });
        await tx.automationWorkflow.update({
          where: { id: params.workflow.id },
          data: { lastRunAt: new Date() },
        });
        return { summary, run };
      });

      const reference =
        params.ctx.leadId
          ? { type: "lead" as const, id: params.ctx.leadId, label: "" }
          : params.ctx.opportunityId
            ? {
                type: "opportunity" as const,
                id: params.ctx.opportunityId,
                label: "",
              }
            : params.ctx.taskId
              ? { type: "task" as const, id: params.ctx.taskId, label: "" }
              : null;

      if (reference) {
        await addCrmActivity({
          tenantId: params.ctx.tenantId,
          userId: null,
          type: "SYSTEM",
          subject: `Automation "${params.workflow.name}" executed`,
          body: outcome.summary
            .map((entry) => entry.result)
            .join(" "),
          source: "AUTOMATION",
          reference,
          metadata: {
            workflowId: params.workflow.id,
            actions: outcome.summary,
          },
        }).catch(() => null);
      }

      if (params.ctx.leadId) {
        await recomputeLeadScore(
          params.ctx.tenantId,
          params.ctx.leadId,
        ).catch(() => null);
      }

      return { status: "succeeded" as const, runId: outcome.run.id };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existing = await prisma.automationRun.findUnique({
          where: {
            workflowId_idempotencyKey: {
              workflowId: params.workflow.id,
              idempotencyKey: params.idempotencyKey,
            },
          },
          select: { id: true },
        });
        if (existing) {
          return { status: "duplicate" as const, runId: existing.id };
        }
      }
      lastError = error;
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "Automation execution failed.";
  const run = await prisma.automationRun.create({
    data: {
      tenantId: params.ctx.tenantId,
      workflowId: params.workflow.id,
      actorId: params.ctx.actorId,
      status: "FAILED",
      trigger: params.workflow.trigger,
      idempotencyKey: params.idempotencyKey,
      attempts: 2,
      error: message.slice(0, 1000),
      finishedAt: new Date(),
    },
  });
  return { status: "failed" as const, runId: run.id };
}

/**
 * Dispatches a record event to every active workflow for the trigger. Failures
 * are recorded and never roll back the business mutation that raised the event.
 */
export async function dispatchRecordEvent(params: {
  tenantId: string;
  actorId: string | null;
  trigger: AutomationTrigger;
  recordType: "lead" | "opportunity" | "task";
  recordId: string;
  eventKey: string;
}) {
  const workflows = await prisma.automationWorkflow.findMany({
    where: {
      tenantId: params.tenantId,
      trigger: params.trigger,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      trigger: true,
      conditions: true,
      actions: true,
    },
  });

  if (workflows.length === 0) return { dispatched: 0, results: [] };

  const ctx = await loadRunContext(params);
  if ("error" in ctx) return { dispatched: 0, results: [], error: ctx.error };

  const results = [];
  for (const workflow of workflows) {
    try {
      results.push(
        await executeWorkflow({
          workflow,
          ctx,
          idempotencyKey: `${params.trigger}:${params.recordId}:${params.eventKey}`,
        }),
      );
    } catch (error) {
      console.error(`Automation ${workflow.id} dispatch error:`, error);
      results.push({ status: "failed" as const, runId: null });
    }
  }

  return { dispatched: workflows.length, results };
}

/**
 * Evaluates time-based triggers for one tenant. Intended to be called by an
 * authenticated operator or a protected scheduler endpoint, never a browser timer.
 */
export async function runDueAutomations(params: {
  tenantId: string;
  actorId: string | null;
}) {
  const triggers: AutomationTrigger[] = [
    "LEAD_INACTIVE",
    "OPPORTUNITY_STALLED",
    "TASK_OVERDUE",
  ];

  const workflows = await prisma.automationWorkflow.findMany({
    where: {
      tenantId: params.tenantId,
      trigger: { in: triggers },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      trigger: true,
      conditions: true,
      actions: true,
    },
  });

  if (workflows.length === 0) {
    return { evaluated: 0, succeeded: 0, failed: 0, skipped: 0, duplicate: 0 };
  }

  const day = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const counters = { evaluated: 0, succeeded: 0, failed: 0, skipped: 0, duplicate: 0 };

  const [leads, opportunities, tasks] = await Promise.all([
    prisma.lead.findMany({
      where: {
        tenantId: params.tenantId,
        status: { notIn: ["CONVERTED", "LOST"] },
        OR: [
          { lastContactedAt: { lt: new Date(now.getTime() - 7 * DAY) } },
          { lastContactedAt: null, createdAt: { lt: new Date(now.getTime() - 7 * DAY) } },
        ],
      },
      take: 100,
    }),
    prisma.opportunity.findMany({
      where: {
        tenantId: params.tenantId,
        stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
        stageChangedAt: { lt: new Date(now.getTime() - 7 * DAY) },
      },
      include: { company: { select: { name: true } } },
      take: 100,
    }),
    prisma.task.findMany({
      where: {
        tenantId: params.tenantId,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { lt: now },
      },
      take: 100,
    }),
  ]);

  for (const workflow of workflows) {
    if (workflow.trigger === "LEAD_INACTIVE") {
      for (const lead of leads) {
        counters.evaluated += 1;
        const ctx = contextForRecord({
          tenantId: params.tenantId,
          actorId: params.actorId,
          trigger: workflow.trigger,
          recordType: "lead",
          record: lead as unknown as Record<string, unknown>,
        });
        const result = await executeWorkflow({
          workflow,
          ctx,
          idempotencyKey: `LEAD_INACTIVE:${lead.id}:${day}`,
        });
        counters[result.status] += 1;
      }
    }

    if (workflow.trigger === "OPPORTUNITY_STALLED") {
      for (const opportunity of opportunities) {
        counters.evaluated += 1;
        const ctx = contextForRecord({
          tenantId: params.tenantId,
          actorId: params.actorId,
          trigger: workflow.trigger,
          recordType: "opportunity",
          record: opportunity as unknown as Record<string, unknown>,
        });
        const result = await executeWorkflow({
          workflow,
          ctx,
          idempotencyKey: `OPPORTUNITY_STALLED:${opportunity.id}:${day}`,
        });
        counters[result.status] += 1;
      }
    }

    if (workflow.trigger === "TASK_OVERDUE") {
      for (const task of tasks) {
        counters.evaluated += 1;
        const ctx = contextForRecord({
          tenantId: params.tenantId,
          actorId: params.actorId,
          trigger: workflow.trigger,
          recordType: "task",
          record: task as unknown as Record<string, unknown>,
        });
        const result = await executeWorkflow({
          workflow,
          ctx,
          idempotencyKey: `TASK_OVERDUE:${task.id}:${day}`,
        });
        counters[result.status] += 1;
      }
    }
  }

  return counters;
}

/** Runs one active workflow against one record for an explicit operator check. */
export async function runWorkflowManually(params: {
  tenantId: string;
  actorId: string;
  workflowId: string;
  recordType: "lead" | "opportunity";
  recordId: string;
}) {
  const workflow = await prisma.automationWorkflow.findFirst({
    where: { id: params.workflowId, tenantId: params.tenantId },
    select: {
      id: true,
      name: true,
      trigger: true,
      conditions: true,
      actions: true,
      isActive: true,
    },
  });
  if (!workflow) return { error: "Workflow not found in this workspace." } as const;
  if (!workflow.isActive) {
    return { error: "Activate the workflow before running it." } as const;
  }

  const expectedType =
    params.recordType === "lead"
      ? ["LEAD_CREATED", "LEAD_STATUS_CHANGED", "LEAD_ASSIGNED", "LEAD_INACTIVE"]
      : [
          "OPPORTUNITY_CREATED",
          "OPPORTUNITY_STAGE_CHANGED",
          "OPPORTUNITY_WON",
          "OPPORTUNITY_STALLED",
        ];
  if (!expectedType.includes(workflow.trigger)) {
    return {
      error: `This workflow is triggered by ${workflow.trigger.replaceAll("_", " ").toLowerCase()} and cannot run against that record type.`,
    } as const;
  }

  const ctx = await loadRunContext({
    tenantId: params.tenantId,
    actorId: params.actorId,
    trigger: workflow.trigger,
    recordType: params.recordType,
    recordId: params.recordId,
  });
  if ("error" in ctx) return { error: ctx.error } as const;

  return executeWorkflow({
    workflow,
    ctx,
    idempotencyKey: `MANUAL:${params.recordId}:${Date.now()}`,
  });
}
