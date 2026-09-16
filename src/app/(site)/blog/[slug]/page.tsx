import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
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

// ── SSR content ──────────────────────────────────────────────────────────
// Published slugs are prerendered at build time (ISR revalidates the fetches
// every 60s); unknown slugs render on demand and return a real 404 instead
// of an indexable "Article not found" soft-404. The server-fetched post is
// passed into the client component so title, body and JSON-LD are all in
// the initial HTML — crawlers never depend on the client-side fetch.
export async function generateStaticParams() {
  const res = await publicBlogService.listPosts({ page: 1, per_page: 50 });
  return (res?.data ?? []).map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await seoForPost(slug);
  return toMetadata(seo, `/blog/${slug}`);
}

export default async function BlogPostDetailsPage({ params }: Props) {
  const { slug } = await params;
  const post = await publicBlogService.getPost(slug);
  if (!post) notFound();
  return (
    <Suspense fallback={null}>
      <BlogPostPage initialPost={post} />
    </Suspense>
  );
}
