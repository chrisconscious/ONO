import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export const idSchema = z.string().min(1).max(64);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().min(1).max(200).optional(),
});

export const moneySchema = z.coerce
  .number()
  .finite()
  .min(0)
  .max(999_999_999_999.99);

export const isoDateSchema = z.coerce.date();

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const signInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(200),
});

export const registerSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(12).max(200),
  name: z.string().trim().min(1).max(120),
  organizationName: z.string().trim().min(1).max(120),
  organizationSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/, "slug must be lowercase alphanumeric with hyphens"),
  industryKey: z.string().trim().min(1).max(60).optional(),
  customIndustryName: z.string().trim().min(2).max(120).optional(),
  customIndustryDescription: z.string().trim().max(1000).optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(12).max(200),
  name: z.string().trim().min(1).max(120),
});

export const inviteMemberSchema = z.object({
  email: z.email().max(254),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER"]),
});

// ---------------------------------------------------------------------------
// Organization / industry configuration
// ---------------------------------------------------------------------------

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/)
    .optional(),
  industryKey: z.string().trim().min(1).max(60).nullable().optional(),
  customIndustry: z
    .object({
      name: z.string().trim().min(2).max(120),
      description: z.string().trim().max(1000).optional(),
      activities: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
    })
    .optional(),
});

export const setSettingSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_.-]{1,80}$/, "setting key must be dotted lowercase"),
  value: z.json(),
});

export const addBranchSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().regex(/^[A-Za-z0-9_-]{1,20}$/),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(40).optional(),
});

export const addDepartmentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  branchId: idSchema.optional(),
  parentId: idSchema.optional(),
});

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

export const createLeadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().max(200).optional(),
  email: z.email().max(254).optional(),
  phone: z.string().trim().max(40).optional(),
  sourceId: idSchema.optional(),
  ownerId: idSchema.optional(),
  campaignId: idSchema.optional(),
  valueEstimate: moneySchema.optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z
    .enum([
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "PROPOSAL",
      "WON",
      "LOST",
      "DO_NOT_CONTACT",
    ])
    .optional(),
});

export const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(200),
  website: z.string().trim().url().max(300).optional(),
  industry: z.string().trim().max(120).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const createContactSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.email().max(254).optional(),
  phone: z.string().trim().max(40).optional(),
  title: z.string().trim().max(120).optional(),
  companyId: idSchema.optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const createActivitySchema = z.object({
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE", "TASK"]),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().max(10000).optional(),
  occurredAt: isoDateSchema.optional(),
  leadId: idSchema.optional(),
  contactId: idSchema.optional(),
  assignedTo: idSchema.optional(),
});

export const createFollowUpSchema = z.object({
  leadId: idSchema.optional(),
  contactId: idSchema.optional(),
  dueAt: isoDateSchema,
  note: z.string().trim().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

export const OPPORTUNITY_STAGES = [
  "IDENTIFICATION",
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

const STAGE_EDGES: Record<(typeof OPPORTUNITY_STAGES)[number], readonly (typeof OPPORTUNITY_STAGES)[number][]> = {
  IDENTIFICATION: ["QUALIFICATION", "CLOSED_LOST"],
  QUALIFICATION: ["PROPOSAL", "CLOSED_LOST", "IDENTIFICATION"],
  PROPOSAL: ["NEGOTIATION", "CLOSED_LOST", "QUALIFICATION"],
  NEGOTIATION: ["CLOSED_WON", "CLOSED_LOST", "PROPOSAL"],
  CLOSED_WON: [],
  CLOSED_LOST: ["IDENTIFICATION"], // re-open requires manager+
};

export function isLegalStageTransition(
  from: (typeof OPPORTUNITY_STAGES)[number],
  to: (typeof OPPORTUNITY_STAGES)[number],
): boolean {
  return STAGE_EDGES[from].includes(to);
}

export const createOpportunitySchema = z.object({
  name: z.string().trim().min(1).max(200),
  pipelineId: idSchema.optional(),
  amount: moneySchema.optional(),
  currency: z.string().trim().length(3).toUpperCase().default("USD"),
  expectedCloseDate: isoDateSchema.optional(),
  leadId: idSchema.optional(),
  companyId: idSchema.optional(),
  ownerId: idSchema.optional(),
});

export const moveOpportunityStageSchema = z.object({
  stage: z.enum(OPPORTUNITY_STAGES),
  lostReason: z.string().trim().max(500).optional(),
});

export const createQuotationSchema = z.object({
  opportunityId: idSchema,
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(300),
        quantity: z.coerce.number().positive().max(1_000_000),
        unitPrice: moneySchema,
      }),
    )
    .min(1)
    .max(200),
  validUntil: isoDateSchema.optional(),
});

