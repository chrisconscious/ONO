-- Stage 17: make idempotency_records.tenantId nullable.
-- Organization provisioning must claim an idempotency key BEFORE the tenant
-- row exists (the create happens inside the same transaction). With a NOT NULL
-- FK, first-time provisioning always failed with a foreign-key violation.
-- The column is backfilled to the real tenant id when provisioning commits,
-- so referential integrity for completed records is preserved.
ALTER TABLE "idempotency_records" ALTER COLUMN "tenantId" DROP NOT NULL;
