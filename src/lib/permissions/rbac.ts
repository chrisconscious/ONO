import type { MemberRole } from "@prisma/client";
export type { MemberRole };

/**
 * Role-Based Access Control.
 * Permissions are resolved server-side from the user's Membership role.
 * Client-supplied roles/permissions are never trusted.
 */
export type Permission =
  // org
  | "org.read"
  | "org.update"
  | "org.members.manage"
  | "org.invitations.manage"
  | "org.audit.read"
  | "org.settings.manage"
  // crm
  | "crm.read"
  | "crm.write"
  | "crm.delete"
  | "crm.leads.convert"
  // sales
  | "sales.read"
  | "sales.write"
  | "sales.delete"
  // marketing
  | "marketing.read"
  | "marketing.write"
  // inventory & procurement
  | "inventory.read"
  | "inventory.write"
  | "purchasing.write"
  // finance
  | "finance.read"
  | "finance.write"
  | "finance.approve"
  // projects
  | "projects.read"
  | "projects.write"
  // workforce
  | "workforce.read"
  | "workforce.write"
  | "workforce.approve"
  // docs / notifications
  | "documents.read"
  | "documents.write"
  | "notifications.read"
  // analytics / ai
  | "analytics.read"
  | "aiinsights.read"
  | "aiinsights.review"
  // integrations
  | "integrations.manage"
  // subscriptions & billing (tenant-facing view of their own subscription)
  | "billing.read"
  | "billing.manage"
  // usage metering visibility
  | "usage.read";

const VIEWER_PERMISSIONS: Permission[] = [
  "org.read",
  "crm.read",
  "sales.read",
  "marketing.read",
  "inventory.read",
  "finance.read",
  "projects.read",
  "workforce.read",
  "documents.read",
  "notifications.read",
  "analytics.read",
  "aiinsights.read",
  "billing.read",
  "usage.read",
];

const MEMBER_PERMISSIONS: Permission[] = [
  ...VIEWER_PERMISSIONS,
  "crm.write",
  "crm.leads.convert",
  "sales.write",
  "marketing.write",
  "inventory.write",
  "finance.write",
  "projects.write",
  "workforce.write",
  "documents.write",
];

const MANAGER_PERMISSIONS: Permission[] = [
  ...MEMBER_PERMISSIONS,
  "crm.delete",
  "sales.delete",
  "purchasing.write",
  "finance.approve",
  "workforce.approve",
  "org.audit.read",
  "aiinsights.review",
  "org.invitations.manage",
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...MANAGER_PERMISSIONS,
  "org.update",
  "org.members.manage",
  "org.settings.manage",
  "integrations.manage",
  // Only organization admins may change subscription/billing settings.
  "billing.manage",
];

const ROLE_PERMISSIONS: Record<MemberRole, ReadonlySet<Permission>> = {
  VIEWER: new Set<Permission>(VIEWER_PERMISSIONS),
  MEMBER: new Set<Permission>(MEMBER_PERMISSIONS),
  MANAGER: new Set<Permission>(MANAGER_PERMISSIONS),
  ADMIN: new Set<Permission>(ADMIN_PERMISSIONS),
};

export function permissionsForRole(role: MemberRole): ReadonlySet<Permission> {
  return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(role: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

/** Rank used for "at least this role" checks. */
const ROLE_RANK: Record<MemberRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function roleAtLeast(role: MemberRole, minimum: MemberRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
