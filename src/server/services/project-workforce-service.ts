import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";
import { nextNumber } from "@/server/services/numbering";
import type { TenantContext } from "@/lib/auth/session";
import { Prisma, type TaskStatus, type ApprovalEntityType } from "@prisma/client";
import {
  createEmployeeSchema,
  createLeaveRequestSchema,
  createProjectSchema,
  createTaskSchema,
  decideApprovalSchema,
  updateTaskStatusSchema,
} from "@/lib/validation/schemas";

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const PROJECT_EDGES: Record<string, readonly string[]> = {
  PLANNING: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  ON_HOLD: ["ACTIVE", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function createProject(input: unknown, ctx: TenantContext) {
  const data = createProjectSchema.parse(input);
  if (data.ownerId) {
    const m = await prisma.membership.findFirst({
      where: { userId: data.ownerId, tenantId: ctx.tenantId, isActive: true },
    });
    if (!m) throw ApiError.validation("ownerId is not an active member of this organization");
  }
  const project = await prisma.$transaction(async (tx) => {
    const number = await nextNumber(tx, ctx.tenantId, "PRJ");
    return tx.project.create({
      data: {
        tenantId: ctx.tenantId,
        number,
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget !== undefined ? new Prisma.Decimal(data.budget) : undefined,
        ownerId: data.ownerId ?? ctx.user.id,
      },
    });
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "projects.project.create",
    entityType: "Project",
    entityId: project.id,
    summary: `Project ${project.number} '${project.name}' created`,
  });
  return project;
}

export async function transitionProject(projectId: string, to: string, ctx: TenantContext) {
  const p = await prisma.project.findFirst({ where: { id: projectId, tenantId: ctx.tenantId } });
  if (!p) throw ApiError.notFound("Project not found");
  const edges = PROJECT_EDGES[p.status];
  if (!edges || !edges.includes(to)) {
    throw ApiError.validation(`Illegal project transition: ${p.status} -> ${to}`);
  }
  const updated = await prisma.project.update({ where: { id: p.id }, data: { status: to as never } });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "projects.project.status_change",
    entityType: "Project",
    entityId: p.id,
    summary: `Project ${p.number}: ${p.status} -> ${to}`,
  });
  return updated;
}

// ---------------------------------------------------------------------------
// Tasks — status machine with preconditions.
// ---------------------------------------------------------------------------

const TASK_EDGES: Record<TaskStatus, readonly TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "CANCELLED", "BLOCKED"],
  IN_PROGRESS: ["REVIEW", "BLOCKED", "TODO", "CANCELLED"],
  BLOCKED: ["IN_PROGRESS", "TODO", "CANCELLED"],
  REVIEW: ["DONE", "IN_PROGRESS", "CANCELLED"],
  DONE: [],
  CANCELLED: ["TODO"],
};

export async function createTask(input: unknown, ctx: TenantContext) {
  const data = createTaskSchema.parse(input);
  if (data.projectId) {
    const p = await prisma.project.findFirst({ where: { id: data.projectId, tenantId: ctx.tenantId } });
    if (!p) throw ApiError.validation("projectId does not belong to this organization");
  }
  if (data.milestoneId) {
    const ms = await prisma.milestone.findFirst({ where: { id: data.milestoneId, tenantId: ctx.tenantId } });
    if (!ms) throw ApiError.validation("milestoneId does not belong to this organization");
  }
  if (data.assigneeId) {
    const m = await prisma.membership.findFirst({
      where: { userId: data.assigneeId, tenantId: ctx.tenantId, isActive: true },
    });
    if (!m) throw ApiError.validation("assigneeId is not an active member of this organization");
  }
  const task = await prisma.task.create({
    data: {
      tenantId: ctx.tenantId,
      projectId: data.projectId,
      milestoneId: data.milestoneId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      assigneeId: data.assigneeId,
      dueAt: data.dueAt,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "projects.task.create",
    entityType: "Task",
    entityId: task.id,
    summary: `Task '${task.title}' created`,
  });
  return task;
}

export async function updateTaskStatus(taskId: string, input: unknown, ctx: TenantContext) {
  const data = updateTaskStatusSchema.parse(input);
  const task = await prisma.task.findFirst({ where: { id: taskId, tenantId: ctx.tenantId } });
  if (!task) throw ApiError.notFound("Task not found");
  if (!TASK_EDGES[task.status].includes(data.status)) {
    throw ApiError.validation(`Illegal task transition: ${task.status} -> ${data.status}`);
  }
  // Only managers+ may mark a task DONE (review approval boundary).
  if (data.status === "DONE" && !ctx.permissions.has("crm.delete")) {
    throw ApiError.forbidden("Only managers or admins can complete tasks");
  }
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status: data.status, completedAt: data.status === "DONE" ? new Date() : task.completedAt },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "projects.task.status_change",
    entityType: "Task",
    entityId: task.id,
    summary: `Task '${task.title}': ${task.status} -> ${data.status}`,
  });
  return updated;
}

// ---------------------------------------------------------------------------
// Approvals — self-approval is prohibited for finance/workforce decisions.
// ---------------------------------------------------------------------------

