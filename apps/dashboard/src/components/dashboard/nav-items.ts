import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  Users,
  Store,
  Star,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavChild {
  href: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  children?: NavChild[];
}

/**
 * The organizer's navigation, in one place because two components render it:
 * the desktop rail and the mobile drawer. They drifted apart the first time
 * they each kept their own copy.
 */
export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  {
    href: "/dashboard/events",
    label: "Events",
    Icon: Calendar,
    children: [
      { href: "/dashboard/events", label: "All events" },
      { href: "/dashboard/events/new", label: "Create / clone" },
    ],
  },
  {
    href: "/dashboard/finance",
    label: "Finance",
    Icon: DollarSign,
    children: [
      { href: "/dashboard/finance", label: "Overview" },
      { href: "/dashboard/finance/orders", label: "Orders" },
      { href: "/dashboard/finance/refunds", label: "Refunds" },
      { href: "/dashboard/finance/payouts", label: "Payouts" },
      { href: "/dashboard/finance/gst", label: "GST" },
    ],
  },
  {
    href: "/dashboard/team",
    label: "Team",
    Icon: Users,
    children: [
      { href: "/dashboard/team", label: "Members" },
      { href: "/dashboard/team/gate-staff", label: "Gate coverage" },
    ],
  },
  { href: "/dashboard/vendors", label: "Vendors", Icon: Store },
  { href: "/dashboard/sponsors", label: "Sponsors", Icon: Star },
  {
    href: "/dashboard/settings",
    label: "Settings",
    Icon: Settings,
    children: [
      { href: "/dashboard/settings/branding", label: "Branding" },
      { href: "/dashboard/settings/domain", label: "Domain" },
      { href: "/dashboard/settings/payments", label: "Payments" },
      { href: "/dashboard/settings/notifications", label: "Notifications" },
      { href: "/dashboard/settings/audit", label: "Audit log" },
    ],
  },
];

/** True when `pathname` is inside this nav item's section. */
export function isSectionActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/dashboard") return pathname === "/dashboard";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
