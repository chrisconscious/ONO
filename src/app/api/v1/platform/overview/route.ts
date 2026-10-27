import { prisma } from "@/lib/database/prisma";
import { ok } from "@/lib/api/tenant-route";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

export const dynamic = "force-dynamic";

/**
 * Platform operations overview for the Super Admin portal. Every number is a
 * live count computed from persisted records — nothing is hardcoded. Only
 * aggregate metadata is returned; no tenant business rows are exposed here,
 * consistent with least-privilege platform administration.
 */
export async function GET(): Promise<Response> {
  await requirePlatformAdmin();
  const [
    totalTenants,
    activeTenants,
    suspendedTenants,
    totalUsers,
    activeSubscriptions,
    trialingSubscriptions,
    openIncidents,
    publishedTestimonials,
    draftTestimonials,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.tenant.count({ where: { provisioningStatus: "SUSPENDED" } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "TRIALING" } }),
    prisma.dataIncident.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    prisma.testimonial.count({ where: { isPublished: true } }),
    prisma.testimonial.count({ where: { isPublished: false } }),
  ]);
  return ok({
    tenants: { total: totalTenants, active: activeTenants, suspended: suspendedTenants },
    users: { active: totalUsers },
    subscriptions: { active: activeSubscriptions, trialing: trialingSubscriptions },
    governance: { openDataIncidents: openIncidents },
    testimonials: { published: publishedTestimonials, drafts: draftTestimonials },
  });
}
