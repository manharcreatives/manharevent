"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Calendar, DollarSign, Users, Store,
  Star, Settings, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { cn } from "@manhar-garba/ui";
import { useDashboardStore } from "@/lib/dashboard-store";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  children?: { href: string; label: string }[];
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  {
    href: "/dashboard/events", label: "Events", icon: <Calendar className="h-4 w-4" />,
    children: [
      { href: "/dashboard/events", label: "All events" },
      { href: "/dashboard/events/new", label: "Create / clone" },
    ],
  },
  {
    href: "/dashboard/finance", label: "Finance", icon: <DollarSign className="h-4 w-4" />,
    children: [
      { href: "/dashboard/finance", label: "Overview" },
      { href: "/dashboard/finance/orders", label: "Orders" },
      { href: "/dashboard/finance/refunds", label: "Refunds" },
      { href: "/dashboard/finance/payouts", label: "Payouts" },
      { href: "/dashboard/finance/gst", label: "GST" },
    ],
  },
  {
    href: "/dashboard/team", label: "Team", icon: <Users className="h-4 w-4" />,
    children: [
      { href: "/dashboard/team", label: "Members" },
      { href: "/dashboard/team/gate-staff", label: "Gate staff" },
    ],
  },
  { href: "/dashboard/vendors", label: "Vendors", icon: <Store className="h-4 w-4" /> },
  { href: "/dashboard/sponsors", label: "Sponsors", icon: <Star className="h-4 w-4" /> },
  {
    href: "/dashboard/settings/branding", label: "Settings", icon: <Settings className="h-4 w-4" />,
    children: [
      { href: "/dashboard/settings/branding", label: "Branding" },
      { href: "/dashboard/settings/domain", label: "Domain" },
      { href: "/dashboard/settings/payments", label: "Payments" },
      { href: "/dashboard/settings/notifications", label: "Notifications" },
      { href: "/dashboard/settings/audit", label: "Audit log" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    const match = NAV.find((n) => n.children && pathname.startsWith(n.href));
    return match?.href ?? null;
  });

  // Auto-collapse between 768px and 1024px; re-expand above 1024px
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setCollapsed(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { events, currentEventId, setCurrentEvent } = useDashboardStore();

  return (
    <aside
      className={cn(
        "hidden sm:flex h-screen flex-col border-r border-border bg-surface transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo + event switcher */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        {!collapsed && (
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
              <span className="text-xs font-bold text-white">M</span>
            </div>
            <select
              className="flex-1 truncate bg-transparent text-sm font-medium text-foreground focus:outline-none"
              value={currentEventId}
              onChange={(e) => setCurrentEvent(e.target.value)}
              aria-label="Select event"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        )}
        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <span className="text-xs font-bold text-white">M</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isOpen = openGroup === item.href;

          if (item.children) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => setOpenGroup(isOpen ? null : item.href)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.icon}
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
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
