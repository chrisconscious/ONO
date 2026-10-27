/**
 * Structured logging with request correlation.
 *
 * Emits single-line JSON records to stdout so any log collector (Docker,
 * systemd journald, hosted aggregators) can parse them without extra agents.
 * Every record passes through the redaction layer first — secrets must never
 * reach stdout, error reports, or third-party log pipelines.
 *
 * Correlation IDs let operators connect one user action across API requests,
 * background jobs, and domain events. The active id is carried in an
 * AsyncLocalStorage context so nested async calls inherit it automatically.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { redactObject, redactString } from "./redact";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

interface RequestContext {
  correlationId: string;
  tenantId?: string;
}

const store = new AsyncLocalStorage<RequestContext>();

/** Run a function with a fresh (or supplied) correlation id for this async chain. */
export function withCorrelation<T>(
  fn: () => T,
  opts?: { correlationId?: string; tenantId?: string },
): T {
  return store.run(
    { correlationId: opts?.correlationId ?? randomUUID(), tenantId: opts?.tenantId },
    fn,
  );
}

/** Current correlation id, or undefined outside a tracked context. */
export function currentCorrelationId(): string | undefined {
  return store.getStore()?.correlationId;
}

/** Bind a tenant to the active correlation context (for tenant-safe logs). */
export function setLogTenant(tenantId: string): void {
  const ctx = store.getStore();
  if (ctx) ctx.tenantId = tenantId;
}

// Minimum level controlled by LOG_LEVEL env var; defaults to "info".
function minLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  return raw === "debug" || raw === "warn" || raw === "error" ? (raw as LogLevel) : "info";
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function emit(level: LogLevel, msg: string, fields?: LogFields): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel()]) return;
  const ctx = store.getStore();
  const record = {
    ts: new Date().toISOString(),
    level,
    msg: redactString(msg),
    ...(ctx ? { correlationId: ctx.correlationId, tenantId: ctx.tenantId } : {}),
    ...redactObject(fields ?? {}),
  };
  const line = JSON.stringify(record);
  if (level === "error") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}

export const logger = {
  debug: (msg: string, fields?: LogFields) => emit("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => emit("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => emit("warn", msg, fields),
  error: (msg: string, error?: unknown, fields?: LogFields) =>
    emit("error", msg, {
      ...fields,
      // Never serialize arbitrary error objects blindly — message/stack only.
      ...(error instanceof Error
        ? { errName: error.name, errMessage: redactString(error.message) }
        : error !== undefined
          ? { err: redactString(String(error)) }
          : {}),
    }),
};
