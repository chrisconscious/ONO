/**
 * Unit tests for the RBAC permission model (no database required).
 * These lock down the approved role/permission matrix so accidental
 * privilege grants or removals fail the build.
 */
import { describe, expect, it } from "vitest";
import {
  permissionsForRole,
  roleAtLeast,
  roleHasPermission,
  type Permission,
} from "@/lib/permissions/rbac";

describe("RBAC role → permission matrix", () => {
  it("VIEWER can read but never write, approve, or manage", () => {
    const p = permissionsForRole("VIEWER");
    expect(p.has("crm.read")).toBe(true);
    expect(p.has("finance.read")).toBe(true);
    expect(p.has("analytics.read")).toBe(true);
    // Default-deny on every consequential capability:
    const forbidden: Permission[] = [
      "crm.write",
      "crm.delete",
      "sales.write",
      "finance.write",
      "finance.approve",
      "workforce.approve",
      "org.update",
      "org.members.manage",
      "integrations.manage",
      "aiinsights.review",
    ];
    for (const perm of forbidden) expect(p.has(perm)).toBe(false);
  });

  it("MEMBER can write business records but cannot delete or approve", () => {
    const p = permissionsForRole("MEMBER");
    expect(p.has("crm.write")).toBe(true);
    expect(p.has("finance.write")).toBe(true);
    expect(p.has("crm.delete")).toBe(false);
    expect(p.has("finance.approve")).toBe(false);
    expect(p.has("org.settings.manage")).toBe(false);
  });

  it("MANAGER adds delete/approve/review but not org administration", () => {
    const p = permissionsForRole("MANAGER");
    expect(p.has("crm.delete")).toBe(true);
    expect(p.has("finance.approve")).toBe(true);
    expect(p.has("workforce.approve")).toBe(true);
    expect(p.has("aiinsights.review")).toBe(true);
    expect(p.has("org.update")).toBe(false);
    expect(p.has("org.members.manage")).toBe(false);
    expect(p.has("integrations.manage")).toBe(false);
  });

  it("ADMIN has the full superset including org settings and integrations", () => {
    const p = permissionsForRole("ADMIN");
    expect(p.has("org.settings.manage")).toBe(true);
    expect(p.has("org.members.manage")).toBe(true);
    expect(p.has("integrations.manage")).toBe(true);
    expect(p.has("finance.approve")).toBe(true);
  });

  it("permission sets are monotonically increasing with seniority", () => {
    const viewer = [...permissionsForRole("VIEWER")];
    const member = permissionsForRole("MEMBER");
    const manager = permissionsForRole("MANAGER");
    const admin = permissionsForRole("ADMIN");
    for (const perm of viewer) {
      expect(member.has(perm)).toBe(true);
      expect(manager.has(perm)).toBe(true);
      expect(admin.has(perm)).toBe(true);
    }
    for (const perm of member) expect(manager.has(perm)).toBe(true);
    for (const perm of manager) expect(admin.has(perm)).toBe(true);
  });

  it("roleAtLeast implements rank comparison correctly", () => {
    expect(roleAtLeast("ADMIN", "MANAGER")).toBe(true);
    expect(roleAtLeast("MANAGER", "MANAGER")).toBe(true);
    expect(roleAtLeast("MEMBER", "MANAGER")).toBe(false);
    expect(roleAtLeast("VIEWER", "ADMIN")).toBe(false);
  });

  it("roleHasPermission matches the set lookup", () => {
    expect(roleHasPermission("MANAGER", "finance.approve")).toBe(true);
    expect(roleHasPermission("MEMBER", "finance.approve")).toBe(false);
  });
});
