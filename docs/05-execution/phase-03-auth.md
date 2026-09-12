# Phase 03 — Authentication & Identity

| | |
|---|---|
| **Phase ID** | `P-03` |
| **Depends on** | `P-01`, `P-02` |
| **Blocks** | `P-04` onward |
| **Estimated effort** | 16–22 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `02-product/user-flows.md`, `01-analysis/scrape-analysis.md` (F3) |

---

## Goal

Phone-first authentication that works identically for attendees, organizers, and gate staff, with tenant selection for multi-tenant users and device binding for scanner staff.

We keep the audited flow's best idea — **one entry field, backend decides the path** — and replace email with phone, because phone is the identity that actually works in Gujarat.

---

## Deliverables

1. Phone + OTP auth on all three apps
2. Multi-tenant selection after login
3. Role-aware route protection
4. Session management and refresh
5. Gate staff device binding
6. Rate limiting on OTP
7. Attendee vs member auth paths that never collide

---

## Step-by-step

### 3.1 Supabase auth configuration
1. Enable Phone provider; configure MSG91 as the SMS provider with DLT-approved templates.
2. Disable email/password signup entirely.
3. OTP: 6 digits, 10-minute validity, 60-second resend cooldown.
4. Configure JWT expiry: 1 hour access, 30 days refresh (attendees), 12 hours refresh (dashboard), 18 hours (scanner — must re-auth each event night).

### 3.2 The auth flow (shared package)
5. Build `packages/domain/src/auth/flow.ts` as a pure state machine:
   ```
   idle → phone_entry → otp_sent → verifying
        → (needs_profile → profile_capture)
        → (multi_tenant → tenant_select)
        → authenticated
   ```
   Pure, testable, no React.
6. Build `packages/ui/src/auth/PhoneOtpFlow.tsx` driving that machine, using `<PhoneInput>` and `<OtpInput>` from P-01.

### 3.3 Public app auth (`apps/web`)
7. `/auth/start` — single phone field. Copy: "Enter your mobile number to continue."
8. `/auth/verify` — OTP with resend timer (reuse the audited "Resend code in {n}s" pattern).
9. `/auth/profile` — name only, shown once, first login. Never shown again.
10. **Inline variant:** the same flow must work embedded inside checkout without a route change — checkout must never navigate away.
11. Post-auth redirect honours a `next` param; defaults to `/me/passes`.

### 3.4 Dashboard auth (`apps/dashboard`)
12. `/login` — phone + OTP.
13. After verification, call an RPC that returns the user's `tenant_members` rows.
    - 0 tenants → "You don't have access to any organizer account" with support contact
    - 1 tenant → auto-select, straight to `/dashboard`
    - 2+ tenants → **tenant selection screen** (this is the audited "Select Organisation" step, kept)
14. Tenant selection calls `switch_tenant()` and forces a token refresh so the JWT carries the new `tenant_id`.
15. Add a tenant switcher in the sidebar header for users with multiple tenants.

### 3.5 Scanner auth (`apps/scanner`)
16. `/scan/login` — phone + OTP, then **event + gate selection**.
17. On first login on a device, generate a stable `device_id` (crypto random, persisted in IndexedDB) and register a `scanner_devices` row bound to user + gate.
18. If the device is already bound to a different user, require an explicit "take over this device" confirmation which is audited.
19. Store the session in IndexedDB (not just cookies) so a PWA relaunch offline still knows who is logged in.
20. Sessions expire at 18 hours — forces fresh login and fresh manifest each night.

### 3.6 Route protection
21. Middleware in each app:
    - `web` — `/me/*` requires a session; everything else is public
    - `dashboard` — everything except `/login` requires a session **and** an active `tenant_members` row
    - `scanner` — everything except `/scan/login` requires a bound device session
22. Build `<RoleGate roles={[...]}>` in `packages/ui` for in-page permission gating.
23. Build `requireRole()` server helper for server actions. **Never** rely on UI gating alone — every server action re-checks.

### 3.7 Rate limiting
24. Upstash Redis limits, enforced in middleware **before** hitting Supabase:
    - OTP send: 5 per phone per hour, 20 per IP per hour
    - OTP verify: 10 attempts per phone per hour
    - Exponential backoff surfaced honestly in the UI ("Too many attempts. Try again in 14 minutes.")
25. Log every rate-limit hit to `audit_log`.

### 3.8 Session handling
26. Automatic token refresh with a single-flight guard (no refresh storms).
27. On refresh failure: clear session, redirect to login with a `reason` param, show a real message ("Your session expired. Sign in again.").
28. `signOut()` clears Supabase session, IndexedDB, and cookies.

### 3.9 Error copy
29. Implement all states with copy that follows UX rule 7:

| State | Copy |
|---|---|
| Invalid OTP | "That code isn't right. Check the message and try again." |
| Expired OTP | "That code expired. Tap resend for a new one." |
| Rate limited | "Too many attempts. Try again in {n} minutes." |
| No tenant access | "This number isn't linked to any organizer account. Contact {support}." |
| Device taken over | "This device is signed in as {name}. Continue as yourself?" |
| SMS failed | "We couldn't send the code. Check the number, or contact support." |

30. Every string goes through `packages/i18n` in all three languages.

---

## Files created

```
packages/domain/src/auth/{flow.ts,flow.test.ts,roles.ts}
packages/ui/src/auth/{PhoneOtpFlow.tsx,RoleGate.tsx,TenantSwitcher.tsx}
packages/db/src/auth/{requireRole.ts,getSession.ts,switchTenant.ts}
apps/web/src/app/auth/{start,verify,profile}/page.tsx
apps/web/src/middleware.ts
apps/dashboard/src/app/login/page.tsx
apps/dashboard/src/app/select-organisation/page.tsx
apps/dashboard/src/middleware.ts
apps/scanner/src/app/scan/login/page.tsx
apps/scanner/src/lib/device-id.ts
apps/scanner/src/middleware.ts
packages/i18n/messages/{en,hi,gu}.json   (auth namespace)
e2e/auth.spec.ts
```

---

## Acceptance criteria

- [ ] A new phone number can complete signup → OTP → name → authenticated in under 60 seconds
- [ ] A user in two tenants sees the selection screen; after selecting, the JWT contains the correct `tenant_id` (decode and assert it in a test)
- [ ] Switching tenants changes what the dashboard shows, with no page reload artefacts
- [ ] A `gate_staff` user hitting `/dashboard/finance` is denied by **middleware**, and the underlying server action also denies if called directly
- [ ] OTP rate limits trigger at exactly the configured thresholds
- [ ] Scanner session survives a full app restart with the device offline
- [ ] Attendee and member auth never collide — a user who is both sees the right thing on each app
- [ ] All auth copy renders correctly in Gujarati and Hindi

---

## Definition of Done

All three apps authenticate. The RLS tests from P-02 still pass with real sessions rather than mocked JWTs. E2E auth suite green.

---

## OpenCode prompt

> Read `docs/05-execution/phase-03-auth.md` and `docs/02-product/user-flows.md`. Execute Phase 03 steps 3.1–3.9. Phone is the primary identity — do not add email/password anywhere. The auth state machine in `packages/domain` must be pure and unit tested before wiring any UI. Every server action must re-check the role independently of the UI.
