/**
 * Development seed.
 *
 * Creates the minimum real records needed to sign in and exercise both
 * consoles: one platform administrator, one tenant with a workspace
 * administrator and a scoped "Workspace Owner" role.
 *
 * The script is idempotent, so it can be re-run safely. It never creates
 * testimonials or business records — those only come from real usage.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

const platformEmail = process.env.SEED_PLATFORM_EMAIL ?? "admin@ono.local";
const platformPassword = process.env.SEED_PLATFORM_PASSWORD ?? "Platform!2026";

const tenantEmail = process.env.SEED_TENANT_EMAIL ?? "owner@northwind.local";
const tenantPassword = process.env.SEED_TENANT_PASSWORD ?? "Workspace!2026";

/**
 * Permission resources mirrored from `src/lib/permissions/catalog.ts`.
 * The seed runs under plain Node and cannot import the TypeScript catalogue,
 * so the resource/action pairs are repeated here. Both lists must stay in sync;
 * the catalogue test in Part 3 cross-checks them.
 */
const permissionResources = [
  { resource: "LEAD", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "CONTACT", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "COMPANY", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "OPPORTUNITY", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "AUTOMATION", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "TASK", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "PROJECT", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "MILESTONE", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "PRODUCT", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "QUOTATION", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "SALESORDER", actions: ["READ", "CREATE", "UPDATE"] },
  { resource: "STOCK", actions: ["READ", "ADJUST"] },
  { resource: "WAREHOUSE", actions: ["READ", "CREATE", "UPDATE"] },
  { resource: "SUPPLIER", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "PURCHASEORDER", actions: ["READ", "CREATE", "UPDATE", "APPROVE"] },
  { resource: "INVOICE", actions: ["READ", "CREATE", "UPDATE"] },
  { resource: "PAYMENT", actions: ["READ", "CREATE"] },
  { resource: "EXPENSE", actions: ["READ", "CREATE", "UPDATE", "APPROVE"] },
  { resource: "SUPPORT", actions: ["READ", "CREATE", "UPDATE"] },
  { resource: "ANALYTICS", actions: ["READ"] },
  { resource: "TESTIMONIAL", actions: ["READ", "SUBMIT", "WITHDRAW"] },
  { resource: "MEMBER", actions: ["READ", "UPDATE", "CREATE"] },
  { resource: "ROLE", actions: ["READ", "UPDATE", "CREATE"] },
  { resource: "INDUSTRY", actions: ["UPDATE"] },
  { resource: "AUDIT", actions: ["READ"] },
];

const actionLabels = {
  READ: "View",
  CREATE: "Create",
  UPDATE: "Edit",
  DELETE: "Delete",
  APPROVE: "Approve",
  ADJUST: "Adjust",
  SUBMIT: "Submit",
  WITHDRAW: "Withdraw",
};

const permissionDefinitions = permissionResources.flatMap(({ resource, actions }) =>
  actions.map((action) => ({
    code: `PERM-${resource}.${action}`,
    resource,
    action,
    description: `${actionLabels[action]} ${resource.toLowerCase()}`,
  })),
);

async function upsertUser({ email, name, password, role, tenantId }) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        role,
        tenantId,
        // Reset the password so a local re-seed always leaves a usable account.
        passwordHash: hashPassword(password),
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      name,
      role,
      tenantId,
      passwordHash: hashPassword(password),
    },
  });
}

async function main() {
  const platformAdmin = await upsertUser({
    email: platformEmail,
    name: "Platform Administrator",
    password: platformPassword,
    role: "PLATFORM_ADMIN",
    tenantId: null,
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "northwind-trading" },
    update: { name: "Northwind Trading", status: "ACTIVE", industry: "Distribution" },
    create: {
      name: "Northwind Trading",
      slug: "northwind-trading",
      status: "ACTIVE",
      industry: "Distribution",
    },
  });

  const permissions = [];
  for (const definition of permissionDefinitions) {
    const existing = await prisma.permission.findFirst({
      where: { tenantId: null, code: definition.code },
    });
    permissions.push(
      existing ??
        (await prisma.permission.create({
          data: { ...definition, tenantId: null },
        })),
    );
  }

  const ownerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Workspace Owner" } },
    update: {
      description: "Full access to the workspace modules enabled for this tenant.",
      isSystem: true,
    },
    create: {
      tenantId: tenant.id,
      name: "Workspace Owner",
      description: "Full access to the workspace modules enabled for this tenant.",
      isSystem: true,
    },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: ownerRole.id, permissionId: permission.id },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        roleId: ownerRole.id,
        permissionId: permission.id,
      },
    });
  }

  const tenantAdmin = await upsertUser({
    email: tenantEmail,
    name: "Workspace Owner",
    password: tenantPassword,
    role: "TENANT_ADMIN",
    tenantId: tenant.id,
  });

  const membership = await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: tenantAdmin.id } },
    update: { status: "ACTIVE" },
    create: { tenantId: tenant.id, userId: tenantAdmin.id, status: "ACTIVE" },
  });

  await prisma.roleAssignment.upsert({
    where: {
      membershipId_roleId: { membershipId: membership.id, roleId: ownerRole.id },
    },
    update: {},
    create: { membershipId: membership.id, roleId: ownerRole.id },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: null,
      userId: platformAdmin.id,
      action: "CREATE",
      resource: "seed",
      metadata: { tenant: tenant.slug, note: "Development seed applied" },
    },
  });

  console.log("Seed complete.");
  console.log(`  Platform admin : ${platformEmail} / ${platformPassword}`);
  console.log(`  Workspace admin: ${tenantEmail} / ${tenantPassword}`);
  console.log(`  Tenant         : ${tenant.name} (${tenant.slug})`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
