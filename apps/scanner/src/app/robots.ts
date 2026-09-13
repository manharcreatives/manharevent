import type { MetadataRoute } from "next";

/**
 * The scanner must never be indexed. It is an internal gate tool; its URLs and
 * its 404 copy give away the shape of a live event, and nothing here is for a
 * search result. Enforced three ways: here, in the root layout's metadata, and
 * as an X-Robots-Tag response header in next.config.ts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
