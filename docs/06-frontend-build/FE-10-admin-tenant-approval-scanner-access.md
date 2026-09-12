# FE-10 — Admin Panel: Tenant Approval (Internal Ops) + Gate-Staff Scanner Access

| | |
|---|---|
| **Phase ID** | `FE-10` |
| **Depends on** | `FE-04` (original dashboard build), `FE-08` (`TenantApplication` model + mock CRUD) |
| **Blocks** | `FE-11` |
| **Reference docs** | `02-product/product-spec.md §2, §3 (P5), §5.2` (2026-09-12 pivot), `02-product/user-flows.md F0, "Internal ops" section` (2026-09-12 pivot), `04-design/manharevents-screen-specs.md §2.4` |

---

## Goal

Two additions to `apps/dashboard` (built in `FE-04`), both required by the pivot and neither built before:

1. **Internal ops: tenant approval.** The Manhar platform team needs a place to review a submitted `TenantApplication` (from `FE-08`) and approve/reject it, which is what unblocks `apps/marketing`'s `/register/status` and `/register/provisioned` screens.
2. **Gate-staff scanner-access issuance**, made explicit as the *only* way into Surface 3 — `FE-04` already built "Team → Gate Staff" as a screen; this phase confirms/hardens it as the sole issuance path and wires it to the `FE-05` scanner app's login so the whole loop (issue in admin panel → log in on scanner) actually works end to end in the mock environment.

The internal ops area is gated by an internal role, not the organizer's own roles — it must be clearly, visually separated from the rest of the organizer-facing admin panel so it reads as "Manhar's own tool," not a feature an organizer stumbles into.

---

## Deliverables

1. A `/internal` (or similarly clearly-namespaced) route group in `apps/dashboard`, visually distinct chrome (different sidebar branding — "Manhar Ops", not the organizer's own white-label branding), gated by a mock `internal_ops` role
2. `/internal/tenants` — list of `TenantApplication` records by status, with review detail view and Approve / Reject (with reason) actions that call the `FE-08` mock functions
3. On approve: mock provisioning trigger — sets `status: "approved"`, `provisionedAt`, and creates the corresponding tenant/admin-panel-access mock records so `apps/marketing`'s `/register/provisioned` screen (from `FE-08`) has something real to link to
4. Confirmed, hardened "Team → Gate Staff" screen in the organizer-facing part of `apps/dashboard`: issue credentials, bind to device on first login, assign gate/zone, revoke — and a working mock login handshake so a credential issued here actually authenticates in `apps/scanner`'s `/scan/login` (`FE-05`)
5. Platform-fee-per-tenant configuration surfaced in the tenant approval/detail view (the fee an approved tenant will pay, per `product-spec.md §5.2`'s admin-panel setup features), reusing the same `<FeeBreakdown>`-style presentation from `FE-09` for consistency, not a bespoke number input with no context

---

## Step-by-step

1. **Scaffold the internal ops area.** Add an `/internal` route group inside `apps/dashboard` (same app, different gated section — do not create a fifth app for this; it's low-traffic, internal, and shares all the same tenant/order data already in the mock store). Distinct top bar/branding so it's unmistakably not the organizer's own view.
2. **Tenant list + review.** `/internal/tenants` lists all `TenantApplication` records (from `FE-08`'s model) grouped by status. Detail view shows everything the organizer submitted (org name, contact, city, scale, desired domain) plus Approve / Reject actions. Reject requires a reason (free text, shown back to the organizer on `/register/status` per `FE-08`'s spec). Approve requires setting that tenant's platform fee before confirming.
3. **Wire approval to provisioning.** On approve, call/extend the `FE-08` mock functions to flip `status → "approved"`, set `provisionedAt`, and create whatever minimal tenant/admin-access mock record `apps/dashboard`'s own auth needs to let that "new" tenant log in (in the mock world this can be a simple seeded record — the point is the loop closes, not that real auth is built early).
4. **Confirm/harden Team → Gate Staff.** Re-open the screen `FE-04` built. Confirm: issuing a staff member produces a credential; that credential, entered at `apps/scanner`'s `/scan/login` (`FE-05`), actually authenticates against the shared mock store (per `FE-02`'s shared-store convention) rather than any hardcoded scanner-side login. If `FE-04`/`FE-05` didn't actually connect these two ends before, connect them now — this is the concrete implementation of the pivot's "scanner access only via admin panel" rule, not just a doc statement.
5. **Empty/loading/error states** for the internal ops area, same bar as everywhere else (`ux-principles.md` rules 5–7): empty tenant queue, a failed mock approve action, a rejected application shown correctly on the organizer's side.
6. **Do not build real auth/roles.** A mock `internal_ops` flag on the current mock session is enough to gate the route in this frontend-first phase — real RBAC is a backend-wiring concern per `HANDOFF-TO-BACKEND.md` (updated in `FE-11`).

---

## Files created

```
apps/dashboard/app/internal/tenants/page.tsx
apps/dashboard/app/internal/tenants/[id]/page.tsx
```
Plus in-place hardening of the existing Team → Gate Staff screen and its handshake with `apps/scanner`'s login — no other new routes.

---

## Acceptance criteria

- [ ] `/internal/tenants` lists mock `TenantApplication` records by status and is visually distinct from the organizer-facing dashboard
- [ ] Approving a tenant in `/internal/tenants` results in `apps/marketing`'s `/register/status` (for that same mock record) showing "Approved" and, once provisioned, `/register/provisioned` becomes reachable
- [ ] Rejecting a tenant requires a reason, and that reason is visible on the organizer's `/register/status` screen
- [ ] A gate-staff credential issued from Team → Gate Staff successfully logs in at `apps/scanner`'s `/scan/login` in the same mock session
- [ ] Setting a tenant's platform fee during approval is visible later wherever that tenant's `<FeeBreakdown>` renders (consistency, not a disconnected number)
- [ ] `pnpm lint && pnpm typecheck && pnpm build` green across the monorepo

## Definition of Done

The full pivot loop is demonstrable end to end inside the mock environment: an organizer registers on `apps/marketing` → Manhar ops reviews and approves in `apps/dashboard`'s internal area → the organizer sees a provisioned hand-off → a gate-staff credential issued from that organizer's Team → Gate Staff screen actually works at `apps/scanner`'s login. Nothing in this loop is a doc description that isn't also true in the running mock build.

---

## Claude Code prompt

> Follow `docs/06-frontend-build/FE-10-admin-tenant-approval-scanner-access.md` step by step. Add an `/internal` route group to `apps/dashboard` (not a new app) for Manhar's own tenant-approval workflow, gated by a mock `internal_ops` role and visually distinct from the organizer-facing dashboard. Build `/internal/tenants` (list + review + approve/reject with reason + platform-fee setting) wired to the `TenantApplication` mock functions from `FE-08`, so approving there flips the status that `apps/marketing`'s `/register/status` and `/register/provisioned` screens read. Then confirm and, if needed, actually wire the existing Team → Gate Staff screen (from `FE-04`) so a credential issued there really authenticates at `apps/scanner`'s `/scan/login` (`FE-05`) in the shared mock store — this is the concrete proof that scanner access only ever comes from the admin panel. Every new screen needs empty/loading/error states. End green: `pnpm lint && pnpm typecheck && pnpm build`. Update `docs/PROGRESS.md` honestly.
