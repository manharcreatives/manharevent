# 🪔 ManharEvent — Week-1 Trophy Pass (Track 1 + 2 + 3)
**Claude, yeh tumhara call hai. Poora hero moment.**

---

## 🧬 Persona — tum ho toh banega

Tum koi aam code-writer nahi ho. Tum **wahi adi devta** ho is puraane codebase ke —
a 25-year senior who has shipped ticketing systems, payment rails, design systems,
offline-first products. Tum developer ho, designer ho, architect ho, QA ho,
product-thinker ho — sab kuch ek saath. Is duniya ka product mera hai,
aur ise **client ko dikhane layak** banana **sirf tumse** ho sakta hai.
Tumhara kaam galat ho hi nahi sakta — **achhe se soch ke karoge, wohi sahi hoga.**

Har fix soch ke lagao: *kya ek gharzadha client aaj yeh screen khol ke bolega
"yahi kaam karta haina?"* Agar nahi, toh fix adhoora hai.

---

## 🪙 TOKEN DISCIPLINE — saval ki tarah, token ki qadar karo

**Tumhara paisa hai yeh token — isse waste mat karo.** Chhote kaam ka
discipline:

1. **Pehle kap karo, phir chaku:** koi bhi fix shuru karne se pehle
   sirf wahi files + unka context padho jo is fix ke liye zaroori hain.
   Poori codebase ekbaar mein mat uthao. (Tool output bhi sirf wahi
   jo kaam aaye.)
2. **Ek kaam, ek baar:** do baar wahi file mat padho — pehli baar mein
   hi poora context le lo. Do-alag page.tsx ek saath padh lo (parallel
   read), phir ek saath edit karo.
3. **Repair-style edits, not rewrite:** bada chunk ho toh `Write` mat —
   chhota `Edit`/surgical change = kam token, kam regression risk.
   Kisi file ko baar-baar `Read` nahi — ek baar, phir edits.
4. **Unnecessary polish nahi:** "nice to have" refactor/rename/comment
   characters gaali mein — NO. Scope ka kaam hi token-stable hai.
5. **Har grep/glob ki soch:** search ka result shahar bhara na ho —
   specific pattern + include, taaki output chhota rahe.
6. **Verify efficiently:** `pnpm typecheck` se tuka type errors pakdo,
   sirf affected app ko build karo (not 4 apps har baar), fix ke baad
   hi full `pnpm build` ik baar gol.
7. **Job batake chhodo, repeat mat karo:** ek baar kiya fix dobara
   list/disccuss mat karo — aage badho.
8. **Token burn = time burn = client ka paisa.** Tumhara kaam itna hi
   hai ki jitne token is kaam ke liye systematically chahiye — usse
   ek token bhi zyada nahi.

---

## 🧠 MODEL GUIDANCE (jis bhi model mein chalao, wahi karo)

Yeh pass practical code ka hai — **Claude Sonnet (recommended)**:
cheap, fast, aur is tarah ke surgical bug-fix/i18n kaam ke liye best
balance. Opus sirf tab jab koi 1-2 ultra-tricky architectural piece
(raw.) feedback do — khud decide karna, har cheez par Opus slog mat karo.
Haiku = sirf text-summarization ke liye, code par nahi. Agar Sonnet
kisi fix mein atak jaye, tabhi Opus recommend karo.

---

## 🎯 Mission

ManharEvent ek Garba/navratri ticketing SaaS hai — 4 Next.js apps +
shared packages, sab **in-memory mock data** par. Frontend 100% bana hai.
**Backend abhi nahi hai** (no DB, no auth, no payments) — aur yeh is hafte ki
chinta NAHI hai.

**Is hafte ka target ek hai:** POORA DEMO, har screen par, SAHI kaam kare +
KOI JHOOTHA CLAIM na dikhe — client ko confidently dikhane layak + ek chhoti
rehearsal bhi ho sake. Saath mein architecture aisi rakhna ki real DB
(Supabase/SQLite) baad mein **swap** ho sake bina UI ko haath lagaye.

---

## 📐 HARD RULES (yeh mera dharma hai, ise follow karna hi aana hai)

1. **Money = integer paise.** Kabhi float nahi, kabhi `number` for currency.
2. **Har user-visible string = translated.** Koi bhi naya/hardcoded string
   `packages/i18n` ke en/gu/hi mein — teenon puri. Bina translate ke code
   complete nahi hota.
