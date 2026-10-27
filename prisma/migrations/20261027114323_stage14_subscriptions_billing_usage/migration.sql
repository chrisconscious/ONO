/*
  Warnings:

  - Added the required column `updatedAt` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "BillingInvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "UsageMetric" AS ENUM ('ACTIVE_USERS', 'API_REQUESTS', 'AI_INFERENCES', 'AUTOMATION_RUNS', 'STORAGE_BYTES');

-- CreateEnum
CREATE TYPE "PaymentEventKind" AS ENUM ('PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_CANCELLED', 'REFUND_ISSUED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING_ACTIVATION';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'GRACE_PERIOD';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'RESTRICTED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'SUSPENDED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'TERMINATED';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "plan_definitions" (
    "id" TEXT NOT NULL,
    "code" "SubscriptionPlan" NOT NULL,
    "name" TEXT NOT NULL,
    "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'MONTHLY',
    "priceMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "maxSeats" INTEGER,
    "maxBranches" INTEGER,
    "includedModules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "apiLimitPerDay" INTEGER,
    "aiLimitPerDay" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_invoices" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "taxMinor" INTEGER NOT NULL DEFAULT 0,
    "totalMinor" INTEGER NOT NULL,
    "status" "BillingInvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "providerRef" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" TEXT NOT NULL,
    "billingInvoiceId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'stub',
    "providerRef" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "failureReason" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_event_logs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "kind" "PaymentEventKind" NOT NULL,
    "payloadSummary" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "metric" "UsageMetric" NOT NULL,
    "window" TEXT NOT NULL,
    "value" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_definitions_code_key" ON "plan_definitions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoices_number_key" ON "billing_invoices"("number");

-- CreateIndex
CREATE INDEX "billing_invoices_subscriptionId_status_idx" ON "billing_invoices"("subscriptionId", "status");

-- CreateIndex
CREATE INDEX "payment_attempts_subscriptionId_idx" ON "payment_attempts"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_provider_providerRef_key" ON "payment_attempts"("provider", "providerRef");

-- CreateIndex
CREATE INDEX "payment_event_logs_processed_receivedAt_idx" ON "payment_event_logs"("processed", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_event_logs_provider_providerEventId_key" ON "payment_event_logs"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX "usage_records_tenantId_metric_idx" ON "usage_records"("tenantId", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_tenantId_metric_window_key" ON "usage_records"("tenantId", "metric", "window");

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_billingInvoiceId_fkey" FOREIGN KEY ("billingInvoiceId") REFERENCES "billing_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
