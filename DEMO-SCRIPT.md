# Demo script — ManharEvent

The click path to show a client, in order, with what to say. About 12 minutes.

## Before they arrive

```bash
pnpm install
pnpm verify:demo     # 18 checks. If any fail, the demo is broken — fix first.
pnpm dev             # all four apps
```

Open four browser tabs, in this order, and leave them open:

| Tab | URL | Who it is |
|---|---|---|
| 1 | http://localhost:3003 | **ManharEvent** — what an organizer sees before signing up |
| 2 | http://localhost:3001/dashboard | **The organizer's** admin panel |
| 3 | http://localhost:3000/en | **The attendee's** booking site |
| 4 | http://localhost:3002 | **The gate scanner** |

Use a phone, or a second browser window, for tab 4 if you can — scanning tab 3's
screen with a real phone camera is the moment that sells this.

> **Reset:** the data lives in memory and in browser localStorage. To start clean:
> restart `pnpm dev`, and clear site data for localhost:3000–3003. Do this between
> client meetings so nobody sees the last demo's edits.

---

## 1 · "How does an organizer get on board?" (2 min)

**Tab 1 — localhost:3003**

- Land on the home page. This is ManharEvent selling to organizers — not a
  consumer marketplace. Every organizer gets *their own* site, *their own* admin
  panel, and *their own* gate scanner.
- Go to **Pricing**. Point at the worked example on a ₹1,000 pass:

  > "Two line items. Our platform fee, and Razorpay's gateway fee. Separately,
  > always, to you and to your buyers. Nobody bundles a mystery 'convenience fee'
  > on this platform — including us."

- Click **Register your event** → phone → OTP → organization details → status.
  Stop at the status screen. Say: *"Now Manhar Creatives reviews it."*

## 2 · "Who approves it?" (1 min)

**Tab 2 — localhost:3001/admin**

- The platform overview: every organizer, live sales, passes issued, check-ins.
- **Tenants** → open a pending registration → **Approve & provision**.

  > "That's the organizer live. Their site, their panel, their scanner."

## 3 · "What can the organizer actually do?" (3 min)

**Tab 2 — localhost:3001/dashboard**

Don't tour every screen. Show these four, in this order:

1. **Events → Manhar Navratri 2026 → Pass types.**

   > "This is the part no generic ticketing platform gets right. Garba doesn't
   > sell seats — it sells *nights* for *people*. A Season Couple pass is nine
   > nights, admits two, Gold zone, one QR. Concert platforms make you fake that
   > with four separate ticket types."

   Click **Add pass type** → pick the *Season · Couple* preset → show the night
   selector → save. Then open **Price tiers** on any pass and add an
   "Early Bird" at a lower price.

2. **Events → Nights.** Edit a night — theme, dress code, colour, gate times.
   Open **Lineup** and add an artist. Say that this is what the public page shows.

3. **Team.** Add a gate-staff member with their mobile number, then **Issue
   scanner access**.

   > "That code, and *only* that number, opens the scanner. A guard can't sign
   > themselves up, can't use someone else's code, and you can revoke them from
   > here mid-event."

   Copy the code for **Ramesh Patel** — you need it in step 5.

4. **Events → Publish.** Copy the public link, show the QR, click **Download QR
   for print**.

   > "That QR goes on your posters. It's the same link you drop in WhatsApp."

## 4 · "What does a buyer see?" (3 min)

**Tab 3 — localhost:3000/en**

- Home: the organizer's own branding, the dates, the venue, the zones with real
  prices, the nine nights. One obvious button.
- **Book Passes** → pick a zone → pick a pass type. Pause on the pass name:

  > "Admits 2, all nine nights. One pass, one QR, two people. That's how Garba
  > actually works."

- Choose a quantity, add parking, go to checkout. Point at the fee breakdown:

  > "Same two lines you saw on the pricing page. The number we quote the
  > organizer and the number the buyer pays come from one function in the
  > codebase — they can't drift apart."

- Sign in with **9876543001** (any OTP), pay, land on the confirmation.
- Go to **My Passes**. This account already holds three passes from earlier in
  the season, plus the one you just bought.
- **Open `MG26-7F3K-9021`** — the Season Solo Gold pass. **This is a real QR**,
  and it's the one to scan in the next step.

  > Why that one and not the pass you just bought: the four apps don't share a
  > database yet, so the gate scanner's cached manifest doesn't know about a
  > pass created seconds ago in another process. Say so if it comes up — it's a
  > wiring gap, not a design one, and it closes when the database lands.

## 5 · The moment (2 min)

**Tab 4 — localhost:3002**

- The scanner asks to sign in. Enter **9825011001** and the code you copied in
  step 3.

  > "Gate staff, on the number the organizer added. Nothing else gets in."

- Their name and gate show at the top of the scanner.
- Point the phone at the `MG26-7F3K-9021` QR from step 4. **Green — ADMITTED.**
- Scan the same pass again. **Amber — ALREADY INSIDE.**

  > "Nine nights, one pass, unlimited re-entry per night — but the same pass
  > can't walk two people in on one admit."

- Flip the status bar to **Offline** and scan again. It still works.

  > "The venue's wifi will die at some point on night four. The gate doesn't
  > stop. Scans queue on the phone and sync when the network comes back."

## 6 · "What if something goes wrong?" (1 min)

**Tab 2 — localhost:3001/admin/emergency**

> "A guard's phone gets stolen at 10pm on night four. Here's what we do."

- **Revoke all scanners** — show that it demands you type `REVOKE ALL` *and*
  write down why.

  > "Every one of these is logged: who, when, and the reason. Not because we
  > don't trust you — because the next morning somebody will ask what happened."

- Scroll to the audit trail. Cancel out without confirming, or confirm it and
  re-issue from the Team page if you want to show the whole loop.

---

## What to say if they ask

**"Is this real or a mockup?"**
Every screen is a working application. The data is in memory instead of a
database — that's the last step, and it's mapped out file by file in
`docs/06-frontend-build/HANDOFF-TO-BACKEND.md`.

**"Can it handle our numbers?"**
The demo event is 25,000 capacity across three zones and four gates, nine nights.
The gate scanner validates offline against a cached manifest, so scan speed
doesn't depend on the venue's network.

**"What about our own branding / domain?"**
Settings → Branding and Settings → Domain. Each organizer runs on their own
domain with their own colours and logo.

**"Gujarati?"**
Switch the language in the header. Gujarati, Hindi, English, everywhere.

## Known limits — say these before they find them

- **Payment is simulated.** Razorpay isn't connected; the Pay button issues the
  pass directly. Everything after that point is real.
- **The four apps don't share a database yet.** Each runs its own in-memory
  copy of the mock data, so a pass bought during the demo won't appear in the
  scanner's manifest. Scan `MG26-7F3K-9021` as the script says. This disappears
  the moment the database lands.
- **Offline revocation is one sync behind.** Revoking scanner access locks the
  device out at its next sync, not instantly, because the demo verifies codes
  without a server. Real revocation is a server lookup.
