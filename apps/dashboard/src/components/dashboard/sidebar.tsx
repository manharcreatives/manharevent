"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";
import { cn } from "@manhar-garba/ui";
import { useDashboardStore } from "@/lib/dashboard-store";
import { NAV, isSectionActive } from "./nav-items";

/** The section a path belongs to, so the right group is open on first paint. */
function openGroupFor(pathname: string): string | null {
  return NAV.find((n) => n.children && isSectionActive(n, pathname))?.href ?? null;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(() => openGroupFor(pathname));

  // Follow the route: navigating from Finance to Settings should open Settings
  // rather than leaving the organizer looking at a collapsed group.
  useEffect(() => {
    const next = openGroupFor(pathname);
    if (next) setOpenGroup(next);
  }, [pathname]);

  // Auto-collapse between 768px and 1024px; re-expand above 1024px
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setCollapsed(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const events = useDashboardStore((s) => s.events);
  const currentEventId = useDashboardStore((s) => s.currentEventId);
  const setCurrentEvent = useDashboardStore((s) => s.setCurrentEvent);

  return (
    <aside
      className={cn(
        "hidden sm:flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo + event switcher */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        {!collapsed && (
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <Link
              href="/dashboard"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary"
              aria-label="ManharEvent dashboard home"
            >
              <span className="text-xs font-bold text-white">M</span>
            </Link>
            {/* A native <select> cannot ellipsize its own label, so a long
                event name used to read "Manhar Navratri 2" — cut mid-word. The
                name goes in a real element that can truncate; the select sits
                on top of it, invisible, so the control still works. */}
            <div className="relative min-w-0 flex-1">
              <span
                className="block truncate text-sm font-medium text-foreground"
                title={events.find((ev) => ev.id === currentEventId)?.title}
              >
                {events.find((ev) => ev.id === currentEventId)?.title ?? "Select event"}
              </span>
              <select
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                value={currentEventId}
                onChange={(e) => setCurrentEvent(e.target.value)}
                aria-label="Select event"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {collapsed && (
          <Link
            href="/dashboard"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-primary"
            aria-label="ManharEvent dashboard home"
          >
            <span className="text-xs font-bold text-white">M</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-raised hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Dashboard">
        {NAV.map((item) => {
          const isActive = isSectionActive(item, pathname);
          const isOpen = openGroup === item.href;
          const { Icon } = item;

          if (item.children) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => setOpenGroup(isOpen ? null : item.href)}
                  aria-expanded={isOpen}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {isOpen
                        ? <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronRight className="h-3.5 w-3.5" />}
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div className="ml-9 border-l border-border pb-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block py-1.5 pl-3 text-sm transition-colors",
                          pathname === child.href
                            ? "text-foreground font-medium"
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
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Internal ops is a different audience on the same origin — a visible
          door out of the organizer shell beats typing /admin from memory. */}
      <div className="border-t border-border p-2">
        <Link
          href="/admin"
          title={collapsed ? "Internal ops" : undefined}
          className="flex items-center gap-2.5 rounded-md px-1 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Internal ops</span>}
        </Link>
      </div>
    </aside>
  );
}
