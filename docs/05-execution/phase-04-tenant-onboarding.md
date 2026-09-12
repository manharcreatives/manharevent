# Phase 04 — Tenant Onboarding & White-Label

| | |
|---|---|
| **Phase ID** | `P-04` |
| **Depends on** | `P-03` |
| **Blocks** | `P-08` (public site needs branding to render) |
| **Estimated effort** | 12–16 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `03-architecture/security-and-tenancy.md`, `04-design/design-system.md §2` |

---

## Goal

An organizer can be onboarded — manually by the platform team for now — and configure their brand, domain, payment details, and team, so that their public event pages render in their own colours on their own subdomain.

---

## Deliverables

1. Tenant creation and approval flow
2. Branding editor with live preview
3. Subdomain routing + custom domain support
4. Payment and GST configuration
5. Team invitations with roles
6. Tenant settings shell in the dashboard

---

## Step-by-step

### 4.1 Tenant creation
1. Server action `createTenant()` — creates `tenants` (status `pending`), `tenant_branding`, `tenant_commission` with platform defaults, and a `tenant_members` row with role `owner` for the creating user.
2. Slug validation: lowercase, 3–30 chars, reserved words blocked (`admin`, `api`, `www`, `dashboard`, `scan`, `app`, `static`).
3. Approval: `pending → active` set by the platform team (a temporary admin script now; a proper console in P-17).
4. A `pending` tenant can build events but **cannot publish** them.

### 4.2 Branding editor — `/dashboard/settings/branding`
5. Logo upload (light + dark variants) to Supabase Storage, with size/format validation, auto-resize to a set of standard sizes.
6. Favicon upload with automatic generation of the required sizes.
7. Primary and accent colour pickers.
8. **Contrast validation:** if the chosen primary fails 4.5:1 against the surface, warn clearly and offer an adjusted shade. Do not let an organizer make their own site unreadable.
9. Live preview panel showing a real event card and a real button in their colours.
10. Meta title / description / OG image for social sharing.

### 4.3 Subdomain routing
11. Wildcard subdomain on Vercel: `*.garba.<domain>` → `apps/web`.
12. Middleware resolves `tenant` from the hostname:
    - `manhar.garba.<domain>` → tenant slug `manhar`
    - custom domain → lookup in `tenant_branding.custom_domain`
    - apex → the platform's own multi-tenant marketplace view
13. Resolved tenant goes into request context; every RSC data fetch is scoped by it.
14. Cache the hostname→tenant lookup at the edge (short TTL) — this runs on every request.

### 4.4 Custom domains
15. `/dashboard/settings/domain` — enter a domain, receive DNS instructions (CNAME).
16. Verification via the Vercel Domains API; poll and update `domain_verified`.
17. Clear status UI: pending → verifying → live, with the exact DNS record to add.

### 4.5 Brand injection
18. Root layout of `apps/web` reads `tenant_branding` server-side and renders `<BrandOverride>` from P-01.
19. `<DynamicFavicon>` and per-tenant metadata (title template, OG image).
20. Verify: two tenants' event pages, open side by side, look genuinely different — and the difference costs zero extra CSS files.

### 4.6 Payment & tax configuration — `/dashboard/settings/payments`
21. Razorpay account linking: key ID + secret, stored **encrypted** (Supabase Vault), never returned to the client.
22. Bank account for payouts: account number, IFSC, name, with a penny-drop verification hook (stubbed until P-15).
23. GSTIN with checksum validation; legal name; place of supply.
24. Configuration completeness feeds the pre-publish checklist in P-05.

### 4.7 Team management — `/dashboard/team`
25. Invite by phone number: creates a pending `tenant_members` row; the invitee sees the tenant on next login.
26. Role assignment with a plain-language explanation of each role's powers.
27. Only `owner` can invite `owner` or `finance`.
28. Remove member (soft — sets status, keeps the audit trail).
29. Every invite, role change, and removal writes to `audit_log`.

### 4.8 Commission configuration (platform-controlled)
30. `tenant_commission` is **read-only** in the organizer dashboard — displayed transparently ("Platform fee: 2.5%, charged to buyer") but not editable by them.
31. Editable only from the superadmin console (P-17); until then, a documented SQL script.

---

## Files created

```
apps/dashboard/src/app/settings/branding/page.tsx
apps/dashboard/src/app/settings/domain/page.tsx
apps/dashboard/src/app/settings/payments/page.tsx
apps/dashboard/src/app/team/page.tsx
apps/dashboard/src/actions/{tenant,branding,domain,team}.ts
apps/web/src/middleware.ts                       (tenant resolution)
apps/web/src/lib/tenant-context.ts
packages/ui/src/brand/{LogoUploader,ColorPicker,BrandPreview}.tsx
packages/domain/src/branding/{contrast.ts,contrast.test.ts}
packages/domain/src/tenant/{slug.ts,gstin.ts,ifsc.ts}  + tests
supabase/functions/verify-domain/index.ts
e2e/tenant-branding.spec.ts
```

---

## Acceptance criteria

- [ ] A new tenant can be created, approved, and reaches an empty dashboard
- [ ] Uploading a logo and changing the primary colour visibly rebrands the public site within one page load
- [ ] Two tenants on two subdomains render with completely different branding from the same code
- [ ] A low-contrast colour choice produces a clear warning with a suggested fix
- [ ] Custom domain verification works end-to-end on a real test domain
- [ ] GSTIN validation rejects malformed and checksum-invalid values
- [ ] A `manager` cannot invite an `owner`; the server action refuses even when called directly
- [ ] Every team change appears in the audit log with actor, before, and after

---

## Definition of Done

Two demo tenants exist with distinct branding on distinct subdomains, both rendering correctly, with team members in every role.

---

## OpenCode prompt

> Read `docs/05-execution/phase-04-tenant-onboarding.md` and `docs/03-architecture/security-and-tenancy.md §1`. Execute Phase 04 steps 4.1–4.8. The white-label mechanism is CSS-variable injection only — do not generate per-tenant stylesheets. Razorpay secrets must be stored encrypted and never leave the server.
