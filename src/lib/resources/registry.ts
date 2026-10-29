/**
 * Metadata for the tenant business modules.
 *
 * The registry drives the shared list/create/edit interface and the generic
 * tenant API. Each entry names real Prisma fields; validation lives in
 * `schemas.ts` and the server remains authoritative.
 */
import { InvoiceStatus, LeadStatus, OpportunityStage, TaskStatus } from "@prisma/client";

export type ResourceKey =
  | "leads"
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
  | "support-cases"
  | "warehouses"
  | "stock-movements";

export type OptionSource =
  | "members"
  | "companies"
  | "opportunities"
  | "suppliers"
  | "sales-orders"
  | "invoices"
  | "quotations"
  | "warehouses"
  | "products"
  | "projects";

export type FieldOption = { value: string; label: string };

export type FieldType =
  | "text"
  | "email"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "checkbox";

export type ResourceField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];
  optionsSource?: OptionSource;
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: string | number | boolean;
  editOnly?: boolean;
  createOnly?: boolean;
};

export type ColumnFormat =
  | "text"
  | "date"
  | "datetime"
  | "currency"
  | "number"
  | "status"
  | "boolean";

export type ResourceColumn = {
  key: string;
  label: string;
  format?: ColumnFormat;
};

export type ResourceDefinition = {
  key: ResourceKey;
  path: string;
  title: string;
  singular: string;
  description: string;
  module: string;
  permissionResource: string;
  createPermission?: string;
  updatePermission?: string;
  allowDelete: boolean;
  allowCreate: boolean;
  allowUpdate: boolean;
  /** Documents expose a detail page with line-item management. */
  detail?: boolean;
  columns: ResourceColumn[];
  fields: ResourceField[];
  searchPlaceholder: string;
  defaultSort: string;
  sortOptions: FieldOption[];
  statusField?: { name: string; label: string; options: FieldOption[] };
  emptyTitle: string;
  emptyDescription: string;
};

const toOptions = (values: string[]): FieldOption[] =>
  values.map((value) => ({ value, label: humanise(value) }));

