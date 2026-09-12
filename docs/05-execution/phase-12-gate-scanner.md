# Phase 12 — Gate Scanner PWA (Offline-First)

| | |
|---|---|
| **Phase ID** | `P-12` |
| **Depends on** | `P-06`, `P-10` |
| **Blocks** | `P-14` |
| **Estimated effort** | 28–36 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `03-architecture/security-and-tenancy.md §2`, `04-design/design-system.md §6` |

---

## Goal

An app that a barely-trained person can operate for six hours, on a cheap phone, in the dark, with no internet, at twelve scans a minute, without ever being wrong or ambiguous.

This is the phase where the platform earns its reputation. A slow gate is the thing attendees complain about publicly.

---

## Deliverables

1. Installable PWA with a service worker
2. Encrypted offline manifest in IndexedDB
3. Camera QR scanning tuned for cheap Android cameras
4. The `<ScanResult>` verdict screen, exactly as specified
5. Offline check-in queue with background sync
6. Cross-device near-real-time anti-passback
7. Exit / re-entry handling
8. Manual code entry fallback

---

## Step-by-step

### 12.1 PWA shell
1. Serwist service worker: precache the entire app shell. The app must launch and be fully usable with zero network from the very first launch after install.
2. Manifest: standalone display, portrait lock, dark theme colour, maskable icons.
3. Install prompt with a short explanation on first visit.
4. Wake lock while the scanner is active — the screen must not sleep mid-shift.
5. Request camera permission once, with a clear explanation.

### 12.2 Manifest sync
6. On login (P-03) and on demand, call `build_scan_manifest(event_id, night_id)`.
7. Store in IndexedDB via Dexie, **encrypted at rest** with a key derived from the staff session.
8. Manifest contains: pass id, zone, admits, status, prior check-in count for tonight, holder name, holder photo thumbnail, plus a revocation list.
9. Delta sync over Supabase Realtime when connectivity exists; full re-sync on demand.
10. `<SyncStatusBar>` always visible: online/offline, manifest version, age, pending queue depth.
11. **Refuse to operate on a manifest older than 18 hours** — forces a fresh sync each night. Show a blocking screen with a sync button.

### 12.3 Scanning
12. `@zxing/browser` for decoding — it handles low-end Android cameras and poor focus better than jsQR. Verify this on a real cheap device, not a laptop webcam.
13. Continuous scan mode: decode from the video stream, no shutter tap.
14. Torch toggle (it is dark).
15. Debounce: the same code within 3 seconds is ignored, so one QR held steady doesn't fire repeatedly.
16. Target: decode to verdict in **under 500 ms**.

### 12.4 Validation — fully offline
17. `verifyPass()` from P-10 checks the HMAC signature locally.
18. `passValidity()` from P-06 checks state against the local manifest and the local check-in log.
19. **No network call is made on the scan path. Ever.** This is non-negotiable.
20. Every one of the 8 verdict states from `design-system.md §6` is handled.

### 12.5 `<ScanResult>` — build to the spec
21. Full-bleed colour, 96px icon, 32px+ verdict text, secondary detail line.
22. Holder photo at 120×120 when `requires_photo`.
23. Admit counter for multi-admit passes ("2 of 4 entered").
24. Haptic and audio feedback per state (distinct tones — staff learn them by ear within minutes and stop looking at the screen).
25. Auto-dismiss after 1.5s on `allowed`; **tap-to-dismiss required** on every failure state.
26. **Zero animation.** Instant paint.
27. Readable at one metre in darkness — test this literally, outdoors, at night.

### 12.6 Check-in recording
28. On ALLOW: write to a local Dexie queue with a client-generated `client_uuid`, timestamp, gate, zone, device, and the operator.
29. On DENY: record it too, with the reason. Denials are data — they reveal gate confusion and fraud patterns.
30. Update the local manifest's admit counter immediately so the next scan reflects it.
31. Queue is durable across app restarts and device reboots.

