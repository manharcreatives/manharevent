# 01 · Scrape Analysis — What We Actually Got From TICMint

> **Source:** `site-clone-audit/` (10 files, crawled 2026-09-10)
> **Target scraped:** `https://dashboard-manhar.ticmint.com/`
> **Verdict in one line:** We captured the *shell*, not the *product*.

---

## 1. What the target actually is

`dashboard-manhar.ticmint.com` is **not a Garba platform**. It is a **white-labelled instance of TICMint** — a generic event-management SaaS — with "Manhar" branding bolted on via a `useWhiteLabel()` hook.

This matters enormously for our plan:

- The scrape gives us a picture of a **generic event dashboard**, not a Navratri/Garba product.
- Everything Garba-specific (season passes, 9-night structure, zone entry, re-entry, dress code, artist lineup, food coupons) is **absent** — either because TICMint does not have it, or because it sits behind the auth wall.
- Therefore: **we are not cloning this site. We are replacing it with something categorically better.**

---

## 2. Coverage map — what we have vs. what we don't

| Area | Captured? | Confidence | Notes |
|---|---|---|---|
| Route list (public) | ✅ Yes | High | `/`, `/auth/signin`, `/auth/signup` |
| Route list (protected) | ⚠️ Names only | Medium | `/dashboard`, `/events`, `/pricing`, `/settings`, `/team` — names only, zero content |
| Sign-in flow (full state machine) | ✅ Yes | High | email → password/OTP → org select |
| Sign-up form schema + validation | ✅ Yes | High | Zod rules fully captured |
| Auth error copy | ✅ Yes | High | 5 messages |
| Auth API endpoint names | ✅ Yes | Medium | `verifyEmail`, `verifyPassword`, `sendOtp`, `verifyOtp`, `selectOrganization` |
| Design tokens (colors/type/spacing) | ✅ Yes | High | Extracted from 205 KB Tailwind CSS |
| Animation keyframes | ✅ Yes | High | 11 named keyframes incl. `ticker-scroll`, `otp-column-up/down`, `mobile-sheet-*` |
| Component inventory | ⚠️ Partial | Medium | Inferred from bundles, not seen rendered |
| Tech stack | ✅ Yes | High | Next 15 + React 19 + Tailwind v4 + shadcn + Zustand + RQ + NextAuth |
| **Dashboard UI/content** | ❌ **No** | — | Auth wall |
| **Events UI/content** | ❌ **No** | — | Auth wall |
| **Pricing plans** | ❌ **No** | — | Auth wall |
| **Settings / Team UI** | ❌ **No** | — | Auth wall |
| **Data model / entities** | ❌ **No** | — | Never exposed |
| **Business API (non-auth)** | ❌ **No** | — | Never exposed |
| **Public ticket-buying flow** | ❌ **No** | — | Does not exist on this subdomain at all |
| **Gate / check-in flow** | ❌ **No** | — | Not visible |
| **Payments** | ❌ **No** | — | Not visible |
| Images / real assets | ❌ Directories empty | — | `04-assets/{images,icons,fonts}` are all empty |

**Bottom line: roughly 20% of the product surface was captured, and it is the least valuable 20% — the login screen.**

---

## 3. The five hard findings that shape our build

### F1 — It is 100% client-side rendered
Every route returns `BAILOUT_TO_CLIENT_SIDE_RENDERING` with `<div>Loading...</div>`. No SSR at all.

**Consequence for us:** This is a real weakness we should *not* copy. A Garba platform lives or dies on **public discovery** — people Google "Ahmedabad Garba pass 2026". A CSR-only app is invisible to Google, has poor Core Web Vitals on cheap Android phones on 4G, and shows a blank white screen on slow networks. **Our public surface must be SSR/ISR.** The organizer dashboard can stay client-heavy.

### F2 — No `robots.txt`, no `sitemap.xml`
Confirms SEO was never a consideration. Correct for an internal dashboard, **fatal for a consumer ticketing platform**.

**Consequence:** SEO is a first-class phase in our plan, not an afterthought.

### F3 — Auth is genuinely well designed and worth borrowing
The email → (password | OTP) → organization flow is the right pattern. Single entry field, backend decides the path, no separate "sign up" page to confuse people.

**Consequence:** We keep this pattern, and improve it for India — **phone number as the primary identity**, not email. Most Garba attendees will not have or want to type an email. Email becomes optional/secondary.

