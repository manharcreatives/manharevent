import localFont from "next/font/local";

/**
 * Fonts are SELF-HOSTED (woff2 in ./files, sourced from @fontsource-variable).
 *
 * Why not next/font/google: fetching from Google Fonts at build time makes the
 * build depend on outbound network access (it fails in CI/offline sandboxes) and
 * adds a third-party origin at runtime. Self-hosting removes both, keeps the
 * fonts on our own origin for privacy, and lets us preload exactly what we need.
 *
 * All five are variable fonts, so one file covers the whole 100-900 weight range.
 */

export const inter = localFont({
  src: "./files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

export const bricolage = localFont({
  src: "./files/bricolage-grotesque-latin-wght-normal.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-bricolage",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "system-ui", "sans-serif"],
});

export const jetbrains = localFont({
  src: "./files/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  style: "normal",
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

// Loaded only when locale requires Gujarati — never ship to all visitors.
export const notoGujarati = localFont({
  src: "./files/noto-sans-gujarati-gujarati-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-noto-gujarati",
  display: "swap",
  preload: false,
  fallback: ["Shruti", "system-ui", "sans-serif"],
});

// Loaded only when locale requires Hindi.
export const notoDevanagari = localFont({
  src: "./files/noto-sans-devanagari-devanagari-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-noto-devanagari",
  display: "swap",
  preload: false,
  fallback: ["Nirmala UI", "system-ui", "sans-serif"],
});
