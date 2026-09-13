import { routing } from "@/i18n/routing";

export const BASE_URL = process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://manharevent.com";

/** Canonical + hreflang alternates. `localePrefix: "as-needed"` means en has no prefix. */
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
