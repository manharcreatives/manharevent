# Design System — Tokens

**Source:** Extracted from `/_next/static/chunks/0reyyc-0w9.tw.css` (205,504 bytes)

---

## 1. CSS Custom Properties (Design Tokens)

### Theme Variables (HSL — light mode / dark mode)

```css
:root {
  /* Primary Brand Color */
  --primary: 163.8 93% 33.1%;              /* Teal/Green — approx #007C62 */
  --primary-foreground: 210 40% 98%;        /* White */

  /* Secondary */
  --secondary: 210 40% 96.1%;              /* Light gray-blue */
  --secondary-foreground: 210 40% 98%;      /* White */

  /* Accent */
  --accent: 216 34% 17%;                    /* Dark navy */
  --accent-foreground: 210 40% 98%;         /* White */

  /* Background */
  --background: 0 0% 96.5%;                 /* Off-white #F7F8FA */
  --foreground: 213 31% 91%;                /* Light text */

  /* Card */
  --card: 0 0% 100%;                        /* White */
  --card-foreground: 213 31% 91%;

  /* Muted */
  --muted: 220 14.3% 95.9%;                /* Very light gray */
  --muted-foreground: 215 20.2% 65.1%;      /* Gray text */

  /* Border */
  --border: 214.3 31.8% 91.4%;             /* Light gray border */
  --input: 214.3 31.8% 91.4%;
  --ring: 215 20.2% 65.1%;

  /* Destructive */
  --destructive: 0 100% 50%;                /* Red */
  --destructive-foreground: 210 40% 98%;

  /* Popover */
  --popover: 0 0% 100%;
  --popover-foreground: 215 20.2% 65.1%;

  /* Chart Colors */
  --chart-1: #1447e6;
  --chart-2: #009588;
  --chart-3: #104e64;
  --chart-4: #ac4bff;
  --chart-5: #f99c00;

  /* Radius */
  --radius: 0.5rem;

  /* Custom Brand */
  --button-secondary: 0 0% 90%;
  --hover: 0 0% 60%;
  --menu-highlight: 211 100% 38%;           /* Blue highlight for active menu */
  --placeholder-foreground: 0 0% 70%;
}
```

### Dark Mode Overrides

```css
@media (prefers-color-scheme: dark) {
  --accent: 217, 13%, 82%;
  --accent-foreground: 222.2, 47.4%, 11.2%;
  --background: 224, 71%, 4%;              /* Near-black #0A1B15 */
  --border: 216, 34%, 17%;
  --card: 224, 71%, 4%;
  --card-foreground: 222.2, 47.4%, 11.2%;
  --destructive: 0, 63%, 31%;
  --foreground: 222.2, 47.4%, 11.2%;
  --input: 216, 34%, 17%;
  --muted: 223, 47%, 11%;
  --muted-foreground: 215.4, 16.3%, 56.9%;
  --popover: 224, 71%, 4%;
  --popover-foreground: 222.2, 47.4%, 11.2%;
  --primary: 210, 40%, 98%;
  --primary-foreground: 222.2, 47.4%, 1.2%;
  --ring: 216, 34%, 17%;
  --secondary: 222.2, 47.4%, 11.2%;
  --secondary-foreground: 210, 40%, 98%;
  --chart-1: #f05100;
  --chart-2: #00bb7f;
  --chart-3: #f99c00;
  --chart-4: #fcbb00;
  --chart-5: #ff2357;
}
```

---

## 2. Color Palette (Deduplicated)

### Brand Colors
| Token | Hex (approx) | Usage |
|-------|-------------|-------|
| Primary | `#007C62` (163.8 93% 33.1%) | Primary buttons, links, brand accents |
| Primary Dark | `#003E2F` | Hover state for primary |
| Menu Highlight | `#0055FF` (211 100% 38%) | Active menu item background |

### Background Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#F7F8FA` | Page background (light mode) |
| Card | `#FFFFFF` | Card surfaces |
| Muted | `#F1F5F9` | Subtle backgrounds |
| Dark BG | `#0A1B15` | Dark mode background |

### Text Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Foreground | `#E0E1E0` | Primary text (light mode) |
| Muted FG | `#737373` | Secondary/muted text |
| Placeholder FG | `#B3B3B3` | Input placeholders |
| White | `#FFFFFF` | Text on dark backgrounds |

### Border Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Border | `#E0E1E0` | Default borders (light) |
| Input Border | `#E0E1E0` | Input field borders |
| Dark Border | `#2D2D2D` | Dark mode borders |

