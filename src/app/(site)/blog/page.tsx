import type { Metadata } from "next";
import { Suspense } from "react";
import BlogListingPage from "./blog-listing";
import { resolveSeo, toMetadata, appUrl } from "@/services/seoService";

// ── Page-level SEO (SSR) — DB-driven with static fallback ──────────────
// Individual articles carry DB-driven SEO (see /blog/[slug]).
export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo("blog");
  const canonical = `${appUrl()}/blog`;
  return toMetadata(seo, "/blog", {
    alternates: {
      canonical,
      languages: { "en-in": canonical, en: canonical },
      types: {
        "application/rss+xml": [
          { url: `${appUrl()}/feed`, title: "WayTero Travel Blog" },
        ],
      },
    },
  });
}

export default function BlogPage() {
  return (
    <Suspense fallback={null}>
      <BlogListingPage />
    </Suspense>
  );
}
