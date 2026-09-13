import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview",
  description: "Live sales, gate occupancy and tonight's expected attendance.",
};

export default function DashboardDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
