import crypto from "node:crypto";

/**
 * Organizer login session token (2026-09-15).
 *
 * This is demo-level auth, standing in for real auth (P-03) the same way
 * `packages/domain/src/logic/gate-access.ts` stands in for real scanner
 * credentials — same reasoning applies: `SESSION_SECRET` ships wherever this
 * module runs, so it is a real HMAC (unlike gate-access.ts's checksum) but a
 * demo-known one. Fine for a local demo, wrong for production; P-03 replaces
 * this with a real session provider (Supabase Auth) and every call site here
 * moves behind it unchanged.
 *
 * Lives in `packages/mock-data`, not `packages/domain`, specifically because
 * this package is server-only by convention (client components never import
 * it directly — see HARD RULES) and Node's `crypto` module would break any
 * browser bundle that pulled it in.
 */

const SESSION_SECRET = "manhar-org-session-demo-v1";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export const ORG_SESSION_COOKIE = "manhar_org_session";

export interface OrgSessionPayload {
  tenantId: string;
  orgSlug: string;
  /** Epoch ms. */
  exp: number;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
}

export function createOrgSessionToken(tenantId: string, orgSlug: string): string {
  const payload: OrgSessionPayload = { tenantId, orgSlug, exp: Date.now() + SESSION_TTL_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyOrgSessionToken(token: string | undefined | null): OrgSessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  // Constant-time compare — a session cookie is exactly the kind of value a
  // timing attack targets, even in a demo.
  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as OrgSessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
