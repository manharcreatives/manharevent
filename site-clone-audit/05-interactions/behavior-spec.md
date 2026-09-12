# Interactions & Behavior Specification

**Target:** `https://dashboard-manhar.ticmint.com/`

---

## 1. Auth Flow Transitions

### Email → Password/OTP Screen
- **Trigger:** Email form submission
- **Transition:** Screen replacement with slide/fade animation
- **Loading state:** Button shows spinner + "Verifying..."
- **Duration:** Approximately 300ms

### Password ↔ OTP Toggle
- **Trigger:** "Sign in with a code" link
- **Transition:** Inline form swap

### OTP Resend Timer
- **Behavior:** Countdown from configurable seconds (typically 30s or 60s)
- **Display:** "Resend code in {P}s"
- **Timer variable:** `--ticker-duration` (fallback: 20s)
- **Animation:** `caret-blink` keyframe (1.25s ease-out infinite)

### Organization Selection
- **Trigger:** After successful OTP/password with multiple orgs
- **Transition:** New screen appears

---

## 2. OTP Input Animations

### OTP Column Scroll
- **Keyframes:**
  - `otp-column-up`: translateY(0) → translateY(calc(-50% - 20px))
  - `otp-column-down`: translateY(calc(-50% - 20px)) → translateY(0)
- **Effect:** Wheel/scroll animation for digit selection

---

## 3. Mobile Bottom Sheet

### Slide Up (Open)
- **Keyframe:** `mobile-sheet-slide-up`
- **Duration:** 0.4s
- **Easing:** `cubic-bezier(0.32, 0.72, 0, 1)` — smooth deceleration
- **Direction:** From bottom (translateY(100%) → translateY(0))

### Slide Down (Close)
- **Keyframe:** `mobile-sheet-slide-down`
- **Duration:** 0.3s
- **Easing:** `ease-in` — quick acceleration
- **Direction:** To bottom (translateY(0) → translateY(100%))

---

## 4. Page Transitions (Framer Motion)

### Enter Animation
- **Keyframe:** `enter`
- **Default values:**
  - opacity: 1
  - translateX: 0
  - translateY: 0
  - scale: 1
  - rotate: 0
- **Configurable:** Via `--tw-enter-*` CSS variables
- **Common config:** scale(0.95) on enter

### Exit Animation
- **Keyframe:** `exit`
- **Default values:** Same as enter
- **Common config:** opacity 0 on exit

### Common Transition Presets
| Preset | Enter | Exit |
|--------|-------|------|
| Fade | opacity 0→1 | opacity 1→0 |
| Scale | scale(.95)→1 | scale 1→.95 |
| Slide Right | translateX(-.5rem)→0 | — |
| Slide Left | translateX(.5rem)→0 | — |
| Slide Up | translateY(.5rem)→0 | — |
| Slide Down | translateY(-.5rem)→0 | — |

---

## 5. Button Interactions

### Hover State
- **Color shift:** `--hover: 0 0% 60%` (darkens on hover)
- **Background opacity:** Reduced or darkened

### Focus State
- **Ring outline:** `--ring` color with 2px offset
- **Ring color:** `hsl(var(--ring) / 0.5)`

### Loading State
- **Spinner animation:** `spin` keyframe (1s linear infinite)
- **Text replacement:** e.g., "Continue" → "Signing in..."
- **Disabled:** Prevents double-click

### Disabled State
- **Opacity:** Reduced (typically 0.5-0.7)
- **Pointer events:** none

---

## 6. Ticker / Marquee Animation

### Scroll Effect
- **Keyframe:** `ticker-scroll`
- **Duration:** `var(--ticker-duration, 20s)`
- **Timing:** linear infinite
- **Behavior:** Content scrolls left, pauses, then resets
  - 0-20%: translate(0) — pause at start
  - 80%: translate(-105%) — scrolled fully
  - 80.01%-100%: translate(0) — instant reset

---

## 7. Generic Utility Animations

### Bounce
- **Keyframe:** `bounce`
- **Duration:** 1s infinite
- **Easing:** cubic-bezier(.8,0,1,1) / (0,0,.2,1)
- **Transform:** translateY(-25%)

### Pulse
- **Keyframe:** `pulse`
- **Duration:** 2s infinite
- **Easing:** cubic-bezier(.4,0,.6,1)
- **Effect:** opacity 0.5 at 50%

### Spin
- **Keyframe:** `spin`
- **Duration:** 1s linear infinite
- **Transform:** rotate(360deg)

### Caret Blink
- **Keyframe:** `caret-blink`
- **Duration:** 1.25s ease-out infinite
- **Effect:** opacity toggles (0 at 20%/50%, 1 at 0%/70%/100%)

---

## 8. React Grid Layout Interactions

### Drag
- **Handle:** Resize grip (CSS pseudo-element)
- **Ghost element:** Semi-transparent preview during drag
- **Opacity:** 0.302 during drag

### Resize
- **Handle:** Corner resize handle
- **Cursor:** `nwse-resize` (or similar)
- **Constraint:** Min/max size from grid config

---

## 9. Tiptap Editor Interactions

### Focus
- **Outline:** Border highlight on focus
- **Placeholder:** Gray text (#adb5bd) when empty

### Toolbar
- **Toggle states:** Active/inactive button styling
- **Dropdown menus:** For heading levels, text alignment

### Content
- **Images:** Shadow on embedded images (`#0000001a`)
- **Code blocks:** Monospace font, background highlight
- **Headings:** Size scale (H1: 1.5rem, H2: 1.25rem, H3: 1.125rem)

---

## 10. Scrollbar Behavior

### Custom Scrollbar
- **Class:** `.scrollbar-hide`
- **Effect:** Hidden scrollbar on webkit browsers
- **Usage:** Tiptap editor, scrollable containers

### Scroll Snap
- **Mode:** `mandatory` or `proximity`
- **Usage:** Carousel/slider sections

---

## 11. Password Visibility Toggle

### States
- **Default:** Eye icon (password hidden)
- **Toggled:** EyeOff icon (password visible)
- **Transition:** Instant icon swap (no animation)

---

## 12. Form Validation UX

### Per-Field Validation
- **Trigger:** onBlur
- **Display:** Red border + error message below field
- **Timing:** Immediate after first blur

### Submit Validation
- **Trigger:** Form submission / Enter key
- **Display:** All errors shown simultaneously
- **Loading:** Spinner on submit button

### Zod Schema Errors
- **Pattern:** `{field}: "{message}"` format
- **Toast:** Error toast via Toaster component for API errors

---

## 13. Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled or simplified */
}
```

The CSS includes `prefers-reduced-motion: reduce` media query support.

---

## 14. Dark Mode

### Detection
- **Method:** `prefers-color-scheme: dark` media query
- **CSS variables:** All theme tokens have dark mode overrides
- **Transition:** Automatic based on OS preference

---

## 15. Print Styles

### Media Query
```css
@media print {
  /* Print-specific overrides */
}
```

Print styles are included in the Tailwind CSS output.
