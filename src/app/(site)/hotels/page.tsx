import { Container } from "@/components/ui";
import { MotionFadeIn } from "@/components/ui";
import HeroSearchForm from "@/components/sections/HeroSearchForm";
import HotelExploreSection, { HotelPopularCityChips } from "@/components/sections/HotelExploreSection";
import { CtaSection } from "@/components/renderers";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────
// Reads the HOTEL service type's seo_title/seo_description/seo_keywords
// from the backend; falls back to bundled static values.
import type { Metadata } from "next";
import { resolveSeo, toMetadata, getServiceTypeSeo } from "@/services/seoService";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo("HOTEL");
  return toMetadata(seo, "/hotels");
}

export default async function HotelsPage() {
  // Hero/banner image configured by the admin (Settings → Service Types → HOTEL).
  const serviceSeo = await getServiceTypeSeo();
  const hotelImage = serviceSeo.HOTEL?.image_url ?? null;

  return (
    <>
      {/* ── Hero: dark premium backdrop + glass search (same as homepage) ── */}
      <section className="relative isolate overflow-hidden text-white">
        {/* Admin banner image (Settings → Service Types → HOTEL) layered under
            the navy gradient so the copy stays readable either way. */}
        {hotelImage && (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${hotelImage}")` }}
          />
        )}
        {/* Deep navy gradient — mirrors the homepage hero's no-media variant */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: hotelImage
              ? "linear-gradient(135deg, rgba(11,27,59,0.82) 0%, rgba(26,58,138,0.72) 55%, rgba(17,64,163,0.78) 100%)"
              : "linear-gradient(135deg, #0B1B3B 0%, #1A3A8A 55%, #1140A3 100%)",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-500/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-3xl" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;charset=utf-8,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C%2Fg%3E%3C/svg%3E\")",
          }}
        />

        <Container size="xl" className="relative pt-10 pb-16 lg:pt-14 lg:pb-20">
          <MotionFadeIn className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-md shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" aria-hidden />
              Where to stay
            </span>
          </MotionFadeIn>

          <MotionFadeIn delay={0.1} className="mx-auto mt-7 max-w-3xl text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.05] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              Hotels for{" "}
              <span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">
                every budget
              </span>
            </h1>
          </MotionFadeIn>

          <MotionFadeIn delay={0.15} className="mx-auto mt-5 max-w-2xl text-center">
            <p className="text-base sm:text-lg leading-relaxed text-white/75 drop-shadow-sm">
              Handpicked hotels, resorts, and homestays — transparent pricing,
              real reviews, and free cancellation on most stays.
            </p>
          </MotionFadeIn>

          {/* Glass search — Cab / Hotel / Tour tabs, Hotel active (same as homepage hero) */}
          <MotionFadeIn delay={0.2} className="mt-9 lg:mt-12 max-w-5xl mx-auto">
            <HeroSearchForm defaultService="HOTEL" />
          </MotionFadeIn>

          <HotelPopularCityChips />
        </Container>
      </section>

      {/* ── Live hotel explorer (data from the database) ───────────── */}
      <HotelExploreSection />

      <CtaSection
        variant={{
          title: "Plan your next getaway",
          subtitle: "Find stays at the best prices, guaranteed — compare rates across 30+ cities.",
          cta_text: "Explore all hotels",
          cta_link: "/hotels/results",
        }}
      />
    </>
  );
}
