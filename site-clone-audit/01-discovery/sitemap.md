# Site Discovery — Sitemap & Page Inventory

**Target:** https://dashboard-manhar.ticmint.com/  
**Crawl Date:** 2026-09-10  
**robots.txt:** Not found (404)  
**sitemap.xml:** Not found (timeout / no response)

---

## Site Architecture Summary

- **Framework:** Next.js 15 (App Router)
- **Rendering:** 100% Client-Side Rendering (BAILOUT_TO_CLIENT_SIDE_RENDERING)
- **Authentication:** Required for all routes except `/auth/*`; unauthenticated access redirects to `/auth/signin`
- **Domain:** `dashboard-manhar.ticmint.com` (white-labeled TICMint event platform)

---

## Confirmed Routes

### Public Routes (no auth required)

| # | URL Path | Title | Status |
|---|----------|-------|--------|
| 1 | `/` | — | Redirects → `/auth/signin` |
| 2 | `/auth/signin` | Sign In | Active — primary landing page |
| 3 | `/auth/signup` | Sign Up | Active — redirects to `/auth/signin` (sign-up is embedded in signin flow) |

### Protected Routes (auth required, redirect to `/auth/signin` if unauthenticated)

| # | URL Path | Title | Notes |
|---|----------|-------|-------|
| 4 | `/dashboard` | Dashboard | Main authenticated landing |
| 5 | `/events` | Events | Event management |
| 6 | `/pricing` | Pricing | Subscription/pricing page |
| 7 | `/settings` | Settings | User/org settings |
| 8 | `/team` | Team | Team management |

### Confirmed 404 Routes (do NOT exist)

| URL Path | HTTP Status |
|----------|-------------|
| `/auth/forgot-password` | 404 |
| `/auth/verify-otp` | 404 |
| `/auth/reset-password` | 404 |

### Inferred Routes (from code analysis — not directly verified)

Based on the app structure (event platform with dashboards, tiptap editor, react-grid-layout), the following routes likely exist behind auth:

| URL Path (inferred) | Purpose |
|---------------------|---------|
| `/events/[eventId]` | Individual event detail/edit |
| `/events/[eventId]/dashboard` | Event-specific dashboard |
| `/events/[eventId]/settings` | Event settings |
| `/events/[eventId]/team` | Event team management |
| `/events/[eventId]/reports` | Event analytics/reports |
| `/events/create` | Create new event |
| `/settings/billing` | Billing/subscription settings |
| `/settings/integrations` | Third-party integrations |

> **NOTE:** These inferred routes could not be verified because all protected routes redirect to `/auth/signin` without valid credentials. They need manual verification after authentication.

---

## Route Groupings

### 1. Authentication Group (`/auth/*`)
- `/auth/signin` — Combined sign-in/sign-up with email → password/OTP → org selection flow
- `/auth/signup` — Redirects to signin flow

### 2. Dashboard Group (`/dashboard`)
- Main authenticated landing page

### 3. Events Group (`/events/*`)
- Event listing and management

### 4. Settings Group (`/settings/*`)
- User and organization settings

### 5. Team Group (`/team`)
- Team member management

### 6. Pricing Group (`/pricing`)
- Subscription plans and pricing

---

## Discovery Limitations

1. **robots.txt** — Does not exist at `https://dashboard-manhar.ticmint.com/robots.txt`
2. **sitemap.xml** — Does not respond at `https://dashboard-manhar.ticmint.com/sitemap.xml`
3. **CSR-only rendering** — All HTML responses return only `<div>Loading...</div>` with no SSR content; full page content is rendered by JavaScript after hydration
4. **Authentication wall** — All non-auth routes redirect to `/auth/signin`, preventing discovery of internal page content and sub-routes
5. **Dynamic routes** — Event detail pages likely use dynamic segments (`[eventId]`) that cannot be enumerated without authenticated access or API documentation

---

## CSS Files Discovered

| File | Size | Purpose |
|------|------|---------|
| `_next/static/chunks/0reyyc-0w9.tw.css` | 205,504 bytes | Main Tailwind CSS (custom + utilities) |
| `_next/static/chunks/03yr30dkhy-4x.css` | — | react-grid-layout styles |
| `_next/static/chunks/0s~p6y5geym3q.css` | — | Tiptap rich-text editor styles |
| `_next/static/chunks/13f_ms-df~6gd.css` | — | KaTeX math + react-tweet styles |

---

## JS Entry Points Discovered

| File | Purpose |
|------|---------|
| `0mwylmw3gjvtu.js` | Main entry / RSC bootstrap |
| `turbopack-06.oejl1f4x49.js` | Turbopack runtime |
| `0-dm060j48fjd.js` | react-hook-form library |
| `16vaec51_m1xj.js` | Sign-in page component |
| `03hzi.89d0sy8.js` | Label + zodResolver + Next.js Link/Image |
| `16192bcrhd~.z.js` | Sign-up page component |
