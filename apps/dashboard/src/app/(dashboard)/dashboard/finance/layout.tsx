import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finance",
  description: "What buyers paid, what came out, what reaches your account.",
};

export default function DashboardDashboardFinanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
