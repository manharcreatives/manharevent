# 08 · Design System

> Built on the audited token structure (shadcn/Tailwind v4 CSS variables), with the palette replaced.
> Dark is the **default**. Garba happens at night.

---

## 1. Brand direction

The scraped platform's teal-on-white reads like accounting software. Garba is night, colour, motion, crowd, festival lights. The palette below is **deep night + festival colour**, not "generic SaaS with orange accents".

Three principles:
1. **Dark surfaces, luminous accents.** The UI should feel like the ground at 9 PM.
2. **Colour carries meaning, never decoration.** Zones get colour. Status gets colour. Nothing else does.
3. **High contrast always.** People use this outdoors, at night, on cracked screens, in a hurry.

---

## 2. Tokens

```css
:root {
  /* ---- Surfaces (dark default) ---- */
  --background:        240 12% 6%;    /* #0E0E12 near-black indigo */
  --surface:           240 10% 10%;   /* #17171E cards */
  --surface-raised:    240 9%  14%;   /* #21212A popovers, sheets */
  --surface-sunken:    240 14% 4%;    /* #09090C wells */
  --border:            240 8%  20%;
  --border-strong:     240 8%  30%;

  /* ---- Text ---- */
  --foreground:        240 10% 97%;
  --muted-foreground:  240 6%  64%;
  --placeholder:       240 6%  44%;

  /* ---- Brand ---- */
  --primary:           14 92% 56%;    /* #F55B2A  marigold-flame */
  --primary-hover:     14 92% 48%;
  --primary-foreground:0 0% 100%;
  --accent:            282 74% 62%;   /* #B24FE0  dandiya violet */
  --accent-foreground: 0 0% 100%;
  --gold:              42 96% 58%;    /* #FBBF2C  festive gold */

  /* ---- Status ---- */
  --success:           152 66% 45%;   /* #26BF7E  gate GREEN */
  --warning:           38 95% 55%;    /* #FBA524  already-entered AMBER */
  --destructive:       0 84% 58%;     /* #F03E3E  gate RED */
  --info:              212 92% 60%;

  /* ---- Zone colours (organizer-overridable) ---- */
  --zone-vip:          282 74% 62%;
  --zone-gold:         42 96% 58%;
  --zone-silver:       210 12% 70%;
  --zone-general:      190 80% 50%;
  --zone-sponsor:      330 75% 60%;

  /* ---- Charts (dark-tuned, colourblind-safe) ---- */
  --chart-1: 14 92% 56%;
  --chart-2: 190 80% 50%;
  --chart-3: 42 96% 58%;
  --chart-4: 282 74% 62%;
  --chart-5: 152 66% 45%;
  --chart-6: 212 92% 60%;

  /* ---- Geometry ---- */
  --radius:     0.625rem;   /* 10px */
  --radius-sm:  0.375rem;
  --radius-lg:  1rem;
  --radius-xl:  1.5rem;

  /* ---- Elevation ---- */
  --shadow-sm:  0 1px 2px rgb(0 0 0 / .4);
  --shadow-md:  0 4px 12px rgb(0 0 0 / .45);
  --shadow-lg:  0 12px 32px rgb(0 0 0 / .5);
  --shadow-glow: 0 0 24px hsl(var(--primary) / .35);
}

:root[data-theme="light"] {
  --background:       36 20% 98%;
  --surface:          0 0% 100%;
  --surface-raised:   0 0% 100%;
  --surface-sunken:   36 16% 95%;
  --border:           36 12% 88%;
  --foreground:       240 12% 12%;
  --muted-foreground: 240 6% 42%;
  --primary:          14 88% 48%;
  --shadow-glow:      0 0 24px hsl(var(--primary) / .18);
}
```

**White-label override:** `tenant_branding.primary_color` / `accent_color` are injected as `--primary` / `--accent` at the root layout via a server-rendered `<style>` tag. Everything else stays. This is the entire white-label mechanism — no per-tenant CSS files.

---

## 3. Typography

| Role | Family | Notes |
|---|---|---|
| UI + body | **Inter Variable** | `font-feature-settings: "cv11","ss01"; font-variant-numeric: tabular-nums` on all numbers |
| Gujarati / Hindi | **Noto Sans Gujarati** / **Noto Sans Devanagari** | Loaded only when locale requires — never ship all three |
| Display (event titles, hero) | **Bricolage Grotesque** | One display face, used sparingly |
| Mono (codes, pass IDs) | **JetBrains Mono** | Pass codes must be unambiguous |

```
Scale (rem):  0.75 · 0.875 · 1 · 1.125 · 1.25 · 1.5 · 1.875 · 2.25 · 3 · 3.75
Weights:      400 regular · 500 medium · 600 semibold · 700 bold
Line height:  1.2 display · 1.35 headings · 1.6 body
Tracking:     -0.02em on display, 0 on body, 0.04em on all-caps labels
```

**Rule:** pass codes and money always `tabular-nums` + mono. A price that shifts width as it updates is a bug.

---

## 4. Spacing, layout, motion

```
Spacing scale: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96
Container:     max-w-[1280px], px-4 sm:px-6 lg:px-8
Grid:          12-col desktop, 4-col mobile
Touch target:  min 44 × 44 px everywhere. Gate scanner: min 64 × 64 px.
```

**Motion budget** (carried over from the audit, trimmed):

| Token | Duration | Easing | Use |
|---|---|---|---|
| `--m-instant` | 100 ms | ease-out | Toggles, checkboxes |
| `--m-fast` | 160 ms | cubic-bezier(.2,0,0,1) | Hovers, tooltips |
| `--m-base` | 240 ms | cubic-bezier(.2,0,0,1) | Page/section transitions |
| `--m-sheet` | 400 ms in / 300 ms out | cubic-bezier(.32,.72,0,1) | Bottom sheets |
| `--m-ticker` | var, default 20 s | linear | Venue announcement ticker |

