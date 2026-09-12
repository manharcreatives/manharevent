# FE-04 — Organizer Dashboard UI (Surface 2, mock data)

| | |
|---|---|
| **Phase ID** | `FE-04` |
| **Depends on** | `FE-01`, `FE-02` |
| **Blocks** | `FE-06` |
| **Reference docs** | `04-design/manharevents-screen-specs.md §2`, `02-product/user-flows.md §Surface 2`, `02-product/product-spec.md §5.2` |

---

## Goal

Every organizer-facing screen, fully interactive against the mock store from FE-02, so an organizer demo can click through setting up an event, watching a "live" (simulated) event night, and reviewing finance — with zero real database.

---

## Deliverables

Every route from `user-flows.md` "Surface 2", built to `manharevents-screen-specs.md §2`:

1. `/dashboard` — Live Overview per §2.1 (stat tiles, sales chart, live check-in feed, occupancy meter, top pass types)
2. `/dashboard/events` and `/new` — event list + clone/create wizard (≤ 5 steps, per UX budget)
3. `/dashboard/events/[id]/*` — overview, nights, venue, passes, addons, promos, policy, publish, live, attendees, checkins, reports, comps
4. `/dashboard/finance/*` — orders, refunds, payouts, GST — per §2.2's card+table pairing
5. `/dashboard/team`, `/team/gate-staff`, `/vendors`, `/sponsors`
6. `/dashboard/settings/branding`, `/domain`, `/payments`, `/notifications`, `/audit`

---

## Step-by-step

1. Build the sidebar shell per §2's opening spec: logo + event switcher top, ≤ 8 top-level items, ≤ 2 nesting levels, collapsible at tablet width. This shell wraps every route below.
2. Build Live Overview per §2.1's exact grid — 4 `<StatTile>`s (only 3 "primary"/bold, 4th visually secondary, per the ≤3-primary-metrics budget), `<SalesChart>`, live check-in feed list, `<LiveOccupancyMeter>` per zone, top-selling pass types. Wire the "live" feed to a `setInterval`-driven mock event stream so it visibly updates during a demo, with the honest "updated Ns ago" / stale-badge behaviour from UX rule 9 built in even though there's no real realtime channel yet.
3. Build the event wizard: clone-or-create choice first (clone against the one mock event), then the ≤5-step form with every advanced field (price tiers, re-entry policy, GST, convenience fee) behind an "Advanced" disclosure that opens to a working default already filled in — this is UX rule 1 made concrete, and it's the dashboard's main visual distance from the audited TICMint admin.
4. Build venue/zones/gates config with a simple gate↔zone matrix editor.
5. Build the pass type builder (`<InventoryEditor>`) with quick-add presets (Season / Weekend / Daily / Single-night / Couple / Family / Group), each writing to the mock store.
6. Build the pre-publish checklist (`<PrePublishChecklist>`) with real blocking/warning logic evaluated against the mock event's current state (payment account "verified" toggle, GSTIN present, refund policy set, ≥1 pass type on sale, venue configured, terms accepted).
7. Build Finance per §2.2 — summary cards + donut + `<DataTable>` for orders/refunds/payouts, URL-synced filters (never infinite scroll).
8. Build Team/Vendors/Sponsors list+invite screens (`<RoleGate>`-driven visibility — build at least two mock roles, e.g. Owner and Finance, and show/hide accordingly).
9. Build Settings → Branding: colour pickers for `primary`/`accent` feeding straight into FE-01's `BrandOverride`, with a live preview pane showing the public site's `<EventCard>` and `<PassCard>` recoloured in real time, and a contrast-ratio warning if the chosen colours fail WCAG AA against the surface tokens.
10. Build the audit log screen reading a simple in-memory action log that other mock mutations (comp pass issuance, refund approval) append to — this proves the pattern before real audit-trail wiring in `05-execution`.

---

## Files created

Same shape as the relevant sections of `05-execution/phase-05, 06, 07, 09, 14, 15, 16` "Files created" trees (UI portions only — server actions/edge functions from those phases are out of scope here; every mutation in this phase writes to the in-memory mock store instead).

---

## Acceptance criteria

- [ ] A person can create (or clone) an event through the wizard, publish it, and see it appear correctly on the mock public site (FE-03) without a page reload glitch
- [ ] Live Overview visibly updates during a session (simulated feed), and shows a stale badge if the simulated feed is paused
- [ ] Every advanced field has a working default and is collapsed by default
- [ ] Finance screens use pagination, never infinite scroll
- [ ] Changing branding colours in Settings recolours the dashboard's own preview pane and (if FE-03 is open in another tab against the same mock store) the public site
- [ ] Sidebar never exceeds 8 top-level items or 2 nesting levels
- [ ] Every screen from `user-flows.md` Surface 2 resolves to a built page

## Definition of Done

An organizer can be handed a laptop, given zero training, and successfully create an event, configure zones and passes, publish it, and read the (simulated) live numbers — entirely through this UI, entirely without a real backend.

---

## Claude Code prompt

> Read `docs/04-design/manharevents-screen-specs.md` §2, `docs/02-product/user-flows.md` (Surface 2 section), and `docs/02-product/product-spec.md` §5.2. Build every organizer route in `apps/dashboard` against `packages/mock-data`'s repo and in-memory mutation store, following `docs/06-frontend-build/FE-04-organizer-dashboard-ui.md` step by step. Every advanced capability needs a working default collapsed behind "Advanced" — a first-time organizer must be able to publish without opening one. No infinite scroll on any data table. Wire the branding colour picker into the FE-01 `BrandOverride` component with a live preview.
