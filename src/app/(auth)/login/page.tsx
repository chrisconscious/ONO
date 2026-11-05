import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Legacy sign-in route. Kept so old links and bookmarks keep working; the
 * canonical screen lives at /sign-in.
 */
export default async function LegacyLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const suffix = query.toString();
  redirect(suffix ? `/sign-in?${suffix}` : "/sign-in");
}
