import type { Paise } from "./tenant";

export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type PaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

export type RefundStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "processing"
  | "completed"
  | "failed";

export interface Order {
  id: string;
  tenant_id: string;
  event_id: string;
  order_number: string;
  user_id: string | null;
  buyer_phone: string;
  buyer_name: string | null;
  buyer_email: string | null;
  status: OrderStatus;
  subtotal_paise: Paise;
  discount_paise: Paise;
  convenience_fee_paise: Paise;
  gst_paise: Paise;
  total_paise: Paise;
  promo_code_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  referrer_code: string | null;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  tenant_id: string;
  order_id: string;
  pass_type_id: string | null;
  addon_id: string | null;
  price_tier_id: string | null;
  quantity: number;
  unit_price_paise: Paise;
  line_total_paise: Paise;
  gst_rate_bps: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  order_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  provider_signature: string | null;
  method: string | null;
  amount_paise: Paise;
  status: PaymentStatus;
  failure_reason: string | null;
  raw_payload: Record<string, unknown> | null;
  captured_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: string;
  tenant_id: string;
  order_id: string;
  pass_ids: string[];
  requested_by: string | null;
  approved_by: string | null;
  reason: string | null;
  policy_snapshot: Record<string, unknown> | null;
  amount_paise: Paise;
  status: RefundStatus;
  provider_refund_id: string | null;
  requested_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  order_id: string;
  invoice_number: string;
  gstin: string | null;
  place_of_supply: string | null;
  hsn_sac: string;
  taxable_paise: Paise;
  cgst_paise: Paise;
  sgst_paise: Paise;
  igst_paise: Paise;
  total_paise: Paise;
  pdf_url: string | null;
  issued_at: string;
  created_at: string;
  updated_at: string;
}

export type LedgerAccount =
  | "gross_sales"
  | "platform_fee"
  | "gst_payable"
  | "refunds"
  | "payout"
  | "gateway_fee";

export interface LedgerEntry {
  id: string;
  tenant_id: string;
  event_id: string | null;
  order_id: string | null;
  account: LedgerAccount;
  direction: "debit" | "credit";
  amount_paise: Paise;
  reference: string | null;
  occurred_at: string;
  created_at: string;
}

export interface Payout {
  id: string;
  tenant_id: string;
  event_id: string | null;
  period_start: string | null;
  period_end: string | null;
  gross_paise: Paise | null;
  fee_paise: Paise | null;
  gst_paise: Paise | null;
  tds_paise: Paise;
  net_paise: Paise | null;
  status: string;
  utr: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}
