"use server";

import { cookies } from "next/headers";
import { normalizePhone } from "@manhar-garba/domain";
import {
  listApplicationsByPhone,
  createOrgSessionToken,
  verifyOrgSessionToken,
  ORG_SESSION_COOKIE,
} from "@manhar-garba/mock-data";

// Demo-level auth (P-03 replaces this) — see packages/mock-data/src/org-session.ts.

export type LoginResult =
  | { ok: true; orgSlug: string; orgName: string }
  | { ok: false; reason: "not_found" | "under_review" };

/** No SMS is actually sent — mirrors the register flow's own demo OTP bypass. */
export async function requestLoginOtpAction(phoneInput: string): Promise<{ ok: boolean }> {
  return { ok: /^\d{10}$/.test(phoneInput) };
}

export async function verifyLoginOtpAction(phoneInput: string, code: string): Promise<LoginResult> {
  // The code itself is never checked server-side — same demo bypass as
  // /register/verify's own OTP step. What matters here is whether this
  // phone belongs to an approved-and-provisioned organizer.
  if (code.length < 6) return { ok: false, reason: "not_found" };

  const phone = normalizePhone(phoneInput);
  const applications = await listApplicationsByPhone(phone);
  const approved = applications.find((a) => a.status === "approved" && a.tenantId);

  if (!approved || !approved.tenantId) {
    const pending = applications.some(
      (a) => a.status === "submitted" || a.status === "under_review" || a.status === "more_info_needed"
    );
    return { ok: false, reason: pending ? "under_review" : "not_found" };
  }

  const token = createOrgSessionToken(approved.tenantId, approved.desiredDomain);
  const jar = await cookies();
  jar.set(ORG_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false, // local demo over http — see org-session.ts
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { ok: true, orgSlug: approved.desiredDomain, orgName: approved.orgName };
}

export interface OrgSession {
  tenantId: string;
  orgSlug: string;
}

export async function getSessionAction(): Promise<OrgSession | null> {
  const jar = await cookies();
  const payload = verifyOrgSessionToken(jar.get(ORG_SESSION_COOKIE)?.value);
  return payload ? { tenantId: payload.tenantId, orgSlug: payload.orgSlug } : null;
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(ORG_SESSION_COOKIE);
}
