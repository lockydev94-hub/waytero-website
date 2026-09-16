import { ArrowRight, CalendarDays, User } from "lucide-react";
import { Container, Section, SectionHeader, MotionGlow, MotionTilt } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";
import { publicBlogService, type BlogPostSummary } from "@/services/publicBlog";

interface BlogSectionProps {
  variant: Record<string, unknown>;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function BlogSection({ variant }: BlogSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "Travel stories");
  const title = pick<string>(variant, "headline", "Travel Stories & Tips");
  const subtitle = pick<string>(variant, "subheadline", "Guides, itineraries and insider tips from our team.");
  const ctaText = pick<string>(variant, "cta_text", "Read the blog");
  const ctaLink = pick<string>(variant, "cta_link", "/blog");

  const res = await publicBlogService.listPosts({ per_page: 3 });
  // Only real, published posts are shown. No hardcoded fallbacks — fake
  // article links create soft-404s (SEO audit §3.2). When the blog is empty
  // the whole section is skipped instead of advertising phantom content.
  const posts = res?.data?.length ? res.data.slice(0, 3) : [];
  if (posts.length === 0) return null;

  return (
    <Section bg="muted" pad="lg" id="blog" overlay="dots">
      <Container size="lg">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          accent="primary"
          underline
          animatedEyebrow
          actions={
            <a
              href={ctaLink}
              className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {ctaText} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          }
        />
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <MotionStaggerItem key={post.id} className="h-full">
              <MotionGlow color="primary" intensity={0.2} size={300} className="h-full rounded-2xl">
                <MotionTilt max={3} className="h-full">
                  <a
                    href={`/blog/${post.slug}`}
                    className="group relative flex h-full flex-col bg-white rounded-2xl overflow-hidden border border-ink-7 hover:border-primary-200 hover:shadow-wt-xl transition-all duration-300 ease-[var(--ease-wt)]"
                  >
                    <div className="aspect-[16/9] bg-gradient-to-br from-primary-200 via-primary-100 to-accent-100 overflow-hidden relative">
                      {post.featured_image_url ? (
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: `url(${post.featured_image_url})` }}
                        />
                      ) : (
                        <div aria-hidden className="absolute inset-0 flex items-center justify-center text-primary-300/70 group-hover:scale-125 group-hover:text-primary-500 transition-transform duration-500">
                          <CalendarDays className="h-10 w-10" />
                        </div>
                      )}
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-[11px] text-ink-4 mb-3">
                        {post.tags?.[0] && (
                          <span className="px-2 py-0.5 rounded-md bg-ink-9 font-bold uppercase tracking-wider text-primary-700">
                            {post.tags[0]}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {formatDate(post.published_at)}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-ink leading-snug group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                      {post.excerpt && <p className="text-sm text-ink-3 leading-relaxed line-clamp-2">{post.excerpt}</p>}
                      {post.author_name && (
                        <div className="mt-auto pt-4 border-t border-ink-7 flex items-center gap-2 text-xs text-ink-4">
                          <User className="h-3.5 w-3.5" /> {post.author_name}
                        </div>
                      )}
                    </div>
                  </a>
                </MotionTilt>
              </MotionGlow>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}
