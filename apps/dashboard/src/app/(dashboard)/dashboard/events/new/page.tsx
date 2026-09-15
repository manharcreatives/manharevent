import { TENANT_ID } from "@manhar-garba/mock-data";
import { getOrgSession } from "@/lib/org-session";
import { EventWizard } from "@/components/dashboard/event-wizard";
import { OrgCreateEvent } from "@/components/org/org-create-event";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ clone?: string }>;
}) {
  const session = await getOrgSession();
  // Manhar (or the unauthenticated ?demo=manhar preview) keeps the full
  // zoned/clone wizard; every other organizer gets the simple open-ground
  // create form — see createEventForTenant (packages/mock-data/src/repo.ts).
  if (session && session.tenantId !== TENANT_ID) {
    return <OrgCreateEvent />;
  }

  // The source event lives in the organizer's persisted store, which only the
  // browser can read, so the wizard resolves the id itself.
  const { clone } = await searchParams;
  return <EventWizard cloneFromId={clone ?? null} />;
}
