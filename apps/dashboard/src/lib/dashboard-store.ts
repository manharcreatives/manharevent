"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Event, EventNight, Zone, PassType, Order, CheckIn } from "@manhar-garba/domain";
import {
  event as mockEvent,
  eventNights as mockEventNights,
  zones as mockZones,
  passTypes as mockPassTypes,
  orders as mockOrders,
  checkIns as mockCheckIns,
} from "@manhar-garba/mock-data";

// ─── In-memory audit log ──────────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  detail: string;
  timestamp: string;
}

const initialAuditLog: AuditEntry[] = [
  { id: "a1", action: "event.published", actor: "Jignesh Shah", detail: "Manhar Navratri 2026 published", timestamp: new Date(Date.now() - 3600_000).toISOString() },
  { id: "a2", action: "comp.issued",     actor: "Jignesh Shah", detail: "2× VIP comp passes issued to Media Team", timestamp: new Date(Date.now() - 7200_000).toISOString() },
  { id: "a3", action: "refund.approved", actor: "Meena Desai",  detail: "Refund ₹4,990 approved for order #1003", timestamp: new Date(Date.now() - 10800_000).toISOString() },
];

// ─── Role system ─────────────────────────────────────────────────────────
export type Role = "owner" | "finance" | "gate_staff" | "vendor";
export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  role: Role;
  addedAt: string;
}

const initialTeam: TeamMember[] = [
  { id: "t1", name: "Jignesh Shah", phone: "+919876543210", role: "owner", addedAt: new Date(Date.now() - 86400_000 * 7).toISOString() },
  { id: "t2", name: "Meena Desai",  phone: "+919876543211", role: "finance", addedAt: new Date(Date.now() - 86400_000 * 5).toISOString() },
];

// ─── Scanner credentials (FE-10, 2026-09-12 pivot) ────────────────────────
// "Gate-scanner access issued only from the admin panel" (docs/02-product/
// user-flows.md's Surface-3 note) needed something to actually issue: before
// this there was no real credential concept anywhere, gate_staff was just a
// team-member role with no login of its own. This is still a mock — the
// generated code isn't checked against anything at /scan/login yet, because
// apps/scanner runs as its own process with its own separate mock store (see
// packages/mock-data/src/repo.ts's own note on this limitation) — but it's a
// real, revocable, single-team-member-scoped credential now, not nothing.
export interface ScannerCredential {
  id: string;
  teamMemberId: string;
  code: string;
  gateLabel: string | null;
  issuedAt: string;
  revokedAt: string | null;
}

function generateScannerCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity at the gate
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

// ─── Branding ────────────────────────────────────────────────────────────
export interface BrandingConfig {
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
}

// ─── Comp pass ───────────────────────────────────────────────────────────
export interface CompPass {
  id: string;
  passTypeName: string;
  holderName: string;
  reason: string;
  issuedAt: string;
}

// ─── Promo code ──────────────────────────────────────────────────────────
export interface PromoDef {
  id: string;
  code: string;
  type: "flat" | "percent";
  value: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}

// ─── State ───────────────────────────────────────────────────────────────
interface DashboardState {
  currentRole: Role;
  events: Event[];
  currentEventId: string;
  nights: EventNight[];
  zones: Zone[];
  passTypes: PassType[];
  orders: Order[];
  checkIns: CheckIn[];
  auditLog: AuditEntry[];
  team: TeamMember[];
  scannerCredentials: ScannerCredential[];
  comps: CompPass[];
  promos: PromoDef[];
  branding: BrandingConfig;
  liveSimRunning: boolean;
  lastSimAt: number;
}

