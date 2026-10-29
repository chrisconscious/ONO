import { requirePlatformAdmin } from "@/lib/auth/guards";
import { AppShell } from "@/components/app/app-shell";
import type { NavSection } from "@/components/app/nav";
import { countTestimonialsByStatus } from "@/server/services/testimonials/testimonials.service";

export const dynamic = "force-dynamic";

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await requirePlatformAdmin("/admin");
  const testimonialCounts = await countTestimonialsByStatus();

  const nav: NavSection[] = [
    {
      label: "Operations",
      items: [
        { href: "/admin", label: "Overview", icon: "overview" },
        { href: "/admin/tenants", label: "Tenants", icon: "tenants" },
        {
          href: "/admin/administrators",
          label: "Administrators",
          icon: "administrators",
        },
        {
          href: "/admin/testimonials",
          label: "Testimonials",
          icon: "testimonials",
          hint: testimonialCounts.PENDING
            ? `${testimonialCounts.PENDING} to review`
            : undefined,
        },
      ],
    },
    {
      label: "Governance",
      items: [
        { href: "/admin/audit", label: "Audit log", icon: "audit" },
        { href: "/admin/settings", label: "Platform settings", icon: "settings" },
      ],
    },
  ];

  return (
    <AppShell
      scope="platform"
      nav={nav}
      homeHref="/admin"
      contextLabel="Platform administration"
      contextMeta={actor.email}
      user={{
        name: actor.name ?? actor.email,
        email: actor.email,
        roleLabel: "Platform administrator",
      }}
    >
      {children}
    </AppShell>
  );
}
