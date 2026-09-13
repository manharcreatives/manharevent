import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gate coverage",
  description: "Who is on each gate and whether their scanner code works.",
};

export default function DashboardDashboardTeamGateStaffLayout({ children }: { children: React.ReactNode }) {
  return children;
}