3. **Mock-data ko ORR-todo mat todo:** dema `packages/mock-data` hi hamari
   "local db" hai. Rule: client components (`"use client"`) **directly
   mock-data/nova import nahi karte** — sab data ok abort server actions /
   server components ke peeche. Is samay aur import (client→mock-data)
   **badhane** ki nahi, **khatam karne** ki disha uthao.
4. **Koi nayi dependency/library mat jodo.** Stack locked hai.
5. **Verified ke bina tick nahi.** Har acceptance criterion purposeful
   evidence kyun/demonstrate karna hai, "ho gaya hoga" nahi.
6. **Doc drift mat chhodo:** jo docs jhoothi/up-to-date nahi (yeh file list
   karegi), unhe isi pass mein fix karo.
7. **Build har haal GREEN:** `pnpm lint && pnpm typecheck && pnpm build`
   must pass. `pnpm verify:demo` + `pnpm smoke` bhi green rahna chahiye.
8. **Bina permission ke koi extra feature mat ghusa do.** Scope kya hai
   woh niche likha hai. Scope ke bahar = touch nahi.
9. Har session end par `docs/PROGRESS.md` update karo (status, notes,
   decision log) — repo ka rule hai.

---

## 🏗️ CONTEXT FIELDS (bina yeh padhe kuch mut karo)

- Monorepo: Turborepo + pnpm. Apps: web(:3000), dashboard(:3001),
  scanner(:3002), marketing(:3003).
- Packages: `@manhar-garba/domain` (logic/entities), `@manhar-garba/mock-data`
  (repo.ts = local db), `@manhar-garba/ui`, `@manhar-garba/i18n`,
  `@manhar-garba/config`.
- Source of truth docs: `docs/PROGRESS.md`, `docs/00-START-HERE.md`,
  `PLATFORM-REVIEW-2026-09-14.md` (isi se yeh tasks aaye hain).
- Pehle khud TRACK 1 ke files kholo, reviews padho, samjho — phir khud
  decide karo kaunsa fix kis order mein.

---

# ⚙️ TRACK 1 — DEMO KO SAHI KARO (bugs jo client ko dikhte hain)

Har fix ek sub-task hai. Har sub-task ke liye: sho karro → deytheasto → proof.

### 1.1 Pass detail + Orders pages broken (abhi 404/blank)
- `apps/web/src/app/[locale]/me/passes/[passId]/page.tsx` — client component
  browser mein `getPass()` call karta hai (fresh fixture copy = naya pass milta
  nahi). **Server component / server action** banao; ownership check
  (`me` routes sirf session ke phone ke data). Populate usi tarah jaise
  `/me/passes` ka server action karta hai.
- `apps/web/src/app/[locale]/me/orders/page.tsx` — same pattern with
  `listOrdersByPhone`; server-side render.
- JSON bundling check: client bundles mein ab mock-data (gate-staff roster,
  passes) nahi aana chahiye — `npx next build` ya bundle-scan se prove karo.
- **Proof:** naye order ke pass/order ka URL turant kaam kare, 404 na ho.

### 1.2 Checkout: same order do baar pay ho sakta hai (USR-04)
- `checkout/[orderId]/page.tsx` + `repo.completeMockOrder` — paid order dobara
  pay karne par aur passes ban jate hain. Paid order → status page redirect
  karo. Confirmation **idempotent** ho (`provider_payment_id` pe unique).
- **Proof:** pay → pay again → same pass count, no duplicate.

### 1.3 Status page hamesha "Payment successful!" bolta hai (USR-08)
- `order-status-client.tsx` + `status/page.tsx` — real order status render
  karo: `paid / pending / failed / expired / draft`. Unpaid order par "success"
  kabhi nahi. Pending/failed ke liye honest copy + wapas pay ka rasta.
- Naye strings → i18n.

### 1.4 Buyer phone khaali hai (USR-05)
- Order `buyerPhone: phone ?? ""` se banti hai, checkout wala phone order par
  likha hi nahi jaata → pass "My Passes" mein aur refund dono bina phone ke
  fail. **Pay time par server session ka verified phone/name order par set
  karo.** Phone ke bina pay button na khule.
- **Proof:** naya buyer pay kare → order.buyerPhone present → pass `/me/passes`
  mein dikhe.

### 1.5 Add-ons quote mein hain par charge nahi (USR-06)
- Book mein addonsTotal dikhta hai (`book-client.tsx:133`), checkout sirf
  `pricePaise×qty` (`checkout-client.tsx:37`), order items `addon_id: null`
  (`repo.ts:322-335`). Ye jhooth hai.
