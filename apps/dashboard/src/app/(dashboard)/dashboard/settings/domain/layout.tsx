import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Domain",
  description: "Your subdomain, or a custom domain you own.",
};

export default function DashboardDashboardSettingsDomainLayout({ children }: { children: React.ReactNode }) {
  return children;
}
