"use client";

import { useDashboardStore, type Role } from "@/lib/dashboard-store";

interface Props {
  allow: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ allow, children, fallback = null }: Props) {
  const { currentRole } = useDashboardStore();
  if (!allow.includes(currentRole)) return <>{fallback}</>;
  return <>{children}</>;
}
