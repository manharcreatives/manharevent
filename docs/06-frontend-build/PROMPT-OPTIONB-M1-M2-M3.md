# 🪔 ManharEvent — "Per-Organizer Rich Dashboard" (Option B, Phased: M1+M2+M3-Scanner)

Tum 25 saal ke senior full-stack dev+architect+QA ho. Ye mera product hai, client ko
Navratri demo dikhani hai. Poore hafte ka kaam do bade milestones mein: M1 (per-organizer
single Events nav + tenant list + 2nd demo organizer), M2 (deep editors server-funded,
tenant-scoped), M3-Scanner (Team/gate-staff/scanner per organizer). Har milestone ke
baad build green. Proof har jagah, token bachao, surgical edits, quality pe compromise nahi.

## 📂 Context (pehle yeh padho)
- Monorepo: `apps/web` (:3000), `apps/dashboard` (:3001), `apps/scanner` (:3002),
  `apps/marketing` (:3003). Packages: `@manhar-garba/domain`, `@manhar-garba/mock-data`,
  `@manhar-garba/ui`, `@manhar-garba/i18n`.
- Docs: `docs/PROGRESS.md` (decision log: Option B, 2026-09-15), `PLATFORM-REVIEW-2026-09-14.md`,
  `docs/06-frontend-build/PROMPT-WEEK1-TRACK-1-2-3.md` (HARD RULES + TOKEN DISCIPLINE).
- **Store aise hai** (2026-09-15): `packages/mock-data` ab **file-backed shared store**
  (`packages/mock-data/.data/store.json`, atomic write + mtime reload) — 4 apps ek data.
  `storage.ts`, `repo.ts` reloadIfChanged(); public API signatures stable.
- **Organizer login** (2026-09-15): `:3003/login` phone+demo OTP → HMAC cookie
  `manhar_org_session` (`packages/mock-data/src/org-session.ts`). Dashboard session helper:
  `apps/dashboard/src/lib/org-session.ts`. Server actions: `apps/dashboard/src/app/actions/org.ts`
  (getMyDashboardAction / createMyEventAction / setMyEventStatusAction — ownership check pattern).
- **Current gap:** dashboard ka rich data layer ab bhi **client zustand** mein hain —
  `apps/dashboard/src/lib/dashboard-store.ts` (1,392 lines, localStorage-persist, `TENANT_ID`
  **15+ jagah hardcoded**, 100+ call sites). Ediit (passes/nights/zones/addons/promos/comps/
  policy/publish/team/scanner-creds) sab isi se chalta hai, aur sab **Manhar tenant** pe.
  Web+scanner **sahi** server shared store se padhte hain. Matlab dashboard doosri duniya mein hai.
- **Nav duplication abhi:** `nav-items.ts` mein "My Events" group (31-39) + "Events" group
  (40-48) — do events sections, do create. Single karna hai.
- Seeded `tenant` fixtures: `packages/mock-data/src/fixtures/tenant-applications.ts`,
  repo.ts mein `SEEDED_UMANG_TENANT` (95-118) already hai — Umang 2nd demo organizer banega.

