# Tech Stack Assessment

**Target:** `https://dashboard-manhar.ticmint.com/`  
**Date:** 2026-09-10

---

## 1. Framework & Runtime

| Component | Technology | Version/Details |
|-----------|-----------|-----------------|
| **Framework** | Next.js | 15+ (App Router with RSC) |
| **React** | React | 19 (React Server Components) |
| **Rendering** | Client-Side Rendering | 100% CSR — `BAILOUT_TO_CLIENT_SIDE_RENDERING` template on every route |
| **Build Tool** | Turbopack | v06 (chunk: `turbopack-06.oejl1f4x49.js`) |
| **Language** | TypeScript | Inferred from module patterns |

---

## 2. Styling

| Component | Technology | Details |
|-----------|-----------|---------|
| **CSS Framework** | Tailwind CSS | v4 (unlayered output, `tw.css` naming) |
| **CSS Processing** | PostCSS | Standard Tailwind pipeline |
| **Component Library** | shadcn/ui | Radix UI primitives + Tailwind |
| **Icons** | Lucide React | `Eye`, `EyeOff` icons detected |

---

## 3. State Management

| Component | Technology | Details |
|-----------|-----------|---------|
| **Server State** | React Query (TanStack Query) | API data fetching, caching |
| **Client State** | Zustand | Auth flow state machine |
| **Form State** | React Hook Form | Form handling, validation |
| **Validation** | Zod | Schema validation for forms |

---

## 4. Authentication

| Component | Technology | Details |
|-----------|-----------|---------|
| **Auth Provider** | NextAuth.js | Token strategy |
| **Auth Flow** | Custom (email → password/OTP → org) | Multi-step with Zustand |
| **OTP** | Custom | 6-digit email OTP via InputOTP |
| **Multi-Org** | Custom | Organization selection post-auth |

---

## 5. Routing

| Component | Technology | Details |
|-----------|-----------|---------|
| **Router** | Next.js App Router | File-based routing |
| **Navigation** | Next.js `useRouter()` | `push`, `replace` |
| **Dynamic Routes** | Yes | `[eventId]` style segments |

---

## 6. Rich Content

| Component | Technology | Details |
|-----------|-----------|---------|
| **Rich Text Editor** | Tiptap | Headings, code blocks, images |
| **Math Rendering** | KaTeX | v0.16.22, 18 font faces |
| **Tweet Embeds** | react-tweet | Twitter/X post embedding |
| **Dashboard Grid** | react-grid-layout | Draggable/resizable panels |

---

## 7. UI Components

| Component | Technology | Details |
|-----------|-----------|---------|
| **Component Library** | shadcn/ui | Radix-based components |
| **OTP Input** | InputOTP | 6-digit input with groups |
| **Toast** | Sonner | Notification toasts |
| **Animations** | Framer Motion | Page transitions, enter/exit |
| **Modals** | Radix Dialog | Modal dialogs |

---

## 8. Analytics & Tracking

| Component | Technology | Details |
|-----------|-----------|---------|
| **Analytics** | Mixpanel | Route tracking, user identification |
| **Attribution** | Custom | AttributionInitializer component |
| **UTM Tracking** | Custom | UTMCapture component |

---

## 9. Customer Support

| Component | Technology | Details |
|-----------|-----------|---------|
| **Live Chat** | Freshchat (Freshworks) | FreshchatWidget component |

---

## 10. API & Data

| Component | Technology | Details |
|-----------|-----------|---------|
| **API Client** | React Query hooks | `DashboardAuthController` namespace |
| **API Protocol** | REST | Inferred from hook patterns |
| **Token Storage** | NextAuth token | Server-side session |
| **Response Format** | JSON | `{ status: "success", data: {...} }` |

---

## 11. Hosting & Infrastructure

| Component | Technology | Details |
|-----------|-----------|---------|
| **Domain** | `dashboard-manhar.ticmint.com` | Subdomain of ticmint.com |
| **Platform** | Likely Vercel or custom | Turbopack build suggests Vercel |
| **CDN** | Likely Vercel Edge | Next.js optimized deployment |

---

## 12. Dependencies (Inferred from code)

### Core
- `next` (15+)
- `react` (19)
- `react-dom` (19)

### Auth & Forms
- `next-auth`
- `react-hook-form`
- `@hookform/resolvers` (zodResolver)
- `zod`

### State & Data
- `zustand`
- `@tanstack/react-query`

### UI & Styling
- `tailwindcss` (v4)
- `@radix-ui/react-*` (multiple primitives)
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `sonner` (toasts)
- `framer-motion`

### Rich Content
- `@tiptap/react`
- `@tiptap/*` (extension packages)
- `katex`
- `react-tweet`

### Layout
- `react-grid-layout`

### Input
- `input-otp`

### Analytics
- `mixpanel-browser` (inferred)

### Chat
- Freshchat script (external)

---

## 13. Brand White-Labeling

The application supports white-labeling through:
- `BrandLogo` component with `useWhiteLabel()` hook
- Multiple logo variants (full, small, white)
- Configurable brand name, links, logos
- `DynamicFavicon` component for per-brand favicons

---

## 14. Key Observations

1. **100% CSR** — No server-side rendering of page content; all content is client-rendered after JavaScript hydration
2. **Complex auth flow** — Multi-step with email verification, OTP, password, and organization selection
3. **White-label ready** — The platform supports multiple brands/tenants
4. **Feature-rich** — Rich text editing, math rendering, social embeds, and dashboard grids suggest a comprehensive event management platform
5. **Modern stack** — Uses cutting-edge Next.js 15, React 19, Tailwind v4, Turbopack
6. **No sitemap/robots** — SEO is not a priority (expected for a dashboard app)
