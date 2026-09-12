# FE-11 — Pivot Verification, Reconciliation & Handoff Update

| | |
|---|---|
| **Phase ID** | `FE-11` |
| **Depends on** | `FE-08`, `FE-09`, `FE-10` |
| **Blocks** | The database-connection decision — everything in `05-execution` from P-02 onward (same as `FE-07` did for the original track) |
| **Reference docs** | Every doc touched by the 2026-09-12 pivot: `02-product/product-spec.md`, `02-product/user-flows.md`, `04-design/manharevents-screen-specs.md`, `03-architecture/data-model.md` |

---

## Goal

Close out the pivot the same way `FE-07` closed out the original frontend-first track: prove the four apps now agree with each other and with the pivoted docs, fix whatever drifted while `FE-08`–`FE-10` were built, and update `HANDOFF-TO-BACKEND.md` so the mock→real map is still accurate now that a fourth app and a new `TenantApplication` model exist.

This phase produces no new screens. It produces fixes, a doc reconciliation pass, and an updated handoff map.

---

## Deliverables

1. A full run-through of the pivoted end-to-end loop (register → approve → provision → build event → issue scanner access → buy a pass → scan it) across all four apps in one sitting, with every rough edge fixed, not logged for later
2. Empty/loading/error-state audit across everything new in `FE-08`–`FE-10`, same bar `FE-06`/`FE-07` set for `FE-03`–`FE-05`
3. A drift check: re-open `product-spec.md`, `user-flows.md`, and `manharevents-screen-specs.md` and confirm the build matches what's written — fix the build or fix the doc, per the "fix the doc in the same PR" rule, whichever is actually wrong
4. `data-model.md` reviewed for whether `TenantApplication` (new in `FE-08`) needs a corresponding entry — it's a real, persistent domain concept now (not just mock scaffolding) and the eventual Postgres schema should account for it
5. `docs/06-frontend-build/HANDOFF-TO-BACKEND.md` updated: every new `repo.ts` function from `FE-08`/`FE-10` (`submitApplication`, `approveApplication`, `rejectApplication`, the gate-staff-credential issuance/handshake functions, any fee-config functions) added with its real replacement and owning `05-execution` phase, exactly like the original table's format
6. `docs/PROGRESS.md` and `docs/06-frontend-build/README.md` both reflect FE-08 through FE-11 as complete, and the decision log has the pivot recorded (if not already done when the docs were first edited)

---

## Step-by-step

