import Image from "next/image";
import { Clock, ShieldCheck, Wallet, MapPin } from "lucide-react";
import { Container, IconBox } from "@/components/ui";
import { Section, SectionHeader } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { CtaSection } from "@/components/renderers";
import PopularRoutesSection from "@/components/renderers/PopularRoutesSection";
import LandingStatsStrip from "@/components/landing/LandingStatsStrip";
import LandingSteps from "@/components/landing/LandingSteps";
import PageFaq, { type FaqItem } from "@/components/sections/PageFaq";
import CabSearchForm from "@/components/sections/CabSearchForm";
import CabVehicleFares from "@/components/sections/CabVehicleFares";
import CabHotelPickups from "@/components/sections/CabHotelPickups";
import JsonLd, {
  breadcrumbList,
  faqPageSchema,
  serviceSchema,
  webPageSchema,
} from "@/components/sections/JsonLd";
import { API_BASE } from "@/lib/apiBase";
import { fetchCabCities, pickCabCity } from "@/lib/cabCity";
import type { LandingStat } from "@/lib/landingIndex";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────
// Reads the CAB service type's seo_title/seo_description/seo_keywords from
// the backend (Settings → Service Types); falls back to bundled static
// values when the admin hasn't filled them in or the API is unreachable.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveSeo, toMetadata, getServiceTypeSeo } from "@/services/seoService";
import publicCmsService from "@/services/publicCms";
import { getAvailability, serviceVisible } from "@/lib/availability";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo("CAB");
  return toMetadata(seo, "/cabs");
}

const FEATURES = [
  { icon: Clock, title: "60-sec booking", desc: "Outstation or local — book in under a minute.", tone: "primary" as const },
  { icon: ShieldCheck, title: "Verified drivers", desc: "Background-checked, trained, ID-on-file.", tone: "success" as const },
  { icon: Wallet, title: "No surge pricing", desc: "Upfront fare. What you see is what you pay.", tone: "accent" as const },
  { icon: MapPin, title: "Driver details", desc: "Name, vehicle number and contact, once a driver is assigned.", tone: "info" as const },
];

// Authored, feature-descriptive copy — the same five subjects every cab
// buyer asks about. Nothing here quotes a number the fare engine or the
// live policy can't back (the precedent is TRIP_FAQS in /cabs/{trip}).
const CAB_FAQS: FaqItem[] = [
  {
    question: "How is the fare I see calculated?",
    answer: "Base fare (which includes a set number of km), then the per-km rate for the distance beyond that, plus driver allowance. Tolls and night charges, where they apply, are their own lines. The same fare engine that prices your booking produces the estimates shown on this page, so nothing appears for the first time after the ride.",
  },
  {
    question: "What does driver allowance cover?",
    answer: "It is the driver's time — including waiting at stops and, on multi-day itineraries, the night halt. It is quoted per trip type by the fare rule for your city and itemised in your breakdown rather than folded silently into a distance rate.",
  },
  {
    question: "Is there a night charge?",
    answer: "Trips that start or finish in night hours carry a night charge. It is displayed separately in the fare breakdown before you confirm, and it is part of the upfront total — it is never added at the end of the ride.",
  },
  {
    question: "Can I cancel a cab booking?",
    answer: "Yes. The cancellation terms that apply to your trip are shown at checkout, before you pay. Where a refund is due it goes back to your original payment method or WayTero Wallet, typically within 3–5 business days.",
  },
  {
    question: "Is tax included in the quoted fare?",
    answer: "The fare you see upfront is the pre-tax figure. Any applicable tax is added as its own line at checkout and appears on your invoice, so what you paid and what you are billed for always match.",
  },
];

async function fetchCount<T>(url: string): Promise<T[] | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}

