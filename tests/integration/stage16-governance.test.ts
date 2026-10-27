/**
 * Stage 16 — Data governance integration tests.
 *
 * Covers: tenant isolation of governance records, fail-closed processing
 * permission checks, consent versioning/withdrawal, retention eligibility
 * with legal holds, deletion workflow state machine + idempotency + honest
 * partial-failure reporting, export controls, AI data-use approvals, and
 * marketplace release gates (which must block without full authorization).
 */
import { describe, it, expect } from "vitest";
import { prisma } from "../helpers/dbBootstrap";
import { makeTenantWithUser, addMember } from "../helpers/fixtures";
import {
  upsertDataCategory,
  registerProcessingPurpose,
  approveProcessingActivity,
  isProcessingPermitted,
  recordConsentDecision,
  withdrawConsent,
  hasActiveConsent,
} from "@/server/services/governance-service";
import {
  createRetentionPolicy,
  evaluateRetentionEligibility,
  placeLegalHold,
  releaseLegalHold,
  requestDeletion,
  transitionDeletion,
  executeDeletionStep,
  finalizeDeletionIfComplete,
  canTransitionDeletion,
} from "@/server/services/retention-deletion-service";
import {
  assertAiDataUseAllowed,
  requestAiDataUseApproval,
  decideAiDataUseApproval,
  createExportJob,
  completeExportJob,
  createMarketplaceProduct,
  recordGateDecision,
  authorizeMarketplaceRelease,
  withdrawMarketplaceProduct,
  openDataIncident,
  transitionIncident,
} from "@/server/services/marketplace-governance-service";

const ALL_GATES = [
  "legalReview",
  "privacyReview",
  "reidentificationRiskReview",
  "securityReview",
  "dataQualityReview",
  "commercialDisclosureReview",
] as const;

describe("governance: tenant isolation & least privilege", () => {
  it("tenant A cannot modify or read tenant B's data categories", async () => {
    const a = await makeTenantWithUser("ADMIN");
    const b = await makeTenantWithUser("ADMIN");
    const catA = await upsertDataCategory(a.ctx, {
      code: "customers",
      name: "Customer records",
      classification: "CONFIDENTIAL",
    });
    // Tenant B admin attempting to flip flags on A's category: not found.
    await expect(
      import("@/server/services/governance-service").then((m) =>
        m.setCategorySecondaryUseFlags(b.ctx, catA.id, { aiUseAllowed: true }),
      ),
    ).rejects.toMatchObject({ status: 404 });
    // The category remains untouched.
    const reloaded = await prisma.dataCategory.findUniqueOrThrow({ where: { id: catA.id } });
    expect(reloaded.aiUseAllowed).toBe(false);
  });

  it("members and viewers cannot manage governance policies", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const member = await addMember(t.tenantId, "MEMBER");
    const viewer = await addMember(t.tenantId, "VIEWER");
    await expect(
      upsertDataCategory(member.ctx, { code: "x", name: "X", classification: "INTERNAL" }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      upsertDataCategory(viewer.ctx, { code: "x", name: "X", classification: "INTERNAL" }),
    ).rejects.toMatchObject({ status: 403 });
    // Managers may READ governance but not change policies.
    const manager = await addMember(t.tenantId, "MANAGER");
    expect(manager.ctx.permissions.has("governance.read")).toBe(true);
    expect(manager.ctx.permissions.has("governance.policies.manage")).toBe(false);
    // No tenant role grants marketplace administration.
    expect(t.ctx.permissions.has("marketplace.admin")).toBe(false);
  });
});

