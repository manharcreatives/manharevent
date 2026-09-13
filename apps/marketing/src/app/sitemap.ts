import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/seo";

/** Only the two pages an organizer can land on cold. The register funnel is
 *  session state, not content — it is `noindex` and stays out of the sitemap. */
const INDEXABLE_PATHS = ["/", "/pricing"] as const;

function href(path: string, locale: string) {
  const clean = path === "/" ? "" : path;
  return locale === routing.defaultLocale
    ? `${BASE_URL}${clean || "/"}`
    : `${BASE_URL}/${locale}${clean}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: href(path, locale),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [
            l === "gu" ? "gu-IN" : l === "hi" ? "hi-IN" : "en-IN",
            href(path, l),
          ])
        ),
      },
    }))
  );
}