## 🎯 Goal
Har approved organizer (Manhar seed + Umang seed + koi naya register kare) ko **apna poora
rich dashboard** mile, uske apne tenant-data ke saath: ek single "Events" section (dekho/
modify/naya banao), deep editors (passes/nights/zones/addons/promos/comps/policy/publish)
uske apne events ke liye, aur Team/gate-staff/**scanner** uske apne gates ke liye.
Cross-tenant data leak ZERO. Scanner (:3002) har organizer ke event ke liye kaam kare.

## 📐 HARD RULES
- Money integer paise. Float kabhi nahi.
- Har naya user-visible string → `packages/i18n` en/gu/hi.
- Koi nayi dependency nahi. `packages/mock-data` ke purane function signatures UNCHANGED
  (swap-to-real-DB ur background). Naye repo mutations sirf ADD honge.
- Client component kabhi mock-data NAHI import karega (server actions / server components).
- Har acceptance pe PROOF (file+line+command output).
- **Har milestone ke baad** `pnpm lint && pnpm typecheck && pnpm build` green (4 apps).

## ⚠️ IMPORTANT (pehle karo)
`store.json` already bana hota hai — fixtures mein navya data (Umang demo event/orders/passes)
tab tak nahi dikhega jab tak store reset na ho. Solution: repo mein seed "schema version"
add karo (`storeVersion` in MockStore + file); agar file ka version < code version → re-seed
se fixtures. Demo final mein `packages/mock-data/.data/store.json` delete + restart apps
taaki sab fresh seed ho. README/PROGRESS mein ek line — "demo reset: delete .data/store.json".

---

## M1 — Per-organizer single Events section (demo-safe)

1. **`nav-items.ts` single Events group:**
   `Events (Calendar)` → children: `All events` (/dashboard/events), `Create event`
   (/dashboard/events/new). "My Events" top-level group HATAO. `isSectionActive`/`openGroupFor`
   verify karo. `/dashboard/my-events` route ko `/dashboard/events` par **redirect** (page delete
   optional). Sidebar+MobileNav saath saath theek (woh NAV hi render karte hain).
2. **`/dashboard/events` = tenant-scoped unified list (server-driven):**
   - Naya server action `listMyEventsAction()` (session tenant → `listEventsForTenant`).
   - Page se zustand events ka use hatao; list ab sirf session tenant ke events dikhayi.
   - Row ke actions: title→Manage (event detail), status chip, Publish/Unpublish (`setMyEventStatusAction`),
     Share button (`share-event-dialog`: public `:3000/en/e/<slug>` + QR + WhatsApp), View (public page),
     Clone (`cloneEventForTenant` add karo repo mein — M2 mein), New event button wahi.
   - Search/filters (All/Live/Draft/Past) usi list par lagao.
3. **Umang = 2nd full demo organizer (fixtures):**
   - `fixtures/event.ts` + pass-types/zones/nights/venues: Umang ka apna chhota event
     (jaise 3-night open-ground: Season ₹1,500 / Single ₹400 / Couple ₹800, paise integers, no addons).
   - `fixtures/tenant-branding` Umang ke liye (already branding stub hai — custom_domain null).
   - `fixtures/orders.ts`/passes/checkins: Umang event ke liye 3-5 orders + few checkins
     (sab tenant_id = t-umang) taaki Uske dashboard live data jaisa dikhe.
   - Seed via storeVersion (upar wala) — proof: Umang login → apne events/orders.
4. **Cross-tenant ZERO-leak:** coffee ladke check — Manhar ke session mein Umang ke events
   nahi; Umang mein Manhar ke nahi. `listEventsForTenant` + `listOrdersByTenant`/`list*ForTenant`
   filters har jagah.

## M2 — Deep editors server-storable, tenant-scoped (bada wala)

Har editor ab client zustand se server repo + server actions par chale jayega. Pattern:
- **repo.ts (packages/mock-data) — naye mutations (tenant/event validated):**
  `createPassType`, `updatePassType`, `removePassType`, `addPriceTier`, `updatePriceTier`
  (existing confirm karo), `removePriceTier`, `createZone`, `updateZone`, `createAddon`,
  `updateAddon`, `removeAddon`, `updateNight`, `setNightLineup`, `createPromo`, `togglePromo`,
  `addCompPass`, `updatePolicy` (event policy/re-entry), `updateEvent`, `cloneEventForTenant`,
  `updateVenue`. Har mutation event's `tenant_id` check kare (helpers kar lo: `assertEventOwns(tenantId,eventId)`).
- **Server actions** (`apps/dashboard/src/app/actions/`): ek `manage.ts` (yA org.ts ke andar
  sab) — `getEventManageAction(eventId)` (event+venue+nights+zones+gates+passTypes+priceTiers+
  addons+promos+comps+policy bundle), aur har mutation action (ownership = session tenant).
- **Editors pages switch karo** (har page ek-ek, build ke saath):
  `events/[id]/page` (overview), `events/[id]/passes`, `events/[id]/nights`, `events/[id]/addons`,
  `events/[id]/promos`, `events/[id]/comps`, `events/[id]/policy`, `events/[id]/publish`,
  `events/[id]/venue`, `events/new` (full `EventWizard` ab server `createEventForTenant` se
  save + clone support) , `events` (list, upar).
  - `use-event.ts` (web-common selectors) aur `event-shell.tsx`/`sidebar` current-event
    switcher bhi server bundle se hydrate karo (session tenant ke events).
  - Client zustand sirf pure-UI cheezein rakhe (simulation, role playground) — warna remove.
- **Manhar seeded data intact rehna chahiye** (apna dashboard aisa hi dikhe jaise aaj).

## M3-Scanner — Team / gate-staff / scanner credentials per organizer

- **repo.ts (server):** `listTeam(tenantId)`, `addTeamMember`, `removeTeamMember`,
  `listEventGates(eventId)` (already), `setGateStaffAssignment`, `issueScannerCredential`,
  `revokeScannerCredential`. Gate-staff roster `gate-staff.ts` fixture → ab per-tenant vibrant
  server store se (scanner apne validation pehi se shared store use karta hai — verify).
- **`team/page.tsx` + `team/gate-staff/page.tsx`** (gate coverage): server-driven,
  session tenant ke members/gates. `issueGateCode` (domain) se code derive — jaise aaj
  Manhar ke liye hota hai, ab organizer ke apne gates ke liye.
- **Scanner :3002 handoff proof:** Umang ke gate-staff (phone+code) → :3002 sign-in →
  Umang event ke gates se scan → valid night allow, wrong night "wrong night". Manhar ka
  flow bhi unaffected. (scanner files touch only agar functional input poora na ho —
  else sirf verify.)

## M4(light) — Verification + reset + docs
- E2E script (proof): Manhar login → apna rich dashboard (Events single section, deep edits).
  Umang login → apna dashboard (apne events/orders/passes). Naya organizer register→approve→
  login → apna dashboard → create → deep edit → publish → web `:3000/en/e/<slug>` live →
  buy pass → apne gate-staff se :3002 scan. Cross-tenant leak none.
- `.data/store.json` re-seed procedure (storeVersion) chalake — demo ko fresh seed do.
- `docs/PROGRESS.md` + decision log (Option B M1+M2+M3, 2026-09-15) update.

## ✅ ACCEPTANCE (sab proof)
A1. Nav mein event ek hi jagah (Events: All events + Create event); my-events redirect.
A2. `/dashboard/events` sirf session tenant ke events dikhaye; do organizers alag-alag lists.
A3. Umang seeded: 3rd event + orders + branding — login pe apna rich dashboard.
A4. Passes/nights/addons/promos/comps/policy/publish editors server-par strict, saved →
   web/scanner turant reflect (shared store), tenant-check on every mutation.
A5. Clone event organizer ke apne tenant mein kaam karta hai.
A6. Team/gate-staff/scanner credentials per organizer; Umang ke staff :3002 se apne
   gates scan karein (valid + wrong-night dono).
A7. Manhar dashboard purana dipped ka accuracy — same data, same screens.
A8. Build green (4 apps), PROGRESS.md + decision log, koi li'l nayi dependency.

## ⛔ OUT OF SCOPE (demo ke baad / real-DB phase)
- Finance (refunds/payouts/GST), Vendors/Sponsors, Branding/Domain/Payments/Audit ko
  per-tenant full migrate — yeh seeded Manhar data pe aaj jaise dikhega (dono ke liye koi
  khali screen nahi). Manhar tenant ke paas wahi aaj ke screens.
- Real auth/OTP, custom domains/DNS, payments, multi-org billing (P-03/P-04/P-05).
- Open-ground UI refresh (alag feature) — par create-wizard open-ground world mei aaj bhi.
- `zone_id` nullable domain change (Approach A) — yeh track nahi.

Aakhri check: *Client ninja demo — Manhar aur Umang, do organizers, dono ko apna poora
dashboard, dono edit+publish karte, dono ka web live, dono k gates pe scanner — ek bhi
screen par doosre ka data nahi. Ek hi baar mein poora loop.* Agar haan — khatam.
Shubh labh. 🪔