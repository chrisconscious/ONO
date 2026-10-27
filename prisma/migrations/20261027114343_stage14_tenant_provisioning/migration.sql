-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "provisioningStatus" TEXT NOT NULL DEFAULT 'PENDING_SETUP';
