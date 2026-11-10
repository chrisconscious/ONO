"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LifeBuoyIcon,
  MonitorSmartphoneIcon,
  PaletteIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
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

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account settings"
      className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
