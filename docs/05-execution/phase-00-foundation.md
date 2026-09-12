# Phase 00 — Foundation & Repository Setup

| | |
|---|---|
| **Phase ID** | `P-00` |
| **Depends on** | Nothing |
| **Blocks** | Every other phase |
| **Estimated effort** | 6–10 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `03-architecture/tech-stack.md` |

---

## Goal

Produce a monorepo that installs, lints, typechecks, tests, and builds green on a clean machine and in CI — with three empty-but-running apps and all shared packages wired. **No product features in this phase.** The only success criterion is that the next 21 phases have somewhere solid to land.

---

## Prerequisites

- Node 20+, pnpm 9+
- GitHub repository created (private)
- Supabase account (3 projects will be created in P-02: `dev`, `staging`, `prod`)
- Vercel account

---

## Deliverables

1. Turborepo monorepo with pnpm workspaces
2. `apps/web`, `apps/dashboard`, `apps/scanner` — each a running Next.js 15 app
3. `packages/ui`, `packages/db`, `packages/domain`, `packages/config`, `packages/i18n`, `packages/contracts`
4. Shared TypeScript, ESLint, Prettier, Tailwind v4 config
5. Type-safe env loading that fails loudly at boot
6. GitHub Actions CI: lint → typecheck → test → build
7. `docs/` copied into the repo

---

## Step-by-step

### 0.1 Initialise the monorepo
1. `pnpm dlx create-turbo@latest manhar-garba --package-manager pnpm`
2. Delete the example apps and packages that ship with the template.
3. Create `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - "apps/*"
     - "packages/*"
   ```
4. Set `"packageManager": "pnpm@9.x"` in root `package.json`.
5. Add `.nvmrc` with `20`.

### 0.2 Shared config package
6. Create `packages/config` exporting:
   - `tsconfig/base.json` — `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `moduleResolution: "bundler"`
   - `tsconfig/next.json` extending base
   - `eslint/base.js` — typescript-eslint strict, import ordering, `no-console` (warn), unused imports
   - `eslint/next.js` extending base with `eslint-config-next`
   - `prettier/index.js` — 100 cols, no semicolons off (keep semicolons), single quotes off (double)
   - `tailwind/preset.ts` — the token set from `04-design/design-system.md`

### 0.3 Create the three apps
7. For each of `web`, `dashboard`, `scanner`:
   ```
   pnpm create next-app@latest apps/<name> --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint
   ```
8. Point each app's `tsconfig.json` at `@manhar/config/tsconfig/next.json`.
9. Point each app's `eslint.config.mjs` at `@manhar/config/eslint/next`.
10. Point each app's Tailwind config at the shared preset.
11. Set distinct dev ports: web `3000`, dashboard `3001`, scanner `3002`.
12. Each app renders a placeholder page confirming it boots.

### 0.4 Shared packages (stubs with real structure)
13. `packages/ui` — `src/index.ts`, `src/lib/utils.ts` with `cn()`, shadcn `components.json` configured to output here. No components yet.
14. `packages/domain` — `src/index.ts`. **Zero runtime dependencies.** Add a `Paise` branded type:
    ```ts
    export type Paise = number & { readonly __brand: "Paise" }
    export const paise = (n: number): Paise => { /* assert integer */ }
    ```
15. `packages/contracts` — Zod schemas, empty barrel for now.
16. `packages/db` — placeholder for generated Supabase types.
17. `packages/i18n` — `messages/{en,hi,gu}.json` each with a single test key.

### 0.5 Environment handling
18. Create `packages/config/env/` with a Zod schema per app (`webEnv`, `dashboardEnv`, `scannerEnv`, `serverEnv`).
19. Each app imports and parses env at module load. A missing required var throws with the variable name at boot — never at request time.
20. Write `.env.example` at the root containing **every** variable from `tech-stack.md §4`, each with a one-line comment.
21. `.gitignore` covers `.env*` except `.env.example`.

### 0.6 Testing harness
22. Install Vitest at the root; add `vitest.workspace.ts` covering all packages.
23. Install Playwright; create `e2e/` with a smoke test per app asserting the placeholder page renders.
24. Add one real unit test in `packages/domain` (the `paise()` guard) so the test command is not vacuous.

### 0.7 CI
25. `.github/workflows/ci.yml`, triggered on PR and push to `main`:
    - checkout → pnpm install (frozen lockfile, cached) → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`
26. Add a **secret-leak check** step: grep the built output of every app for `SERVICE_ROLE`, `KEY_SECRET`, `SIGNING_SECRET`. Fail if found.
27. Enable branch protection on `main`: require CI green, require PR, no force push.

### 0.8 Repo hygiene
28. `README.md` — what this is, how to run it, link to `docs/00-START-HERE.md`.
29. `CONTRIBUTING.md` — branch naming (`phase-NN/short-desc`), commit convention (Conventional Commits), PR template.
30. Copy the whole `docs/` folder into the repo root.
31. Add `CODEOWNERS`.

---

## Files created

```
manhar-garba/
├── package.json  pnpm-workspace.yaml  turbo.json  .nvmrc  .gitignore  .env.example
├── README.md  CONTRIBUTING.md  CODEOWNERS  vitest.workspace.ts
├── .github/workflows/ci.yml
├── .github/PULL_REQUEST_TEMPLATE.md
├── apps/web/         (Next 15 app, port 3000)
├── apps/dashboard/   (Next 15 app, port 3001)
├── apps/scanner/     (Next 15 app, port 3002)
├── packages/config/{tsconfig,eslint,prettier,tailwind,env}/
├── packages/ui/src/{index.ts,lib/utils.ts}  components.json
├── packages/domain/src/index.ts  src/money.ts  src/money.test.ts
├── packages/contracts/src/index.ts
├── packages/db/src/index.ts
├── packages/i18n/messages/{en,hi,gu}.json
├── e2e/{web,dashboard,scanner}.spec.ts  playwright.config.ts
└── docs/
```

---

## Acceptance criteria

- [ ] `pnpm install && pnpm build` succeeds from a clean clone
- [ ] `pnpm dev` starts all three apps on 3000/3001/3002 simultaneously
- [ ] `pnpm lint` and `pnpm typecheck` pass with zero warnings
- [ ] `pnpm test` runs and passes at least one real assertion
- [ ] `pnpm e2e` passes three smoke tests
- [ ] Deleting a required env var makes the app fail at boot with that variable's name in the message
- [ ] CI is green on a PR
- [ ] The secret-leak CI step actually fails when a fake secret is planted (verify this deliberately)

---

## Definition of Done

CI green on `main`. A new developer can clone, `pnpm i`, `pnpm dev`, and see all three apps in under five minutes with no undocumented steps.

---

## OpenCode prompt

> Read `docs/03-architecture/tech-stack.md` and `docs/05-execution/phase-00-foundation.md`. Execute Phase 00 exactly as written, step 0.1 through 0.8. Do not add any product features, UI components, or database code. Stop after the acceptance criteria all pass and report which ones you verified and how.
