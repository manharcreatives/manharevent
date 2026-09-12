import type { Paise } from "./tenant";

export type WalletTxnKind = "topup" | "spend" | "refund" | "adjustment";

export interface Wallet {
  id: string;
  tenant_id: string;
  event_id: string;
  user_id: string | null;
  pass_id: string | null;
  balance_paise: Paise;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  tenant_id: string;
  wallet_id: string;
  kind: WalletTxnKind;
  amount_paise: Paise;
  vendor_id: string | null;
  order_id: string | null;
  balance_after_paise: Paise;
  device_id: string | null;
  client_uuid: string | null;
  occurred_at: string;
  synced_at: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  tenant_id: string;
  event_id: string;
  name: string;
  stall_code: string | null;
  category: string | null;
  owner_user_id: string | null;
  commission_bps: number;
  status: string;
  created_at: string;
  updated_at: string;
}
