"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError, getStoredTenantId, setStoredTenantId } from "@/lib/api/client";
import { permissionsForRole, type MemberRole, type Permission } from "@/lib/permissions/rbac";

export interface WorkspaceMembership {
  tenantId: string;
  role: MemberRole;
  tenant: { id: string; name: string; slug: string; provisioningStatus: string };
}

export interface BootstrapPayload {
  user: { id: string; email: string; name: string | null };
  platformAdmin: boolean;
  memberships: WorkspaceMembership[];
}

/**
 * Loads the caller's workspaces once per mount and exposes permission-aware
 * helpers. Permissions are derived from the server-provided role using the
 * SAME shared RBAC map the backend uses — this is display filtering only;
 * every request remains independently authorized server-side.
 */
export function useWorkspaceBootstrap() {
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // The bootstrap endpoint is session-authenticated and tenant-agnostic,
        // so it works before any workspace has been selected.
        const payload = await api.get<BootstrapPayload>("/api/v1/bootstrap", undefined, {
          tenantScoped: false,
        });
        if (cancelled) return;
        setData(payload);

        const stored = getStoredTenantId();
        const valid = payload.memberships.some((m) => m.tenantId === stored);
        if (valid && stored) {
          setTenantIdState(stored);
        } else if (payload.memberships.length > 0) {
          // Auto-select the first active membership when none/stale selection.
          setStoredTenantId(payload.memberships[0].tenantId);
          setTenantIdState(payload.memberships[0].tenantId);
        } else {
          setError("no_workspace");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : "Failed to load workspace");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const switchTenant = useCallback((id: string) => {
    setStoredTenantId(id);
    setTenantIdState(id);
    // Full reload keeps every server-derived view consistent with the new scope.
    window.location.reload();
  }, []);

  const current = data?.memberships.find((m) => m.tenantId === tenantId) ?? null;
  const permissions: ReadonlySet<Permission> = current
    ? permissionsForRole(current.role)
    : new Set<Permission>();

  return {
    data,
    loading,
    error,
    tenantId,
    current,
    permissions,
    can: (permission: Permission) => permissions.has(permission),
    switchTenant,
    isPlatformAdmin: data?.platformAdmin ?? false,
  };
}
