import { z } from "zod";

/**
 * Request validation for the tenant resource API. Optional strings accept a
 * blank value because HTML forms submit empty inputs; the service converts
 * blanks to `null` only when the field is present in the payload.
 */
const text = (max = 200) => z.string().trim().max(max);
const optionalText = (max = 500) => z.string().trim().max(max).optional();
const email = z.union([z.string().trim().email(), z.literal("")]).optional();
const date = z
  .string()
  .optional()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
    message: "Enter a valid date.",
  });
const number = z.coerce.number().finite();
const optionalNumber = z.union([z.coerce.number().finite(), z.literal("")]).optional();
const boolean = z.boolean().optional();

const leadSchema = z.object({
  firstName: text(120).min(1, "First name is required."),
  lastName: text(120).min(1, "Last name is required."),
  email,
  phone: optionalText(40),
  companyName: optionalText(160),
  jobTitle: optionalText(120),
  industry: optionalText(120),
  source: optionalText(120),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]).optional(),
  ownerId: optionalText(40),
  estimatedValue: optionalNumber,
  currency: optionalText(8),
  expectedConversionDate: date,
  lastContactedAt: date,
  lostReason: optionalText(500),
  notes: optionalText(4000),
});

const contactSchema = z.object({
  firstName: text(120).min(1, "First name is required."),
  lastName: text(120).min(1, "Last name is required."),
  email,
  phone: optionalText(40),
  title: optionalText(120),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  ownerId: optionalText(40),
  companyId: optionalText(40),
  lastContactedAt: date,
  notes: optionalText(4000),
});

const companySchema = z.object({
  name: text(200).min(1, "Company name is required."),
  industry: optionalText(120),
  email,
  phone: optionalText(40),
  website: optionalText(300),
  size: optionalText(40),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  ownerId: optionalText(40),
  notes: optionalText(4000),
});

const opportunitySchema = z.object({
  name: text(200).min(1, "Opportunity name is required."),
  companyId: optionalText(40),
  stage: z
    .enum(["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"])
    .optional(),
  amount: optionalNumber,
  currency: optionalText(8),
  expectedCloseDate: date,
  ownerId: optionalText(40),
  description: optionalText(4000),
  nextStep: optionalText(500),
  lostReason: optionalText(500),
  wonReason: optionalText(500),
});

const projectSchema = z.object({
  name: text(200).min(1, "Project name is required."),
  description: optionalText(4000),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  startDate: date,
  endDate: date,
  budget: optionalNumber,
  currency: optionalText(8),
});

const taskSchema = z.object({
  title: text(200).min(1, "Task title is required."),
  description: optionalText(4000),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: optionalText(40),
  dueDate: date,
  relatedType: optionalText(40),
  relatedId: optionalText(40),
  outcome: optionalText(2000),
});

const productSchema = z.object({
  name: text(200).min(1, "Product name is required."),
  sku: optionalText(80),
  description: optionalText(4000),
  type: z.enum(["PRODUCT", "SERVICE"]).optional(),
  price: optionalNumber,
  currency: optionalText(8),
  isActive: boolean,
});

const quotationSchema = z.object({
  quoteNumber: text(80).min(1, "Quote number is required."),
  opportunityId: optionalText(40),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"]).optional(),
  validUntil: date,
  subtotal: optionalNumber,
  tax: optionalNumber,
  total: optionalNumber,
  currency: optionalText(8),
  notes: optionalText(4000),
});

const salesOrderSchema = z.object({
  orderNumber: text(80).min(1, "Order number is required."),
  quotationId: optionalText(40),
  status: z.enum(["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"]).optional(),
  orderDate: date,
  subtotal: optionalNumber,
  tax: optionalNumber,
  total: optionalNumber,
  currency: optionalText(8),
});

const supplierSchema = z.object({
  name: text(200).min(1, "Supplier name is required."),
  email,
  phone: optionalText(40),
  isActive: boolean,
});

const purchaseOrderSchema = z.object({
  poNumber: text(80).min(1, "PO number is required."),
  supplierId: z.string().trim().min(1, "Supplier is required."),
  status: z.enum(["DRAFT", "SENT", "PARTIAL", "RECEIVED", "CANCELLED"]).optional(),
  orderDate: date,
  expectedDate: date,
  subtotal: optionalNumber,
  tax: optionalNumber,
  total: optionalNumber,
  currency: optionalText(8),
  notes: optionalText(4000),
});

const invoiceSchema = z.object({
  invoiceNumber: text(80).min(1, "Invoice number is required."),
  salesOrderId: optionalText(40),
  status: z
    .enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID", "WRITTEN_OFF"])
    .optional(),
  issueDate: date,
  dueDate: date,
  subtotal: optionalNumber,
  tax: optionalNumber,
  total: number.nonnegative("Total must be zero or more."),
  currency: optionalText(8),
  notes: optionalText(4000),
});

const paymentSchema = z.object({
  invoiceId: z.string().trim().min(1, "Invoice is required."),
  amount: number.positive("Payment amount must be greater than zero."),
  currency: optionalText(8),
  paymentMethod: optionalText(40),
  reference: optionalText(120),
  paidAt: date,
  notes: optionalText(4000),
});

const expenseSchema = z.object({
  description: text(240).min(1, "Description is required."),
  amount: number.positive("Amount must be greater than zero."),
  currency: optionalText(8),
  category: optionalText(120),
  vendor: optionalText(160),
  expenseDate: date,
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "REIMBURSED"]).optional(),
  receiptUrl: optionalText(500),
});

const supportCaseSchema = z.object({
  subject: text(240).min(1, "Subject is required."),
  description: optionalText(4000),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedTo: optionalText(120),
});

const warehouseSchema = z.object({
  name: text(160).min(1, "Warehouse name is required."),
  code: optionalText(40),
  isActive: boolean,
});

const stockMovementSchema = z.object({
  productId: optionalText(40),
  warehouseId: z.string().trim().min(1, "Warehouse is required."),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: number.refine((value) => value !== 0, {
    message: "Quantity must not be zero.",
  }),
  unitCost: optionalNumber,
  reason: text(240).min(1, "A reason is required."),
  reference: optionalText(120),
});

export const createSchemas = {
  leads: leadSchema,
  contacts: contactSchema,
  companies: companySchema,
  opportunities: opportunitySchema,
  projects: projectSchema,
  tasks: taskSchema,
  products: productSchema,
  quotations: quotationSchema,
  "sales-orders": salesOrderSchema,
  suppliers: supplierSchema,
  "purchase-orders": purchaseOrderSchema,
  invoices: invoiceSchema,
  payments: paymentSchema,
  expenses: expenseSchema,
  "support-cases": supportCaseSchema,
  warehouses: warehouseSchema,
  "stock-movements": stockMovementSchema,
} as const;

export const updateSchemas = {
  leads: leadSchema.partial(),
  contacts: contactSchema.partial(),
  companies: companySchema.partial(),
  opportunities: opportunitySchema.partial(),
  projects: projectSchema.partial(),
  tasks: taskSchema.partial(),
  products: productSchema.partial(),
  quotations: quotationSchema.partial(),
  "sales-orders": salesOrderSchema.partial(),
  suppliers: supplierSchema.partial(),
  "purchase-orders": purchaseOrderSchema.partial(),
  invoices: invoiceSchema.partial(),
  payments: paymentSchema.partial(),
  expenses: expenseSchema.partial(),
  "support-cases": supportCaseSchema.partial(),
  warehouses: warehouseSchema.partial(),
  "stock-movements": stockMovementSchema.partial(),
} as const;
