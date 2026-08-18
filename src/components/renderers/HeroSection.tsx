"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui";
import { MotionFadeIn } from "@/components/ui";
import { pick } from "@/types/cms";
import type { ServiceType } from "@/types/cms";
import CabSearchForm from "@/components/sections/CabSearchForm";
import HeroSearchForm from "@/components/sections/HeroSearchForm";

interface HeroSectionProps {
  variant: Record<string, unknown>;
  serviceType?: ServiceType | null;
}

export default function HeroSection({ variant }: HeroSectionProps) {
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

  // Stats — hardcoded (no DB field)
  const stats = [
    { value: "50K+",   label: "Happy Travelers" },
    { value: "1,200+", label: "Partner Hotels" },
    { value: "800+",   label: "Verified Drivers" },
    { value: "30+",    label: "Cities" },
  ];

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
      className="relative isolate overflow-hidden text-white"
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
        <img
          src={activeImage}
          alt=""
          aria-hidden
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
      <Container size="xl" className="relative pt-10 pb-20 lg:pt-14 lg:pb-28">
        {/* Eyebrow badge */}
        <MotionFadeIn className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-md shadow-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" aria-hidden />
            {eyebrow}
          </span>
        </MotionFadeIn>

        {/* Headline */}
        {headline && (
          <MotionFadeIn delay={0.1} className="mx-auto mt-7 max-w-4xl text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold leading-[1.05] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
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
          <MotionFadeIn delay={0.15} className="mx-auto mt-5 max-w-2xl text-center">
            <p className={`text-base sm:text-lg leading-relaxed drop-shadow-sm ${hasMedia ? "text-white/90" : "text-white/75"}`}>
              {subline}
            </p>
          </MotionFadeIn>
        )}

        {/* CTAs — only render when backend provides them */}
        {hasPrimaryCta && (
          <MotionFadeIn delay={0.2} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href={ctaLink!}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-accent-500 hover:bg-accent-600 text-ink font-bold shadow-[0_4px_20px_rgba(240,90,34,0.45)] hover:shadow-[0_6px_28px_rgba(240,90,34,0.55)] transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {ctaText}
              <ArrowRight className="h-4 w-4" />
            </a>
            {hasSecondaryCta && (
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-white/10 hover:bg-white/18 text-white font-semibold border border-white/25 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Explore Tour Packages
              </Link>
            )}
          </MotionFadeIn>
        )}

        {/* Search — premium glass form with Cab/Hotel/Tour tabs */}
        <MotionFadeIn delay={hasPrimaryCta ? 0.3 : 0.2} className="mt-10 lg:mt-14">
          <HeroSearchForm />
        </MotionFadeIn>

        {/* Stats */}
        <MotionFadeIn delay={hasPrimaryCta ? 0.4 : 0.3} className="mt-14 lg:mt-20">
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-white/15 max-w-4xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="text-center px-4">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <div className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-br from-accent-400 to-accent-500 bg-clip-text text-transparent drop-shadow-sm">
                    {s.value}
                  </div>
                  <div className={`mt-1 text-sm ${hasMedia ? "text-white/80" : "text-white/65"}`}>{s.label}</div>
                </dd>
              </div>
            ))}
          </dl>
        </MotionFadeIn>
      </Container>
    </section>
  );
}
