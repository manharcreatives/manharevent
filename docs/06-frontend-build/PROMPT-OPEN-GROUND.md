# 🪔 ManharEvent — Feature Pass: "Open Ground Mode" + Admin-Control Pricing

Tum wahi adi devta ho — 25 saal ka senior developer+designer+architect+QA.
Ye product mera hai, client ko dikhana hai. Achhe se soch ke karo, wohi sahi hoga.
Token bachao, replication mat karo, surgical edits karo, quality pe compromise nahi.

## 📂 Context (pehle yeh padho)
- Monorepo: `apps/web` (:3000), `apps/dashboard` (:3001), `apps/scanner` (:3002), `apps/marketing` (:3003).
  Packages: `@manhar-garba/domain`, `@manhar-garba/mock-data`, `@manhar-garba/ui`, `@manhar-garba/i18n`.
- Reference docs: `docs/PROGRESS.md`, `PLATFORM-REVIEW-2026-09-14.md`, aur
  `docs/06-frontend-build/PROMPT-WEEK1-TRACK-1-2-3.md` (wahi HARD RULES + TOKEN DISCIPLINE follow karo).
- Sab data `packages/mock-data` (in-memory local db) se aata hai. Data access hamesha
  server action / server component ke peeche; client component se direct mock-data import KABHI nahi.

## 🎯 Feature kya hai
Bade grounds pe zones (VIP/Gold/General) hoti hain, LEKIN zyada tar Garba grounds pe sirf
ek ticket hota hai — general/season. Koi zone nahi. Isliye:

1. **Open Ground mode — UI-level (Type A).** Domain/zone model KO MATLAB NAHI.
   `PassType.zone_id` required REHNE DO. Bas rule: event jisme `zones.length <= 1` ho,
   usse UI mein "open ground" treat karo — buyer ko koi zone map/cards NAHI dikhe,
   sirf passes (Season ₹2,500 / Single-night ₹300 / Couple ₹900 / ...). Book flow mein zone step skip.
2. **Admin-control pricing.** Price har jagah admin set kare, badhaye/ghataye kabhi bhi,
   aur web par TURANT reflect ho. Code mein koi hardcoded price nahi.

## 📐 HARD RULES
- Money = integer paise. Kabhi float/number nahi.
- Har naya user-visible string → `packages/i18n` en/gu/hi teenon.
- Koi nayi dependency nahi. Scope se bahar kuch nahi.
- Har acceptance criterion ka PROOF (file + line + command output).

---

## PART A — Mock-data: naya demo open-ground event

1. **`packages/mock-data/src/fixtures/event.ts`:** ek naya chhota party-plot event seed karo.
   - **Exactly 1 zone** — naam "General Ground" (zone_id required hai, isi waqt ek hi zone banao).
   - Gates: 1-2 entry gates. Nights: 5-9 nights (ya 3 nights demo ke liye — jo realistic lage).
   - `pass-types.ts` + price tiers: Season ₹2,500 · Weekend (nights 6-9) ₹1,200 ·
     Single-night ALAG passes per night (Thu ₹250, Fri ₹300, Sat ₹400) · Couple (2 admits) ₹900.
   - Koi wallet/parking add-on NAHI.
   - `event-content.ts` mein is event ke liye content (FAQ, how-to-reach, etc.)
2. `repo.ts` / `lib/pricing.ts` is naye event ke `from ₹` sahi derive kare — proof karo.

## PART B — Dashboard (admin control)

1. **Event wizard** (`apps/dashboard/src/components/dashboard/event-wizard.tsx`):
   - Layout toggle: **"Open ground (single ticket/season)"** vs **"Zoned ground"**.
   - Open ground → zones/gates/venue-map steps hide (andar se 1 general zone + gates auto).
   - Zod/validation accordingly — open-ground event mein zones multi nahi hone chahiye.
2. **Passes + price editor** (`dashboard/events/[id]/passes/page.tsx` + `dashboard-store.ts`):
   - Confirm price tier edit sahi se save hota hai (`updatePriceTier`) — warna fix/add.
   - Single-night quick-add preset (Thu/Fri/Sat alag passes) — organizer ek click pe bana sake.
   - Price edit karne par public web turant reflect — isi feature ka core proof.

## PART C — Web (buyer ko sirf passes dikho)

1. **Event page** (`apps/web/src/app/[locale]/e/[eventSlug]/page.tsx`):
   - `zones.length <= 1` → `ZoneCardsSection` ki jagah naya small **`PassCardsSection`**
     component (`listPassTypes(eventId)` se; sold-out filter + `lib/pricing.ts` ka from-price).
   - Pehla (zoned) event bilkul unchanged.
   - Home (`[locale]/page.tsx`) par naya demo event ka clearly-labelled link/card
     ("Chhota ground demo" + `("demo")` label) — honest label.
2. **Book flow** (`apps/web/src/components/book/book-client.tsx`):
   - `zones.length <= 1` → Step 1 (Zone) auto-skip; hidden zone = single zone hi.
   - Pass type list → single_night pass ke liye **night picker** (nights list se pick,
     `night_id` cart→order mein jaaye). Agar Track-1 (1.8) ka night-picker already hai to reuse.
   - Checkout/status/QR ab is event ke pass bhi poore flow se kaam kare.

## PART D — Scanner (verify only)

- Naye open-ground event ke pass scan ho → sahi night allow, galat night "wrong night".
  (Scanner ka naya code NAHI chahiye; sirf verify. Agar Track-1 (1.12) night-derive baaki hai to baad.)

---

## ✅ ACCEPTANCE (sab evidence ke saath)
A1. Naya event 1-zone hai; event page par koi zone card/map nahi — pass cards.
A2. Book flow zone step skip; single-night → night picker.
A3. Dashboard se tier price edit → web `from ₹` + checkout total turant change (proof).
A4. Per-night alag price kaam kare (Thu vs Sat pass, alag price + alag night).
A5. `apps/web` buy loop + scanner verdict naye event par end-to-end.
A6. Zoned event (pehla) bilkul pehle jaisa — zone cards + zone step intact.
A7. `pnpm lint && pnpm typecheck && pnpm build` green (4 apps), naye strings i18n full.
A8. `docs/PROGRESS.md` updated + decision-log entry.

## ⛔ OUT OF SCOPE
- Domain mein `zone_id` nullable nahi; koi DB/schema/migration nahi.
- Real auth/otp, real payments, wallet/parking add-ons, group split, box-office POS.
- Tax/fee engine deep-check — fees existing engine se chalen.
- Zoned-event behavior koi change nahi.

Aakhri check: *Kya client chhota ground open karke bolega "yeh to bilkul ground jaisa hai — sirf tickets"?*
Agar haan — khatam. Shubh labh. 🪔