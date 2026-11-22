import type { BandTone, PublicHomepage, HomepageSection } from "@/types/cms";
import {
  publicCmsService,
  type HomepageBandCounts,
  type PublicOfferSlide,
} from "@/services/publicCms";
import {
  HeroSection,
  HeroMarquee,
  ServicesSection,
  RideTypesSection,
  WhyUsSection,
  TourPackagesSection,
  TestimonialsSection,
  StatsSection,
  PartnersSection,
  PartnerCtaSection,
  PopularDestinationsSection,
  PopularRoutesSection,
  PopularCitiesSection,
  FeaturedHotelsSection,
  HowItWorksSection,
  OffersSection,
  FaqSection,
  NewsletterSection,
  AppDownloadSection,
  BlogSection,
} from "./index";
import { Skeleton } from "@/components/ui";
import IntentBanner from "@/components/sections/IntentBanner";
import HeroStatsStrip from "@/components/renderers/HeroStatsStrip";
import LandmarksSection from "@/components/renderers/LandmarksSection";
import { getLandingRefs, type LandingRef } from "@/lib/landingIndex";
import { getAvailability, hiddenServices, type ServiceKey } from "@/lib/availability";

/** Synthetic band id for the place-pickup strip. Negative so it can never
 *  collide with a CMS section row. */
const LANDMARKS_BAND_ID = -1;

/** Section keys whose content is sourced from a single vertical — hidden
 *  site-wide when that vertical is disabled or has zero real supply. */
const SECTION_SERVICE: Record<string, ServiceKey> = {
  TOUR_PACKAGES: "TOUR",
  POPULAR_DESTINATIONS: "TOUR",
  FEATURED_HOTELS: "HOTEL",
  // Ride types are cab trip types — with the cab vertical off there is
  // nothing for the cards to open.
  RIDE_TYPES: "CAB",
  // Route pills are cab corridors priced by the cab fare engine.
  POPULAR_ROUTES: "CAB",
  // City pills fall back to /tours when a city has no published landing
  // page, so the band goes with the tours vertical.
  POPULAR_CITIES: "TOUR",
};

/** Bands that are never part of the light alternation: the hero paints its
 *  own imagery, STATS and NEWSLETTER are navy. None of them takes a slot, so
 *  a dark band between two lights does not break the rhythm. */
const DARK_BANDS = new Set(["HERO", "NEWSLETTER"]);

/** Bands that fetch their own rows and disappear when there are none. The
 *  counts endpoint mirrors the filters those fetches apply. */
const COUNT_BANDS: Partial<Record<string, keyof HomepageBandCounts>> = {
  FEATURED_HOTELS: "FEATURED_HOTELS",
  POPULAR_DESTINATIONS: "POPULAR_DESTINATIONS",
  POPULAR_ROUTES: "POPULAR_ROUTES",
  POPULAR_CITIES: "POPULAR_CITIES",
  TOUR_PACKAGES: "TOUR_PACKAGES",
  BLOG: "BLOG",
};

/** Bands whose content is an admin-authored array on the variant payload.
 *  Each renderer returns null when its own array is empty. */
const VARIANT_LIST_KEYS: Record<string, string> = {
  FAQ: "faqs",
  HOW_IT_WORKS: "steps",
  PARTNERS: "partners",
  STATS: "stats",
  TESTIMONIALS: "testimonials",
};

/**
 * Would this band actually paint? The homepage alternates its light bands
 * white / off-white, and the alternation only holds if the walk skips the
 * bands that render nothing — which is why this has to be answered before
 * the children run, not after.
 *
 * `counts` is null when the endpoint is unreachable; the caller then leaves
 * every band on its own literal background rather than guessing.
 */
function bandWillPaint(
  section: HomepageSection,
  hidden: ServiceKey[],
  offers: PublicOfferSlide[],
  counts: HomepageBandCounts | null,
): boolean {
  const v = section.variant || {};
  const listKey = VARIANT_LIST_KEYS[section.section_key];
  if (listKey) return Array.isArray(v[listKey]) && (v[listKey] as unknown[]).length > 0;

  const countKey = COUNT_BANDS[section.section_key];
  if (countKey) return counts ? counts[countKey] > 0 : true;

  if (section.section_key === "OFFERS")
    return offers.some((o) => !hidden.includes(o.service_type));

  if (section.section_key === "RIDE_TYPES") {
    // Same rule as SERVICES: no admin list → the renderer's five defaults,
    // an explicitly emptied list → nothing at all.
    const items = Array.isArray(v.items) ? (v.items as unknown[]) : null;
    return items === null ? true : items.length > 0;
  }

  if (section.section_key === "SERVICES") {
    // With no admin list the renderer shows its four defaults, which only
    // vanish together if every vertical is hidden at once.
    const items = Array.isArray(v.items) ? (v.items as { link?: string }[]) : null;
    return items === null ? true : items.length > 0;
  }

  return true;
}

