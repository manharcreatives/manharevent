# Asset Manifest

**Target:** `https://dashboard-manhar.ticmint.com/`  
**Note:** Due to CSR-only rendering, most assets are loaded dynamically by JavaScript. The following is what could be discovered from the HTML/RSC payload and CSS analysis.

---

## Images

| # | Asset Name | Original URL | Dimensions | Alt Text | Used In |
|---|-----------|-------------|------------|----------|---------|
| 1 | brand-logo.svg | `/_next/static/media/brand-logo.svg` | TBD | Brand logo | Header, Auth |
| 2 | brand-logo-sm.svg | `/_next/static/media/brand-logo-sm.svg` | TBD | Small brand logo | Sidebar, compact views |
| 3 | brand-logo-white.svg | `/_next/static/media/brand-logo-white.svg` | TBD | White brand logo | Dark backgrounds |
| 4 | 1x1 pixel (data URI) | inline base64 PNG | 1x1 | — | `.lyt-activated:before` pseudo-element |

> **ACTION REQUIRED:** Full image inventory requires authenticated access + browser DevTools Network tab to capture dynamically-loaded images from API responses.

---

## Icons

**Icon libraries detected:**
- `Eye` / `EyeOff` — Password visibility toggle (likely from `lucide-react`)
- Standard Lucide icons (inferred from shadcn/ui usage)

> **ACTION REQUIRED:** Full icon inventory requires examining the `lucide-react` bundle or equivalent icon library.

---

## Fonts

### Loaded via CSS @font-face (KaTeX 0.16.22)

| Font Family | Weights | Formats | Source |
|-------------|---------|---------|--------|
| KaTeX_AMS | 400 | woff2, woff, ttf | KaTeX CDN/inline |
| KaTeX_Caligraphic | 400, 700 | woff2, woff, ttf | KaTeX CDN/inline |
| KaTeX_Fraktur | 400, 700 | woff2, woff, ttf | KaTeX CDN/inline |
| KaTeX_Main | 400, 700, 400i, 700i | woff2, woff, ttf | KaTeX CDN/inline |
| KaTeX_Math | 400, 700, 400i, 700i | woff2, woff, ttf | KaTeX CDN/inline |
| KaTeX_SansSerif | 400 | woff2, woff, ttf | KaTeX CDN/inline |
| KaTeX_Script | 400 | woff2, woff, ttf | KaTeX CDN/inline |
| KaTeX_Size1 | 400 | woff2, woff, ttf | KaTeX CDN/inline |
| KaTeX_Size2 | 400 | woff2, woff, ttf | KaTeX CDN/inline |
| KaTeX_Size3 | 400 | woff2, woff, ttf | KaTeX CDN/inline |
| KaTeX_Size4 | 400 | woff2, woff, ttf | KaTeX CDN/inline |
| KaTeX_Typewriter | 400 | woff2, woff, ttf | KaTeX CDN/inline |

### Application Font
| Font Family | Source | Usage |
|-------------|--------|-------|
| Inter:Regular | Likely loaded via Google Fonts or self-hosted (no @font-face found in main CSS) | Primary app font |

> **NOTE:** No `@font-face` declarations were found in the main Tailwind CSS file. The Inter font is likely loaded via a `<link>` tag or a separate CSS file not yet analyzed.

---

## CSS Files

| File | URL | Size | Purpose |
|------|-----|------|---------|
| Main Tailwind | `/_next/static/chunks/0reyyc-0w9.tw.css` | 205,504 bytes | Custom theme + utilities |
| Grid Layout | `/_next/static/chunks/03yr30dkhy-4x.css` | TBD | react-grid-layout |
| Tiptap | `/_next/static/chunks/0s~p6y5geym3q.css` | TBD | Rich text editor |
| KaTeX + Tweet | `/_next/static/chunks/13f_ms-df~6gd.css` | TBD | Math + Twitter embeds |

---

## JavaScript Chunks

| File | Size (approx) | Purpose |
|------|---------------|---------|
| `0mwylmw3gjvtu.js` | — | Main entry / RSC bootstrap |
| `turbopack-06.oejl1f4x49.js` | — | Turbopack runtime |
| `0qesfuwlj-858.js` | — | Runtime module |
| `0qcbsf4563io0.js` | — | Runtime module |
| `0tfxau8c~fd3q.js` | — | Runtime module |
| `0a~_p-ypx6jbh.js` | — | Shared chunk |
| `059.pqxrukrpx.js` | — | Shared chunk |
| `0v82u0h77zn97.js` | — | Shared chunk |
| `0ul-pcuu7byt2.js` | — | Shared chunk |
| `0p63i01m3c.si.js` | — | Shared chunk |
| `01krn.7ip90tf.js` | — | Shared chunk |
| `11ghw8k1rrgjv.js` | — | Shared chunk |
| `0.y89dshv2tmk.js` | — | Shared chunk |
| `10.9irdg42cw..js` | — | Shared chunk |
| `0079ftkqgg7xy.js` | — | Shared chunk |
| `0oc1mwg3dw._y.js` | — | Shared chunk |
| `0f0xi44jc2fab.js` | — | Shared chunk |
| `0h8ea52.j.8fg.js` | — | Shared chunk |
| `0fe7.~hrnhm2c.js` | — | Shared chunk |
| `02adcz0tp.mp8.js` | — | Shared chunk |
| `0gynlpzuc157x.js` | — | Shared chunk |
| `04lqrm6weshw..js` | — | Shared chunk |
| `10t9s889.mjvx.js` | — | Shared chunk |
| `0v95t8o1o_e9e.js` | — | Shared chunk |
| `0f72lvs7~9omg.js` | — | Shared chunk |
| `0fu-59yzuum5y.js` | — | Shared chunk |
| `0-dm060j48fjd.js` | — | react-hook-form |
| `16vaec51_m1xj.js` | — | Sign-in page |
| `03hzi.89d0sy8.js` | — | Label + zodResolver |
| `16192bcrhd~.z.js` | — | Sign-up page |
| `03~yq9q893hmn.js` | — | noModule polyfill |

---

## External Services (loaded via JS)

| Service | Component | Purpose |
|---------|-----------|---------|
| Mixpanel | `MixpanelRouteTracker`, `MixpanelIdentify`, `AnalyticsBootstrap` | Analytics |
| Freshchat | `FreshchatWidget` | Customer support chat |
| TICMint API | `DashboardAuthController` | Backend API |

---

> **ACTION REQUIRED:** To get a complete asset manifest:
> 1. Open browser DevTools → Network tab
> 2. Log in to the dashboard
> 3. Navigate through all pages
> 4. Filter by type (Images, Fonts, Media)
> 5. Export the full request list
