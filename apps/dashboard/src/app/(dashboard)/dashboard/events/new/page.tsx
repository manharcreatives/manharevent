import { EventWizard } from "@/components/dashboard/event-wizard";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ clone?: string }>;
}) {
  // The source event lives in the organizer's persisted store, which only the
  // browser can read, so the wizard resolves the id itself.
  const { clone } = await searchParams;
  return <EventWizard cloneFromId={clone ?? null} />;
}