/**
 * Server-rendered variant of HomepageRenderer.
 * Prefetches the CMS payload at request time so the homepage is SEO-friendly
 * (server-rendered HTML) and falls back to sensible defaults if the CMS is
 * down or returns nothing.
 */
export default async function HomepageServer() {
  const [data, av, offers, counts, landingRefs] = await Promise.all([
    publicCmsService.getHomepage(),
    getAvailability(),
    publicCmsService.getOffers(),
    publicCmsService.getHomepageBandCounts(),
    getLandingRefs(),
  ]);
  const hidden = hiddenServices(av);
  const sections = (data?.sections?.length ? data.sections : defaultSections()) as HomepageSection[];
  const storeLinks = data?.footer?.app_store_links;

  const visible = sections.filter(
    (s) => !bandIsHiddenByService(s, hidden) && bandWillPaint(s, hidden, offers, counts),
  );

  // Place pages get a band of their own directly under the tours band — the
  // one place on the homepage where someone has just been looking at trips
  // and might reasonably want a pickup point. It only exists when there is at
  // least one published place page and the cab vertical is on, so the light
  // alternation below never counts a band that will not paint.
  const places = landingRefs.filter((r) => r.page_type === "PLACE_CABS");
  const showLandmarks = places.length > 0 && !hidden.includes("CAB");
  const bands: HomepageSection[] = [];
  for (const s of visible) {
    bands.push(s);
    if (showLandmarks && s.section_key === "TOUR_PACKAGES") {
      bands.push({
        id: LANDMARKS_BAND_ID,
        section_key: "LANDMARKS",
        display_order: s.display_order,
        is_active: true,
        service_type: "CAB",
        variant: {},
      });
    }
  }

  // Walk the bands that will really render and hand the light ones their
  // background in strict alternation, starting white under the dark hero.
  const tones = new Map<number, BandTone>();
  if (counts) {
    let light = 0;
    for (const s of bands) {
      if (DARK_BANDS.has(s.section_key)) continue;
      tones.set(s.id, light++ % 2 === 0 ? "white" : "muted");
    }
  }

  return (
    <>
      {bands.map((s) => (
        <SectionSwitch
          key={s.id}
          section={s}
          hidden={hidden}
          offers={offers}
          bg={tones.get(s.id)}
          storeLinks={storeLinks}
          places={places}
        />
      ))}
    </>
  );
}

/** A band bound to a vertical that is switched off site-wide. */
function bandIsHiddenByService(section: HomepageSection, hidden: ServiceKey[]): boolean {
  const boundService =
    SECTION_SERVICE[section.section_key] ??
    ((section.service_type === "CAB" || section.service_type === "HOTEL" || section.service_type === "TOUR")
      ? section.service_type
      : undefined);
  return !!boundService && hidden.includes(boundService);
}

