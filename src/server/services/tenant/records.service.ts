import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import {
  RESOURCES,
  type FieldOption,
  type OptionSource,
  type ResourceKey,
} from "@/lib/resources/registry";
import { createSchemas, updateSchemas } from "@/lib/resources/schemas";

export type ListRecordsParams = {
  key: ResourceKey;
  tenantId: string;
  page: number;
  limit: number;
  q?: string;
  status?: string;
  sort?: string;
};

export type RecordRow = Record<string, unknown>;

type SortDirection = "asc" | "desc";

function readSort(sort: string | undefined, fallback: string) {
  const [field, direction] = (sort || fallback).split(":");
  return {
    field: field || "createdAt",
    direction: direction === "asc" ? "asc" : "desc",
  } as { field: string; direction: SortDirection };
}

/**
 * Builds a Prisma orderBy from a validated sort key. Only fields the caller has
 * already allow-listed reach the query; anything else falls back to creation
 * order. Prisma accepts the resulting single-key object.
 */
function orderByFor(
  sort: string | undefined,
  allowed: string[],
  fallback: string,
): Record<string, SortDirection> {
  const { field, direction } = readSort(sort, fallback);
  const safeField = allowed.includes(field) ? field : "createdAt";
  return { [safeField]: direction };
}

function blank(value: string | undefined | null) {
  return value === undefined || value === null || value === "" ? null : value;
}

function toDate(value: string | undefined | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: number | "" | undefined | null) {
  if (value === undefined || value === null || value === "") return null;
  return Number(value);
}

/** Rounds a monetary amount to two decimal places. */
function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function searchOr(fields: string[], q: string) {
  return fields.map((field) => ({
    [field]: { contains: q, mode: "insensitive" as const },
  }));
}

