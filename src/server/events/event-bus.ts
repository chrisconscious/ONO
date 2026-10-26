import type { Prisma, WorkflowTriggerEvent } from "@prisma/client";

/**
 * Central domain-event bus. Services publish typed events after their
 * transaction commits (outbox-style). The automation engine installs itself
 * as the dispatcher. Handlers must be idempotent — the same event may be
 * delivered more than once on retry.
 */
export interface DomainEvent {
  tenantId: string;
  actorUserId: string | null;
  membershipId?: string | null;
  /** Stable unique id per occurrence — used for dedupe/loop guards. */
  eventId: string;
}

export interface LeadCreatedEvent extends DomainEvent {
  name: "lead.created";
  lead: Prisma.LeadGetPayload<object>;
}

export interface LeadQualifiedEvent extends DomainEvent {
  name: "lead.qualified";
  lead: Prisma.LeadGetPayload<object>;
}

export interface OpportunityStageChangedEvent extends DomainEvent {
  name: "opportunity.stage_changed";
  opportunityId: string;
  from: string;
  to: string;
}

export interface OrderConfirmedEvent extends DomainEvent {
  name: "order.confirmed";
  orderId: string;
  orderNumber: string;
  total: Prisma.Decimal;
}

export interface StockReorderAlertEvent extends DomainEvent {
  name: "stock.reorder_alert";
  productId: string;
  productSku: string;
  warehouseId: string;
  quantityOnHand: Prisma.Decimal;
  reorderPoint: number;
}

export interface InvoiceIssuedEvent extends DomainEvent {
  name: "invoice.issued";
  invoiceId: string;
  invoiceNumber: string;
  total: Prisma.Decimal;
}

export interface ApprovalDecidedEvent extends DomainEvent {
  name: "approval.decided";
  approvalId: string;
  entityType: string;
  entityId: string;
  decision: "APPROVED" | "REJECTED";
}

export type AnyDomainEvent =
  | LeadCreatedEvent
  | LeadQualifiedEvent
  | OpportunityStageChangedEvent
  | OrderConfirmedEvent
  | StockReorderAlertEvent
  | InvoiceIssuedEvent
  | ApprovalDecidedEvent;

type Handler = (event: AnyDomainEvent) => Promise<void>;

const handlers: Array<{ match: (e: AnyDomainEvent) => boolean; handler: Handler }> = [];

export function onEvent(name: AnyDomainEvent["name"], handler: Handler): void {
  handlers.push({ match: (e) => e.name === name, handler });
}

/** Maps a domain event name onto the persisted workflow trigger enum. */
export const EVENT_TO_TRIGGER: Record<AnyDomainEvent["name"], WorkflowTriggerEvent> = {
  "lead.created": "LEAD_CREATED",
  "lead.qualified": "LEAD_QUALIFIED",
  "opportunity.stage_changed": "OPPORTUNITY_STAGE_CHANGED",
  "order.confirmed": "ORDER_CONFIRMED",
  "stock.reorder_alert": "STOCK_REORDER_ALERT",
  "invoice.issued": "INVOICE_ISSUED",
  "approval.decided": "APPROVAL_DECIDED",
};

let dispatcher: ((event: AnyDomainEvent) => Promise<void>) | null = null;

/** The automation engine installs itself as the dispatcher at startup. */
export function setEventDispatcher(fn: (event: AnyDomainEvent) => Promise<void>): void {
  dispatcher = fn;
}

/**
 * Publish an event. MUST be called after the producing transaction commits.
 * Publishing never throws into business code — automation failures are logged
 * and recorded in workflow_runs so they can be inspected/retried manually.
 */
export async function publish(event: AnyDomainEvent): Promise<void> {
  try {
    if (dispatcher) await dispatcher(event);
    for (const { match, handler } of handlers) {
      if (match(event)) await handler(event);
    }
  } catch (error) {
    console.error(`Event delivery failure (${event.name}, ${event.eventId}):`, error);
  }
}

/** Test helper: clear all handlers/dispatcher between suites. */
export function __resetEventBus(): void {
  handlers.length = 0;
  dispatcher = null;
}