function SectionSwitch({
  section,
  hidden,
  offers,
  bg,
  storeLinks,
  places,
}: {
  section: HomepageSection;
  hidden: ServiceKey[];
  offers: PublicOfferSlide[];
  bg?: BandTone;
  /** Footer settings' app_store_links — the app band's store badges. */
  storeLinks?: { android?: string; ios?: string };
  /** Published PLACE_CABS refs — the synthetic places band's rows. */
  places?: LandingRef[];
}) {
  const v = section.variant || {};
  // CMS can bind a section to a service type; the section keys above are
  // bound implicitly by their data source. Either way: hidden vertical →
  // no section (owner rule: no "coming soon" fakery for unavailable
  // verticals — the panel disappears entirely).
  if (bandIsHiddenByService(section, hidden)) return null;

  switch (section.section_key) {
    case "HERO":
      return (
        <>
          {/* The hero and its proof band share one viewport: the wrapper takes
              the height left under the header and the hero flexes into it, so
              the card, the photo and the four figures are all on the first
              screen together — as in the design. */}
          <div className="lg:flex lg:min-h-[calc(100svh-105px)] lg:flex-col">
            <HeroSection variant={v} serviceType={section.service_type} hiddenServices={hidden} offers={offers} />
            {/* Four-cell proof band welded to the hero's bottom edge (design). */}
            <HeroStatsStrip variant={v} />
          </div>
          {/* Coupon strip on the hero's bottom edge — a sibling because the
              hero clips its own overflow. */}
          <HeroMarquee variant={v} />
          {/* Inline airport/station nudge — client reads local intent. */}
          <IntentBanner />
        </>
      );
    case "SERVICES":
      return <ServicesSection variant={v} hidden={hidden} bg={bg} />;
    case "RIDE_TYPES":
      return <RideTypesSection variant={v} bg={bg} />;
    case "WHY_US":
      return <WhyUsSection variant={v} bg={bg} />;
    case "TOUR_PACKAGES":
      return <TourPackagesSection variant={v} bg={bg} />;
    case "LANDMARKS":
      return <LandmarksSection places={places ?? []} bg={bg} />;
    case "TESTIMONIALS":
      return <TestimonialsSection variant={v} bg={bg} />;
    case "STATS":
      return <StatsSection variant={v} bg={bg} />;
    case "PARTNERS":
      return <PartnersSection variant={v} bg={bg} />;
    case "CTA":
      // The homepage closes on partner recruitment; the “Ready for your next
      // journey?” band still serves the marketing pages (CtaSection).
      return <PartnerCtaSection variant={v} bg={bg} />;
    case "POPULAR_DESTINATIONS":
      return <PopularDestinationsSection variant={v} bg={bg} />;
    case "POPULAR_ROUTES":
      return <PopularRoutesSection variant={v} bg={bg} wide />;
    case "POPULAR_CITIES":
      return <PopularCitiesSection variant={v} bg={bg} />;
    case "FEATURED_HOTELS":
      return <FeaturedHotelsSection variant={v} bg={bg} />;
    case "HOW_IT_WORKS":
      return <HowItWorksSection variant={v} bg={bg} />;
    case "OFFERS":
      return <OffersSection variant={v} hidden={hidden} offers={offers} bg={bg} />;
    case "FAQ":
      return <FaqSection variant={v} bg={bg} />;
    case "NEWSLETTER":
      return <NewsletterSection variant={v} />;
    case "APP_DOWNLOAD":
      return <AppDownloadSection variant={v} bg={bg} storeLinks={storeLinks} />;
    case "BLOG":
      return <BlogSection variant={v} bg={bg} />;
    default:
      return null;
  }
}

function defaultSections(): HomepageSection[] {
  return [
    { id: 1, section_key: "HERO", display_order: 1, is_active: true, service_type: null, variant: {} },
    { id: 2, section_key: "OFFERS", display_order: 2, is_active: true, service_type: null, variant: {} },
    { id: 3, section_key: "SERVICES", display_order: 3, is_active: true, service_type: null, variant: {} },
    { id: 19, section_key: "RIDE_TYPES", display_order: 4, is_active: true, service_type: null, variant: {} },
    { id: 4, section_key: "POPULAR_DESTINATIONS", display_order: 4, is_active: true, service_type: null, variant: {} },
    { id: 5, section_key: "POPULAR_ROUTES", display_order: 5, is_active: true, service_type: null, variant: {} },
    { id: 6, section_key: "POPULAR_CITIES", display_order: 6, is_active: true, service_type: null, variant: {} },
    { id: 7, section_key: "FEATURED_HOTELS", display_order: 7, is_active: true, service_type: null, variant: {} },
    { id: 8, section_key: "TOUR_PACKAGES", display_order: 8, is_active: true, service_type: null, variant: {} },
    { id: 9, section_key: "WHY_US", display_order: 9, is_active: true, service_type: null, variant: {} },
    { id: 10, section_key: "HOW_IT_WORKS", display_order: 10, is_active: true, service_type: null, variant: {} },
    { id: 11, section_key: "TESTIMONIALS", display_order: 11, is_active: true, service_type: null, variant: {} },
    { id: 12, section_key: "STATS", display_order: 12, is_active: true, service_type: null, variant: {} },
    { id: 13, section_key: "PARTNERS", display_order: 13, is_active: true, service_type: null, variant: {} },
    { id: 14, section_key: "CTA", display_order: 14, is_active: true, service_type: null, variant: {} },
    { id: 15, section_key: "FAQ", display_order: 15, is_active: true, service_type: null, variant: {} },
    { id: 16, section_key: "NEWSLETTER", display_order: 16, is_active: true, service_type: null, variant: {} },
    { id: 17, section_key: "APP_DOWNLOAD", display_order: 17, is_active: true, service_type: null, variant: {} },
    { id: 18, section_key: "BLOG", display_order: 18, is_active: true, service_type: null, variant: {} },
  ];
}