interface DashboardActions {
  setCurrentRole: (role: Role) => void;
  setCurrentEvent: (id: string) => void;
  addAuditEntry: (action: string, detail: string) => void;
  addCompPass: (comp: Omit<CompPass, "id" | "issuedAt">) => void;
  addPromo: (promo: Omit<PromoDef, "id" | "usedCount">) => void;
  togglePromo: (id: string) => void;
  addTeamMember: (member: Omit<TeamMember, "id" | "addedAt">) => void;
  removeTeamMember: (id: string) => void;
  issueScannerCredential: (teamMemberId: string, gateLabel?: string) => void;
  revokeScannerCredential: (id: string) => void;
  updateBranding: (b: Partial<BrandingConfig>) => void;
  tickLiveSim: () => void;
  startLiveSim: () => void;
  pauseLiveSim: () => void;
  addMockCheckIn: () => void;
}

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  persist(
    (set, get) => ({
      // initial state
      currentRole: "owner",
      events: [mockEvent],
      currentEventId: mockEvent.id,
      nights: mockEventNights,
      zones: mockZones,
      passTypes: mockPassTypes,
      orders: mockOrders,
      checkIns: mockCheckIns,
      auditLog: initialAuditLog,
      team: initialTeam,
      scannerCredentials: [],
      comps: [],
      promos: [
        { id: "p1", code: "NAVRATRI10", type: "percent", value: 10, maxUses: 100, usedCount: 23, active: true },
        { id: "p2", code: "EARLYBIRD", type: "flat", value: 500_00, maxUses: 50, usedCount: 50, active: false },
      ],
      branding: { primaryColor: "#F55B2A", accentColor: "#B24FE0", logoUrl: null },
      liveSimRunning: true,
      lastSimAt: Date.now(),

      // actions
      setCurrentRole: (role) => set({ currentRole: role }),
      setCurrentEvent: (id) => set({ currentEventId: id }),

      addAuditEntry: (action, detail) => {
        const entry: AuditEntry = {
          id: crypto.randomUUID(),
          action,
          actor: "Jignesh Shah",
          detail,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ auditLog: [entry, ...s.auditLog] }));
      },

      addCompPass: (comp) => {
        const entry: CompPass = { id: crypto.randomUUID(), ...comp, issuedAt: new Date().toISOString() };
        set((s) => ({ comps: [entry, ...s.comps] }));
        get().addAuditEntry("comp.issued", `Comp pass issued to ${comp.holderName} (${comp.passTypeName})`);
      },

      addPromo: (promo) => {
        const entry: PromoDef = { id: crypto.randomUUID(), usedCount: 0, ...promo };
        set((s) => ({ promos: [entry, ...s.promos] }));
        get().addAuditEntry("promo.created", `Promo code ${promo.code} created`);
      },

      togglePromo: (id) =>
        set((s) => ({
          promos: s.promos.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
        })),

      addTeamMember: (member) => {
        const entry: TeamMember = { id: crypto.randomUUID(), ...member, addedAt: new Date().toISOString() };
        set((s) => ({ team: [...s.team, entry] }));
        get().addAuditEntry("team.added", `${member.name} added as ${member.role}`);
      },

      removeTeamMember: (id) => {
        const member = get().team.find((m) => m.id === id);
        set((s) => ({ team: s.team.filter((m) => m.id !== id) }));
        if (member) get().addAuditEntry("team.removed", `${member.name} removed`);
      },

      issueScannerCredential: (teamMemberId, gateLabel) => {
        const member = get().team.find((m) => m.id === teamMemberId);
        if (!member) return;
        const credential: ScannerCredential = {
          id: crypto.randomUUID(),
          teamMemberId,
          code: generateScannerCode(),
          gateLabel: gateLabel ?? null,
          issuedAt: new Date().toISOString(),
          revokedAt: null,
        };
        set((s) => ({ scannerCredentials: [credential, ...s.scannerCredentials] }));
        get().addAuditEntry("scanner_credential.issued", `Scanner login issued to ${member.name}${gateLabel ? ` for ${gateLabel}` : ""}`);
      },

      revokeScannerCredential: (id) => {
        const credential = get().scannerCredentials.find((c) => c.id === id);
        const member = credential ? get().team.find((m) => m.id === credential.teamMemberId) : undefined;
        set((s) => ({
          scannerCredentials: s.scannerCredentials.map((c) => (c.id === id ? { ...c, revokedAt: new Date().toISOString() } : c)),
        }));
        if (member) get().addAuditEntry("scanner_credential.revoked", `Scanner login revoked for ${member.name}`);
      },

      updateBranding: (b) => {
        set((s) => ({ branding: { ...s.branding, ...b } }));
        get().addAuditEntry("branding.updated", "Brand colours updated");
      },

      tickLiveSim: () => set({ lastSimAt: Date.now() }),
      startLiveSim: () => set({ liveSimRunning: true }),
      pauseLiveSim: () => set({ liveSimRunning: false }),

      addMockCheckIn: () => {
        const passIds = ["pass-rina-001", "pass-priya-001", "pass-amit-001", "pass-family-001", "pass-vip-001"];
        const passId = passIds[Math.floor(Math.random() * passIds.length)] ?? "pass-rina-001";
        const newCheckIn: CheckIn = {
          id: crypto.randomUUID(),
          tenant_id: "t-manhar-ahmedabad-001",
          event_id: "ev-navratri-2026-ahmedabad",
          pass_id: passId,
          night_id: "night-01",
          pass_holder_id: null,
          gate_id: "gate-g1",
          zone_id: "zone-gold-001",
          direction: "in",
          result: "allowed",
          denied_reason: null,
          scanned_by: "device-sim",
          device_id: "device-sim",
          scanned_at: new Date().toISOString(),
          synced_at: null,
          client_uuid: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        };
        set((s) => ({ checkIns: [newCheckIn, ...s.checkIns.slice(0, 49)] }));
      },
    }),
    { name: "manhar-dashboard" }
  )
);