1. **End-to-end walkthrough.** In one session, across `apps/marketing`, `apps/dashboard` (both its internal-ops and organizer-facing parts), `apps/web`, and `apps/scanner`: register a test organizer → approve it → confirm provisioning → build a minimal event via the `FE-04` wizard → issue a gate-staff credential → confirm it logs into the scanner → buy a mock pass on `apps/web` (confirm `<FeeBreakdown>` is correct) → scan that pass on `apps/scanner` and confirm a real (not stubbed) verdict. Fix anything that breaks along the way.
2. **State/error audit on the new surfaces.** Walk `apps/marketing`'s registration flow and `apps/dashboard`'s `/internal/tenants` area specifically — these are the newest, least-tested screens — and confirm every async action (submit, approve, reject, credential issuance) has a real loading state and a real, specific error state, per `ux-principles.md` rules 5–7.
3. **Doc-vs-build drift check.** Re-read `product-spec.md §0/§2/§5.0-5.2`, `user-flows.md §0/F0`, and `manharevents-screen-specs.md §0/§1.1/§1.4/§2.4` against the actual running apps. Where the build is right and the doc is stale, fix the doc. Where the doc is right and the build drifted, fix the build. Note which happened, briefly, in the `PROGRESS.md` decision log.
4. **`data-model.md` review.** Read the existing Postgres schema. Decide whether `TenantApplication` needs its own table (likely: `tenant_applications`, distinct from `tenants` — an application precedes a tenant existing) and add that table's shape to `data-model.md` if so, following the same conventions (RLS note, column list) as every other table there. This is a documentation update, not a migration — no real database exists yet.
5. **Update `HANDOFF-TO-BACKEND.md`.** Add rows for every mock function introduced in `FE-08` and `FE-10` (application CRUD, approval/rejection, provisioning trigger, gate-staff credential issuance and the scanner-side handshake, any fee-config function), following the exact table format the original `FE-07` version used. State plainly which `05-execution` phase should own wiring each one for real (most likely a new or extended phase near `P-02`/`P-03`, since tenant onboarding sits early in that track — check `05-execution/README.md`'s phase index before assuming a phase number).
6. **Update `PROGRESS.md` and `06-frontend-build/README.md`.** Mark FE-08–FE-11 with honest ✅/🔵/🔴 status (not all ✅ by default — only what's actually verified with evidence, per doc rule 7 in `00-START-HERE.md`). Add FE-08–FE-11 rows to `06-frontend-build/README.md`'s phase index table if they aren't already there.
7. **Final sanity check on a real phone and a real laptop**, same as `FE-07` required — the registration flow (`apps/marketing`) and the scanner handshake (`apps/dashboard` → `apps/scanner`) are the newest paths and deserve the same real-device check the original track gave the public site and scanner.

---

## Files created

```
(No new routes.) Updates to:
docs/06-frontend-build/HANDOFF-TO-BACKEND.md
docs/03-architecture/data-model.md          (only if TenantApplication needs a new table entry)
docs/PROGRESS.md
docs/06-frontend-build/README.md
```

---

## Acceptance criteria

- [ ] The full register → approve → provision → build event → issue scanner access → buy → scan loop completes without a broken step, across all four apps, in one sitting
- [ ] Every async action introduced in `FE-08`/`FE-10` has a verified loading state and a verified, specific error state
- [ ] `product-spec.md`, `user-flows.md`, and `manharevents-screen-specs.md` match the actual build with no unresolved drift — anything fixed is noted in `PROGRESS.md`'s decision log
- [ ] `data-model.md` has a documented decision (either a new `tenant_applications` table shape, or an explicit note on why it's deferred) — not silence
- [ ] `HANDOFF-TO-BACKEND.md` lists every `FE-08`/`FE-10` mock function with its real replacement and owning phase
- [ ] `PROGRESS.md` and `06-frontend-build/README.md` both show FE-08–FE-11 with honest, evidence-backed status
- [ ] The full loop has been run once on a real phone and once on a real laptop

## Definition of Done

ManharEvent's pivoted frontend — company site, registration, internal approval, per-organizer event site, admin panel, and scanner — can be demoed end to end, on real devices, with every state honest about what's mock and what isn't, and a clear, accurate, up-to-date map exists for exactly what a real backend needs to replace, phase by phase, to make the pivot real.

---

## Claude Code prompt

> Follow `docs/06-frontend-build/FE-11-pivot-verification-reconciliation.md` step by step. Run the full pivoted loop end to end across `apps/marketing`, `apps/dashboard` (internal ops + organizer-facing), `apps/web`, and `apps/scanner` — register → approve → provision → build an event → issue scanner access → buy a pass → scan it — and fix anything that breaks. Audit empty/loading/error states on everything built in `FE-08`/`FE-10`. Check `docs/02-product/product-spec.md`, `docs/02-product/user-flows.md`, and `docs/04-design/manharevents-screen-specs.md` against the actual build and fix whichever side drifted. Decide whether `TenantApplication` needs a new table in `docs/03-architecture/data-model.md` and document that decision. Update `docs/06-frontend-build/HANDOFF-TO-BACKEND.md` with every new mock function from `FE-08`/`FE-10` and its owning `05-execution` phase. Update `docs/PROGRESS.md` and `docs/06-frontend-build/README.md` with honest ✅/🔵/🔴 status for FE-08–FE-11. Do not make the database-connection decision itself — just produce the accurate map, same as `FE-07` did for the original track. End green: `pnpm lint && pnpm typecheck && pnpm build`.
