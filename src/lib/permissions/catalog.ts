/**
 * Tenant permission catalogue.
 *
 * Permission codes are stored in the database and granted through roles. The
 * catalogue is the single source of truth for seeding, role editing and the
 * labels shown to workspace administrators.
 */
export type PermissionDefinition = {
  code: string;
  resource: string;
  action: string;
  description: string;
  module: string;
};

type ResourceSpec = {
  resource: string;
  module: string;
  label: string;
  actions: Array<
    | "READ"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "APPROVE"
    | "ADJUST"
    | "SUBMIT"
    | "WITHDRAW"
  >;
};

const resources: ResourceSpec[] = [
  { resource: "LEAD", module: "CRM", label: "Leads", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "CONTACT", module: "CRM", label: "Contacts", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "COMPANY", module: "CRM", label: "Companies", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  {
    resource: "OPPORTUNITY",
    module: "CRM",
    label: "Opportunities",
    actions: ["READ", "CREATE", "UPDATE", "DELETE"],
  },
  {
    resource: "AUTOMATION",
    module: "CRM",
    label: "CRM automations",
    actions: ["READ", "CREATE", "UPDATE", "DELETE"],
  },
  { resource: "TASK", module: "Projects", label: "Tasks", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "PROJECT", module: "Projects", label: "Projects", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  { resource: "MILESTONE", module: "Projects", label: "Milestones", actions: ["READ", "CREATE", "UPDATE", "DELETE"] },
  {
    resource: "PRODUCT",
    module: "Sales",
    label: "Products",
    actions: ["READ", "CREATE", "UPDATE", "DELETE"],
  },
  {
    resource: "QUOTATION",
    module: "Sales",
    label: "Quotations",
    actions: ["READ", "CREATE", "UPDATE", "DELETE"],
  },
  {
    resource: "SALESORDER",
    module: "Sales",
    label: "Sales orders",
    actions: ["READ", "CREATE", "UPDATE"],
  },
  { resource: "STOCK", module: "Inventory", label: "Stock", actions: ["READ", "ADJUST"] },
  {
    resource: "WAREHOUSE",
    module: "Inventory",
    label: "Warehouses",
    actions: ["READ", "CREATE", "UPDATE"],
  },
  {
    resource: "SUPPLIER",
    module: "Procurement",
    label: "Suppliers",
    actions: ["READ", "CREATE", "UPDATE", "DELETE"],
  },
  {
    resource: "PURCHASEORDER",
    module: "Procurement",
    label: "Purchase orders",
    actions: ["READ", "CREATE", "UPDATE", "APPROVE"],
  },
  {
    resource: "INVOICE",
    module: "Finance",
    label: "Invoices",
    actions: ["READ", "CREATE", "UPDATE"],
  },
  { resource: "PAYMENT", module: "Finance", label: "Payments", actions: ["READ", "CREATE"] },
  {
    resource: "EXPENSE",
    module: "Finance",
    label: "Expenses",
    actions: ["READ", "CREATE", "UPDATE", "APPROVE"],
  },
  {
    resource: "SUPPORT",
    module: "Support",
    label: "Support cases",
    actions: ["READ", "CREATE", "UPDATE"],
  },
  { resource: "ANALYTICS", module: "Analytics", label: "Analytics", actions: ["READ"] },
  { resource: "TESTIMONIAL", module: "Workspace", label: "Testimonials", actions: ["READ", "SUBMIT", "WITHDRAW"] },
  { resource: "MEMBER", module: "Governance", label: "Members", actions: ["READ", "UPDATE", "CREATE"] },
  { resource: "ROLE", module: "Governance", label: "Roles", actions: ["READ", "UPDATE", "CREATE"] },
  { resource: "INDUSTRY", module: "Governance", label: "Industry configuration", actions: ["UPDATE"] },
  { resource: "AUDIT", module: "Governance", label: "Audit trail", actions: ["READ"] },
];

const actionDescriptions: Record<string, string> = {
  READ: "View",
  CREATE: "Create",
  UPDATE: "Edit",
  DELETE: "Delete",
  APPROVE: "Approve",
  ADJUST: "Adjust",
  SUBMIT: "Submit",
  WITHDRAW: "Withdraw",
};

export const PERMISSIONS: PermissionDefinition[] = resources.flatMap((spec) =>
  spec.actions.map((action) => ({
    code: `PERM-${spec.resource}.${action}`,
    resource: spec.resource,
    action,
    description: `${actionDescriptions[action]} ${spec.label.toLowerCase()}`,
    module: spec.module,
  })),
);

export const PERMISSION_MODULES = [...new Set(PERMISSIONS.map((item) => item.module))];

export function permissionsForModule(module: string) {
  return PERMISSIONS.filter((item) => item.module === module);
}

/** Permission codes grouped by resource, used by the role editor. */
export function permissionMatrix() {
  const groups = new Map<
    string,
    { resource: string; module: string; label: string; permissions: PermissionDefinition[] }
  >();

  for (const permission of PERMISSIONS) {
    const existing = groups.get(permission.resource);
    if (existing) {
      existing.permissions.push(permission);
      continue;
    }

    groups.set(permission.resource, {
      resource: permission.resource,
      module: permission.module,
      label: permission.description
        .replace(/^(View|Create|Edit|Delete|Approve|Adjust)\s+/i, "")
        .replace(/\b\w/g, (character) => character.toUpperCase()),
      permissions: [permission],
    });
  }

  return [...groups.values()];
}
