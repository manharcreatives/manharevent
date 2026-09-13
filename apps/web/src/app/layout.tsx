import "./globals.css";

/**
 * Pass-through root layout.
 *
 * The real <html>/<body> live in `[locale]/layout.tsx`. They have to: this app
 * is localised with next-intl, and a layout above `[locale]` cannot read the
 * locale param. The previous version called `getLocale()` here, which during
 * static generation resolved before `setRequestLocale()` had run in the child
 * layout — so every statically generated English page shipped `lang="hi"` and
 * Hindi <title>s. Keeping <html> inside `[locale]` makes the locale a normal,
 * statically-known prop instead of ambient request state.
 *
 * Routes that live OUTSIDE `[locale]` (the root not-found and global-error
 * boundaries) render their own <html>/<body>.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