- **Fix (choose by judgement):** (a) add-ons ko end-to-end wire karo
  (cart → order items → total → pass) YA (b) un add-ons ko sale se nikaalo
  jo deliver nahi hote. Jo rahega woh **fully charged & itemized** hoga.
- **Proof:** checkout total === order items ka sum, addon lines visible.

### 1.6 Holder ka naam hardcoded "Guest", asal mein "" (USR-21)
- `[passId]/page.tsx` holderName hardcoded; `order-status-client.tsx`
  `buyer_name ?? "Guest"` where buyer_name="" hota hai. `pass_holders` / buyer
  name se asli naam dikhao; blank ho toh qualified fallback ("Guest" sirf
  tab jab sach mein guest pass ho).
- Pass par naam hona zaroori — gate par match ho paye.

### 1.7 "From ₹X" price galat (USR-11, HOME-31, USR-12)
- Event page / zone cards / sticky bar lowest tier use karte hain **incl.
  expired/sold-out/early-bird**. `lib/pricing.ts` ke `eventFromPricePaise()`
  / `currentPricePaise()` / `zoneFromPricePaise()` use kar ke sirf on-sale
  price dikhao. Home ka "from ₹X" nahi, jo abhi bechte ho wahi.
- **Proof:** expired tier close kar → page price badal jaye; booking price
  se match.

### 1.8 Single-night pass: night picker (USR-31 — P0 part)
- Single-night/weekend passes abhi night-5 se hardcoded hain
  (`scanner/lib/validate.ts:244`, `pass-types.ts:205`, `night/[n]/page.tsx`).
  Booking par night picker add karo jo `night_ids` choose kare, aur
  cart/order/pass/qr mein wahi night reflected ho. (Upgrades/add-nights,
  seedhi, P0 nahi — abhi mat.)
- **Proof:** User night 3 chune → uska QR n-3 valid, n-5 par "wrong night".

### 1.9 Refund quote galat night se (USR-27)
- `repo.ts:645-654` event ke first night se measure karta hai, legal page
  "first night the pass covers" bolta hai. `min(pass.night_ids)` se compute
  karo, event ka saved policy use karo. Dono jagah same answer.
- **Proof:** weekend pass (nights 6-9) = nights 6 se measured.

### 1.10 Support number mismatch (USR-32, HOME-11)
- `trust-strip.tsx:15`, `me/refunds/page.tsx:194` = `919876500000`; tenant
  fixture = `+919876543210`; marketing thoda alag. **Ek real number ek hi
  jagah** (config/env + tenant fixture) aur sab jagah wahi. Jab tak aapka
  real number nahi hai, ek hi dummy number use karo JO KHUD MATCH KARE —
  aur usi ko `packages/i18n`/fixtures mein data-consistent banao.

### 1.11 Oversell protection (ADM-42)
- `events/[id]/passes/page.tsx:302-306` sirf `qty >= 1` check karta hai.
  **qty < sold/active + commitments** hone par block karo; `Σ(qty×admits)` vs
  zone capacity per night par warning dikhao. Ye UI-level guard hai
  (real lock database phase mein aayega — woh comment likhna mat bhoolo).

### 1.12 Scanner: night hardcoded 'night-05' (USR-52)
- `scanner/lib/db.ts:126-127`, `manifest.ts:5` — month/day se active night
  derive karo (event schedule, IST), ya clear manual selector jo galat night
  ke "NOT VALID TONIGHT" ko dawa se handle kare. Demo ki parkhi bhi set kar do.
- **Proof:** date change → active night change; night-specific pass sahi
  verdict de.

### 1.13 Scanner: O(n) full-manifest scan per scan (ARCH-12 / P3-4)
- `scanner/lib/checkin.ts` har scan par `loadManifest()` + linear search.
  Manifest load par **in-memory `Map<pass_id, entry>`** banao, scan path
  O(1) lookup. 50k entries pe bhi <500ms ki guarantee demo mein gaye.
  (Manifest v2 = real DB phase — comment mark karo.)

### 1.14 Team removal → scanner credential revoke (ADM-09)
- `dashboard-store.removeTeamMember` person hata deta hai par credential
  chhodta hai. Removal par `revokeScannerCredential` call + confirm dialog
  (`team/page.tsx:196-197`).

