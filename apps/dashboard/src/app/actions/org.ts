"use server";

import { cookies } from "next/headers";
import {
  listEventsForTenant,
  createEventForTenant,
  updateEventStatus,
  getTenantBySlug,
  listEventNights,
  listZones,
  listPassTypes,
  listPriceTiers,
  ORG_SESSION_COOKIE,
  TENANT_ID,
  type CreateEventInput,
} from "@manhar-garba/mock-data";
import type { Event, EventStatus, Tenant } from "@manhar-garba/domain";
import { getOrgSession } from "@/lib/org-session";
import { seasonSales, currentNight } from "@/lib/metrics";

/**
 * Every action here re-derives the tenant from the session cookie rather
 * than trusting a client-supplied tenantId — a new organizer's dashboard
 * only ever acts on their own tenant, even though nothing stops a request
 * that skips the UI from claiming to be anyone (this is demo-level auth,
 * see packages/mock-data/src/org-session.ts).
 *
 * No session at all falls back to Manhar's tenant, not a blank/failed
 * response — this is what lets `/dashboard?demo=manhar` (the unauthenticated
 * "view demo" escape hatch from marketing's /login) keep working on a page
 * that's otherwise session-driven, matching the dashboard's pre-login-track
 * default of never requiring auth below the root gate.
 */
async function resolveTenantId(): Promise<string> {
  const session = await getOrgSession();
  return session?.tenantId ?? TENANT_ID;
}

export interface MyDashboardData {
  tenant: Tenant | null;
  events: Event[];
}

export async function getMyDashboardAction(): Promise<MyDashboardData | null> {
  const session = await getOrgSession();
  if (!session) return null;
  const [tenant, events] = await Promise.all([
    getTenantBySlug(session.orgSlug),
    listEventsForTenant(session.tenantId),
  ]);
  return { tenant, events };
}

export async function createMyEventAction(
  input: CreateEventInput
): Promise<{ ok: true; event: Event }> {
  const tenantId = await resolveTenantId();
  const event = await createEventForTenant(tenantId, input);
  return { ok: true, event };
}

export async function setMyEventStatusAction(
  eventId: string,
  status: "draft" | "published"
): Promise<{ ok: boolean }> {
  const tenantId = await resolveTenantId();
  // Ownership check — this session's tenant has to actually own the event
  // it's trying to publish, not just know its id.
  const events = await listEventsForTenant(tenantId);
  if (!events.some((e) => e.id === eventId)) return { ok: false };
  const updated = await updateEventStatus(eventId, status);
  return { ok: Boolean(updated) };
}

export interface MyEventSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  status: EventStatus;
  starts_on: string;
  ends_on: string;
  nightsCount: number;
  timingLabel: string;
  passesSold: number;
  admitsSold: number;
  grossPaise: number;
  capacity: number;
  zonesCount: number;
  passTypesCount: number;
}

/** M1 (2026-09-15): the single tenant-scoped "Events" list — same shape
 * (stats included) whether it's Manhar or any other organizer, sourced from
 * the shared store instead of `dashboard-store.ts`'s Manhar-only Zustand
 * state. See PROGRESS.md decision log. */
export async function listMyEventsAction(): Promise<MyEventSummary[]> {
  const tenantId = await resolveTenantId();
  const events = await listEventsForTenant(tenantId);

  return Promise.all(
    events.map(async (event) => {
      const [nights, zones, passTypes] = await Promise.all([
        listEventNights(event.id),
        listZones(event.id),
        listPassTypes(event.id),
      ]);
      const priceTierLists = await Promise.all(passTypes.map((pt) => listPriceTiers(pt.id)));
      const priceTiers = priceTierLists.flat();
      const sales = seasonSales(passTypes, priceTiers, zones);
      const upcoming = currentNight(nights);
      const timingLabel = !upcoming
        ? "No nights scheduled"
        : upcoming.mode === "tonight"
          ? `Night ${upcoming.night.night_number} is tonight`
          : upcoming.mode === "after"
            ? "Season complete"
            : upcoming.mode === "before"
              ? `Opens in ${upcoming.daysAway} day${upcoming.daysAway === 1 ? "" : "s"}`
              : `Night ${upcoming.night.night_number} in ${upcoming.daysAway} day${upcoming.daysAway === 1 ? "" : "s"}`;

      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        subtitle: event.subtitle,
        status: event.status,
        starts_on: event.starts_on,
        ends_on: event.ends_on,
        nightsCount: nights.length,
        timingLabel,
        passesSold: sales.passesSold,
        admitsSold: sales.admitsSold,
        grossPaise: sales.grossPaise,
        capacity: zones.reduce((sum, z) => sum + z.capacity, 0),
        zonesCount: zones.length,
        passTypesCount: passTypes.length,
      };
    })
  );
}

export async function logoutOrgAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(ORG_SESSION_COOKIE);
}
