import { cookies } from "next/headers";
import { verifyOrgSessionToken, ORG_SESSION_COOKIE } from "@manhar-garba/mock-data";

export interface OrgSession {
  tenantId: string;
  orgSlug: string;
}

/**
 * Reads the same cookie `apps/marketing`'s login sets (localhost cookies are
 * scoped by hostname, not port, so this app sees it too — see
 * apps/marketing/src/app/actions/login.ts). Demo-level auth, see
 * packages/mock-data/src/org-session.ts.
 */
export async function getOrgSession(): Promise<OrgSession | null> {
  const jar = await cookies();
  const payload = verifyOrgSessionToken(jar.get(ORG_SESSION_COOKIE)?.value);
  return payload ? { tenantId: payload.tenantId, orgSlug: payload.orgSlug } : null;
}