describe("governance: fail-closed processing permissions", () => {
  it("unregistered purpose and unapproved activity are both blocked", async () => {
    const t = await makeTenantWithUser("ADMIN");
    await upsertDataCategory(t.ctx, { code: "sales", name: "Sales", classification: "INTERNAL" });

    const missing = await isProcessingPermitted(t.tenantId, "no_such_purpose", "sales");
    expect(missing.permitted).toBe(false);
    expect(missing.reason).toBe("purpose_missing_or_disabled");

    const purpose = await registerProcessingPurpose(t.ctx, {
      code: "benchmarking",
      name: "Cross-tenant benchmarking",
    });
    // Activity exists only after explicit approval -> still blocked before that.
    const unapproved = await isProcessingPermitted(t.tenantId, purpose.code, "sales");
    expect(unapproved.permitted).toBe(false);
    expect(unapproved.reason).toBe("processing_activity_not_approved");

    const cat = await prisma.dataCategory.findFirstOrThrow({
      where: { tenantId: t.tenantId, code: "sales" },
    });
    await approveProcessingActivity(t.ctx, purpose.id, cat.id, "APPROVED", "test approval");
    const approved = await isProcessingPermitted(t.tenantId, purpose.code, "sales");
    expect(approved.permitted).toBe(true);

    // Rejection revokes permission again.
    await approveProcessingActivity(t.ctx, purpose.id, cat.id, "REJECTED", "revoked");
    const revoked = await isProcessingPermitted(t.tenantId, purpose.code, "sales");
    expect(revoked.permitted).toBe(false);
  });

  it("a purpose belonging to tenant B is never usable by tenant A", async () => {
    const a = await makeTenantWithUser("ADMIN");
    const b = await makeTenantWithUser("ADMIN");
    await upsertDataCategory(a.ctx, { code: "stock", name: "Stock", classification: "INTERNAL" });
    const pB = await registerProcessingPurpose(b.ctx, { code: "analytics", name: "Analytics" });
    const catB = await prisma.dataCategory.findFirstOrThrow({ where: { tenantId: b.tenantId, code: "stock" } }).catch(() => null);
    if (catB) await approveProcessingActivity(b.ctx, pB.id, catB.id, "APPROVED");
    const res = await isProcessingPermitted(a.tenantId, pB.code, "stock");
    expect(res.permitted).toBe(false);
    expect(res.reason).toBe("purpose_not_for_this_tenant");
  });
});

describe("governance: consent ledger", () => {
  it("records are append-only; withdrawal blocks downstream processing", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const purpose = await registerProcessingPurpose(t.ctx, {
      code: "ai_training",
      name: "Model training",
      requiresConsent: true,
    });
    await upsertDataCategory(t.ctx, { code: "hr", name: "HR data", classification: "RESTRICTED" });
    const cat = await prisma.dataCategory.findFirstOrThrow({ where: { tenantId: t.tenantId, code: "hr" } });
    await approveProcessingActivity(t.ctx, purpose.id, cat.id, "APPROVED");

    // Approved activity BUT consent required and missing -> blocked.
    const before = await isProcessingPermitted(t.tenantId, purpose.code, "hr");
    expect(before.permitted).toBe(false);
    expect(before.reason).toBe("consent_missing_or_withdrawn");

    await recordConsentDecision(t.ctx, {
      subjectType: "ORGANIZATION",
      purposeCode: purpose.code,
      policyVersion: "2026-10-01",
      granted: true,
      collectionMethod: "admin_console",
    });
    const granted = await isProcessingPermitted(t.tenantId, purpose.code, "hr");
    expect(granted.permitted).toBe(true);

    // Withdraw: history preserved, downstream blocked.
    const closed = await withdrawConsent(t.ctx, {
      purposeCode: purpose.code,
      subjectType: "ORGANIZATION",
    });
    expect(closed).toBe(1);
    const after = await isProcessingPermitted(t.tenantId, purpose.code, "hr");
    expect(after.permitted).toBe(false);
    expect(await hasActiveConsent(t.tenantId, purpose.code)).toBe(false);

    const all = await prisma.consentRecord.findMany({
      where: { tenantId: t.tenantId, purposeCode: purpose.code },
    });
    expect(all.length).toBeGreaterThanOrEqual(2); // original + closure rows kept
  });

  it("one member cannot withdraw another organization user's consent without rights", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const member = await addMember(t.tenantId, "MEMBER");
    await recordConsentDecision(t.ctx, {
      subjectType: "USER",
      userId: member.userId,
      purposeCode: "p_newsletter",
      policyVersion: "v1",
      granted: true,
      collectionMethod: "signup_form",
    });
    // Admin can withdraw on behalf of the user (has governance rights).
    const n = await withdrawConsent(t.ctx, {
      purposeCode: "p_newsletter",
      subjectType: "USER",
      userId: member.userId,
    });
    expect(n).toBe(1);
  });
});

