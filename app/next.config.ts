import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // native / filesystem-dependent packages must not be bundled
  serverExternalPackages: ["@electric-sql/pglite", "@node-rs/argon2", "@react-pdf/renderer", "pg"],
  // ensure the certificate PDF route can read the brand mark from disk on Vercel
  // (files in public/ are otherwise not guaranteed to be in the serverless bundle)
  outputFileTracingIncludes: {
    "/api/certificates/[trackId]/pdf": ["./public/logo-hand-gold.png"],
  },
};

export default nextConfig;
