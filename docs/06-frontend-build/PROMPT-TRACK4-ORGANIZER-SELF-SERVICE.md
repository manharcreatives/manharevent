# 🪔 ManharEvent — Track 4: Organizer Self-Service (demo lifecycle)

Tum wahi adi devta ho — 25 saal ka senior full-stack dev+architect+QA.
Ye mera product hai, client ko dusha dikhani hai is hafte. Sab kuch soch ke karo.
Token bachao, surgical raho, har certainty pe PROOF do. Quality pe compromise nahi.

## 📂 Context (pehle yeh chhodo)
- Monorepo: `apps/web` (:3000), `apps/dashboard` (:3001), `apps/scanner` (:3002),
  `apps/marketing` (:3003). Packages: `@manhar-garba/domain`, `@manhar-garba/mock-data`,
  `@manhar-garba/ui`, `@manhar-garba/i18n`.
- `docs/PROGRESS.md`, `PLATFORM-REVIEW-2026-09-14.md`,
  `docs/06-frontend-build/PROMPT-WEEK1-TRACK-1-2-3.md` — wahi HARD RULES + TOKEN
  DISCIPLINE follow karo. Track 1 (demo bugs) shayad pehle se ho chuka hai — poore
  `pnpm lint` se shuru karo aur confirm karo build green.
- Abhi 4 apps = 4 alag Node processes = alag in-memory stores
  (`packages/mock-data/src/repo.ts:45-47`, pinned to globalThis per process).
  Isliye register→approve→login→event-live kuch cross-app connect nahi hota.
  Ye Track isi ko mock level par jodta hai.

## 🎯 Goal
Ek organizer :3003 par register kare → :3001 par approve hote hi "provisioned" →
:3003 par login (phone+demo OTP) → `http://localhost:3001/dashboard` par USKA APNA
dashboard ho (brand, My Events, Create Event, Share) → event publish kare →
`http://localhost:3000/en/e/<slug>` par turant LIVE → QR/WhatsApp share →
buy flow → scanner verify. Saara loop abhi mock mein, ek haftay ke client demo ke liye.

## 📐 HARD RULES
- Money ka integer paise hai. Kabhi float nahi.
- Har naya user-visible string → `packages/i18n` en/gu/hi.
- Koi nayi dependency nahi.
- `packages/mock-data` ka har existing repo function ka **API bilkul same rehna chahiye**
  (swap-to-real-DB ur mercical rehna hai). Internal storage hi badlegi.
- Har acceptance criterion ka PROOF (file+line+command output).

---

## PHASE 1 — Foundation: shared store + server mutations (`packages/mock-data`)

### 1.1 Shared file-backed store
- `createStore()` (repo.ts:67) ab `.data/store.json` se initialize kare
  (`packages/mock-data/.data/` — .gitignore mein add). Pehli baar file nahi to
  fixtures se seed karo aur file likho.
- Har mutation ke baad atomic write: temp file + rename. Ek simple in-process
  write-lock (queue) taaki concurrent writes corrupt na hon.
- **Cross-process sync:** har repo call par `store.json` ka mtime/updatedAt check —
  file nayi hai to memory snapshot reload. (Isi trick se 4 apps ek data dekhne lagenge.)
- Har process apne memory cache rakhega par file se live rehna chahiye.
  Har mutation JSON mein poora state serialize kare (saare arrays: orders, passes,
  payouts, checkIns, tenantApplications, events, zones, nights, passTypes, priceTiers, addons, refunds, etc.).
- Proof: 2 processes chalao, ek mein mutation, dusra usse turant dekhe.

### 1.2 Event server mutations (naye, API add karna)
- `listEventsForTenant(tenantId)` → Event[]
- `createEventForTenant(tenantId, draft)` → Event
  (minimal open-ground-friendly shape: title, slug, location/city, totalCapacity,
   nights count + start date, 1 general zone, gates 1-2, simple passTypes +
   priceTiers in paise; koi addons/wallet/parking nahi default)
- `updateEventStatus(eventId, status: 'draft'|'published')`
- `getEventBySlug`, `listPublishedEvents` pehle se hain — ab shared store se padhenge.
- Slug uniqueness enforce karo (existing events se clash → suffix).
- Proof: `createEventForTenant` → `getEventBySlug` web wale side se bhi dikhta hai.

### 1.3 Approve = provision (ADM-16 fix)
- `approveApplication` (repo.ts:602) ab status flip ke SAATH `Tenant` row bhi
  banaye (id `t-<slug>`, name=orgName, slug=desiredDomain, status active) + ek
  `tenant_branding` stub. Login mapping isi tenant se hogi.
- Proof: approve ke baad `getTenantBySlug(desiredDomain)` non-null.

## PHASE 2 — Login + "apna dashboard"

### 2.1 Login (`apps/marketing`)
- Naya route `/[locale]/login`: Step 1 phone → Step 2 verify (demo OTP, page par
  "Demo code: 123456" dikhao) → success.
