import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: { default: "Internal Ops", template: "%s · ManharEvent Internal Ops" },
};

// Internal ops shell — Manhar Creatives platform team only, never
// attendee- or organizer-facing (docs/02-product/user-flows.md's
// "Internal ops" section, 2026-09-12 pivot; formerly "Surface 4 —
// Superadmin"). Deliberately NOT the organizer <Sidebar> — different
// audience, different nav. In the real system this route needs its own
// auth check (an internal-staff session, not an organizer's); that gate
// isn't built yet since there's no real auth in the mock stage at all —
// see FE-11's acceptance criteria.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5 sm:px-6">
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <Link href="/admin" className="font-display text-sm font-bold text-foreground">
            ManharEvent — Internal Ops
          </Link>
          <nav
            className="-mx-1 ml-auto flex w-full items-center gap-1 overflow-x-auto text-sm text-muted-foreground sm:w-auto sm:gap-4"
            aria-label="Internal ops"
          >
            <Link href="/admin" className="whitespace-nowrap rounded px-1 py-1.5 transition-colors hover:text-foreground">Overview</Link>
            <Link href="/admin/tenants" className="whitespace-nowrap rounded px-1 py-1.5 transition-colors hover:text-foreground">Tenants</Link>
            <Link href="/admin/emergency" className="whitespace-nowrap rounded px-1 py-1.5 transition-colors hover:text-destructive">Emergency</Link>
            {/* Internal ops sits on the organizer's origin; without this the
                only way back into the dashboard is editing the URL. */}
            <Link
              href="/dashboard"
              className="ml-auto flex items-center gap-1 whitespace-nowrap rounded px-1 py-1.5 transition-colors hover:text-foreground sm:ml-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Organizer view
            </Link>
          </nav>
        </div>
      </header>
      <main id="main-content">
        {children}
      </main>
    </div>
  );
}
