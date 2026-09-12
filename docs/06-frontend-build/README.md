# 06 · Frontend-First Build Track — ManharEvent UI

> **What this is:** a second, leaner execution track that sits alongside `05-execution/` (the full 22-phase, backend-included plan). This track exists because the immediate goal is: *get the full, user-friendly ManharEvent web experience visually and interactively complete — on mock data — before deciding where and how the database connects.*
>
> **What this is not:** a replacement for `05-execution/`. Every phase file in `05-execution/` (P-00 … P-21) is still the source of truth for the *real*, database-backed, production build. This track produces the same UI that `05-execution` phases 01, 08, and 12 describe, resequenced to come first and built against mock data instead of Supabase/Razorpay/WhatsApp, so the "database kaha connect karna hai" decision can be made later without blocking visible progress.
>
> **🔁 Pivot (2026-09-12):** FE-00 through FE-07 were built against the original multi-tenant marketplace model (city-wide discovery). That model is superseded — see `02-product/product-spec.md`'s pivot note — by a B2B SaaS model where each organizer gets their own event website, admin panel, and gate-scanner access, entered through a new ManharEvent-own marketing + registration surface. FE-00–FE-02 (shell, design system, mock/domain layer) and FE-05/FE-06's scanner and a11y work stay valid as-is. **FE-08 through FE-11, added below, are additive, non-destructive phases** that build the new registration surface and rescope the parts of FE-03/FE-04 that assumed cross-organizer discovery — they do not redo FE-00–FE-07's completed work.

> **How to run this with Claude Code (VS Code CLI):**
> ```
> 1. Open docs/06-frontend-build/FE-00-app-shell.md
> 2. Paste its "Claude Code prompt" (bottom of the file) into Claude Code
> 3. Claude Code reads the phase + its reference docs, then builds
> 4. You verify the acceptance criteria yourself
> 5. Say "continue" / "next" — move to the next FE-NN file
> 6. Repeat through FE-11
> ```
> Every phase after FE-00 assumes Claude Code already has the whole `docs/` folder in context (or can read it) — the prompts are short on purpose and point back at the relevant docs rather than repeating them.

---

## Phase index

| # | Phase | Produces | Depends on |
|---|---|---|---|
| FE-00 | App Shell Bootstrap | Monorepo, 3 apps running, no DB | — |
| FE-01 | ManharEvent Design System | Themed component library (tokens, fonts, shadcn) | FE-00 |
| FE-02 | Mock Data & Domain Layer | Typed fixtures standing in for Supabase | FE-00 |
| FE-03 | Public Site UI | Every attendee-facing screen, mock data | FE-01, FE-02 |
| FE-04 | Organizer Dashboard UI | Every organizer screen, mock data | FE-01, FE-02 |
| FE-05 | Gate Scanner UI | Scanner PWA shell + all verdict states, mock manifest | FE-01, FE-02 |
| FE-06 | Responsive, Accessible, Online-Only Pass | Every screen verified at phone/tablet/laptop widths, a11y clean | FE-03, FE-04, FE-05 |
| FE-07 | Polish & Backend Handoff Map | Final visual QA + a documented list of every point where mock data becomes a real Supabase/Razorpay/WhatsApp call | FE-06 |
| FE-08 | Marketing + Registration (Surface 0) | New `apps/marketing`: landing, pricing, phone/OTP organizer registration, status, provisioned hand-off | FE-00, FE-01, FE-02 |
| FE-09 | Rescope Public Site | `apps/web` Home rebuilt single-tenant (no city discovery), `<FeeBreakdown>` added to checkout | FE-03, FE-08 |
| FE-10 | Admin: Tenant Approval + Scanner Access | Internal ops tenant-approval area in `apps/dashboard`, hardened Team → Gate Staff → scanner login handshake | FE-04, FE-08 |
| FE-11 | Pivot Verification & Reconciliation | End-to-end loop proven across all 4 apps, docs reconciled, `HANDOFF-TO-BACKEND.md` updated | FE-08, FE-09, FE-10 |

**After FE-07 (original track):** the platform looked and behaved completely like ManharEvent on every screen, on any phone or laptop, with realistic sample data — for the pre-pivot, multi-tenant-marketplace model.

**After FE-11 (post-pivot, current):** the platform looks and behaves like the pivoted B2B-SaaS ManharEvent — registration → approval → per-organizer provisioning → event site → admin panel → scanner — across all four apps, with realistic sample data. The decision of *where the database lives and how each mock call gets wired* is then made deliberately, using the handoff map FE-11 finalizes (built on FE-07's original version), and executed via `05-execution/` phases (P-02 Database onward) in whatever order that decision implies.

---

## Non-negotiables carried into every FE phase

These come from `04-design/ux-principles.md`, `04-design/manharevents-screen-specs.md`, and the user's explicit constraint — repeated here because Claude Code should not need to re-derive them each session:

1. **Everything is a responsive web app.** No native app shell, no hardware peripheral (printer, card reader, POS terminal, barcode-gun SDK) anywhere in the codebase. Camera access via the browser is the only device capability the scanner uses.
2. **Dark theme is the default** (`design-system.md §2`). Light theme exists but is not what gets designed-for first.
3. **Mock data must be shaped exactly like the real schema** (`03-architecture/data-model.md`) — same field names, same types (money as integer paise, timestamps as ISO UTC). This is what makes the handoff map (FE-07, finalized in FE-11) a swap, not a rewrite. New pivot models (`TenantApplication`) get the same treatment — see FE-11.
4. **No phase invents new colours, fonts, or spacing values.** Everything comes from `04-design/design-system.md` tokens. If a screen seems to need something the tokens don't have, that's a flag to raise, not a value to invent.
5. **Every phase ends green:** `pnpm lint && pnpm typecheck && pnpm build` (test suite is thin at this stage since there's no backend yet — real test coverage lands with `05-execution`).
6. **Update `docs/PROGRESS.md`'s new "Frontend-First Track" section (added below the existing phase table) at the end of every FE phase**, the same discipline as the main track.