### 1.15 "Continue to Pay" silent failure (USR-14)
- `book-client.tsx:158-171` try/finally bina catch. Error → toast + retry
  button. i18n keys.

---

# 🧹 TRACK 2 — HONESTY (koi jhootha claim nahi)

Yeh track sabse important hai: client sehne se pehle har jhooth hatana.
Har relabel ke saath uski translation (en/gu/hi).

### 2.1 Payouts "Paid to you" → "Projected" (ADM-29)
- `finance/payouts/page.tsx` + `lib/payouts.ts` — jab tak real UTR/transfer
  nahi hai, har tranche par saaf bada text: **"Projected"**, koi bhi
  "settled/paid" nahi. `metrics.ts` ka admission note bhi bhar do.
- Aakhri nikli cheez: kabhi bhi aisa number na dikho jo bank mein gaya
  hi nahi.

### 2.2 Razorpay "Verified" fake badge → real state (ADM-32, P0-1)
- `settings/payments/page.tsx:29-37,107` — hardcoded "Verified" + fake
  `rzp_live_••••` + hardcoded GSTIN. **Demo-mode label + agar achar ho toh
  empty state** "Razorpay connected nahi hai (demo)". Kabhi "Verified"
  tab jab real verification ho.

### 2.3 WhatsApp/SMS delivery ka jhooth (USR-16, P0-1)
- "Pass also sent on WhatsApp and SMS" (`Status.whatsappNote`,
  `Checkout.whatsappDelivery`, `order-status-client.tsx:33-36`) — asal
  delivery nahi hai. Copy badal: "Pass download karo / My Passes mein milega"
  + QR download. Jab WhatsApp real hoga tab claim wapas.

### 2.4 Emergency controls "simulated" (ADM-13, P0-1, P0-3)
- `emergency/page.tsx:75-76` — "takes effect immediately" jhooth hai (flags
  sirf dashboard ke localStorage mein hain). **Saaf banner: "DEMO/SIMULATED —
  only this browser. Real system mein emergency flags DB se chalenge."**
  (Real cross-app wiring = backend phase, CODE MAT LIKHO abhi.)

### 2.5 "Internal ops" link organizer nav se (ADM-03, P0-3)
- `sidebar.tsx:173-181` + `mobile-nav.tsx:121-129` — lobby organizer ko
  `/admin` + kill-switches dikhata hai. **Remove karo.** (Real role-based
  internal ops = auth phase.)

### 2.6 TDS 1% → 0.1% (F2, ADM-33, P0-4)
- `apps/dashboard/src/lib/payouts.ts:18` — `TDS_194O_BPS=100` → **10**,
  with comment "0.1% since Oct 2024 (was 1%) — CA db bhi final karna hai".
  Payout math mein reflected ho. Docs bhi fix.

### 2.7 Fee numbers: ek hi source (P0-2, HOME-03/04/06, ADM-20/27)
- Code `fees.ts: PLATFORM 1% / GATEWAY 2%`, docs 2%, fixture 2.5% —
  **teen numbers, ek sach.** Decide ONE default (recommend platform 1.5%
  + ₹5/pass, gateway 2% — ya code ke paas jo hai wahi, bas wo consistent
  ho jaye teeno jagah) aur fixture/docs/code sab wahi.
- Fees ko order par **alag columns** mein store karo
  (`platform_fee_paise`, `gateway_fee_paise`, `gst_...`), merged
  `convenience_fee_paise` nahi. Naye orders se hi.
- **GST ≤ ₹500 admission exemption** flag add karo (rating 12/2017) —
  ₹500 se kam pass par GST na lagao. (Yeh demo assumption hai; CA final
  rates fix karega.)
- `pricing` page par honest note: "Demo mein use kiye gaye tax rates,
  go-live se pehle CA se confirm honge."

### 2.8 Wallet/Parking add-ons: paisa liya, kuch nahi mila (USR-29/30, P0-6)
- Wallet ₹500 add-on "Top up at checkout" ka — ledger/topup/vendor scan kuch
  nahi. Parking add-on bhi QR nahi deta. **Inhe sale se hatao** (pass-type
  fixtures se on-sale hatao + UI se filter) jab tak asal mein ban
  na jaaye. Wallet page par honest empty state rehne de.

### 2.9 Live dashboard: fake scans mental (ADM-47, P1)
- `dashboard-store.ts:456,1243-1266` + `checkin-feed.tsx:54-60` — simulation
  by default ON. **OFF by default** + "Simulated (demo)" badge. Real
  check-in export mein kabhi fake scan nahi.

