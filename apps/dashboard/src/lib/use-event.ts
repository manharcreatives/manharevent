"use client";

import { useParams } from "next/navigation";
import { useDashboardStore, type EventPolicy } from "./dashboard-store";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

/** The public booking page for an event — one source, so Preview and Publish never disagree. */
export function publicEventUrl(slug: string, locale = "en"): string {
  return `${WEB_URL}/${locale}/e/${slug}`;
}

/**
 * Everything under `/dashboard/events/[id]` scoped to that one event.
 *
 * The store holds every event's nights, zones and pass types side by side.
 * Pages used to read the whole arrays, which was harmless with one event and
 * wrong the moment an organizer created a second: the new event's Passes tab
 * would list last year's sold-out passes. Reading through this hook is what
 * keeps each event's tabs about that event.
 *
 * `event` is only undefined for an id that doesn't exist; the event layout
 * renders the not-found state before any page below it runs.
 */
export function useEventScope() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const events = useDashboardStore((s) => s.events);
  const allNights = useDashboardStore((s) => s.nights);
  const allZones = useDashboardStore((s) => s.zones);
  const allGates = useDashboardStore((s) => s.gates);
  const venues = useDashboardStore((s) => s.venues);
  const allPassTypes = useDashboardStore((s) => s.passTypes);
  const allPriceTiers = useDashboardStore((s) => s.priceTiers);
  const allAddons = useDashboardStore((s) => s.addons);
  const allOrders = useDashboardStore((s) => s.orders);
  const allCheckIns = useDashboardStore((s) => s.checkIns);
  const policies = useDashboardStore((s) => s.policies);
  const unlistedEventIds = useDashboardStore((s) => s.unlistedEventIds);

  const event = events.find((e) => e.id === id);
  const passTypes = allPassTypes.filter((p) => p.event_id === id);
  const passTypeIds = new Set(passTypes.map((p) => p.id));

  return {
    id,
    event,
    nights: allNights.filter((n) => n.event_id === id).sort((a, b) => a.night_number - b.night_number),
    zones: allZones.filter((z) => z.event_id === id).sort((a, b) => a.sort_order - b.sort_order),
    gates: allGates.filter((g) => g.event_id === id),
    venue: venues.find((v) => v.id === event?.venue_id),
    passTypes,
    priceTiers: allPriceTiers.filter((t) => passTypeIds.has(t.pass_type_id)),
    addons: allAddons.filter((a) => a.event_id === id),
    orders: allOrders.filter((o) => o.event_id === id),
    checkIns: allCheckIns.filter((c) => c.event_id === id),
    policy: policies[id] as EventPolicy | undefined,
    unlisted: unlistedEventIds.includes(id),
  };
}