export function humanise(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const memberField: ResourceField = {
  name: "ownerId",
  label: "Owner",
  type: "select",
  optionsSource: "members",
  description: "The workspace member responsible for this record.",
};

const leadStatusOptions = toOptions(Object.values(LeadStatus));
const taskStatusOptions = toOptions(Object.values(TaskStatus));
const opportunityStageOptions = toOptions(Object.values(OpportunityStage));
const invoiceStatusOptions = toOptions(Object.values(InvoiceStatus));

export const RESOURCES: Record<ResourceKey, ResourceDefinition> = {
  leads: {
    key: "leads",
    path: "/app/leads",
    title: "Leads",
    singular: "lead",
    description: "Capture prospective customers and move them through qualification.",
    module: "CRM",
    permissionResource: "LEAD",
    allowDelete: true,
    allowCreate: true,
    allowUpdate: true,
    columns: [
      { key: "firstName", label: "First name" },
      { key: "lastName", label: "Last name" },
      { key: "companyName", label: "Company" },
      { key: "status", label: "Status", format: "status" },
      { key: "score", label: "Score", format: "number" },
      { key: "estimatedValue", label: "Est. value", format: "currency" },
      { key: "owner.name", label: "Owner" },
      { key: "createdAt", label: "Created", format: "date" },
    ],
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true },
      { name: "lastName", label: "Last name", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "companyName", label: "Company name", type: "text" },
      { name: "jobTitle", label: "Job title", type: "text" },
      { name: "industry", label: "Industry", type: "text" },
      { name: "source", label: "Source", type: "text", placeholder: "Referral, website, event…" },
      { name: "status", label: "Status", type: "select", options: leadStatusOptions },
      memberField,
      {
        name: "estimatedValue",
        label: "Estimated value",
        type: "number",
        min: 0,
        step: 0.01,
        description: "Potential deal value used by the pipeline forecast.",
      },
      { name: "currency", label: "Currency", type: "text", defaultValue: "TZS" },
      { name: "expectedConversionDate", label: "Expected conversion date", type: "date" },
      { name: "lastContactedAt", label: "Last contacted", type: "date" },
      { name: "lostReason", label: "Lost reason", type: "text" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    searchPlaceholder: "Search name, email or company…",
    defaultSort: "createdAt:desc",
    sortOptions: [
      { value: "createdAt:desc", label: "Newest first" },
      { value: "createdAt:asc", label: "Oldest first" },
      { value: "lastName:asc", label: "Name A–Z" },
      { value: "status:asc", label: "Status" },
    ],
    statusField: { name: "status", label: "Filter by status", options: leadStatusOptions },
    emptyTitle: "No leads yet",
    emptyDescription: "Create the first lead to start tracking your sales pipeline.",
  },

  contacts: {
    key: "contacts",
    path: "/app/contacts",
    title: "Contacts",
    singular: "contact",
    description: "People you work with across customer and partner organisations.",
    module: "CRM",
    permissionResource: "CONTACT",
    allowDelete: true,
    allowCreate: true,
    allowUpdate: true,
    columns: [
      { key: "firstName", label: "First name" },
      { key: "lastName", label: "Last name" },
      { key: "title", label: "Job title" },
      { key: "company.name", label: "Company" },
      { key: "status", label: "Status", format: "status" },
      { key: "owner.name", label: "Owner" },
      { key: "lastContactedAt", label: "Last contact", format: "date" },
    ],
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true },
      { name: "lastName", label: "Last name", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "title", label: "Job title", type: "text" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: toOptions(["ACTIVE", "INACTIVE"]),
      },
      memberField,
      {
        name: "companyId",
        label: "Company",
        type: "select",
        optionsSource: "companies",
      },
      { name: "lastContactedAt", label: "Last contacted", type: "date" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    searchPlaceholder: "Search name, email or phone…",
    defaultSort: "createdAt:desc",
    sortOptions: [
      { value: "createdAt:desc", label: "Newest first" },
      { value: "lastName:asc", label: "Name A–Z" },
    ],
    emptyTitle: "No contacts yet",
    emptyDescription: "Add a contact to keep customer relationships in one place.",
  },

  companies: {
    key: "companies",
    path: "/app/companies",
    title: "Companies",
    singular: "company",
    description: "Customer and partner accounts linked to contacts and opportunities.",
    module: "CRM",
    permissionResource: "COMPANY",
    allowDelete: true,
    allowCreate: true,
    allowUpdate: true,
    columns: [
      { key: "name", label: "Company" },
      { key: "industry", label: "Industry" },
      { key: "status", label: "Status", format: "status" },
      { key: "owner.name", label: "Owner" },
      { key: "_count.contacts", label: "Contacts", format: "number" },
      { key: "_count.opportunities", label: "Opportunities", format: "number" },
      { key: "lastInteractionAt", label: "Last activity", format: "date" },
    ],
    fields: [
      { name: "name", label: "Company name", type: "text", required: true },
      { name: "industry", label: "Industry", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "website", label: "Website", type: "text", placeholder: "https://" },
      {
        name: "size",
        label: "Company size",
        type: "select",
        options: toOptions(["1-10", "11-50", "51-200", "201-1000", "1000+"]),
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: toOptions(["ACTIVE", "INACTIVE"]),
      },
      memberField,
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    searchPlaceholder: "Search company, industry or email…",
    defaultSort: "name:asc",
    sortOptions: [
      { value: "name:asc", label: "Name A–Z" },
      { value: "name:desc", label: "Name Z–A" },
      { value: "createdAt:desc", label: "Newest first" },
    ],
    emptyTitle: "No companies yet",
    emptyDescription: "Create a company account to group contacts and opportunities.",
  },

  opportunities: {
    key: "opportunities",
    path: "/app/opportunities",
    title: "Opportunities",
    singular: "opportunity",
    description: "Qualified sales pursuits with value, stage and close date.",
    module: "CRM",
    permissionResource: "OPPORTUNITY",
    allowDelete: true,
    allowCreate: true,
    allowUpdate: true,
    columns: [
      { key: "name", label: "Opportunity" },
      { key: "company.name", label: "Company" },
      { key: "stage", label: "Stage", format: "status" },
      { key: "amount", label: "Amount", format: "currency" },
      { key: "winProbability", label: "Win baseline", format: "number" },
      { key: "expectedCloseDate", label: "Expected close", format: "date" },
      { key: "owner.name", label: "Owner" },
    ],
    fields: [
      { name: "name", label: "Opportunity name", type: "text", required: true },
      { name: "companyId", label: "Company", type: "select", optionsSource: "companies" },
      { name: "stage", label: "Stage", type: "select", options: opportunityStageOptions },
      { name: "amount", label: "Amount", type: "number", min: 0, step: 0.01 },
      { name: "currency", label: "Currency", type: "text", defaultValue: "TZS" },
      { name: "expectedCloseDate", label: "Expected close date", type: "date" },
      memberField,
      { name: "nextStep", label: "Next step", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "lostReason", label: "Lost reason", type: "text" },
      { name: "wonReason", label: "Won reason", type: "text" },
    ],
    searchPlaceholder: "Search opportunity or company…",
    defaultSort: "createdAt:desc",
    sortOptions: [
      { value: "createdAt:desc", label: "Newest first" },
      { value: "amount:desc", label: "Highest value" },
      { value: "expectedCloseDate:asc", label: "Closing soonest" },
      { value: "stage:asc", label: "Stage" },
    ],
    statusField: { name: "stage", label: "Filter by stage", options: opportunityStageOptions },
    emptyTitle: "No opportunities yet",
    emptyDescription: "Create an opportunity to forecast and track a sales pursuit.",
  },

  projects: {
    key: "projects",
    path: "/app/projects",
    title: "Projects",
    singular: "project",
    description: "Delivery work with milestones, budget and schedule.",
    module: "Projects",
    permissionResource: "PROJECT",
    allowDelete: true,
    allowCreate: true,
    allowUpdate: true,
    columns: [
      { key: "name", label: "Project" },
      { key: "status", label: "Status", format: "status" },
      { key: "startDate", label: "Starts", format: "date" },
      { key: "endDate", label: "Ends", format: "date" },
      { key: "budget", label: "Budget", format: "currency" },
      { key: "_count.milestones", label: "Milestones", format: "number" },
    ],
    fields: [
      { name: "name", label: "Project name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: toOptions(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
      },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "budget", label: "Budget", type: "number", min: 0, step: 0.01 },
      { name: "currency", label: "Currency", type: "text", defaultValue: "TZS" },
    ],
    searchPlaceholder: "Search projects…",
    defaultSort: "createdAt:desc",
    sortOptions: [
      { value: "createdAt:desc", label: "Newest first" },
      { value: "name:asc", label: "Name A–Z" },
      { value: "endDate:asc", label: "Ending soonest" },
    ],
    statusField: {
      name: "status",
      label: "Filter by status",
      options: toOptions(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
    },
    emptyTitle: "No projects yet",
    emptyDescription: "Create a project to plan delivery and track milestones.",
  },

  tasks: {
    key: "tasks",
    path: "/app/tasks",
    title: "Tasks",
    singular: "task",
    description: "Follow-ups and delivery work assigned to workspace members.",
    module: "Projects",
    permissionResource: "TASK",
    allowDelete: true,
    allowCreate: true,
    allowUpdate: true,
    columns: [
      { key: "title", label: "Task" },
      { key: "status", label: "Status", format: "status" },
      { key: "priority", label: "Priority", format: "status" },
      { key: "assignee.name", label: "Assignee" },
      { key: "dueDate", label: "Due", format: "date" },
      { key: "relatedType", label: "Related to" },
    ],
    fields: [
      { name: "title", label: "Task", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: taskStatusOptions },
      {
        name: "priority",
        label: "Priority",
        type: "select",
        options: toOptions(["LOW", "MEDIUM", "HIGH", "URGENT"]),
      },
      {
        name: "assigneeId",
        label: "Assignee",
        type: "select",
        optionsSource: "members",
      },
      { name: "dueDate", label: "Due date", type: "date" },
      {
        name: "relatedType",
        label: "Related record type",
        type: "select",
        options: toOptions(["LEAD", "CONTACT", "COMPANY", "OPPORTUNITY", "PROJECT", "INVOICE"]),
      },
      {
        name: "relatedId",
        label: "Related record reference",
        type: "text",
        description: "Optional internal reference for the related record.",
      },
      { name: "outcome", label: "Outcome", type: "textarea" },
    ],
    searchPlaceholder: "Search tasks…",
    defaultSort: "createdAt:desc",
    sortOptions: [
      { value: "createdAt:desc", label: "Newest first" },
      { value: "dueDate:asc", label: "Due soonest" },
      { value: "status:asc", label: "Status" },
    ],
    statusField: { name: "status", label: "Filter by status", options: taskStatusOptions },
    emptyTitle: "No tasks yet",
    emptyDescription: "Create a task to track follow-ups and delivery work.",
  },

  products: {
    key: "products",
    path: "/app/products",
    title: "Products & services",
    singular: "product",
    description: "Sellable catalogue used by quotations, orders and inventory.",
    module: "Inventory",
    permissionResource: "PRODUCT",
    allowDelete: true,
    allowCreate: true,
    allowUpdate: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "sku", label: "SKU" },
      { key: "type", label: "Type" },
      { key: "price", label: "Price", format: "currency" },
      { key: "isActive", label: "Active", format: "boolean" },
      { key: "createdAt", label: "Created", format: "date" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "sku", label: "SKU", type: "text" },
      {
        name: "type",
        label: "Type",
        type: "select",
        options: toOptions(["PRODUCT", "SERVICE"]),
      },
      { name: "price", label: "Price", type: "number", min: 0, step: 0.01 },
      { name: "currency", label: "Currency", type: "text", defaultValue: "TZS" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "isActive", label: "Active for sale", type: "checkbox", defaultValue: true },
    ],
    searchPlaceholder: "Search name or SKU…",
    defaultSort: "name:asc",
    sortOptions: [
      { value: "name:asc", label: "Name A–Z" },
      { value: "price:desc", label: "Highest price" },
      { value: "createdAt:desc", label: "Newest first" },
    ],
    emptyTitle: "No products yet",
    emptyDescription: "Add a product or service to reuse it in sales documents.",
  },

  quotations: {
    key: "quotations",
    path: "/app/quotations",
    title: "Quotations",
    singular: "quotation",
    description: "Priced proposals sent to customers before an order is placed.",
    module: "Sales",
    permissionResource: "QUOTATION",
    allowDelete: true,
    allowCreate: true,
    allowUpdate: true,
    detail: true,
    columns: [
      { key: "quoteNumber", label: "Quote" },
      { key: "status", label: "Status", format: "status" },
      { key: "total", label: "Total", format: "currency" },
      { key: "validUntil", label: "Valid until", format: "date" },
      { key: "_count.lines", label: "Lines", format: "number" },
      { key: "createdAt", label: "Created", format: "date" },
    ],
    fields: [
      { name: "quoteNumber", label: "Quote number", type: "text", required: true },
      {
        name: "opportunityId",
        label: "Opportunity",
        type: "select",
        optionsSource: "opportunities",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: toOptions(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"]),
      },
      { name: "validUntil", label: "Valid until", type: "date" },
      { name: "subtotal", label: "Subtotal", type: "number", min: 0, step: 0.01 },
      { name: "tax", label: "Tax", type: "number", min: 0, step: 0.01 },
      { name: "total", label: "Total", type: "number", min: 0, step: 0.01 },
      { name: "currency", label: "Currency", type: "text", defaultValue: "TZS" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    searchPlaceholder: "Search quote number…",
    defaultSort: "createdAt:desc",
    sortOptions: [
      { value: "createdAt:desc", label: "Newest first" },
      { value: "total:desc", label: "Highest value" },
      { value: "validUntil:asc", label: "Expiring soonest" },
    ],
    statusField: {
      name: "status",
      label: "Filter by status",
      options: toOptions(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"]),
    },
    emptyTitle: "No quotations yet",
    emptyDescription: "Create a quotation to send a priced proposal to a customer.",
  },

  "sales-orders": {
    key: "sales-orders",
    path: "/app/sales-orders",
    title: "Sales orders",
    singular: "sales order",
    description: "Confirmed customer orders ready for fulfilment and invoicing.",
    module: "Sales",
    permissionResource: "SALESORDER",
    allowDelete: false,
    allowCreate: true,
    allowUpdate: true,
    detail: true,
    columns: [
      { key: "orderNumber", label: "Order" },
      { key: "status", label: "Status", format: "status" },
      { key: "total", label: "Total", format: "currency" },
      { key: "orderDate", label: "Order date", format: "date" },
      { key: "_count.lines", label: "Lines", format: "number" },
    ],
    fields: [
      { name: "orderNumber", label: "Order number", type: "text", required: true },
      {
        name: "quotationId",
        label: "Quotation",
        type: "select",
        optionsSource: "quotations",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: toOptions(["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"]),
      },
      { name: "orderDate", label: "Order date", type: "date" },
      { name: "subtotal", label: "Subtotal", type: "number", min: 0, step: 0.01 },
      { name: "tax", label: "Tax", type: "number", min: 0, step: 0.01 },
      { name: "total", label: "Total", type: "number", min: 0, step: 0.01 },
      { name: "currency", label: "Currency", type: "text", defaultValue: "TZS" },
    ],
    searchPlaceholder: "Search order number…",
    defaultSort: "orderDate:desc",
    sortOptions: [
      { value: "orderDate:desc", label: "Newest first" },
      { value: "total:desc", label: "Highest value" },
      { value: "status:asc", label: "Status" },
    ],
    statusField: {
      name: "status",
      label: "Filter by status",
      options: toOptions(["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"]),
    },
    emptyTitle: "No sales orders yet",
    emptyDescription: "Create a sales order to record a confirmed customer purchase.",
  },

  suppliers: {
    key: "suppliers",
    path: "/app/suppliers",
    title: "Suppliers",
    singular: "supplier",
    description: "Vendors that provide the goods and services you purchase.",
    module: "Procurement",
    permissionResource: "SUPPLIER",
    allowDelete: true,
    allowCreate: true,
    allowUpdate: true,
    columns: [
      { key: "name", label: "Supplier" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "isActive", label: "Active", format: "boolean" },
      { key: "_count.purchaseOrders", label: "Purchase orders", format: "number" },
    ],
    fields: [
      { name: "name", label: "Supplier name", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "isActive", label: "Active supplier", type: "checkbox", defaultValue: true },
    ],
    searchPlaceholder: "Search supplier name or email…",
    defaultSort: "name:asc",
    sortOptions: [
      { value: "name:asc", label: "Name A–Z" },
      { value: "createdAt:desc", label: "Newest first" },
    ],
    emptyTitle: "No suppliers yet",
    emptyDescription: "Add a supplier before raising purchase orders.",
  },

  "purchase-orders": {
    key: "purchase-orders",
    path: "/app/purchase-orders",
    title: "Purchase orders",
    singular: "purchase order",
    description: "Orders sent to suppliers for goods and services.",
    module: "Procurement",
    permissionResource: "PURCHASEORDER",
    allowDelete: false,
    allowCreate: true,
    allowUpdate: true,
    detail: true,
    columns: [
      { key: "poNumber", label: "PO" },
      { key: "supplier.name", label: "Supplier" },
      { key: "status", label: "Status", format: "status" },
      { key: "total", label: "Total", format: "currency" },
      { key: "expectedDate", label: "Expected", format: "date" },
      { key: "_count.lines", label: "Lines", format: "number" },
    ],
    fields: [
      { name: "poNumber", label: "PO number", type: "text", required: true },
      {
        name: "supplierId",
        label: "Supplier",
        type: "select",
        optionsSource: "suppliers",
        required: true,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: toOptions(["DRAFT", "SENT", "PARTIAL", "RECEIVED", "CANCELLED"]),
      },
      { name: "orderDate", label: "Order date", type: "date" },
      { name: "expectedDate", label: "Expected date", type: "date" },
      { name: "subtotal", label: "Subtotal", type: "number", min: 0, step: 0.01 },
      { name: "tax", label: "Tax", type: "number", min: 0, step: 0.01 },
      { name: "total", label: "Total", type: "number", min: 0, step: 0.01 },
      { name: "currency", label: "Currency", type: "text", defaultValue: "TZS" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    searchPlaceholder: "Search PO number or supplier…",
    defaultSort: "orderDate:desc",
    sortOptions: [
      { value: "orderDate:desc", label: "Newest first" },
      { value: "total:desc", label: "Highest value" },
      { value: "expectedDate:asc", label: "Expected soonest" },
    ],
    statusField: {
      name: "status",
      label: "Filter by status",
      options: toOptions(["DRAFT", "SENT", "PARTIAL", "RECEIVED", "CANCELLED"]),
    },
    emptyTitle: "No purchase orders yet",
    emptyDescription: "Raise a purchase order to buy from a supplier.",
  },

  invoices: {
    key: "invoices",
    path: "/app/invoices",
    title: "Invoices",
    singular: "invoice",
    description: "Amounts owed by customers, payments received and outstanding balances.",
    module: "Finance",
    permissionResource: "INVOICE",
    allowDelete: false,
    allowCreate: true,
    allowUpdate: true,
    detail: true,
    columns: [
      { key: "invoiceNumber", label: "Invoice" },
      { key: "status", label: "Status", format: "status" },
      { key: "total", label: "Total", format: "currency" },
      { key: "balance", label: "Balance", format: "currency" },
      { key: "dueDate", label: "Due", format: "date" },
      { key: "_count.payments", label: "Payments", format: "number" },
    ],
    fields: [
      { name: "invoiceNumber", label: "Invoice number", type: "text", required: true },
      {
        name: "salesOrderId",
        label: "Sales order",
        type: "select",
        optionsSource: "sales-orders",
      },
      { name: "status", label: "Status", type: "select", options: invoiceStatusOptions },
      { name: "issueDate", label: "Issue date", type: "date" },
      { name: "dueDate", label: "Due date", type: "date" },
      { name: "subtotal", label: "Subtotal", type: "number", min: 0, step: 0.01 },
      { name: "tax", label: "Tax", type: "number", min: 0, step: 0.01 },
      { name: "total", label: "Total", type: "number", min: 0, step: 0.01, required: true },
      { name: "currency", label: "Currency", type: "text", defaultValue: "TZS" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    searchPlaceholder: "Search invoice number…",
    defaultSort: "issueDate:desc",
    sortOptions: [
      { value: "issueDate:desc", label: "Newest first" },
      { value: "dueDate:asc", label: "Due soonest" },
      { value: "total:desc", label: "Highest value" },
    ],
    statusField: {
      name: "status",
      label: "Filter by status",
      options: invoiceStatusOptions,
    },
    emptyTitle: "No invoices yet",
    emptyDescription: "Create an invoice to bill a customer for delivered work.",
  },

  payments: {
    key: "payments",
    path: "/app/payments",
    title: "Payments",
    singular: "payment",
    description: "Recorded receipts against invoices. Status changes are calculated by the server.",
    module: "Finance",
    permissionResource: "PAYMENT",
    allowDelete: false,
    allowCreate: true,
    allowUpdate: false,
    columns: [
      { key: "invoice.invoiceNumber", label: "Invoice" },
      { key: "amount", label: "Amount", format: "currency" },
      { key: "paymentMethod", label: "Method" },
      { key: "reference", label: "Reference" },
      { key: "paidAt", label: "Paid", format: "date" },
    ],
    fields: [
      {
        name: "invoiceId",
        label: "Invoice",
        type: "select",
        optionsSource: "invoices",
        required: true,
      },
      { name: "amount", label: "Amount", type: "number", min: 0.01, step: 0.01, required: true },
      { name: "currency", label: "Currency", type: "text", defaultValue: "TZS" },
      {
        name: "paymentMethod",
        label: "Method",
        type: "select",
        options: toOptions(["BANK_TRANSFER", "CASH", "CARD", "MOBILE_MONEY", "CHEQUE"]),
      },
      { name: "reference", label: "Reference", type: "text" },
      { name: "paidAt", label: "Paid on", type: "date" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    searchPlaceholder: "Search reference or invoice…",
    defaultSort: "paidAt:desc",
    sortOptions: [{ value: "paidAt:desc", label: "Newest first" }],
    emptyTitle: "No payments recorded",
    emptyDescription: "Record a payment against an issued invoice.",
  },

  expenses: {
    key: "expenses",
    path: "/app/expenses",
    title: "Expenses",
    singular: "expense",
    description: "Business costs awaiting approval or already approved.",
    module: "Finance",
    permissionResource: "EXPENSE",
    allowDelete: false,
    allowCreate: true,
    allowUpdate: true,
    columns: [
      { key: "description", label: "Description" },
      { key: "category", label: "Category" },
      { key: "vendor", label: "Vendor" },
      { key: "amount", label: "Amount", format: "currency" },
      { key: "expenseDate", label: "Date", format: "date" },
      { key: "status", label: "Status", format: "status" },
    ],
    fields: [
      { name: "description", label: "Description", type: "text", required: true },
      { name: "amount", label: "Amount", type: "number", min: 0.01, step: 0.01, required: true },
      { name: "currency", label: "Currency", type: "text", defaultValue: "TZS" },
      { name: "category", label: "Category", type: "text" },
      { name: "vendor", label: "Vendor", type: "text" },
      { name: "expenseDate", label: "Expense date", type: "date" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: toOptions(["PENDING", "APPROVED", "REJECTED", "REIMBURSED"]),
      },
      { name: "receiptUrl", label: "Receipt reference", type: "text" },
    ],
    searchPlaceholder: "Search description, vendor or category…",
    defaultSort: "expenseDate:desc",
    sortOptions: [
      { value: "expenseDate:desc", label: "Newest first" },
      { value: "amount:desc", label: "Highest amount" },
    ],
    statusField: {
      name: "status",
      label: "Filter by status",
      options: toOptions(["PENDING", "APPROVED", "REJECTED", "REIMBURSED"]),
    },
    emptyTitle: "No expenses yet",
    emptyDescription: "Record a business cost for review and reporting.",
  },

  "support-cases": {
    key: "support-cases",
    path: "/app/support-cases",
    title: "Support cases",
    singular: "support case",
    description: "Customer issues with priority, ownership and resolution status.",
    module: "Support",
    permissionResource: "SUPPORT",
    allowDelete: false,
    allowCreate: true,
    allowUpdate: true,
    columns: [
      { key: "subject", label: "Subject" },
      { key: "status", label: "Status", format: "status" },
      { key: "priority", label: "Priority" },
      { key: "assignedTo", label: "Assigned to" },
      { key: "createdAt", label: "Opened", format: "date" },
    ],
    fields: [
      { name: "subject", label: "Subject", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: toOptions(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]),
      },
      {
        name: "priority",
        label: "Priority",
        type: "select",
        options: toOptions(["LOW", "MEDIUM", "HIGH", "URGENT"]),
      },
      { name: "assignedTo", label: "Assigned to", type: "text" },
    ],
    searchPlaceholder: "Search subject or description…",
    defaultSort: "createdAt:desc",
    sortOptions: [
      { value: "createdAt:desc", label: "Newest first" },
      { value: "priority:asc", label: "Priority" },
    ],
    statusField: {
      name: "status",
      label: "Filter by status",
      options: toOptions(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]),
    },
    emptyTitle: "No support cases",
    emptyDescription: "Open a case to track a customer issue to resolution.",
  },

  warehouses: {
    key: "warehouses",
    path: "/app/warehouses",
    title: "Warehouses",
    singular: "warehouse",
    description: "Stock locations used to record inventory movements.",
    module: "Inventory",
    permissionResource: "WAREHOUSE",
    allowDelete: false,
    allowCreate: true,
    allowUpdate: true,
    columns: [
      { key: "name", label: "Warehouse" },
      { key: "code", label: "Code" },
      { key: "isActive", label: "Active", format: "boolean" },
      { key: "_count.movements", label: "Movements", format: "number" },
      { key: "createdAt", label: "Created", format: "date" },
    ],
    fields: [
      { name: "name", label: "Warehouse name", type: "text", required: true },
      { name: "code", label: "Code", type: "text", placeholder: "e.g. DAR-01" },
      { name: "isActive", label: "Active location", type: "checkbox", defaultValue: true },
    ],
    searchPlaceholder: "Search warehouse or code…",
    defaultSort: "name:asc",
    sortOptions: [
      { value: "name:asc", label: "Name A–Z" },
      { value: "createdAt:desc", label: "Newest first" },
    ],
    emptyTitle: "No warehouses yet",
    emptyDescription: "Create a stock location before recording movements.",
  },

  "stock-movements": {
    key: "stock-movements",
    path: "/app/stock-movements",
    title: "Stock movements",
    singular: "movement",
    description:
      "Immutable receipts, issues and adjustments. Stock levels are derived from these records.",
    module: "Inventory",
    permissionResource: "STOCK",
    createPermission: "PERM-STOCK.ADJUST",
    updatePermission: "PERM-STOCK.ADJUST",
    allowDelete: false,
    allowCreate: true,
    allowUpdate: false,
    columns: [
      { key: "createdAt", label: "Recorded", format: "datetime" },
      { key: "product.name", label: "Product" },
      { key: "warehouse.name", label: "Warehouse" },
      { key: "type", label: "Type", format: "status" },
      { key: "quantity", label: "Quantity", format: "number" },
      { key: "reason", label: "Reason" },
      { key: "createdBy.name", label: "Recorded by" },
    ],
    fields: [
      {
        name: "productId",
        label: "Product",
        type: "select",
        optionsSource: "products",
      },
      {
        name: "warehouseId",
        label: "Warehouse",
        type: "select",
        optionsSource: "warehouses",
        required: true,
      },
      {
        name: "type",
        label: "Movement type",
        type: "select",
        options: toOptions(["IN", "OUT", "ADJUSTMENT"]),
        defaultValue: "IN",
        required: true,
      },
      {
        name: "quantity",
        label: "Quantity",
        type: "number",
        min: 0.001,
        step: 0.001,
        required: true,
        description:
          "For an adjustment, enter the signed change (for example -2 to reduce stock by two).",
      },
      { name: "unitCost", label: "Unit cost", type: "number", min: 0, step: 0.01 },
      { name: "reason", label: "Reason", type: "text", required: true },
      { name: "reference", label: "Reference", type: "text" },
    ],
    searchPlaceholder: "Search reason, reference or product…",
    defaultSort: "createdAt:desc",
    sortOptions: [{ value: "createdAt:desc", label: "Newest first" }],
    statusField: {
      name: "type",
      label: "Filter by type",
      options: toOptions(["IN", "OUT", "ADJUSTMENT"]),
    },
    emptyTitle: "No stock movements",
    emptyDescription:
      "Record a receipt, issue or adjustment to start tracking stock levels.",
  },
};

export const RESOURCE_LIST = Object.values(RESOURCES);

export function isResourceKey(value: string): value is ResourceKey {
  return value in RESOURCES;
}

export function permissionCode(resource: string, action: string) {
  return `PERM-${resource}.${action}`;
}
