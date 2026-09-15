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

// ─── Second demo organizer — Umang Garba Group ────────────────────────────────
// Umang's application is seeded already `status: "approved"` with `tenantId`
// set (fixtures/tenant-applications.ts, ta-mock-002), so this is what
// approveApplication would have produced had this session run that flow —
// a real, independent tenant to prove multi-tenant isolation with, not just
// Manhar alone.
export const UMANG_TENANT_ID = "t-umang";

export const umangTenant: Tenant = {
  id: UMANG_TENANT_ID,
  slug: "umang",
  legal_name: "Umang Garba Group",
  display_name: "Umang Garba Group",
  status: "active",
  gstin: null,
  pan: null,
  support_phone: "+919033344556",
  support_email: null,
  created_at: "2026-09-06T15:00:00Z",
  updated_at: "2026-09-06T15:00:00Z",
};

export const umangBranding: TenantBranding = {
  tenant_id: UMANG_TENANT_ID,
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  primary_color: "#F55B2A",
  accent_color: "#B24FE0",
  custom_domain: null,
  domain_verified: false,
  meta_title: "Umang Garba Group",
  meta_description: null,
};
