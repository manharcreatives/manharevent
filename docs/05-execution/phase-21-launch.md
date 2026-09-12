# Phase 21 — Launch & Post-Launch Operations

| | |
|---|---|
| **Phase ID** | `P-21` |
| **Depends on** | `P-19` |
| **Blocks** | — |
| **Estimated effort** | Ongoing |
| **Launch blocking** | ✅ Yes |

---

## Goal

Get the first real event live without incident, run it, learn from it, and leave the platform better than the launch found it.

---

## Deliverables

1. Pre-launch checklist, signed off
2. Soft launch with a controlled event
3. Event-night operations plan
4. Post-event review
5. Ongoing improvement cadence

---

## Step-by-step

### 21.1 Pre-launch checklist
Every item requires a named owner and a date. Nothing is assumed.

**Legal & compliance**
- [ ] Terms of Service and Privacy Policy published and accurate
- [ ] Refund policy published and matching what the engine enforces
- [ ] DPDP consent flows verified
- [ ] GST registration confirmed, invoice format reviewed by an accountant
- [ ] Razorpay account fully activated for live mode

**Technical**
- [ ] Phase 18 signed off
- [ ] Phase 19 signed off, restore drill completed
- [ ] Production environment matches the parity checklist
- [ ] DNS, SSL, and custom domains live
- [ ] Load test passed at 2× expected peak
- [ ] All feature flags set to their intended launch values
- [ ] Monitoring and alerts firing to the right people

**Content**
- [ ] Event content complete in all three languages
- [ ] All images optimised and correctly sized
- [ ] FAQ covers the top 20 anticipated questions
- [ ] WhatsApp templates approved by Meta — **verify, do not assume**
- [ ] SMS DLT templates approved

**Operations**
- [ ] Gate staff trained and their devices provisioned
- [ ] Scanner devices charged, tested, and labelled
- [ ] Backup scanning devices ready
- [ ] Printed guest list per gate as the last-resort fallback
- [ ] Support WhatsApp staffed with defined hours
- [ ] On-call rotation set for every event night
- [ ] Runbooks read by everyone on call, not just written

### 21.2 Soft launch
1. Launch with **one small event first** — ideally a single-night event of 500–2,000 people, not a nine-night 20,000-capacity ground.
2. Watch everything: conversion, payment success, delivery rate, scan success, support volume.
3. Fix what surfaces before the main event.
4. This step is not optional. The first real gate is where the unknown unknowns live.

### 21.3 On-sale day
5. Enable the virtual waiting room if high demand is expected.
6. Full team on standby for the first hour.
7. Watch: payment success rate, conversion, error rate, inventory accuracy.
8. Have a pause-sales switch ready and know who is authorised to use it.
9. Post-on-sale review within 24 hours.

### 21.4 Event night operations
10. **T-24h:** confirm manifests build correctly, devices charged, staff briefed, guest lists printed.
11. **T-4h:** reminders sent, devices synced, on-call confirmed, live console up on a display.
12. **T-1h:** final sync, gate staff in position, comms channel open.
13. **During:** monitor occupancy, gate throughput, sync backlog, denial rate. One person watches the console and nothing else.
14. **T+1h after close:** verify all devices synced, all check-ins landed, reconcile counts against the console.
15. **Next morning:** daily summary, discrepancy review, support triage.

### 21.5 Post-event review
16. Within 72 hours of the final night, review:
    - Sales vs target, conversion, payment success
    - Gate throughput, average wait, denial rate and reasons
    - Support tickets by category
    - Technical incidents and their causes
    - Financial reconciliation completeness
17. Write it up. Feed every finding into the backlog with a named owner.
18. Ask the organizer what they'd change. Ask three attendees. Ask two gate staff. Their answers will not match yours.

### 21.6 Ongoing cadence
19. Weekly: error review, support theme review, performance check.
20. Monthly: security dependency review, cost review, feature-flag cleanup.
21. Per season: capacity planning, load re-test, DR drill, roadmap review.
22. Maintain a public changelog for organizers.

### 21.7 Roadmap after v1
Ordered by expected value, to be re-ordered by what the first season actually teaches:
1. Native apps if PWA retention proves insufficient
2. RazorpayX automated payouts
3. Reserved seating for concert-format events
4. Multi-city event series management
5. Organizer marketplace and public discovery at the platform level
6. API for third-party integrations
7. Advanced dynamic pricing
8. Sponsorship marketplace
9. Artist booking marketplace

---

## Acceptance criteria

- [ ] Every pre-launch checklist item is ticked with a named owner
- [ ] Soft launch completed with a real paying event and no critical incidents
- [ ] First on-sale completed with payment success > 90%
- [ ] First event night completed with gate wait < 5 minutes and scan success > 97%
- [ ] Financial reconciliation ties out to zero variance
- [ ] Post-event review documented and backlogged
- [ ] Runbooks were used and updated based on what actually happened

---

## Definition of Done

A real Garba event has run end to end on the platform: passes sold, delivered, scanned, money reconciled, organizer paid, and a written review with the next season's improvements already in the backlog.

---

## OpenCode prompt

> Read `docs/05-execution/phase-21-launch.md`. Work through the pre-launch checklist and confirm each item with evidence, not assertion. Do not skip the soft launch. After the first event, complete the post-event review and file every finding as a backlog item with an owner.
