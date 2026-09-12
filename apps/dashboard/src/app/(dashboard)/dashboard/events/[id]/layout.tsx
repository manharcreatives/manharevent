"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@manhar-garba/ui";

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

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
                      ? "bg-surface text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
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
