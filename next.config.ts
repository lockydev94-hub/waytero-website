import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Image domains for WayTero (MinIO, CDN, Cloudinary etc.)
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.waytero.com",
        pathname: "/**",
      },
      // Cloudinary — used by admin CMS media uploader
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Allow any https image source as fallback (logo_url set by admin)
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // ── SEO: trailing slash consistency
  trailingSlash: false,

  // ── 301s: the two hand-coded city families retired by the [slug] landing
  // engine. Redirects run before the filesystem, so old inbound links and
  // indexed URLs keep working and hand their equity to the new pages.
  async redirects() {
    return [
      {
        source: "/hotels/city/:slug",
        destination: "/hotel-booking-in-:slug",
        permanent: true,
      },
      {
        source: "/destinations/:slug",
        destination: "/tour-packages-in-:slug",
        permanent: true,
      },
      {
        source: "/destinations",
        destination: "/tours",
        permanent: true,
      },
    ];
  },

  // ── API proxy to backend (avoids CORS in dev / SSR)
  // NEXT_PUBLIC_API_URL is the full API base (e.g. http://localhost:8000/api/v1),
  // so the rewrite appends only the matched path — no double /api/v1.
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