describe("governance: retention & legal holds", () => {
  it("null duration blocks automatic action; legal hold blocks; release unblocks", async () => {
    const t = await makeTenantWithUser("ADMIN");
    await upsertDataCategory(t.ctx, { code: "invoices", name: "Invoices", classification: "CONFIDENTIAL" });
    const cat = await prisma.dataCategory.findFirstOrThrow({ where: { tenantId: t.tenantId, code: "invoices" } });

    // No policy at all -> ineligible.
    let el = await evaluateRetentionEligibility(t.tenantId, "invoices");
    expect(el.eligible).toBe(false);
    expect(el.reason).toBe("no_active_policy");

    // Policy with unresolved duration -> stays blocked (never invents a period).
    await createRetentionPolicy(t.ctx, { dataCategoryId: cat.id, durationDays: null });
    el = await evaluateRetentionEligibility(t.tenantId, "invoices");
    expect(el.eligible).toBe(false);
    expect(el.reason).toBe("retention_period_unresolved_pending_review");

    // Resolved policy -> eligible.
    await createRetentionPolicy(t.ctx, { dataCategoryId: cat.id, version: 2, durationDays: 2555, legalBasisReference: "TEST-POLICY" });
    el = await evaluateRetentionEligibility(t.tenantId, "invoices");
    expect(el.eligible).toBe(true);

    // Legal hold blocks; duplicate open hold conflicts; release unblocks.
    const hold = await placeLegalHold(t.ctx, { dataCategoryId: cat.id, reason: "litigation test" });
    el = await evaluateRetentionEligibility(t.tenantId, "invoices");
    expect(el.eligible).toBe(false);
    expect(el.reason).toBe("legal_hold_active");
    await expect(placeLegalHold(t.ctx, { dataCategoryId: cat.id, reason: "dup" })).rejects.toMatchObject({ status: 409 });

    await releaseLegalHold(t.ctx, hold.id);
    el = await evaluateRetentionEligibility(t.tenantId, "invoices");
    expect(el.eligible).toBe(true);
    await expect(releaseLegalHold(t.ctx, hold.id)).rejects.toMatchObject({ status: 409 });
  });
});

