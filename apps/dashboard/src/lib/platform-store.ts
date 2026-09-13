"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tenantApplications } from "@manhar-garba/mock-data";

/**
 * Manhar Creatives' own internal-ops state — deliberately a different store
 * from `dashboard-store.ts`.
 *
 * An organizer must never be able to reach any of this, and keeping the two
 * apart means a bug in the organizer UI can't reach a platform-wide kill
 * switch by accident. In the real system these two stores sit behind two
 * different auth boundaries; here they are at least two different modules.
 *
 * The super-admin role this implies is not yet in the data model — flagged as
 * an open item in `docs/03-architecture/data-model.md` §11.
 */

export type EmergencyKind =
  | "sales_paused"
  | "tenant_frozen"
  | "scanners_revoked"
  | "offline_allow"
  | "pass_blocked"
  | "banner";

export interface EmergencyAction {
  id: string;
  kind: EmergencyKind;
  /** Which tenant this hit, or `null` when it was platform-wide. */
  tenantId: string | null;
  scope: string;
  reason: string;
  actor: string;
  at: string;
  /** Still in force. Lifting an action sets this false; it is never deleted. */
  active: boolean;
}

export interface PlatformState {
  /** Platform-wide sales halt — overrides every tenant's own setting. */
  salesPausedGlobally: boolean;
  /** Tenant ids whose dashboard and public site are suspended. */
  frozenTenantIds: string[];
  /** Event ids whose gates are told to admit on a valid signature without a live check. */
  offlineAllowEventIds: string[];
  /** Pass codes and order numbers refused at every gate. */
  blockedPassCodes: string[];
  /** Banner shown at the top of a tenant's public site, keyed by tenant id. */
  banners: Record<string, string>;
  actions: EmergencyAction[];
}

export interface PlatformActions {
  setGlobalSalesPause: (paused: boolean, reason: string) => void;
  freezeTenant: (tenantId: string, tenantName: string, reason: string) => void;
  unfreezeTenant: (tenantId: string, tenantName: string) => void;
  revokeAllScanners: (tenantId: string, tenantName: string, reason: string) => void;
  setOfflineAllow: (eventId: string, label: string, on: boolean, reason: string) => void;
  blockPass: (passCode: string, reason: string) => void;
  unblockPass: (passCode: string) => void;
  setBanner: (tenantId: string, tenantName: string, message: string) => void;
  clearBanner: (tenantId: string, tenantName: string) => void;
}

const ACTOR = "Manhar Creatives — platform ops";

function entry(
  kind: EmergencyKind,
  tenantId: string | null,
  scope: string,
  reason: string,
  active = true
): EmergencyAction {
  return {
    id: crypto.randomUUID(),
    kind,
    tenantId,
    scope,
    reason,
    actor: ACTOR,
    at: new Date().toISOString(),
    active,
  };
}

/** A couple of resolved entries so the log doesn't read as empty on a fresh demo. */
const seedActions: EmergencyAction[] = [
  entry(
    "banner",
    tenantApplications[0]?.id ?? null,
    "Rajkot Raas Garba — public site",
    "Parking full, advised attendees to use the Kalavad Road lot",
    false
  ),
];

export const usePlatformStore = create<PlatformState & PlatformActions>()(
  persist(
    (set, get) => ({
      salesPausedGlobally: false,
      frozenTenantIds: [],
      offlineAllowEventIds: [],
      blockedPassCodes: [],
      banners: {},
      actions: seedActions,

      setGlobalSalesPause: (paused, reason) => {
        set((s) => ({
          salesPausedGlobally: paused,
          actions: [
            entry("sales_paused", null, "Every event on the platform", reason, paused),
            ...s.actions,
          ],
        }));
      },

      freezeTenant: (tenantId, tenantName, reason) => {
        set((s) => ({
          frozenTenantIds: s.frozenTenantIds.includes(tenantId)
            ? s.frozenTenantIds
            : [...s.frozenTenantIds, tenantId],
          actions: [entry("tenant_frozen", tenantId, tenantName, reason), ...s.actions],
        }));
      },

      unfreezeTenant: (tenantId, tenantName) => {
        set((s) => ({
          frozenTenantIds: s.frozenTenantIds.filter((id) => id !== tenantId),
          actions: [
            entry("tenant_frozen", tenantId, tenantName, "Freeze lifted", false),
            ...s.actions,
          ],
        }));
      },

      revokeAllScanners: (tenantId, tenantName, reason) => {
        // Deliberately not reversible from here: re-issuing access is the
        // organizer's job on their own Team page, one person at a time, so
        // that a mass revoke can never be silently undone in one click.
        set((s) => ({
          actions: [entry("scanners_revoked", tenantId, tenantName, reason), ...s.actions],
        }));
      },

      setOfflineAllow: (eventId, label, on, reason) => {
        set((s) => ({
          offlineAllowEventIds: on
            ? [...new Set([...s.offlineAllowEventIds, eventId])]
            : s.offlineAllowEventIds.filter((id) => id !== eventId),
          actions: [entry("offline_allow", null, label, reason, on), ...s.actions],
        }));
      },

      blockPass: (passCode, reason) => {
        set((s) => ({
          blockedPassCodes: [...new Set([...s.blockedPassCodes, passCode])],
          actions: [entry("pass_blocked", null, passCode, reason), ...s.actions],
        }));
      },

      unblockPass: (passCode) => {
        set((s) => ({
          blockedPassCodes: s.blockedPassCodes.filter((c) => c !== passCode),
          actions: [entry("pass_blocked", null, passCode, "Block lifted", false), ...s.actions],
        }));
      },

      setBanner: (tenantId, tenantName, message) => {
        set((s) => ({
          banners: { ...s.banners, [tenantId]: message },
          actions: [entry("banner", tenantId, tenantName, message), ...s.actions],
        }));
      },

      clearBanner: (tenantId, tenantName) => {
        const next = { ...get().banners };
        delete next[tenantId];
        set((s) => ({
          banners: next,
          actions: [entry("banner", tenantId, tenantName, "Banner removed", false), ...s.actions],
        }));
      },
    }),
    { name: "manhar-platform", version: 1 }
  )
);

/** True when anything is currently in force — drives the red bar in the admin header. */
export function hasActiveEmergency(s: PlatformState): boolean {
  return (
    s.salesPausedGlobally ||
    s.frozenTenantIds.length > 0 ||
    s.offlineAllowEventIds.length > 0 ||
    s.blockedPassCodes.length > 0 ||
    Object.keys(s.banners).length > 0
  );
}
