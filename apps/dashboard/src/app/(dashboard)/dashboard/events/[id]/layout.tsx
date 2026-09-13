import type { Metadata } from "next";
import { EventShell } from "@/components/dashboard/event-shell";

// A server layout so this route can carry its own <title>; the tab chrome
// itself needs the store and stays a client component.
export const metadata: Metadata = {
  title: "Event",
  description: "One season: its nights, passes, money and gates.",
};

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return <EventShell>{children}</EventShell>;
}
