import { listPassTypesForZone, listPriceTiers, listPassTypes } from "@manhar-garba/mock-data";

export interface PriceTierLike {
  price_paise: number;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
}

/**
 * The price a pass type sells at *right now*: the tier whose sale window covers
 * this moment, then the earliest-listed tier, then the cheapest on record.
 *
 * This used to live only in the booking page while the event and home pages
 * quoted `min(all tiers)` instead — which is an Early Bird price that closed on
 * 31 Aug. The landing page promised Gold "from ₹3,999" and the booking page
 * then charged ₹4,999. One function now answers for every surface.
 */
export function currentPricePaise(tiers: PriceTierLike[]): number | null {
  if (tiers.length === 0) return null;
  const now = Date.now();
  const active = tiers.find((tier) => {
    const afterStart = !tier.starts_at || new Date(tier.starts_at).getTime() <= now;
    const beforeEnd = !tier.ends_at || new Date(tier.ends_at).getTime() >= now;
    return afterStart && beforeEnd;
  });
  if (active) return active.price_paise;
  const bySort = [...tiers].sort((a, b) => a.sort_order - b.sort_order)[0];
  return bySort?.price_paise ?? Math.min(...tiers.map((t) => t.price_paise));
}

function available(pt: { total_quantity: number; sold_quantity: number; held_quantity: number }) {
  return Math.max(0, pt.total_quantity - pt.sold_quantity - pt.held_quantity);
}

/**
 * Cheapest pass in a zone that a visitor can actually buy today, or `null` when
 * the zone has nothing left. VIP is 498/500 sold in the fixtures, so the zone
 * cards used to advertise a price and a "Book Passes" button for a zone the
 * booking page then showed as sold out.
 */
export async function zoneFromPricePaise(eventId: string, zoneId: string): Promise<number | null> {
  const passTypes = await listPassTypesForZone(eventId, zoneId);
  const prices: number[] = [];
  for (const pt of passTypes) {
    if (pt.status !== "on_sale" || available(pt) <= 0) continue;
    const price = currentPricePaise(await listPriceTiers(pt.id));
    if (price !== null) prices.push(price);
  }
  return prices.length > 0 ? Math.min(...prices) : null;
}

/** Cheapest buyable pass across the whole event — the hero's "from ₹X". */
export async function eventFromPricePaise(eventId: string): Promise<number | null> {
  const passTypes = await listPassTypes(eventId);
  const prices: number[] = [];
  for (const pt of passTypes) {
    if (pt.status !== "on_sale" || available(pt) <= 0) continue;
    const price = currentPricePaise(await listPriceTiers(pt.id));
    if (price !== null) prices.push(price);
  }
  return prices.length > 0 ? Math.min(...prices) : null;
}
