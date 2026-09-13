import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Emergency controls",
  description: "Platform-wide overrides for when something goes wrong mid-event.",
};

export default function AdminAdminEmergencyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
