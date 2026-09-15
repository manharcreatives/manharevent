import { redirect } from "next/navigation";

/** M1 (2026-09-15): "My Events" merged into the single "Events" section — see
 * PROGRESS.md decision log. Old bookmarks/links still land somewhere real. */
export default function MyEventsRedirect() {
  redirect("/dashboard/events");
}
