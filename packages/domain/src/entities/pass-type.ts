import type { Paise } from "./tenant";

export type PassKind = "season" | "weekend" | "daily" | "single_night";
export type AddonKind = "parking" | "wallet_topup" | "merchandise";
export type PromoKind = "percent" | "flat" | "bogo";

export interface PassType {
  id: string;
  tenant_id: string;
  event_id: string;
  zone_id: string;
  code: string;
  name: string;
  description: string | null;
  kind: PassKind;
  admits: number;
  night_ids: string[];
  total_quantity: number;
  sold_quantity: number;
  held_quantity: number;
  min_per_order: number;
  max_per_order: number;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  requires_photo: boolean;
  is_transferable: boolean;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PriceTier {
  id: string;
  tenant_id: string;
  pass_type_id: string;
  name: string;
  price_paise: Paise;
  starts_at: string | null;
  ends_at: string | null;
  quantity_cap: number | null;
  quantity_sold: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AddOn {
  id: string;
  tenant_id: string;
  event_id: string;
  code: string;
  name: string;
  kind: AddonKind;
  price_paise: Paise;
  wallet_credit_paise: Paise | null;
  total_quantity: number | null;
  sold_quantity: number;
  zone_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: string;
  tenant_id: string;
  event_id: string | null;
  code: string;
  kind: PromoKind;
  value_bps: number | null;
  value_paise: Paise | null;
  min_order_paise: Paise;
  max_discount_paise: Paise | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  applicable_pass_type_ids: string[];
  starts_at: string | null;
  ends_at: string | null;
  owner_label: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryHold {
  id: string;
  tenant_id: string;
  pass_type_id: string | null;
  addon_id: string | null;
  order_id: string | null;
  quantity: number;
  expires_at: string;
}