### 12.7 Background sync
32. Flush the queue whenever connectivity appears, in batches, with exponential backoff.
33. Server upserts on `client_uuid` — replays are harmless.
34. Conflict resolution: the earliest `scanned_at` wins; later duplicates are recorded as `duplicate` and surfaced as a fraud signal, not silently dropped.
35. Queue depth and last-sync time always visible.
36. Manual "sync now" button.

### 12.8 Cross-device anti-passback
37. When online, each check-in is broadcast over Supabase Realtime to all devices at that event.
38. Receiving devices update their local manifest so a second gate shows `already_in` within a few seconds.
39. **Never block on this.** If the broadcast hasn't arrived, the scan still proceeds — a network blip must never stop a legitimate entry. Layer 3 (server reconciliation) catches the abuse afterwards.

### 12.9 Exit & re-entry
40. Mode toggle: Entry / Exit (a deliberate switch, not a guess — it prevents whole-gate misconfiguration).
41. Exit scan writes `direction = out`.
42. Re-entry evaluated by `canReenter()` from P-07 against the event's policy.
43. Verdict shows the re-entry count when relevant ("Re-entry 2 of 3").

### 12.10 Manual entry
44. `/scan/manual` — a large numeric/alpha keypad for the pass code.
45. Same validation path, same verdict screen.
46. Manual entries are flagged in the log so they can be reviewed.

### 12.11 Device log
47. `/scan/log` — this device's scans tonight, with sync status per row.
48. Searchable by pass code.
49. Exportable as CSV for the ultimate offline fallback.

### 12.12 Onboarding
50. Three screens on first launch: how to scan, what the colours mean, what to do on red. Replayable from settings.
51. Total training time target: under 60 seconds.

---

## Files created

```
apps/scanner/src/app/scan/{page,manual,log,settings,sync}/page.tsx
apps/scanner/src/lib/{db.ts,manifest.ts,queue.ts,crypto.ts,device-id.ts,
    realtime.ts,audio.ts,haptics.ts}
apps/scanner/src/components/{ScanViewport,ScanResult,SyncStatusBar,
    ManualCodeEntry,ModeToggle,ScanLog,Onboarding}.tsx
apps/scanner/public/{manifest.json,icons/*}
apps/scanner/src/sw.ts                         (Serwist)
supabase/functions/sync-checkins/index.ts
supabase/functions/build-manifest/index.ts
e2e/scanner-offline.spec.ts
```

---

## Acceptance criteria

- [ ] The PWA installs and launches **fully offline** from a cold start
- [ ] A 14,000-pass manifest syncs in under 30 seconds and stores encrypted
- [ ] Scan-to-verdict is under 500 ms at p99 on a mid-range Android — measured on a real device
- [ ] Sustained throughput ≥ 12 scans/minute for 10 continuous minutes
- [ ] All 8 verdict states render correctly and are readable at 1 metre in darkness
- [ ] With airplane mode on for 2 hours and 500 scans, every one syncs correctly on reconnect with zero duplicates and zero losses
- [ ] A pass scanned at gate 1 shows `already_in` at gate 2 within 5 seconds when both are online
- [ ] With gate 2 offline, the same pass is allowed, and the duplicate is flagged on the server after sync
- [ ] A refunded pass is rejected after a manifest delta arrives
- [ ] Multi-admit passes count correctly across separate scans
- [ ] Manual code entry produces an identical verdict to scanning
- [ ] A stale manifest (>18h) blocks operation until re-synced
- [ ] A new staff member completes correct training in under 60 seconds

---

## Definition of Done

Run a realistic gate simulation: 500 passes, two devices, one offline for half of it, deliberate duplicates and refunds mixed in. Every result correct after sync. Then do it outdoors, at night, on a real cheap phone.

---

## OpenCode prompt

> Read `docs/05-execution/phase-12-gate-scanner.md`, `docs/03-architecture/security-and-tenancy.md §2`, and `docs/04-design/design-system.md §6`. Execute Phase 12 steps 12.1–12.12. The scan path must make **zero** network calls — validation is entirely local against the manifest using `packages/domain`. Build `<ScanResult>` to the exact spec table. Test offline behaviour on a real Android device; a simulator is not sufficient evidence.
