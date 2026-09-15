import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Admins can point a product/game image at any https URL.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // Generated placeholder art (public/games, public/products) is SVG.
    // Safe to allow here since these are build-time assets we generate
    // ourselves, never user-uploaded content.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
