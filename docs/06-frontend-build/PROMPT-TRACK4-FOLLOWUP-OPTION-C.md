# 🪔 ManharEvent — Track 4 FOLLOW-UP: "Small shell hatao — rich dashboard sabke liye, My Events sidebar section"

Tumne Track 4 mein non-Manhar organizers ko ek chhota 3-tab `OrgShell`
(My Events / Create Event / Settings) de diya. Product owner ko ye HATANA hai:
**purana rich dashboard bilkul waisa hi chahiye** (Sales/Floor/Team/Finance/
Emergency — jaisa Manhar demo mein dikhta tha), organizer login sirf ek GATE hai,
unka apna "My Events" (create/publish/share jo Track 4 ne banaya) usi rich
sidebar ke ANDAR ek section ban jaye. Scanner (:3002) ka poora purana loop
bilkul touch nahi karna. (Decision log: Option C, PROGRESS.md mein note karo.)

## CURRENT STATE (verify karke kaam karo — `git diff` pehle dekho)
- `apps/dashboard/src/app/(dashboard)/layout.tsx:25` — session jiska `tenantId !== TENANT_ID`
  hai woh `OrgShell` mein jata hai (chhota). Yeh hi galt thin — isko do.
- `apps/dashboard/src/app/(dashboard)/dashboard/page.tsx:33` — non-manhar → `OrgHome`
  (dusra chhota). Isko MANHAR built-in pe.
- `apps/dashboard/src/components/org/org-shell.tsx` — 3-tab shell. Hatao.
- `apps/dashboard/src/components/org/` — org-home, org-create-event, org-settings,
  share-event-dialog. Inme se `org-home` siddh hat sakta hai, baaki `My Events` section ke
  liye reuse karoge.
- `apps/dashboard/src/components/dashboard/sidebar.tsx` + `nav-items.ts` — NAV array se
  nav banta hai. "My Events" section yahan add hoga.
- Event creation split (events/new/page.tsx) — **yeh split original DIN: manhar → full
  `EventWizard`, non-manhar → `OrgCreateEvent` (server, open-ground, shared store).
  YE SPILIT MAT TODNA — kyunki isi se organizer ka event web par LIVE jata hai.**
- Settings split (settings/page.tsx) — ManharSettings vs OrgSettings — yeh bhi rahega.

## CHANGES (surgical, bilkul yahi scope)

### 1. layout.tsx
- OrgShell branch HATAO. Layout ab hamesha rich Sidebar + MobileNav + HydrationGate wala
  hi rahe. (Login gate ab bhi page level par hai — dashboard/page.tsx.)
- `org-shell.tsx` delete karo, imports saaf karo.

### 2. dashboard/page.tsx (home)
- `session.tenantId === TENANT_ID` wala check HATAO — **koi bhi logged-in session →
  `<ManharOverview />`** (ek hi home = purana rich demo). No-session →
  `:3003/en/login` redirect agar `?demo=manhar` nahi (yeh waali command exactly wahi rahe).
- `OrgHome` ka use hatao; component delete.

### 3. Sidebar: naya "My Events" section + Logout
- NAV mein naya top-level section **"My Events"** (Dashboard icon) + children:
  - **"My Events"** → `/dashboard/my-events` — organizer ka server-backed event list
    (`getMyDashboardAction`/`listEventsForTenant` se): har event pe status (publish/unpublish)
    + Share button (`share-event-dialog`: public link `:3000/en/e/<slug>`, QR, WhatsApp).
    Empty state: "Create your first event" → `/dashboard/events/new`.
  - **"Create Event"** → same `/dashboard/events/new` page (existing gating ke saath).
- **Logout** — rich sidebar ka internal-ops wala sabse neeche wala section (footer) hoga —
  uske paas ek **"Log out"** item add karo agarsession hai (`logoutOrgAction` → cookie delete
  → `:3003/en/login` redirect). Session array ko UI tak pahunchane ke liye layout se
  prop bhejo ya cookie check. Sidebar mein ab logout ka koi rasta nahi hai — yeh missing hai.
- `isSectionActive`/`openGroupFor` ke saath active state test karo (`/dashboard/my-events`).

### 4. settings + events/new
- Dono pages ki existing tenant-split EXACT wahi rahe (manhar → rich, non-manhar → org).
  Kuch mat bacho, regressions mat lao.

### 5. Scanner (:3002) — TOUCH NAHI KARNA
- `apps/scanner` mein kuch mat badlo. Team/gate-staff page web (manhar) waisa hi.
- Verify: seeded manhar event ka scan loop purane jaise chalta hai.
- Organizer events ke liye gate-staff invite is hafte OUT OF SCOPE hai —
  PROGRESS.md ke decision log mein honest note daalo (karma real DB phase).

## ✅ ACCEPTANCE (har ek pe PROOF)
A1. Koi bhi approved organizer login → `:3001/dashboard` = WOHI rich Sidebar dashboard
   (Sales/Floor/Team/Finance/Emergency visible) — teen-tab wali shell kabhi nahi.
A2. No session: `/dashboard` → `:3003/en/login` redirect; `?demo=manhar` bina login demo.
A3. Sidebar mein "My Events" section: list + publish/unpublish + Share (link/QR/WhatsApp).
A4. Organizer ka event publish → `:3000/en/e/<slug>` web par LIVE (shared store proof).
A5. Scanner seeded-event loop bilkul unchanged acha from Track 4 se (proof: verify kaarn,
   pass scan, wrong-night same).
A6. Sidebar se Logout kaam karta hai → cookie chali gayi → redirect login.
A7. `OrgShell`/`OrgHome` dead code hataya; `pnpm lint && pnpm typecheck && pnpm build`
   green (4 apps); PROGRESS.md + decision log (Option C) update.

## ⛔ OUT OF SCOPE (is follow-up mein mat chhedo)
- Rich pages ko per-organizer data se tenant-scope karna (Sales/Team for их events) — real DB phase.
- `zone_id` nullable change (Approach A, UI-level wala — woh alag pair weather).
- Organizer events ke liye gate-staff/Scanner-Handoff build — honest label, baad mein.
- Koi nayi dependency, koi i18n chhut (naye labels en/gu/hi), paise integer rule — sab rule.

Aakhri check: *Ek naya organizer login kare aur dekhe — puraana rich dashboard mila,
saath mein uska apna My Events section. Chhota shell kahin nahi. Scanner se kahaan bhi nahi.*
Agar haan — khatam, shubh labh. 🪔