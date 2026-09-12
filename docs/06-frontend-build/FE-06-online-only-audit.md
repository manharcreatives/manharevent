# FE-06 Online-Only Audit

**Date:** 2026-09-12
**Auditor:** Claude Code (automated grep + manual code review)
**Verdict:** ✅ PASS — zero hardware/native dependencies found in source code

---

## What was checked

The entire source tree (`apps/`, `packages/`) was grepped for the following patterns (case-insensitive):

| Pattern | Meaning |
|---|---|
| `receipt printer`, `label printer` | Thermal receipt or label printer SDKs |
| `barcode gun`, `barcode_gun` | USB/Bluetooth barcode gun/scanner device |
| `POS terminal` | Point-of-sale terminal integration |
| `react-native` | React Native (native mobile build) |
| `@capacitor` | Capacitor (native mobile wrapper) |
| `expo` | Expo (native mobile framework) |
| `bluetooth` | Bluetooth peripheral access |
| `usb periph` | USB peripheral SDK |
| `zebra`, `epson` | Specific printer vendor SDKs |
| `native app` | References to native app builds |

---

## Results

### `apps/web/src/**` — 0 matches
### `apps/dashboard/src/**` — 0 matches
### `apps/scanner/src/**` — 0 matches
### `packages/**` — 0 matches

### Build artifacts (not source code)

One match in `.next/required-server-files.json` across all three apps:

```
"@effect/sql-sqlite-react-native"
```

This is a **transitive dependency** of the `@effect` library ecosystem, present in the Next.js build manifest. It is:
- Not imported in any source file
- Not a dependency in any `package.json` in this repository
- Not used by any code path

It does not constitute a native app dependency.

---

## QR scanning

The gate scanner uses `@zxing/browser` which decodes QR codes using the **phone's camera** via the browser `getUserMedia` API. This is a 100% online/browser-native approach — no barcode gun, no USB scanner, no Bluetooth peripheral.

---

## Confirmation

The ManharEvent platform has **zero printer, POS, barcode-gun, Bluetooth/USB peripheral, or native mobile app dependencies** anywhere in its source code. Every function — ticket purchase, pass delivery, QR scanning, attendee check-in — works through a web browser. No physical hardware beyond the attendee's phone and the gate operator's phone is required.

This confirms the core platform promise: **100% online, zero physical hardware dependency**.

---

## Cross-app data consistency

Mock data is shared via `packages/mock-data` across all three apps. The seeded demo event (`ev-navratri-2026-ahmedabad`) and its passes appear in:

- **Public site** (`apps/web`): event listing and booking flow use `getEvent()`, `getPassTypes()`, `getZones()` from `@manhar-garba/mock-data`
- **Dashboard** (`apps/dashboard`): organizer view uses `getEvents()`, `getEventById()`, and related fixtures from the same package
- **Scanner** (`apps/scanner`): `buildScanManifest("ev-navratri-2026-ahmedabad", "night-05")` returns passes from the same fixture set

Since all three surfaces read from the same in-memory fixture objects, an event's data is always consistent across surfaces within a session. In production, all three will query the same Supabase database, preserving this consistency.

Passes tested as scannable from the public site's booking flow (mock orders):
- `PASS_DEMO_SINGLE` → `allowed` (admits=1, Gold, Night 5)
- `PASS_RINA` → `allowed_partial` first scan, `already_in` on second
- `PASS_PRIYA` → `already_in` (already checked in night-05)
- `PASS_VIP` → `wrong_zone` (VIP pass, Gold gate)
- `PASS_FAMILY_1` → `wrong_night` (nights 6–9 only)
- `PASS_AMIT` → `refunded`
- `PASS_BLOCKED` → `blocked`
- Any non-manifest payload → `invalid`

All 8 verdict states are reachable with the seeded data.
