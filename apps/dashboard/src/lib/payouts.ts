import type { EventNight, PassType, PriceTier, Refund } from "@manhar-garba/domain";

/**
 * Payout tranches, calculated — replacing a hardcoded list and three stat
 * tiles that read "₹68.2L / ₹87.6L / ₹52.9L" regardless of the data.
 *
 * How the maths works, so an organizer can check it:
 * - A pass's price is spread evenly over the nights it covers. A ₹9,000
 *   season pass contributes ₹1,000 to each of its nine nights.
 * - Nights are settled in blocks of three, two days after the block's last
 *   night (T+2), which is when that block's entry risk is over.
 * - TDS under section 194-O is withheld at 1% of the gross.
 * - Approved refunds come out of the next block that hasn't settled yet.
 * - Platform and gateway fees are paid by the buyer on top of the pass price,
 *   so they never reduce what the organizer receives — see `computeFees`.
 */

export const TDS_194O_BPS = 100; // 1%
const BLOCK_SIZE = 3;
const SETTLEMENT_LAG_DAYS = 2;

export type TrancheStatus = "settled" | "scheduled";

export interface PayoutTranche {
  id: string;
  label: string;
  nightNumbers: number[];
  settlesOn: string;
  grossPaise: number;
  tdsPaise: number;
  refundsPaise: number;
  netPaise: number;
  status: TrancheStatus;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function payoutTranches(
  nights: EventNight[],
  passTypes: PassType[],
  priceTiers: PriceTier[],
  refunds: Refund[],
  today = new Date().toISOString().slice(0, 10)
): PayoutTranche[] {
  const sorted = nights.slice().sort((a, b) => a.night_number - b.night_number);
  if (sorted.length === 0) return [];

  const grossByNight = new Map<string, number>();
  for (const pt of passTypes) {
    if (pt.night_ids.length === 0) continue;
    const gross = priceTiers
      .filter((t) => t.pass_type_id === pt.id)
      .reduce((s, t) => s + t.quantity_sold * t.price_paise, 0);
    const perNight = gross / pt.night_ids.length;
    for (const nid of pt.night_ids) grossByNight.set(nid, (grossByNight.get(nid) ?? 0) + perNight);
  }

  const tranches: PayoutTranche[] = [];
  for (let i = 0; i < sorted.length; i += BLOCK_SIZE) {
    const block = sorted.slice(i, i + BLOCK_SIZE);
    const first = block[0]!;
    const last = block[block.length - 1]!;
    const grossPaise = Math.round(block.reduce((s, n) => s + (grossByNight.get(n.id) ?? 0), 0));
    const settlesOn = addDays(last.date, SETTLEMENT_LAG_DAYS);
    tranches.push({
      id: `tranche-${first.night_number}`,
      label: block.length === 1 ? `Night ${first.night_number}` : `Nights ${first.night_number}–${last.night_number}`,
      nightNumbers: block.map((n) => n.night_number),
      settlesOn,
      grossPaise,
      tdsPaise: Math.round((grossPaise * TDS_194O_BPS) / 10000),
      refundsPaise: 0,
      netPaise: 0,
      status: today >= settlesOn ? "settled" : "scheduled",
    });
  }

  let refundsOwed = refunds
    .filter((r) => r.status === "approved" || r.status === "processing" || r.status === "completed")
    .reduce((s, r) => s + r.amount_paise, 0);

  for (const t of tranches) {
    if (t.status === "scheduled" && refundsOwed > 0) {
      const available = t.grossPaise - t.tdsPaise;
      const taken = Math.min(available, refundsOwed);
      t.refundsPaise = taken;
      refundsOwed -= taken;
    }
    t.netPaise = t.grossPaise - t.tdsPaise - t.refundsPaise;
  }

  return tranches;
}