export async function getOptionLists(
  tenantId: string,
  sources: OptionSource[],
): Promise<Record<string, FieldOption[]>> {
  const unique = [...new Set(sources)];
  const entries = await Promise.all(
    unique.map(async (source) => {
      switch (source) {
        case "members": {
          const rows = await prisma.membership.findMany({
            where: { tenantId, status: "ACTIVE" },
            select: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { user: { name: "asc" } },
          });
          return [
            source,
            rows.map((row) => ({
              value: row.user.id,
              label: row.user.name || row.user.email,
            })),
          ] as const;
        }
        case "companies": {
          const rows = await prisma.company.findMany({
            where: { tenantId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          });
          return [source, rows.map((row) => ({ value: row.id, label: row.name }))] as const;
        }
        case "opportunities": {
          const rows = await prisma.opportunity.findMany({
            where: { tenantId },
            select: { id: true, name: true },
            orderBy: { createdAt: "desc" },
          });
          return [source, rows.map((row) => ({ value: row.id, label: row.name }))] as const;
        }
        case "suppliers": {
          const rows = await prisma.supplier.findMany({
            where: { tenantId, isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          });
          return [source, rows.map((row) => ({ value: row.id, label: row.name }))] as const;
        }
        case "sales-orders": {
          const rows = await prisma.salesOrder.findMany({
            where: { tenantId },
            select: { id: true, orderNumber: true },
            orderBy: { orderDate: "desc" },
          });
          return [
            source,
            rows.map((row) => ({ value: row.id, label: row.orderNumber })),
          ] as const;
        }
        case "invoices": {
          const rows = await prisma.invoice.findMany({
            where: { tenantId, status: { notIn: ["VOID", "WRITTEN_OFF"] } },
            select: { id: true, invoiceNumber: true, balance: true, currency: true },
            orderBy: { issueDate: "desc" },
          });
          return [
            source,
            rows.map((row) => ({
              value: row.id,
              label: `${row.invoiceNumber} · ${row.currency} ${Number(row.balance).toLocaleString("en-GB")} due`,
            })),
          ] as const;
        }
        case "quotations": {
          const rows = await prisma.quotation.findMany({
            where: { tenantId },
            select: { id: true, quoteNumber: true },
            orderBy: { createdAt: "desc" },
          });
          return [
            source,
            rows.map((row) => ({ value: row.id, label: row.quoteNumber })),
          ] as const;
        }
        case "warehouses": {
          const rows = await prisma.warehouse.findMany({
            where: { tenantId, isActive: true },
            select: { id: true, name: true, code: true },
            orderBy: { name: "asc" },
          });
          return [
            source,
            rows.map((row) => ({
              value: row.id,
              label: row.code ? `${row.name} (${row.code})` : row.name,
            })),
          ] as const;
        }
        case "products": {
          const rows = await prisma.product.findMany({
            where: { tenantId, isActive: true },
            select: { id: true, name: true, sku: true },
            orderBy: { name: "asc" },
          });
          return [
            source,
            rows.map((row) => ({
              value: row.id,
              label: row.sku ? `${row.name} (${row.sku})` : row.name,
            })),
          ] as const;
        }
        case "projects": {
          const rows = await prisma.project.findMany({
            where: { tenantId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          });
          return [source, rows.map((row) => ({ value: row.id, label: row.name }))] as const;
        }
        default:
          return [source, []] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}

export async function listRecords(params: ListRecordsParams) {
  const { key, tenantId, page, limit, q, status, sort } = params;
  const skip = (page - 1) * limit;
  const search = q?.trim();

  switch (key) {
    case "leads": {
      const where: Prisma.LeadWhereInput = {
        tenantId,
        ...(status ? { status: status as Prisma.EnumLeadStatusFilter["equals"] } : {}),
        ...(search
          ? {
              OR: searchOr(
                ["firstName", "lastName", "email", "companyName", "phone"],
                search,
              ),
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          include: { owner: { select: { id: true, name: true, email: true } } },
          orderBy: orderByFor(sort, ["createdAt", "lastName", "status"], "createdAt:desc"),
          skip,
          take: limit,
        }),
        prisma.lead.count({ where }),
      ]);
      return { items, total };
    }

    case "contacts": {
      const where: Prisma.ContactWhereInput = {
        tenantId,
        ...(search
          ? { OR: searchOr(["firstName", "lastName", "email", "phone"], search) }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.contact.findMany({
          where,
          include: {
            company: { select: { id: true, name: true } },
            owner: { select: { id: true, name: true, email: true } },
          },
          orderBy: orderByFor(sort, ["createdAt", "lastName"], "createdAt:desc"),
          skip,
          take: limit,
        }),
        prisma.contact.count({ where }),
      ]);
      return { items, total };
    }

    case "companies": {
      const where: Prisma.CompanyWhereInput = {
        tenantId,
        ...(search
          ? { OR: searchOr(["name", "industry", "email", "phone"], search) }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.company.findMany({
          where,
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { contacts: true, opportunities: true } },
          },
          orderBy: orderByFor(sort, ["name", "createdAt"], "name:asc"),
          skip,
          take: limit,
        }),
        prisma.company.count({ where }),
      ]);
      return { items, total };
    }

    case "opportunities": {
      const where: Prisma.OpportunityWhereInput = {
        tenantId,
        ...(status
          ? { stage: status as Prisma.EnumOpportunityStageFilter["equals"] }
          : {}),
        ...(search ? { OR: searchOr(["name"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.opportunity.findMany({
          where,
          include: {
            company: { select: { id: true, name: true } },
            owner: { select: { id: true, name: true, email: true } },
          },
          orderBy: orderByFor(
            sort,
            ["createdAt", "amount", "expectedCloseDate", "stage"],
            "createdAt:desc",
          ),
          skip,
          take: limit,
        }),
        prisma.opportunity.count({ where }),
      ]);
      return { items, total };
    }

    case "projects": {
      const where: Prisma.ProjectWhereInput = {
        tenantId,
        ...(status ? { status } : {}),
        ...(search ? { OR: searchOr(["name", "description"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.project.findMany({
          where,
          include: { _count: { select: { milestones: true } } },
          orderBy: orderByFor(sort, ["createdAt", "name", "endDate"], "createdAt:desc"),
          skip,
          take: limit,
        }),
        prisma.project.count({ where }),
      ]);
      return { items, total };
    }

    case "tasks": {
      const where: Prisma.TaskWhereInput = {
        tenantId,
        ...(status ? { status: status as Prisma.EnumTaskStatusFilter["equals"] } : {}),
        ...(search ? { OR: searchOr(["title", "description"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: { assignee: { select: { id: true, name: true, email: true } } },
          orderBy: orderByFor(sort, ["createdAt", "dueDate", "status"], "createdAt:desc"),
          skip,
          take: limit,
        }),
        prisma.task.count({ where }),
      ]);
      return { items, total };
    }

    case "products": {
      const where: Prisma.ProductWhereInput = {
        tenantId,
        ...(search ? { OR: searchOr(["name", "sku", "description"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: orderByFor(sort, ["name", "price", "createdAt"], "name:asc"),
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);
      return { items, total };
    }

    case "quotations": {
      const where: Prisma.QuotationWhereInput = {
        tenantId,
        ...(status ? { status } : {}),
        ...(search ? { OR: searchOr(["quoteNumber", "notes"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.quotation.findMany({
          where,
          include: { _count: { select: { lines: true } } },
          orderBy: orderByFor(
            sort,
            ["createdAt", "total", "validUntil"],
            "createdAt:desc",
          ),
          skip,
          take: limit,
        }),
        prisma.quotation.count({ where }),
      ]);
      return { items, total };
    }

    case "sales-orders": {
      const where: Prisma.SalesOrderWhereInput = {
        tenantId,
        ...(status ? { status } : {}),
        ...(search ? { OR: searchOr(["orderNumber"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.salesOrder.findMany({
          where,
          include: { _count: { select: { lines: true } } },
          orderBy: orderByFor(sort, ["orderDate", "total", "status"], "orderDate:desc"),
          skip,
          take: limit,
        }),
        prisma.salesOrder.count({ where }),
      ]);
      return { items, total };
    }

    case "suppliers": {
      const where: Prisma.SupplierWhereInput = {
        tenantId,
        ...(search ? { OR: searchOr(["name", "email", "phone"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          include: { _count: { select: { purchaseOrders: true } } },
          orderBy: orderByFor(sort, ["name", "createdAt"], "name:asc"),
          skip,
          take: limit,
        }),
        prisma.supplier.count({ where }),
      ]);
      return { items, total };
    }

    case "purchase-orders": {
      const where: Prisma.PurchaseOrderWhereInput = {
        tenantId,
        ...(status ? { status } : {}),
        ...(search ? { OR: searchOr(["poNumber", "notes"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.purchaseOrder.findMany({
          where,
          include: {
            supplier: { select: { id: true, name: true } },
            _count: { select: { lines: true } },
          },
          orderBy: orderByFor(
            sort,
            ["orderDate", "total", "expectedDate"],
            "orderDate:desc",
          ),
          skip,
          take: limit,
        }),
        prisma.purchaseOrder.count({ where }),
      ]);
      return { items, total };
    }

    case "invoices": {
      const where: Prisma.InvoiceWhereInput = {
        tenantId,
        ...(status ? { status: status as Prisma.EnumInvoiceStatusFilter["equals"] } : {}),
        ...(search ? { OR: searchOr(["invoiceNumber", "notes"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: { _count: { select: { lines: true, payments: true } } },
          orderBy: orderByFor(sort, ["issueDate", "dueDate", "total"], "issueDate:desc"),
          skip,
          take: limit,
        }),
        prisma.invoice.count({ where }),
      ]);
      return { items, total };
    }

    case "payments": {
      const where: Prisma.PaymentWhereInput = {
        tenantId,
        ...(search ? { OR: searchOr(["reference", "paymentMethod", "notes"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: { invoice: { select: { id: true, invoiceNumber: true } } },
          orderBy: orderByFor(sort, ["paidAt", "createdAt"], "paidAt:desc"),
          skip,
          take: limit,
        }),
        prisma.payment.count({ where }),
      ]);
      return { items, total };
    }

    case "expenses": {
      const where: Prisma.ExpenseWhereInput = {
        tenantId,
        ...(status ? { status } : {}),
        ...(search
          ? { OR: searchOr(["description", "vendor", "category"], search) }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          orderBy: orderByFor(sort, ["expenseDate", "amount"], "expenseDate:desc"),
          skip,
          take: limit,
        }),
        prisma.expense.count({ where }),
      ]);
      return { items, total };
    }

    case "support-cases": {
      const where: Prisma.SupportCaseWhereInput = {
        tenantId,
        ...(status ? { status } : {}),
        ...(search ? { OR: searchOr(["subject", "description"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.supportCase.findMany({
          where,
          orderBy: orderByFor(sort, ["createdAt", "priority"], "createdAt:desc"),
          skip,
          take: limit,
        }),
        prisma.supportCase.count({ where }),
      ]);
      return { items, total };
    }

    case "warehouses": {
      const where: Prisma.WarehouseWhereInput = {
        tenantId,
        ...(search ? { OR: searchOr(["name", "code"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.warehouse.findMany({
          where,
          include: { _count: { select: { movements: true } } },
          orderBy: orderByFor(sort, ["name", "createdAt"], "name:asc"),
          skip,
          take: limit,
        }),
        prisma.warehouse.count({ where }),
      ]);
      return { items, total };
    }

    case "stock-movements": {
      const where: Prisma.StockMovementWhereInput = {
        tenantId,
        ...(status ? { type: status as Prisma.EnumStockMovementTypeFilter["equals"] } : {}),
        ...(search ? { OR: searchOr(["reason", "reference"], search) } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where,
          include: {
            product: { select: { id: true, name: true, sku: true } },
            warehouse: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: orderByFor(sort, ["createdAt"], "createdAt:desc"),
          skip,
          take: limit,
        }),
        prisma.stockMovement.count({ where }),
      ]);
      return { items, total };
    }
  }
}

export async function createRecord(params: {
  key: ResourceKey;
  tenantId: string;
  userId: string;
  input: unknown;
}) {
  const { key, tenantId, userId, input } = params;

  switch (key) {
    case "leads": {
      const data = createSchemas.leads.parse(input);
      const status = data.status ?? "NEW";
      const now = new Date();
      return prisma.lead.create({
        data: {
          tenantId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: blank(data.email),
          phone: blank(data.phone),
          companyName: blank(data.companyName),
          jobTitle: blank(data.jobTitle),
          industry: blank(data.industry),
          source: blank(data.source),
          status,
          ownerId: blank(data.ownerId),
          estimatedValue: toNumber(data.estimatedValue),
          currency: data.currency || "TZS",
          expectedConversionDate: toDate(data.expectedConversionDate),
          lastContactedAt: toDate(data.lastContactedAt),
          qualifiedAt: status === "QUALIFIED" ? now : null,
          convertedAt: status === "CONVERTED" ? now : null,
          lostReason: blank(data.lostReason),
          notes: blank(data.notes),
        },
      });
    }

    case "contacts": {
      const data = createSchemas.contacts.parse(input);
      return prisma.contact.create({
        data: {
          tenantId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: blank(data.email),
          phone: blank(data.phone),
          title: blank(data.title),
          status: data.status ?? "ACTIVE",
          ownerId: blank(data.ownerId),
          companyId: blank(data.companyId),
          lastContactedAt: toDate(data.lastContactedAt),
          notes: blank(data.notes),
        },
      });
    }

    case "companies": {
      const data = createSchemas.companies.parse(input);
      return prisma.company.create({
        data: {
          tenantId,
          name: data.name,
          industry: blank(data.industry),
          email: blank(data.email),
          phone: blank(data.phone),
          website: blank(data.website),
          size: blank(data.size),
          status: data.status ?? "ACTIVE",
          ownerId: blank(data.ownerId),
          notes: blank(data.notes),
        },
      });
    }

    case "opportunities": {
      const data = createSchemas.opportunities.parse(input);
      const stage = data.stage ?? "PROSPECTING";
      const closed = stage === "CLOSED_WON" || stage === "CLOSED_LOST";
      return prisma.$transaction(async (tx) => {
        const opportunity = await tx.opportunity.create({
          data: {
            tenantId,
            name: data.name,
            companyId: blank(data.companyId),
            stage,
            amount: toNumber(data.amount),
            currency: data.currency || "TZS",
            probability: 0,
            expectedCloseDate: toDate(data.expectedCloseDate),
            ownerId: blank(data.ownerId),
            description: blank(data.description),
            nextStep: blank(data.nextStep),
            lostReason: stage === "CLOSED_LOST" ? blank(data.lostReason) : null,
            wonReason: stage === "CLOSED_WON" ? blank(data.wonReason) : null,
            closedAt: closed ? new Date() : null,
            lastActivityAt: new Date(),
          },
        });

        await tx.opportunityStageEvent.create({
          data: {
            tenantId,
            opportunityId: opportunity.id,
            toStage: stage,
            amount: opportunity.amount,
            actorId: userId,
            source: "HUMAN",
          },
        });

        return opportunity;
      });
    }

    case "projects": {
      const data = createSchemas.projects.parse(input);
      return prisma.project.create({
        data: {
          tenantId,
          name: data.name,
          description: blank(data.description),
          status: data.status ?? "PLANNING",
          startDate: toDate(data.startDate),
          endDate: toDate(data.endDate),
          budget: toNumber(data.budget),
          currency: data.currency || "TZS",
        },
      });
    }

    case "tasks": {
      const data = createSchemas.tasks.parse(input);
      const status = data.status ?? "TODO";
      return prisma.task.create({
        data: {
          tenantId,
          title: data.title,
          description: blank(data.description),
          status,
          priority: data.priority ?? "MEDIUM",
          assigneeId: blank(data.assigneeId),
          dueDate: toDate(data.dueDate),
          completedAt: status === "DONE" ? new Date() : null,
          outcome: blank(data.outcome),
          relatedType: blank(data.relatedType),
          relatedId: blank(data.relatedId),
        },
      });
    }

    case "products": {
      const data = createSchemas.products.parse(input);
      return prisma.product.create({
        data: {
          tenantId,
          name: data.name,
          sku: blank(data.sku),
          description: blank(data.description),
          type: data.type ?? "PRODUCT",
          price: toNumber(data.price),
          currency: data.currency || "TZS",
          isActive: data.isActive ?? true,
        },
      });
    }

    case "quotations": {
      const data = createSchemas.quotations.parse(input);
      return prisma.quotation.create({
        data: {
          tenantId,
          quoteNumber: data.quoteNumber,
          opportunityId: blank(data.opportunityId),
          status: data.status ?? "DRAFT",
          validUntil: toDate(data.validUntil),
          subtotal: toNumber(data.subtotal) ?? 0,
          tax: toNumber(data.tax) ?? 0,
          total: toNumber(data.total) ?? 0,
          currency: data.currency || "TZS",
          notes: blank(data.notes),
        },
      });
    }

    case "sales-orders": {
      const data = createSchemas["sales-orders"].parse(input);
      return prisma.salesOrder.create({
        data: {
          tenantId,
          orderNumber: data.orderNumber,
          quotationId: blank(data.quotationId),
          status: data.status ?? "PENDING",
          orderDate: toDate(data.orderDate) ?? new Date(),
          subtotal: toNumber(data.subtotal) ?? 0,
          tax: toNumber(data.tax) ?? 0,
          total: toNumber(data.total) ?? 0,
          currency: data.currency || "TZS",
        },
      });
    }

    case "suppliers": {
      const data = createSchemas.suppliers.parse(input);
      return prisma.supplier.create({
        data: {
          tenantId,
          name: data.name,
          email: blank(data.email),
          phone: blank(data.phone),
          isActive: data.isActive ?? true,
        },
      });
    }

    case "purchase-orders": {
      const data = createSchemas["purchase-orders"].parse(input);
      const supplier = await prisma.supplier.findFirst({
        where: { id: data.supplierId, tenantId },
        select: { id: true },
      });
      if (!supplier) return { error: "Supplier not found in this workspace." } as const;

      return prisma.purchaseOrder.create({
        data: {
          tenantId,
          supplierId: data.supplierId,
          poNumber: data.poNumber,
          status: data.status ?? "DRAFT",
          orderDate: toDate(data.orderDate) ?? new Date(),
          expectedDate: toDate(data.expectedDate),
          subtotal: toNumber(data.subtotal) ?? 0,
          tax: toNumber(data.tax) ?? 0,
          total: toNumber(data.total) ?? 0,
          currency: data.currency || "TZS",
          notes: blank(data.notes),
        },
      });
    }

    case "invoices": {
      const data = createSchemas.invoices.parse(input);
      return prisma.invoice.create({
        data: {
          tenantId,
          invoiceNumber: data.invoiceNumber,
          salesOrderId: blank(data.salesOrderId),
          status: data.status ?? "DRAFT",
          issueDate: toDate(data.issueDate) ?? new Date(),
          dueDate: toDate(data.dueDate),
          subtotal: toNumber(data.subtotal) ?? 0,
          tax: toNumber(data.tax) ?? 0,
          total: data.total,
          amountPaid: 0,
          balance: data.total,
          currency: data.currency || "TZS",
          notes: blank(data.notes),
        },
      });
    }

    case "payments": {
      const data = createSchemas.payments.parse(input);
      const invoice = await prisma.invoice.findFirst({
        where: { id: data.invoiceId, tenantId },
      });
      if (!invoice) return { error: "Invoice not found in this workspace." } as const;
      if (invoice.status === "VOID" || invoice.status === "WRITTEN_OFF") {
        return { error: "Payments cannot be recorded against a void invoice." } as const;
      }

      const balance = Number(invoice.balance);
      if (data.amount > balance) {
        return {
          error: `The payment exceeds the outstanding balance of ${invoice.currency} ${balance.toLocaleString("en-GB")}.`,
        } as const;
      }

      return prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            tenantId,
            invoiceId: invoice.id,
            amount: data.amount,
            currency: data.currency || invoice.currency,
            paymentMethod: blank(data.paymentMethod),
            reference: blank(data.reference),
            paidAt: toDate(data.paidAt) ?? new Date(),
            notes: blank(data.notes),
          },
        });

        const newAmountPaid = Number(invoice.amountPaid) + data.amount;
        const newBalance = Math.max(0, Number(invoice.total) - newAmountPaid);

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: newAmountPaid,
            balance: newBalance,
            status: newBalance <= 0 ? "PAID" : "PARTIALLY_PAID",
          },
        });

        return payment;
      });
    }

    case "expenses": {
      const data = createSchemas.expenses.parse(input);
      return prisma.expense.create({
        data: {
          tenantId,
          description: data.description,
          amount: data.amount,
          currency: data.currency || "TZS",
          category: blank(data.category),
          vendor: blank(data.vendor),
          expenseDate: toDate(data.expenseDate) ?? new Date(),
          status: data.status ?? "PENDING",
          receiptUrl: blank(data.receiptUrl),
        },
      });
    }

    case "support-cases": {
      const data = createSchemas["support-cases"].parse(input);
      return prisma.supportCase.create({
        data: {
          tenantId,
          subject: data.subject,
          description: blank(data.description),
          status: data.status ?? "OPEN",
          priority: data.priority ?? "MEDIUM",
          assignedTo: blank(data.assignedTo),
        },
      });
    }

    case "warehouses": {
      const data = createSchemas.warehouses.parse(input);
      return prisma.warehouse.create({
        data: {
          tenantId,
          name: data.name,
          code: blank(data.code),
          isActive: data.isActive ?? true,
        },
      });
    }

    case "stock-movements": {
      const data = createSchemas["stock-movements"].parse(input);
      const warehouse = await prisma.warehouse.findFirst({
        where: { id: data.warehouseId, tenantId },
        select: { id: true },
      });
      if (!warehouse) return { error: "Warehouse not found in this workspace." } as const;

      if (data.productId) {
        const product = await prisma.product.findFirst({
          where: { id: data.productId, tenantId },
          select: { id: true },
        });
        if (!product) return { error: "Product not found in this workspace." } as const;
      }

      if (data.type !== "ADJUSTMENT" && data.quantity <= 0) {
        return { error: "Receipts and issues require a positive quantity." } as const;
      }

      if (data.type === "OUT" && data.productId) {
        const level = await stockLevelFor(tenantId, data.productId, data.warehouseId);
        if (data.quantity > level) {
          return {
            error: `Only ${level.toLocaleString("en-GB")} units are available at this warehouse.`,
          } as const;
        }
      }

      if (data.type === "ADJUSTMENT" && data.productId) {
        const level = await stockLevelFor(tenantId, data.productId, data.warehouseId);
        if (level + data.quantity < 0) {
          return {
            error: `The adjustment would reduce stock below zero (${level.toLocaleString("en-GB")} available).`,
          } as const;
        }
      }

      return prisma.stockMovement.create({
        data: {
          tenantId,
          productId: blank(data.productId),
          warehouseId: data.warehouseId,
          type: data.type,
          quantity: data.quantity,
          unitCost: toNumber(data.unitCost),
          reason: data.reason,
          reference: blank(data.reference),
          createdById: userId,
        },
      });
    }
  }
}

export async function updateRecord(params: {
  key: ResourceKey;
  tenantId: string;
  id: string;
  input: unknown;
}) {
  const { key, tenantId, id, input } = params;

  const owned = await recordExists(key, tenantId, id);
  if (!owned) return { error: "Record not found in this workspace." } as const;

  switch (key) {
    case "leads": {
      const data = updateSchemas.leads.parse(input);
      const existing = await prisma.lead.findFirst({
        where: { id, tenantId },
        select: { status: true, qualifiedAt: true, convertedAt: true },
      });
      if (!existing) return { error: "Record not found in this workspace." } as const;
      const now = new Date();
      return prisma.lead.update({
        where: { id },
        data: {
          ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
          ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
          ...(data.email !== undefined ? { email: blank(data.email) } : {}),
          ...(data.phone !== undefined ? { phone: blank(data.phone) } : {}),
          ...(data.companyName !== undefined
            ? { companyName: blank(data.companyName) }
            : {}),
          ...(data.jobTitle !== undefined ? { jobTitle: blank(data.jobTitle) } : {}),
          ...(data.industry !== undefined ? { industry: blank(data.industry) } : {}),
          ...(data.source !== undefined ? { source: blank(data.source) } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.ownerId !== undefined ? { ownerId: blank(data.ownerId) } : {}),
          ...(data.estimatedValue !== undefined
            ? { estimatedValue: toNumber(data.estimatedValue) }
            : {}),
          ...(data.currency !== undefined ? { currency: data.currency || "TZS" } : {}),
          ...(data.expectedConversionDate !== undefined
            ? { expectedConversionDate: toDate(data.expectedConversionDate) }
            : {}),
          ...(data.lastContactedAt !== undefined
            ? { lastContactedAt: toDate(data.lastContactedAt) }
            : {}),
          ...(data.lostReason !== undefined
            ? { lostReason: blank(data.lostReason) }
            : {}),
          ...(data.notes !== undefined ? { notes: blank(data.notes) } : {}),
          ...(data.status === "QUALIFIED" && !existing.qualifiedAt
            ? { qualifiedAt: now }
            : {}),
          ...(data.status === "CONVERTED" && !existing.convertedAt
            ? { convertedAt: now }
            : {}),
          ...(data.status === "LOST" ? { lostReason: blank(data.lostReason) } : {}),
        },
      });
    }

    case "contacts": {
      const data = updateSchemas.contacts.parse(input);
      return prisma.contact.update({
        where: { id },
        data: {
          ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
          ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
          ...(data.email !== undefined ? { email: blank(data.email) } : {}),
          ...(data.phone !== undefined ? { phone: blank(data.phone) } : {}),
          ...(data.title !== undefined ? { title: blank(data.title) } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.ownerId !== undefined ? { ownerId: blank(data.ownerId) } : {}),
          ...(data.companyId !== undefined ? { companyId: blank(data.companyId) } : {}),
          ...(data.lastContactedAt !== undefined
            ? { lastContactedAt: toDate(data.lastContactedAt) }
            : {}),
          ...(data.notes !== undefined ? { notes: blank(data.notes) } : {}),
        },
      });
    }

    case "companies": {
      const data = updateSchemas.companies.parse(input);
      return prisma.company.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.industry !== undefined ? { industry: blank(data.industry) } : {}),
          ...(data.email !== undefined ? { email: blank(data.email) } : {}),
          ...(data.phone !== undefined ? { phone: blank(data.phone) } : {}),
          ...(data.website !== undefined ? { website: blank(data.website) } : {}),
          ...(data.size !== undefined ? { size: blank(data.size) } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.ownerId !== undefined ? { ownerId: blank(data.ownerId) } : {}),
          ...(data.notes !== undefined ? { notes: blank(data.notes) } : {}),
        },
      });
    }

    case "opportunities": {
      const data = updateSchemas.opportunities.parse(input);
      const existing = await prisma.opportunity.findFirst({
        where: { id, tenantId },
        select: { stage: true, amount: true },
      });
      if (!existing) return { error: "Record not found in this workspace." } as const;
      const nextStage = data.stage ?? existing.stage;
      const closed = nextStage === "CLOSED_WON" || nextStage === "CLOSED_LOST";
      const stageChanged = data.stage !== undefined && data.stage !== existing.stage;

      return prisma.$transaction(async (tx) => {
        const record = await tx.opportunity.update({
          where: { id },
          data: {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.companyId !== undefined ? { companyId: blank(data.companyId) } : {}),
            ...(data.stage !== undefined ? { stage: data.stage } : {}),
            ...(data.amount !== undefined ? { amount: toNumber(data.amount) } : {}),
            ...(data.currency !== undefined ? { currency: data.currency || "TZS" } : {}),
            ...(data.expectedCloseDate !== undefined
              ? { expectedCloseDate: toDate(data.expectedCloseDate) }
              : {}),
            ...(data.ownerId !== undefined ? { ownerId: blank(data.ownerId) } : {}),
            ...(data.description !== undefined
              ? { description: blank(data.description) }
              : {}),
            ...(data.nextStep !== undefined ? { nextStep: blank(data.nextStep) } : {}),
            ...(data.lostReason !== undefined
              ? { lostReason: blank(data.lostReason) }
              : {}),
            ...(data.wonReason !== undefined
              ? { wonReason: blank(data.wonReason) }
              : {}),
            ...(stageChanged
              ? {
                  stageChangedAt: new Date(),
                  lastActivityAt: new Date(),
                  closedAt: closed ? new Date() : null,
                }
              : {}),
          },
        });

        if (stageChanged) {
          await tx.opportunityStageEvent.create({
            data: {
              tenantId,
              opportunityId: record.id,
              fromStage: existing.stage,
              toStage: nextStage,
              amount: record.amount,
              actorId: null,
              source: "HUMAN",
            },
          });
        }

        return record;
      });
    }

    case "projects": {
      const data = updateSchemas.projects.parse(input);
      return prisma.project.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined
            ? { description: blank(data.description) }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.startDate !== undefined ? { startDate: toDate(data.startDate) } : {}),
          ...(data.endDate !== undefined ? { endDate: toDate(data.endDate) } : {}),
          ...(data.budget !== undefined ? { budget: toNumber(data.budget) } : {}),
          ...(data.currency !== undefined ? { currency: data.currency || "TZS" } : {}),
        },
      });
    }

    case "tasks": {
      const data = updateSchemas.tasks.parse(input);
      const existing = await prisma.task.findFirst({
        where: { id, tenantId },
        select: { status: true, completedAt: true },
      });
      if (!existing) return { error: "Record not found in this workspace." } as const;
      const completed = data.status === "DONE";
      return prisma.task.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined
            ? { description: blank(data.description) }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.priority !== undefined ? { priority: data.priority } : {}),
          ...(data.assigneeId !== undefined ? { assigneeId: blank(data.assigneeId) } : {}),
          ...(data.dueDate !== undefined ? { dueDate: toDate(data.dueDate) } : {}),
          ...(data.relatedType !== undefined
            ? { relatedType: blank(data.relatedType) }
            : {}),
          ...(data.relatedId !== undefined ? { relatedId: blank(data.relatedId) } : {}),
          ...(data.outcome !== undefined ? { outcome: blank(data.outcome) } : {}),
          ...(completed && !existing.completedAt
            ? { completedAt: new Date() }
            : data.status !== undefined && !completed
              ? { completedAt: null }
              : {}),
        },
      });
    }

    case "products": {
      const data = updateSchemas.products.parse(input);
      return prisma.product.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.sku !== undefined ? { sku: blank(data.sku) } : {}),
          ...(data.description !== undefined
            ? { description: blank(data.description) }
            : {}),
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.price !== undefined ? { price: toNumber(data.price) } : {}),
          ...(data.currency !== undefined ? { currency: data.currency || "TZS" } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
    }

    case "quotations": {
      const data = updateSchemas.quotations.parse(input);
      const lineTotals = await prisma.quotationLine.aggregate({
        where: { quotationId: id },
        _sum: { total: true },
        _count: { _all: true },
      });
      const hasLines = lineTotals._count._all > 0;
      const current = hasLines
        ? await prisma.quotation.findUnique({
            where: { id },
            select: { tax: true },
          })
        : null;
      const subtotal = Number(lineTotals._sum.total ?? 0);
      const tax =
        data.tax !== undefined ? (toNumber(data.tax) ?? 0) : Number(current?.tax ?? 0);

      return prisma.quotation.update({
        where: { id },
        data: {
          ...(data.quoteNumber !== undefined ? { quoteNumber: data.quoteNumber } : {}),
          ...(data.opportunityId !== undefined
            ? { opportunityId: blank(data.opportunityId) }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.validUntil !== undefined ? { validUntil: toDate(data.validUntil) } : {}),
          ...(hasLines
            ? { subtotal, total: round2(subtotal + tax) }
            : {
                ...(data.subtotal !== undefined
                  ? { subtotal: toNumber(data.subtotal) ?? 0 }
                  : {}),
                ...(data.total !== undefined
                  ? { total: toNumber(data.total) ?? 0 }
                  : {}),
              }),
          ...(data.tax !== undefined ? { tax: toNumber(data.tax) ?? 0 } : {}),
          ...(data.currency !== undefined ? { currency: data.currency || "TZS" } : {}),
          ...(data.notes !== undefined ? { notes: blank(data.notes) } : {}),
        },
      });
    }

    case "sales-orders": {
      const data = updateSchemas["sales-orders"].parse(input);
      const lineTotals = await prisma.salesOrderLine.aggregate({
        where: { salesOrderId: id },
        _sum: { total: true },
        _count: { _all: true },
      });
      const hasLines = lineTotals._count._all > 0;
      const current = hasLines
        ? await prisma.salesOrder.findUnique({
            where: { id },
            select: { tax: true },
          })
        : null;
      const subtotal = Number(lineTotals._sum.total ?? 0);
      const tax =
        data.tax !== undefined ? (toNumber(data.tax) ?? 0) : Number(current?.tax ?? 0);

      return prisma.salesOrder.update({
        where: { id },
        data: {
          ...(data.orderNumber !== undefined ? { orderNumber: data.orderNumber } : {}),
          ...(data.quotationId !== undefined
            ? { quotationId: blank(data.quotationId) }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.orderDate !== undefined
            ? { orderDate: toDate(data.orderDate) ?? new Date() }
            : {}),
          ...(hasLines
            ? { subtotal, total: round2(subtotal + tax) }
            : {
                ...(data.subtotal !== undefined
                  ? { subtotal: toNumber(data.subtotal) ?? 0 }
                  : {}),
                ...(data.total !== undefined
                  ? { total: toNumber(data.total) ?? 0 }
                  : {}),
              }),
          ...(data.tax !== undefined ? { tax: toNumber(data.tax) ?? 0 } : {}),
          ...(data.currency !== undefined ? { currency: data.currency || "TZS" } : {}),
        },
      });
    }

    case "suppliers": {
      const data = updateSchemas.suppliers.parse(input);
      return prisma.supplier.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.email !== undefined ? { email: blank(data.email) } : {}),
          ...(data.phone !== undefined ? { phone: blank(data.phone) } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
    }

    case "purchase-orders": {
      const data = updateSchemas["purchase-orders"].parse(input);
      if (data.supplierId) {
        const supplier = await prisma.supplier.findFirst({
          where: { id: data.supplierId, tenantId },
          select: { id: true },
        });
        if (!supplier) return { error: "Supplier not found in this workspace." } as const;
      }

      const lineTotals = await prisma.purchaseOrderLine.aggregate({
        where: { purchaseOrderId: id },
        _sum: { total: true },
        _count: { _all: true },
      });
      const hasLines = lineTotals._count._all > 0;
      const current = hasLines
        ? await prisma.purchaseOrder.findUnique({
            where: { id },
            select: { tax: true },
          })
        : null;
      const subtotal = Number(lineTotals._sum.total ?? 0);
      const tax =
        data.tax !== undefined ? (toNumber(data.tax) ?? 0) : Number(current?.tax ?? 0);

      return prisma.purchaseOrder.update({
        where: { id },
        data: {
          ...(data.poNumber !== undefined ? { poNumber: data.poNumber } : {}),
          ...(data.supplierId !== undefined ? { supplierId: data.supplierId } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.orderDate !== undefined
            ? { orderDate: toDate(data.orderDate) ?? new Date() }
            : {}),
          ...(data.expectedDate !== undefined
            ? { expectedDate: toDate(data.expectedDate) }
            : {}),
          ...(hasLines
            ? { subtotal, total: round2(subtotal + tax) }
            : {
                ...(data.subtotal !== undefined
                  ? { subtotal: toNumber(data.subtotal) ?? 0 }
                  : {}),
                ...(data.total !== undefined
                  ? { total: toNumber(data.total) ?? 0 }
                  : {}),
              }),
          ...(data.tax !== undefined ? { tax: toNumber(data.tax) ?? 0 } : {}),
          ...(data.currency !== undefined ? { currency: data.currency || "TZS" } : {}),
          ...(data.notes !== undefined ? { notes: blank(data.notes) } : {}),
        },
      });
    }

    case "invoices": {
      const data = updateSchemas.invoices.parse(input);
      const existing = await prisma.invoice.findFirst({
        where: { id, tenantId },
        select: { amountPaid: true, total: true, tax: true, status: true },
      });
      if (!existing) return { error: "Record not found in this workspace." } as const;

      const lineTotals = await prisma.invoiceLine.aggregate({
        where: { invoiceId: id },
        _sum: { total: true },
        _count: { _all: true },
      });
      const hasLines = lineTotals._count._all > 0;
      const subtotal = Number(lineTotals._sum.total ?? 0);
      const tax =
        data.tax !== undefined ? (toNumber(data.tax) ?? 0) : Number(existing.tax);
      const total = hasLines
        ? round2(subtotal + tax)
        : (data.total ?? Number(existing.total));
      const amountPaid = Number(existing.amountPaid);
      if (total < amountPaid) {
        return {
          error: "The invoice total cannot be lower than payments already recorded.",
        } as const;
      }

      const balance = round2(total - amountPaid);
      const derivedStatus =
        balance <= 0 && total > 0
          ? "PAID"
          : amountPaid > 0
            ? "PARTIALLY_PAID"
            : existing.status;

      return prisma.invoice.update({
        where: { id },
        data: {
          ...(data.invoiceNumber !== undefined
            ? { invoiceNumber: data.invoiceNumber }
            : {}),
          ...(data.salesOrderId !== undefined
            ? { salesOrderId: blank(data.salesOrderId) }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.issueDate !== undefined
            ? { issueDate: toDate(data.issueDate) ?? new Date() }
            : {}),
          ...(data.dueDate !== undefined ? { dueDate: toDate(data.dueDate) } : {}),
          ...(hasLines
            ? { subtotal }
            : data.subtotal !== undefined
              ? { subtotal: toNumber(data.subtotal) ?? 0 }
              : {}),
          ...(data.tax !== undefined ? { tax: toNumber(data.tax) ?? 0 } : {}),
          ...(data.total !== undefined || hasLines ? { total } : {}),
          ...(data.currency !== undefined ? { currency: data.currency || "TZS" } : {}),
          ...(data.notes !== undefined ? { notes: blank(data.notes) } : {}),
          ...(data.total !== undefined || hasLines
            ? {
                balance,
                status:
                  data.status !== undefined &&
                  data.status !== "VOID" &&
                  data.status !== "WRITTEN_OFF"
                    ? derivedStatus
                    : (data.status ?? existing.status),
              }
            : {}),
        },
      });
    }

    case "payments":
      return { error: "Recorded payments are immutable." } as const;

    case "expenses": {
      const data = updateSchemas.expenses.parse(input);
      return prisma.expense.update({
        where: { id },
        data: {
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.amount !== undefined ? { amount: data.amount } : {}),
          ...(data.currency !== undefined ? { currency: data.currency || "TZS" } : {}),
          ...(data.category !== undefined ? { category: blank(data.category) } : {}),
          ...(data.vendor !== undefined ? { vendor: blank(data.vendor) } : {}),
          ...(data.expenseDate !== undefined
            ? { expenseDate: toDate(data.expenseDate) ?? new Date() }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.receiptUrl !== undefined ? { receiptUrl: blank(data.receiptUrl) } : {}),
        },
      });
    }

    case "support-cases": {
      const data = updateSchemas["support-cases"].parse(input);
      return prisma.supportCase.update({
        where: { id },
        data: {
          ...(data.subject !== undefined ? { subject: data.subject } : {}),
          ...(data.description !== undefined
            ? { description: blank(data.description) }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.priority !== undefined ? { priority: data.priority } : {}),
          ...(data.assignedTo !== undefined ? { assignedTo: blank(data.assignedTo) } : {}),
        },
      });
    }

    case "warehouses": {
      const data = updateSchemas.warehouses.parse(input);
      return prisma.warehouse.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.code !== undefined ? { code: blank(data.code) } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
    }

    case "stock-movements":
      return { error: "Stock movements are immutable." } as const;
  }
}

export async function deleteRecord(params: {
  key: ResourceKey;
  tenantId: string;
  id: string;
}) {
  const { key, tenantId, id } = params;
  const owned = await recordExists(key, tenantId, id);
  if (!owned) return { error: "Record not found in this workspace." } as const;

  try {
    switch (key) {
      case "leads":
        await prisma.lead.delete({ where: { id } });
        return { ok: true } as const;
      case "contacts":
        await prisma.contact.delete({ where: { id } });
        return { ok: true } as const;
      case "companies":
        await prisma.company.delete({ where: { id } });
        return { ok: true } as const;
      case "opportunities":
        await prisma.opportunity.delete({ where: { id } });
        return { ok: true } as const;
      case "projects":
        await prisma.project.delete({ where: { id } });
        return { ok: true } as const;
      case "tasks":
        await prisma.task.delete({ where: { id } });
        return { ok: true } as const;
      case "products":
        await prisma.product.delete({ where: { id } });
        return { ok: true } as const;
      case "quotations":
        await prisma.quotation.delete({ where: { id } });
        return { ok: true } as const;
      case "suppliers":
        await prisma.supplier.delete({ where: { id } });
        return { ok: true } as const;
      default:
        return { error: "This record type cannot be deleted." } as const;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return {
          error:
            "This record is referenced by other records. Deactivate it or remove the references first.",
        } as const;
      }
      if (error.code === "P2025") {
        return { error: "Record not found in this workspace." } as const;
      }
    }
    throw error;
  }
}

async function recordExists(key: ResourceKey, tenantId: string, id: string) {
  switch (key) {
    case "leads":
      return prisma.lead.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "contacts":
      return prisma.contact.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "companies":
      return prisma.company.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "opportunities":
      return prisma.opportunity.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "projects":
      return prisma.project.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "tasks":
      return prisma.task.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "products":
      return prisma.product.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "quotations":
      return prisma.quotation.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "sales-orders":
      return prisma.salesOrder.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "suppliers":
      return prisma.supplier.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "purchase-orders":
      return prisma.purchaseOrder.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "invoices":
      return prisma.invoice.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "payments":
      return prisma.payment.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "expenses":
      return prisma.expense.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "support-cases":
      return prisma.supportCase.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "warehouses":
      return prisma.warehouse.findFirst({ where: { id, tenantId }, select: { id: true } });
    case "stock-movements":
      return prisma.stockMovement.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
  }
}

async function stockLevelFor(tenantId: string, productId: string, warehouseId: string) {
  const movements = await prisma.stockMovement.findMany({
    where: { tenantId, productId, warehouseId },
    select: { type: true, quantity: true },
  });

  return movements.reduce((total, movement) => {
    const quantity = Number(movement.quantity);
    if (movement.type === "IN") return total + quantity;
    if (movement.type === "OUT") return total - quantity;
    return total + quantity;
  }, 0);
}

export type StockLevelRow = {
  productId: string | null;
  productName: string;
  sku: string | null;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
};

/** Derives current stock per product and warehouse from immutable movements. */
export async function getStockLevels(tenantId: string): Promise<StockLevelRow[]> {
  const movements = await prisma.stockMovement.findMany({
    where: { tenantId },
    select: {
      type: true,
      quantity: true,
      productId: true,
      warehouseId: true,
      product: { select: { name: true, sku: true } },
      warehouse: { select: { name: true } },
    },
  });

  const levels = new Map<string, StockLevelRow>();

  for (const movement of movements) {
    const mapKey = `${movement.productId ?? "none"}::${movement.warehouseId}`;
    const existing = levels.get(mapKey) ?? {
      productId: movement.productId,
      productName: movement.product?.name ?? "Unassigned product",
      sku: movement.product?.sku ?? null,
      warehouseId: movement.warehouseId,
      warehouseName: movement.warehouse.name,
      quantity: 0,
    };

    const quantity = Number(movement.quantity);
    if (movement.type === "IN") existing.quantity += quantity;
    else if (movement.type === "OUT") existing.quantity -= quantity;
    else existing.quantity += quantity;

    levels.set(mapKey, existing);
  }

  return [...levels.values()].sort(
    (a, b) =>
      a.productName.localeCompare(b.productName) ||
      a.warehouseName.localeCompare(b.warehouseName),
  );
}

export function resourceDefinition(key: ResourceKey) {
  return RESOURCES[key];
}