### 2.10 Hero QR = asli admissible pass payload (HOME-32)
- Marketing hero ka QR ek seeded adhura pass hai — production mein valid
  entry hota. **Clearly fake non-admissible sample payload** banao
  (comment: demo only).

### 2.11 Web/Home: above-the-fold importance (HOME-01/02/25/27, P5-1)
- `[locale]/page.tsx:165-166` + `hero-night-wheel.tsx:57` — mobile par wheel
  `order-first` upar hai, CTA neeche. **Mobile par CTA (Book Passes) + H1 +
  dates pehle**, wheel neeche. Home par sticky bottom Book bar
  (`StickyBookBar`). Hero H1 = event.title + organizer. Zone cards → `/book?zone=` deep link with preselection.

---

# 🌍 TRACK 3 — I18n SWEEP (har screen, teeno bhasha)

### 3.1 Attendee files — English ka thela (USR-39)
Niche list mein `useTranslations`/`getTranslations` **nahi** hai — abhi
English literal hai:
- `artist/[artistSlug]/page.tsx` · `e/[slug]/faq` · `e/[slug]/gallery` ·
  `e/[slug]/night/[n]` · `e/[slug]/venue` · `me/refunds/page.tsx` ·
  error pages (`error.tsx`, `not-found.tsx`, `global-error.tsx`)
- Partial: `checkout-client.tsx` + `order-status-client.tsx` (remaining
  literals).
- Sab `packages/i18n` ke en/gu/hi mein, sab namespace correct.
- **Sword:** `rg '>[a-zA-Z]'` nahi, dum — koi English literal bacha ho toh
  pakad ke translate karo.

### 3.2 Dates/money forced English (USR-40)
- `me/orders/page.tsx:57,62`, `me/passes/page.tsx:143` — `"en-IN"`
  hardcoded hai. Active locale se format karo (gu/hi mein source locale
  cheezein). Naya util domain/packages mein bana sakte ho — koi lib nahi.

### 3.3 me/passes tabs ARIA (USR-42)
- Plain buttons → proper ARIA tab pattern (`role="tab"`, `tablist`,
  aria-selected) + translated labels.

### 3.4 Marketing hardcoded English (HOME-33/34/35)
- `page.tsx:160,198,204,207` hero preview ("Rina & Kaushik", "Gold Zone"),
  `[locale]/not-found.tsx` (locale-aware Link bhi), hardcoded aria-labels
  (marketing-header). Sab i18n.

### 3.5 Track 1-2 ke naye/relabeled strings
- Track 1-2 mein jo bhi naya ya badla copy banaya — uski tamam
  en/gu/hi keys abhi isi pass mein. (Rule #2.)

---

# ✅ FINAL VERIFICATION (bina yeh sab ke, kaam complete nahi)

1. `pnpm lint && pnpm typecheck && pnpm build` — 4/4 apps green.
2. `pnpm verify:demo` — jo pehle pass tha woh pass, kuch kharab nahi hua.
3. `pnpm smoke` — routes ~80, koi naya 404 nahi.
4. Manual click-through 3 journeys (audit mein): buyer loop, organizer
   register loop, gate scanner loop — sab complete + honest copy.
5. Random night/product check: from-price se booking-price match.
6. Client bundle scan: mock-data/gate-staff/secret ab client JS mein nahi.
7. `docs/PROGRESS.md` + koi bhi drift doc updated.
8. Har rejection ke peeche **evidence** — screenshot/code/path.

---

# ⛔ OUT OF SCOPE (inhe MAT chhedna)

- Real DB / SQLite migration / server data layer swap — abhi mock-data hi
  local db hai, sirf uska `interface` sahi rakhna hai.
- Real auth/OTP (Supabase/MSG91) — backend phase.
- Real Razorpay/webhook/payouts/Route.
- Tax engine ki deep correctness (CA) — sirf demo-consistency + exemption flag.
- Group share/transfer flows, wallet build, box-office POS, waiting room,
  face recognition, superadmin console.
- Naye UI features jo upar list nahi hain.

---

**Aakhri baat:** Har fix ke baad khud se poochho —
*"Kya main is demo screen ko apne apne client ko, apni khud ki company ke
naam par, confidently dikha sakta hoon?"*
Jab har screen ka jawab HAAN hai — tabhi matlab kaam ho gaya. Jai ho. 🪔