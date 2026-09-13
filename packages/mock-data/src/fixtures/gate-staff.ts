import { issueGateCode, normalizePhone } from "@manhar-garba/domain";
import { EVENT_ID, GATE_G1_ID, GATE_G2_ID, GATE_G3_ID, GATE_G4_ID } from "./event";

/**
 * The gate-staff roster the organizer has already added on `/dashboard/team`.
 *
 * This exists in `packages/mock-data` rather than in the dashboard's own store
 * because `apps/scanner` runs as a separate origin and needs to see the same
 * people — see `packages/domain/src/logic/gate-access.ts` for why the code
 * itself is derived and not stored.
 */
export interface GateStaffMember {
  id: string;
  name: string;
  /** Normalised to +91XXXXXXXXXX — the scanner matches on this exactly. */
  phone: string;
  gateId: string;
  gateLabel: string;
  /** Bumped by "regenerate", which is what invalidates the previous code. */
  serial: number;
  revokedAt: string | null;
}

export const gateStaff: GateStaffMember[] = [
  {
    id: "gs-1",
    name: "Ramesh Patel",
    phone: normalizePhone("9825011001"),
    gateId: GATE_G1_ID,
    gateLabel: "Gate 1 — VIP Entrance",
    serial: 1,
    revokedAt: null,
  },
  {
    id: "gs-2",
    name: "Suresh Mehta",
    phone: normalizePhone("9825011002"),
    gateId: GATE_G2_ID,
    gateLabel: "Gate 2 — Gold North",
    serial: 1,
    revokedAt: null,
  },
  {
    id: "gs-3",
    name: "Kiran Joshi",
    phone: normalizePhone("9825011003"),
    gateId: GATE_G3_ID,
    gateLabel: "Gate 3 — Gold South",
    serial: 1,
    revokedAt: null,
  },
  {
    id: "gs-4",
    name: "Dipesh Bhatt",
    phone: normalizePhone("9825011004"),
    gateId: GATE_G4_ID,
    gateLabel: "Gate 4 — General",
    serial: 1,
    revokedAt: null,
  },
];

/** The code this member would be shown on the dashboard right now. */
export function gateStaffCode(member: GateStaffMember): string {
  return issueGateCode({ phone: member.phone, eventId: EVENT_ID, serial: member.serial });
}

export function findGateStaffByPhone(phone: string): GateStaffMember | undefined {
  const normalized = normalizePhone(phone);
  return gateStaff.find((m) => m.phone === normalized);
}
