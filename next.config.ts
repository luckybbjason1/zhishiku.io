import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // better-sqlite3 and pdf-parse are native/CJS modules; run server-side only
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],
};

export default nextConfig;
