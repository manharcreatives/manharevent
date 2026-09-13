"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Event, EventNight, Zone, Gate, Venue, PassType, PriceTier, AddOn, Order, CheckIn, Refund, RefundTier, ReentryPolicy } from "@manhar-garba/domain";
import { issueGateCode, normalizePhone, paise, DEFAULT_REFUND_TIERS, refundPercentFor } from "@manhar-garba/domain";
import {
  event as mockEvent,
  eventNights as mockEventNights,
  venue as mockVenue,
  gates as mockGates,
  nightLineup as mockNightLineup,
  zones as mockZones,
  passTypes as mockPassTypes,
  priceTiers as mockPriceTiers,
  addons as mockAddons,
  TENANT_ID,
  orders as mockOrders,
  checkIns as mockCheckIns,
  gateStaff as mockGateStaff,
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
  /** Which gate a `gate_staff` member is posted to. */
  gateLabel?: string;
  addedAt: string;
}

const initialTeam: TeamMember[] = [
  { id: "t1", name: "Jignesh Shah", phone: "+919876543210", role: "owner", addedAt: new Date(Date.now() - 86400_000 * 7).toISOString() },
  { id: "t2", name: "Meena Desai",  phone: "+919876543211", role: "finance", addedAt: new Date(Date.now() - 86400_000 * 5).toISOString() },
  // The gate staff come from shared mock-data rather than being invented here,
  // because apps/scanner validates sign-ins against that same roster.
  ...mockGateStaff.map((m) => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    role: "gate_staff" as const,
    gateLabel: m.gateLabel,
    addedAt: new Date(Date.now() - 86400_000 * 3).toISOString(),
  })),
];

// ─── Scanner credentials ─────────────────────────────────────────────────
// "Gate-scanner access is issued only from the dashboard" (docs/02-product/
// user-flows.md, Surface 3): a guard never self-registers. The organizer adds
// them here with their mobile number and hands them a code.
//
// The code itself is *derived*, not stored — see packages/domain/src/logic/
// gate-access.ts for why. That is what lets apps/scanner (a different origin,
// with no shared storage) verify a code issued here seconds ago. All this
// store keeps is the serial, which "regenerate" bumps to invalidate the
// previous code.
export interface ScannerCredential {
  id: string;
  teamMemberId: string;
  /** Bumped on re-issue; the code is derived from (phone, event, serial). */
  serial: number;
  gateLabel: string | null;
  issuedAt: string;
  revokedAt: string | null;
}

/** Every gate-staff member on the seeded roster starts with live access. */
const initialCredentials: ScannerCredential[] = mockGateStaff.map((m) => ({
  id: `cred-${m.id}`,
  teamMemberId: m.id,
  serial: m.serial,
  gateLabel: m.gateLabel,
  issuedAt: new Date(Date.now() - 86400_000 * 3).toISOString(),
  revokedAt: null,
}));

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

// ─── Vendors & sponsors ──────────────────────────────────────────────────
// Stalls and partners the organizer manages alongside the event itself. Money
// is held in paise everywhere in this codebase — never rupees — so the same
// `<Money>` component formats it consistently.
export interface VendorRecord {
  id: string;
  name: string;
  category: string;
  zone: string;
  contact: string;
  phone: string;
  revenuePaise: number;
  active: boolean;
}

export type SponsorStatus = "confirmed" | "pending" | "declined";

export interface SponsorRecord {
  id: string;
  name: string;
  tier: string;
  contact: string;
  phone: string;
  budgetPaise: number;
  status: SponsorStatus;
}

const initialVendors: VendorRecord[] = [
  { id: "v1", name: "Patel Food Corner", category: "Food & Beverages", zone: "General Zone", contact: "Haresh Patel", phone: "+919825022001", revenuePaise: 48_600_00, active: true },
  { id: "v2", name: "Garba Merchandise", category: "Merchandise", zone: "Gold Zone", contact: "Nita Desai", phone: "+919825022002", revenuePaise: 22_300_00, active: true },
  { id: "v3", name: "Parking Services", category: "Parking", zone: "All zones", contact: "Bharat Shah", phone: "+919825022003", revenuePaise: 18_900_00, active: true },
];

const initialSponsors: SponsorRecord[] = [
  { id: "s1", name: "Gujarat Textiles Co.", tier: "Title Sponsor", contact: "Rajesh Modi", phone: "+919825033001", budgetPaise: 5_00_000_00, status: "confirmed" },
  { id: "s2", name: "Parle Agro", tier: "Gold Sponsor", contact: "Sneha Rao", phone: "+919825033002", budgetPaise: 2_50_000_00, status: "confirmed" },
  { id: "s3", name: "Lifestyle Stores", tier: "Silver Sponsor", contact: "Amit Kapadia", phone: "+919825033003", budgetPaise: 1_00_000_00, status: "pending" },
];

// ─── Payout & notification settings ──────────────────────────────────────
export interface BankAccount {
  accountHolder: string;
  /** Full number is never rendered — see `maskedAccountNumber`. */
  accountNumber: string;
  ifsc: string;
  updatedAt: string | null;
}

export interface NotificationPrefs {
  whatsappTickets: boolean;
  whatsappReminders: boolean;
  smsFallback: boolean;
  emailInvoices: boolean;
  dailySalesDigest: boolean;
  lowStockAlerts: boolean;
}

