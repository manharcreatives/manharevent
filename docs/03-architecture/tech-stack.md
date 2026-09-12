# 05 · Tech Stack — Locked Decisions

> Every decision below is **final for v1**. Changing one is a documented decision, not a preference.
> OpenCode must not substitute libraries.

---

## 1. The stack

| Layer | Choice | Version | Why this and not the alternative |
|---|---|---|---|
| Framework | **Next.js** | 15.x (App Router) | Best SSR/ISR story; we need real SEO on the public surface |
| UI runtime | **React** | 19.x | Required by Next 15 |
| Language | **TypeScript** | 5.6+, `strict: true` | Non-negotiable |
| Styling | **Tailwind CSS** | v4 | Matches the audited stack; zero-runtime |
| Components | **shadcn/ui** + Radix | latest | Owned source, accessible, no lock-in |
| Icons | **lucide-react** | latest | Tree-shakeable |
| Animation | **Motion** (framer-motion) | 11.x | Only where it earns its bytes |
| Forms | **react-hook-form** + **zod** | latest | Same schema validates client, server action, and DB edge function |
| Server state | **TanStack Query** | v5 | Dashboard only; public pages use RSC |
| Client state | **Zustand** | v5 | Only for the checkout machine and scanner queue |
| Database | **Supabase Postgres** | 15+ | RLS gives us DB-enforced multi-tenancy |
| Auth | **Supabase Auth** (phone OTP) | — | JWT carries `tenant_id`; RLS reads it directly |
| Storage | **Supabase Storage** | — | Pass PDFs, photos, gallery, logos |
| Realtime | **Supabase Realtime** | — | Live dashboard, occupancy, scan feed |
| Edge/background | **Supabase Edge Functions** (Deno) | — | Webhooks, pass generation, scheduled jobs |
| Payments | **Razorpay** | Standard Checkout + Orders API | UPI Intent, best India coverage, webhooks, refunds |
| Messaging | **WhatsApp Cloud API** (Meta) | v20+ | Primary pass delivery |
| SMS fallback | **MSG91** | — | DLT-registered templates |
| Email | **Resend** | — | Invoices and receipts only |
| Analytics | **PostHog** | cloud (India region) | Product analytics + session replay + feature flags in one |
| Errors | **Sentry** | — | Both surfaces + edge functions |
| Rate limit / bot | **Cloudflare Turnstile** + Upstash Redis | — | Checkout protection, on-sale queue |
| PDF generation | **@react-pdf/renderer** in an Edge Function | — | Deterministic pass PDFs |
| QR | **qrcode** (gen) + **@zxing/browser** (scan) | — | zxing handles cheap Android cameras better than jsQR |
| Offline storage | **Dexie** (IndexedDB) | v4 | Scanner manifest + queue |
| PWA | **Serwist** | — | Service worker for the scanner |
| i18n | **next-intl** | — | Gujarati / Hindi / English, SSR-safe |
| Testing | **Vitest** + **Playwright** | — | Unit + E2E |
| Monorepo | **Turborepo** + **pnpm** | — | 3 apps, shared packages |
| Hosting | **Vercel** (apps) + **Supabase** (data) | — | Both have India edge presence |
| CI | **GitHub Actions** | — | Lint, typecheck, test, migrate, deploy |

---

## 2. Explicitly rejected

| Rejected | Instead | Reason |
|---|---|---|
| NextAuth.js | Supabase Auth | We want the database to enforce tenancy, not the app layer |
| Prisma | Supabase client + generated types + raw SQL migrations | Prisma fights RLS; we want RLS to be the security boundary |
| Mixpanel | PostHog | Cheaper, session replay included, self-hostable escape hatch |
| Freshchat | WhatsApp support inbox | India-correct channel |
| KaTeX, react-tweet, react-grid-layout | — | Dead weight (see gap analysis) |
| Redux / MobX | Zustand + RSC | Overkill |
| Seat-map libraries | Zone model | Garba is standing |
| Native apps (v1) | PWA | PWA covers scanner + attendee needs |

---

## 3. Monorepo layout

```
manhar-garba/
├── apps/
│   ├── web/                 Surface 1 — public site (SSR/ISR)
│   ├── dashboard/           Surface 2 — organizer (SPA behind auth)
│   ├── scanner/             Surface 3 — offline PWA
│   └── admin/               Surface 4 — superadmin (added Phase 17)
├── packages/
│   ├── ui/                  shadcn components, shared across apps
│   ├── db/                  Supabase types, query helpers, RLS test harness
│   ├── domain/              Pure business logic: pricing, policy, validation
│   ├── config/              tsconfig, eslint, tailwind preset
│   ├── i18n/                Message catalogues (gu / hi / en)
│   └── contracts/           Zod schemas shared client ↔ server ↔ edge
├── supabase/
│   ├── migrations/          Ordered SQL migrations
│   ├── functions/           Edge functions
│   └── seed/                Seed + demo data
├── e2e/                     Playwright suites
├── docs/                    ← this documentation
└── turbo.json  pnpm-workspace.yaml
```

**Rule:** `packages/domain` has **zero** dependencies on React, Next, or Supabase. Pricing, refund policy, pass validity, and capacity maths are pure functions with exhaustive unit tests. This is what makes the scanner and the server agree on validity offline.

---

## 4. Environment variables (canonical list)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # server + edge only, never in a client bundle
SUPABASE_JWT_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# SMS / Email
MSG91_AUTH_KEY=
MSG91_SENDER_ID=
RESEND_API_KEY=

# Infra
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Observability
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_DASHBOARD_URL=
NEXT_PUBLIC_SCANNER_URL=
PASS_SIGNING_SECRET=                  # HMAC key for QR payloads
CRON_SECRET=
```

Every one of these must exist in `.env.example` with a comment. A missing env var must fail loudly at boot via a Zod-validated `env.ts`, never silently at runtime.

---

## 5. Conventions OpenCode must follow

1. **Server Components by default.** `"use client"` requires a reason in a comment.
2. **No `any`.** `strict: true`, `noUncheckedIndexedAccess: true`.
3. **All money in paise as `bigint`/integer.** Never floats. Never `number` for currency.
4. **All timestamps `timestamptz`, stored UTC, displayed in `Asia/Kolkata`.**
5. **Every table has** `id uuid pk`, `tenant_id uuid`, `created_at`, `updated_at`, and RLS enabled.
6. **Every mutation goes through a Zod-validated server action or edge function.** No direct client writes to money tables.
7. **Every user-visible string comes from `packages/i18n`.** No hardcoded English in JSX.
8. **File naming:** `kebab-case.tsx` for files, `PascalCase` for components, `camelCase` for functions.
9. **One component per file** above 40 lines.
10. **Every phase ends green:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
