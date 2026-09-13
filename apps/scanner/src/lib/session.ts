"use client";

import {
  EVENT_ID,
  findGateStaffByPhone,
  type GateStaffMember,
} from "@manhar-garba/mock-data";
import { normalizePhone, verifyGateCode } from "@manhar-garba/domain";

/**
 * Who is holding this phone at the gate.
 *
 * Kept in `localStorage` rather than a cookie on purpose: the scanner is an
 * offline-first PWA, so the session has to survive a dead network and a cold
 * app launch with no server round-trip. The session is device-bound — signing
 * in on one phone doesn't sign anyone in on another.
 */
export interface GateSession {
  staffId: string;
  staffName: string;
  phone: string;
  gateId: string;
  gateLabel: string;
  signedInAt: string;
}

const KEY = "manhar-scanner-session";

export function loadSession(): GateSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GateSession;
    return parsed.staffId && parsed.gateId ? parsed : null;
  } catch {
    // Corrupt or partially-written value — treat as signed out rather than
    // throwing the whole scanner into its error boundary at a live gate.
    return null;
  }
}

export function saveSession(session: GateSession): void {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}

export type SignInResult =
  | { ok: true; session: GateSession }
  | { ok: false; reason: "unknown_phone" | "revoked" | "bad_code" };

/**
 * Two independent checks, in this order:
 *   1. is this phone on the organizer's gate-staff roster at all, and
 *   2. does the code they were given actually verify against that phone.
 *
 * Both have to pass. A guard who knows someone else's code still can't get in
 * without also being on the roster under their own number, which is the whole
 * point of issuing access per person instead of per device.
 */
export function signIn(phoneInput: string, codeInput: string): SignInResult {
  const phone = normalizePhone(phoneInput);
  const member: GateStaffMember | undefined = findGateStaffByPhone(phone);

  if (!member) return { ok: false, reason: "unknown_phone" };
  if (member.revokedAt) return { ok: false, reason: "revoked" };
  if (!verifyGateCode(phone, codeInput, EVENT_ID)) return { ok: false, reason: "bad_code" };

  const session: GateSession = {
    staffId: member.id,
    staffName: member.name,
    phone: member.phone,
    gateId: member.gateId,
    gateLabel: member.gateLabel,
    signedInAt: new Date().toISOString(),
  };
  saveSession(session);
  return { ok: true, session };
}

export const SIGN_IN_ERRORS: Record<
  Exclude<SignInResult, { ok: true }>["reason"],
  string
> = {
  unknown_phone:
    "This number isn't on the gate-staff list. Ask the organizer to add it on the Team page.",
  revoked: "Access for this number was revoked. Ask the organizer to issue a new code.",
  bad_code: "Wrong code. Check the code the organizer sent you and try again.",
};
