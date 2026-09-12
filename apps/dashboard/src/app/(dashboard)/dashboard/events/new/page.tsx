import { EventWizard } from "@/components/dashboard/event-wizard";
import { event as mockEvent } from "@manhar-garba/mock-data";

export default function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ clone?: string }>;
}) {
  // Render the wizard; clone param is checked client-side via store
  void searchParams;
  return <EventWizard cloneFrom={mockEvent} />;
}
