-- Stage 16: Data governance, privacy controls, retention, consent, and
-- future data-marketplace safeguards.
-- All statements are additive (CREATE TYPE / CREATE TABLE / indexes). No
-- existing tables or columns are modified, so the migration is safe to apply
-- to databases that already contain operational data.

-- ============================ ENUMS ============================

-- Sensitivity classification for governed data categories.
CREATE TYPE "DataClassification" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

-- Lifecycle status of a processing purpose record.
CREATE TYPE "PurposeStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- Approval state of an individual processing activity within a purpose.
-- Everything starts UNAPPROVED; unapproved activities must fail closed.
CREATE TYPE "ProcessingApprovalState" AS ENUM ('UNAPPROVED', 'APPROVED', 'REJECTED', 'BLOCKED');

-- Where a consent decision applies: a user's own personal data, or an
-- organization giving permission on behalf of its tenant-owned data.
CREATE TYPE "ConsentSubjectType" AS ENUM ('USER', 'ORGANIZATION');

CREATE TYPE "RetentionAction" AS ENUM ('DELETE', 'ANONYMIZE', 'ARCHIVE');

-- Explicit deletion-workflow states. A job only reaches COMPLETED after every
-- step verified success; partial work is reported as PARTIALLY_COMPLETED.
CREATE TYPE "DeletionRequestStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'BLOCKED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED', 'FAILED', 'NEEDS_INTERVENTION');

CREATE TYPE "ExportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- Marketplace candidate lifecycle. RELEASED can only be reached through the
-- full approval checklist enforced in the service layer (fail-closed).
CREATE TYPE "MarketplaceProductStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'RELEASED', 'WITHDRAWN', 'REJECTED');

CREATE TYPE "ReviewStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED');

