// ============================================================
// LandingBlockRenderer — the one switch that turns a payload
// block into a component. Mirrors HomepageServer's SectionSwitch
// but for the landing `blocks[]` union.
//
// Contract: unknown block.type renders null, never throws — the
// backend ignores unrecognised types on read, and a page must not
// 500 because a newer block type shipped before this bundle did.
// File: src/components/renderers/landing/LandingBlockRenderer.tsx
// ============================================================

import type { LandingBlock, LandingBundle } from "@/lib/landingIndex";
import LandingProse from "@/components/landing/LandingProse";
import LandingHighlights from "@/components/landing/LandingHighlights";
import LandingStatsStrip from "@/components/landing/LandingStatsStrip";
import LandingGallery from "@/components/landing/LandingGallery";
import LandingFaq from "@/components/landing/LandingFaq";
import FareTable from "@/components/landing/FareTable";
import VehicleCardGrid from "@/components/landing/VehicleCardGrid";
import LandingHotelGrid from "@/components/landing/LandingHotelGrid";
import LandingTourGrid from "@/components/landing/LandingTourGrid";
import LandingSteps from "@/components/landing/LandingSteps";
import CtaBand from "@/components/landing/CtaBand";
import InternalLinkCluster from "@/components/landing/InternalLinkCluster";

export default function LandingBlockRenderer({
  block,
  data,
}: {
  block: LandingBlock;
  data: LandingBundle;
}) {
  switch (block.type) {
    case "prose":
      return <LandingProse title={block.title} body={block.body} />;
    case "highlights":
      return <LandingHighlights highlights={data.highlights} title={block.title} />;
    case "stats":
      return <LandingStatsStrip stats={data.stats} title={block.title} />;
    case "gallery":
      return <LandingGallery tiles={data.gallery} title={block.title} />;
    case "faq":
      return <LandingFaq faqs={data.faqs} />;
    case "fare_matrix":
      return (
        <FareTable
          rows={data.cab_fares}
          title={block.title}
          gst={data.gst}
          sampleDistanceKm={data.meta.sample_distance_km}
        />
      );
    case "vehicle_grid":
      return (
        <VehicleCardGrid
          vehicles={data.vehicles}
          title={block.title}
          ctaLink={data.cta.link}
        />
      );
    case "hotel_grid":
      return (
        <LandingHotelGrid
          hotels={data.hotels}
          title={block.title}
          cityId={data.scope.kind === "city" ? data.scope.id : null}
        />
      );
    case "tour_grid":
      return (
        <LandingTourGrid
          tours={data.tours}
          title={block.title}
          resultsHref={
            data.scope.kind === "city"
              ? `/tours?city_id=${data.scope.id}`
              : "/tours"
          }
        />
      );
    case "steps":
      return <LandingSteps title={block.title} serviceType={data.service_type} />;
    case "cta_band":
      return <CtaBand data={data} />;
    case "internal_links":
      return (
        <InternalLinkCluster
          title={block.title}
          siblings={data.siblings}
          nearby={data.nearby}
        />
      );
    default:
      return null;
  }
}