### Status / Feedback Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Destructive | `#FF0000` | Error states, destructive actions |
| Success | `#00A67E` | Success states |
| Warning | `#F99C00` | Warning states |
| Info | `#1447E6` | Informational messages |

### Chart Colors
| Token | Hex (Light) | Hex (Dark) |
|-------|-------------|------------|
| Chart 1 | `#1447E6` | `#F05100` |
| Chart 2 | `#009588` | `#00BB7F` |
| Chart 3 | `#104E64` | `#F99C00` |
| Chart 4 | `#AC4BFF` | `#FCBB00` |
| Chart 5 | `#F99C00` | `#FF2357` |

---

## 3. Typography

### Font Families
| Token | Value | Usage |
|-------|-------|-------|
| Default | `ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji` | Body text |
| Inter | `Inter:Regular, sans-serif` | App custom font |
| Monospace | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace` | Code blocks |

### Font Sizes
| Token | Value | Usage |
|-------|-------|-------|
| xs | `0.75rem` (12px) | Small text, labels |
| sm | `0.875rem` (14px) | Secondary text |
| base | `1rem` (16px) | Body text |
| lg | `1.125rem` (18px) | Large body |
| xl | `1.25rem` (20px) | Subheadings |
| 2xl | `1.5rem` (24px) | Section headings |
| 3xl | `1.875rem` (30px) | Page headings |
| 4xl | `2.25rem` (36px) | Hero headings |

### Font Weights
| Token | Value | Usage |
|-------|-------|-------|
| Normal | 400 | Body text |
| Medium | 500 | Labels, emphasis |
| Semibold | 600 | Headings, buttons |
| Bold | 700 | Strong emphasis |
| Extrabold | 800 | Display headings |
| Black | 900 | Maximum emphasis |

### Line Heights
| Token | Value | Usage |
|-------|-------|-------|
| Tight | 1.25 | Headings |
| Normal | 1.5 | Body text |
| Relaxed | 1.625 | Long-form reading |
| Loose | 1.75 | Spacious layouts |

---

## 4. Spacing & Layout

### Breakpoints
| Name | Min-Width | Usage |
|------|-----------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |
| 2xl | 1536px | Extra large |
| Custom | 1300px | Custom breakpoint |
| Custom | 1350px | Custom breakpoint |

### Border Radius
| Token | Value |
|-------|-------|
| Default | `0.5rem` (8px) |
| Full | `9999px` (pill shape) |

### Shadows
```css
--shadow-elevated: /* Referenced but defined in another CSS file */
/* Shadow values found: */
0 1px 3px rgba(0,0,0,0.1)
0 4px 6px rgba(0,0,0,0.1)
0 10px 15px rgba(0,0,0,0.1)
0 20px 25px rgba(0,0,0,0.15)
```

---

## 5. External Typography Variables (Referenced but defined elsewhere)

These variables are referenced in the CSS but defined in a separate design system or JS:

```css
--action-text-regular-font-size
--h4-bold-font-size
--h4-bold-font-style
--h4-bold-font-weight
--h4-bold-letter-spacing
--h4-bold-line-height
--helper-text-font-size
--helper-text-letter-spacing
--helper-text-line-height
--input-text-font-weight
--input-text-letter-spacing
--label-regular-font-size
--label-regular-font-style
--label-regular-font-weight
--label-regular-letter-spacing
--label-regular-line-height
--paragraph-font-size
--paragraph-font-style
--paragraph-font-weight
--paragraph-letter-spacing
--paragraph-line-height
--typography-base-sizes-2x-large-font-size  /* fallback: 24px */
```

---

## 6. Animations

### Keyframes
| Name | Duration | Easing | Description |
|------|----------|--------|-------------|
| `bounce` | 1s infinite | cubic-bezier(.8,0,1,1) / (0,0,.2,1) | Bouncing effect |
| `pulse` | 2s infinite | cubic-bezier(.4,0,.6,1) | Pulsing opacity |
| `spin` | 1s linear infinite | — | 360deg rotation (loaders) |
| `caret-blink` | 1.25s ease-out infinite | — | Text cursor blink |
| `ticker-scroll` | var(--ticker-duration, 20s) linear infinite | — | Scrolling ticker/marquee |
| `mobile-sheet-slide-up` | 0.4s cubic-bezier(.32,.72,0,1) | ease-out | Mobile bottom sheet open |
| `mobile-sheet-slide-down` | 0.3s ease-in | — | Mobile bottom sheet close |
| `otp-column-up` | — | — | OTP wheel animation up |
| `otp-column-down` | — | — | OTP wheel animation down |
| `enter` | — | — | Framer-motion enter state |
| `exit` | — | — | Framer-motion exit state |
