import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  getEventBySlug,
  getTenantBySlug,
  listZones,
  listPassTypes,
  listPriceTiers,
  listAddons,
} from "@manhar-garba/mock-data";
import { BookClient, type BookZone, type BookPassType, type BookAddon } from "@/components/book/book-client";

export const metadata: Metadata = { title: "Book Passes" };

// Picks the price a pass type sells at right now: the price tier whose
// sale window covers "now", falling back to the earliest-listed tier, then
// to the cheapest tier on record. Real tiering rules (early-bird cutoffs,
// etc.) live in packages/mock-data/src/fixtures/pass-types.ts.
function currentPricePaise(tiers: { price_paise: number; starts_at: string | null; ends_at: string | null; sort_order: number }[]): number {
  if (tiers.length === 0) return 0;
  const now = Date.now();
  const active = tiers.find((tr) => {
    const afterStart = !tr.starts_at || new Date(tr.starts_at).getTime() <= now;
    const beforeEnd = !tr.ends_at || new Date(tr.ends_at).getTime() >= now;
    return afterStart && beforeEnd;
  });
  if (active) return active.price_paise;
  const bySort = [...tiers].sort((a, b) => a.sort_order - b.sort_order)[0];
  return bySort?.price_paise ?? Math.min(...tiers.map((t) => t.price_paise));
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const tenant = await getTenantBySlug("manhar");
  const [zones, passTypes, addons] = await Promise.all([
    listZones(event.id),
    listPassTypes(event.id),
    listAddons(event.id),
  ]);

  const tierLists = await Promise.all(passTypes.map((pt) => listPriceTiers(pt.id)));

  const bookZones: BookZone[] = zones.map((z) => ({
    id: z.id,
    code: z.code,
    name: z.name,
    description: z.description,
    color: z.color,
  }));

  const bookPassTypes: BookPassType[] = passTypes.map((pt, i) => {
    const available = Math.max(0, pt.total_quantity - pt.sold_quantity - pt.held_quantity);
    return {
      id: pt.id,
      zoneId: pt.zone_id,
      name: pt.name,
      description: pt.description,
      kind: pt.kind,
      admits: pt.admits,
      nightIds: pt.night_ids,
      pricePaise: currentPricePaise(tierLists[i] ?? []),
      minPerOrder: pt.min_per_order,
      maxPerOrder: pt.max_per_order,
      available,
    };
  });

  const bookAddons: BookAddon[] = addons.map((a) => ({
    id: a.id,
    name: a.name,
    pricePaise: a.price_paise,
  }));

  return (
    <BookClient
      eventSlug={event.slug}
      eventId={event.id}
      tenantId={tenant?.id ?? event.tenant_id}
      zones={bookZones}
      passTypes={bookPassTypes}
      addons={bookAddons}
    />
  );
}
