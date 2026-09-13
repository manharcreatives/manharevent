import type { NextConfig } from "next";
import path from "path";

/**
 * Security headers for the gate scanner.
 *
 * The CSP is Report-Only, on purpose and not as a placeholder. Next's static
 * output carries its own inline bootstrap scripts (`self.__next_f.push(...)`)
 * on every page; a nonce cannot be minted for those without opting the whole app
 * into dynamic rendering, and a hash list would have to be regenerated on every
 * build. So the policy below is published in report mode — it names exactly what
 * the app is allowed to reach, violations are visible, and the day this gets a
 * server (P-12) it flips to enforcing with a per-request nonce. Every other
 * header here is enforced today.
 *
 * The scanner differs from the other three apps in one line: `camera=(self)`.
 * It is the only surface that legitimately opens a camera.
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // See above — dropped the day this renders behind a server that can nonce.
  "script-src 'self' 'unsafe-inline'",
  // Tailwind v4 and the design tokens both emit inline style attributes.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // blob: is the camera stream feeding the <video> element.
  "media-src 'self' blob:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // `upgrade-insecure-requests` is deliberately absent: browsers ignore it in a
  // report-only policy and log a warning for it on every page load. It goes back
  // in the day this policy is enforced.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
  // Two years, subdomains included — the camera does not work off HTTPS anyway.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=(self)",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "accelerometer=()",
      "gyroscope=()",
      "interest-cohort=()",
    ].join(", "),
  },
  // An internal gate tool has no business in a search index. Also set in the
  // root layout's metadata and in app/robots.ts.
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Naming the framework and its version in every response buys an attacker a
  // free CVE lookup and buys us nothing.
  poweredByHeader: false,
  transpilePackages: [
    "@manhar-garba/ui",
    "@manhar-garba/domain",
    "@manhar-garba/mock-data",
  ],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Wrap with Serwist in production builds only
async function buildConfig(): Promise<NextConfig> {
  if (process.env.NODE_ENV === "development") return nextConfig;
  const withSerwistInit = (await import("@serwist/next")).default;
  const withSerwist = withSerwistInit({
    swSrc: "src/sw.ts",
    swDest: "public/sw.js",
    disable: false,
    // Default is true: serwist reloads the whole app the moment the network
    // returns. On a gate phone that is a page reload triggered by exactly the
    // event most likely to happen mid-shift, in the middle of a queue.
    reloadOnOnline: false,
    // Cache the RSC payloads behind next/link so moving between the camera, the
    // manual keypad and the log keeps working with no network.
    cacheOnNavigation: true,
  });
  return withSerwist(nextConfig);
}

export default buildConfig();
