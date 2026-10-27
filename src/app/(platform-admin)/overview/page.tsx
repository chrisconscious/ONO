import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Megaphone, Users } from "lucide-react";
import { requireSession } from "@/lib/auth/session-resolver";
import { assertPlatformAdmin } from "@/lib/auth/platform-admin";
import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Platform overview rendered on the server with real aggregate counts from
 * the control-plane tables. Access is enforced twice: the layout guard plus
 * this per-page re-check (defense in depth against direct URL access).
 */
export default async function PlatformOverviewPage() {
  const session = await requireSession();
  try {
    await assertPlatformAdmin(session.userId);
  } catch {
    redirect("/dashboard");
  }

  const [tenants, users, memberships, publishedTestimonials] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.membership.count(),
    prisma.testimonial.count({ where: { isPublished: true } }),
  ]);

  const cards = [
    { title: "Organizations", value: tenants, href: "/admin/organizations", icon: Building2 },
    { title: "Users", value: users, href: "/admin/organizations", icon: Users },
    { title: "Memberships", value: memberships, href: "/admin/organizations", icon: Users },
    { title: "Published testimonials", value: publishedTestimonials, href: "/admin/testimonials", icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform overview</h1>
        <p className="text-sm text-muted-foreground">Control-plane aggregates computed from live records.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <Link href={c.href} className="text-2xl font-semibold tabular-nums hover:underline">
                {c.value.toLocaleString()}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
