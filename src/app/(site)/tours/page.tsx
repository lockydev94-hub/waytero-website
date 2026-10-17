import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Container, MotionFadeIn } from "@/components/ui";
import HeroSearchForm from "@/components/sections/HeroSearchForm";
import LandingStatsStrip from "@/components/landing/LandingStatsStrip";
import LandingSteps from "@/components/landing/LandingSteps";
import PageFaq, { type FaqItem } from "@/components/sections/PageFaq";
import TourWhatIncludedBand from "@/components/sections/TourWhatIncludedBand";
import type { InclusionLine } from "@/components/tours/TourFilters";
import TourPartnerHotelsBand from "@/components/sections/TourPartnerHotelsBand";
import { CtaSection } from "@/components/renderers";
import JsonLd, { faqPageSchema } from "@/components/sections/JsonLd";
import ToursListingPage from "./tours-listing";
import { API_BASE } from "@/lib/apiBase";
import { resolveSeo, toMetadata, getServiceTypeSeo } from "@/services/seoService";
import { getAvailability, serviceVisible, hiddenServices } from "@/lib/availability";
import type { PublicTourDestination } from "@/services/tourService";
import type { LandingStat } from "@/lib/landingIndex";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────
// Reads the TOUR service type's seo_title/seo_description/seo_keywords
// from the backend; falls back to bundled static values.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo("TOUR");
  return toMetadata(seo, "/tours");
}

// Every answer here is either structural (how the platform prices and books a
// tour) or read from the live cancellation ladder in the FAQ's own copy. The
// one thing it never does is quote a number the pricing engine or the
// policy table can't back.
const TOUR_FAQS: FaqItem[] = [
  {
    question: "Is the price on a tour package per person or for the whole group?",
    answer: "For the whole package. A partner prices a tour against traveller slabs — 2 people, 4 people, 6 people and so on — and the price you see is the slab that covers your group size. That is why the same tour can show two different totals depending on how many of you are going; the package page lists every slab, so you can see the one you are being charged.",
  },
  {
    question: "Why does some tour have a minimum number of travellers?",
    answer: "A tour's costs — vehicle, guide, accommodation — are shared across the group, so a package is only confirmed once it reaches the party size the partner set its price for. The minimum and maximum on the card are that range, and booking below the minimum is blocked rather than quietly upsold.",
  },
  {
    question: "What happens if I cancel a tour?",
    answer: "Refunds follow a day-based ladder counted from your travel date, and it is strict the closer to departure you are: full refund well ahead, then successively smaller percentages, and nothing once the window closes. The ladder that applies is the one on your package — a partner can set its own — and it is shown at checkout before you pay and repeated in your confirmation.",
  },
  {
    question: "Are transfers, tickets and meals part of the package?",
    answer: "Each package lists its own inclusions and exclusions in plain language, alongside the day-by-day itinerary. The general rule is that what the itinerary names is covered and what it doesn't is not: airfare or train fare to the starting city, meals beyond those listed, entry and safari fees, and personal expenses are normally excluded, which is why the package page prints both lists together.",
  },
  {
    question: "Can I book a date that isn't listed, or change an itinerary?",
    answer: "Yes. Packages come in fixed-departure, private, group, pilgrimage and corporate forms, and a private tour is built around your dates. If nothing on this page fits your calendar, the custom-tour request goes to our trip desk and comes back as a costed itinerary rather than a guess.",
  },
];

const INR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface DestinationRow {
  city_id: number;
  city_name: string;
  state_name?: string;
  package_count: number;
  hero_image_url?: string | null;
  starting_price?: number | null;
}

interface TourRow {
  id: number;
  duration_days: number;
  duration_nights: number;
  starting_price?: number;
  inclusions?: { text: string }[];
  exclusions?: { text: string }[];
}

