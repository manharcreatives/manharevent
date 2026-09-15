/**
 * Browser stand-in for org-session.ts (see storage.browser.ts — same
 * `browser` field remap, same reasoning). Nothing client-side actually signs
 * or verifies an org session cookie — that's marketing's login action and
 * the dashboard's own server-side session read, both server components/
 * actions — so these are never really called from a browser bundle. They
 * exist only so a client file that (transitively, via the package barrel)
 * touches this module doesn't drag `node:crypto` into webpack's browser build.
 */

export const ORG_SESSION_COOKIE = "manhar_org_session";

export interface OrgSessionPayload {
  tenantId: string;
  orgSlug: string;
  exp: number;
}

export function createOrgSessionToken(): string {
  throw new Error("createOrgSessionToken is server-only");
}

export function verifyOrgSessionToken(): OrgSessionPayload | null {
  return null;
}
