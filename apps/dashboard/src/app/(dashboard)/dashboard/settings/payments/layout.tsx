import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments & payouts",
  description: "The bank account your ticket money lands in.",
};

export default function DashboardDashboardSettingsPaymentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
