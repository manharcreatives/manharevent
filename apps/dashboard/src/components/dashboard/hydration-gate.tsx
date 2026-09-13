"use client";

import { Skeleton } from "@manhar-garba/ui";
import { useHydrated } from "@/lib/use-hydrated";

/**
 * Holds a screen back until the persisted Zustand stores have rehydrated.
 *
 * Both `dashboard-store` and `platform-store` persist to localStorage, which
 * the server cannot see. Without this, every screen that reads them rendered
 * the seeded state on the server and the organizer's real state in the browser
 * — add one vendor, reload, and React threw #418 (hydration mismatch) and
 * discarded the server tree. Individual pages used to guard themselves with
 * `useHydrated`, but only seven of thirty did, so the guard belongs in the
 * shell instead of being remembered page by page.
 *
 * The cost is that the first paint of an internal, no-index dashboard is a
 * skeleton rather than seed data nobody wanted to see anyway.
 */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6" aria-busy="true">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
        <span className="sr-only">Loading your dashboard…</span>
      </div>
    );
  }

  return <>{children}</>;
}
