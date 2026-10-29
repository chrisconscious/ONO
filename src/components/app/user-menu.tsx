"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDownIcon, Loader2Icon, LogOutIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ShellUser = {
  name: string;
  email: string;
  roleLabel: string;
  accountHref?: string;
};

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export function UserMenu({ user }: { user: ShellUser }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Sign out failed");
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setIsSigningOut(false);
      toast.error("Could not sign out. Please try again.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        }
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-primary/10 text-[0.7rem] font-semibold text-primary">
            {initials(user.name, user.email)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 flex-col text-left sm:flex">
          <span className="max-w-40 truncate text-sm leading-tight font-medium">
            {user.name || user.email}
          </span>
          <span className="text-[0.7rem] leading-tight text-muted-foreground">
            {user.roleLabel}
          </span>
        </span>
        <ChevronsUpDownIcon
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {user.name || "Signed in"}
          </span>
          <span className="truncate text-xs font-normal">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.accountHref ? (
          <DropdownMenuItem
            render={<Link href={user.accountHref} />}
            className="gap-2"
          >
            <UserIcon aria-hidden="true" />
            Account settings
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className="gap-2"
          disabled={isSigningOut}
          onClick={() => void signOut()}
        >
          {isSigningOut ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <LogOutIcon aria-hidden="true" />
          )}
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
