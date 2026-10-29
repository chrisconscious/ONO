/**
 * Shared metadata for the priced documents that support line items.
 *
 * This module is safe to import from client components: it contains only
 * presentation metadata. All calculations and tenant checks happen on the
 * server in `document-lines.service.ts`.
 */
export const DOCUMENT_KEYS = [
  "quotations",
  "sales-orders",
  "purchase-orders",
  "invoices",
] as const;

export type DocumentKey = (typeof DOCUMENT_KEYS)[number];

export type DocumentConfig = {
  key: DocumentKey;
  path: string;
  title: string;
  singular: string;
  numberLabel: string;
  lineLabel: string;
  /** Whether a line may reference a catalogue product. */
  supportsProduct: boolean;
  /** Whether the document tracks customer receipts. */
  tracksPayments: boolean;
};

export const DOCUMENTS: Record<DocumentKey, DocumentConfig> = {
  quotations: {
    key: "quotations",
    path: "/app/quotations",
    title: "Quotation",
    singular: "quotation",
    numberLabel: "Quote number",
    lineLabel: "Quote line",
    supportsProduct: true,
    tracksPayments: false,
  },
  "sales-orders": {
    key: "sales-orders",
    path: "/app/sales-orders",
    title: "Sales order",
    singular: "sales order",
    numberLabel: "Order number",
    lineLabel: "Order line",
    supportsProduct: true,
    tracksPayments: false,
  },
  "purchase-orders": {
    key: "purchase-orders",
    path: "/app/purchase-orders",
    title: "Purchase order",
    singular: "purchase order",
    numberLabel: "PO number",
    lineLabel: "PO line",
    supportsProduct: true,
    tracksPayments: false,
  },
  invoices: {
    key: "invoices",
    path: "/app/invoices",
    title: "Invoice",
    singular: "invoice",
    numberLabel: "Invoice number",
    lineLabel: "Invoice line",
    supportsProduct: false,
    tracksPayments: true,
  },
};

export function isDocumentKey(value: string): value is DocumentKey {
  return (DOCUMENT_KEYS as readonly string[]).includes(value);
}
