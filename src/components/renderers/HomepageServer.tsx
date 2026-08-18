import type { PublicHomepage } from "@/types/cms";
import { publicCmsService } from "@/services/publicCms";
import {
  HeroSection,
  ServicesSection,
  WhyUsSection,
  TourPackagesSection,
  TestimonialsSection,
  StatsSection,
  PartnersSection,
  CtaSection,
  PopularDestinationsSection,
  FeaturedHotelsSection,
  HowItWorksSection,
  OffersSection,
  FaqSection,
  NewsletterSection,
  AppDownloadSection,
  BlogSection,
} from "./index";
import type { HomepageSection } from "@/types/cms";
import { Skeleton } from "@/components/ui";

/**
 * Server-rendered variant of HomepageRenderer.
 * Prefetches the CMS payload at request time so the homepage is SEO-friendly
 * (server-rendered HTML) and falls back to sensible defaults if the CMS is
 * down or returns nothing.
 */
export default async function HomepageServer() {
  const data = await publicCmsService.getHomepage();
  const sections = (data?.sections?.length ? data.sections : defaultSections()) as HomepageSection[];

  return (
    <>
      {sections.map((s) => (
        <SectionSwitch key={s.id} section={s} />
      ))}
    </>
  );
}

function SectionSwitch({ section }: { section: HomepageSection }) {
  const v = section.variant || {};
  switch (section.section_key) {
    case "HERO":
      return <HeroSection variant={v} serviceType={section.service_type} />;
    case "SERVICES":
      return <ServicesSection variant={v} />;
    case "WHY_US":
      return <WhyUsSection variant={v} />;
    case "TOUR_PACKAGES":
      return <TourPackagesSection variant={v} />;
    case "TESTIMONIALS":
      return <TestimonialsSection variant={v} />;
    case "STATS":
      return <StatsSection variant={v} />;
    case "PARTNERS":
      return <PartnersSection variant={v} />;
    case "CTA":
      return <CtaSection variant={v} />;
    case "POPULAR_DESTINATIONS":
      return <PopularDestinationsSection variant={v} />;
    case "FEATURED_HOTELS":
      return <FeaturedHotelsSection variant={v} />;
    case "HOW_IT_WORKS":
      return <HowItWorksSection variant={v} />;
    case "OFFERS":
      return <OffersSection variant={v} />;
    case "FAQ":
      return <FaqSection variant={v} />;
    case "NEWSLETTER":
      return <NewsletterSection variant={v} />;
    case "APP_DOWNLOAD":
      return <AppDownloadSection variant={v} />;
    case "BLOG":
      return <BlogSection variant={v} />;
    default:
      return null;
  }
}

function defaultSections(): HomepageSection[] {
  return [
    { id: 1, section_key: "HERO", display_order: 1, is_active: true, service_type: null, variant: {} },
    { id: 2, section_key: "OFFERS", display_order: 2, is_active: true, service_type: null, variant: {} },
    { id: 3, section_key: "SERVICES", display_order: 3, is_active: true, service_type: null, variant: {} },
    { id: 4, section_key: "POPULAR_DESTINATIONS", display_order: 4, is_active: true, service_type: null, variant: {} },
    { id: 5, section_key: "FEATURED_HOTELS", display_order: 5, is_active: true, service_type: null, variant: {} },
    { id: 6, section_key: "TOUR_PACKAGES", display_order: 6, is_active: true, service_type: null, variant: {} },
    { id: 7, section_key: "WHY_US", display_order: 7, is_active: true, service_type: null, variant: {} },
    { id: 8, section_key: "HOW_IT_WORKS", display_order: 8, is_active: true, service_type: null, variant: {} },
    { id: 9, section_key: "TESTIMONIALS", display_order: 9, is_active: true, service_type: null, variant: {} },
    { id: 10, section_key: "STATS", display_order: 10, is_active: true, service_type: null, variant: {} },
    { id: 11, section_key: "PARTNERS", display_order: 11, is_active: true, service_type: null, variant: {} },
    { id: 12, section_key: "CTA", display_order: 12, is_active: true, service_type: null, variant: {} },
    { id: 13, section_key: "FAQ", display_order: 13, is_active: true, service_type: null, variant: {} },
    { id: 14, section_key: "NEWSLETTER", display_order: 14, is_active: true, service_type: null, variant: {} },
    { id: 15, section_key: "APP_DOWNLOAD", display_order: 15, is_active: true, service_type: null, variant: {} },
    { id: 16, section_key: "BLOG", display_order: 16, is_active: true, service_type: null, variant: {} },
  ];
}