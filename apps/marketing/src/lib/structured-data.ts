import { BASE_URL } from "@/lib/seo";

/**
 * Stable @ids so the graph on one page can reference the graph on another —
 * Google treats `#organization` on /pricing and on / as the same entity.
 */
export const ORG_ID = `${BASE_URL}/#organization`;
export const SITE_ID = `${BASE_URL}/#website`;

type JsonLdValue = Record<string, unknown>;

/** Serialises for a <script type="application/ld+json">. `<` is escaped so a
 *  stray string can never close the script tag early. */
export function jsonLdHtml(value: JsonLdValue | JsonLdValue[]) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function organizationNode(locale: string): JsonLdValue {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "ManharEvent",
    url: BASE_URL,
    logo: `${BASE_URL}/brand/manharevent-icon-square-512.png`,
    description:
      "Ticketing and gate-entry software for Garba and Navratri organizers in Gujarat, India.",
    parentOrganization: { "@type": "Organization", name: "Manhar Creatives" },
    areaServed: { "@type": "Country", name: "India" },
    knowsLanguage: ["en-IN", "gu-IN", "hi-IN"],
    inLanguage: locale,
  };
}

export function websiteNode(locale: string, name: string): JsonLdValue {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: BASE_URL,
    name,
    publisher: { "@id": ORG_ID },
    inLanguage: locale,
  };
}

/** The product itself. `offers` carries the real fee, so the rate quoted in
 *  search results can never drift from `computeFees`. */
export function softwareApplicationNode(params: {
  locale: string;
  name: string;
  description: string;
  platformFeePercent: string;
}): JsonLdValue {
  return {
    "@type": "SoftwareApplication",
    "@id": `${BASE_URL}/#software`,
    name: params.name,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Event ticketing",
    operatingSystem: "Web, Android",
    url: BASE_URL,
    inLanguage: params.locale,
    description: params.description,
    publisher: { "@id": ORG_ID },
    offers: {
      "@type": "Offer",
      // No licence fee — the platform is paid for out of a per-transaction cut.
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/pricing`,
      description: `${params.platformFeePercent} platform fee per pass sold. No setup fee, no monthly fee. The payment gateway's fee is quoted separately.`,
    },
  };
}

export function faqPageNode(faqs: { q: string; a: string }[]): JsonLdValue {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function breadcrumbNode(items: { name: string; path: string }[]): JsonLdValue {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
    })),
  };
}

/** Wraps nodes in the single `@graph` a page should emit. */
export function graph(nodes: JsonLdValue[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
