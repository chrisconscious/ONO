import { describe, expect, it } from "vitest";
import { RESOURCE_LIST, permissionCode } from "@/lib/resources/registry";
import { PERMISSIONS } from "@/lib/permissions/catalog";

describe("tenant resource registry", () => {
  it("has unique keys and application paths", () => {
    const keys = RESOURCE_LIST.map((resource) => resource.key);
    const paths = RESOURCE_LIST.map((resource) => resource.path);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(paths).size).toBe(paths.length);

    for (const resource of RESOURCE_LIST) {
      expect(resource.path.startsWith("/app/")).toBe(true);
      expect(resource.columns.length).toBeGreaterThan(0);
    }
  });

  it("maps every resource to catalogue read permissions", () => {
    const codes = new Set(PERMISSIONS.map((permission) => permission.code));
    for (const resource of RESOURCE_LIST) {
      expect(codes.has(permissionCode(resource.permissionResource, "READ"))).toBe(true);
    }
  });

  it("keeps create fields aligned with resource definitions", () => {
    for (const resource of RESOURCE_LIST) {
      if (resource.allowCreate) {
        expect(resource.fields.length).toBeGreaterThan(0);
      }
      const fieldNames = resource.fields.map((field) => field.name);
      expect(new Set(fieldNames).size).toBe(fieldNames.length);
    }
  });
});
