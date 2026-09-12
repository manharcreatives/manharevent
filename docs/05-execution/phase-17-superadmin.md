# Phase 17 — Superadmin Console & Platform Operations

| | |
|---|---|
| **Phase ID** | `P-17` |
| **Depends on** | `P-15` |
| **Blocks** | — |
| **Estimated effort** | 14–18 hours |
| **Launch blocking** | ❌ No — manual scripts suffice for the first tenant |
| **Reference docs** | `03-architecture/security-and-tenancy.md` |

---

## Goal

The platform team's own surface: onboard organizers, set commissions, watch platform health, and resolve support escalations — without ever touching the production database by hand.

---

## Deliverables

1. `apps/admin` — a fourth Next.js app
2. Tenant management and approval
3. Platform-wide financial view
4. Cross-tenant support tools
5. System health monitoring
6. Feature flag management

---

## Step-by-step

### 17.1 App & access
1. Scaffold `apps/admin` at `admin.<domain>`, sharing `packages/ui` and `packages/db`.
2. Access restricted to a `platform_admin` claim — a separate table `platform_admins`, **not** a tenant role. A tenant owner must never be able to reach this.
3. Enforce with middleware **and** an RLS bypass policy that checks the claim explicitly.
4. Require re-authentication every 4 hours.
5. **Every action in this app is audited without exception**, including reads of sensitive data.

### 17.2 Tenant management — `/admin/tenants`
6. List all tenants: name, slug, status, events, GMV, joined date.
7. Detail: full profile, branding, commission, team, events, financial summary.
8. Approve / suspend / reactivate, with a reason recorded.
9. Edit `tenant_commission` — this is the only place it is editable.
10. Impersonation for support: enter a tenant's dashboard read-only, with a persistent banner saying so, time-limited to 30 minutes, and fully audited. **Read-only, always.**

### 17.3 Platform finance — `/admin/finance`
11. Platform revenue: total commission earned, by tenant, by month.
12. GMV, take rate, refund rate across the platform.
13. Outstanding settlements owed to tenants.
14. Gateway fee reconciliation at the platform level.

### 17.4 Cross-tenant support — `/admin/support`
15. Universal lookup: phone, pass code, order number, email — across all tenants.
16. Result shows the full picture with the tenant clearly identified.
17. Actions: re-send pass, force manual check-in, invalidate a pass, escalate to the tenant.
18. PII masked by default; reveal is a logged action with a reason.
19. Support action log, searchable.

### 17.5 System health — `/admin/health`
20. Error rates from Sentry, by app.
21. Notification queue depth and failure rate.
22. Payment success rate, trended.
23. Scanner devices online across all active events.
24. Database connection and slow-query indicators.
25. Realtime channel health.
26. Alert thresholds pushed to the platform team's WhatsApp.

### 17.6 Feature flags — `/admin/flags`
27. Global and per-tenant flags, backed by `feature_flags`.
28. Flags for: virtual waiting room, wallet, photo gallery, gamification, wallet passes, and anything else risky.
29. Changes take effect within 60 seconds without a deploy.
30. Every flag change audited.

### 17.7 Platform content
31. Manage the apex marketplace: featured events, city pages, homepage curation.
32. Platform-level legal pages.

### 17.8 Runbooks
33. Ship written runbooks in `docs/runbooks/` for: event night on-call, payment provider outage, scanner mass failure, database incident, data breach response.
34. Each runbook: symptoms, immediate actions, escalation path, communication template.

---

## Files created

```
apps/admin/                                     (new Next.js app, port 3003)
apps/admin/src/app/{page,tenants,finance,support,health,flags,content}/...
apps/admin/src/middleware.ts
supabase/migrations/0018_platform_admins.sql
apps/admin/src/components/{TenantTable,TenantDetail,ImpersonationBanner,
    UniversalLookup,HealthDashboard,FlagEditor}.tsx
supabase/functions/{platform-metrics,impersonate}/index.ts
docs/runbooks/*.md
e2e/admin.spec.ts
```

---

## Acceptance criteria

- [ ] A tenant owner cannot reach `apps/admin` — verified by attempting it with a real tenant-owner session
- [ ] Tenant approval flips status and immediately allows publishing
- [ ] Commission changes take effect on the next order's fee calculation
- [ ] Impersonation is read-only — a write attempt while impersonating is rejected server-side
- [ ] Impersonation expires after 30 minutes and shows a persistent banner throughout
- [ ] Universal lookup finds a pass across tenants in under 1 second
- [ ] PII reveal is logged with actor, target, and reason
- [ ] A feature flag change reaches the apps within 60 seconds with no deploy
- [ ] Health dashboard reflects a deliberately induced error spike
- [ ] Every admin action appears in the audit log

---

## Definition of Done

The platform team can onboard a tenant, configure commission, and resolve a support case entirely through the UI. Runbooks are written and reviewed.

---

## OpenCode prompt

> Read `docs/05-execution/phase-17-superadmin.md`. Execute Phase 17 steps 17.1–17.8. Platform admin access must be a separate identity concept from tenant roles — a tenant owner must never reach this app. Impersonation is strictly read-only and time-limited. Write the runbooks as part of this phase, not afterwards.
