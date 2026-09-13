import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Branding, domain, payouts, notifications and the audit log.",
};

export default function DashboardDashboardSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
