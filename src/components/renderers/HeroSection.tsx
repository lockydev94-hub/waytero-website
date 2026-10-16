"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui";
import { MotionFadeIn } from "@/components/ui";
import { pick } from "@/types/cms";
import type { ServiceType } from "@/types/cms";
import type { ServiceKey } from "@/lib/availability";
import CabSearchForm from "@/components/sections/CabSearchForm";
import HeroSearchForm from "@/components/sections/HeroSearchForm";
import HeroOfferSlider from "@/components/sections/HeroOfferSlider";
import type { PublicOfferSlide } from "@/services/publicCms";

interface HeroSectionProps {
  variant: Record<string, unknown>;
  serviceType?: ServiceType | null;
  /** Verticals hidden site-wide — the hero search drops their tabs. */
  hiddenServices?: ServiceKey[];
  /** Live coupon-backed offers for the hero slider. Empty (default) keeps
   *  the current zero-offer design byte-for-byte. */
  offers?: PublicOfferSlide[];
}

export default function HeroSection({ variant, hiddenServices = [], offers = [] }: HeroSectionProps) {
  // ── Map backend field names to component values ──────────────────────────
  const headline = pick<string>(variant, "headline", "");
  const subline   = pick<string>(variant, "subheadline", "");
  const eyebrow   = pick<string>(variant, "variant_tag", "India's Travel Operating System");

  // CTAs — only show if backend returns values (no fallbacks as per spec)
  const ctaText  = pick<string | null>(variant, "cta_text", null);
  const ctaLink  = pick<string | null>(variant, "cta_link", null);
  const hasPrimaryCta = ctaText && ctaLink;

  // Secondary CTA — no DB field so we use a hardcoded fallback only
  // if there IS a primary CTA (otherwise no buttons at all)
  const hasSecondaryCta = hasPrimaryCta;

  // No hardcoded stats — the hero never shows counters the DB can't back
  // (owner rule 2026-10-15). Admin-authored figures live in the STATS
  // section and render only when the CMS actually has them.

  // Background media — backend fields
  const bgImage    = pick<string | null>(variant, "background_image_url", null);
  const bgVideo    = pick<string | null>(variant, "background_video_url", null);
  const mobileImage = pick<string | null>(variant, "mobile_image_url", null);

  // Whether hero has any media
  const hasMedia = !!(bgImage || bgVideo);

  // Check if we're on mobile for image selection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  const activeImage = isMobile && mobileImage ? mobileImage : bgImage;

  return (
    <section
      className="relative isolate flex min-h-[100dvh] flex-col justify-center overflow-hidden text-white"
      style={{
        // Full-bleed: covers announcement bar + header height (36px bar + 68px header = ~104px)
        // We use negative margin-top to pull the section up behind the sticky header
        marginTop: hasMedia ? "-104px" : "0",
        paddingTop: hasMedia ? "104px" : "0",
      }}
    >
      {/* ── Background: video takes priority over image ─────────────────── */}
      {bgVideo && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={bgVideo}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      )}

      {/* Background image (shown if no video, or as poster fallback) */}
      {activeImage && !bgVideo && (
        <Image
          src={activeImage}
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* ── Overlay layers ───────────────────────────────────────────────── */}
      {hasMedia ? (
        <>
          {/* Deep gradient overlay so text is always readable */}
          <div
            className="absolute inset-0"
            style={{
              background: bgVideo
                ? "linear-gradient(180deg, rgba(11,27,59,0.55) 0%, rgba(11,27,59,0.30) 40%, rgba(11,27,59,0.65) 100%)"
                : "linear-gradient(180deg, rgba(11,27,59,0.60) 0%, rgba(11,27,59,0.35) 45%, rgba(11,27,59,0.70) 100%)",
            }}
          />
          {/* Subtle vignette edges */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        </>
      ) : (
        <>
          {/* No media — solid dark gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #0B1B3B 0%, #1A3A8A 55%, #1140A3 100%)",
            }}
          />
          {/* Gradient blobs */}
          <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-500/40 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-3xl" />
        </>
      )}

      {/* Dot pattern overlay — subtle on all backgrounds */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: hasMedia ? 0.04 : 0.08,
          backgroundImage:
            "url(\"data:image/svg+xml;charset=utf-8,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C%2Fg%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <Container size="xl" className="relative py-4 lg:py-5">
        {/* Eyebrow badge */}
        <MotionFadeIn className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur-md shadow-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" aria-hidden />
            {eyebrow}
          </span>
        </MotionFadeIn>

        {/* Headline */}
        {headline && (
          <MotionFadeIn delay={0.1} className="mx-auto mt-4 max-w-4xl text-center">
            <h1 className="text-[26px] sm:text-[32px] lg:text-[38px] xl:text-[42px] font-extrabold leading-[1.1] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              {headline.split("|").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <>
                      {" "}
                      <span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">
                        {arr[i + 1]}
                      </span>
                    </>
                  )}
                </span>
              ))}
            </h1>
          </MotionFadeIn>
        )}

        {/* Subheadline */}
        {subline && (
          <MotionFadeIn delay={0.15} className="mx-auto mt-3 max-w-2xl text-center">
            <p className={`text-[13px] sm:text-sm lg:text-base leading-relaxed drop-shadow-sm ${hasMedia ? "text-white/90" : "text-white/75"}`}>
              {subline}
            </p>
          </MotionFadeIn>
        )}

        {/* CTAs — only render when backend provides them */}
        {hasPrimaryCta && (
          <MotionFadeIn delay={0.2} className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href={ctaLink!}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-accent-500 hover:bg-accent-600 text-ink text-sm font-bold shadow-[0_4px_20px_rgba(240,90,34,0.45)] hover:shadow-[0_6px_28px_rgba(240,90,34,0.55)] transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {ctaText}
              <ArrowRight className="h-4 w-4" />
            </a>
            {hasSecondaryCta && (
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-white/10 hover:bg-white/18 text-white text-sm font-semibold border border-white/25 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Explore Tour Packages
              </Link>
            )}
          </MotionFadeIn>
        )}

        {/* Search — premium glass form with Cab/Hotel/Tour tabs.
            With live offers it shares a 3-col grid (form 2/3, circular
            offer slider 1/3); without, the current full-width design. */}
        {offers.length > 0 ? (
          <MotionFadeIn delay={hasPrimaryCta ? 0.3 : 0.2} className="mt-6 lg:mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-6 lg:gap-8 items-center justify-center">
              <div className="min-w-0">
                <HeroSearchForm hiddenServices={hiddenServices} />
              </div>
              <div className="w-full max-w-[280px] justify-self-center lg:w-[250px] xl:w-[280px] lg:justify-self-end">
                <HeroOfferSlider offers={offers} />
              </div>
            </div>
          </MotionFadeIn>
        ) : (
          <MotionFadeIn delay={hasPrimaryCta ? 0.3 : 0.2} className="mt-6 lg:mt-8">
            <HeroSearchForm hiddenServices={hiddenServices} />
          </MotionFadeIn>
        )}
      </Container>
    </section>
  );
}
