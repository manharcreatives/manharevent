import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GST reports",
  description: "Tax invoices and the GSTR-1 export.",
};

export default function DashboardDashboardFinanceGstLayout({ children }: { children: React.ReactNode }) {
  return children;
}
