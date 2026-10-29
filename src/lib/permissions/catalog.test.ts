import { describe, expect, it } from "vitest";
import {
  PERMISSIONS,
  PERMISSION_MODULES,
  permissionMatrix,
} from "@/lib/permissions/catalog";

describe("permission catalogue", () => {
  it("contains unique, well-formed permission codes", () => {
    const codes = PERMISSIONS.map((permission) => permission.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(
        /^PERM-[A-Z]+\.(READ|CREATE|UPDATE|DELETE|APPROVE|ADJUST|SUBMIT|WITHDRAW)$/,
      );
    }
  });

  it("assigns every permission to a module", () => {
    expect(PERMISSION_MODULES.length).toBeGreaterThan(0);
    for (const permission of PERMISSIONS) {
      expect(permission.module.length).toBeGreaterThan(0);
      expect(permission.description.length).toBeGreaterThan(0);
    }
  });

  it("groups permissions by resource for the role editor", () => {
    const groups = permissionMatrix();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.reduce((total, group) => total + group.permissions.length, 0)).toBe(
      PERMISSIONS.length,
    );
    for (const group of groups) {
      expect(group.permissions.every((item) => item.resource === group.resource)).toBe(
        true,
      );
    }
  });
});