- Server actions: `requestLoginOtpAction(phone)`, `verifyLoginOtpAction(phone, code)`,
  `getSessionAction()`, `logoutAction()`.
- Phone → `listApplicationsByPhone(phone)` se saala organize ka **approved** tenant
  dhundo. Approved nahi → clear message ("Application under review / register karo").
- Verify karte hi HMAC-signed cookie `manhar_org_session` (tenantId + orgSlug +
  expiry; HMAC util `packages/domain/src/logic/gate-access.ts` ka signing se re-use
  karo, base32 QR wala nahi). Cookie httpOnly, `Secure` off (development).
- Yeh demo-level auth hai — real auth provider (P-03) bahar hai. Comment laga do.

### 2.2 Dashboard session-aware (`apps/dashboard`)
- Dashboard server layer cookie padhe → tenant resolve kare.
- **Logged out:** `localhost:3001/dashboard` → `:3003/login` redirect, saath ek
  "View demo (Manhar) instead" button → `?demo=manhar` seeded demo view.
- **Logged in:** `/dashboard` wahi URL — USKE tenant ka shell: brand naam/logo,
  tabs: My Events | Create Event | Settings. Pehli baar organizer: empty state +
  "Create your first event" CTA.
- Seeded Manhar event + admin screens (Sales, Floor, Emergency, Admin) manhar
  tenant par hi rahenge (demo). Naye organizer ke event sirf uske apne section mein.
- Client-only zustand creator (`dashboard-store.ts:659` `createEvent`) ko server
  action wale path se replace karo — wizard save ab `createEventForTenant` + images
  optional. (Dashboard full editor ki baaki things client-side continue rahen.)
- Proof: 2 alag organizers login → alag "My Events" milte hain.

## PHASE 3 — Share + marketing

### 3.1 Share sheet (dashboard, per event)
- Naye organizer apne event pe "Share" kholta hai:
  - **Public link:** `http://localhost:3000/en/e/<slug>` (copy button)
  - **QR:** scanner wali QR lib reuse (`apps/scanner` se) — downloadable PNG
  - **WhatsApp/Telegram text** pre-filled: event naam, city, dates, link
  - **Honesty label:** subdomain `*.manharevent.com` production/backend phase mein;
    local demo yehi localhost link hai — fake claim nahi.
- Proof: QR scan → web page khulay.

### 3.2 Provisioned hand-off (`apps/marketing/.../register/provisioned/page.tsx`)
- Dashboard card ab seedha **"Login to your dashboard"** (front pe :3003/login,
  phone prefilled) — pura URL hata kar. Web/scanner cards wahi.

### 3.3 Register/status live-refresh
- Approve hone par (shared file se) status page "approved" dikhaye — refresh ya
  polling. Click tabloid ghoom jaye provisioned page.

## PHASE 4 — Verification (sab PROOF ke saath)
E2E demo script (har step command + output + file refs):
1. :3003 register new org → status under_review
2. :3001/admin/tenants whi submit visible → Approve & provision
3. :3003 status flips approved → provisioned page → "Login to your dashboard"
4. :3003 login (demo OTP) → dashboard :3001 open → USKA apna dashboard
5. Create Event (open-ground, ₹ prices paise mein) → publish
6. :3000/en/e/<slug> LIVE (pass cards, buy flow end-to-end)
7. Share sheet → QR/WhatsApp link
8. Scanner verify night + wrong-night
9. `pnpm lint && pnpm typecheck && pnpm build` green (4 apps)
10. `docs/PROGRESS.md` + decision-log update

## ✅ ACCEPTANCE
A1. Cross-app sync: register→approve→status flip→login ahwa saatha jude (koi bhi
    dono apps restart ke baad bhi data bandha ho).
A2. Login sirf approved organizer ke liye; baaki ko "under review" message.
A3. `/dashboard` session-aware: logged-out → redirect+demo button; logged-in →
    apna shell.
A4. Event create→publish→web `:3000/en/e/<slug>` live (proof).
A5. Share sheet (link+QR+WhatsApp) kaam karta hai.
A6. Seeded Manhar demo screens intact (demo mode).
A7. repo.ts ke purane functions ka API unchanged (no breaking change).
A8. Build green + PROGRESS.md updated.

## ⛔ OUT OF SCOPE
- Real OTP/auth provider, custom domains/DNS, email, payments, multi-org billing.
- Puri admin screens (Sales/Floor/Emergency) ko har tenant ke liye full scoping —
  in hafte sirf My Events + Create + Share per-organizer.
- Open-ground feature UI (woh agli Track doge) — bas event-creation wahi basis.
- `zone_id` nullable domain change (approach A, UI-level) — is Track mein nahi.

Aakhri check: *Client ke saamne poora register→approve→login→banao→live→share→scan
loop ek hi baar mein chal jaye, har screen pe koi jhootha "Yet to build" nahi.*
Agar haan — khatam. Shubh labh. 🪔