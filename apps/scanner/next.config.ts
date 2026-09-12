import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: [
    "@manhar-garba/ui",
    "@manhar-garba/domain",
    "@manhar-garba/mock-data",
  ],
};

// Wrap with Serwist in production builds only
async function buildConfig(): Promise<NextConfig> {
  if (process.env.NODE_ENV === "development") return nextConfig;
  const withSerwistInit = (await import("@serwist/next")).default;
  const withSerwist = withSerwistInit({
    swSrc: "src/sw.ts",
    swDest: "public/sw.js",
    disable: false,
  });
  return withSerwist(nextConfig);
}

export default buildConfig();
