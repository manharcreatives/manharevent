/**
 * Refund tiers — the one place they're defined.
 *
 * They used to exist three times with three different answers: `/legal/
 * refund-policy` promised 90% at 7+ days, the mock repo's refund quote paid
 * 100% at 30+ days, and the dashboard's policy editor defaulted to 100% at
 * 14+ days. A buyer could read one number, be quoted a second, and have the
 * organizer's screen show a third. Everything now reads this.
 *
 * Refunds are always computed on the pass price. The platform fee and the
 * gateway fee are never refunded — the gateway keeps its cut on a reversed
 * transaction regardless, and saying so up front is the honest version.
 */

export interface RefundTier {
  /** Applies when cancelling at least this many days before the first night. */
  minDaysBefore: number;
  percent: number;
}

/** Sorted most-generous first. `minDaysBefore: 0` is the catch-all. */
export const DEFAULT_REFUND_TIERS: RefundTier[] = [
  { minDaysBefore: 14, percent: 100 },
  { minDaysBefore: 7, percent: 75 },
  { minDaysBefore: 3, percent: 50 },
  { minDaysBefore: 0, percent: 0 },
];

export function refundPercentFor(daysBefore: number, tiers: RefundTier[] = DEFAULT_REFUND_TIERS): number {
  if (daysBefore < 0) return 0; // the event has already started
  const sorted = [...tiers].sort((a, b) => b.minDaysBefore - a.minDaysBefore);
  return sorted.find((t) => daysBefore >= t.minDaysBefore)?.percent ?? 0;
}

/** "14+ days before", "7–13 days before", "Less than 3 days before" — for tables and editors. */
export function describeRefundTier(tier: RefundTier, tiers: RefundTier[] = DEFAULT_REFUND_TIERS): string {
  const sorted = [...tiers].sort((a, b) => b.minDaysBefore - a.minDaysBefore);
  const index = sorted.findIndex((t) => t.minDaysBefore === tier.minDaysBefore);
  const above = sorted[index - 1];
  if (tier.minDaysBefore === 0) {
    const next = sorted[index - 1];
    return next ? `Less than ${next.minDaysBefore} days before` : "Any time before";
  }
  if (!above) return `${tier.minDaysBefore}+ days before`;
  return `${tier.minDaysBefore}–${above.minDaysBefore - 1} days before`;
}
