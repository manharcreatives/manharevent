import { notFound } from "next/navigation";

// Cross-organizer, city-based discovery was removed in the 2026-09-12 pivot
// (manharevents-screen-specs.md §1.1 — "Browse by city" is struck through and
// superseded): each organizer's domain lands attendees on that organizer's own
// event directly, so a generic /[city] route no longer has anything to show.
//
// This file is neutered rather than deleted because the environment this was
// written from (Cowork, 2026-09-12) could not run `rm` against the user's
// real filesystem — see docs/PROGRESS.md's environment-constraints note.
// FE-11 (or any session with working shell access) should delete this route
// entirely instead of keeping this stub.
export default function CityPage(): never {
  notFound();
}