export default async function CabsPage() {
  // Hard availability gate: CAB hidden site-wide when disabled or no
  // priced city supply exists — the listing 404s instead of an empty page.
  const av = await getAvailability();
  if (!serviceVisible(av, "CAB")) notFound();
  // Hero/banner image configured by the admin (Settings → Service Types → CAB).
  const serviceSeo = await getServiceTypeSeo();
  const cab = serviceSeo.CAB;
  const cabImage = cab?.image_url ?? null;

  // One round of fetches for every data-driven band below. Each is
  // revalidated for 5 minutes and yields null when the backend is
  // unreachable, so a stopped API hides bands instead of failing the page.
  const [counts, cities, vehicleCategories] = await Promise.all([
    publicCmsService.getHomepageBandCounts(),
    fetchCabCities(),
    fetchCount<{ id: number }>(`${API_BASE}/public/cab/vehicle-categories`),
  ]);
  // The city the fare and hotel bands speak about — same rule for both, so
  // the page never quotes one city and lists stays from another.
  const city = pickCabCity(cities);

  // Trust stats: only counts the database actually has rows for.
  const stats: LandingStat[] = [];
  const citiesCount = counts?.POPULAR_CITIES ?? 0;
  const routesCount = counts?.POPULAR_ROUTES ?? 0;
  const hotelsCount = counts?.FEATURED_HOTELS ?? 0;
  const vehicleTypes = vehicleCategories?.length ?? 0;
  if (citiesCount > 0) stats.push({ value: citiesCount, label: "cities with live cabs" });
  if (routesCount > 0) stats.push({ value: routesCount, label: "routes with set fares" });
  if (vehicleTypes > 0) stats.push({ value: vehicleTypes, label: "cab types to pick from" });
  if (hotelsCount > 0) stats.push({ value: hotelsCount, label: "partner hotels bookable" });

  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: "Cab booking — outstation, airport and local rides",
          description:
            "Book verified outstation, airport and local cabs with upfront fares, live trip status and support across the cities WayTero serves.",
          path: "/cabs",
        })}
      />
      <JsonLd
        data={serviceSchema({
          name: "Cab booking in India",
          description:
            "Outstation, airport transfer, local and round-trip cab booking with upfront fares and verified drivers.",
          path: "/cabs",
          areaName: "India",
          areaType: "Country",
          serviceType: "Taxi",
        })}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Cabs", path: "/cabs" },
        ])}
      />
      <JsonLd data={faqPageSchema(CAB_FAQS)} />

      <Section bg="white" pad="home">
        <Container size="wide">
          <div
            className={
              cabImage
                ? "grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-center"
                : "mx-auto grid max-w-[900px] gap-8"
            }
          >
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
                Outstation &amp; Local Rides
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-ink leading-[1.1] tracking-tight">
                Book a cab <span className="text-primary-600">in 60 seconds</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-ink-3 leading-relaxed">
                Reliable cabs in Bhubaneswar and the cities we serve — outstation,
                airport transfers, and local rides. Verified drivers, transparent
                pricing, and trip status you can check any time.
              </p>
              <div className="mt-5">
                <CabSearchForm variant="page" />
              </div>
            </div>

            {/* The admin's banner sits in its own panel rather than behind the
                headline: a full-bleed background put whatever the image contains
                (stock artwork with text printed into it, most of the time) under
                the H1. Cropped into a frame it can only ever look like a photo. */}
            {cabImage && (
              <div className="relative hidden aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-ink-7 shadow-wt-lg xl:block">
                <Image
                  src={cabImage}
                  alt={`${cab?.label ?? "Cab"} — WayTero`}
                  fill
                  priority
                  sizes="380px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </Container>
      </Section>

      <LandingStatsStrip stats={stats} title="Live on WayTero today" bg="muted" pad="tight" />

      {/* Why-cabs promises, in the homepage card language: quiet white card,
          pastel icon chip, one claim per card. */}
      <Section bg="white" pad="home" overlay="dots-faint">
        <Container size="wide">
          <SectionHeader
            eyebrow="Why book cabs with WayTero"
            title="A better cab experience"
            accent="primary"
            underline
            animatedEyebrow
            scale="home"
          />
          <MotionStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <MotionStaggerItem key={f.title}>
                  <div className="h-full rounded-2xl bg-white p-5 shadow-[0_10px_30px_-22px_rgba(16,24,40,0.45)] ring-1 ring-black/[0.05] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-wt-lg">
                    <IconBox icon={<Icon />} tone={f.tone} size="md" glow />
                    <h3 className="mt-3.5 text-[15px] font-bold text-ink">{f.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-4">{f.desc}</p>
                  </div>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
        </Container>
      </Section>

      <PopularRoutesSection bg="muted" pad="home" wide variant={{}} />

      <CabVehicleFares city={city} />

      <LandingSteps serviceType="CAB" bg="muted" pad="home" />

      <CabHotelPickups city={city} />

      <PageFaq
        faqs={CAB_FAQS}
        eyebrow="Before you book"
        title="Cab booking questions, answered"
        pad="home"
        bg="white"
        overlay="dots-faint"
      />

      <CtaSection
        pad="home"
        cardSize="compact"
        variant={{
          title: "Ready to ride?",
          subtitle: "Your next journey is one tap away.",
          cta_text: "See popular routes",
          cta_link: "/cabs/routes",
        }}
      />
    </>
  );
}
