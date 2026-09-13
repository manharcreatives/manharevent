import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Security headers.
 *
 * The CSP is Report-Only on purpose, not as a placeholder. Every app injects an
 * inline theme script (`themeScript`) before paint to avoid a flash of the wrong
 * theme, and Next's static output adds its own inline bootstrap scripts on every
 * page. A nonce for those needs per-request rendering, and a hash list would have
 * to be regenerated every build — so the policy is published in report mode,
 * where it names exactly what the app may reach and makes violations visible,
 * and flips to enforcing with a nonce when this renders behind a server (P-12).
 * Every other header here is enforced today.
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Covers the inline theme script and Next's bootstrap — see above.
  "script-src 'self' 'unsafe-inline'",
  // Tailwind v4 and the design tokens both emit inline style attributes.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // `upgrade-insecure-requests` is deliberately absent: browsers ignore it in a
  // report-only policy and log a warning for it on every page load. It goes back
  // in the day this policy is enforced.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: [
      // Nothing here opens a camera or a mic; only apps/scanner does.
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "usb=()",
      "magnetometer=()",
      "accelerometer=()",
      "gyroscope=()",
      "interest-cohort=()",
    ].join(", "),
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Naming the framework and its version in every response buys an attacker
  // a free CVE lookup and buys us nothing.
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

export default withNextIntl(nextConfig);
