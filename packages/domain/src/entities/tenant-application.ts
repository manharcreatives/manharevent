// TenantApplication — added 2026-09-12 for the B2B SaaS pivot (Surface 0).
// Precedes a Tenant existing: an organizer applies here, and only once
// approved + provisioned does a real `Tenant` row get created (FE-11 decides
// whether this needs its own `tenant_applications` Postgres table).

export type TenantApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "more_info_needed";

export interface TenantApplication {
  id: string;
  orgName: string;
  contactName: string;
  phone: string;
  city: string;
  roughCapacity: number;
  desiredDomain: string;
  status: TenantApplicationStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  provisionedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
