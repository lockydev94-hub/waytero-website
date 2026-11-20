import type { Metadata } from "next";
import { Suspense } from "react";
import BlogListingPage from "./blog-listing";
import JsonLd, {
  breadcrumbList,
  webPageSchema,
} from "@/components/sections/JsonLd";
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

export default async function BlogPage() {
  const seo = await resolveSeo("blog");
  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: seo.title,
          description: seo.description,
          path: "/blog",
          type: "CollectionPage",
          image: seo.image,
        })}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Travel blog", path: "/blog" },
        ])}
      />
      <Suspense fallback={null}>
        <BlogListingPage />
      </Suspense>
    </>
  );
}
