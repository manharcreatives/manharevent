# ManharEvent.com — Brand Assets

**Delivered by Utsav on 2026-09-12.** These are the only real brand assets in the project — everything else in `04-design/` describes tokens and layout, not the actual mark. Treat this folder as the source of truth; the copies under each app's `public/brand/` are convenience copies of the subset each app actually needs, not separate originals.

## Files

| File | What it is | Use it for |
|---|---|---|
| `manharevent-logo-master.jpg` | The original delivered file (4096×4096, full lockup + tagline, flattened onto a cream/paisley background) | Archival only — don't ship this one directly, it's the wrong aspect/size/background for almost every real placement |
| `manharevent-lockup-light-1600.png` | Icon + "ManharEvent.com" wordmark + "Powered by Manhar Creatives" tagline, tightly cropped, **cream background baked in** | Footer credit, an "About ManharEvent" page, anywhere already on a light/cream surface |
| `manharevent-icon-light-1024.png` | Icon mark only (the "M" emblem with the dandiya dancers and peacock feather), **cream background baked in** | Anywhere a background is required anyway — e.g. a social-profile avatar upload that doesn't accept transparency |
| `manharevent-icon-transparent-1024.png` | Icon mark only, **background removed programmatically** (not square — follows the mark's natural ~1.25:1 shape) | Dark-theme headers, anywhere the icon needs to sit on a non-cream surface. Verified to read clearly on the dark-theme background (`design-system.md §2`'s near-black surface) |
| `manharevent-icon-square-512.png` / `-192.png` | Icon mark, transparent, padded to a 1:1 square | App icons, PWA icons, anywhere a square asset is required |
| `manharevent-favicon-32.png` | Icon mark, transparent, 32×32 | Browser favicon |

## Known rough edges (background removal was automated, not hand-cut)

- The transparent versions were produced by a distance-based chroma-key against the sampled cream background, not by hand-cutting a vector source — there's no true vector/SVG original. Edges are generally clean but can show a very faint light fringe on close inspection at large sizes.
- There's a small stray red speck near the bottom-left of the square-padded icon (visible if you zoom in) — a minor artifact from the extraction, not part of the original design.
- If Utsav can get a native transparent PNG or SVG from whoever designed the logo, that should replace these derived versions — this folder's transparent files are a working substitute, not the ideal source.

## Naming note

The wordmark reads **"ManharEvent.com"** (singular "Event", domain baked into the name) — this superseded the earlier internal working name "Manharevents" everywhere in the docs as of 2026-09-12 (see `PROGRESS.md`'s decision log).

## Not done here (left for Claude Code CLI / a real build)

Actually wiring these into the running apps — `<head>` favicon links, Next.js `app/icon.png` / `apple-icon.png` conventions, `manifest.json` icon entries (the scanner PWA's `public/manifest.json` currently points at placeholder icons from FE-05 — those need to be swapped for `manharevent-icon-square-*.png`, not just have this folder dropped alongside them), and the actual `<header>`/nav component markup — is a code change, not an asset drop. It needs the dev environment to lint/typecheck/build and verify, so it's intentionally left as a Claude Code CLI task (see the prompt in `PROGRESS.md`'s decision log / the next `06-frontend-build` phase note) rather than done blind from here.
