import type { CheckIn, EventNight, PassType, PriceTier, Zone } from "@manhar-garba/domain";

/**
 * Numbers the dashboard shows, derived from store data — never typed in.
 *
 * Before this, the overview chart, the zone occupancy bars, "top pass types"
 * and the reports page were hardcoded arrays and a `capacity × 0.62`
 * multiplier. They looked alive and never moved, whatever the organizer did.
 *
 * Season sales come from price tiers (`quantity_sold × price_paise`) rather
 * than from the order ledger. The ledger fixtures hold a handful of recent
 * online orders; the tiers hold the whole season's sold counts, and they're
 * what the pass-type editor already shows, so the two screens agree.
 */

export interface SeasonSales {
  passesSold: number;
  admitsSold: number;
  grossPaise: number;
  byZone: { zoneId: string; name: string; color: string; grossPaise: number; passesSold: number; share: number }[];
  byPassType: { passTypeId: string; name: string; sold: number; grossPaise: number }[];
}

export function seasonSales(passTypes: PassType[], priceTiers: PriceTier[], zones: Zone[]): SeasonSales {
  const byPassType = passTypes.map((pt) => {
    const tiers = priceTiers.filter((t) => t.pass_type_id === pt.id);
    const grossPaise = tiers.reduce((s, t) => s + t.quantity_sold * t.price_paise, 0);
    return { passTypeId: pt.id, name: pt.name, sold: pt.sold_quantity, grossPaise, admits: pt.admits, zoneId: pt.zone_id };
  });

  const grossPaise = byPassType.reduce((s, p) => s + p.grossPaise, 0);

  const byZone = zones.map((z) => {
    const inZone = byPassType.filter((p) => p.zoneId === z.id);
    const zoneGross = inZone.reduce((s, p) => s + p.grossPaise, 0);
    return {
      zoneId: z.id,
      name: z.name,
      color: z.color ?? "hsl(14 92% 56%)",
      grossPaise: zoneGross,
      passesSold: inZone.reduce((s, p) => s + p.sold, 0),
      share: grossPaise > 0 ? zoneGross / grossPaise : 0,
    };
  });

  return {
    passesSold: byPassType.reduce((s, p) => s + p.sold, 0),
    admitsSold: byPassType.reduce((s, p) => s + p.sold * p.admits, 0),
    grossPaise,
    byZone,
    byPassType: byPassType
      .map(({ passTypeId, name, sold, grossPaise: g }) => ({ passTypeId, name, sold, grossPaise: g }))
      .sort((a, b) => b.sold - a.sold),
  };
}

/**
 * How many people hold a valid pass for each night — the number a Garba
 * organizer actually plans security, water and parking around. A season pass
 * counts on all nine nights; a weekend pass only on its own.
 */
export function expectedAttendanceByNight(nights: EventNight[], passTypes: PassType[]) {
  return nights
    .slice()
    .sort((a, b) => a.night_number - b.night_number)
    .map((n) => ({
      nightId: n.id,
      label: `N${n.night_number}`,
      value: passTypes
        .filter((pt) => pt.night_ids.includes(n.id))
        .reduce((s, pt) => s + pt.sold_quantity * pt.admits, 0),
    }));
}

/**
 * The night the gates are open for today, or the next one coming up. Returns
 * `mode: "before"` ahead of the season and `"after"` once it's over, so the
 * page can say "Starts in 19 days" instead of pretending it's Night 5.
 */
export function currentNight(nights: EventNight[], now = new Date()) {
  const sorted = nights.slice().sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date(now.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10); // IST
  const tonight = sorted.find((n) => n.date === today);
  if (tonight) return { night: tonight, mode: "tonight" as const, daysAway: 0 };
  const next = sorted.find((n) => n.date > today);
  if (next) {
    const daysAway = Math.round(
      (new Date(`${next.date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000
    );
    return { night: next, mode: sorted[0] === next ? ("before" as const) : ("between" as const), daysAway };
  }
  const last = sorted[sorted.length - 1];
  return last ? { night: last, mode: "after" as const, daysAway: 0 } : null;
}

/** People currently inside each zone: allowed entries minus exits, from the check-in log. */
export function insideByZone(checkIns: CheckIn[], zones: Zone[], nightId?: string) {
  const relevant = nightId ? checkIns.filter((c) => c.night_id === nightId) : checkIns;
  return zones.map((z) => {
    const inZone = relevant.filter((c) => c.zone_id === z.id && c.result === "allowed");
    const ins = inZone.filter((c) => c.direction === "in").length;
    const outs = inZone.filter((c) => c.direction === "out").length;
    return {
      name: z.name,
      color: z.color ?? "#888888",
      current: Math.max(0, ins - outs),
      capacity: z.capacity,
    };
  });
}
