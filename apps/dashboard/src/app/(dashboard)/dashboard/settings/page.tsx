import { TENANT_ID } from "@manhar-garba/mock-data";
import { getOrgSession } from "@/lib/org-session";
import { ManharSettings } from "@/components/dashboard/manhar-settings";
import { OrgSettings } from "@/components/org/org-settings";

export default async function SettingsPage() {
  const session = await getOrgSession();
  if (session && session.tenantId !== TENANT_ID) return <OrgSettings />;
  return <ManharSettings />;
}
