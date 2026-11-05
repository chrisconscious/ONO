import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLinkIcon, ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import {
  AuthPageSettings,
  type AuthPageTestimonial,
} from "@/components/platform/auth-page-settings";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getAuthPageAdminState } from "@/server/services/platform/auth-page.service";
import { listPublishedTestimonialsForAdmin } from "@/server/services/testimonials/testimonials.service";

export const metadata: Metadata = {
  title: "Authentication page settings",
};

export const dynamic = "force-dynamic";

export default async function AuthenticationPageSettings() {
  await requirePlatformAdmin("/admin/authentication");

  const [state, testimonials] = await Promise.all([
    getAuthPageAdminState(),
    listPublishedTestimonialsForAdmin(),
  ]);

  const initialTestimonials: AuthPageTestimonial[] = testimonials.map(
    (testimonial) => ({
      id: testimonial.id,
      authorName: testimonial.authorName,
      authorTitle: testimonial.authorTitle,
      company: testimonial.company,
      quote: testimonial.quote,
      rating: testimonial.rating,
      displayOrder: testimonial.displayOrder,
      isFeatured: testimonial.isFeatured,
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Authentication page settings"
        description="Global content, imagery and customer stories shown beside the sign-in and sign-up forms. Drafts stay private until you publish."
        breadcrumbs={[
          { label: "Platform administration", href: "/admin" },
          { label: "Authentication page" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link
                href="/sign-in?preview=auth-page"
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ExternalLinkIcon aria-hidden="true" />
            Preview authentication page
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <AuthPageSettings
          initialDraft={state.draft}
          initialPublished={state.published}
          initialTestimonials={initialTestimonials}
        />

        <aside className="flex flex-col gap-4">
          <SectionCard
            title="How publishing works"
            description="Changes follow a private draft, then a deliberate publish."
          >
            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-2.5">
                <ImageIcon
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  Draft text and images are visible only to platform
                  administrators. Use the preview to review them at every screen
                  size.
                </span>
              </li>
              <li className="flex gap-2.5">
                <ImageIcon
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  Published content and images appear on sign-in, sign-up,
                  password recovery and other authentication screens.
                </span>
              </li>
              <li className="flex gap-2.5">
                <ImageIcon
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  Uploaded files are validated on the server and stored
                  privately. They are served through an authorization-checked
                  route.
                </span>
              </li>
            </ul>
          </SectionCard>

          <SectionCard title="Scope and access">
            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                These settings are global and are not overridden by tenant
                administrators.
              </li>
              <li>
                Saves, uploads, publications and testimonial changes are written
                to the audit log with the acting administrator.
              </li>
              <li>
                Built-in defaults keep the authentication page complete when
                nothing has been configured.
              </li>
            </ul>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
