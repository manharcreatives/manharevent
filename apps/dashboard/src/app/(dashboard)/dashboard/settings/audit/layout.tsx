import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit log",
  description: "Every change anyone on your team made.",
};

export default function DashboardDashboardSettingsAuditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
