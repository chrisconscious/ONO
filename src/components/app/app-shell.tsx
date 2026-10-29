"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ActivityIcon,
  ArrowLeftRightIcon,
  BanknoteIcon,
  BarChart3Icon,
  BoxesIcon,
  Building2Icon,
  ChevronDownIcon,
  ClipboardListIcon,
  ContactIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderKanbanIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  GaugeIcon,
  KanbanIcon,
  Loader2Icon,
  MenuIcon,
  MessageSquareQuoteIcon,
  PackageIcon,
  ReceiptIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TargetIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
  WarehouseIcon,
  WorkflowIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { GlobalSearch } from "@/components/app/global-search";
import { NotificationBell } from "@/components/app/notification-bell";
import { UserMenu, type ShellUser } from "@/components/app/user-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavIcon, NavSection } from "@/components/app/nav";

const icons: Record<NavIcon, typeof LayoutDashboardIcon> = {
  overview: LayoutDashboardIcon,
  tenants: Building2Icon,
  administrators: ShieldCheckIcon,
  testimonials: MessageSquareQuoteIcon,
  audit: ActivityIcon,
  settings: SettingsIcon,
  customers: UsersIcon,
  contacts: ContactIcon,
  companies: Building2Icon,
  opportunities: TargetIcon,
  projects: FolderKanbanIcon,
  tasks: ClipboardListIcon,
  products: PackageIcon,
  quotations: FileTextIcon,
  "sales-orders": ShoppingCartIcon,
  suppliers: TruckIcon,
  "purchase-orders": ClipboardListIcon,
  invoices: ReceiptIcon,
  payments: WalletIcon,
  expenses: BanknoteIcon,
  support: LifeBuoyIcon,
  warehouses: WarehouseIcon,
  "stock-movements": ArrowLeftRightIcon,
  "stock-levels": BoxesIcon,
  analytics: BarChart3Icon,
  crm: SparklesIcon,
  pipeline: KanbanIcon,
  insights: GaugeIcon,
  automations: WorkflowIcon,
  billing: CreditCardIcon,
};

export type WorkspaceOption = {
  id: string;
  name: string;
  slug: string;
  meta?: string;
};

export type AppShellProps = {
  scope: "workspace" | "platform";
  nav: NavSection[];
  user: ShellUser;
  homeHref: string;
  /** Workspace switcher label. Platform scope shows "Platform administration". */
  contextLabel: string;
  contextMeta?: string;
  workspaces?: WorkspaceOption[];
  /** Id of the workspace currently in scope, used by the switcher. */
  currentWorkspaceId?: string;
  children: React.ReactNode;
};

/**
 * Shared application chrome for both the tenant workspace and the platform
 * console. Navigation is pre-filtered on the server so the shell never renders
 * links the current actor cannot use.
 */
export function AppShell({
  scope,
  nav,
  user,
  homeHref,
  contextLabel,
  contextMeta,
  workspaces = [],
  currentWorkspaceId,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md"
      >
        Skip to main content
      </a>

      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarContent
          scope={scope}
          nav={nav}
          homeHref={homeHref}
          contextLabel={contextLabel}
          contextMeta={contextMeta}
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspaceId}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-sm lg:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon className="size-5" aria-hidden="true" />
            </Button>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>
                  Primary navigation for {contextLabel}.
                </SheetDescription>
              </SheetHeader>
              <SidebarContent
                scope={scope}
                nav={nav}
                homeHref={homeHref}
                contextLabel={contextLabel}
                contextMeta={contextMeta}
                workspaces={workspaces}
                currentWorkspaceId={currentWorkspaceId}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-[0.12em] uppercase",
                scope === "platform"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {scope === "platform" ? "Platform" : "Workspace"}
            </span>
            <span className="truncate text-sm font-medium text-foreground">
              {contextLabel}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {scope === "workspace" ? (
              <>
                <GlobalSearch />
                <NotificationBell />
              </>
            ) : null}
            <UserMenu user={user} />
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 outline-none lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  scope,
  nav,
  homeHref,
  contextLabel,
  contextMeta,
  workspaces = [],
  currentWorkspaceId,
  onNavigate,
}: Pick<
  AppShellProps,
  | "scope"
  | "nav"
  | "homeHref"
  | "contextLabel"
  | "contextMeta"
  | "workspaces"
  | "currentWorkspaceId"
> & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeHref = useMemo(() => {
    const candidates = nav
      .flatMap((section) => section.items)
      .map((item) => item.href)
      .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((a, b) => b.length - a.length);
    return candidates[0];
  }, [nav, pathname]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
        <Link
          href={homeHref}
          onClick={onNavigate}
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Logo showTagline={scope === "platform"} />
        </Link>
      </div>

      <div className="border-b border-sidebar-border px-3 py-3">
        {workspaces.length > 1 ? (
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentId={currentWorkspaceId}
          />
        ) : (
          <div className="rounded-lg px-2 py-1.5">
            <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {scope === "platform" ? "Administration" : "Workspace"}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-sidebar-foreground">
              {contextLabel}
            </p>
            {contextMeta ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {contextMeta}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <nav
        aria-label={scope === "platform" ? "Platform navigation" : "Workspace navigation"}
        className="scrollbar-slim flex-1 overflow-y-auto px-3 py-4"
      >
        <ul className="flex flex-col gap-6">
          {nav.map((section) => (
            <li key={section.label}>
              <p className="px-2 pb-1.5 text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {section.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const Icon = icons[item.icon];
                  const isActive = item.href === activeHref;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4 shrink-0",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.label}</span>
                        {item.hint ? (
                          <span className="ml-auto text-[0.65rem] font-medium tracking-wide text-muted-foreground">
                            {item.hint}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
        <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
          {scope === "platform"
            ? "Platform operations are audited. Tenant data stays isolated."
            : "All actions in this workspace are recorded in the audit log."}
        </p>
      </div>
    </div>
  );
}

function WorkspaceSwitcher({
  workspaces,
  currentId,
}: {
  workspaces: WorkspaceOption[];
  currentId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const current =
    workspaces.find((workspace) => workspace.id === currentId) ?? workspaces[0];

  async function switchWorkspace(tenantId: string) {
    if (tenantId === current?.id) {
      setOpen(false);
      return;
    }

    setSwitchingTo(tenantId);
    try {
      const response = await fetch("/api/workspace/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(data.error ?? "Could not switch workspace.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      toast.error("We could not reach the server. Please try again.");
    } finally {
      setSwitchingTo(null);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-background px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        }
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[0.7rem] font-semibold text-primary">
          {(current?.name ?? "?").slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {current?.name ?? "Workspace"}
          </span>
          <span className="block text-[0.65rem] tracking-[0.1em] text-muted-foreground uppercase">
            Switch workspace
          </span>
        </span>
        <ChevronDownIcon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Your workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            disabled={switchingTo !== null}
            onClick={() => void switchWorkspace(workspace.id)}
            className="flex flex-col items-start gap-0.5"
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="text-sm font-medium">{workspace.name}</span>
              {workspace.id === current?.id ? (
                <span className="text-[0.65rem] font-medium tracking-wide text-primary uppercase">
                  Current
                </span>
              ) : null}
              {switchingTo === workspace.id ? (
                <Loader2Icon
                  className="size-3.5 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              ) : null}
            </span>
            <span className="text-xs text-muted-foreground">
              {workspace.meta ?? workspace.slug}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