`prefers-reduced-motion: reduce` disables all non-essential motion. This is a hard requirement, not a nicety.

**The gate scanner has no animation at all.** Every millisecond and every frame is throughput.

---

## 5. Component inventory

### From shadcn/ui (install as-is, then re-theme)
`button` `input` `label` `textarea` `select` `checkbox` `radio-group` `switch` `slider` `tabs` `dialog` `sheet` `drawer` `dropdown-menu` `popover` `tooltip` `command` `table` `badge` `avatar` `separator` `skeleton` `alert` `progress` `accordion` `calendar` `input-otp` `sonner` `form` `scroll-area` `pagination`

### Custom components (built by us)

| Component | Surface | Purpose |
|---|---|---|
| `<PassCard>` | web | The pass itself — QR, holder, zone, nights, status |
| `<PassTypeSelector>` | web | Zone → type → qty, with live availability |
| `<PriceBreakdown>` | web | Base, discount, fee, GST — always fully expanded |
| `<NightPicker>` | web | 9-night selector with themes |
| `<ZoneMap>` | web | Interactive venue zone map |
| `<LineupCard>` | web | Artist + slot |
| `<CountdownTimer>` | web | To gates-open, to price-tier change |
| `<AvailabilityPill>` | web | "23 left" / "Sold out" / "Selling fast" |
| `<PhoneOtpFlow>` | web | Phone → OTP → name, the whole auth flow |
| `<GroupInviteTracker>` | web | Fill-in progress for group passes |
| `<WalletBalance>` | web | F&B balance + txn list |
| `<LangSwitcher>` | web | gu / hi / en |
| `<StatTile>` | dashboard | One number + delta + sparkline |
| `<LiveOccupancyMeter>` | dashboard | Per-zone capacity gauge, realtime |
| `<SalesChart>` | dashboard | Revenue over time |
| `<CheckInFeed>` | dashboard | Live scan stream |
| `<EventSwitcher>` | dashboard | Context switcher in sidebar header |
| `<RoleGate>` | dashboard | Renders children only for allowed roles |
| `<InventoryEditor>` | dashboard | Pass type + tiers in one grid |
| `<PolicyBuilder>` | dashboard | Refund tiers, re-entry rules |
| `<PrePublishChecklist>` | dashboard | Blocking checks before go-live |
| `<AuditTrail>` | dashboard | Who did what, when |
| `<ScanViewport>` | scanner | Camera + decode |
| `<ScanResult>` | scanner | The full-screen verdict — the most important component in the product |
| `<SyncStatusBar>` | scanner | Online/offline, queue depth, manifest version |
| `<ManualCodeEntry>` | scanner | Keypad fallback |

---

## 6. `<ScanResult>` — specified in full

This one component determines gate throughput, so it gets a spec rather than a description.

| State | Background | Icon | Primary text | Secondary | Haptic | Sound |
|---|---|---|---|---|---|---|
| `allowed` | full-bleed `--success` | ✓ 96px | Holder name, 32px bold | "GOLD · 2 of 2 · Night 5" | short | rising beep |
| `allowed_partial` | full-bleed `--success` | ✓ 96px | Holder name | "1 of 4 entered" | short | rising beep |
| `already_in` | full-bleed `--warning` | ! 96px | "ALREADY INSIDE" | "Entered 8:14 PM · Gate 3" | double | flat beep |
| `wrong_zone` | full-bleed `--destructive` | ✕ 96px | "WRONG GATE" | "GOLD pass · this is VIP" | long | error tone |
| `wrong_night` | full-bleed `--destructive` | ✕ 96px | "NOT VALID TONIGHT" | "Valid nights 1–5" | long | error tone |
| `refunded` | full-bleed `--destructive` | ✕ 96px | "REFUNDED" | "Refunded 12 Oct" | long | error tone |
| `blocked` | full-bleed `--destructive` | ⚑ 96px | "CALL SUPERVISOR" | reason | long | error tone |
| `invalid` | full-bleed `--destructive` | ✕ 96px | "INVALID PASS" | "Signature failed" | long | error tone |

Rules:
- Text readable at **1 metre in darkness**. Minimum 32px for the verdict line.
- Auto-dismiss after 1.5 s on `allowed`; requires a tap to dismiss on every failure state.
- Holder photo shown at 120×120 when `requires_photo`.
- **No animation on entry.** Instant paint.

---

## 7. Accessibility (WCAG 2.1 AA — acceptance criteria, not aspiration)

- Contrast ≥ 4.5:1 body, ≥ 3:1 large text and UI boundaries. Verified in CI with axe.
- Every interactive element keyboard reachable, visible focus ring (`--ring`, 2px, 2px offset).
- Forms: label + error linked via `aria-describedby`; errors announced via live region.
- Never colour alone — every status has an icon and text.
- Touch targets ≥ 44px (≥ 64px on scanner).
- `prefers-reduced-motion` honoured.
- Language attribute set correctly per locale for screen-reader pronunciation.
- Skip-to-content link on every public page.

---

## 8. Content & tone

| Surface | Tone |
|---|---|
| Public | Warm, festive, direct. Short sentences. No jargon. Never say "transaction" — say "payment". |
| Dashboard | Precise and calm. Numbers first. No exclamation marks. |
| Scanner | Two or three words. Imperative. "ALLOW" / "DENY". |
| Errors everywhere | Say what happened, why, and the one thing to do next. Never "Something went wrong." |

**Every string is translated.** English copy is written assuming it will be read in Gujarati by half the audience — so no idioms, no puns, no wordplay that will not survive translation.
