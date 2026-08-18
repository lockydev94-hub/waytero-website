"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Clock, ArrowRight, Mail, Calendar, User, Search, Sparkles, BookOpen,
} from "lucide-react";
import {
  Container, Section, SectionHeader, Card, Badge,
  Button, Input, Skeleton, MotionGlow, MotionStaggerItem,
} from "@/components/ui";
import { MotionStagger } from "@/components/ui";
import { publicBlogService, BlogPostSummary } from "@/services/publicBlog";

const PAGE_SIZE = 9;

function readTimeFromExcerpt(excerpt?: string | null): number {
  const words = (excerpt || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("tag") || "";
  });
  const [page, setPage] = useState(1);

  // Tags for the filter chips
  const [allTags, setAllTags] = useState<string[]>([]);

  const filtersActive = search.trim() !== "" || activeTag !== "";

  // Load available tags once
  useEffect(() => {
    publicBlogService.listTags().then(setAllTags).catch(() => setAllTags([]));
  }, []);

  // Fetch posts whenever filters change (resets to page 1)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    setPosts([]);

    publicBlogService
      .listPosts({
        page: 1,
        per_page: PAGE_SIZE,
        tag: activeTag || undefined,
        search: search.trim() || undefined,
      })
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setPosts(result.data);
          setTotal(result.total);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, activeTag]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setLoadingMore(true);
    publicBlogService
      .listPosts({
        page: next,
        per_page: PAGE_SIZE,
        tag: activeTag || undefined,
        search: search.trim() || undefined,
      })
      .then((result) => {
        if (result) {
          setPosts((prev) => [...prev, ...result.data]);
          setTotal(result.total);
          setPage(next);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoadingMore(false));
  }, [page, search, activeTag]);

  const featured = useMemo(() => (filtersActive ? null : posts[0] ?? null), [posts, filtersActive]);
  const gridPosts = useMemo(
    () => (filtersActive ? posts : posts.slice(1)),
    [posts, filtersActive]
  );

  const hasMore = !loading && posts.length < total;

  const submitNewsletter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector<HTMLInputElement>('input[type="email"]');
    input && (input.value = "");
  };

  return (
    <>
      {/* Hero */}
      <Section bg="white" pad="lg" className="relative bg-gradient-to-br from-primary-50/60 via-white to-accent-50/40 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary-500/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent-500/15 blur-3xl" />
        <Container size="lg">
          <div className="relative max-w-3xl mx-auto text-center">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-accent-500" aria-hidden />
              Travel Blog
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-ink tracking-tight leading-[1.05]">
              Stories &amp; tips for{" "}
              <span className="text-gradient-primary">Indian travelers</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-ink-3 leading-relaxed max-w-2xl mx-auto">
              Routes, stays, refund hacks, and behind-the-scenes from the WayTero team —
              written for how India actually travels.
            </p>

            {/* Search */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-4" aria-hidden />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles, routes, destinations..."
                  className="pl-12 rounded-2xl border-ink-7 bg-white/90 backdrop-blur shadow-wt-sm focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              {/* Tag chips */}
              {allTags.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTag("")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                      activeTag === ""
                        ? "bg-primary-600 text-white border-primary-600 shadow-wt-primary"
                        : "bg-white text-ink-2 border-ink-7 hover:border-primary-300 hover:text-primary-600"
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(tag === activeTag ? "" : tag)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                        activeTag === tag
                          ? "bg-primary-600 text-white border-primary-600 shadow-wt-primary"
                          : "bg-white text-ink-2 border-ink-7 hover:border-primary-300 hover:text-primary-600"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* Featured post */}
      {!filtersActive && (loading ? (
        <Section bg="white" pad="md">
          <Container size="lg">
            <Card variant="elevated" className="overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <Skeleton className="min-h-56 lg:min-h-full" />
                <div className="p-8 lg:p-10 space-y-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
            </Card>
          </Container>
        </Section>
      ) : featured ? (
        <Section bg="white" pad="md">
          <Container size="lg">
            <Link href={`/blog/${featured.slug}`} className="block group">
              <Card variant="premium" padded={false} className="overflow-hidden relative">
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative min-h-56 lg:min-h-full overflow-hidden bg-muted">
                    {featured.featured_image_url ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                        style={{ backgroundImage: `url(${featured.featured_image_url})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-6xl bg-gradient-to-br from-primary-100 to-accent-100">
                        <BookOpen className="text-primary-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                    <div aria-hidden className="pointer-events-none absolute top-4 left-4 h-7 px-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur text-[10px] font-extrabold uppercase tracking-wider text-primary-700 shadow-wt-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-soft" />
                      Featured
                    </div>
                  </div>
                  <div className="p-8 lg:p-10">
                    <div className="flex items-center gap-2 mb-4">
                      {featured.tags.length > 0 && (
                        <Badge tone="primary">{featured.tags[0]}</Badge>
                      )}
                      <span className="text-xs text-ink-4 inline-flex items-center gap-1">
                        <Clock size={11} /> {readTimeFromExcerpt(featured.excerpt)} min read
                      </span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-ink tracking-tight group-hover:text-primary-700 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="mt-3 text-sm text-ink-3 leading-relaxed line-clamp-3">
                      {featured.excerpt}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      {featured.author_avatar_url ? (
                        <img
                          src={featured.author_avatar_url}
                          alt={featured.author_name || "Author"}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-primary-100 group-hover:ring-primary-300 transition-all"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-sm font-bold shadow-wt-sm">
                          {featured.author_name?.[0] ?? "W"}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-ink">
                          {featured.author_name || "WayTero Editorial"}
                        </div>
                        <div className="text-xs text-ink-4">
                          {featured.published_at
                            ? new Date(featured.published_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : ""}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <span className="inline-flex items-center justify-center font-semibold tracking-tight h-11 px-5 text-sm rounded-xl gap-2 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-primary group-hover:shadow-wt-glow-primary transition-all">
                        Read the article <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </Container>
        </Section>
      ) : null)}

      {/* Article grid */}
      <Section bg="muted" pad="lg">
        <Container size="lg">
          <SectionHeader
            eyebrow="Latest articles"
            title={filtersActive ? "Search results" : "Fresh from the blog"}
            subtitle={
              filtersActive
                ? `Showing ${total} article${total === 1 ? "" : "s"}${
                    search.trim() ? ` matching “${search.trim()}”` : ""
                  }${activeTag ? ` tagged #${activeTag}` : ""}.`
                : "Hand-picked stories, practical guides and fare-tips from the team."
            }
          />
          {loading ? (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} variant="default" className="p-6 space-y-3">
                  <Skeleton className="h-36 w-full rounded-xl" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-24 mt-auto" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="mt-10 text-center py-16">
              <div className="text-5xl mb-4">📡</div>
              <h3 className="text-xl font-bold text-ink mb-2">Couldn't load articles</h3>
              <p className="text-ink-3 mb-6">Please check your connection and try again.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setActiveTag("");
                  setPage(1);
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : gridPosts.length === 0 ? (
            <div className="mt-10 text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-ink mb-2">No articles found</h3>
              <p className="text-ink-3 mb-6">Try a different keyword or tag.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setActiveTag("");
                  setPage(1);
                }}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <>
              <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {gridPosts.map((post) => (
                  <MotionStaggerItem key={post.id} className="h-full">
                    <Link href={`/blog/${post.slug}`} className="block h-full group">
                      <Card variant="premium" hover lift="sm" padded={false} className="h-full flex flex-col relative overflow-hidden">
                        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {/* Featured image */}
                        <div className="relative h-44 overflow-hidden bg-muted">
                          {post.featured_image_url ? (
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                              style={{ backgroundImage: `url(${post.featured_image_url})` }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100">
                              <BookOpen className="text-primary-300" size={40} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          {post.tags.length > 0 && (
                            <Badge tone="accent" size="sm" className="absolute top-3 left-3 bg-white/95 backdrop-blur border-0 shadow-wt-sm">
                              {post.tags[0]}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-col flex-1 p-5">
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-xs text-ink-4 inline-flex items-center gap-1">
                              <Calendar size={11} />
                              {post.published_at
                                ? new Date(post.published_at).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Soon"}
                            </span>
                            <span className="text-xs text-ink-4 inline-flex items-center gap-1">
                              <Clock size={11} /> {readTimeFromExcerpt(post.excerpt)} min
                            </span>
                          </div>
                          <h3 className="font-bold text-ink leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="mt-2 text-sm text-ink-3 leading-relaxed line-clamp-3 flex-1">
                            {post.excerpt}
                          </p>
                          <div className="mt-4 pt-4 border-t border-ink-7 flex items-center justify-between">
                            <span className="text-xs text-ink-4 inline-flex items-center gap-1.5">
                              {post.author_avatar_url ? (
                                <img
                                  src={post.author_avatar_url}
                                  alt=""
                                  className="h-5 w-5 rounded-full object-cover"
                                />
                              ) : (
                                <User size={11} />
                              )}
                              {post.author_name || "WayTero"}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-600">
                              Read <ArrowRight size={12} />
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </MotionStaggerItem>
                ))}
              </MotionStagger>

              {hasMore && (
                <div className="mt-10 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={loadMore}
                    loading={loadingMore}
                    leftIcon={<BookOpen size={15} />}
                  >
                    Load more articles
                  </Button>
                </div>
              )}
            </>
          )}
        </Container>
      </Section>

      {/* Newsletter band */}
      <Section bg="white" pad="lg" className="relative overflow-hidden">
        <Container size="md">
          <MotionGlow color="accent" intensity={0.15} size={520}>
            <div className="relative rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 px-8 py-12 text-center text-white shadow-wt-lg overflow-hidden">
              <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent-500/30 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary-400/20 blur-3xl" />
              <h2 className="relative text-2xl sm:text-3xl font-extrabold tracking-tight">
                Travel smart, every <span className="text-gradient-primary">week</span>
              </h2>
              <p className="relative mt-2 text-sm text-white/80 max-w-md mx-auto">
                One email with route ideas, fare tips, and early access to offers. No spam, ever.
              </p>
              <form onSubmit={submitNewsletter} className="relative mt-7 max-w-md mx-auto flex gap-2">
                <div className="flex-1">
                  <Input type="email" placeholder="you@example.com" required className="bg-white/95 border-white/40" />
                </div>
                <Button type="submit" variant="gradient-accent" size="lg" shine leftIcon={<Mail size={15} />}>
                  Subscribe
                </Button>
              </form>
            </div>
          </MotionGlow>
        </Container>
      </Section>
    </>
  );
}