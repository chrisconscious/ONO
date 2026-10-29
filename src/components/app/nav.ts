/** Icon identifiers resolved to Lucide components inside the client shell. */
export type NavIcon =
  | "overview"
  | "tenants"
  | "administrators"
  | "testimonials"
  | "audit"
  | "settings"
  | "customers"
  | "contacts"
  | "companies"
  | "opportunities"
  | "projects"
  | "tasks"
  | "products"
  | "quotations"
  | "sales-orders"
  | "suppliers"
  | "purchase-orders"
  | "invoices"
  | "payments"
  | "expenses"
  | "support"
  | "warehouses"
  | "stock-movements"
  | "stock-levels"
  | "analytics"
  | "crm"
  | "pipeline"
  | "insights"
  | "automations"
  | "billing";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  /** Permission code required to see the item. Omitted means "all members". */
  requires?: string;
  /** Optional small label rendered at the end of the row. */
  hint?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export type ShellScope = "workspace" | "platform";
