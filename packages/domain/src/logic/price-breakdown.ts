import type { Paise } from "../entities/tenant";
import { paise } from "../entities/tenant";

/** Mirrors compute_order_totals() DB function. All values in paise. */
export interface PriceBreakdown {
  subtotal_paise: Paise;
  discount_paise: Paise;
  convenience_fee_paise: Paise;
  taxable_paise: Paise;
  gst_paise: Paise;
  total_paise: Paise;
  /** Effective GST rate in basis points (1800 = 18%) */
  gst_rate_bps: number;
}

export interface PriceBreakdownInput {
  line_items: Array<{
    unit_price_paise: Paise;
    quantity: number;
    gst_rate_bps: number;
  }>;
  discount_paise?: Paise;
  /** Commission config — convenience fee added to buyer */
  commission_percent_bps?: number;
  commission_flat_paise?: Paise;
  commission_passed_to_buyer?: boolean;
}

export function computePriceBreakdown(input: PriceBreakdownInput): PriceBreakdown {
  const {
    line_items,
    discount_paise: discountInput = paise(0),
    commission_percent_bps = 0,
    commission_flat_paise = paise(0),
    commission_passed_to_buyer = true,
  } = input;

  const subtotal = paise(
    line_items.reduce((acc, li) => acc + li.unit_price_paise * li.quantity, 0)
  );

  const discount = paise(Math.min(discountInput, subtotal));
  const net = paise(subtotal - discount);

  // Convenience fee (only if passed to buyer)
  let conv = paise(0);
  if (commission_passed_to_buyer) {
    const percentFee = Math.round((net * commission_percent_bps) / 10000);
    conv = paise(Math.max(percentFee + commission_flat_paise, 0));
  }

  // GST at effective rate (most tickets are 18%)
  const effectiveGstBps = line_items[0]?.gst_rate_bps ?? 1800;
  const taxable = paise(net + conv);
  const gst = paise(Math.round((taxable * effectiveGstBps) / 10000));
  const total = paise(taxable + gst);

  return {
    subtotal_paise: subtotal,
    discount_paise: discount,
    convenience_fee_paise: conv,
    taxable_paise: taxable,
    gst_paise: gst,
    total_paise: total,
    gst_rate_bps: effectiveGstBps,
  };
}
