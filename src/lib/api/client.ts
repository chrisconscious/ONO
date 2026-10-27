/**
 * Browser-side API client for the v1 REST endpoints.
 *
 * Security notes:
 * - The session token lives ONLY in an HttpOnly cookie set by the server;
 *   this client never handles or stores credentials in JS-visible storage.
 * - X-Tenant-Id is a routing hint, not an authorization mechanism: the
 *   server re-validates membership and derives roles per request. A wrong
 *   value simply produces 403 — it can never grant access.
 */

const TENANT_STORAGE_KEY = "ono.tenantId";

export function getStoredTenantId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TENANT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredTenantId(tenantId: string): void {
  try {
    window.localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
  } catch {
    // Storage may be unavailable (private mode); the app falls back to
    // asking the user to pick a workspace again.
  }
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Send the current tenant header (default true). Disable for public/auth endpoints. */
  tenantScoped?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.tenantScoped !== false) {
    const tenantId = getStoredTenantId();
    if (tenantId) headers["X-Tenant-Id"] = tenantId;
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "same-origin",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON error bodies (proxies etc.) are handled by status below.
  }

  if (!response.ok) {
    const record = (payload ?? {}) as { error?: { code?: string; message?: string; details?: unknown } };
    throw new ApiClientError(
      response.status,
      record.error?.code ?? "unknown_error",
      record.error?.message ?? `Request failed with status ${response.status}`,
      record.error?.details,
    );
  }

  // Server list/detail envelope is { data: ... }; unwrap for callers.
  const record = (payload ?? {}) as { data?: T };
  return (record.data ?? (payload as T)) as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"], opts?: Partial<RequestOptions>) =>
    request<T>(path, { method: "GET", query, ...opts }),
  post: <T>(path: string, body?: unknown, opts?: Partial<RequestOptions>) =>
    request<T>(path, { method: "POST", body, ...opts }),
  patch: <T>(path: string, body?: unknown, opts?: Partial<RequestOptions>) =>
    request<T>(path, { method: "PATCH", body, ...opts }),
  delete: <T>(path: string, opts?: Partial<RequestOptions>) =>
    request<T>(path, { method: "DELETE", ...opts }),
};
