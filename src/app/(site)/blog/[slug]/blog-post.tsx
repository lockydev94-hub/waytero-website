"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DOMPurify from "dompurify";
import {
  ArrowLeft, ArrowRight, Calendar, User, Tag, Clock, Share2, Check,
  Mail, Twitter, Facebook, Linkedin, MessageCircle, BookOpen, Car, ListOrdered,
  Phone,
} from "lucide-react";
import { Container, Section, Card, Badge, ButtonLink, Skeleton, MotionGlow, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { publicBlogService, BlogPostDetail, BlogPostSummary } from "@/services/publicBlog";

const SHARE_OPTIONS = [
  { label: "WhatsApp", Icon: MessageCircle, color: "hover:bg-emerald-50 hover:text-emerald-600" },
  { label: "X", Icon: Twitter, color: "hover:bg-ink-9 hover:text-ink" },
  { label: "Facebook", Icon: Facebook, color: "hover:bg-blue-50 hover:text-blue-600" },
  { label: "LinkedIn", Icon: Linkedin, color: "hover:bg-sky-50 hover:text-sky-600" },
  { label: "Email", Icon: Mail, color: "hover:bg-orange-50 hover:text-orange-600" },
];

function readTimeOf(content?: string | null): number {
  const words = (content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

interface TocItem {
  level: 2 | 3;
  text: string;
  id: string;
}

function extractToc(content?: string | null): TocItem[] {
  if (!content) return [];
  const items: TocItem[] = [];
  const re = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const level = Number(match[1]) as 2 | 3;
    const text = match[2]
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();
    if (!text) continue;
    items.push({
      level,
      text,
      id: `section-${items.length + 1}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40)}`,
    });
  }
  return items;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Normalize Quill HTML for rendering. Quill encodes every space as
 * `&nbsp;`, which prevents text wrapping and blows out the container
 * width. Convert those to regular spaces so prose flows normally.
 */
function normalizeContent(content: string): string {
  return content
    .replace(/&nbsp;/g, " ")
    .replace(/<p>\s*<\/p>/g, "");
}

/**
 * Annotate h2/h3 tags in Quill HTML with stable anchor ids so the
 * on-page TOC links actually scroll. Returns the same HTML with ids added.
 */
function annotateHeadings(content: string, toc: TocItem[]): string {
  if (!toc.length) return content;
  let i = 0;
  return content.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (full, level, attrs, inner) => {
    const item = toc[i++];
    if (!item) return full;
    return `<h${level}${attrs} id="${item.id}">${inner}</h${level}>`;
  });
}

export default function BlogDetailPage({
  initialPost,
}: {
  initialPost?: BlogPostDetail | null;
}) {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [post, setPost] = useState<BlogPostDetail | null>(initialPost ?? null);
  const [related, setRelated] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(!initialPost);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  // Reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const currentSlug = slug;
    if (!currentSlug) return;
    let cancelled = false;
    async function load(slugArg: string) {
      try {
        // Server-fetched post (SSR) short-circuits the client fetch — the
        // article body is already in the HTML; the client fetch below only
        // runs for on-demand ISR renders that missed the initial payload.
        const result = initialPost ?? (await publicBlogService.getPost(slugArg));
        if (cancelled) return;
        if (result) {
          setPost(result);
          // Update page metadata
          document.title = result.seo_title || `${result.title} — WayTero Blog`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc && result.seo_description) {
            metaDesc.setAttribute("content", result.seo_description);
          }
          // Related articles — prefer posts sharing at least one tag
          const list = await publicBlogService.listPosts({ page: 1, per_page: 6 });
          if (cancelled) return;
          if (list) {
            const others = list.data.filter((p) => p.slug !== result.slug);
            const scored = others
              .map((p) => ({
                p,
                score: (p.tags || []).filter((t) => (result.tags || []).includes(t)).length,
              }))
              .sort((a, b) => b.score - a.score)
              .map((x) => x.p);
            setRelated(scored.slice(0, 3));
          }
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load(currentSlug);
    return () => {
      cancelled = true;
    };
  }, [slug, initialPost]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  const handleShare = useCallback(
    (label: string) => {
      const url = encodeURIComponent(shareUrl);
      const title = encodeURIComponent(post?.title || "WayTero Blog");
      let href = "";
      switch (label) {
        case "WhatsApp":
          href = `https://wa.me/?text=${title}%20${url}`;
          break;
        case "X":
          href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
          break;
        case "Facebook":
          href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
          break;
        case "LinkedIn":
          href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
          break;
        case "Email":
          href = `mailto:?subject=${title}&body=${url}`;
          break;
      }
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");
      }
    },
    [shareUrl, post?.title]
  );

  const copyLink = useCallback(() => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => undefined);
  }, [shareUrl]);

const toc = useMemo(() => extractToc(post?.content), [post?.content]);
  const annotatedContent = useMemo(() => {
    if (!post?.content) return "";
    const normalized = annotateHeadings(normalizeContent(post.content), toc);
    // DOMPurify the admin-authored Quill HTML before injecting it — the CMS
    // is admin-only, but a compromised admin account or pasted script must
    // never execute on the public site (Security Hardening H4).
    return DOMPurify.sanitize(normalized, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["id"],
      FORBID_TAGS: ["script", "iframe", "object", "embed", "style", "form"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "style", "srcset"],
    });
  }, [post?.content, toc]);

  if (loading) {
    return (
      <Section bg="white" pad="lg">
        <Container size="md">
          <div className="space-y-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (error || !post) {
    return (
      <Section bg="white" pad="lg">
        <Container size="md">
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📄</div>
            <h1 className="text-2xl font-bold text-ink mb-2">Article not found</h1>
            <p className="text-ink-3 mb-6">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <ButtonLink href="/blog" variant="primary" size="md">
              <ArrowLeft size={15} /> Back to blog
            </ButtonLink>
          </div>
        </Container>
      </Section>
    );
  }

  const readTime = readTimeOf(post.content);

  const SUPPORT_PHONE = "1800-WAYTERO";

  return (
    <>
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 z-[60] h-1 bg-gradient-to-r from-[#F05A22] via-primary-600 to-accent-500 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
        aria-hidden
      />

      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt || undefined,
            image: post.featured_image_url || undefined,
            datePublished: post.published_at || post.created_at,
            dateModified: post.updated_at,
            author: {
              "@type": "Person",
              name: post.author_name || "WayTero Editorial",
              image: post.author_avatar_url || undefined,
            },
            publisher: { "@type": "Organization", name: "WayTero" },
            mainEntityOfPage: shareUrl,
            keywords: post.seo_keywords || post.tags?.join(", ") || undefined,
          }),
        }}
      />

      {/* Article header */}
      <Section bg="white" pad="lg" className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl" />
        <Container size="md">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-primary-600 transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to blog
          </Link>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 6).map((tag) => (
                <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                  <Badge tone="primary" className="transition-colors hover:bg-primary-100">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg text-ink-3 leading-relaxed">{post.excerpt}</p>
          )}

          {/* Meta */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-4">
            <span className="inline-flex items-center gap-1.5">
              {post.author_avatar_url ? (
                <img
                  src={post.author_avatar_url}
                  alt={post.author_name || "Author"}
                  className="h-6 w-6 rounded-full object-cover ring-2 ring-primary-100"
                />
              ) : (
                <User size={14} />
              )}
              {post.author_name || "WayTero Editorial"}
            </span>
            {post.published_at && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(post.published_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} /> {readTime} min read
            </span>
          </div>
        </Container>
      </Section>

      {/* Article body + sidebar */}
      <Section bg="white" pad="lg" className="pt-0">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10 lg:gap-14">
            {/* ── Main column ───────────────────────────────────────── */}
            <div className="min-w-0">
              {/* Featured image */}
              {post.featured_image_url && (
                <div className="rounded-2xl overflow-hidden shadow-wt-lg">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-auto max-h-96 object-cover"
                  />
                </div>
              )}

              {/* Article content */}
              <article
                className={`prose prose-lg max-w-none mt-8 [overflow-wrap:anywhere]
                  prose-headings:font-bold prose-headings:text-ink
                  prose-h2:scroll-mt-24 prose-h3:scroll-mt-24
                  prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-xl prose-img:shadow-md
                  prose-blockquote:border-primary-500 prose-blockquote:bg-primary-50/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                  prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-ink prose-pre:text-white prose-pre:rounded-xl
                  prose-li:marker:text-primary-500`}
                dangerouslySetInnerHTML={{ __html: annotatedContent }}
              />

              {/* Author + share footer */}
              <div className="mt-12 pt-8 border-t border-ink-7">
                <div className="rounded-2xl bg-gradient-to-br from-ink-9 to-ink-8 border border-ink-7 p-6 flex flex-col sm:flex-row sm:items-center gap-5">
                  {post.author_avatar_url ? (
                    <img
                      src={post.author_avatar_url}
                      alt={post.author_name || "Author"}
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-primary-100 shadow-wt-sm"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-800 text-white flex items-center justify-center text-2xl font-bold shadow-wt-sm">
                      {post.author_name?.[0] ?? "W"}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gradient-primary">Written by</div>
                    <div className="text-base font-bold text-ink mt-0.5">
                      {post.author_name || "WayTero Editorial"}
                    </div>
                    <div className="text-xs text-ink-4 mt-1">
                      {post.tags.length > 0 ? `Filed under: ${post.tags.join(", ")}` : "WayTero Travel Blog"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-4 mr-1 inline-flex items-center gap-1">
                      <Share2 size={12} /> Share
                    </span>
                    {SHARE_OPTIONS.map(({ label, Icon, color }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleShare(label)}
                        aria-label={`Share on ${label}`}
                        className={`h-10 w-10 rounded-xl border border-ink-7 bg-white text-ink-3 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-wt-sm ${color}`}
                      >
                        <Icon size={16} />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={copyLink}
                      aria-label="Copy link"
                      className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-wt-sm ${
                        copied
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                          : "border-ink-7 bg-white text-ink-3 hover:bg-ink-9"
                      }`}
                    >
                      {copied ? <Check size={16} /> : <BookOpen size={16} />}
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <ButtonLink href="/blog" variant="outline" size="sm">
                    <ArrowLeft size={14} /> More articles
                  </ButtonLink>
                </div>
              </div>
            </div>

            {/* ── Sidebar ──────────────────────────────────────────── */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
              {/* Table of contents */}
              {toc.length > 0 && (
                <div className="rounded-2xl border border-ink-7 bg-ink-9 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-3 mb-4">
                    <ListOrdered size={14} className="text-primary-600" /> On this page
                  </div>
                  <nav className="space-y-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-sm leading-snug transition-colors hover:text-primary-600 ${
                          item.level === 2
                            ? "font-semibold text-ink"
                            : "pl-4 font-normal text-ink-3"
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Quick actions CTA */}
              <div className="rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-6 text-white shadow-wt-lg">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
                  <Car size={14} /> Ready to travel?
                </div>
                <h3 className="text-lg font-extrabold leading-snug">Book your Odisha cab in minutes</h3>
                <p className="mt-2 text-sm text-white/80 leading-relaxed">
                  City rides, airport transfers and outstation trips — transparent fares, verified drivers.
                </p>
                <div className="mt-4 space-y-2">
                  <ButtonLink href="/cabs" variant="accent" size="md" fullWidth>
                    Book a cab <ArrowRight size={15} />
                  </ButtonLink>
                  <a
                    href={`tel:${SUPPORT_PHONE}`}
                    className="flex items-center justify-center gap-2 h-11 px-5 text-sm rounded-xl font-semibold bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur transition-colors"
                  >
                    <Phone size={15} /> {SUPPORT_PHONE}
                  </a>
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="rounded-2xl border border-ink-7 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-3 mb-3">
                    <Tag size={14} className="text-primary-600" /> Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink-8 text-xs font-semibold text-ink-2 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                          #{tag}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related posts */}
              {related.length > 0 && (
                <div className="rounded-2xl border border-ink-7 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-3 mb-4">
                    <BookOpen size={14} className="text-primary-600" /> Keep reading
                  </div>
                  <div className="space-y-4">
                    {related.map((rp) => (
                      <Link key={rp.id} href={`/blog/${rp.slug}`} className="group block">
                        <div className="flex gap-3">
                          <div className="relative h-16 w-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                            {rp.featured_image_url ? (
                              <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                style={{ backgroundImage: `url(${rp.featured_image_url})` }}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100">
                                <BookOpen className="text-primary-300" size={18} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-ink leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
                              {rp.title}
                            </h4>
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-4">
                              <Clock size={10} /> {readTimeOf(rp.excerpt)} min read
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </Container>
      </Section>

      {/* More stories */}
      {related.length > 0 && (
        <Section bg="muted" pad="lg">
          <Container size="lg">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gradient-primary mb-2">Keep exploring</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Keep reading
              </h2>
              <p className="mt-2 text-sm text-ink-3">More stories you might enjoy.</p>
            </div>
            <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((post) => (
                <MotionStaggerItem key={post.id} className="h-full">
                <Link href={`/blog/${post.slug}`} className="block h-full group">
                  <Card variant="premium" hover lift="sm" padded={false} className="h-full flex flex-col relative overflow-hidden">
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative h-36 overflow-hidden bg-muted">
                      {post.featured_image_url ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                          style={{ backgroundImage: `url(${post.featured_image_url})` }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100">
                          <BookOpen className="text-primary-300" size={34} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                      <div className="flex items-center gap-2 mb-2.5">
                        {post.tags.length > 0 && <Badge tone="primary" size="sm">{post.tags[0]}</Badge>}
                        <span className="text-xs text-ink-4 inline-flex items-center gap-1">
                          <Clock size={11} /> {readTimeOf(post.excerpt)} min
                        </span>
                      </div>
                      <h3 className="font-bold text-ink leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <span className="text-xs text-ink-4 inline-flex items-center gap-1">
                          <Tag size={11} /> {post.author_name || "WayTero"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 group-hover:translate-x-0.5 transition-transform">
                          Read <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          </Container>
        </Section>
      )}
    </>
  );
}