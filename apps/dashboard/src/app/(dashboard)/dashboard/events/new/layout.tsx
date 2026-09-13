import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New event",
  description: "Create a season from scratch or clone last year's.",
};

export default function DashboardDashboardEventsNewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
