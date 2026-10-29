import { requireWorkspace, can } from "@/lib/auth/guards";
import { AppShell } from "@/components/app/app-shell";
import type { NavItem, NavSection } from "@/components/app/nav";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { actor, membership } = await requireWorkspace("/app");

  const read = (resource: string) => `PERM-${resource}.READ`;

  const items: NavItem[] = [
    { href: "/app", label: "Overview", icon: "overview" },
  ];

  if (can(membership, read("ANALYTICS"))) {
    items.push({ href: "/app/analytics", label: "Analytics", icon: "analytics" });
  }

  const crm: NavItem[] = [];

  const canReadCrm =
    can(membership, read("LEAD")) ||
    can(membership, read("CONTACT")) ||
    can(membership, read("COMPANY")) ||
    can(membership, read("OPPORTUNITY"));

  if (canReadCrm) {
    crm.push({ href: "/app/crm", label: "CRM workspace", icon: "crm" });
  }
  if (can(membership, read("OPPORTUNITY"))) {
    crm.push({ href: "/app/crm/pipeline", label: "Pipeline", icon: "pipeline" });
  }
  if (can(membership, read("ANALYTICS"))) {
    crm.push({ href: "/app/crm/insights", label: "Sales insights", icon: "insights" });
  }
  if (can(membership, read("AUTOMATION"))) {
    crm.push({
      href: "/app/crm/automations",
      label: "Automations",
      icon: "automations",
    });
  }
  if (can(membership, read("LEAD"))) {
    crm.push({ href: "/app/leads", label: "Leads", icon: "customers" });
  }
  if (can(membership, read("CONTACT"))) {
    crm.push({ href: "/app/contacts", label: "Contacts", icon: "contacts" });
  }
  if (can(membership, read("COMPANY"))) {
    crm.push({ href: "/app/companies", label: "Companies", icon: "companies" });
  }
  if (can(membership, read("OPPORTUNITY"))) {
    crm.push({
      href: "/app/opportunities",
      label: "Opportunities",
      icon: "opportunities",
    });
  }

  const delivery: NavItem[] = [];
  if (can(membership, read("PROJECT"))) {
    delivery.push({ href: "/app/projects", label: "Projects", icon: "projects" });
  }
  if (can(membership, read("TASK"))) {
    delivery.push({ href: "/app/tasks", label: "Tasks", icon: "tasks" });
  }

  const sales: NavItem[] = [];
  if (can(membership, read("PRODUCT"))) {
    sales.push({ href: "/app/products", label: "Products", icon: "products" });
  }
  if (can(membership, read("QUOTATION"))) {
    sales.push({
      href: "/app/quotations",
      label: "Quotations",
      icon: "quotations",
    });
  }
  if (can(membership, read("SALESORDER"))) {
    sales.push({
      href: "/app/sales-orders",
      label: "Sales orders",
      icon: "sales-orders",
    });
  }

  const procurement: NavItem[] = [];
  if (can(membership, read("SUPPLIER"))) {
    procurement.push({
      href: "/app/suppliers",
      label: "Suppliers",
      icon: "suppliers",
    });
  }
  if (can(membership, read("PURCHASEORDER"))) {
    procurement.push({
      href: "/app/purchase-orders",
      label: "Purchase orders",
      icon: "purchase-orders",
    });
  }

  const finance: NavItem[] = [];
  if (can(membership, read("INVOICE"))) {
    finance.push({ href: "/app/invoices", label: "Invoices", icon: "invoices" });
  }
  if (can(membership, read("PAYMENT"))) {
    finance.push({ href: "/app/payments", label: "Payments", icon: "payments" });
  }
  if (can(membership, read("EXPENSE"))) {
    finance.push({ href: "/app/expenses", label: "Expenses", icon: "expenses" });
  }

  const inventory: NavItem[] = [];
  if (can(membership, read("WAREHOUSE"))) {
    inventory.push({
      href: "/app/warehouses",
      label: "Warehouses",
      icon: "warehouses",
    });
  }
  if (can(membership, read("STOCK"))) {
    inventory.push(
      {
        href: "/app/stock-levels",
        label: "Stock levels",
        icon: "stock-levels",
      },
      {
        href: "/app/stock-movements",
        label: "Stock movements",
        icon: "stock-movements",
      },
    );
  }

  const support: NavItem[] = [];
  if (can(membership, read("SUPPORT"))) {
    support.push({
      href: "/app/support-cases",
      label: "Support cases",
      icon: "support",
    });
  }

  const sections: NavSection[] = [{ label: "Workspace", items }];

  if (crm.length) sections.push({ label: "CRM", items: crm });
  if (delivery.length) sections.push({ label: "Delivery", items: delivery });
  if (sales.length) sections.push({ label: "Sales", items: sales });
  if (procurement.length) sections.push({ label: "Procurement", items: procurement });
  if (finance.length) sections.push({ label: "Finance", items: finance });
  if (inventory.length) sections.push({ label: "Inventory", items: inventory });
  if (support.length) sections.push({ label: "Support", items: support });

  sections.push({
    label: "Recognition",
    items: [
      {
        href: "/app/testimonials",
        label: "Testimonials",
        icon: "testimonials",
      },
    ],
  });

  sections.push({
    label: "Administration",
    items: [{ href: "/app/settings", label: "Workspace settings", icon: "settings" }],
  });

  return (
    <AppShell
      scope="workspace"
      nav={sections}
      homeHref="/app"
      contextLabel={membership.tenant.name}
      contextMeta={membership.roles.join(", ") || "Workspace member"}
      currentWorkspaceId={membership.tenantId}
      user={{
        name: actor.name ?? actor.email,
        email: actor.email,
        roleLabel: membership.roles.join(", ") || "Workspace member",
      }}
    >
      {children}
    </AppShell>
  );
}
