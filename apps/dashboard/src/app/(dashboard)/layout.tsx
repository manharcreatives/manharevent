import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { HydrationGate } from "@/components/dashboard/hydration-gate";
import { getOrgSession } from "@/lib/org-session";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · ManharEvent" },
};

/**
 * 2026-09-15 (Option C, see PROGRESS.md decision log): every logged-in
 * organizer gets the same rich dashboard Manhar's own team sees — a new
 * organizer isn't a stripped-down product, they're a gate (dashboard/
 * page.tsx) into the exact same shell, with their own events living in the
 * Sidebar's "My Events" section. The earlier lightweight <OrgShell> is gone.
 *
 * Session is fetched here only so the Sidebar/MobileNav footer can show a
 * "Log out" item when someone's actually signed in — it no longer decides
 * which layout renders.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getOrgSession();

  return (
    // `overflow-x-hidden` on the scroll container, never a horizontal scroll on
    // <body>: wide tables scroll inside their own container instead.
    <div className="flex h-screen overflow-hidden">
      <Sidebar signedIn={Boolean(session)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav signedIn={Boolean(session)} />
        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          <HydrationGate>{children}</HydrationGate>
        </main>
      </div>
    </div>
  );
}
