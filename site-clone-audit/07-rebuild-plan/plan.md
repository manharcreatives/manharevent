# Rebuild Plan

**Target:** `https://dashboard-manhar.ticmint.com/`  
**Date:** 2026-09-10  
**Status:** Plan only — no code until explicitly approved

---

## 1. Recommended Tech Stack

| Category | Recommendation | Rationale |
|----------|---------------|-----------|
| **Framework** | Next.js 15 (App Router) | Matches original; best React ecosystem support |
| **React** | React 19 | Required for Next.js 15 App Router |
| **Styling** | Tailwind CSS v4 | Exact match to original |
| **UI Components** | shadcn/ui | Exact match to original |
| **Form Handling** | React Hook Form + Zod | Exact match |
| **State (Server)** | TanStack React Query | Exact match |
| **State (Client)** | Zustand | Exact match |
| **Auth** | NextAuth.js (token strategy) | Exact match |
| **Animations** | Framer Motion | Exact match |
| **Rich Text** | Tiptap | Exact match |
| **Math** | KaTeX | Exact match |
| **Build Tool** | Turbopack | Matches original |
| **Deployment** | Vercel | Recommended for Next.js |

---

## 2. Phase-by-Phase Rebuild Checklist

### Phase A: Project Setup
- [ ] Initialize Next.js 15 App Router project
- [ ] Configure Tailwind CSS v4
- [ ] Set up shadcn/ui with Radix primitives
- [ ] Configure TypeScript
- [ ] Set up ESLint + Prettier
- [ ] Configure `next.config.js` for CSR bailout

### Phase B: Design System
- [ ] Define CSS custom properties (all theme tokens from `tokens.md`)
- [ ] Configure light/dark mode with `prefers-color-scheme`
- [ ] Set up Inter font family
- [ ] Create color palette variables (primary, secondary, accent, etc.)
- [ ] Define typography scale (font sizes, weights, line heights)
- [ ] Create button variants (primary, secondary, ghost, link, destructive)
- [ ] Create input components with validation states
- [ ] Set up toast notifications (Sonner)

### Phase C: Auth Pages
- [ ] `/auth/signin` — Email entry screen
- [ ] `/auth/signin` — Password entry screen
- [ ] `/auth/signin` — OTP entry screen (InputOTP component)
- [ ] `/auth/signin` — Organization selection screen
- [ ] `/auth/signin` — Auth flow state machine (Zustand store)
- [ ] `/auth/signin` — BrandLogo component (white-label support)
- [ ] `/auth/signin` — Legal text with Terms/Privacy links
- [ ] `/auth/signin` — Form validation (Zod schemas)
- [ ] `/auth/signin` — Error handling (all 5 error messages)
- [ ] `/auth/signin` — OTP resend timer
- [ ] `/auth/signin` — Password visibility toggle

### Phase D: Layout Components
- [ ] Root layout with Providers wrapper
- [ ] Global components: UTMCapture, AttributionInitializer, AnalyticsBootstrap
- [ ] MixpanelRouteTracker, MixpanelIdentify
- [ ] FreshchatWidget integration
- [ ] DynamicFavicon component
- [ ] Toaster (global toast provider)

### Phase E: Dashboard Pages (need authenticated access to verify)
- [ ] `/dashboard` — Main dashboard with react-grid-layout
- [ ] `/events` — Event listing
- [ ] `/events/[eventId]` — Event detail
- [ ] `/events/[eventId]/editor` — Tiptap rich text editor
- [ ] `/pricing` — Pricing plans
- [ ] `/settings` — User settings
- [ ] `/team` — Team management

### Phase F: Rich Content Integration
- [ ] Tiptap editor setup with extensions
- [ ] KaTeX math rendering
- [ ] react-tweet embed component
- [ ] react-grid-layout dashboard panels

### Phase G: Animations & Interactions
- [ ] Page transitions (Framer Motion enter/exit)
- [ ] Mobile bottom sheet (slide up/down)
- [ ] OTP input animations
- [ ] Ticker/marquee animation
- [ ] Bounce, pulse, spin utility animations
- [ ] Custom scrollbar (scrollbar-hide)
- [ ] Reduced motion support (`prefers-reduced-motion`)

