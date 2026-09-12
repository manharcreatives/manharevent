// Tailwind v4 is CSS-first; this file documents the token contract
// consumed by @manhar-garba/ui/globals.css via @theme {}.
// Apps import globals.css — they do not need to reference this file at runtime.

export const manharPreset = {
  // Design token reference (read-only — actual values live in globals.css @theme)
  colors: {
    primary: "hsl(var(--primary))",
    accent: "hsl(var(--accent))",
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    destructive: "hsl(var(--destructive))",
    background: "hsl(var(--background))",
    surface: "hsl(var(--surface))",
    "zone-vip": "hsl(var(--zone-vip))",
    "zone-gold": "hsl(var(--zone-gold))",
  },
  fontFamily: {
    sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
    display: ["var(--font-bricolage)", "ui-sans-serif", "system-ui", "sans-serif"],
    mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
  },
} as const;
