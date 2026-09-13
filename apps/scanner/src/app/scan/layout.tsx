import { GateSessionGuard } from "@/components/scanner/GateSessionGuard";

// Everything under /scan requires a gate-staff session. Access is issued from
// the organizer's dashboard (Team → Gate Staff), never self-registered — see
// packages/domain/src/logic/gate-access.ts.
export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <GateSessionGuard>{children}</GateSessionGuard>;
}