export default async function ToursPage() {
  // Hard availability gate (owner decision): TOUR disabled or zero real
  // supply in the DB → the page 404s site-wide, no "coming soon" fakery.
  const av = await getAvailability();
  if (!serviceVisible(av, "TOUR")) notFound();

  // Hero/banner image configured by the admin (Settings → Service Types → TOUR).
  const serviceSeo = await getServiceTypeSeo();
  const heroImage = serviceSeo.TOUR?.image_url ?? null;

  // One round of fetches for the hero, the listing's destination grid and the
  // counted bands below. Unreachable API → null → the band is omitted.
  const [destRaw, packages] = await Promise.all([
    fetchJson<{ items?: DestinationRow[] } | DestinationRow[]>(
      `${API_BASE}/public/tours/popular-destinations`,
    ),
    fetchJson<{ items?: TourRow[]; total?: number }>(`${API_BASE}/public/tours/packages?page_size=48`),
  ]);
  const destinations: PublicTourDestination[] = (
    Array.isArray(destRaw) ? destRaw : destRaw?.items ?? []
  ).map((d) => ({
    city_id: d.city_id,
    city_name: d.city_name,
    state_name: d.state_name,
    package_count: d.package_count ?? 0,
    hero_image_url: d.hero_image_url ?? null,
    starting_price: d.starting_price ?? undefined,
  }));

  const tours = packages?.items ?? [];
  const total = Number(packages?.total ?? tours.length);

  // Trust stats: only what these rows actually say.
  const stats: LandingStat[] = [];
  if (total > 0) stats.push({ value: total, label: "tour packages live" });
  if (destinations.length > 0)
    stats.push({ value: destinations.length, label: "destinations covered" });
  const lowest = tours
    .map((t) => Number(t.starting_price ?? 0))
    .filter((n) => n > 0)
    .sort((a, b) => a - b)[0];
  if (lowest) stats.push({ value: INR(lowest), label: "cheapest package total" });
  const longest = tours.reduce(
    (max, t) => Math.max(max, Number(t.duration_days ?? 0)),
    0,
  );
  if (longest > 1) stats.push({ value: `${longest} days`, label: "longest itinerary listed" });

  // Included / not included, counted across the live packages. A line only
  // reaches the band if packages themselves declare it.
  const tally = (rows: TourRow[], key: "inclusions" | "exclusions") => {
    const c = new Map<string, number>();
    for (const t of rows) {
      for (const item of t[key] ?? []) {
        const text = (item?.text ?? "").trim();
        if (text) c.set(text, (c.get(text) ?? 0) + 1);
      }
    }
    return [...c.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 7)
      .map(([text, count]) => ({ text, count }));
  };
  const included: InclusionLine[] = tally(tours, "inclusions");
  const excluded: InclusionLine[] = tally(tours, "exclusions");

  return (
    <>
      <JsonLd data={faqPageSchema(TOUR_FAQS)} />

      {/* ── Hero: dark premium backdrop, same treatment as /hotels ── */}
      <section className="relative isolate overflow-hidden text-white">
        {heroImage && (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${heroImage}")` }}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: heroImage
              ? "linear-gradient(135deg, rgba(11,27,59,0.84) 0%, rgba(26,58,138,0.74) 55%, rgba(17,64,163,0.80) 100%)"
              : "linear-gradient(135deg, #0B1B3B 0%, #1A3A8A 55%, #1140A3 100%)",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-500/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-3xl" />

        <Container size="xl" className="relative pt-10 pb-14 lg:pt-14 lg:pb-16">
          <nav className="mb-4 text-xs text-white/60">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white/90">Tours</span>
          </nav>

          <MotionFadeIn className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-md shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-accent-300" aria-hidden />
              Curated experiences
            </span>
          </MotionFadeIn>

          <MotionFadeIn delay={0.1} className="mx-auto mt-6 max-w-3xl text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.06] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              Tour packages,{" "}
              <span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">
                stress-free
              </span>
            </h1>
          </MotionFadeIn>

          <MotionFadeIn delay={0.15} className="mx-auto mt-5 max-w-2xl text-center">
            <p className="text-base sm:text-lg leading-relaxed text-white/75 drop-shadow-sm">
              Handpicked itineraries with verified operators — from weekend
              getaways to multi-day circuit tours, managed from booking to
              return.
            </p>
          </MotionFadeIn>

          <MotionFadeIn delay={0.2} className="mx-auto mt-9 max-w-5xl lg:mt-10">
            <HeroSearchForm defaultService="TOUR" hiddenServices={hiddenServices(av)} />
          </MotionFadeIn>
        </Container>
      </section>

      <LandingStatsStrip stats={stats} title="Live on WayTero today" bg="white" pad="tight" />

      {/* Listing shell — client island: filters, destinations grid, results.
          Reads searchParams, so it needs a Suspense boundary to prerender. */}
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center bg-white">
            <span className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          </div>
        }
      >
        <ToursListingPage
          destinations={destinations}
          total={total}
          inclusions={included}
        />
      </Suspense>

      <TourWhatIncludedBand included={included} excluded={excluded} total={total} bg="white" />

      <LandingSteps serviceType="TOUR" bg="muted" pad="tight" />

      <PageFaq
        faqs={TOUR_FAQS}
        eyebrow="Before you book"
        title="Tour booking questions, answered"
        pad="tight"
        overlay="dots-faint"
      />

      <TourPartnerHotelsBand cityIds={destinations.map((d) => d.city_id)} />

      <CtaSection
        pad="tight"
        cardSize="compact"
        variant={{
          title: "Not finding the perfect tour?",
          subtitle: "Tell us where you want to go and we'll plan it for you.",
          cta_text: "Plan a custom tour",
          cta_link: "/contact",
        }}
      />
    </>
  );
}
