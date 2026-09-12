export type PassStatus =
  | "active"
  | "used_up"
  | "refunded"
  | "cancelled"
  | "blocked"
  | "transferred";

export type CheckinDirection = "in" | "out";
export type CheckinResult = "allowed" | "denied" | "override";

export interface Pass {
  id: string;
  tenant_id: string;
  event_id: string;
  order_id: string;
  order_item_id: string;
  pass_type_id: string;
  zone_id: string;
  pass_code: string;
  qr_payload: string;
  admits: number;
  night_ids: string[];
  status: PassStatus;
  issued_at: string;
  pdf_url: string | null;
  wallet_pass_url: string | null;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PassHolder {
  id: string;
  tenant_id: string;
  pass_id: string;
  holder_index: number;
  full_name: string | null;
  phone: string | null;
  photo_url: string | null;
  age_band: string | null;
  invite_code: string | null;
  filled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  tenant_id: string;
  event_id: string;
  night_id: string;
  pass_id: string;
  pass_holder_id: string | null;
  gate_id: string | null;
  zone_id: string | null;
  direction: CheckinDirection;
  result: CheckinResult;
  denied_reason: string | null;
  scanned_by: string | null;
  device_id: string | null;
  scanned_at: string;
  synced_at: string | null;
  client_uuid: string;
  created_at: string;
}

export interface ScannerDevice {
  id: string;
  tenant_id: string;
  event_id: string | null;
  device_id: string;
  label: string | null;
  assigned_user: string | null;
  gate_id: string | null;
  last_sync_at: string | null;
  manifest_version: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}
