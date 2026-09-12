# Phase 20 — Differentiators: Gallery, Community & Growth

| | |
|---|---|
| **Phase ID** | `P-20` |
| **Depends on** | `P-11`, `P-14` |
| **Blocks** | — |
| **Estimated effort** | 24–32 hours |
| **Launch blocking** | ❌ No — post-launch, before next season |
| **Reference docs** | `01-analysis/gap-analysis.md §E` |

---

## Goal

The features that turn a ticketing transaction into a reason to come back — and that no generic event platform will build, because they only make sense for a nine-night festival where the same people return every night.

---

## Deliverables

1. Event photo gallery with "find my photos"
2. Best-dressed contest and leaderboard
3. Referral engine
4. Sponsor dashboard
5. Live venue map
6. Post-event recap
7. Artist following

---

## Step-by-step

### 20.1 Photo gallery — `/e/[slug]/gallery`
1. Organizer uploads official photos, tagged by night. Bulk upload with progress.
2. Attendees may upload, subject to moderation before public display.
3. Storage: originals private, public derivatives generated at three sizes, EXIF stripped.
4. Browse by night, infinite scroll (acceptable here — this is browsing, not administration).
5. Download and share individual photos.

### 20.2 "Find my photos"
6. Opt-in only, with an explicit and clearly worded consent screen. Face data is biometric — treat it accordingly.
7. On opt-in, the attendee provides a selfie; a face embedding is computed and stored against their profile.
8. A background job computes embeddings for gallery photos and matches.
9. `/me/photos` shows matched photos with a confidence threshold tuned for **precision over recall** — a false positive is far worse than a miss.
10. Attendees can remove a match, and can delete their face data at any time, which also deletes all embeddings.
11. Retention: face embeddings deleted 90 days after the event.
12. Run a privacy review before shipping this. If the consent story is not airtight, ship the gallery without face matching.

### 20.3 Best-dressed contest
13. Organizer enables it per night with prize details.
14. Attendees submit a photo; moderation before it appears.
15. One vote per attendee per night, enforced server-side.
16. Live leaderboard, visible on the public site and on venue screens.
17. Winner declared by the organizer; announced via WhatsApp and on the ticker.
18. Anti-gaming: votes tied to verified pass holders only, rate limited, and anomalies flagged.

### 20.4 Referral engine
19. Every attendee gets a referral code after their first purchase.
20. A successful referral credits both parties — wallet credit is preferable to cash discount, since it returns to the ground.
21. Referral dashboard in `/me/referrals`: code, shares, conversions, earnings.
22. Attribution captured on the order; fraud checks on self-referral and device clustering.
23. Organizer-side leaderboard of top referrers — genuinely useful for identifying local influencers.

### 20.5 Sponsor dashboard — `/dashboard/sponsors/[id]` and the sponsor's own view
24. Sponsor accounts with role `sponsor`, scoped read-only access.
25. Metrics they actually pay for: total footfall, footfall by zone and hour, demographic split where available, gallery photos featuring their branding, and any redemptions from sponsor-specific promo codes.
26. Downloadable post-event sponsor report as a PDF.
27. This directly increases what an organizer can charge for sponsorship, which is a strong reason for organizers to choose the platform.

### 20.6 Live venue map — `/e/[slug]/map`
28. Interactive map: zones, gates, food stalls, washrooms, first aid, exits, parking.
29. "You are here" if the attendee grants location.
30. Live zone occupancy shown to attendees as a simple "busy / moderate / free" indicator — never raw numbers, which cause panic.
31. Works offline once cached.

### 20.7 Post-event recap
32. Auto-generated the morning after the event ends: nights attended, favourite zone, wallet spend, photos of them, artists they saw.
33. Rendered as a shareable image sized for Instagram Stories.
34. Delivered on WhatsApp.
35. This is free organic marketing for next year, and it costs one background job.

### 20.8 Artist following
36. Follow from an artist page.
37. Notification when a followed artist is announced at any event on the platform.
38. Artist page shows follower count — useful to artists and to organizers negotiating with them.

---

## Files created

```
apps/web/src/app/[locale]/e/[slug]/{gallery,map,contest}/page.tsx
apps/web/src/app/[locale]/me/{photos,referrals}/page.tsx
apps/web/src/components/gallery/{PhotoGrid,PhotoViewer,FaceOptIn,UploadSheet}.tsx
apps/web/src/components/contest/{ContestEntry,Leaderboard,VoteButton}.tsx
apps/web/src/components/map/{VenueMap,OccupancyIndicator}.tsx
apps/dashboard/src/app/events/[id]/{gallery,contest,sponsors}/page.tsx
supabase/functions/{compute-face-embeddings,match-faces,generate-recap,
    referral-credit}/index.ts
supabase/migrations/0020_gallery_contest_referral.sql
packages/domain/src/referral/{code.ts,fraud.ts} + tests
e2e/gallery.spec.ts
```

---

## Acceptance criteria

- [ ] Gallery handles 5,000 photos per event with fast browsing
- [ ] Face matching is opt-in with explicit consent; opting out deletes all embeddings immediately
- [ ] Face match precision is high enough that false positives are rare — measure it on a labelled test set before shipping
- [ ] Contest voting is one per attendee per night, enforced server-side and resistant to a scripted attempt
- [ ] Referral credit applies to both parties and self-referral is blocked
- [ ] Sponsor login sees only aggregate data, never PII — verified by an RLS test
- [ ] Venue map works offline after one cached load
- [ ] Recap generates correctly for a season pass holder who attended 6 of 9 nights
- [ ] Face embeddings are deleted 90 days post-event by a scheduled job

---

## Definition of Done

Gallery, contest, and referrals are live with a clean privacy story. If the face-matching consent story is not airtight, that sub-feature ships disabled behind its flag — the gallery still works without it.

---

## OpenCode prompt

> Read `docs/05-execution/phase-20-differentiators.md` and `docs/01-analysis/gap-analysis.md §E`. Execute Phase 20 steps 20.1–20.8. Face recognition is biometric data — opt-in, explicit consent, deletable, and time-limited. Tune matching for precision over recall. If the privacy review does not pass, ship the gallery with face matching disabled behind its feature flag.
