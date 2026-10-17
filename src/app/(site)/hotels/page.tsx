import type { Metadata } from "next";
import { Camera, ShieldCheck, ReceiptText, CalendarClock } from "lucide-react";
import { Container, IconBox } from "@/components/ui";
import { Section, SectionHeader } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { MotionFadeIn } from "@/components/ui";
import HeroSearchForm from "@/components/sections/HeroSearchForm";
import HotelExploreSection, { HotelPopularCityChips } from "@/components/sections/HotelExploreSection";
import HotelPopularStaysBand from "@/components/sections/HotelPopularStaysBand";
import HotelAmenityBand from "@/components/sections/HotelAmenityBand";
import LandingStatsStrip from "@/components/landing/LandingStatsStrip";
import LandingSteps from "@/components/landing/LandingSteps";
import PopularRoutesSection from "@/components/renderers/PopularRoutesSection";
import PageFaq, { type FaqItem } from "@/components/sections/PageFaq";
import { CtaSection } from "@/components/renderers";
import JsonLd, { faqPageSchema } from "@/components/sections/JsonLd";
import { notFound } from "next/navigation";
import { resolveSeo, toMetadata, getServiceTypeSeo } from "@/services/seoService";
import { API_BASE } from "@/lib/apiBase";
import { getAvailability, serviceVisible } from "@/lib/availability";
import type { LandingStat } from "@/lib/landingIndex";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────
// Reads the HOTEL service type's seo_title/seo_description/seo_keywords
// from the backend; falls back to bundled static values.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo("HOTEL");
  return toMetadata(seo, "/hotels");
}

// What a hotel buyer actually cares about, stated as features rather than
// promises with numbers in front of them. Nothing here quotes a rating, a
// refund percentage or a price the database doesn't already show on a card.
const FEATURES = [
  { icon: Camera, title: "Real photos, real reviews", desc: "Gallery images from the property and guest ratings that come from posted reviews.", tone: "primary" as const },
  { icon: ShieldCheck, title: "Verified partner stays", desc: "Hotels onboarded as partners, with their room categories and prices published.", tone: "success" as const },
  { icon: ReceiptText, title: "The total before you pay", desc: "Room, nights and taxes are itemised in the quote — no arrival-time charges.", tone: "accent" as const },
  { icon: CalendarClock, title: "Cancellation shown up front", desc: "Each hotel sets its own refund ladder, printed on its page before you book.", tone: "info" as const },
];