/** `Season Couple Gold` -> `SEASON_COUPLE_GOLD`, the shape every fixture code uses. */
function toCode(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 32);
}

/** Last four digits only — a bank account number is not a thing to leave on a screen. */
export function maskedAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length < 4) return "—";
  return `${"•".repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}

// ─── Pass-type & add-on drafts ─────────────────────────────────
// What an organizer actually fills in. Everything else on `PassType` (ids,
// timestamps, sold/held counts) is bookkeeping the store fills in itself.
export interface PassTypeDraft {
  name: string;
  zoneId: string;
  kind: PassType["kind"];
  admits: number;
  nightIds: string[];
  totalQuantity: number;
  maxPerOrder: number;
  pricePaise: number;
  description: string;
}

export interface AddonDraft {
  name: string;
  kind: AddOn["kind"];
  pricePaise: number;
  totalQuantity: number | null;
  zoneId: string | null;
}

// ─── Events: creation, policy, visibility ────────────────────────────────
export type ReentryMode = "unlimited" | "once" | "timed";

export interface EventPolicy {
  refundTiers: RefundTier[];
  reentry: ReentryMode;
  /** Only meaningful when `reentry === "timed"`. */
  reentryWindowMinutes: number;
}

const DEFAULT_POLICY: EventPolicy = {
  refundTiers: DEFAULT_REFUND_TIERS,
  reentry: "unlimited",
  reentryWindowMinutes: 30,
};

export interface EventDraft {
  title: string;
  subtitle: string;
  category: string;
  /** `YYYY-MM-DD` of the first night. */
  startDate: string;
  nightCount: number;
  venueName: string;
  city: string;
  totalCapacity: number;
  reentry: ReentryMode;
  /** When set, zones, pass types, add-ons and policy are copied from this event. */
  cloneFromId: string | null;
}

// ─── Custom domain ───────────────────────────────────────────────────────
export type DomainStatus = "not_configured" | "pending_dns" | "verified";

export interface DomainSettings {
  subdomain: string;
  customDomain: string;
  status: DomainStatus;
  checkedAt: string | null;
}

function toSlug(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event";
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toDate: string): number {
  return Math.floor((new Date(`${toDate}T00:00:00+05:30`).getTime() - new Date(fromIso).getTime()) / 86_400_000);
}

/**
 * The refund queue starts with two open requests and one already paid out, so
 * the approve/reject flow has something real to act on in a fresh demo. Each
 * amount is calculated from the order and the shared refund tiers — not typed.
 */
function seedRefunds(): Refund[] {
  const firstNight = mockEventNights.slice().sort((a, b) => a.date.localeCompare(b.date))[0]?.date ?? mockEvent.starts_on;
  const make = (orderNumber: string, reason: string, requestedAt: string, status: Refund["status"]): Refund | null => {
    const order = mockOrders.find((o) => o.order_number === orderNumber);
    if (!order) return null;
    const daysBefore = daysBetween(requestedAt, firstNight);
    const percent = refundPercentFor(daysBefore);
    return {
      id: `ref-seed-${orderNumber}`,
      tenant_id: order.tenant_id,
      order_id: order.id,
      pass_ids: [],
      requested_by: order.buyer_phone,
      approved_by: status === "completed" ? "Meena Desai" : null,
      reason,
      policy_snapshot: { percent, daysBefore },
      amount_paise: paise(Math.round(((order.subtotal_paise - order.discount_paise) * percent) / 100)),
      status,
      provider_refund_id: status === "completed" ? "rfnd_demo_0001" : null,
      requested_at: requestedAt,
      resolved_at: status === "completed" ? "2026-09-08T10:00:00Z" : null,
      created_at: requestedAt,
      updated_at: requestedAt,
    };
  };
  return [
    make("MG26-000104", "Travelling abroad for work that week", "2026-09-11T08:20:00Z", "requested"),
    make("MG26-000102", "Family function clashes with the dates", "2026-09-12T16:45:00Z", "requested"),
    make("MG26-000103", "Bought the wrong zone", "2026-09-06T12:00:00Z", "completed"),
  ].filter((r): r is Refund => r !== null);
}

// ─── State ───────────────────────────────────────────────────────────────
interface DashboardState {
  currentRole: Role;
  events: Event[];
  currentEventId: string;
  nights: EventNight[];
  /** Artist ids per night, headliner first. */
  lineupByNight: Record<string, string[]>;
  zones: Zone[];
  gates: Gate[];
  venues: Venue[];
  /** Refund and re-entry rules, keyed by event id. */
  policies: Record<string, EventPolicy>;
  /** Published but link-only — not listed on the organizer's own home page. */
  unlistedEventIds: string[];
  refunds: Refund[];
  domainSettings: DomainSettings;
  passTypes: PassType[];
  priceTiers: PriceTier[];
  addons: AddOn[];
  orders: Order[];
  checkIns: CheckIn[];
  auditLog: AuditEntry[];
  team: TeamMember[];
  scannerCredentials: ScannerCredential[];
  comps: CompPass[];
  promos: PromoDef[];
  branding: BrandingConfig;
  vendors: VendorRecord[];
  sponsors: SponsorRecord[];
  bankAccount: BankAccount;
  notifications: NotificationPrefs;
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
  regenerateScannerCredential: (id: string) => void;
  /** The code to show for a credential right now. */
  scannerCodeFor: (credential: ScannerCredential) => string;
  updateBranding: (b: Partial<BrandingConfig>) => void;
  updateNight: (id: string, patch: Partial<EventNight>) => void;
  updateZone: (id: string, patch: Partial<Zone>) => void;
  updateGate: (id: string, patch: Partial<Gate>) => void;
  updateVenue: (venueId: string, patch: Partial<Venue>) => void;
  /** Creates a draft event (optionally cloned) and returns its id. */
  createEvent: (draft: EventDraft) => string;
  updateEvent: (id: string, patch: Partial<Event>) => void;
  setEventStatus: (id: string, status: Event["status"]) => void;
  setEventUnlisted: (id: string, unlisted: boolean) => void;
  updatePolicy: (eventId: string, policy: EventPolicy) => void;
  approveRefund: (refundId: string) => void;
  rejectRefund: (refundId: string, reason: string) => void;
  updateDomainSettings: (patch: Pick<DomainSettings, "subdomain" | "customDomain">) => void;
  startDomainVerification: () => void;
  /** Demo stand-in for the DNS check a server would run. Labelled as such in the UI. */
  confirmDomainVerification: () => void;
  setNightLineup: (nightId: string, artistIds: string[]) => void;
  addPassType: (eventId: string, draft: PassTypeDraft) => void;
  updatePassType: (id: string, draft: PassTypeDraft) => void;
  removePassType: (id: string) => void;
  addPriceTier: (passTypeId: string, name: string, pricePaise: number) => void;
  updatePriceTier: (id: string, patch: Partial<PriceTier>) => void;
  removePriceTier: (id: string) => void;
  addAddon: (eventId: string, draft: AddonDraft) => void;
  updateAddon: (id: string, draft: AddonDraft) => void;
  removeAddon: (id: string) => void;
  addVendor: (v: Omit<VendorRecord, "id" | "revenuePaise" | "active">) => void;
  updateVendor: (id: string, patch: Partial<VendorRecord>) => void;
  removeVendor: (id: string) => void;
  addSponsor: (sp: Omit<SponsorRecord, "id">) => void;
  updateSponsor: (id: string, patch: Partial<SponsorRecord>) => void;
  removeSponsor: (id: string) => void;
  updateBankAccount: (b: Omit<BankAccount, "updatedAt">) => void;
  updateNotifications: (n: Partial<NotificationPrefs>) => void;
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
      lineupByNight: Object.fromEntries(
        mockEventNights.map((n) => [
          n.id,
          mockNightLineup
            .filter((l) => l.night_id === n.id)
            .sort((a, b) => a.billing - b.billing)
            .map((l) => l.artist_id),
        ])
      ),
      zones: mockZones,
      gates: mockGates,
      venues: [mockVenue],
      policies: { [mockEvent.id]: DEFAULT_POLICY },
      unlistedEventIds: [],
      refunds: seedRefunds(),
      domainSettings: {
        subdomain: "manhar",
        customDomain: "manharnavratri.in",
        status: "verified",
        checkedAt: "2026-08-14T09:00:00Z",
      },
      passTypes: mockPassTypes,
      priceTiers: mockPriceTiers,
      addons: mockAddons,
      orders: mockOrders,
      checkIns: mockCheckIns,
      auditLog: initialAuditLog,
      team: initialTeam,
      scannerCredentials: initialCredentials,
      comps: [],
      promos: [
        { id: "p1", code: "NAVRATRI10", type: "percent", value: 10, maxUses: 100, usedCount: 23, active: true },
        { id: "p2", code: "EARLYBIRD", type: "flat", value: 500_00, maxUses: 50, usedCount: 50, active: false },
      ],
      branding: { primaryColor: "#F55B2A", accentColor: "#B24FE0", logoUrl: null },
      vendors: initialVendors,
      sponsors: initialSponsors,
      bankAccount: {
        accountHolder: "Manhar Creatives Pvt Ltd",
        accountNumber: "50100234567890",
        ifsc: "HDFC0001234",
        updatedAt: new Date(Date.now() - 86400_000 * 12).toISOString(),
      },
      notifications: {
        whatsappTickets: true,
        whatsappReminders: true,
        smsFallback: true,
        emailInvoices: true,
        dailySalesDigest: false,
        lowStockAlerts: true,
      },
      liveSimRunning: true,
      lastSimAt: Date.now(),

      // actions
      setCurrentRole: (role) => set({ currentRole: role }),
      setCurrentEvent: (id) => set({ currentEventId: id }),

      addAuditEntry: (action, detail) => {
        const entry: AuditEntry = {
          id: crypto.randomUUID(),
          action,
          // Whoever the demo is "viewing as" on the Team page — so switching to
          // Finance and approving a refund logs Meena, not the owner.
          actor: get().team.find((m) => m.role === get().currentRole)?.name ?? "Jignesh Shah",
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
          serial: 1,
          gateLabel: gateLabel ?? member.gateLabel ?? null,
          issuedAt: new Date().toISOString(),
          revokedAt: null,
        };
        set((s) => ({ scannerCredentials: [credential, ...s.scannerCredentials] }));
        get().addAuditEntry(
          "scanner_credential.issued",
          `Scanner login issued to ${member.name} (${member.phone})${credential.gateLabel ? ` for ${credential.gateLabel}` : ""}`
        );
      },

      revokeScannerCredential: (id) => {
        const credential = get().scannerCredentials.find((c) => c.id === id);
        const member = credential ? get().team.find((m) => m.id === credential.teamMemberId) : undefined;
        set((s) => ({
          scannerCredentials: s.scannerCredentials.map((c) =>
            c.id === id ? { ...c, revokedAt: new Date().toISOString() } : c
          ),
        }));
        if (member) {
          get().addAuditEntry(
            "scanner_credential.revoked",
            `Scanner login revoked for ${member.name} (${member.phone})`
          );
        }
      },

      regenerateScannerCredential: (id) => {
        const credential = get().scannerCredentials.find((c) => c.id === id);
        const member = credential ? get().team.find((m) => m.id === credential.teamMemberId) : undefined;
        set((s) => ({
          scannerCredentials: s.scannerCredentials.map((c) =>
            c.id === id ? { ...c, serial: c.serial + 1, issuedAt: new Date().toISOString(), revokedAt: null } : c
          ),
        }));
        if (member) {
          get().addAuditEntry(
            "scanner_credential.regenerated",
            `New scanner code generated for ${member.name} — the previous code no longer works`
          );
        }
      },

      scannerCodeFor: (credential) => {
        const member = get().team.find((m) => m.id === credential.teamMemberId);
        if (!member) return "——————";
        return issueGateCode({
          phone: normalizePhone(member.phone),
          // Fixed to the seeded event, not the one selected in the sidebar:
          // apps/scanner verifies against that event, and a code that changed
          // whenever the organizer switched events would lock the gate out.
          eventId: mockEvent.id,
          serial: credential.serial,
        });
      },

      updateBranding: (b) => {
        set((s) => ({ branding: { ...s.branding, ...b } }));
        get().addAuditEntry("branding.updated", "Brand colours updated");
      },

      updateZone: (id, patch) => {
        set((s) => ({
          zones: s.zones.map((z) =>
            z.id === id ? { ...z, ...patch, updated_at: new Date().toISOString() } : z
          ),
        }));
        const z = get().zones.find((x) => x.id === id);
        if (z) get().addAuditEntry("zone.updated", `${z.name} updated`);
      },

      updateGate: (id, patch) => {
        set((s) => ({
          gates: s.gates.map((g) =>
            g.id === id ? { ...g, ...patch, updated_at: new Date().toISOString() } : g
          ),
        }));
        const g = get().gates.find((x) => x.id === id);
        if (g) get().addAuditEntry("gate.updated", `${g.name} updated`);
      },

      updateVenue: (venueId, patch) => {
        set((s) => ({
          venues: s.venues.map((v) =>
            v.id === venueId ? { ...v, ...patch, updated_at: new Date().toISOString() } : v
          ),
        }));
        get().addAuditEntry("venue.updated", `Venue details updated`);
      },

      updateNight: (id, patch) => {
        set((s) => ({
          nights: s.nights.map((n) =>
            n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n
          ),
        }));
        const night = get().nights.find((n) => n.id === id);
        if (night) get().addAuditEntry("night.updated", `Night ${night.night_number} updated`);
      },

      setNightLineup: (nightId, artistIds) => {
        set((s) => ({ lineupByNight: { ...s.lineupByNight, [nightId]: artistIds } }));
        const night = get().nights.find((n) => n.id === nightId);
        if (night) {
          get().addAuditEntry(
            "night.lineup_updated",
            `Night ${night.night_number} lineup set to ${artistIds.length} artist(s)`
          );
        }
      },

      createEvent: (draft) => {
        const state = get();
        const now = new Date().toISOString();
        const eventId = `ev-${crypto.randomUUID().slice(0, 8)}`;
        const source = draft.cloneFromId ? state.events.find((e) => e.id === draft.cloneFromId) : undefined;

        let slug = toSlug(draft.title);
        if (state.events.some((e) => e.slug === slug)) slug = `${slug}-${eventId.slice(-4)}`;

        const venue: Venue = {
          id: `venue-${crypto.randomUUID().slice(0, 8)}`,
          tenant_id: TENANT_ID,
          name: draft.venueName,
          address: null,
          city: draft.city,
          state: "Gujarat",
          pincode: null,
          lat: null,
          lng: null,
          google_maps_url: null,
          map_image_url: null,
          total_capacity: draft.totalCapacity,
          created_at: now,
          updated_at: now,
        };

        const sourceNights = source
          ? state.nights.filter((n) => n.event_id === source.id).sort((a, b) => a.night_number - b.night_number)
          : [];
        const nights: EventNight[] = Array.from({ length: draft.nightCount }, (_, i) => {
          const date = addDays(draft.startDate, i);
          const template = sourceNights[i];
          return {
            id: `${eventId}-night-${String(i + 1).padStart(2, "0")}`,
            tenant_id: TENANT_ID,
            event_id: eventId,
            night_number: i + 1,
            date,
            gates_open_at: `${date}T17:00:00+05:30`,
            starts_at: `${date}T19:00:00+05:30`,
            ends_at: `${date}T23:59:00+05:30`,
            theme: template?.theme ?? null,
            theme_color: template?.theme_color ?? null,
            dress_code: template?.dress_code ?? null,
            notes: null,
            status: "scheduled",
            created_at: now,
            updated_at: now,
          };
        });
        const nightIdByNumber = new Map(nights.map((n) => [n.night_number, n.id]));

        let zones: Zone[];
        let gates: Gate[];
        let passTypes: PassType[] = [];
        let priceTiers: PriceTier[] = [];
        let addons: AddOn[] = [];

        if (source) {
          // Clone: carry over the structure that took last year to get right,
          // reset everything that belongs to last year's sales.
          const zoneIdMap = new Map<string, string>();
          zones = state.zones
            .filter((z) => z.event_id === source.id)
            .map((z) => {
              const id = `zone-${crypto.randomUUID().slice(0, 8)}`;
              zoneIdMap.set(z.id, id);
              return { ...z, id, event_id: eventId, created_at: now, updated_at: now };
            });
          gates = state.gates
            .filter((g) => g.event_id === source.id)
            .map((g) => ({ ...g, id: `gate-${crypto.randomUUID().slice(0, 8)}`, event_id: eventId, created_at: now, updated_at: now }));
          const nightNumberById = new Map(sourceNights.map((n) => [n.id, n.night_number]));
          const passTypeIdMap = new Map<string, string>();
          passTypes = state.passTypes
            .filter((pt) => pt.event_id === source.id)
            .map((pt) => {
              const id = `pt-${crypto.randomUUID().slice(0, 8)}`;
              passTypeIdMap.set(pt.id, id);
              const nightIds = pt.night_ids
                .map((nid) => nightIdByNumber.get(nightNumberById.get(nid) ?? -1))
                .filter((x): x is string => Boolean(x));
              return {
                ...pt,
                id,
                event_id: eventId,
                zone_id: zoneIdMap.get(pt.zone_id) ?? pt.zone_id,
                night_ids: nightIds.length > 0 ? nightIds : nights.map((n) => n.id),
                sold_quantity: 0,
                held_quantity: 0,
                sale_starts_at: null,
                sale_ends_at: null,
                created_at: now,
                updated_at: now,
              };
            });
          priceTiers = state.priceTiers
            .filter((t) => passTypeIdMap.has(t.pass_type_id))
            .map((t) => ({
              ...t,
              id: `tier-${crypto.randomUUID().slice(0, 8)}`,
              pass_type_id: passTypeIdMap.get(t.pass_type_id)!,
              quantity_sold: 0,
              starts_at: null,
              ends_at: null,
              created_at: now,
              updated_at: now,
            }));
          addons = state.addons
            .filter((a) => a.event_id === source.id)
            .map((a) => ({
              ...a,
              id: `addon-${crypto.randomUUID().slice(0, 8)}`,
              event_id: eventId,
              zone_id: a.zone_id ? zoneIdMap.get(a.zone_id) ?? null : null,
              sold_quantity: 0,
              created_at: now,
              updated_at: now,
            }));
        } else {
          // New event: a working Garba starting point, so "create" leaves the
          // organizer with something they can publish, not an empty shell.
          const cap = Math.max(100, draft.totalCapacity);
          const zoneSeed = [
            { code: "VIP", name: "VIP Zone", share: 0.1, color: "hsl(282 74% 62%)", description: "Front zone closest to the stage." },
            { code: "GOLD", name: "Gold Zone", share: 0.35, color: "hsl(42 96% 58%)", description: "Standing zone with a clear stage view." },
            { code: "GENERAL", name: "General Zone", share: 0.55, color: "hsl(14 92% 56%)", description: "Open standing zone. Dress code enforced at the gate." },
          ];
          zones = zoneSeed.map((z, i) => ({
            id: `zone-${crypto.randomUUID().slice(0, 8)}`,
            tenant_id: TENANT_ID,
            event_id: eventId,
            code: z.code,
            name: z.name,
            description: z.description,
            capacity: Math.round(cap * z.share),
            color: z.color,
            sort_order: i,
            created_at: now,
            updated_at: now,
          }));
          gates = zones.map((z, i) => ({
            id: `gate-${crypto.randomUUID().slice(0, 8)}`,
            tenant_id: TENANT_ID,
            event_id: eventId,
            code: `G${i + 1}`,
            name: `Gate ${i + 1} — ${z.name.replace(" Zone", "")}`,
            direction: "both" as const,
            created_at: now,
            updated_at: now,
          }));
          const [vip, gold, general] = zones;
          const allNights = nights.map((n) => n.id);
          const defaults = [
            { zone: general!, name: "Season Solo — General", kind: "season" as const, admits: 1, qty: Math.round(general!.capacity * 0.6), price: 249900 },
            { zone: gold!, name: "Season Couple — Gold", kind: "season" as const, admits: 2, qty: Math.round(gold!.capacity / 2), price: 899900 },
            { zone: general!, name: "Any One Night — General", kind: "daily" as const, admits: 1, qty: Math.round(general!.capacity * 0.4), price: 49900 },
            { zone: vip!, name: "Season VIP", kind: "season" as const, admits: 1, qty: vip!.capacity, price: 1499900 },
          ];
          defaults.forEach((d, i) => {
            const id = `pt-${crypto.randomUUID().slice(0, 8)}`;
            passTypes.push({
              id,
              tenant_id: TENANT_ID,
              event_id: eventId,
              zone_id: d.zone.id,
              code: toCode(d.name),
              name: d.name,
              description: `${d.kind === "season" ? `All ${nights.length} nights` : "Valid for any one night"}, ${d.zone.name}. Admits ${d.admits}.`,
              kind: d.kind,
              admits: d.admits,
              night_ids: allNights,
              total_quantity: d.qty,
              sold_quantity: 0,
              held_quantity: 0,
              min_per_order: 1,
              max_per_order: 6,
              sale_starts_at: null,
              sale_ends_at: null,
              requires_photo: false,
              is_transferable: true,
              status: "on_sale",
              sort_order: i,
              created_at: now,
              updated_at: now,
            });
            priceTiers.push({
              id: `tier-${crypto.randomUUID().slice(0, 8)}`,
              tenant_id: TENANT_ID,
              pass_type_id: id,
              name: "Regular",
              price_paise: paise(d.price),
              starts_at: null,
              ends_at: null,
              quantity_cap: null,
              quantity_sold: 0,
              sort_order: 0,
              created_at: now,
              updated_at: now,
            });
          });
        }

        const event: Event = {
          id: eventId,
          tenant_id: TENANT_ID,
          venue_id: venue.id,
          slug,
          title: draft.title,
          subtitle: draft.subtitle || null,
          description: source?.description ?? null,
          status: "draft",
          starts_on: draft.startDate,
          ends_on: addDays(draft.startDate, draft.nightCount - 1),
          timezone: "Asia/Kolkata",
          cover_url: null,
          og_image_url: null,
          category: draft.category,
          reentry_policy: (draft.reentry === "timed" ? "unlimited" : draft.reentry) as ReentryPolicy,
          reentry_window_minutes: draft.reentry === "timed" ? 30 : null,
          published_at: null,
          created_at: now,
          updated_at: now,
        };

        const policy: EventPolicy = source
          ? { ...(state.policies[source.id] ?? DEFAULT_POLICY), reentry: draft.reentry }
          : { ...DEFAULT_POLICY, reentry: draft.reentry };

        set((s) => ({
          events: [...s.events, event],
          venues: [...s.venues, venue],
          nights: [...s.nights, ...nights],
          zones: [...s.zones, ...zones],
          gates: [...s.gates, ...gates],
          passTypes: [...s.passTypes, ...passTypes],
          priceTiers: [...s.priceTiers, ...priceTiers],
          addons: [...s.addons, ...addons],
          policies: { ...s.policies, [eventId]: policy },
          currentEventId: eventId,
        }));
        get().addAuditEntry(
          source ? "event.cloned" : "event.created",
          source
            ? `"${draft.title}" cloned from "${source.title}" — ${zones.length} zones, ${passTypes.length} pass types, ${addons.length} add-ons copied`
            : `"${draft.title}" created as a draft with ${zones.length} zones and ${passTypes.length} starter pass types`
        );
        return eventId;
      },

      updateEvent: (id, patch) => {
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e)),
        }));
      },

      setEventStatus: (id, status) => {
        const ev = get().events.find((e) => e.id === id);
        if (!ev) return;
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status,
                  published_at: status === "published" ? e.published_at ?? new Date().toISOString() : e.published_at,
                  updated_at: new Date().toISOString(),
                }
              : e
          ),
        }));
        get().addAuditEntry(
          status === "published" ? "event.published" : "event.unpublished",
          `${ev.title} ${status === "published" ? "published" : "moved back to draft"}`
        );
      },

      setEventUnlisted: (id, unlisted) => {
        const ev = get().events.find((e) => e.id === id);
        set((s) => ({
          unlistedEventIds: unlisted
            ? [...new Set([...s.unlistedEventIds, id])]
            : s.unlistedEventIds.filter((x) => x !== id),
        }));
        if (ev) get().addAuditEntry("event.visibility_changed", `${ev.title} set to ${unlisted ? "unlisted (link only)" : "public"}`);
      },

      updatePolicy: (eventId, policy) => {
        const ev = get().events.find((e) => e.id === eventId);
        set((s) => ({
          policies: { ...s.policies, [eventId]: policy },
          events: s.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  reentry_policy: (policy.reentry === "timed" ? "unlimited" : policy.reentry) as ReentryPolicy,
                  reentry_window_minutes: policy.reentry === "timed" ? policy.reentryWindowMinutes : null,
                  updated_at: new Date().toISOString(),
                }
              : e
          ),
        }));
        const tiers = policy.refundTiers
          .slice()
          .sort((a, b) => b.minDaysBefore - a.minDaysBefore)
          .map((t) => `${t.minDaysBefore}+d ${t.percent}%`)
          .join(", ");
        get().addAuditEntry(
          "policy.updated",
          `${ev?.title ?? "Event"}: refunds ${tiers}; re-entry ${policy.reentry}${policy.reentry === "timed" ? ` (${policy.reentryWindowMinutes} min)` : ""}`
        );
      },

      approveRefund: (refundId) => {
        const refund = get().refunds.find((r) => r.id === refundId);
        if (!refund || refund.status !== "requested") return;
        const order = get().orders.find((o) => o.id === refund.order_id);
        const now = new Date().toISOString();
        const approver = get().team.find((m) => m.role === get().currentRole)?.name ?? "Jignesh Shah";
        set((s) => ({
          refunds: s.refunds.map((r) =>
            r.id === refundId
              ? { ...r, status: "processing", approved_by: approver, resolved_at: now, updated_at: now }
              : r
          ),
          // A full-percentage refund closes the order; anything less leaves it
          // partially refunded, which is what the ledger and GST report read.
          orders: s.orders.map((o) =>
            o.id === refund.order_id
              ? {
                  ...o,
                  status:
                    refund.amount_paise >= o.subtotal_paise - o.discount_paise ? "refunded" : "partially_refunded",
                  updated_at: now,
                }
              : o
          ),
        }));
        get().addAuditEntry(
          "refund.approved",
          `Refund of ₹${(refund.amount_paise / 100).toLocaleString("en-IN")} approved for ${order?.buyer_name ?? "buyer"} (${order?.order_number ?? refund.order_id})`
        );
      },

      rejectRefund: (refundId, reason) => {
        const refund = get().refunds.find((r) => r.id === refundId);
        if (!refund || refund.status !== "requested") return;
        const order = get().orders.find((o) => o.id === refund.order_id);
        const now = new Date().toISOString();
        set((s) => ({
          refunds: s.refunds.map((r) =>
            r.id === refundId
              ? {
                  ...r,
                  status: "rejected",
                  policy_snapshot: { ...(r.policy_snapshot ?? {}), rejectionReason: reason },
                  resolved_at: now,
                  updated_at: now,
                }
              : r
          ),
        }));
        get().addAuditEntry(
          "refund.rejected",
          `Refund rejected for ${order?.buyer_name ?? "buyer"} (${order?.order_number ?? refund.order_id}): ${reason}`
        );
      },

      updateDomainSettings: (patch) => {
        const prev = get().domainSettings;
        const domainChanged = patch.customDomain.trim() !== prev.customDomain;
        set({
          domainSettings: {
            ...prev,
            ...patch,
            // A different custom domain has to be verified again from scratch.
            status: domainChanged ? (patch.customDomain.trim() ? "pending_dns" : "not_configured") : prev.status,
            checkedAt: domainChanged ? null : prev.checkedAt,
          },
        });
        get().addAuditEntry(
          "domain.updated",
          `Site address set to ${patch.subdomain}.manharevent.com${patch.customDomain ? ` and ${patch.customDomain}` : ""}`
        );
      },

      startDomainVerification: () => {
        set((s) => ({ domainSettings: { ...s.domainSettings, status: "pending_dns", checkedAt: new Date().toISOString() } }));
      },

      confirmDomainVerification: () => {
        set((s) => ({ domainSettings: { ...s.domainSettings, status: "verified", checkedAt: new Date().toISOString() } }));
        get().addAuditEntry("domain.verified", `${get().domainSettings.customDomain} verified`);
      },

      addPassType: (eventId, draft) => {
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        const passType: PassType = {
          id,
          tenant_id: TENANT_ID,
          event_id: eventId,
          zone_id: draft.zoneId,
          code: toCode(draft.name),
          name: draft.name,
          description: draft.description || null,
          kind: draft.kind,
          admits: draft.admits,
          night_ids: draft.nightIds,
          total_quantity: draft.totalQuantity,
          sold_quantity: 0,
          held_quantity: 0,
          min_per_order: 1,
          max_per_order: draft.maxPerOrder,
          sale_starts_at: null,
          sale_ends_at: null,
          requires_photo: false,
          is_transferable: true,
          status: "on_sale",
          sort_order: get().passTypes.filter((p) => p.event_id === eventId).length,
          created_at: now,
          updated_at: now,
        };
        // A pass type with no price can never be bought, so the first tier is
        // created alongside it rather than left as a second step to forget.
        const tier: PriceTier = {
          id: crypto.randomUUID(),
          tenant_id: TENANT_ID,
          pass_type_id: id,
          name: "Regular",
          price_paise: paise(draft.pricePaise),
          starts_at: null,
          ends_at: null,
          quantity_cap: null,
          quantity_sold: 0,
          sort_order: 0,
          created_at: now,
          updated_at: now,
        };
        set((s) => ({ passTypes: [...s.passTypes, passType], priceTiers: [...s.priceTiers, tier] }));
        get().addAuditEntry(
          "pass_type.created",
          `${draft.name} created — admits ${draft.admits}, ${draft.nightIds.length} night(s)`
        );
      },

      updatePassType: (id, draft) => {
        set((s) => ({
          passTypes: s.passTypes.map((pt) =>
            pt.id === id
              ? {
                  ...pt,
                  name: draft.name,
                  zone_id: draft.zoneId,
                  kind: draft.kind,
                  admits: draft.admits,
                  night_ids: draft.nightIds,
                  total_quantity: draft.totalQuantity,
                  max_per_order: draft.maxPerOrder,
                  description: draft.description || null,
                  updated_at: new Date().toISOString(),
                }
              : pt
          ),
        }));
        get().addAuditEntry("pass_type.updated", `${draft.name} updated`);
      },

      removePassType: (id) => {
        const pt = get().passTypes.find((x) => x.id === id);
        set((s) => ({
          passTypes: s.passTypes.filter((x) => x.id !== id),
          priceTiers: s.priceTiers.filter((t) => t.pass_type_id !== id),
        }));
        if (pt) get().addAuditEntry("pass_type.removed", `${pt.name} removed`);
      },

      addPriceTier: (passTypeId, name, pricePaise) => {
        const now = new Date().toISOString();
        const tier: PriceTier = {
          id: crypto.randomUUID(),
          tenant_id: TENANT_ID,
          pass_type_id: passTypeId,
          name,
          price_paise: paise(pricePaise),
          starts_at: null,
          ends_at: null,
          quantity_cap: null,
          quantity_sold: 0,
          sort_order: get().priceTiers.filter((t) => t.pass_type_id === passTypeId).length,
          created_at: now,
          updated_at: now,
        };
        set((s) => ({ priceTiers: [...s.priceTiers, tier] }));
        const pt = get().passTypes.find((x) => x.id === passTypeId);
        get().addAuditEntry("price_tier.created", `${name} tier added to ${pt?.name ?? "a pass type"}`);
      },

      updatePriceTier: (id, patch) => {
        set((s) => ({
          priceTiers: s.priceTiers.map((t) =>
            t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t
          ),
        }));
      },

      removePriceTier: (id) => {
        const tier = get().priceTiers.find((t) => t.id === id);
        set((s) => ({ priceTiers: s.priceTiers.filter((t) => t.id !== id) }));
        if (tier) get().addAuditEntry("price_tier.removed", `${tier.name} tier removed`);
      },

      addAddon: (eventId, draft) => {
        const now = new Date().toISOString();
        const addon: AddOn = {
          id: crypto.randomUUID(),
          tenant_id: TENANT_ID,
          event_id: eventId,
          code: toCode(draft.name),
          name: draft.name,
          kind: draft.kind,
          price_paise: paise(draft.pricePaise),
          wallet_credit_paise: draft.kind === "wallet_topup" ? paise(draft.pricePaise) : null,
          total_quantity: draft.totalQuantity,
          sold_quantity: 0,
          zone_id: draft.zoneId,
          status: "on_sale",
          created_at: now,
          updated_at: now,
        };
        set((s) => ({ addons: [...s.addons, addon] }));
        get().addAuditEntry("addon.created", `${draft.name} add-on created`);
      },

      updateAddon: (id, draft) => {
        set((s) => ({
          addons: s.addons.map((a) =>
            a.id === id
              ? {
                  ...a,
                  name: draft.name,
                  kind: draft.kind,
                  price_paise: paise(draft.pricePaise),
                  wallet_credit_paise: draft.kind === "wallet_topup" ? paise(draft.pricePaise) : null,
                  total_quantity: draft.totalQuantity,
                  zone_id: draft.zoneId,
                  updated_at: new Date().toISOString(),
                }
              : a
          ),
        }));
        get().addAuditEntry("addon.updated", `${draft.name} add-on updated`);
      },

      removeAddon: (id) => {
        const a = get().addons.find((x) => x.id === id);
        set((s) => ({ addons: s.addons.filter((x) => x.id !== id) }));
        if (a) get().addAuditEntry("addon.removed", `${a.name} add-on removed`);
      },

      addVendor: (v) => {
        const entry: VendorRecord = { id: crypto.randomUUID(), revenuePaise: 0, active: true, ...v };
        set((s) => ({ vendors: [entry, ...s.vendors] }));
        get().addAuditEntry("vendor.added", `${v.name} added as a ${v.category} vendor`);
      },

      updateVendor: (id, patch) => {
        set((s) => ({ vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
        const v = get().vendors.find((x) => x.id === id);
        if (v) get().addAuditEntry("vendor.updated", `${v.name} updated`);
      },

      removeVendor: (id) => {
        const v = get().vendors.find((x) => x.id === id);
        set((s) => ({ vendors: s.vendors.filter((x) => x.id !== id) }));
        if (v) get().addAuditEntry("vendor.removed", `${v.name} removed`);
      },

      addSponsor: (sp) => {
        const entry: SponsorRecord = { id: crypto.randomUUID(), ...sp };
        set((s) => ({ sponsors: [entry, ...s.sponsors] }));
        get().addAuditEntry("sponsor.added", `${sp.name} added as ${sp.tier}`);
      },

      updateSponsor: (id, patch) => {
        set((s) => ({ sponsors: s.sponsors.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
        const sp = get().sponsors.find((x) => x.id === id);
        if (sp) get().addAuditEntry("sponsor.updated", `${sp.name} updated`);
      },

      removeSponsor: (id) => {
        const sp = get().sponsors.find((x) => x.id === id);
        set((s) => ({ sponsors: s.sponsors.filter((x) => x.id !== id) }));
        if (sp) get().addAuditEntry("sponsor.removed", `${sp.name} removed`);
      },

      updateBankAccount: (b) => {
        set({ bankAccount: { ...b, updatedAt: new Date().toISOString() } });
        get().addAuditEntry(
          "payout_account.updated",
          `Payout account changed to ${maskedAccountNumber(b.accountNumber)} (${b.ifsc})`
        );
      },

      updateNotifications: (n) => {
        set((s) => ({ notifications: { ...s.notifications, ...n } }));
        get().addAuditEntry("notifications.updated", "Notification preferences saved");
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
    {
      name: "manhar-dashboard",
      // Bumped when the shape of persisted state changes. Without this, a
      // browser that used the old store keeps its stale copy and the new
      // seeded gate-staff roster never appears.
      // No `migrate`: on a version mismatch zustand discards the stale
      // persisted state and falls back to these defaults, which is what we
      // want — there is nothing in a demo store worth migrating.
      version: 7,
    }
  )
);
