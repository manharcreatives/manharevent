# Phase 05 — Event, Venue, Zone & Lineup Management

| | |
|---|---|
| **Phase ID** | `P-05` |
| **Depends on** | `P-04` |
| **Blocks** | `P-06`, `P-08` |
| **Estimated effort** | 20–26 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `03-architecture/data-model.md §2`, `04-design/ux-principles.md` |

---

## Goal

An organizer can create a complete Navratri event — 9 nights with themes and lineups, a venue with zones and gates — in under 15 minutes, or clone last year's in one click.

This is where the product stops being generic and becomes Garba-native.

---

## Deliverables

1. Event creation wizard (create + clone)
2. Nine-night auto-generation with per-night configuration
3. Venue, zone, and gate management
4. Artist and lineup management
5. Rich event content editor
6. Pre-publish checklist
7. Publish / unpublish with safety rails

---

## Step-by-step

### 5.1 Event wizard — `/dashboard/events/new`
1. Step 0: **"Start fresh"** or **"Clone a previous event"**. If any past event exists, clone is the default and pre-selected.
2. Clone copies: venue, zones, gates, pass types, price tiers (with a "review prices" flag), add-ons, policies, notification templates, FAQ. It does **not** copy: dates, orders, passes, promo codes.
3. Step 1 — Basics: title, subtitle, category, start date, number of nights (default 9), cover image.
4. Step 2 — Venue: pick existing or create new (name, address, city, pincode, map link, capacity).
5. Step 3 — Zones: at least one. Defaults to a single "General" zone at venue capacity (UX rule 1).
6. Step 4 — Nights: auto-generated from start date + count. Inline editing of theme, colour, dress code, gates-open time.
7. Step 5 — Review and create as `draft`.
8. **Maximum 5 steps. Enforce this.**

### 5.2 Event overview — `/dashboard/events/[id]`
9. Header: title, dates, status badge, primary action that changes with state (Publish / View live / End event).
10. Three cards max above the fold: sales, capacity sold, nights remaining (UX rule: ≤ 3 primary metrics).
11. Completion checklist showing what still blocks publishing.

### 5.3 Nights — `/dashboard/events/[id]/nights`
12. A row per night: number, date, theme name, theme colour, dress code, gates open, start, end, lineup summary.
13. Inline edit; bulk edit for common fields ("set gates open to 7:00 PM for all nights").
14. Per-night status: `scheduled | live | completed | cancelled`.
15. Cancelling a night triggers the refund-policy path (implemented in P-15) and must warn about how many passes are affected **before** confirming.

### 5.4 Venue, zones, gates — `/dashboard/events/[id]/venue`
16. Venue details with map preview.
17. Zone editor: code, name, capacity, colour, description, sort order.
    - Sum of zone capacities is shown against venue capacity with a warning if it exceeds.
    - Zone colour defaults come from the `--zone-*` tokens.
18. Gate editor: code, name, direction (entry/exit/both), and **which zones this gate serves** (many-to-many).
19. A visual gate↔zone matrix — this is the thing gate staff configuration depends on, so make it unmistakable.
20. Optional venue map image upload with zone hotspots (simple polygon editor; if that is too much, a labelled image is acceptable for v1).

### 5.5 Artists & lineup — `/dashboard/events/[id]/lineup`
21. Artist CRUD: name, slug, bio, photo, Instagram, YouTube.
22. Artist library is tenant-scoped and reusable across events.
23. Per-night lineup: assign artists with slot times and billing order.
24. Drag to reorder billing; the top-billed artist becomes the night's headline on the public page.
25. Bulk-assign a resident artist across all 9 nights in one action (very common — most grounds have one main artist).

### 5.6 Content — `/dashboard/events/[id]/content`
26. Rich description editor (Tiptap, minimal extension set: headings, bold, italic, lists, links, images. **No** KaTeX, **no** tweet embeds — see gap analysis).
27. FAQ builder (question/answer pairs, reorderable).
28. "How to reach" section with directions and parking notes.
29. Terms specific to this event.
30. All content fields are **per-locale** — English, Hindi, Gujarati tabs. Untranslated fields fall back to English with a visible "not translated" marker in the dashboard.

### 5.7 Pre-publish checklist — `/dashboard/events/[id]/publish`
31. **Blocking** checks (cannot publish until green):
    - Tenant status is `active`
    - Razorpay configured and verified
    - GSTIN present
    - At least one zone with capacity > 0
    - At least one gate
    - At least one pass type with a price tier and `status = on_sale`
    - Refund policy set
    - Event dates in the future
    - Cover image present
32. **Warning** checks (publish allowed, but flagged):
    - No lineup configured
    - No FAQ
    - No Gujarati translation
    - No venue map
    - Zone capacity sum exceeds venue capacity
33. Each item links directly to the screen that fixes it.

### 5.8 Publish
34. `draft → published` sets `published_at`, warms the ISR cache for public routes, and writes an audit entry.
35. Unpublish is allowed only while zero passes are sold; after that only "pause sales".
36. "Preview as attendee" button opens the public event page with a signed preview token, even while in draft.

---

## Files created

```
apps/dashboard/src/app/events/new/page.tsx           (wizard)
apps/dashboard/src/app/events/[id]/page.tsx
apps/dashboard/src/app/events/[id]/{nights,venue,lineup,content,publish}/page.tsx
apps/dashboard/src/actions/{event,venue,zone,gate,night,artist,lineup}.ts
apps/dashboard/src/components/events/{EventWizard,NightsTable,ZoneEditor,
    GateZoneMatrix,LineupBoard,PrePublishChecklist,VenueMapEditor}.tsx
packages/domain/src/event/{nights.ts,capacity.ts,checklist.ts} + tests
packages/contracts/src/event.ts                       (Zod schemas)
supabase/functions/clone-event/index.ts
e2e/event-creation.spec.ts
```

---

## Acceptance criteria

- [ ] A new organizer creates a publishable 9-night event in **under 15 minutes** — time this with a real person, not an assumption
- [ ] Cloning last year's event produces a complete, correct copy in one click, with dates cleared and prices flagged for review
- [ ] Nine nights auto-generate correctly from a start date, including across a month boundary
- [ ] The gate↔zone matrix correctly persists a many-to-many mapping
- [ ] The pre-publish checklist blocks publish on every blocking condition and each item links to its fix
- [ ] Publishing makes the public event page live within 60 seconds
- [ ] Preview-as-attendee works on a draft event and is inaccessible without the token
- [ ] Content entered in Gujarati renders correctly on the public page
- [ ] Wizard is ≤ 5 steps (asserted in an E2E test)

---

## Definition of Done

The seeded demo event can be recreated from scratch through the UI alone, with no SQL, in under 15 minutes.

---

## OpenCode prompt

> Read `docs/05-execution/phase-05-events-venues.md` and `docs/03-architecture/data-model.md §2`. Execute Phase 05 steps 5.1–5.8. The wizard must not exceed 5 steps. Defaults must let an organizer publish without opening any advanced panel. Tiptap gets a minimal extension set only — no KaTeX, no tweet embeds.
