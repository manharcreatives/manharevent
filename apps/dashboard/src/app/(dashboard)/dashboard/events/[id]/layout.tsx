"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { CalendarX2 } from "lucide-react";
import { cn, Button, Skeleton } from "@manhar-garba/ui";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useHydrated } from "@/lib/use-hydrated";

const EVENT_TABS = [
  { href: "", label: "Overview" },
  { href: "/nights", label: "Nights" },
  { href: "/venue", label: "Venue" },
  { href: "/passes", label: "Passes" },
  { href: "/addons", label: "Add-ons" },
  { href: "/promos", label: "Promos" },
  { href: "/policy", label: "Policy" },
  { href: "/publish", label: "Publish" },
  { href: "/live", label: "Live" },
  { href: "/attendees", label: "Attendees" },
  { href: "/checkins", label: "Check-ins" },
  { href: "/reports", label: "Reports" },
  { href: "/comps", label: "Comps" },
];

export default function EventLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const base = `/dashboard/events/${params.id}`;
  const hydrated = useHydrated();
  const event = useDashboardStore((s) => s.events.find((e) => e.id === params.id));

  // Wait for the persisted store before deciding anything — the server only
  // knows the seeded event, so an event created in this browser would
  // otherwise flash "not found" on every refresh.
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <CalendarX2 className="h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-xl font-bold text-foreground">This event doesn&rsquo;t exist</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          It may have been deleted, or the link is from another browser. Your events are all listed on the
          Events page.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/events">Go to my events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="truncate pt-2 text-xs text-muted-foreground">
            <Link href="/dashboard/events" className="hover:text-foreground">
              Events
            </Link>{" "}
            / <span className="text-foreground">{event.title}</span>
            {event.status === "draft" && (
              <span className="ml-2 rounded-full bg-surface-raised px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                Draft
              </span>
            )}
          </p>
          <nav className="flex gap-0.5 overflow-x-auto py-0.5" aria-label="Event tabs">
            {EVENT_TABS.map((tab) => {
              const href = `${base}${tab.href}`;
              const isActive = tab.href === "" ? pathname === base : pathname.startsWith(href);
              return (
                <Link
                  key={tab.href}
                  href={href}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-surface font-medium text-foreground"
                      : "text-muted-foreground hover:bg-surface/60 hover:text-foreground"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
