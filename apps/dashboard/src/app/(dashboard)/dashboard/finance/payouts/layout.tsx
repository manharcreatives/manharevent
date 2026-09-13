import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payouts",
  description: "Tranche schedule, TDS and what lands in your bank.",
};

export default function DashboardDashboardFinancePayoutsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
