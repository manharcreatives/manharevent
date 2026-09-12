# Phase 08 — Public Discovery & Event Pages

| | |
|---|---|
| **Phase ID** | `P-08` |
| **Depends on** | `P-04`, `P-05`, `P-06`, `P-07` |
| **Blocks** | `P-09` |
| **Estimated effort** | 26–34 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `02-product/user-flows.md §1`, `04-design/ux-principles.md` |

---

## Goal

The attendee-facing website: fast, indexable, multilingual, and beautiful on a cheap Android at night. This is the surface the scraped platform does not have at all, and it is where the revenue comes from.

**Hard constraint: first-load JS on the buy path ≤ 200 KB gzipped. LCP < 2.5s on a throttled 4G mid-tier Android.**

---

## Deliverables

1. Home / city discovery pages
2. Event landing page with full content
3. Per-night SEO pages
4. Artist pages
5. Pass selector (the conversion surface)
6. Full i18n (gu / hi / en)
7. Complete SEO: sitemap, robots, structured data, OG images
8. Performance budget enforced in CI

---

## Step-by-step

### 8.1 Rendering strategy
1. Static/ISR everything that can be:
   - `/`, `/[city]`, `/e/[slug]`, `/e/[slug]/night/[n]`, `/artist/[slug]` → ISR, `revalidate: 60`
   - On-demand revalidation triggered by dashboard publish/update
2. Dynamic only where genuinely needed: `/e/[slug]/book` (live availability), `/checkout/*`, `/me/*`.
3. React Server Components by default. Client components only for: pass selector, promo input, language switcher, countdown. Each carries a comment justifying `"use client"`.

### 8.2 Home & discovery
4. `/` — hero, city selector, featured events, "Navratri 2026" seasonal module.
5. `/[city]` — event grid with date and category filters; filters live in **URL query params** so results are shareable and back-button-safe.
6. Search: server-side, over event title, venue, city, artist. Debounced, no client-side index.
7. Empty states follow UX rule 6.

### 8.3 Event landing page — `/e/[slug]`
8. Above the fold: cover, title, dates, venue, headline artist, price-from, prominent "Book Passes".
9. Sections: about, night-by-night lineup, zones with what each includes, venue + how to reach, gallery, FAQ, refund policy in plain language, organizer info with support number.
10. Sticky bottom bar on mobile: price-from + "Book Passes" — always in the thumb zone.
11. Trust block: organizer name, logo, support phone, "Secured by Razorpay", real payment icons.
12. Share: WhatsApp, Instagram story image, copy link — with a per-event OG image.

### 8.4 Night pages — `/e/[slug]/night/[n]`
13. One page per night: date, theme, dress code, lineup, gates open, buy CTA for passes valid that night.
14. These exist for SEO — real queries look like "ahmedabad garba 5th night 2026". Each gets its own title, description, and structured data.

### 8.5 Artist pages — `/artist/[slug]`
15. Bio, photo, socials, all upcoming events across the platform where they appear.
16. "Follow" (stores intent; notifications land in P-16).

### 8.6 Pass selector — `/e/[slug]/book`
This is the highest-value screen in the product. Build it deliberately.

17. Step 1 — **Zone**: cards with name, what's included, price-from, availability badge. Zone colour from tokens.
18. Step 2 — **Pass type**: within the zone, grouped by kind (Season / Weekend / Daily / Single Night). Each card: name, admits ("Admits 2"), nights covered, price, availability.
19. For `daily` passes, an inline night picker with per-night availability.
20. Step 3 — **Quantity**: stepper respecting min/max per order, with live "{n} left" when low.
21. Step 4 — **Add-ons**: parking, F&B wallet, merch. **Never pre-checked** (banned dark pattern).
22. Promo input.
23. `<PriceBreakdown>` visible and fully expanded from the moment the first pass is selected.
24. Sticky footer: total + "Continue to Pay".
25. Cart persists across refresh (localStorage + a server-side draft order) — the back button must never lose it.
26. Availability updates live via Supabase Realtime.
27. **Tap budget: from `/e/[slug]` to Razorpay must be ≤ 4 taps.** Assert this in an E2E test.

