"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Star, StarHalf, ChevronLeft, ChevronRight } from "lucide-react";
import { Container, Section, Avatar } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";

interface TestimonialsSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. Defaults to this band's
   *  own literal so every other page that uses it is unchanged. */
  bg?: BandTone;
}

interface Testimonial {
  name: string;
  role?: string;
  city?: string;
  text: string;
  rating?: number;
  avatar?: string;
}

/** Five stars, with a half star when the rating has a .5 in it — the
 *  aggregate under the heading is a real mean, not a painted 5.0. */
function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating >= i + 0.5;
        const Icon = half ? StarHalf : Star;
        return (
          <Icon
            key={i}
            style={{ width: size, height: size }}
            className={filled || half ? "fill-accent-500 text-accent-500" : "text-ink-6"}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

/**
 * TestimonialsSection — "What Our Travelers Say".
 *
 * The band is a two-part block: the claim, the aggregate rating and the
 * prev/next controls on the left, a rail of review cards on the right. No
 * eyebrow and no centred header — the heading sits in the left column, which
 * is what makes the band read as one composition instead of a title over a
 * strip.
 *
 * Client-side only because the arrows drive the rail; the copy and the
 * reviews still come from the CMS.
 */
export default function TestimonialsSection({ variant, bg = "muted" }: TestimonialsSectionProps) {
  const rail = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "What Our Travelers Say"));
  // "4.8/5 across 50,000+ reviews" was never a fact the DB could back — the
  // subtitle only appears when the admin writes it, and the stars above it
  // are the mean of the reviews actually shown.
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", ""));
  const items = pick<Testimonial[]>(variant, "testimonials", []);

  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    measure();
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        measure();
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [measure]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const first = el.firstElementChild?.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el.firstElementChild as HTMLElement).columnGap) || 0;
    const step = first ? first.offsetWidth + gap : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  const average = items.reduce((sum, t) => sum + (t.rating ?? 5), 0) / items.length;

  return (
    <Section bg={bg} id="testimonials" pad="none" className="relative overflow-hidden pt-7 pb-8 lg:pt-8 lg:pb-10">
      {/* The pale wash belongs to this band: the rail's white cards need a
          tint behind them to read as cards at all. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-[#F6F9FE] to-[#EEF4FD]"
      />

      <Container size="wide" className="relative">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:gap-8">
          <div className="shrink-0 xl:w-[252px]">
            <h2 className="text-[21px] font-extrabold leading-tight tracking-[-0.01em] text-primary-700 sm:text-[23px] xl:text-[24px]">
              {title}
            </h2>
            <div className="mt-2.5">
              <Stars rating={average} size={14} />
            </div>
            {subtitle && (
              <p className="mt-2 max-w-[260px] text-[12.5px] leading-relaxed text-ink-4">{subtitle}</p>
            )}

            {/* Arrows at every width: the rail's scrollbar is hidden and at
                1024 two cards fill it exactly, so without these nothing hints
                that a third exists. */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                disabled={!canPrev}
                aria-label="Previous reviews"
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink-3 shadow-[0_2px_8px_rgba(16,24,40,0.10)] ring-1 ring-black/[0.04] transition-colors hover:text-primary-600 disabled:opacity-40 disabled:hover:text-ink-3"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                disabled={!canNext}
                aria-label="Next reviews"
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink-3 shadow-[0_2px_8px_rgba(16,24,40,0.10)] ring-1 ring-black/[0.04] transition-colors hover:text-primary-600 disabled:opacity-40 disabled:hover:text-ink-3"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div
            ref={rail}
            className="-mx-4 flex min-w-0 flex-1 snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 sm:scroll-pl-0 [&::-webkit-scrollbar]:hidden"
          >
            {items.map((t, idx) => (
              <article
                key={`${t.name}-${idx}`}
                className="flex w-[82%] min-w-[250px] shrink-0 snap-start flex-col rounded-xl bg-white p-4 shadow-[0_6px_20px_-12px_rgba(16,24,40,0.30)] ring-1 ring-black/[0.03] sm:w-[calc((100%_-_16px)/2)] xl:w-[calc((100%_-_32px)/3)]"
              >
                <Stars rating={t.rating ?? 5} size={13} />
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-auto flex items-center gap-2.5 pt-4">
                  <Avatar name={t.name} src={t.avatar} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-bold text-ink">{t.name}</div>
                    <div className="truncate text-[11px] text-ink-4">
                      {[t.city, t.role].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
