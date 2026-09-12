# FE-05 — Gate Scanner UI (Surface 3, mock manifest)

| | |
|---|---|
| **Phase ID** | `FE-05` |
| **Depends on** | `FE-01`, `FE-02` |
| **Blocks** | `FE-06` |
| **Reference docs** | `05-execution/phase-12-gate-scanner.md`, `04-design/manharevents-screen-specs.md §3`, `04-design/design-system.md §6` |

---

## Goal

The scanner's UI/UX, fully built and installable as a PWA, scanning against a **mock manifest** in memory/IndexedDB instead of a real Supabase-synced one. The offline cryptography, real anti-passback, and true background sync land in `05-execution` P-12 — this phase proves out every screen and every one of the 8 verdict states so that later phase is UI work, not UI *design*.

**Explicit reminder (per the platform's core constraint):** this is a phone-camera-only, software-only scanner. Nothing here should assume a barcode-gun peripheral, a receipt printer, or any hardware beyond a standard phone camera.

---

## Deliverables

1. Installable PWA shell for `apps/scanner` (manifest.json, icons, service worker precache — Serwist)
2. `<SyncStatusBar>` showing a mock online/offline toggle, mock manifest version/age, mock queue depth
3. `<ScanViewport>` wired to `@zxing/browser`, decoding real QR codes shown on another screen (e.g. a `<PassCard>` from FE-03 in a second browser tab) against the mock manifest from `packages/mock-data`
4. All 8 `<ScanResult>` verdict states reachable by scanning differently-seeded mock passes
5. Manual code entry (`/scan/manual`) producing identical verdicts
6. Entry/Exit mode toggle and a basic re-entry counter against mock policy
7. Device log (`/scan/log`) of this session's scans, CSV-exportable
8. 60-second onboarding (3 screens), replayable from a long-press settings menu

---

## Step-by-step

1. Set up the PWA shell per `phase-12-gate-scanner.md §12.1` (Serwist precache, standalone manifest, dark theme colour, maskable icons, wake lock while scanning, camera permission prompt with explanation) — all of this is genuinely real, not mocked; a PWA shell doesn't need a backend to be real.
2. Build a mock manifest generator in `packages/mock-data` producing the same shape `build_scan_manifest()` will eventually return (pass id, zone, admits, status, prior check-ins tonight, holder name/photo thumbnail, revocation list) — store it in IndexedDB via Dexie exactly as the real one will be, so FE-07's handoff swaps the *source* of the manifest, not the storage layer.
3. Build `<ScanViewport>` with real `@zxing/browser` decoding — this must actually scan a real QR code (e.g. one rendered by FE-03's `<PassCard>`), even though what happens after decoding is validated against the mock manifest, not a live server.
4. Implement local validation against the mock manifest using the (stubbed-but-real-signature) functions from `packages/domain` built in FE-02 — this proves the "same validation logic online and offline" architecture from `security-and-tenancy.md` before any real crypto exists.
5. Build `<ScanResult>` wiring for all 8 states (already built visually in FE-01) — seed the mock manifest with at least one pass in each state (already-used, wrong-zone, wrong-night, refunded, blocked, invalid, multi-admit-partial) so every state is actually reachable by scanning during a demo, not just visible in the gallery.
6. Build `<SyncStatusBar>` with a manual toggle simulating online/offline (there's no real network dependency yet, so this has to be simulated deliberately) and a mock queue depth counter that increments on each scan and "flushes" (resets) when toggled online.
7. Build the Entry/Exit mode toggle and a basic `canReenter()` check against a mock policy object.
8. Build `/scan/manual` — large numeric/alpha keypad, same validation path, same `<ScanResult>` output.
9. Build `/scan/log` — this session's scans with a status column, searchable by pass code, CSV export via a client-side blob download.
10. Build the 3-screen onboarding sequence (how to scan / what colours mean / what to do on red), shown on first launch (a flag in localStorage), replayable via a long-press on `<SyncStatusBar>`.

---

## Files created

Same tree as `05-execution/phase-12-gate-scanner.md` "Files created", with `apps/scanner/src/lib/manifest.ts` reading from `packages/mock-data` instead of a Supabase Edge Function, and `crypto.ts`/`realtime.ts` present as typed stubs (function signatures final, bodies to be implemented in `05-execution` P-12).

---

## Acceptance criteria

- [ ] The PWA installs on a phone (Chrome "Add to Home Screen") and launches to the scanner shell with no network
- [ ] Scanning a real QR code (from a `<PassCard>` rendered elsewhere) against the mock manifest produces a correct verdict
- [ ] All 8 verdict states are each reachable by scanning an appropriately-seeded mock pass
- [ ] Manual code entry produces an identical verdict to scanning the same code
- [ ] Toggling the mock offline switch does not break scanning — validation never depends on the toggle's state
- [ ] `<ScanResult>` shows zero animation and auto-dismisses only on `allowed`
- [ ] Onboarding shows once, then not again, and replays correctly from the long-press menu
- [ ] No code anywhere references a printer, barcode-gun SDK, or POS hardware API

## Definition of Done

A real phone, in a real dark room, can scan a real QR code on another screen and get a correct, instantly-readable verdict — against mock data. The only thing FE-07/`05-execution` P-12 add is a real synced manifest and real offline crypto; the entire screen and interaction experience is already correct.

---

## Claude Code prompt

> Read `docs/05-execution/phase-12-gate-scanner.md`, `docs/04-design/manharevents-screen-specs.md` §3, and `docs/04-design/design-system.md` §6. Build the scanner PWA in `apps/scanner` per `docs/06-frontend-build/FE-05-gate-scanner-ui.md` — real PWA shell and real `@zxing/browser` QR decoding, validated against a mock manifest from `packages/mock-data` stored in IndexedDB via Dexie in the same shape the real manifest will use. Build all 8 `<ScanResult>` states to be actually reachable by scanning seeded mock passes, not just visible in a gallery. No hardware dependency beyond the camera anywhere in this codebase.
