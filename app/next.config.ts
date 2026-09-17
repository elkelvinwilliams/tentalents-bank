import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // native / filesystem-dependent packages must not be bundled
  serverExternalPackages: ["@electric-sql/pglite", "argon2", "@react-pdf/renderer", "pg"],
};

export default nextConfig;
