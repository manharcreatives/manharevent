# Phase 14 — Organizer Live Ops & Analytics

| | |
|---|---|
| **Phase ID** | `P-14` |
| **Depends on** | `P-09`, `P-12` |
| **Blocks** | — |
| **Estimated effort** | 20–26 hours |
| **Launch blocking** | ✅ Yes (live ops); analytics depth can follow |
| **Reference docs** | `02-product/product-spec.md §5.2`, `04-design/ux-principles.md` |

---

## Goal

On event night, the organizer opens one screen and knows: how many people are inside, where, how fast they are entering, how much has sold, and whether anything is going wrong.

---

## Deliverables

1. Realtime live-ops console
2. Occupancy tracking per zone with alerts
3. Gate throughput monitoring
4. Sales and revenue analytics
5. Attendee search and manual override
6. Broadcast announcements
7. Scheduled and exportable reports

---

## Step-by-step

### 14.1 Live console — `/dashboard/events/[id]/live`
1. Designed for a wall display as well as a laptop — large numbers, high contrast, readable across a room.
2. Top row, **three metrics only** (UX rule): people inside now · entered tonight · entry rate per minute.
3. Zone occupancy: one `<LiveOccupancyMeter>` per zone showing current / capacity with a colour band (green < 70%, amber < 90%, red ≥ 90%).
4. Gate throughput: scans per minute per gate over the last 15 minutes, so a stalled gate is instantly obvious.
5. Live check-in feed: name, zone, gate, time — the last 20, streaming.
6. Alert strip: capacity thresholds, offline devices, sync backlogs, denial spikes.
7. All of it over Supabase Realtime with < 3s lag.
8. **Honest degradation:** when the connection drops, freeze the numbers and show a "last updated 2 min ago" badge. Never show stale data as if it were live.

### 14.2 Occupancy
9. Occupancy = check-ins `in` − check-ins `out`, per zone, per night, computed from a materialised view refreshed every 30 seconds during events.
10. Threshold alerts at configurable percentages, delivered in-app and via WhatsApp to the owner and managers.
11. Historical occupancy curve per night — this is what organizers show licensing authorities.

### 14.3 Device monitoring
12. List every `scanner_device`: label, gate, operator, last sync, manifest version, queue depth, battery if available.
13. Flag a device that has not synced in over 10 minutes while others have.
14. Remote actions: force re-sync, revoke device.

### 14.4 Sales analytics — `/dashboard/events/[id]/reports`
15. Revenue over time (hourly during on-sale, daily overall).
16. Breakdown by: pass type, zone, night, price tier, channel, promo code, UTM source.
17. Conversion funnel: event page views → book page → checkout started → paid. Sourced from PostHog + our own order data.
18. Attendance: sold vs checked-in per night, per zone, no-show rate.
19. Season pass night-wise attendance — the metric that no generic platform provides and that every Garba organizer wants.
20. Repeat attendance: how many attended 1, 2, 3… nights.
21. Every chart uses the dataviz palette from the design system and is legible in dark mode.

### 14.5 Attendee search — `/dashboard/events/[id]/attendees`
22. Search by phone, name, pass code, or order number.
23. Result shows the full picture: order, passes, holders, check-in history, wallet, refunds.
24. Actions (role-gated, all audited): re-send pass, manual check-in, block pass, add a note.
25. Phone masked by default; "reveal" is a logged action (privacy rule).

### 14.6 Manual override
26. Manual check-in from the dashboard for the cases that always happen: broken phone, dead battery, VIP walked in the back, staff error.
27. Requires a reason. Written as `result = 'override'` so it is distinguishable in every report.
28. Bulk check-in for a guest list.

### 14.7 Announcements
29. Compose: title, body, urgency, target (all staff / a zone / everyone).
30. Delivered to scanner devices as a banner and, for urgent items, a full-screen interrupt.
31. Lost-person announcements get a dedicated template with a photo field.
32. The `ticker-scroll` animation from the audit drives a venue-display view at `/dashboard/events/[id]/ticker`.

### 14.8 Reports & export
33. CSV and XLSX export for every table view, respecting the current filters.
34. Scheduled daily summary to the owner on WhatsApp: yesterday's sales, tonight's attendance, tomorrow's outlook.
35. Post-event report pack: attendance, revenue, F&B, zone utilisation, hourly curves — as a PDF the organizer can hand to sponsors.

---

## Files created

```
apps/dashboard/src/app/events/[id]/live/page.tsx
apps/dashboard/src/app/events/[id]/reports/page.tsx
apps/dashboard/src/app/events/[id]/attendees/page.tsx
apps/dashboard/src/app/events/[id]/devices/page.tsx
apps/dashboard/src/app/events/[id]/ticker/page.tsx
apps/dashboard/src/components/live/{OccupancyMeter,GateThroughput,CheckInFeed,
    AlertStrip,DeviceMonitor,AnnouncementComposer}.tsx
apps/dashboard/src/components/reports/{RevenueChart,FunnelChart,AttendanceMatrix,
    PromoPerformance,NightWiseAttendance,ExportButton}.tsx
apps/dashboard/src/lib/realtime.ts
supabase/migrations/0015_occupancy_views.sql
supabase/functions/{daily-summary,post-event-report}/index.ts
e2e/live-ops.spec.ts
```

---

## Acceptance criteria

- [ ] Live occupancy updates within 3 seconds of a scan on a real device
- [ ] Occupancy math is correct with mixed entry and exit scans across multiple gates
- [ ] A capacity threshold breach fires an in-app alert and a WhatsApp message
- [ ] A device that stops syncing is flagged within 10 minutes
- [ ] Connection loss freezes the numbers and shows an honest staleness badge
- [ ] Attendee search returns in under 1 second across 50,000 seeded attendees
- [ ] Manual check-in is recorded as `override` with a reason and appears distinctly in reports
- [ ] Season-pass night-wise attendance is correct against seeded data
- [ ] Every export respects the active filters
- [ ] The live console is readable from 3 metres on a 1080p display
- [ ] All charts are legible in dark mode and pass contrast checks

---

## Definition of Done

Simulate an event night with 2,000 scans across 4 gates and 3 zones. The console is accurate throughout, the alerts fire, and the post-event report reconciles with the raw data.

---

## OpenCode prompt

> Read `docs/05-execution/phase-14-live-ops-analytics.md`. Execute Phase 14 steps 14.1–14.8. Use the `dataviz` skill guidance for every chart. The live console must degrade honestly when the connection drops — freeze and label, never show stale numbers as live. Keep to three primary metrics above the fold.
