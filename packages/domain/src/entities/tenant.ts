/** Branded integer type — paise, never float, never rupee-decimal. */
export type Paise = number & { readonly __brand: "Paise" };

export function paise(n: number): Paise {
  if (!Number.isInteger(n)) throw new Error(`paise() requires integer, got ${n}`);
  return n as Paise;
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export type TenantStatus = "pending" | "active" | "suspended";
export type CommissionModel = "flat" | "percent" | "hybrid";
export type MemberRole =
  | "owner"
  | "manager"
  | "finance"
  | "support"
  | "gate_staff"
  | "vendor"
  | "sponsor"
  | "artist";

// ─── Tables ──────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  slug: string;
  legal_name: string;
  display_name: string;
  status: TenantStatus;
  gstin: string | null;
  pan: string | null;
  support_phone: string | null;
  support_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantBranding {
  tenant_id: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  meta_title: string | null;
  meta_description: string | null;
}

export interface TenantCommission {
  tenant_id: string;
  model: CommissionModel;
  percent_bps: number;
  flat_paise: Paise;
  passed_to_buyer: boolean;
  min_fee_paise: Paise;
  max_fee_paise: Paise | null;
}

export interface Profile {
  id: string;
  phone: string;
  full_name: string | null;
  email: string | null;
  photo_url: string | null;
  locale: "en" | "hi" | "gu";
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: MemberRole;
  status: string;
  invited_by: string | null;
}
