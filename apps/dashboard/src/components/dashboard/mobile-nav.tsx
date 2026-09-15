"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Menu, ShieldCheck, LogOut } from "lucide-react";
import {
  cn,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@manhar-garba/ui";
import { useDashboardStore } from "@/lib/dashboard-store";
import { logoutOrgAction } from "@/app/actions/org";
import { NAV, isSectionActive } from "./nav-items";

const MARKETING_LOGIN_URL = process.env.NEXT_PUBLIC_MARKETING_URL
  ? `${process.env.NEXT_PUBLIC_MARKETING_URL}/en/login`
  : "http://localhost:3003/en/login";

/**
 * Phone navigation for the organizer shell.
 *
 * The rail is `hidden sm:flex`, so below 640px the dashboard shipped with no
 * navigation at all — every screen was a cul-de-sac you could only leave with
 * the browser's back button. This is the same `NAV` tree in a drawer, plus the
 * event switcher, which on a phone is the only place it exists.
 */
export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggingOut, startLogout] = useTransition();

  const events = useDashboardStore((s) => s.events);
  const currentEventId = useDashboardStore((s) => s.currentEventId);
  const setCurrentEvent = useDashboardStore((s) => s.setCurrentEvent);
  const currentEvent = events.find((e) => e.id === currentEventId) ?? events[0];

  // Navigating away is the end of the drawer's job.
  useEffect(() => setOpen(false), [pathname]);

  function handleLogout() {
    startLogout(async () => {
      await logoutOrgAction();
      window.location.href = MARKETING_LOGIN_URL;
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/95 px-2 backdrop-blur sm:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface-raised"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link href="/dashboard" className="flex min-w-0 items-center gap-2" aria-label="ManharEvent dashboard home">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
          M
        </span>
        <span className="truncate text-sm font-medium text-foreground">
          {currentEvent?.title ?? "ManharEvent"}
        </span>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[17rem] overflow-y-auto p-0">
          <SheetHeader className="border-b border-border px-4 py-3 text-left">
            <SheetTitle className="font-display text-base">ManharEvent</SheetTitle>
            <SheetDescription className="text-xs">Organizer dashboard</SheetDescription>
          </SheetHeader>

          {events.length > 1 && (
            <div className="border-b border-border px-4 py-3">
              <label htmlFor="mobile-event-switcher" className="text-xs text-muted-foreground">
                Event
              </label>
              <select
                id="mobile-event-switcher"
                className="mt-1 h-11 w-full rounded-md border border-border bg-surface-raised px-3 text-sm text-foreground"
                value={currentEventId}
                onChange={(e) => setCurrentEvent(e.target.value)}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          )}

          <nav className="py-2" aria-label="Dashboard">
            {NAV.map((item) => {
              const active = isSectionActive(item, pathname);
              const { Icon } = item;
              return (
                <div key={item.href} className="px-2">
                  <Link
                    href={item.children ? item.children[0]!.href : item.href}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm transition-colors",
                      active ? "font-medium text-primary" : "text-foreground hover:bg-surface-raised"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                  {item.children && active && (
                    <div className="mb-1 ml-7 border-l border-border">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex min-h-11 items-center pl-3 text-sm transition-colors",
                            pathname === child.href
                              ? "font-medium text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="border-t border-border px-2 py-2">
            <Link
              href="/admin"
              className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Internal ops
            </Link>
            {signedIn && (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-destructive"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
