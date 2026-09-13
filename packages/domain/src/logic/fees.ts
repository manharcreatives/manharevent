import type { Paise } from "../entities/tenant";
import { paise } from "../entities/tenant";

/**
 * The one place fees are calculated.
 *
 * This product's stated promise to both sides is that the platform fee and the
 * payment-gateway fee are **two separate visible line items**, never bundled
 * into one opaque "convenience fee" the way most ticketing sites do it. That
 * promise is only true if the number quoted to the organizer on `/pricing`,
 * the number shown to the buyer while choosing a pass, and the number actually
 * charged at checkout all come from here.
 *
 * They previously did not: `book-client` used 1% + 2%, `booking-client` used a
 * single 2.5%, and `checkout-client` had its own copy of the 1% + 2% — three
 * implementations that could drift apart, and one that already had.
 */

/** ManharEvent's own fee. Deliberately small — the pitch is that it's visible and low. */
export const PLATFORM_FEE_BPS = 100; // 1.00%

/** Razorpay's cut. Not ours, and the same wherever the organizer sells. */
export const GATEWAY_FEE_BPS = 200; // 2.00%

/** GST on tickets and on both fees. */
export const GST_BPS = 1800; // 18%

export function bpsToPercent(bps: number): string {
  const pct = bps / 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(2)}%`;
}

export interface FeeBreakdownResult {
  subtotalPaise: Paise;
  platformFeePaise: Paise;
  gatewayFeePaise: Paise;
  gstPaise: Paise;
  totalPaise: Paise;
  /** What the organizer actually receives, before refunds and payout timing. */
  organizerNetPaise: Paise;
}

/**
 * Fees are charged on the subtotal, and GST applies to the subtotal plus both
 * fees — which is why `gstPaise` can't be derived from the subtotal alone.
 */
export function computeFees(subtotalPaise: number): FeeBreakdownResult {
  const subtotal = Math.max(0, Math.round(subtotalPaise));
  const platformFee = Math.round((subtotal * PLATFORM_FEE_BPS) / 10000);
  const gatewayFee = Math.round((subtotal * GATEWAY_FEE_BPS) / 10000);
  const taxable = subtotal + platformFee + gatewayFee;
  const gst = Math.round((taxable * GST_BPS) / 10000);

  return {
    subtotalPaise: paise(subtotal),
    platformFeePaise: paise(platformFee),
    gatewayFeePaise: paise(gatewayFee),
    gstPaise: paise(gst),
    totalPaise: paise(taxable + gst),
    organizerNetPaise: paise(subtotal),
  };
}