### Phase H: API Integration
- [ ] React Query setup with API base URL
- [ ] Auth API hooks (verifyEmail, verifyPassword, sendOtp, verifyOtp, selectOrganization)
- [ ] API response type definitions
- [ ] Error handling patterns (401, network errors)

---

## 3. Items Requiring Your Confirmation

### 3.1 Scope Decision
**Question:** The original site is a **full event management dashboard** (not just a landing page). The authenticated pages (dashboard, events, settings, team, pricing) could not be extracted due to auth walls.

**Options:**
- **A)** Build only the auth pages (signin/signup) that we can see
- **B)** Build auth pages + placeholder dashboard shell (you provide screenshots/mockups for authenticated pages)
- **C)** You provide access credentials or source code for the authenticated pages

### 3.2 Brand Identity
**Question:** The site uses `dashboard-manhar.ticmint.com` — "Manhar" appears to be a white-label brand. 

**Confirm:** What brand name, logo, colors should the rebuild use?
- Same as original (Manhar/TICMint)?
- New brand? (provide assets)

### 3.3 API Backend
**Question:** The auth system communicates with a `DashboardAuthController` API.

**Confirm:** 
- Will you provide the API base URL?
- Should we mock the API for development?
- Do you have API documentation?

### 3.4 Authentication Provider
**Question:** The original uses `next-auth` with a custom "token" strategy.

**Confirm:** 
- Keep NextAuth.js?
- Switch to a different auth provider (Clerk, Auth0, etc.)?
- Custom JWT implementation?

### 3.5 Deployment Target
**Question:** The original is likely deployed on Vercel.

**Confirm:**
- Vercel deployment?
- Other platform (Netlify, AWS, etc.)?
- Self-hosted?

### 3.6 Missing Content
**Question:** Several items could not be fully extracted:

| Item | Status | Action Needed |
|------|--------|---------------|
| Dashboard page content | Not extracted | Screenshots or mockup needed |
| Events page content | Not extracted | Screenshots or mockup needed |
| Settings page content | Not extracted | Screenshots or mockup needed |
| Team page content | Not extracted | Screenshots or mockup needed |
| Pricing page content | Not extracted | Screenshots or mockup needed |
| Footer content | Not extracted | Screenshots or text needed |
| Navigation menu items | Not extracted | Screenshots or list needed |
| Full image/icon inventory | Partial | Browser DevTools capture needed |
| Exact spacing/layout values | Partial | Figma file or measurements needed |

### 3.7 White-Labeling
**Question:** The original supports white-labeling via `useWhiteLabel()`.

**Confirm:** Should the rebuild include white-label support?
- Yes (provide brand configuration structure)
- No (hardcode single brand)

---

## 4. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| CSR-only rendering makes content extraction impossible without auth | HIGH | Need authenticated access or source code |
| Protected pages have unknown layout/content | HIGH | Request screenshots/mockups from user |
| API endpoints and data shapes are unknown | MEDIUM | Mock API or request documentation |
| Dynamic routes (`[eventId]`) have unknown structure | MEDIUM | Infer from library usage (react-grid-layout, tiptap) |
| Image/asset inventory is incomplete | MEDIUM | Browser DevTools Network capture |
| Exact spacing/layout measurements unavailable | LOW | Use Tailwind defaults, adjust from screenshots |

---

## 5. Estimated Effort

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| A: Project Setup | 2-4 hours | None |
| B: Design System | 8-12 hours | Phase A |
| C: Auth Pages | 16-24 hours | Phase B |
| D: Layout Components | 4-8 hours | Phase B |
| E: Dashboard Pages | 32-48 hours | Phase B, D (needs screenshots) |
| F: Rich Content | 8-12 hours | Phase B |
| G: Animations | 8-12 hours | Phase B, C |
| H: API Integration | 12-16 hours | Phase C (needs API details) |
| **Total** | **90-136 hours** | |

---

## 6. Next Steps

1. **You review** this plan and answer the confirmation questions in Section 3
2. **Provide** any screenshots, mockups, or source code for authenticated pages
3. **Confirm** the tech stack and deployment target
4. **Say "start build"** when ready to begin implementation
