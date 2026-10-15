"use client";

// ============================================================
// LandingHero — the first screen of every landing page.
//
// Three states, decided by the backend's hero.image_source:
//  - admin/curated → the uploaded photo (desktop + mobile crops,
//    <picture> so a phone never downloads the 1920px banner)
//  - gradient      → the brand gradient treatment. This is the DEFAULT
//    look of every new page (owner decision: no stock fallback art),
//    so it is composed deliberately, not improvised — and it has to
//    hold up at 390px as much as at 1440px.
//
// Responsive contract (plan §Phase 4):
//  <640      h-[68svh] min-h-[380px], single column, copy bottom-left
//  640-1023  h-[74svh]
//  ≥1024     h-[560px], 7/5 two-column with the stat card
// ============================================================

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Car,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Container } from "@/components/ui";
import {
  MotionFadeIn,
  MotionParallax,
  MotionReveal,
  usePrefersReducedMotion,
} from "@/components/ui";
import type { LandingBundle, LandingStat } from "@/lib/landingIndex";

const INR = (n: number) =>
  `₹${Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const SERVICE_ICON = {
  CAB: Car,
  HOTEL: Building2,
  TOUR: MapPin,
} as const;

function statValue(s: LandingStat): string {
  const raw = s.value;
  if (typeof raw === "number")
    return raw >= 1000 ? raw.toLocaleString("en-IN") : String(raw);
  return raw;
}

export default function LandingHero({ data }: { data: LandingBundle }) {
  const { hero, cta, stats, page_type, service_type, scope } = data;
  const reduced = usePrefersReducedMotion();
  const [isLg, setIsLg] = useState(false);

  // Parallax is lg-only per the contract — phones don't get the scroll
  // handler at all. False on first render matches the server markup.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsLg(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsLg(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const hasPhoto = hero.image_source !== "gradient" && Boolean(hero.image_url);
  const Icon =
    (service_type && SERVICE_ICON[service_type as keyof typeof SERVICE_ICON]) ||
    (page_type === "CITY_HUB" ? Sparkles : MapPin);

  const heroImage = (
    <picture>
      {hero.mobile_image_url && (
        <source media="(max-width: 639px)" srcSet={hero.mobile_image_url} />
      )}
      <Image
        src={hero.image_url!}
        alt={hero.alt_text ?? `${scope.display_name} on WayTero`}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </picture>
  );

  return (
    <section
      className={`relative isolate overflow-hidden ${
        hasPhoto ? "" : "bg-gradient-to-br from-primary-50 via-white to-accent-50"
      }`}
    >
      {hasPhoto &&
        (isLg && !reduced ? (
          <MotionParallax speed={0.12} className="absolute inset-0 -z-10">
            {heroImage}
          </MotionParallax>
        ) : (
          <div className="absolute inset-0 -z-10">{heroImage}</div>
        ))}

      {/* Text legibility over a photo; the gradient treatment needs no scrim. */}
      {hasPhoto && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-black"
          style={{ opacity: hero.overlay_opacity }}
        />
      )}

      {/* Decorative composition for the gradient state. */}
      {!hasPhoto && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-100/60 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-accent-100/50 blur-3xl" />
          <Icon
            className={`absolute text-primary-200/50 ${
              hasPhoto ? "" : "right-8 bottom-8 h-40 w-40 lg:h-64 lg:w-64"
            }`}
            strokeWidth={1.2}
          />
        </div>
      )}

      <Container
        size="xl"
        className={`flex min-h-[380px] flex-col justify-end pb-10 sm:pb-14 lg:h-[560px] lg:min-h-0 lg:justify-center lg:pb-0 ${
          hasPhoto ? "h-[68svh] text-white sm:h-[74svh]" : "py-16 text-ink lg:py-0"
        }`}
      >
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Copy — 7/12 on lg, full width below */}
          <div className="lg:col-span-7">
            {hero.eyebrow && (
              <MotionReveal
                direction="left"
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${
                  hasPhoto
                    ? "border-white/30 bg-white/10 text-white backdrop-blur"
                    : "border-accent-100 bg-accent-50 text-accent-600"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {hero.eyebrow}
              </MotionReveal>
            )}

            <MotionFadeIn delay={0.08}>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] xl:text-6xl">
                {hero.headline}
              </h1>
            </MotionFadeIn>

            {hero.subheadline && (
              <MotionFadeIn delay={0.16}>
                <p
                  className={`mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${
                    hasPhoto ? "text-white/90" : "text-ink-3"
                  }`}
                >
                  {hero.subheadline}
                </p>
              </MotionFadeIn>
            )}

            {hero.body_text && (
              <MotionFadeIn delay={0.24}>
                <p
                  className={`mt-3 hidden max-w-2xl text-sm leading-relaxed sm:block sm:text-base ${
                    hasPhoto ? "text-white/80" : "text-ink-4"
                  }`}
                >
                  {hero.body_text}
                </p>
              </MotionFadeIn>
            )}

            {(cta.text || cta.text2) && (
              <MotionFadeIn delay={0.32}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  {cta.text && cta.link && (
                    <Link
                      href={cta.link}
                      className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-wt transition-all hover:-translate-y-0.5 ${
                        hasPhoto
                          ? "bg-white text-primary-700 hover:bg-white/90"
                          : "bg-primary-600 text-white shadow-wt-primary hover:bg-primary-700"
                      }`}
                    >
                      {cta.text}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  {cta.text2 && cta.link2 && (
                    <Link
                      href={cta.link2}
                      className={`inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                        hasPhoto
                          ? "border-white/40 text-white hover:bg-white/10"
                          : "border-ink-7 bg-white text-ink hover:border-primary-200"
                      }`}
                    >
                      {cta.text2}
                    </Link>
                  )}
                </div>
              </MotionFadeIn>
            )}

            {hasPhoto && (
              <p
                className={`mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                  hasPhoto ? "text-white/70" : "text-ink-4"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified partners · Upfront prices · Transparent cancellation
              </p>
            )}
          </div>

          {/* Stat card — lg only; phones see the same numbers in the stats strip */}
          {stats.length > 0 && (
            <div className="hidden lg:col-span-5 lg:block">
              <MotionFadeIn delay={0.24}>
                <div
                  className={`rounded-2xl border p-6 backdrop-blur ${
                    hasPhoto
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-ink-7 bg-white/80 text-ink shadow-wt-lg"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] opacity-80">
                    <Wallet className="h-4 w-4" />
                    {scope.display_name} at a glance
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-4">
                    {stats.slice(0, 4).map((s, i) => (
                      <div key={i}>
                        <dt className="text-[11px] uppercase tracking-wide opacity-70">
                          {s.label}
                        </dt>
                        <dd className="mt-0.5 text-2xl font-extrabold">
                          {statValue(s)}
                          {s.suffix}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {data.prices.cab_from != null && (
                    <p className="mt-4 border-t border-current/10 pt-3 text-[11px] opacity-70">
                      Cab sample: {data.meta.sample_distance_km} km ride, prices
                      exclude GST
                    </p>
                  )}
                </div>
              </MotionFadeIn>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
