import type { NextConfig } from "next";

function getServerActionAllowedOrigins(): string[] {
  const defaults = ["localhost:3000", "127.0.0.1:3000"];
  const fromEnv = process.env.SERVER_ACTION_ALLOWED_ORIGINS;
  if (!fromEnv) return defaults;

  const extra = fromEnv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return [...defaults, ...extra];
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: getServerActionAllowedOrigins(),
    },
  },
};

export default nextConfig;
