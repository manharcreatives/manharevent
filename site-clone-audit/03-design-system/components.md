# Design System — Reusable Components

**Source:** Extracted from JS bundles and CSS analysis of `dashboard-manhar.ticmint.com`

---

## 1. Brand Logo Component (`BrandLogo`)

**Properties:** White-label support via `useWhiteLabel()` hook  
**Assets:**
- `brand-logo.svg` — Full logo
- `brand-logo-sm.svg` — Small/compact logo
- `brand-logo-white.svg` — White variant for dark backgrounds

**Usage:** Header, auth screens, sidebar

---

## 2. Auth Card Container (`rY` component)

**Structure:**
```
┌──────────────────────────────────┐
│  [BrandLogo]                     │
│                                  │
│  [Dynamic Screen Content]        │
│  (email → password/OTP → org)    │
│                                  │
│  [Legal Text / Links]            │
│  "By clicking continue..."       │
└──────────────────────────────────┘
```

**Styling:** Centered card on page, likely with background image or color

---

## 3. Input Component (shadcn/ui)

**Type:** Custom input with label support  
**Properties:**
- Type variants: text, email, password
- Error state with validation messages
- Placeholder support
- Label via `Label` component

**Validation Pattern:**
- On blur validation
- Enter key submits form

---

## 4. InputOTP Component

**Type:** 6-digit OTP input  
**Sub-components:**
- `InputOTP` — Container
- `InputOTPGroup` — Groups digits (e.g., 3-3)
- `InputOTPSlot` — Individual digit slot
- `InputOTPSeparator` — Separator between groups (typically `-`)

**Animation:** OTP column up/down wheel animation

---

## 5. Button Component (shadcn/ui)

**Variants detected:**
| Variant | Style | Usage |
|---------|-------|-------|
| Primary | Teal/green background (#007C62), white text, rounded-md | Main CTAs |
| Secondary | Light gray background, dark text | Alternative actions |
| Ghost | Transparent, text only | Tertiary actions |
| Link | Styled as hyperlink | Navigation links |
| Destructive | Red background | Danger actions |

**States:**
- Default
- Hover (opacity/color shift)
- Focus (ring outline)
- Loading (spinner + text change, e.g., "Signing in...")
- Disabled (reduced opacity)

---

## 6. Toaster (Toast Notifications)

**Library:** Likely `sonner` or `react-hot-toast`  
**Component:** `Toaster` (rendered globally in root layout)  
**Usage:** Success/error/info notifications

---

## 7. Freshchat Widget

**Type:** Third-party customer support chat widget  
**Component:** `FreshchatWidget` (rendered globally)  
**Provider:** Freshworks Freshchat

---

## 8. Tiptap Rich Text Editor

**Library:** Tiptap  
**CSS:** `0s~p6y5geym3q.css`  
**Features:**
- Headings (H1: 1.5rem, H2: 1.25rem, H3: 1.125rem)
- Code blocks (monospace font)
- Placeholder text (`#adb5bd`)
- Scroll-hiding scrollbar utility
- Image support (with shadow)

**Usage:** Likely for event descriptions, content editing

---

## 9. React Grid Layout

**Library:** react-grid-layout  
**CSS:** `03yr30dkhy-4x.css`  
**Features:**
- Draggable grid items
- Resizable panels
- Drag handles (CSS resize grip)
- Responsive breakpoints

**Usage:** Dashboard widget layout, customizable panels

---

## 10. KaTeX Math Renderer

**Library:** KaTeX 0.16.22  
**CSS:** `13f_ms-df~6gd.css`  
**Fonts:** 18 @font-face declarations (AMS, Caligraphic, Fraktur, Main, Math, SansSerif, Script, Size1-4, Typewriter)

**Usage:** Mathematical formula rendering in content

---

## 11. React Tweet Embed

**Library:** react-tweet  
**CSS:** `13f_ms-df~6gd.css`  
**Theme:** `.react-tweet-theme` with light/dark/prefers-color-scheme variants  
**Custom CSS vars:** `--tweet-font-color`, `--tweet-border`, `--tweet-bg-color`, etc.

**Usage:** Embedding Twitter/X posts in event content

---

## 12. Eye/EyeOff Toggle

**Type:** Password visibility toggle icons  
**Usage:** Password input fields on auth screens

---

## 13. Label Component (shadcn/ui)

**Type:** Form label  
**Properties:**
- Links to input via `htmlFor`
- Error state styling
- Required indicator

---

## 14. Link Component (Next.js)

**Type:** Client-side navigation  
**External variants:** Target `_blank` for terms/privacy links

---

## 15. Modal / Dialog

**Library:** Radix UI (inferred from `--radix-*` CSS variables in stylesheet)  
**Usage:** Confirmations, settings panels

---

## 16. Select / Dropdown

**Library:** Radix UI (inferred)  
**Usage:** Organization selection, settings

---

## 17. Spinner / Loading

**Animation:** `spin` keyframe (1s linear infinite, 360deg)  
**Usage:** Button loading states, page transitions

---

## Component Library Summary

| Component | Source | Pattern |
|-----------|--------|---------|
| Button | shadcn/ui | Radix primitives + Tailwind |
| Input | shadcn/ui | Radix primitives + Tailwind |
| Label | shadcn/ui | Radix primitives + Tailwind |
| InputOTP | shadcn/ui | Custom OTP component |
| Dialog/Modal | shadcn/ui | Radix Dialog |
| Select | shadcn/ui | Radix Select |
| Toast | shadcn/ui | Sonner |
| BrandLogo | Custom | White-label support |
| Tiptap | Third-party | Rich text editing |
| Grid Layout | Third-party | Dashboard panels |
| KaTeX | Third-party | Math rendering |
| React Tweet | Third-party | Twitter embeds |
