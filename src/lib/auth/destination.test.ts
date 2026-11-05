import { describe, expect, it } from "vitest";
import {
  defaultDestination,
  resolvePostAuthDestination,
} from "./destination";

const member = { isPlatformAdmin: false, memberships: [{ tenantId: "t1" }] };
const adminOnly = { isPlatformAdmin: true, memberships: [] };
const plainUser = { isPlatformAdmin: false, memberships: [] };

describe("defaultDestination", () => {
  it("sends members to the workspace and admins to the console", () => {
    expect(defaultDestination(member)).toBe("/app");
    expect(defaultDestination(adminOnly)).toBe("/admin");
    expect(defaultDestination(plainUser)).toBe("/access-denied?scope=workspace");
  });
});

describe("resolvePostAuthDestination", () => {
  it("honours a safe requested path", () => {
    expect(
      resolvePostAuthDestination(member, "/app/invoices?status=PAID"),
    ).toBe("/app/invoices?status=PAID");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(resolvePostAuthDestination(member, "https://evil.example")).toBe(
      "/app",
    );
    expect(resolvePostAuthDestination(member, "//evil.example/app")).toBe("/app");
    expect(resolvePostAuthDestination(member, "app/invoices")).toBe("/app");
  });

  it("never returns to an authentication screen", () => {
    expect(resolvePostAuthDestination(member, "/sign-in?next=/app")).toBe("/app");
    expect(resolvePostAuthDestination(member, "/verify-email")).toBe("/app");
  });

  it("does not send users into areas they cannot access", () => {
    expect(resolvePostAuthDestination(plainUser, "/app/invoices")).toBe(
      "/access-denied?scope=workspace",
    );
    expect(resolvePostAuthDestination(member, "/admin/tenants")).toBe("/app");
    expect(resolvePostAuthDestination(adminOnly, "/admin/tenants")).toBe(
      "/admin/tenants",
    );
  });

  it("keeps unrelated internal paths", () => {
    expect(resolvePostAuthDestination(plainUser, "/legal/privacy")).toBe(
      "/legal/privacy",
    );
  });
});
