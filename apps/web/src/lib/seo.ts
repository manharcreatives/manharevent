import { routing } from "@/i18n/routing";

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://manharevent.com";

/**
 * Build canonical + hreflang alternates for a path.
 *
 * `localePrefix: "as-needed"` means the default locale (en) is served without a
 * prefix, so `/book` and `/hi/book` are the same page in two languages. Search
 * engines need that stated explicitly or they treat them as duplicates.
 */
export function localeAlternates(path: string, currentLocale: string) {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  const href = (locale: string) =>
    locale === routing.defaultLocale ? `${BASE_URL}${clean || "/"}` : `${BASE_URL}/${locale}${clean}`;

  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale === "gu" ? "gu-IN" : locale === "hi" ? "hi-IN" : "en-IN"] = href(locale);
  }
  languages["x-default"] = href(routing.defaultLocale);

  return { canonical: href(currentLocale), languages };
}

/** Absolute URL for a path in a given locale — used by JSON-LD. */
export function absoluteUrl(path: string, locale: string = routing.defaultLocale) {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return locale === routing.defaultLocale ? `${BASE_URL}${clean || "/"}` : `${BASE_URL}/${locale}${clean}`;
}