// Feature-descriptive answers, same standard as CAB_FAQS on /cabs. The refund
// question describes where the ladder comes from rather than quoting one,
// because every hotel sets its own.
const HOTEL_FAQS: FaqItem[] = [
  {
    question: "What does the “from ₹” price on a hotel card mean?",
    answer: "It is the base nightly price of that property's cheapest published room category. Your total is built from the nights you actually stay, the room you pick and the number of guests, so it is calculated for your dates in the quote — before you pay, not at the desk.",
  },
  {
    question: "Are taxes added later?",
    answer: "No. The quote shows the room amount and, where GST applies to the property, the tax as its own line with the total beside it. What you are charged and what appears on your invoice are the same figure.",
  },
  {
    question: "Can I cancel a hotel booking?",
    answer: "Every hotel publishes its own cancellation ladder — the free window, the partial refund tiers and the deadline before check-in. The one that applies to your stay is shown on that hotel's page before you book and repeated in your confirmation, so the terms are yours to read rather than ours to summarise.",
  },
  {
    question: "Are the guest ratings on WayTero real?",
    answer: "They are the average of reviews posted by guests who booked through the platform, and each card shows how many reviews sit behind the score. A property with no reviews yet is marked New rather than given a score it hasn't earned.",
  },
  {
    question: "Do the photos and amenities match the room I get?",
    answer: "Amenities and images are attached to the hotel and its room categories by the partner that operates it. The room you book lists what applies to that category specifically — bed type, occupancy, view, meal plan and its own pictures — on the booking page.",
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

interface HotelCityLite {
  id: number;
  name: string;
  hotel_count: number;
}

interface HotelLite {
  id: number;
  starting_price: number;
  amenities?: string[];
}

export default async function HotelsPage() {
  // Hard availability gate (owner decision): HOTEL disabled or zero real
  // supply in the DB → the page 404s site-wide, no "coming soon" fakery.
  const av = await getAvailability();
  if (!serviceVisible(av, "HOTEL")) notFound();

  // Hero/banner image configured by the admin (Settings → Service Types → HOTEL).
  const serviceSeo = await getServiceTypeSeo();
  const hotelImage = serviceSeo.HOTEL?.image_url ?? null;

  // One round of fetches for the data-driven bands. Each is revalidated for
  // five minutes and yields null when the backend is unreachable, so a
  // stopped API hides bands instead of failing the page.
  const [cities, search] = await Promise.all([
    fetchJson<HotelCityLite[] | { items?: HotelCityLite[] }>(`${API_BASE}/public/hotel/cities`),
    fetchJson<{ items?: HotelLite[]; total?: number }>(`${API_BASE}/public/hotel/search?page_size=20`),
  ]);
  const cityRows = (Array.isArray(cities) ? cities : cities?.items ?? []).filter(
    (c) => Number(c.hotel_count ?? 0) > 0,
  );
  const hotelRows = search?.items ?? [];

  // Trust stats: only counts the database actually has rows for.
  const stats: LandingStat[] = [];
  if (cityRows.length > 0) stats.push({ value: cityRows.length, label: "cities with live stays" });
  if (hotelRows.length > 0) stats.push({ value: hotelRows.length, label: "hotels bookable now" });
  const lowest = hotelRows
    .map((h) => Number(h.starting_price ?? 0))
    .filter((n) => n > 0)
    .sort((a, b) => a - b)[0];
  if (lowest) stats.push({ value: INR(lowest), label: "lowest nightly price listed" });
  const withWifi = hotelRows.filter((h) =>
    (h.amenities ?? []).some((a) => a.toLowerCase().includes("wifi")),
  ).length;
  if (withWifi > 0) stats.push({ value: withWifi, label: "stays with free WiFi" });

  return (
    <>
      <JsonLd data={faqPageSchema(HOTEL_FAQS)} />

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
              "url(\"data:image/svg+xml;charset=utf-8,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
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

      <LandingStatsStrip stats={stats} title="Live on WayTero today" bg="white" pad="tight" />

      {/* Why-book promises as one icon row — the /cabs shape, so the page
          gets to the live inventory without four boxed cards in the way. */}
      <Section bg="muted" pad="tight" overlay="dots-faint">
        <Container size="xl">
          <SectionHeader
            eyebrow="Why book hotels with WayTero"
            title="A stay with nothing hidden"
            accent="primary"
            underline
            animatedEyebrow
            scale="home"
          />
          <MotionStagger className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <MotionStaggerItem key={f.title}>
                  <IconBox icon={<Icon />} tone={f.tone} size="md" glow />
                  <h3 className="mt-3 text-base font-bold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{f.desc}</p>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
        </Container>
      </Section>

      {/* ── Live hotel explorer (data from the database) ───────────── */}
      <HotelExploreSection bg="white" pad="tight" />

      <HotelPopularStaysBand bg="muted" />

      {/* The cab routes that end at these stays — same band the homepage and
          /cabs read from /public/routes, with its own empty guard. */}
      <PopularRoutesSection
        bg="white"
        pad="tight"
        variant={{
          variant_tag: "Getting there",
          headline: "Popular cab routes to these cities",
          subheadline: "Fares for the trips people take into the cities where we list stays.",
        }}
      />

      <LandingSteps serviceType="HOTEL" bg="muted" pad="tight" />

      <HotelAmenityBand bg="white" />

      <PageFaq
        faqs={HOTEL_FAQS}
        eyebrow="Before you book"
        title="Hotel booking questions, answered"
        pad="tight"
        overlay="dots-faint"
      />

      <CtaSection
        pad="tight"
        cardSize="compact"
        variant={{
          title: "Plan your next getaway",
          subtitle: "Partner hotels in the cities WayTero serves — transparent, upfront pricing.",
          cta_text: "Explore all hotels",
          cta_link: "/hotels/results",
        }}
      />
    </>
  );
}