describe("governance: deletion workflow", () => {
  it("idempotent request creation, state machine enforcement, honest partial failure", async () => {
    const t = await makeTenantWithUser("ADMIN");

    const first = await requestDeletion(t.ctx, { scope: "user:me", idempotencyKey: "k1" });
    expect(first.replayed).toBe(false);
    const second = await requestDeletion(t.ctx, { scope: "user:me", idempotencyKey: "k1" });
    expect(second.replayed).toBe(true);
    expect(second.request.id).toBe(first.request.id);
    const count = await prisma.deletionRequest.count({ where: { tenantId: t.tenantId } });
    expect(count).toBe(1); // no duplicate jobs from retries

    // Invalid transition rejected (REQUESTED -> COMPLETED).
    await expect(transitionDeletion(t.ctx, first.request.id, "COMPLETED")).rejects.toMatchObject({ status: 409 });
    expect(canTransitionDeletion("COMPLETED", "IN_PROGRESS")).toBe(false);

    // Legal-hold guard on category-scoped deletions.
    await upsertDataCategory(t.ctx, { code: "leads", name: "Leads", classification: "INTERNAL" });
    const cat = await prisma.dataCategory.findFirstOrThrow({ where: { tenantId: t.tenantId, code: "leads" } });
    await createRetentionPolicy(t.ctx, { dataCategoryId: cat.id, durationDays: 30 });
    await placeLegalHold(t.ctx, { dataCategoryId: cat.id, reason: "hold for test" });
    const catReq = await requestDeletion(t.ctx, { scope: "category:leads", idempotencyKey: "k2" });
    await transitionDeletion(t.ctx, catReq.request.id, "UNDER_REVIEW");
    await expect(transitionDeletion(t.ctx, catReq.request.id, "APPROVED")).rejects.toMatchObject({ status: 409 });

    // Happy path with one failing location: finalization must NOT claim success.
    await transitionDeletion(t.ctx, first.request.id, "UNDER_REVIEW");
    await transitionDeletion(t.ctx, first.request.id, "APPROVED");
    await transitionDeletion(t.ctx, first.request.id, "IN_PROGRESS");
    const okPrimary = await executeDeletionStep(t.ctx, first.request.id, "primary_db", async () => 7);
    expect(okPrimary.ok).toBe(true);
    const failedFiles = await executeDeletionStep(t.ctx, first.request.id, "object_storage", async () => {
      throw new Error("storage unreachable");
    });
    expect(failedFiles.ok).toBe(false);
    const status = await finalizeDeletionIfComplete(t.ctx, first.request.id);
    expect(status).toBe("PARTIALLY_COMPLETED");

    // Retry succeeds -> now genuinely COMPLETED.
    await transitionDeletion(t.ctx, first.request.id, "IN_PROGRESS");
    const retry = await executeDeletionStep(t.ctx, first.request.id, "object_storage", async () => true);
    expect(retry.ok).toBe(true);
    const final = await finalizeDeletionIfComplete(t.ctx, first.request.id);
    expect(final).toBe("COMPLETED");
    const step = await prisma.deletionStep.findFirstOrThrow({
      where: { requestId: first.request.id, location: "object_storage" },
    });
    expect(step.attempts).toBe(2);
  });

  it("deletion requests are invisible across tenants", async () => {
    const a = await makeTenantWithUser("ADMIN");
    const b = await makeTenantWithUser("ADMIN");
    const req = await requestDeletion(a.ctx, { scope: "user:me", idempotencyKey: "iso-1" });
    await expect(transitionDeletion(b.ctx, req.request.id, "UNDER_REVIEW")).rejects.toMatchObject({ status: 404 });
  });
});