export async function requestApproval(
  args: { entityType: ApprovalEntityType; entityId: string; projectId?: string },
  ctx: TenantContext,
) {
  const approval = await prisma.approval.create({
    data: {
      tenantId: ctx.tenantId,
      entityType: args.entityType,
      entityId: args.entityId,
      projectId: args.projectId,
      requestedByUserId: ctx.user.id,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "workflow.approval.request",
    entityType: "Approval",
    entityId: approval.id,
    summary: `Approval requested for ${args.entityType} ${args.entityId}`,
  });
  return approval;
}

export async function decideApproval(approvalId: string, input: unknown, ctx: TenantContext) {
  const data = decideApprovalSchema.parse(input);
  const approval = await prisma.approval.findFirst({
    where: { id: approvalId, tenantId: ctx.tenantId },
  });
  if (!approval) throw ApiError.notFound("Approval not found");
  if (approval.status !== "PENDING") throw ApiError.conflict(`Approval already ${approval.status}`);
  // Business invariant: a requester cannot approve their own request.
  if (approval.requestedByUserId === ctx.user.id) {
    throw ApiError.forbidden("You cannot decide on your own approval request");
  }
  // Only holders of the relevant approve permission may decide.
  const needsFinance = approval.entityType.startsWith("finance.");
  const needsWorkforce = approval.entityType.startsWith("workforce.");
  if (needsFinance && !ctx.permissions.has("finance.approve")) {
    throw ApiError.forbidden("Missing permission: finance.approve");
  }
  if (needsWorkforce && !ctx.permissions.has("workforce.approve")) {
    throw ApiError.forbidden("Missing permission: workforce.approve");
  }
  if (!needsFinance && !needsWorkforce && !ctx.permissions.has("finance.approve")) {
    throw ApiError.forbidden("Missing approval permission");
  }

  const updated = await prisma.approval.update({
    where: { id: approval.id },
    data: {
      status: data.decision,
      decidedByUserId: ctx.user.id,
      decidedAt: new Date(),
      comment: data.comment,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "workflow.approval.decide",
    entityType: "Approval",
    entityId: approval.id,
    severity: "CRITICAL",
    summary: `Approval for ${approval.entityType} ${approval.entityId}: ${data.decision}`,
  });
  return updated;
}

// ---------------------------------------------------------------------------
// Workforce — employees & leave. Salary data restricted to workforce.read+approve roles.
// ---------------------------------------------------------------------------

export async function createEmployee(input: unknown, ctx: TenantContext) {
  const data = createEmployeeSchema.parse(input);
  const dup = await prisma.employee.findFirst({
    where: { tenantId: ctx.tenantId, employeeCode: data.employeeCode },
  });
  if (dup) throw ApiError.conflict(`Employee code '${data.employeeCode}' already exists`);
  if (data.departmentId) {
    const d = await prisma.department.findFirst({ where: { id: data.departmentId, tenantId: ctx.tenantId } });
    if (!d) throw ApiError.validation("departmentId does not belong to this organization");
  }
  if (data.branchId) {
    const b = await prisma.branch.findFirst({ where: { id: data.branchId, tenantId: ctx.tenantId } });
    if (!b) throw ApiError.validation("branchId does not belong to this organization");
  }
  const employee = await prisma.employee.create({
    data: {
      tenantId: ctx.tenantId,
      employeeCode: data.employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      departmentId: data.departmentId,
      branchId: data.branchId,
      hireDate: data.hireDate,
      baseSalary: data.baseSalary !== undefined ? new Prisma.Decimal(data.baseSalary) : undefined,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "workforce.employee.create",
    entityType: "Employee",
    entityId: employee.id,
    severity: "WARNING",
    summary: `Employee ${employee.employeeCode} (${employee.firstName} ${employee.lastName}) added`,
  });
  // Never return salary in the general listing path; caller strips it at API layer.
  return employee;
}

export async function listEmployees(ctx: TenantContext, includeSensitive: boolean) {
  const rows = await prisma.employee.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { employeeCode: "asc" },
  });
  return rows.map((e) => ({
    id: e.id,
    employeeCode: e.employeeCode,
    firstName: e.firstName,
    lastName: e.lastName,
    jobTitle: e.jobTitle,
    status: e.status,
    ...(includeSensitive ? { email: e.email, phone: e.phone, baseSalary: e.baseSalary?.toString() ?? null } : {}),
  }));
}

export async function createLeaveRequest(input: unknown, ctx: TenantContext) {
  const data = createLeaveRequestSchema.parse(input);
  if (data.endDate.getTime() < data.startDate.getTime()) {
    throw ApiError.validation("Leave end date must be on or after start date");
  }
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, tenantId: ctx.tenantId },
  });
  if (!employee) throw ApiError.validation("employeeId does not belong to this organization");
  const leave = await prisma.leaveRequest.create({
    data: {
      tenantId: ctx.tenantId,
      employeeId: employee.id,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "workforce.leave.request",
    entityType: "LeaveRequest",
    entityId: leave.id,
    summary: `Leave (${data.type}) requested for ${employee.employeeCode}`,
  });
  return leave;
}

/** Decide leave; approver must hold workforce.approve and cannot approve own linked request. */
export async function decideLeave(leaveId: string, decision: "APPROVED" | "REJECTED", ctx: TenantContext) {
  if (!ctx.permissions.has("workforce.approve")) throw ApiError.forbidden("Missing permission: workforce.approve");
  const leave = await prisma.leaveRequest.findFirst({ where: { id: leaveId, tenantId: ctx.tenantId } });
  if (!leave) throw ApiError.notFound("Leave request not found");
  if (leave.status !== "PENDING") throw ApiError.conflict(`Leave already ${leave.status}`);
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.leaveRequest.update({
      where: { id: leave.id },
      data: { status: decision, decidedBy: ctx.user.id },
    });
    if (decision === "APPROVED") {
      await tx.employee.update({ where: { id: leave.employeeId }, data: { status: "ON_LEAVE" } });
    }
    return u;
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "workforce.leave.decide",
    entityType: "LeaveRequest",
    entityId: leave.id,
    severity: "WARNING",
    summary: `Leave ${decision.toLowerCase()} for employee ${leave.employeeId}`,
  });
  return updated;
}
