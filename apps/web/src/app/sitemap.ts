import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://manharevent.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/e/manhar-navratri-2026`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/e/manhar-navratri-2026/lineup`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/e/manhar-navratri-2026/venue`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/e/manhar-navratri-2026/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
      url: `${BASE}/e/manhar-navratri-2026/night/${n}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${BASE}/artist/kirtidan-gadhvi`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/artist/osman-mir`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/artist/aishwarya-majmudar`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/legal/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/refund-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];
}