export const createSalesOrderSchema = z.object({
  opportunityId: idSchema.optional(),
  companyId: idSchema.optional(),
  warehouseId: idSchema.optional(),
  lines: z
    .array(
      z.object({
        productId: idSchema.optional(),
        description: z.string().trim().min(1).max(300),
        quantity: z.coerce.number().positive().max(1_000_000),
        unitPrice: moneySchema,
      }),
    )
    .min(1)
    .max(200),
});

// ---------------------------------------------------------------------------
// Inventory & procurement
// ---------------------------------------------------------------------------

export const createProductSchema = z.object({
  sku: z.string().trim().regex(/^[A-Za-z0-9._-]{1,40}$/),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(["GOODS", "SERVICE"]).default("GOODS"),
  unitPrice: moneySchema,
  costPrice: moneySchema.optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  reorderPoint: z.coerce.number().int().min(0).default(0),
});

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().regex(/^[A-Za-z0-9_-]{1,20}$/),
  location: z.string().trim().max(300).optional(),
  branchId: idSchema.optional(),
  isPrimary: z.boolean().default(false),
});

export const stockMovementSchema = z.object({
  productId: idSchema,
  warehouseId: idSchema,
  type: z.enum(["PURCHASE", "SALE", "ADJUSTMENT", "TRANSFER_IN", "TRANSFER_OUT"]),
  quantity: z.coerce
    .number()
    .refine((q) => q !== 0 && Math.abs(q) <= 1_000_000, "quantity must be non-zero"),
  reference: z.string().trim().max(120).optional(),
  reason: z.string().trim().max(500).optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email().max(254).optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(500).optional(),
  terms: z.string().trim().max(500).optional(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: idSchema,
  warehouseId: idSchema,
  lines: z
    .array(
      z.object({
        productId: idSchema,
        description: z.string().trim().min(1).max(300),
        quantity: z.coerce.number().positive().max(1_000_000),
        unitCost: moneySchema,
      }),
    )
    .min(1)
    .max(200),
  expectedDate: isoDateSchema.optional(),
});

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export const createInvoiceSchema = z.object({
  type: z.enum(["SALES", "PURCHASE"]).default("SALES"),
  companyId: idSchema.optional(),
  salesOrderId: idSchema.optional(),
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(300),
        quantity: z.coerce.number().positive().max(1_000_000),
        unitPrice: moneySchema,
        taxRate: z.coerce.number().min(0).max(100).optional(),
      }),
    )
    .min(1)
    .max(200),
  issueDate: isoDateSchema.optional(),
  dueDate: isoDateSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const recordPaymentSchema = z.object({
  invoiceId: idSchema.optional(),
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  amount: z.coerce.number().positive().max(999_999_999_999.99),
  method: z.enum(["CASH", "BANK", "CARD", "MOBILE", "OTHER"]),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  paidAt: isoDateSchema.optional(),
});

export const createExpenseSchema = z.object({
  category: z.string().trim().min(1).max(100),
  amount: z.coerce.number().positive().max(999_999_999_999.99),
  spentAt: isoDateSchema.optional(),
  vendor: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
  budget: moneySchema.optional(),
  ownerId: idSchema.optional(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  projectId: idSchema.optional(),
  milestoneId: idSchema.optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: idSchema.optional(),
  dueAt: isoDateSchema.optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE", "CANCELLED"]),
});

export const decideApprovalSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
  comment: z.string().trim().max(1000).optional(),
});

// ---------------------------------------------------------------------------
// Workforce
// ---------------------------------------------------------------------------

export const createEmployeeSchema = z.object({
  employeeCode: z.string().trim().regex(/^[A-Za-z0-9_-]{1,20}$/),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.email().max(254).optional(),
  phone: z.string().trim().max(40).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  departmentId: idSchema.optional(),
  branchId: idSchema.optional(),
  hireDate: isoDateSchema.optional(),
  baseSalary: moneySchema.optional(),
});

export const createLeaveRequestSchema = z.object({
  employeeId: idSchema,
  type: z.enum(["ANNUAL", "SICK", "UNPAID", "OTHER"]),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  reason: z.string().trim().max(1000).optional(),
});

// ---------------------------------------------------------------------------
// Marketing / KPI / AI / Integrations
// ---------------------------------------------------------------------------

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(200),
  channel: z.string().trim().max(60).optional(),
  budget: moneySchema.optional(),
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateKpiSchema = z.object({
  targetValue: moneySchema.optional(),
  currentValue: moneySchema.optional(),
  periodStart: isoDateSchema.optional(),
  periodEnd: isoDateSchema.optional(),
  isActive: z.boolean().optional(),
});

export const reviewInsightSchema = z.object({
  decision: z.enum(["APPROVED", "DISMISSED", "UNDER_REVIEW", "ACTED_UPON"]),
  note: z.string().trim().max(1000).optional(),
});

export const upsertIntegrationSchema = z.object({
  provider: z.string().trim().min(1).max(60),
  status: z.enum(["ENABLED", "DISABLED"]),
  config: z.json().optional(),
});
