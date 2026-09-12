import type { Tenant, TenantBranding, TenantCommission } from "@manhar-garba/domain";
import { paise } from "@manhar-garba/domain";

export const TENANT_ID = "t-manhar-ahmedabad-001";

export const tenant: Tenant = {
  id: TENANT_ID,
  slug: "manhar",
  legal_name: "Manhar Events Pvt. Ltd.",
  display_name: "ManharEvent Ahmedabad",
  status: "active",
  gstin: "24AABCM1234A1Z5",
  pan: "AABCM1234A",
  support_phone: "+919876543210",
  support_email: "support@manharevent.com",
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-09-01T10:00:00Z",
};

export const tenantBranding: TenantBranding = {
  tenant_id: TENANT_ID,
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  primary_color: "#E84C12",
  accent_color: "#8B30C5",
  custom_domain: "navratri.manharevent.com",
  domain_verified: true,
  meta_title: "ManharEvent Ahmedabad — Navratri 2026",
  meta_description: "The biggest Navratri in Ahmedabad. Nine nights, three zones, one unforgettable season.",
};

export const tenantCommission: TenantCommission = {
  tenant_id: TENANT_ID,
  model: "percent",
  percent_bps: 250,
  flat_paise: paise(0),
  passed_to_buyer: true,
  min_fee_paise: paise(2000),
  max_fee_paise: paise(50000),
};
