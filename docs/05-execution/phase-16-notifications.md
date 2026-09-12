# Phase 16 — Notifications & Communication Engine

| | |
|---|---|
| **Phase ID** | `P-16` |
| **Depends on** | `P-10` |
| **Blocks** | — |
| **Estimated effort** | 14–18 hours |
| **Launch blocking** | ✅ Yes (transactional); campaigns can follow |
| **Reference docs** | `03-architecture/data-model.md §7` |

---

## Goal

One engine that sends the right message, on the right channel, in the right language, at the right time — with delivery tracked and failures visible.

---

## Deliverables

1. Template system across channels and locales
2. Queue with retry and channel fallback
3. Transactional message catalogue
4. Scheduled reminders
5. Organizer broadcast campaigns
6. Delivery analytics
7. Preference and consent enforcement

---

## Step-by-step

### 16.1 Template system
1. `notification_templates` keyed by `(tenant, channel, key, locale)`.
2. Platform defaults exist for every key in all three languages; tenants may override.
3. Variable substitution with a typed contract per key, validated at save time — a template referencing `{unknownVar}` is rejected.
4. WhatsApp templates map to Meta-approved template names; the body is stored for preview only.
5. Preview with sample data before saving.

### 16.2 Queue & delivery
6. `notifications` is the queue. A cron drains it every minute; urgent messages dispatch immediately.
7. Channel selection: preferred channel → fallback chain → give up and log.
8. Fallback: WhatsApp → SMS → email → in-app only.
9. Retry with exponential backoff, max 3 attempts per channel.
10. Rate limits per recipient (max 10 messages per day, transactional exempt).
11. Delivery webhooks update status: sent → delivered → read → failed.
12. Dead-letter view in the dashboard for anything that exhausted all channels.

### 16.3 Transactional catalogue
Implement every one of these, in all three languages, on all applicable channels:

| Key | Trigger | Channel |
|---|---|---|
| `pass_delivered` | Order confirmed | WhatsApp + SMS |
| `payment_failed` | Payment failure | WhatsApp |
| `cart_abandoned` | 30 min after hold expiry | WhatsApp |
| `night_reminder` | 4 hours before gates open | WhatsApp |
| `first_night_reminder` | Day before night 1 | WhatsApp |
| `refund_requested` | Attendee requests | WhatsApp + dashboard |
| `refund_approved` / `refund_rejected` | Decision | WhatsApp |
| `pass_transferred` | Transfer completed | WhatsApp, both parties |
| `group_invite` | Buyer shares a slot | WhatsApp |
| `waitlist_available` | Inventory returns | WhatsApp, 30-min window |
| `event_update` | Organizer edits time/venue | WhatsApp, all pass holders |
| `night_cancelled` | Night cancelled | WhatsApp + SMS |
| `wallet_low` | Balance < ₹100 during event | WhatsApp |
| `wallet_expiring` | 7 days before expiry | WhatsApp |
| `capacity_alert` | Zone ≥ 90% | WhatsApp, to organizer |
| `daily_summary` | Every morning during the event | WhatsApp, to organizer |
| `post_event_recap` | Day after the event ends | WhatsApp |

### 16.4 Scheduled reminders
13. `night_reminder` scheduled per (pass, night) at gates-open minus 4 hours.
14. Rescheduled automatically if the night's timing changes.
15. Cancelled if the pass is refunded or already checked in for that night.
16. Timezone-correct (`Asia/Kolkata`), and never sent between 9 PM and 8 AM except for genuinely urgent categories.

### 16.5 Broadcast campaigns — `/dashboard/events/[id]/broadcast`
17. Audience builder: all pass holders / a specific zone / a specific night / checked-in only / not-yet-checked-in / waitlist.
18. Estimated reach shown before sending.
19. Requires marketing consent for non-transactional messages — the count shown is the **consented** count.
20. Schedule or send now. Test-send to yourself first, always available.
21. Per-campaign delivery and read stats.

### 16.6 Preferences & consent
22. Enforced at send time, not at compose time — a preference change must take effect immediately for queued messages.
23. Transactional (pass delivery, refunds, cancellations) cannot be disabled.
24. Marketing is opt-in, off by default, with a one-tap opt-out in every marketing message.
25. Consent changes are recorded with timestamp and source for DPDP compliance.

### 16.7 Analytics — `/dashboard/settings/notifications`
26. Per template: sent, delivered, read, failed, and the failure reasons.
27. Channel comparison, cost per channel.
28. Alert when delivery rate for any key drops below 90%.

---

## Files created

```
supabase/functions/{notification-dispatcher,whatsapp-send,sms-send,email-send,
    schedule-reminders,broadcast}/index.ts
apps/dashboard/src/app/settings/notifications/page.tsx
apps/dashboard/src/app/events/[id]/broadcast/page.tsx
apps/dashboard/src/components/notifications/{TemplateEditor,TemplatePreview,
    AudienceBuilder,DeliveryStats,DeadLetterQueue}.tsx
packages/domain/src/notification/{templates.ts,fallback.ts,scheduling.ts} + tests
packages/i18n/templates/{whatsapp,sms,email}/{en,hi,gu}/*.json
supabase/migrations/0017_notification_scheduling.sql
e2e/notifications.spec.ts
```

---

## Acceptance criteria

- [ ] Every catalogue key sends correctly on every applicable channel in all three languages
- [ ] WhatsApp failure falls back to SMS within the retry window
- [ ] A template with an unknown variable is rejected at save
- [ ] Night reminders fire at exactly gates-open minus 4 hours in IST
- [ ] Changing a night's time reschedules its reminders
- [ ] A refunded pass stops receiving reminders
- [ ] No non-urgent message sends between 9 PM and 8 AM
- [ ] Broadcast reach counts only consented recipients for marketing
- [ ] Opting out stops marketing immediately, including already-queued messages, and does not affect transactional
- [ ] Delivery status updates flow through from the provider webhook
- [ ] The dead-letter queue captures a deliberately failed message

---

## Definition of Done

Every transactional message in the catalogue works in three languages with tracked delivery. Consent is enforced at send time.

---

## OpenCode prompt

> Read `docs/05-execution/phase-16-notifications.md`. Execute Phase 16 steps 16.1–16.7. Consent must be checked at send time, not at compose time. Transactional and marketing must be strictly separated. Register all WhatsApp templates with Meta early — approval is the long pole.
