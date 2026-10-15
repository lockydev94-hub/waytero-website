import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://waytero.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // NOTE: /_next/ must stay crawlable — it carries the JS/CSS Google needs
      // to render pages. Only private app areas are blocked (SEO audit §1.1).
      disallow: ["/api/", "/admin/"],
    },
    // AI crawlers (GPTBot, ClaudeBot, PerplexityBot, ...) fall under "*" and
    // are explicitly welcomed; see the app-native map served at /llms.txt.
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
