"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ReceiptText,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { api } from "@/lib/api/client";
import { useWorkspaceBootstrap } from "@/components/shared/use-workspace";
import type { Permission } from "@/lib/permissions/rbac";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Tenant permission required to see this item (server re-checks every call). */
  permission: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "analytics.read" },
  { href: "/crm/leads", label: "Leads", icon: Users, permission: "crm.read" },
  { href: "/crm/opportunities", label: "Opportunities", icon: BarChart3, permission: "sales.read" },
  { href: "/inventory/products", label: "Products", icon: Package, permission: "inventory.read" },
  { href: "/finance/invoices", label: "Invoices", icon: ReceiptText, permission: "finance.read" },
  { href: "/settings/members", label: "Members", icon: Settings, permission: "org.members.manage" },
];

/**
 * Permission-aware tenant application shell: sidebar (desktop), sheet drawer
 * (mobile), organization switcher, and user menu. Navigation visibility is a
 * usability concern only — the API independently authorizes every request.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const workspace = useWorkspaceBootstrap();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => workspace.can(item.permission));

  async function handleLogout() {
    // Server revokes the session row and clears the HttpOnly cookie.
    await api.post("/api/v1/auth/logout", {}, { tenantScoped: false });
    window.location.href = "/login";
  }

  const sidebarContent = (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="size-4" />
        </div>
        <span className="font-semibold">ClickIT</span>
      </div>

      {/* Organization switcher — lists ONLY the caller's server-provided memberships. */}
      {workspace.data && workspace.data.memberships.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-normal">
              <span className="truncate">
                {workspace.current?.tenant.name ?? "Select organization"}
              </span>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>Your organizations</DropdownMenuLabel>
            {workspace.data.memberships.map((m) => (
              <DropdownMenuItem
                key={m.tenantId}
                onSelect={() => workspace.switchTenant(m.tenantId)}
                className={cn(m.tenantId === workspace.tenantId && "bg-accent")}
              >
                <span className="truncate">{m.tenant.name}</span>
                <Badge variant="secondary" className="ml-auto capitalize">
                  {m.role.toLowerCase()}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        {workspace.isPlatformAdmin && (
          <Link
            href="/admin/overview"
            className="mt-2 flex items-center gap-3 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Settings className="size-4" />
            Platform admin
          </Link>
        )}
      </nav>

      <div className="border-t pt-3">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-svh">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card lg:block">{sidebarContent}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <span className="font-semibold">ClickIT</span>
          {workspace.current && (
            <Badge variant="outline" className="ml-auto truncate max-w-40">
              {workspace.current.tenant.name}
            </Badge>
          )}
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

