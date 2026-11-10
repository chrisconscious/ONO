"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronsUpDownIcon,
  LifeBuoyIcon,
  Loader2Icon,
  LogOutIcon,
  MonitorSmartphoneIcon,
  PaletteIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import { toast } from "sonner";
import { notifySignedOut } from "@/lib/auth/client-events";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ShellUser = {
  name: string;
  email: string;
  roleLabel: string;
  avatarUrl?: string | null;
};

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

const menuItems = [
  { href: "/account/profile", label: "My Profile", icon: UserRoundIcon },
  { href: "/account/settings", label: "Account Settings", icon: SettingsIcon },
  { href: "/account/security", label: "Security", icon: ShieldCheckIcon },
  {
    href: "/account/sessions",
    label: "Active Sessions",
    icon: MonitorSmartphoneIcon,
  },
  { href: "/account/preferences", label: "Preferences", icon: PaletteIcon },
  { href: "/account/support", label: "Help & Support", icon: LifeBuoyIcon },
] as const;

export function UserMenu({ user }: { user: ShellUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Sign out failed");
      }
      notifySignedOut();
      router.replace("/sign-in?reason=signed-out");
      router.refresh();
    } catch {
      setIsSigningOut(false);
      setConfirmingSignOut(false);
      toast.error("Could not sign out. Please try again.");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Open account menu"
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          }
        >
          <Avatar className="size-7">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-[0.7rem] font-semibold text-primary">
              {initials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-col text-left sm:flex">
            <span className="max-w-40 truncate text-sm leading-tight font-medium">
              {user.name || user.email}
            </span>
            <span className="max-w-40 truncate text-[0.7rem] leading-tight text-muted-foreground">
              {user.roleLabel}
            </span>
          </span>
          <ChevronsUpDownIcon
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="size-10">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {initials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name || "Signed in"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
              <p className="mt-0.5 truncate text-[0.7rem] font-medium text-muted-foreground">
                {user.roleLabel}
              </p>
            </div>
          </div>

          <DropdownMenuSeparator />

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <DropdownMenuItem
                key={item.href}
                render={<Link href={item.href} />}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "gap-2 px-2 py-1.5",
                  active && "bg-primary/10 font-medium text-primary",
                )}
              >
                <Icon aria-hidden="true" />
                {item.label}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="gap-2 px-2 py-1.5"
            onClick={() => setConfirmingSignOut(true)}
          >
            <LogOutIcon aria-hidden="true" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmingSignOut} onOpenChange={setConfirmingSignOut}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign out of ONO?</DialogTitle>
            <DialogDescription>
              This device will be signed out. Other devices stay signed in unless
              you sign them out from Active Sessions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSigningOut}
              onClick={() => setConfirmingSignOut(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSigningOut}
              onClick={() => void signOut()}
            >
              {isSigningOut ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <LogOutIcon aria-hidden="true" />
              )}
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
