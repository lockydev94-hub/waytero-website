import type { Metadata } from "next";
import { Suspense } from "react";
import BlogPostPage from "./blog-post";
import { publicBlogService } from "@/services/publicBlog";
import { STATIC_SEO, toMetadata, type SeoContent } from "@/services/seoService";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────
// Uses the blog post's own seo_title/seo_description/seo_keywords (admin →
// Blog editor). Falls back to the post title/excerpt and finally the static
// blog hub defaults.
async function seoForPost(slug: string): Promise<SeoContent> {
  const fallback = STATIC_SEO.blog;
  try {
    const post = await publicBlogService.getPost(slug);
    if (!post) return fallback;
    return {
      title: post.seo_title?.trim() || post.title,
      description:
        post.seo_description?.trim() ||
        post.excerpt?.slice(0, 320) ||
        fallback.description,
      keywords: post.seo_keywords
        ? post.seo_keywords.split(",").map((k) => k.trim()).filter(Boolean)
        : [...fallback.keywords, post.title],
      image: post.featured_image_url ?? null,
    };
  } catch {
    return fallback;
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await seoForPost(slug);
  return toMetadata(seo, `/blog/${slug}`);
}

export default function BlogPostDetailsPage() {
  return (
    <Suspense fallback={null}>
      <BlogPostPage />
    </Suspense>
  );
}