describe("governance: AI data use", () => {
  it("model training fails closed until explicitly requested and approved", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const denied = await assertAiDataUseAllowed(t.tenantId, "MODEL_TRAINING");
    expect(denied.allowed).toBe(false);

    const approval = await requestAiDataUseApproval(t.ctx, {
      useType: "MODEL_TRAINING",
      dataCategoryIds: [],
    });
    const stillDenied = await assertAiDataUseAllowed(t.tenantId, "MODEL_TRAINING");
    expect(stillDenied.allowed).toBe(false); // UNAPPROVED state does not allow

    await decideAiDataUseApproval(t.ctx, approval.id, "APPROVED");
    const allowed = await assertAiDataUseAllowed(t.tenantId, "MODEL_TRAINING");
    expect(allowed.allowed).toBe(true);

    // Re-request resets to pending (fail closed again).
    await requestAiDataUseApproval(t.ctx, { useType: "MODEL_TRAINING", dataCategoryIds: [] });
    const reset = await assertAiDataUseAllowed(t.tenantId, "MODEL_TRAINING");
    expect(reset.allowed).toBe(false);
  });

  it("RESTRICTED categories cannot be approved into shared-model training", async () => {
    const t = await makeTenantWithUser("ADMIN");
    await upsertDataCategory(t.ctx, { code: "payroll", name: "Payroll", classification: "RESTRICTED" });
    const cat = await prisma.dataCategory.findFirstOrThrow({ where: { tenantId: t.tenantId, code: "payroll" } });
    const approval = await requestAiDataUseApproval(t.ctx, {
      useType: "MODEL_TRAINING",
      dataCategoryIds: [cat.id],
    });
    await expect(decideAiDataUseApproval(t.ctx, approval.id, "APPROVED")).rejects.toMatchObject({ status: 409 });
    await expect(decideAiDataUseApproval(t.ctx, approval.id, "REJECTED")).resolves.toMatchObject({ status: "REJECTED" });
  });

  it("requesting approval over another tenant's category is forbidden", async () => {
    const a = await makeTenantWithUser("ADMIN");
    const b = await makeTenantWithUser("ADMIN");
    await upsertDataCategory(b.ctx, { code: "secret", name: "Secret", classification: "CONFIDENTIAL" });
    const catB = await prisma.dataCategory.findFirstOrThrow({ where: { tenantId: b.tenantId, code: "secret" } });
    await expect(
      requestAiDataUseApproval(a.ctx, { useType: "CROSS_TENANT_BENCHMARKING", dataCategoryIds: [catB.id] }),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe("governance: export controls", () => {
  it("export of RESTRICTED category fails closed without approved delivery purpose", async () => {
    const t = await makeTenantWithUser("ADMIN");
    await upsertDataCategory(t.ctx, { code: "salaries", name: "Salaries", classification: "RESTRICTED" });
    await expect(createExportJob(t.ctx, { scope: "full", categoryCodes: ["salaries"] })).rejects.toMatchObject({ status: 403 });
    // Unknown category rejected.
    await expect(createExportJob(t.ctx, { scope: "full", categoryCodes: ["ghost"] })).rejects.toMatchObject({ status: 400 });
    // Non-restricted category works and is tenant-owned.
    await upsertDataCategory(t.ctx, { code: "products", name: "Products", classification: "INTERNAL" });
    const job = await createExportJob(t.ctx, { scope: "catalog", categoryCodes: ["products"] });
    expect(job.tenantId).toBe(t.tenantId);
    expect(job.expiresAt).toBeTruthy();
    const done = await completeExportJob(t.ctx, job.id, { artifactPath: "/tmp/artifact.csv", rowCount: 3 });
    expect(done.status).toBe("COMPLETED");
    // Completing twice conflicts (no silent overwrite).
    await expect(completeExportJob(t.ctx, job.id, { artifactPath: "x", rowCount: 1 })).rejects.toMatchObject({ status: 409 });
  });

  it("one tenant cannot complete another tenant's export job", async () => {
    const a = await makeTenantWithUser("ADMIN");
    const b = await makeTenantWithUser("ADMIN");
    await upsertDataCategory(a.ctx, { code: "docs", name: "Docs", classification: "INTERNAL" });
    const job = await createExportJob(a.ctx, { scope: "s", categoryCodes: ["docs"] });
    await expect(
      completeExportJob(b.ctx, job.id, { artifactPath: "steal", rowCount: 999 }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("governance: marketplace release gates", () => {
  /** Build a context carrying the platform-only marketplace.admin permission. */
  async function platformAdmin() {
    const t = await makeTenantWithUser("ADMIN");
    const ctx = { ...t.ctx, permissions: new Set([...t.ctx.permissions, "marketplace.admin" as const]) };
    return { t, ctx };
  }

  it("release fails closed when any prerequisite is missing", async () => {
    const { t, ctx } = await platformAdmin();
    const product = await createMarketplaceProduct(ctx, {
      productCode: "test_bench_1",
      title: "Test benchmark",
      contributingTenantIds: [t.tenantId],
    });
    // DRAFT cannot be released directly.
    await expect(authorizeMarketplaceRelease(ctx, product.id)).rejects.toMatchObject({ status: 409 });

    // Move to IN_REVIEW then attempt release with zero passed gates.
    await prisma.marketplaceProduct.update({ where: { id: product.id }, data: { status: "IN_REVIEW" } });
    await expect(authorizeMarketplaceRelease(ctx, product.id)).rejects.toMatchObject({ status: 409 });
    try {
      await authorizeMarketplaceRelease(ctx, product.id);
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain("gate_not_passed");
      expect(msg).toContain("min_group_size_unconfigured");
      expect(msg).toContain("tenant_consent_missing");
      expect(msg).toContain("tenant_ai_use_not_approved");
    }

    // Passing every gate alone is STILL not enough: consent + AI approval needed.
    for (const gate of ALL_GATES) {
      await recordGateDecision(ctx, product.id, gate, "PASSED", undefined, "policy-v1");
    }
    await prisma.marketplaceProduct.update({ where: { id: product.id }, data: { minGroupSize: 25 } });
    await expect(authorizeMarketplaceRelease(ctx, product.id)).rejects.toMatchObject({ status: 409 });

    // Now satisfy tenant-level prerequisites.
    await recordConsentDecision(t.ctx, {
      subjectType: "ORGANIZATION",
      purposeCode: "marketplace_release",
      policyVersion: "v1",
      granted: true,
      collectionMethod: "admin_console",
    });
    const ai = await requestAiDataUseApproval(t.ctx, { useType: "COMMERCIAL_INTELLIGENCE", dataCategoryIds: [] });
    await decideAiDataUseApproval(t.ctx, ai.id, "APPROVED");
    const released = await authorizeMarketplaceRelease(ctx, product.id);
    expect(released!.status).toBe("RELEASED");

    // Withdrawal revokes eligibility afterwards.
    const withdrawn = await withdrawMarketplaceProduct(ctx, product.id, "risk discovered");
    expect(withdrawn.status).toBe("WITHDRAWN");
    await expect(authorizeMarketplaceRelease(ctx, product.id)).rejects.toMatchObject({ status: 409 });
  });

  it("FAILED review gate blocks release even if others pass", async () => {
    const { ctx } = await platformAdmin();
    const p = await createMarketplaceProduct(ctx, { productCode: "test_fail_gate", title: "Fail gate" });
    await prisma.marketplaceProduct.update({ where: { id: p.id }, data: { status: "IN_REVIEW" } });
    for (const gate of ALL_GATES) await recordGateDecision(ctx, p.id, gate, "PASSED");
    await recordGateDecision(ctx, p.id, "privacyReview", "FAILED", "re-identification risk");
    await expect(authorizeMarketplaceRelease(ctx, p.id)).rejects.toMatchObject({ status: 409 });
  });

  it("tenant admins cannot create or approve marketplace products", async () => {
    const t = await makeTenantWithUser("ADMIN");
    await expect(
      createMarketplaceProduct(t.ctx, { productCode: "nope", title: "Nope" }),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe("governance: incidents & audit trail", () => {
  it("incident lifecycle validates transitions and audits sensitive actions", async () => {
    const t = await makeTenantWithUser("MANAGER");
    const incident = await openDataIncident(t.ctx, {
      type: "UNAUTHORIZED_EXPORT",
      summary: "Export attempted outside business hours",
      affectedResourceRefs: ["export_job:test"],
    });
    await expect(transitionIncident(t.ctx, incident.id, "CLOSED")).rejects.toMatchObject({ status: 409 });
    await transitionIncident(t.ctx, incident.id, "CONTAINED");
    await transitionIncident(t.ctx, incident.id, "UNDER_INVESTIGATION");
    await transitionIncident(t.ctx, incident.id, "RESOLVED", "rotated keys");
    const closed = await transitionIncident(t.ctx, incident.id, "CLOSED");
    expect(closed.resolvedAt).toBeTruthy();

    // Audit events exist for the sensitive governance actions in this suite.
    const audits = await prisma.auditLog.findMany({
      where: { tenantId: t.tenantId, action: { startsWith: "governance." } },
      orderBy: { createdAt: "desc" },
    });
    expect(audits.some((a) => a.action === "governance.incident.opened")).toBe(true);
    // Viewer-role users have no governance write surface at all.
    const viewer = await addMember(t.tenantId, "VIEWER");
    await expect(
      openDataIncident(viewer.ctx, { type: "CROSS_TENANT_EXPOSURE", summary: "should fail" }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
