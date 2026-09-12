# 09 · UX Principles — "Advanced Underneath, Obvious On Top"

> The brief was: *advanced level software, but easy to understand for the user.*
> These are the concrete rules that make that true rather than a slogan.
> Every phase's acceptance criteria reference this document.

---

## The ten rules

### 1. Progressive disclosure is mandatory, not optional
Every advanced capability ships with a **working default** and is hidden behind "Advanced" until someone opens it.

| Advanced thing | Default the user never has to touch |
|---|---|
| Price tiers | One tier, one price |
| Re-entry policy | Unlimited re-entry |
| Refund policy | Full refund up to 7 days before, none after |
| Zones | One zone called "General" at venue capacity |
| Convenience fee | Platform default, passed to buyer |
| GST | 18%, auto-computed |
| Notification templates | Pre-written in all 3 languages |

A first-time organizer must be able to publish a sellable event **without opening a single Advanced panel.**

### 2. The buy path is four taps
Event page → pass select → phone/OTP → pay. Anything that adds a fifth tap must remove one elsewhere or be deleted.

Measured, not assumed: a Playwright test asserts the tap count.

### 3. Never ask for what you can infer
- Don't ask for email — phone is enough.
- Don't ask for city — infer from the event.
- Don't ask for a password — OTP is the account.
- Don't ask "how many people" separately — the pass type says `admits`.
- Don't ask for GST details from a buyer — only from the organizer, once.

### 4. Money is always fully visible, always
The full breakdown (base + fee + GST = total) is shown from the moment a pass is selected. **Never** reveal a fee at the final step. This single rule is the largest driver of checkout abandonment in Indian ticketing.

### 5. One primary action per screen
Exactly one button carries `--primary`. Everything else is secondary, ghost, or a link. If a screen seems to need two primary actions, the screen is doing two jobs.

### 6. Empty states teach
Every empty state has: what this is, why it's empty, and one button to fix it. "No events yet" is a failure. "No events yet — create your first one, or clone last year's" is the standard.

### 7. Errors name the fix
Banned: "Something went wrong", "Error 500", "Invalid input".
Required shape: **what happened · why · what to do now.**

> "Payment didn't go through — your bank declined it. Your passes are still held for 8 minutes. Try another method."

### 8. The gate has zero cognitive load
The scanner shows one colour, one word, one instruction. No menus, no confirmations, no scrolling. A staff member trained for 30 seconds must operate it correctly for six hours.

### 9. Nothing waits on the network that doesn't have to
- Pass QR renders locally and offline from the moment of purchase.
- Scanner never blocks on connectivity.
- Dashboard shows last-known values with an honest "stale" badge rather than a spinner.
- Optimistic UI on every mutation, with real rollback on failure.

### 10. Language is a first-class choice, not a setting
Language switcher is visible in the public header, not buried in account settings. The choice persists in a cookie and is SSR-aware, so the first paint is already correct.

---

## Complexity budget

Each surface has a hard limit. Exceeding it requires removing something else.

| Surface | Budget |
|---|---|
| Public — buy path | ≤ 4 screens, ≤ 7 input fields total across the whole flow |
| Public — nav | ≤ 4 primary items |
| Dashboard — sidebar | ≤ 8 top-level items, ≤ 2 nesting levels |
| Dashboard — any single screen | ≤ 3 primary metrics above the fold |
| Event creation wizard | ≤ 5 steps to a publishable event |
| Scanner | 1 screen. Settings behind a long-press. |

---

## Mobile-first reality check

The reference device is **not** an iPhone. It is:

> A 4-year-old Android, 3 GB RAM, cracked screen, 4G with 2 bars, 40% battery, held in one hand, outdoors, at night, by someone who is mildly annoyed.

Every public-surface decision is judged against that device. Concretely:

- Critical JS on the buy path: **< 200 KB gzipped**
- No layout shift after first paint (CLS < 0.05)
- Images: AVIF/WebP, explicit dimensions, lazy below the fold
- Fonts: `font-display: swap`, subset, only the active locale's script
- The QR must render **without JavaScript re-fetch** once the pass is open
- Thumb zone: all primary actions in the bottom third of the screen on mobile

---

## Onboarding & learnability

**Attendee:** zero onboarding. If someone needs to be taught how to buy a ticket, the design failed.

**Organizer:** guided but skippable.
1. Clone-or-create choice on first event
2. Inline help on every advanced field (a `?` that explains in one sentence, with an example)
3. Pre-publish checklist that blocks go-live on genuinely broken config, warns on the rest
4. A "preview as attendee" button on every event page

**Gate staff:** a 3-screen tutorial the first time the app opens, replayable from settings. Then never again.

---

## Trust signals on the public surface

Indian ticket buyers are (correctly) wary of unknown ticketing sites. Trust is designed in:

- Organizer name, logo, and support phone visible on every event page
- Refund policy stated in plain language **before** payment, not linked in the footer
- "Secured by Razorpay" with real payment-method icons
- Order confirmation on-screen **immediately** — the pass QR appears before WhatsApp arrives
- Visible support: WhatsApp button with a real response-time promise
- Real availability counts, never fake urgency ("Only 3 left!" when there are 300)

---

## Anti-patterns — explicitly banned

| Banned | Why |
|---|---|
| Fake scarcity or fake countdowns | Destroys trust permanently; also illegal under CCPA dark-pattern rules |
| Pre-checked add-ons | Dark pattern |
| Fees revealed at the last step | Rule 4 |
| Forced app download | We are a PWA on purpose |
| Forced account creation before browsing | OTP at checkout is enough |
| Carousels on the event page | Nobody clicks past slide 1 |
| Infinite scroll in the dashboard | Finance people need pagination and page numbers |
| Toast-only error reporting on forms | Errors belong next to the field |
| Modal on top of modal | Use a sheet, or a new route |
| Auto-playing audio or video | It is already loud at a Garba ground |
| Hamburger menu hiding primary nav on mobile | Bottom tab bar instead |

---

## How this is enforced

These are not guidelines. Each has a check:

| Rule | Enforcement |
|---|---|
| 4-tap buy path | Playwright test counts interactions |
| < 200 KB critical JS | CI bundle-size budget, fails the build |
| WCAG AA | axe-core in CI on every public route |
| No hardcoded strings | ESLint rule bans string literals in JSX text position |
| Money as integers | ESLint rule bans `number` type on `*_paise` fields; TS branded type `Paise` |
| One primary button | Code review checklist item per PR |
| Error message shape | Copy review in the phase's Definition of Done |
