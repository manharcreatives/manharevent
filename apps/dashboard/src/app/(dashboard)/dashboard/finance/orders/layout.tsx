import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order ledger",
  description: "Every transaction, filterable and exportable.",
};

export default function DashboardDashboardFinanceOrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
