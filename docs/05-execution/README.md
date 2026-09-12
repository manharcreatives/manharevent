# Execution Phases — Index

22 phases, `P-00` through `P-21`. Each file is standalone and OpenCode-ready.

**Update `../PROGRESS.md` after every phase.** That file is the single source of truth for where the build is.

---

## Dependency graph

```
P-00 Foundation
 ├─► P-01 Design System ──────────────┐
 └─► P-02 Database ──► P-03 Auth ─────┤
                                       ▼
                        P-04 Tenant & White-Label
                                       │
                        P-05 Events, Venues, Zones
                                       │
                        P-06 Ticketing Engine
                                       │
                        P-07 Pricing & Policy
                                       │
                        P-08 Public Site
                                       │
                        P-09 Checkout & Payments
                                       │
                        P-10 Pass Delivery
                            ├──► P-11 Attendee Account
                            └──► P-12 Gate Scanner
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            P-13 Wallet        P-14 Live Ops      P-15 Finance
                    │                  │                  │
                    └──────────► P-16 Notifications ◄─────┘
                                       │
                              P-17 Superadmin
                                       │
                              P-18 Security & Perf
                                       │
                              P-19 QA & Deployment
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
          P-20 Differentiators                    P-21 Launch
```

---

## Phase table

| # | Phase | Depends on | Effort | Launch blocking |
|---|---|---|---|---|
| [00](phase-00-foundation.md) | Foundation & Repo Setup | — | 6–10h | ✅ |
| [01](phase-01-design-system.md) | Design System & Components | 00 | 14–20h | ✅ |
| [02](phase-02-database.md) | Database & Multi-Tenancy | 00 | 20–28h | ✅ |
| [03](phase-03-auth.md) | Authentication & Identity | 01, 02 | 16–22h | ✅ |
| [04](phase-04-tenant-onboarding.md) | Tenant Onboarding & White-Label | 03 | 12–16h | ✅ |
| [05](phase-05-events-venues.md) | Events, Venues, Zones, Lineup | 04 | 20–26h | ✅ |
| [06](phase-06-ticketing-engine.md) | Ticketing & Inventory Engine | 05 | 22–30h | ✅ |
| [07](phase-07-pricing-promos.md) | Pricing, Promo & Policy | 06 | 16–22h | ✅ |
| [08](phase-08-public-site.md) | Public Discovery & Event Pages | 04–07 | 26–34h | ✅ |
| [09](phase-09-checkout-payments.md) | Checkout, Payments & GST | 07, 08 | 24–32h | ✅ |
| [10](phase-10-pass-delivery.md) | Pass Issuance, QR & Delivery | 09 | 18–24h | ✅ |
| [11](phase-11-attendee-account.md) | Attendee Account & Groups | 10 | 12–16h | ✅ |
| [12](phase-12-gate-scanner.md) | Gate Scanner PWA | 06, 10 | 28–36h | ✅ |
| [13](phase-13-wallet-vendors.md) | Wallet, Parking & Vendors | 11, 12 | 18–24h | ⬜ |
| [14](phase-14-live-ops-analytics.md) | Live Ops & Analytics | 09, 12 | 20–26h | ✅ |
| [15](phase-15-finance-settlements.md) | Finance, Refunds & Settlements | 09, 13 | 20–26h | ✅ |
| [16](phase-16-notifications.md) | Notifications Engine | 10 | 14–18h | ✅ |
| [17](phase-17-superadmin.md) | Superadmin Console | 15 | 14–18h | ⬜ |
| [18](phase-18-security-performance.md) | Security, Fraud, Perf, A11y | all | 20–26h | ✅ |
| [19](phase-19-qa-deployment.md) | QA, Deployment & Monitoring | 18 | 16–22h | ✅ |
| [20](phase-20-differentiators.md) | Gallery, Community & Growth | 11, 14 | 24–32h | ⬜ |
| [21](phase-21-launch.md) | Launch & Post-Launch Ops | 19 | ongoing | ✅ |

**Launch-blocking total: ~300–400 hours. Full scope: ~370–480 hours.**

---

## Suggested milestones

| Milestone | Phases | Outcome |
|---|---|---|
| **M1 — Skeleton** | 00–03 | Three apps run, database is secure, people can log in |
| **M2 — Organizer can build** | 04–07 | An event with real pass types and prices exists |
| **M3 — People can buy** | 08–11 | Money comes in, passes go out |
| **M4 — The gate works** | 12, 14 | An event can actually be run |
| **M5 — The books close** | 15, 16 | Money reconciles, everyone gets told |
| **M6 — Ready** | 18, 19 | Hardened, tested, deployable |
| **M7 — Live** | 21 | First real event |
| **M8 — Sticky** | 13, 17, 20 | Wallet, platform console, retention features |

M8 items can be pulled earlier if time allows — 13 in particular has high organizer appeal.

---

## Rules for running a phase

1. **Read the whole phase file before writing any code.** Also read the reference docs it names.
2. **Do not reorder.** Dependencies are real, not stylistic.
3. **Do not substitute libraries.** The stack in `03-architecture/tech-stack.md` is locked.
4. **Every phase ends green:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
5. **Every acceptance criterion is verified with evidence**, not asserted. If you cannot verify one, say so in `PROGRESS.md` and leave it unticked.
6. **Update `PROGRESS.md`** — status, date, notes, and anything that surprised you.
7. **One branch per phase:** `phase-NN/short-description`. One PR per phase.
8. **If something in a doc is wrong, fix the doc in the same PR.** Documentation that drifts from reality is worse than none.
