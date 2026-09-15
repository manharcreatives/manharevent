import { redirect } from "next/navigation";
import { getOrgSession } from "@/lib/org-session";
import { ManharOverview } from "@/components/dashboard/manhar-overview";

const MARKETING_LOGIN_URL = process.env.NEXT_PUBLIC_MARKETING_URL
  ? `${process.env.NEXT_PUBLIC_MARKETING_URL}/en/login`
  : "http://localhost:3003/en/login";

/**
 * `/dashboard` is the login gate (2026-09-15, Option C — see PROGRESS.md
 * decision log): login only decides *whether* you're in, never *which*
 * dashboard you see. Every signed-in organizer — Manhar or anyone approved
 * after them — lands on the same rich <ManharOverview />; their own events
 * live in the Sidebar's "My Events" section, not a separate stripped-down
 * shell.
 *   - no session, no ?demo=manhar → redirect to the real login (marketing).
 *   - no session, ?demo=manhar    → the seeded Manhar demo, unauthenticated
 *     (the "View demo instead" escape hatch from the login page).
 *   - any session                 → the same dashboard.
 */
export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  const session = await getOrgSession();

  if (!session) {
    if (demo === "manhar") return <ManharOverview />;
    redirect(MARKETING_LOGIN_URL);
  }

  return <ManharOverview />;
}