CREATE TYPE "SharingArrangementStatus" AS ENUM ('PROPOSED', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

CREATE TYPE "DataIncidentType" AS ENUM ('CROSS_TENANT_EXPOSURE', 'UNAUTHORIZED_EXPORT', 'IMPROPER_SECONDARY_USE', 'UNAUTHORIZED_AI_PROCESSING', 'SUSPECTED_RE_IDENTIFICATION', 'UNAUTHORIZED_MARKETPLACE_RELEASE', 'FAILED_DELETION_DATA_ACCESSIBLE', 'UNAUTHORIZED_RESTRICTED_ACCESS');

CREATE TYPE "DataIncidentStatus" AS ENUM ('OPEN', 'CONTAINED', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED');

-- ============================ DATA CATALOG ============================

-- Extensible registry of governed data categories per tenant. Classification
-- drives downstream enforcement (exports, AI use, marketplace eligibility).
CREATE TABLE "data_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classification" "DataClassification" NOT NULL DEFAULT 'CONFIDENTIAL',
    "description" TEXT,
    "is_personal_data" BOOLEAN NOT NULL DEFAULT false,
    "ai_use_allowed" BOOLEAN NOT NULL DEFAULT false,
    "marketplace_eligible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "data_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "data_categories_tenant_id_code_key" ON "data_categories"("tenant_id", "code");
CREATE INDEX "data_categories_tenant_id_idx" ON "data_categories"("tenant_id");

-- ============================ PURPOSES ============================

-- Registry of processing purposes. Platform-wide purposes have no tenant.
-- Existence of a record is NOT proof of legal permission: each activity has
-- its own approval state and defaults to UNAPPROVED (fail closed).
CREATE TABLE "processing_purposes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "PurposeStatus" NOT NULL DEFAULT 'ACTIVE',
    "requires_consent" BOOLEAN NOT NULL DEFAULT false,
    "external_sharing_restricted" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_purposes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "processing_purposes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "processing_purposes_code_key" ON "processing_purposes"("code");
CREATE INDEX "processing_purposes_tenant_id_idx" ON "processing_purposes"("tenant_id");

-- One approved-or-not processing activity per (purpose, data category).
CREATE TABLE "processing_activities" (
    "id" TEXT NOT NULL,
    "purpose_id" TEXT NOT NULL,
    "data_category_id" TEXT NOT NULL,
    "state" "ProcessingApprovalState" NOT NULL DEFAULT 'UNAPPROVED',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "processing_activities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "processing_activities_purpose_id_fkey" FOREIGN KEY ("purpose_id") REFERENCES "processing_purposes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "processing_activities_data_category_id_fkey" FOREIGN KEY ("data_category_id") REFERENCES "data_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "processing_activities_purpose_id_data_category_id_key" ON "processing_activities"("purpose_id", "data_category_id");

-- ============================ CONSENT ============================

-- Append-only consent ledger. Decisions are versioned by recordedAt: new
-- decisions create new rows; withdrawal sets withdrawnAt on the ACTIVE row
-- without overwriting history. Evidence fields allow demonstrating the
-- recorded decision later.
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "subject_type" "ConsentSubjectType" NOT NULL,
    "purpose_code" TEXT NOT NULL,
    "policy_version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "collection_method" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMP(3),
    "evidence" TEXT,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "consent_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "consent_records_tenant_id_purpose_code_idx" ON "consent_records"("tenant_id", "purpose_code");
CREATE INDEX "consent_records_user_id_idx" ON "consent_records"("user_id");

-- ============================ RETENTION ============================

-- Retention policies per tenant and data category. durationDays is nullable
-- ON PURPOSE: an unresolved legal retention period must stay null and block
-- automatic action rather than defaulting to an invented value.
CREATE TABLE "retention_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "data_category_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "duration_days" INTEGER,
    "trigger_event" TEXT NOT NULL DEFAULT 'RECORD_CREATED',
    "action" "RetentionAction" NOT NULL DEFAULT 'DELETE',
    "legal_basis_reference" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "retention_policies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "retention_policies_data_category_id_fkey" FOREIGN KEY ("data_category_id") REFERENCES "data_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "retention_policies_tenant_id_data_category_id_version_key" ON "retention_policies"("tenant_id", "data_category_id", "version");
CREATE INDEX "retention_policies_tenant_id_idx" ON "retention_policies"("tenant_id");

-- Legal holds freeze retention actions for matching records. The partial
-- unique index guarantees at most one OPEN hold per (tenant, category).
CREATE TABLE "legal_holds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "data_category_id" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "reason" TEXT NOT NULL,
    "placed_by" TEXT NOT NULL,
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),
    "released_by" TEXT,

    CONSTRAINT "legal_holds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "legal_holds_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "legal_holds_data_category_id_fkey" FOREIGN KEY ("data_category_id") REFERENCES "data_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "legal_holds_open_category_key" ON "legal_holds"("tenant_id", "data_category_id") WHERE "released_at" IS NULL;
CREATE INDEX "legal_holds_tenant_id_idx" ON "legal_holds"("tenant_id");

-- ============================ DELETION WORKFLOWS ============================

CREATE TABLE "deletion_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "requested_by_membership_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "target_ref" TEXT,
    "status" "DeletionRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "idempotency_key" TEXT NOT NULL,
    "failure_reason" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "deletion_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "deletion_requests_requested_by_membership_id_fkey" FOREIGN KEY ("requested_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Database-level duplicate prevention: retries with the same idempotency key
-- can never create a second deletion job for the same tenant.
CREATE UNIQUE INDEX "deletion_requests_tenant_id_idempotency_key_key" ON "deletion_requests"("tenant_id", "idempotency_key");
CREATE INDEX "deletion_requests_tenant_id_status_idx" ON "deletion_requests"("tenant_id", "status");

-- Per-location execution steps so partial failures are visible and retryable.
CREATE TABLE "deletion_steps" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "DeletionRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "deletion_steps_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "deletion_steps_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "deletion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "deletion_steps_request_id_location_key" ON "deletion_steps"("request_id", "location");

-- ============================ EXPORT JOBS ============================

CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "requested_by_membership_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" "ExportJobStatus" NOT NULL DEFAULT 'PENDING',
    "artifact_path" TEXT,
    "row_count" INTEGER,
    "expires_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "export_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "export_jobs_requested_by_membership_id_fkey" FOREIGN KEY ("requested_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "export_jobs_tenant_id_status_idx" ON "export_jobs"("tenant_id", "status");

-- ============================ AI / ML DATA USE ============================

-- Explicit approval required before any tenant data may train shared models,
-- improve prompts, or feed cross-tenant benchmarking. Ordinary SaaS delivery
-- permission does NOT imply these approvals.
CREATE TABLE "ai_data_use_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "use_type" TEXT NOT NULL,
    "data_category_ids" JSONB NOT NULL DEFAULT '[]',
    "status" "ProcessingApprovalState" NOT NULL DEFAULT 'UNAPPROVED',
    "requested_by_membership_id" TEXT NOT NULL,
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_data_use_approvals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ai_data_use_approvals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_data_use_approvals_requested_by_membership_id_fkey" FOREIGN KEY ("requested_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ai_data_use_approvals_tenant_id_use_type_key" ON "ai_data_use_approvals"("tenant_id", "use_type");
CREATE INDEX "ai_data_use_approvals_tenant_id_idx" ON "ai_data_use_approvals"("tenant_id");

-- ============================ MARKETPLACE SAFEGUARDS ============================

-- Candidate data products. Release requires ALL review gates PASSED plus an
-- explicit release authorization; missing prerequisites fail closed.
CREATE TABLE "marketplace_products" (
    "id" TEXT NOT NULL,
    "product_code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "buyer_category" TEXT,
    "intended_use_case" TEXT,
    "aggregation_method" TEXT,
    "included_fields" JSONB NOT NULL DEFAULT '[]',
    "excluded_fields" JSONB NOT NULL DEFAULT '[]',
    "min_group_size" INTEGER,
    "lineage_refs" JSONB NOT NULL DEFAULT '[]',
    "contributing_tenant_ids" JSONB NOT NULL DEFAULT '[]',
    "purpose_codes" JSONB NOT NULL DEFAULT '[]',
    "legal_review" "ReviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "privacy_review" "ReviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "reidentification_risk_review" "ReviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "security_review" "ReviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "data_quality_review" "ReviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "commercial_disclosure_review" "ReviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "status" "MarketplaceProductStatus" NOT NULL DEFAULT 'DRAFT',
    "release_authorized_by" TEXT,
    "release_authorized_at" TIMESTAMP(3),
    "withdrawn_reason" TEXT,
    "reject_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketplace_products_product_code_version_key" ON "marketplace_products"("product_code", "version");
CREATE INDEX "marketplace_products_status_idx" ON "marketplace_products"("status");

-- Immutable audit trail of every approval decision on a candidate product.
CREATE TABLE "marketplace_approval_decisions" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "gate" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reviewer" TEXT NOT NULL,
    "policy_version" TEXT,
    "reason" TEXT,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_approval_decisions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "marketplace_approval_decisions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "marketplace_products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "marketplace_approval_decisions_product_id_idx" ON "marketplace_approval_decisions"("product_id");

-- ============================ THIRD-PARTY SHARING ============================

CREATE TABLE "data_sharing_arrangements" (
    "id" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "purpose_code" TEXT NOT NULL,
    "data_category_codes" JSONB NOT NULL DEFAULT '[]',
    "contractual_review_status" "ReviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "authorization_status" "ProcessingApprovalState" NOT NULL DEFAULT 'UNAPPROVED',
    "retention_restrictions" TEXT,
    "status" "SharingArrangementStatus" NOT NULL DEFAULT 'PROPOSED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_sharing_arrangements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "data_sharing_arrangements_purpose_code_fkey" FOREIGN KEY ("purpose_code") REFERENCES "processing_purposes"("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "data_sharing_arrangements_recipient_name_purpose_code_key" ON "data_sharing_arrangements"("recipient_name", "purpose_code");

-- ============================ INCIDENT RESPONSE ============================

CREATE TABLE "data_incidents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "type" "DataIncidentType" NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'WARNING',
    "status" "DataIncidentStatus" NOT NULL DEFAULT 'OPEN',
    "summary" TEXT NOT NULL,
    "affected_resource_refs" JSONB NOT NULL DEFAULT '[]',
    "containment_status" TEXT,
    "assigned_to_membership_id" TEXT,
    "opened_by" TEXT NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "remediation_notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_incidents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "data_incidents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "data_incidents_assigned_to_membership_id_fkey" FOREIGN KEY ("assigned_to_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "data_incidents_status_idx" ON "data_incidents"("status");
CREATE INDEX "data_incidents_tenant_id_idx" ON "data_incidents"("tenant_id");
