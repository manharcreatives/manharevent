import "./globals.css";

/**
 * Pass-through root layout — see `[locale]/layout.tsx` for the real document.
 * A layout above `[locale]` cannot read the locale param, and the previous
 * version's `getLocale()` resolved before the child's `setRequestLocale()`
 * during static generation, shipping `lang="hi"` on every English page.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
