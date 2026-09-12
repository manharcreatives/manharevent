import Link from "next/link";
import { ShieldCheck } from "lucide-react";

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
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:px-6">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-display text-sm font-bold text-foreground">ManharEvent — Internal Ops</span>
          <nav className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/admin/tenants" className="hover:text-foreground">Tenants</Link>
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
    </div>
  );
}
