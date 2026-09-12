# Phase 19 — QA, Deployment & Monitoring

| | |
|---|---|
| **Phase ID** | `P-19` |
| **Depends on** | `P-18` |
| **Blocks** | `P-21` |
| **Estimated effort** | 16–22 hours |
| **Launch blocking** | ✅ Yes |

---

## Goal

Everything ships automatically, safely, and observably — and the team knows when something breaks before an attendee tells them.

---

## Deliverables

1. Complete test suite with meaningful coverage
2. CI/CD across all four apps and three environments
3. Database migration pipeline
4. Monitoring, alerting, on-call
5. Backup and disaster recovery
6. Staging environment mirroring production

---

## Step-by-step

### 19.1 Test suite
1. **Unit** (Vitest) — all of `packages/domain`. Target 90%+ coverage, 100% on `pass/validity.ts` and `pricing/`.
2. **Integration** (Vitest + a real Supabase branch) — RLS, database functions, concurrency, ledger balance.
3. **E2E** (Playwright) — the critical journeys:
   - Browse → select → pay → receive pass
   - Sign in → view pass → offline view
   - Organizer creates and publishes an event
   - Gate scan: valid, duplicate, wrong zone, offline sync
   - Refund request → approval → pass invalidated
   - Group invite fill-in
   - Wallet top-up → vendor spend
4. **Visual regression** on the component gallery and key public pages.
5. **Load** (k6) — the checkout scenario from P-09 at 2× peak.
6. Run E2E against Chrome and Safari; run the scanner suite against a real Android device via BrowserStack or equivalent.

### 19.2 Environments
7. Three Supabase projects and three Vercel environments: `dev`, `staging`, `prod`.
8. **Staging mirrors production**: same config, anonymised production-shaped data, Razorpay test mode.
9. Environment parity checklist — a documented list of every setting that must match, verified before launch.

### 19.3 CI/CD
10. Pull request: lint → typecheck → unit → integration → build → preview deploy → E2E against the preview → Lighthouse → bundle budget.
11. Merge to `main`: deploy to staging → run migrations → smoke tests → hold.
12. Production deploy: manual approval → migrations → deploy → smoke tests → auto-rollback on smoke failure.
13. Migration safety: additive-only during event season. Any destructive migration requires an explicit override and a documented reason.
14. Migrations always run **before** the app deploy, and every migration must be backward-compatible with the currently running app version.

### 19.4 Monitoring
15. Sentry on all four apps and all edge functions, with source maps and release tagging.
16. PostHog for product analytics; define and instrument the funnel events explicitly rather than relying on autocapture.
17. Uptime checks (BetterStack or similar) on: public site, checkout, dashboard, scanner, webhook endpoint.
18. Custom health endpoint per app checking database, storage, and Razorpay reachability.
19. Business-metric alerts, which matter more than infrastructure alerts:
    - Payment success rate < 85% over 15 minutes
    - Zero orders in 30 minutes during a known on-sale
    - Notification failure rate > 10%
    - Scanner sync backlog > 100 on any device
    - Any unreconciled payment older than 24 hours
20. Alerts route to the on-call WhatsApp group, with severity levels and a documented escalation path.

### 19.5 Logging
21. Structured JSON logs with a request id propagated across app → edge function → database.
22. Never log PII, tokens, or payment details. Add a lint rule that flags `console.log` of objects that may contain them.
23. Retain 30 days searchable, 1 year archived.

### 19.6 Backup & DR
24. Supabase PITR enabled on production with a 7-day window.
25. Daily logical backup to separate storage.
26. **Practise a restore.** Restore a backup to a scratch project and verify integrity. An untested backup is not a backup.
27. Document RTO (4 hours) and RPO (5 minutes).
28. Written DR runbook covering database loss, region outage, and provider outage.

### 19.7 Release process
29. Semantic versioning, tagged releases, generated changelog.
30. **Feature-flag anything risky**, so a rollback is a flag flip rather than a redeploy.
31. **Change freeze during event nights** — deploys only for genuine incidents, with two-person approval.
32. Post-deploy smoke test script covering the top 10 journeys, runnable in under 5 minutes.

---

## Files created

```
.github/workflows/{ci,deploy-staging,deploy-prod,e2e,lighthouse,security}.yml
e2e/journeys/*.spec.ts
e2e/smoke/*.spec.ts
load-tests/*.k6.js
apps/*/src/app/api/health/route.ts
scripts/{migrate,smoke-test,restore-drill,env-parity-check}.ts
docs/runbooks/{deployment,incident-response,disaster-recovery,event-night.md}
monitoring/{alerts.yml,dashboards.json}
```

---

## Acceptance criteria

- [ ] Full suite runs in under 15 minutes in CI
- [ ] `packages/domain` coverage ≥ 90%; `pass/validity.ts` and `pricing/` at 100%
- [ ] Every critical journey has a passing E2E test
- [ ] A PR produces a preview deploy with E2E and Lighthouse run against it
- [ ] Production deploy requires manual approval and rolls back automatically on smoke failure
- [ ] A deliberately broken smoke test triggers an actual rollback — test this
- [ ] Restore drill completes successfully and the restored data is verified
- [ ] Each business-metric alert fires when its condition is simulated
- [ ] Health endpoints correctly report a simulated dependency failure
- [ ] Staging matches production on every item in the parity checklist
- [ ] No PII appears in any log — verified by inspecting real log output

---

## Definition of Done

A commit reaches production automatically and safely. Monitoring catches simulated failures. A restore has actually been performed, not just configured.

---

## OpenCode prompt

> Read `docs/05-execution/phase-19-qa-deployment.md`. Execute Phase 19 steps 19.1–19.7. The rollback test and the restore drill must actually be performed and their results recorded — configuration alone is not evidence. Business-metric alerts matter more than CPU alerts; implement those first.
