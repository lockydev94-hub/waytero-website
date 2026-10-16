"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { MotionStagger, usePrefersReducedMotion } from "./Motion";

/* ============================================================
   Carousel — a horizontal snap strip with prev/next arrows.

   Why it exists: every homepage card band used a fixed-column
   grid, so a band with one published record left three quarters
   of the row empty. A strip holds any number of cards, and the
   arrows make off-screen cards discoverable instead of hiding
   them behind a gesture nobody notices.

   The track is deliberately `w-full`, NOT `w-max`. Items are
   `shrink-0 grow basis-[X] max-w-[Y]`, so:
     - few items  -> they grow toward the cap and the row centres
     - many items -> there is no free space to grow into, the
       basis widths overflow, and the strip scrolls
   One mechanism, no measurement-driven sizing.

   `justify-center` is only applied once we have MEASURED that the
   content fits. Centring a flex row that overflows pushes content
   past the left edge, where it cannot be scrolled back to — a
   real bug, not a cosmetic one. So the safe alignment is the
   default, and centring is earned after mount.
   ============================================================ */

interface CarouselProps {
  /** The `<MotionStaggerItem>` cards, authored by the calling (server) section. */
  children: ReactNode;
  /** Names the region for screen readers, e.g. "Featured hotels". */
  ariaLabel: string;
  className?: string;
}

const ARROW =
  "absolute top-1/2 z-20 hidden -translate-y-1/2 place-items-center rounded-full border border-ink-7 bg-white/90 p-2 text-ink shadow-wt backdrop-blur transition-[opacity,background-color,transform] hover:bg-primary-50 disabled:pointer-events-none disabled:opacity-0 sm:grid";

export default function Carousel({ children, ariaLabel, className = "" }: CarouselProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [fits, setFits] = useState(false);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft;
    setCanPrev(left > 1);
    setCanNext(left < max - 1);
    // Nothing to scroll means the row is short — let it centre and stretch.
    setFits(max <= 1);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    measure();

    // A scroll handler that reads layout every event janks the strip on
    // low-end phones; one read per frame is enough to keep the arrows honest.
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
    // Card counts change without a scroll (data arrives), and the viewport
    // changes without either. Both need a re-measure.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const track = el.firstElementChild;
    if (track) ro.observe(track);
    window.addEventListener("resize", measure);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [measure]);

  const scrollByCards = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-carousel-item]");
    const track = el.firstElementChild;
    const gap = track ? parseFloat(getComputedStyle(track).columnGap) || 0 : 0;
    // One card at a time on desktop; never more than a viewport, or the
    // reader loses their place entirely.
    const step = Math.min(el.clientWidth - 24, first ? first.offsetWidth + gap : el.clientWidth * 0.8);
    el.scrollBy({ left: dir * step, behavior: reduced ? "auto" : "smooth" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Home") {
      e.preventDefault();
      scroller.current?.scrollTo({ left: 0, behavior: reduced ? "auto" : "smooth" });
    } else if (e.key === "End") {
      e.preventDefault();
      const el = scroller.current;
      if (el) el.scrollTo({ left: el.scrollWidth, behavior: reduced ? "auto" : "smooth" });
    }
  };

  return (
    <div
      className={`relative ${className}`}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      {/* Bleeds past the Container gutter and re-adds it as scroll padding, so
          the first card aligns with the heading while the arrows sit over the
          gutter edge. */}
      <div
        ref={scroller}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="-mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 scroll-px-4 [scrollbar-width:none] focus-visible:outline-none sm:mx-0 sm:px-0 sm:scroll-px-0 [&::-webkit-scrollbar]:hidden"
      >
        <MotionStagger
          className={`flex w-full gap-5 ${fits ? "justify-center" : "justify-start"}`}
        >
          {children}
        </MotionStagger>
      </div>

      <button
        type="button"
        aria-label={`Previous ${ariaLabel}`}
        onClick={() => scrollByCards(-1)}
        disabled={!canPrev}
        className={`${ARROW} left-1`}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        aria-label={`Next ${ariaLabel}`}
        onClick={() => scrollByCards(1)}
        disabled={!canNext}
        className={`${ARROW} right-1`}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