### F4 — The dependency list leaks the feature set
`react-grid-layout` + `tiptap` + `katex` + `react-tweet` tells us the dashboard has drag-and-drop widget panels, rich text event descriptions, and social embeds. `katex` (math rendering) in an event platform is almost certainly dead weight shipped by accident.

**Consequence:** We know roughly what their dashboard does, and we know they ship bloat. Our bundle discipline is a differentiator.

### F5 — White-label is a first-class concept in their code
`useWhiteLabel()`, `BrandLogo` with 3 variants, `DynamicFavicon`, multi-organization selection at login. TICMint is built as multi-tenant SaaS.

**Consequence:** Confirms the business model works, and confirms our decision to build **multi-tenant from day one** rather than retrofitting.

---

## 4. Design tokens — keep, change, or drop

The scraped token set is a generic SaaS palette (teal `#007C62` primary on off-white). It is competent and completely forgettable.

| Token group | Decision | Reason |
|---|---|---|
| Primary teal `#007C62` | ❌ **Drop** | Wrong emotional register. Garba is colour, energy, night, festival. |
| Neutral scale, radius `0.5rem`, spacing | ✅ **Keep as base** | Sensible shadcn defaults, no reason to reinvent |
| Type scale (12→36px, Inter) | ✅ **Keep the scale** | But swap Inter for a family with real Gujarati script support |
| Dark mode variable structure | ✅ **Keep structure** | But our dark mode is the *default*, not the alternative — Garba happens at night |
| Chart colours | ⚠️ **Replace** | Must pass contrast on dark surfaces; current set is light-mode-tuned |
| `ticker-scroll` keyframe | ✅ **Keep + use** | Genuinely useful for live announcements at a venue |
| `otp-column-up/down` | ✅ **Keep** | Nice OTP polish |
| `mobile-sheet-slide-up/down` | ✅ **Keep** | Bottom sheets are the right mobile pattern for pass selection |
| KaTeX fonts (18 faces) | ❌ **Drop entirely** | ~1 MB of fonts for maths nobody renders |
| `react-tweet` | ❌ **Drop** | Not needed |
| `react-grid-layout` | ⚠️ **Defer** | Drag-and-drop dashboards are a v2 nicety, not a launch feature |

---

## 5. Stack assessment — what we adopt from them

| Their choice | Our decision | Why |
|---|---|---|
| Next.js 15 App Router | ✅ Adopt | Correct choice |
| React 19 | ✅ Adopt | Correct |
| Tailwind CSS v4 | ✅ Adopt | Correct |
| shadcn/ui + Radix | ✅ Adopt | Correct — accessible, ownable, no lock-in |
| React Hook Form + Zod | ✅ Adopt | Correct |
| TanStack Query | ✅ Adopt | Correct |
| Zustand | ✅ Adopt (sparingly) | Only for genuine client state machines |
| NextAuth token strategy | ❌ **Replace** | We use Supabase Auth — gives us RLS-aware JWTs that the database itself enforces |
| Turbopack | ✅ Adopt | Default in Next 15 |
| Mixpanel | ⚠️ Replace | PostHog — self-hostable, cheaper, session replay + flags included |
| Freshchat | ⚠️ Replace | WhatsApp-first support is the India-correct channel |
| 100% CSR | ❌ **Reject** | See F1 |
| No SEO | ❌ **Reject** | See F2 |

---

## 6. What the scrape cannot tell us (open items carried into the plan)

These are genuine unknowns. **None of them block us**, because we are designing our own product, not matching theirs feature-for-feature. They are listed so nobody later assumes we forgot.

1. TICMint's actual pricing model and commission structure
2. Their database schema and entity relationships
3. Whether they support seat maps or only capacity-based passes
4. Their check-in / scanning implementation (if any)
5. Their settlement and payout mechanics
6. Whether they handle GST invoicing
7. Their refund and cancellation policy engine
8. Real content, copy, and imagery from the authenticated pages

---

## 7. Strategic conclusion

The scrape's most valuable output is **negative information**: it tells us what a competent-but-generic event SaaS looks like, and therefore exactly where the open space is.

TICMint is a *horizontal* event tool wearing a Manhar badge. Our opportunity is a **vertical, opinionated, Garba-native platform** that knows what Navratri actually is — nine nights, season passes, zones, re-entry, dress codes, food stalls, parking chaos, aunties who cannot read English, and gate staff with no internet.

That gap is the entire product thesis. See `02-gap-analysis.md`.