### 8.7 Internationalisation
28. `next-intl` with locale routing: `/gu/e/...`, `/hi/e/...`, default `en` unprefixed.
29. Language switcher in the header (UX rule 10), persisted in a cookie, SSR-aware so first paint is correct.
30. Translate all UI strings; organizer content uses per-locale fields from P-05 with English fallback.
31. Locale-correct number and date formatting; `₹` with Indian digit grouping (1,00,000 not 100,000).
32. Load only the active locale's font subset.

### 8.8 SEO
33. `sitemap.xml` — dynamic, includes every published event, night, artist, and city page, with `lastmod`.
34. `robots.txt` — allow public, disallow `/checkout`, `/me`, `/g/`, `/api`.
35. Structured data (JSON-LD): `Event` with `offers`, `performer`, `location`, `eventAttendanceMode`, `organizer`. Per-night pages get their own `Event`.
36. Metadata per route: unique title, description, canonical, `hreflang` for all three locales.
37. Dynamic OG images via `next/og` — event cover + title + dates + organizer logo.
38. Breadcrumb structured data.
39. Verify: Rich Results Test passes for an event page and a night page.

### 8.9 Performance
40. Images: `next/image`, AVIF + WebP, explicit dimensions, `priority` on the LCP image only, lazy below the fold.
41. Fonts: `display: swap`, preload only the active locale's primary face.
42. Route-level code splitting; the pass selector's heavy bits load on interaction.
43. CI budget: `apps/web` route-level first-load JS ≤ 200 KB gzipped on the buy path. Build fails if exceeded.
44. Lighthouse CI in the pipeline on `/`, `/e/[slug]`, `/e/[slug]/book`: Performance ≥ 90, Accessibility = 100, SEO = 100 on mobile emulation.

---

## Files created

```
apps/web/src/app/
├── [locale]/page.tsx                          home
├── [locale]/[city]/page.tsx
├── [locale]/e/[slug]/page.tsx
├── [locale]/e/[slug]/{lineup,venue,gallery,faq}/page.tsx
├── [locale]/e/[slug]/night/[n]/page.tsx
├── [locale]/e/[slug]/book/page.tsx
├── [locale]/artist/[slug]/page.tsx
├── sitemap.ts  robots.ts  opengraph-image.tsx
apps/web/src/components/event/{EventHero,LineupSection,ZoneCards,VenueSection,
    FaqSection,TrustBlock,ShareSheet,StickyBookBar,NightCard}.tsx
apps/web/src/components/book/{ZoneSelector,PassTypeSelector,NightPicker,
    QuantityStepper,AddonSelector,CartSummary,BookingFooter}.tsx
apps/web/src/lib/{seo.ts,jsonld.ts,cart-store.ts}
packages/i18n/messages/{en,hi,gu}.json         (full catalogues)
e2e/{booking-flow,seo,performance}.spec.ts
.github/workflows/lighthouse.yml
```

---

## Acceptance criteria

- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility 100, SEO 100 on home, event, and book pages
- [ ] First-load JS on `/e/[slug]/book` ≤ 200 KB gzipped, enforced by a failing CI budget
- [ ] LCP < 2.5s on simulated 4G / 4× CPU throttle
- [ ] Google Rich Results Test validates the `Event` markup on both event and night pages
- [ ] `sitemap.xml` contains every published event, night, and artist
- [ ] Switching to Gujarati translates the entire UI and organizer content, and the correct font loads (verify the English page does **not** fetch it)
- [ ] Pass selector → Razorpay in ≤ 4 taps (E2E asserts the count)
- [ ] Cart survives a hard refresh and a back-navigation
- [ ] Availability updates live in a second browser without a refresh
- [ ] Price breakdown is fully expanded from first selection — no fee appears later
- [ ] No add-on is pre-checked anywhere
- [ ] A draft event returns 404 publicly but renders with a preview token

---

## Definition of Done

The demo event's public page is live, indexable, fast, trilingual, and a stranger can get from the event page to the payment screen in four taps.

---

## OpenCode prompt

> Read `docs/05-execution/phase-08-public-site.md`, `docs/02-product/user-flows.md`, and `docs/04-design/ux-principles.md`. Execute Phase 08 steps 8.1–8.9. Server Components by default — every `"use client"` needs a justifying comment. The 200 KB budget and the 4-tap assertion are hard requirements, not targets. Set up the CI performance budget before building the pass selector, so you find out immediately when you exceed it.
