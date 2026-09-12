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

export default nextConfig;
