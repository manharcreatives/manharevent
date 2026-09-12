# Phase 18 — Security, Anti-Fraud, Performance & Accessibility

| | |
|---|---|
| **Phase ID** | `P-18` |
| **Depends on** | All feature phases |
| **Blocks** | `P-19` |
| **Estimated effort** | 20–26 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `03-architecture/security-and-tenancy.md §4–6`, `04-design/ux-principles.md` |

---

## Goal

A hardening pass across the whole product. Nothing new is built here — everything already built is made safe, fast, and usable by everyone.

---

## Deliverables

1. Security audit and remediation
2. Fraud detection
3. Performance optimisation to budget
4. Accessibility to WCAG 2.1 AA
5. Privacy compliance verification
6. Penetration testing

---

## Step-by-step

### 18.1 Security audit
1. **RLS sweep:** query `pg_policies` and assert every table has RLS enabled, forced, and at least one policy. Automate this as a test — do not verify by eye.
2. **Secret sweep:** grep all built bundles for service-role keys, Razorpay secrets, signing secrets. CI already does this (P-00); confirm it still catches a planted secret.
3. **Server action audit:** enumerate every server action and confirm each independently re-checks auth and role. A list with a tick per action, reviewed.
4. **Input validation:** every action's input parsed by a Zod schema from `packages/contracts`. No unvalidated input reaches the database.
5. **Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy on all four apps. CSP must be strict — no `unsafe-inline` in scripts.
6. **Dependencies:** `pnpm audit`, Dependabot enabled, all high and critical resolved.
7. **File uploads:** type and size validation, content sniffing, stripped EXIF on photos, served from a separate origin.
8. **Webhooks:** signature verification on every one; reject and log unsigned requests.
9. **Rate limits:** confirm coverage on OTP, checkout, promo validation, search, exports, pass re-send.

### 18.2 Fraud detection
10. Velocity rules, evaluated on order creation:
    - More than 5 orders from one IP in 10 minutes → flag
    - More than 3 distinct phone numbers from one device fingerprint → flag
    - More than 10 failed payments from one IP in an hour → block temporarily
11. Scan anomaly detection:
    - Same pass scanned at two gates within 60 seconds → fraud flag
    - A pass with more denials than allowances → flag
    - A device with an unusually high denial rate → flag (usually staff error, sometimes not)
12. Fraud review queue in the dashboard: flag, evidence, and a one-click block.
13. Blocked passes propagate to scanners via a manifest version bump.
14. Every flag and every block is audited.

### 18.3 Performance
15. Verify bundle budgets across all apps; fail CI on regression.
16. Route-level analysis with `@next/bundle-analyzer`; remove anything unjustified.
17. Database: `EXPLAIN ANALYZE` every query on a hot path; add indexes where a sequential scan appears; target < 50 ms p95.
18. Image pipeline: all images AVIF/WebP with correct sizing; no oversized originals served.
19. Cache strategy documented per route: ISR revalidation windows, `stale-while-revalidate` headers, CDN behaviour.
20. Lighthouse CI on the five key public routes: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO 100 — on **mobile** emulation.
21. Load test the full flow again at 2× the expected peak.

### 18.4 Accessibility
22. axe-core across every route in all four apps in CI.
23. Manual keyboard-only pass through: buy a pass, manage an event, complete a scan.
24. Screen reader pass (NVDA or VoiceOver) on the buy flow specifically.
25. Contrast verification on every token pair, both themes, including the zone colours.
26. Touch targets: ≥ 44px everywhere, ≥ 64px in the scanner — automate the check where possible.
27. Focus management in dialogs, sheets, and after route changes.
28. `prefers-reduced-motion` honoured everywhere.
29. Form errors announced via live regions and linked with `aria-describedby`.
30. `lang` attribute correct per locale so screen readers pronounce Gujarati and Hindi correctly.

### 18.5 Privacy compliance
31. Verify data export returns everything held about a user.
32. Verify deletion anonymises correctly and retains only what is legally required.
33. Verify consent is recorded and enforced.
34. Confirm PII is scrubbed from Sentry and PostHog.
35. Confirm the retention job is scheduled and correct.
36. Publish the privacy policy and make it accurate about what is actually collected.

### 18.6 Penetration testing
37. Attempt, and document the result of, each:
    - Access another tenant's data via a manipulated JWT
    - Access another user's passes by guessing IDs
    - Forge a QR payload
    - Replay a payment webhook
    - Manipulate price on the client and complete a purchase
    - Oversell via concurrent checkout
    - Reach admin routes as a tenant user
    - SQL injection via search and filter inputs
    - XSS via event content, holder names, and vendor names
    - CSRF on state-changing routes
38. Every finding gets a fix and a regression test.
39. Consider an external security review before handling real money at scale.

---

## Files created

```
packages/db/tests/rls-coverage.test.ts
packages/db/tests/server-action-auth.test.ts
apps/*/src/middleware.ts                      (security headers)
apps/dashboard/src/app/events/[id]/fraud/page.tsx
packages/domain/src/fraud/{velocity.ts,scan-anomaly.ts} + tests
supabase/functions/fraud-evaluator/index.ts
supabase/migrations/0019_fraud_flags.sql
e2e/{security,a11y-full,performance}.spec.ts
.github/workflows/{security.yml,lighthouse.yml}
docs/security/{threat-model.md,pentest-results.md}
```

---

## Acceptance criteria

- [ ] Automated test proves every table has RLS enabled, forced, and policied
- [ ] Every server action re-checks auth independently — verified by a test that calls each with an unauthorised session
- [ ] Every one of the 10 penetration attempts fails, and each has a regression test
- [ ] CSP is strict with no `unsafe-inline` in scripts
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility 100, SEO 100 on all five key routes
- [ ] Zero axe violations across all four apps
- [ ] Keyboard-only purchase completes successfully
- [ ] Screen reader can complete a purchase
- [ ] All contrast pairs pass AA in both themes, including zone colours
- [ ] Fraud rules fire on seeded suspicious patterns and do not fire on normal ones
- [ ] Data export is complete; deletion anonymises correctly
- [ ] No PII appears in Sentry or PostHog — verified by inspecting real captured events
- [ ] Load test at 2× peak passes with zero oversell

---

## Definition of Done

Security tests green, accessibility clean, performance at budget, and every pentest attempt documented with its result. This phase is signed off explicitly before launch.

---

## OpenCode prompt

> Read `docs/05-execution/phase-18-security-performance.md` and `docs/03-architecture/security-and-tenancy.md`. Execute Phase 18 steps 18.1–18.6. Do not build new features. Every penetration attempt in 18.6 must be actually attempted and its result recorded in `docs/security/pentest-results.md` — a claim without evidence does not count.
