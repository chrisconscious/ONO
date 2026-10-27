"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiClientError } from "@/lib/api/client";
import { useWorkspaceBootstrap } from "@/components/shared/use-workspace";

interface Member {
  membershipId: string;
  role: string;
  isActive: boolean;
  user: { email: string; name: string | null };
}
interface Roster { members: Member[]; invitations: Array<{ id: string; email: string; role: string }> }

/**
 * Organization roster loaded from GET /api/v1/members. The tenant is resolved
 * server-side from the session — this page cannot point at another org.
 */
export default function MembersPage() {
  const workspace = useWorkspaceBootstrap();
  const [roster, setRoster] = useState<Roster | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace.tenantId || !workspace.can("org.members.manage")) return;
    let cancelled = false;
    api.get<Roster>("/api/v1/members")
      .then((r) => { if (!cancelled) setRoster(r); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiClientError ? err.message : "Failed to load members.");
      });
    return () => { cancelled = true; };
  }, [workspace.tenantId, workspace.permissions]);

  if (!workspace.can("org.members.manage")) {
    return (
      <Card role="alert" className="mx-auto max-w-md">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          You do not have permission to manage organization members.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">People with access to {workspace.current?.tenant.name ?? "this organization"}.</p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!roster && !error ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : roster ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Active members ({roster.members.length})</CardTitle></CardHeader>
          <CardContent>
            {roster.members.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No member records.</p>
            ) : (
              <ul className="divide-y">
                {roster.members.map((m) => (
                  <li key={m.membershipId} className="flex items-center justify-between py-3 text-sm">
                    <span>
                      <span className="font-medium">{m.user.name ?? m.user.email}</span>
                      {m.user.name && <span className="ml-2 text-muted-foreground">{m.user.email}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">{m.role}</Badge>
                      {!m.isActive && <Badge variant="outline">inactive</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {roster.invitations.length > 0 && (
              <>
                <h3 className="mt-6 mb-2 text-sm font-semibold">Pending invitations</h3>
                <ul className="divide-y text-sm">
                  {roster.invitations.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">{inv.email}</span>
                      <Badge variant="outline">{inv.role}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
