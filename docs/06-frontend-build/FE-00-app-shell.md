# FE-00 — App Shell Bootstrap

| | |
|---|---|
| **Phase ID** | `FE-00` |
| **Depends on** | — |
| **Blocks** | Every later FE phase |
| **Reference docs** | `03-architecture/tech-stack.md §1, §3`, `00-START-HERE.md` |

---

## Goal

Stand up the monorepo and the three user-facing apps so there is something to open in a browser — with **zero database**. This is scaffolding only: no design system, no real pages, just a running skeleton.

---

## Deliverables

1. Turborepo + pnpm monorepo matching the layout in `tech-stack.md §3`, minus the `supabase/` folder (deferred)
2. Three Next.js 15 (App Router) apps running: `apps/web` (port 3000), `apps/dashboard` (port 3001), `apps/scanner` (port 3002)
3. Shared `packages/config` (tsconfig, eslint, prettier — Tailwind preset comes in FE-01)
4. Each app renders a placeholder home page confirming it's alive
5. `.env.example` for only the variables that matter pre-database (app URLs; everything Supabase/Razorpay/WhatsApp-related is listed but commented out with a `# wired in FE-07 handoff / 05-execution P-02+` note)

---

## Step-by-step

1. `pnpm dlx create-turbo@latest` or manual Turborepo init — pnpm workspaces, `turbo.json`.
2. Create `packages/config` with shared `tsconfig.base.json`, `.eslintrc`, `prettier.config.js`. No Tailwind preset yet (FE-01 owns that).
3. Scaffold `apps/web`, `apps/dashboard`, `apps/scanner` as Next.js 15 App Router projects, TypeScript strict, each importing `packages/config`'s tsconfig.
4. Assign ports explicitly in each app's `package.json` dev script (3000 / 3001 / 3002) so all three can run together via `turbo run dev`.
5. Each app gets one placeholder route (`/`) that renders the app's name and a "FE-00 shell alive" message — nothing styled yet.
6. Root `README.md` (repo root, not `docs/`) with the three dev URLs and `pnpm install && pnpm dev` instructions.
7. `.env.example`: include `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DASHBOARD_URL`, `NEXT_PUBLIC_SCANNER_URL` uncommented; include the full Supabase/Razorpay/WhatsApp/SMS/email/analytics block from `tech-stack.md §4` but commented out, each with `# not needed until 05-execution P-02+`.
8. Git init, `.gitignore` (node_modules, .next, .env, .turbo).

---

## Files created

```
manharevent/                         (repo root — rename from manhar-garba is optional;
│                                      internal package name can stay manhar-garba)
├── apps/
│   ├── web/                         placeholder home page
│   ├── dashboard/                   placeholder home page
│   └── scanner/                     placeholder home page
├── packages/config/{tsconfig.base.json,.eslintrc.cjs,prettier.config.js}
├── .env.example
├── turbo.json  pnpm-workspace.yaml  package.json
└── README.md
```

---

## Acceptance criteria

- [ ] `pnpm install` succeeds from a clean clone
- [ ] `turbo run dev` starts all three apps on 3000/3001/3002 simultaneously
- [ ] Each app's placeholder page loads with no console errors
- [ ] `pnpm lint && pnpm typecheck && pnpm build` all pass across the whole monorepo
- [ ] No Supabase, Razorpay, or any external SDK is imported anywhere yet

## Definition of Done

Three empty apps run side by side, the monorepo tooling works, and the repo is a clean base for FE-01 to theme.

---

## Claude Code prompt

> Read `docs/00-START-HERE.md` and `docs/03-architecture/tech-stack.md` §1 and §3. Build FE-00 exactly as scoped in `docs/06-frontend-build/FE-00-app-shell.md` — monorepo + three placeholder Next.js 15 apps, no database, no Tailwind theming yet (that's FE-01). Do not install Supabase, Razorpay, or any other backend SDK. When done, run lint/typecheck/build and report the three dev URLs.
