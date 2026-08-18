import type { Metadata } from "next";
import { Suspense } from "react";
import BlogListingPage from "./blog-listing";
import { STATIC_SEO, toMetadata } from "@/services/seoService";

// ── Page-level SEO (SSR) — static fallback for the blog hub ──────────────
// Individual articles carry DB-driven SEO (see /blog/[slug]).
export function generateMetadata(): Metadata {
  return toMetadata(STATIC_SEO.blog, "/blog");
}

export default function BlogPage() {
  return (
    <Suspense fallback={null}>
      <BlogListingPage />
    </Suspense>
  );
}
