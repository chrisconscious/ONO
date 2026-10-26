/*
  Warnings:

  - Changed the type of `entityType` on the `approvals` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ApprovalEntityType" AS ENUM ('FINANCE_EXPENSE', 'FINANCE_INVOICE_ADJUSTMENT', 'FINANCE_BUDGET_CHANGE', 'SALES_DISCOUNT', 'PROCUREMENT_PURCHASE_REQUEST', 'PROJECT_SCOPE_CHANGE', 'WORKFORCE_LEAVE', 'DATA_EXPORT', 'AUTOMATION_HIGH_IMPACT', 'AI_RECOMMENDATION');

-- CreateEnum
CREATE TYPE "WorkflowTriggerEvent" AS ENUM ('LEAD_CREATED', 'LEAD_QUALIFIED', 'OPPORTUNITY_STAGE_CHANGED', 'ORDER_CONFIRMED', 'STOCK_REORDER_ALERT', 'INVOICE_ISSUED', 'APPROVAL_DECIDED');

-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('CREATE_FOLLOWUP', 'NOTIFY', 'ASSIGN_TASK');

-- CreateEnum
CREATE TYPE "HandoverKind" AS ENUM ('ORDER_DELIVERY', 'ORDER_PROJECT', 'ORDER_INVOICE', 'OPPORTUNITY_PROJECT');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "InsightSourceType" AS ENUM ('RULE_ENGINE', 'MANUAL', 'EXTERNAL_MODEL');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "WorkflowRunStatus" AS ENUM ('COMPLETED', 'FAILED', 'SKIPPED_DUPLICATE', 'SKIPPED_LOOP_GUARD');

-- AlterTable
ALTER TABLE "ai_insights" ADD COLUMN     "sourceType" "InsightSourceType" NOT NULL DEFAULT 'RULE_ENGINE';

-- AlterTable
ALTER TABLE "approvals" ADD COLUMN     "thresholdAmount" DECIMAL(14,2),
DROP COLUMN "entityType",
ADD COLUMN     "entityType" "ApprovalEntityType" NOT NULL;

-- CreateTable
CREATE TABLE "approval_steps" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "requiredRole" "MemberRole" NOT NULL,
    "requiredPermission" TEXT NOT NULL,
    "assigneeUserId" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "decidedByUserId" TEXT,
    "comment" TEXT,
    "dueAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerEvent" "WorkflowTriggerEvent" NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "actionType" "AutomationActionType" NOT NULL,
    "actionParams" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHighImpact" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_runs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleVersion" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "WorkflowRunStatus" NOT NULL,
    "detail" TEXT,
    "createdEntityIds" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handovers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "HandoverKind" NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'NEW',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "contactId" TEXT,
    "companyId" TEXT,
    "assigneeId" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "reopenedCount" INTEGER NOT NULL DEFAULT 0,
    "csatScore" INTEGER,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_steps_tenantId_status_idx" ON "approval_steps"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "approval_steps_approvalId_stepOrder_key" ON "approval_steps"("approvalId", "stepOrder");

-- CreateIndex
CREATE INDEX "workflow_rules_tenantId_triggerEvent_isActive_idx" ON "workflow_rules"("tenantId", "triggerEvent", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_rules_tenantId_name_key" ON "workflow_rules"("tenantId", "name");

-- CreateIndex
CREATE INDEX "workflow_runs_tenantId_startedAt_idx" ON "workflow_runs"("tenantId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_runs_ruleId_eventId_key" ON "workflow_runs"("ruleId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "handovers_idempotencyKey_key" ON "handovers"("idempotencyKey");

-- CreateIndex
CREATE INDEX "handovers_tenantId_kind_idx" ON "handovers"("tenantId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "handovers_tenantId_kind_sourceId_key" ON "handovers"("tenantId", "kind", "sourceId");

-- CreateIndex
CREATE INDEX "support_tickets_tenantId_status_idx" ON "support_tickets"("tenantId", "status");

-- CreateIndex
CREATE INDEX "support_tickets_tenantId_assigneeId_idx" ON "support_tickets"("tenantId", "assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_tenantId_number_key" ON "support_tickets"("tenantId", "number");

-- CreateIndex
CREATE INDEX "approvals_tenantId_status_entityType_idx" ON "approvals"("tenantId", "status", "entityType");

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_rules" ADD CONSTRAINT "workflow_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "workflow_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
