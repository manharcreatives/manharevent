import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { HydrationGate } from "@/components/dashboard/hydration-gate";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · ManharEvent" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // `overflow-x-hidden` on the scroll container, never a horizontal scroll on
    // <body>: wide tables scroll inside their own container instead.
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          <HydrationGate>{children}</HydrationGate>
        </main>
      </div>
    </div>
  );
}
