import JsonLd, {
  faqPageSchema,
  breadcrumbList,
  citySchema,
  serviceSchema,
  placeCabSchema,
  itemList,
} from "@/components/sections/JsonLd";
import LandingHero from "@/components/landing/LandingHero";
import ServiceTypeSelector from "@/components/landing/ServiceTypeSelector";
import LandingBlockRenderer from "@/components/renderers/landing/LandingBlockRenderer";
import StickyCtaBar from "@/components/landing/StickyCtaBar";
import type { LandingBundle } from "@/lib/landingIndex";

// ============================================================
// LandingPageView — server composition of a landing page: the
// structured-data block, hero, (hub) service switch, the ordered
// blocks, and the mobile sticky CTA. Kept separate from the route
// so the route stays a thin load→404→render shell.
// ============================================================

const HOME_CRUMB = { name: "Home", path: "/" };

function buildJsonLd(data: LandingBundle) {
  const canonical = data.seo.canonical_path;
  const scopeLabel = data.scope.display_name;

  // Vertical pages breadcrumb up through the city hub; the hub (and the
  // hub-only crumb) come from the payload's siblings, so we never rebuild
  // the hub slug from a name and risk drifting from the backend's rule.
  const hub = data.siblings.find((s) => s.page_type === "CITY_HUB");
  const crumbs = [HOME_CRUMB];
  if (data.page_type !== "CITY_HUB" && hub) {
    crumbs.push({ name: scopeLabel, path: hub.href });
  }
  crumbs.push({ name: scopeLabel, path: canonical });

  const nodes: Record<string, unknown>[] = [
    breadcrumbList(crumbs),
    data.page_type === "CITY_HUB"
      ? citySchema({
          name: scopeLabel,
          description: data.seo.description,
          path: canonical,
          latitude: data.scope.latitude,
          longitude: data.scope.longitude,
        })
      : data.page_type === "PLACE_CABS" && data.scope.place
        ? placeCabSchema({
            name: scopeLabel,
            description: data.seo.description,
            path: canonical,
            kind: data.scope.place.kind,
            code: data.scope.place.code,
            city_name: data.scope.city_name,
            latitude: data.scope.latitude,
            longitude: data.scope.longitude,
            fares: data.cab_fares,
          })
        : serviceSchema({
            name: data.seo.title,
            description: data.seo.description,
            path: canonical,
            areaName: scopeLabel,
            serviceType: data.service_type ?? "Travel",
            offer: offerFrom(data),
          }),
  ];

  const hasFaq =
    data.blocks.some((b) => b.type === "faq") &&
    data.faqs.some((f) => f.question?.trim() && f.answer?.trim());
  if (hasFaq) nodes.push(faqPageSchema(data.faqs));

  if (data.hotels.length)
    nodes.push(
      itemList(
        `Hotels in ${scopeLabel}`,
        data.hotels.map((h) => ({
          name: h.hotel_name,
          path: `/hotels/${h.slug ?? h.id}`,
        })),
      ),
    );
  if (data.tours.length)
    nodes.push(
      itemList(
        `Tour packages in ${scopeLabel}`,
        data.tours.map((t) => ({
          name: t.package_name,
          path: `/tours/${t.slug ?? t.id}`,
        })),
      ),
    );

  return nodes;
}

function offerFrom(data: LandingBundle) {
  const low =
    data.prices.hotel_from ?? data.prices.tour_from ?? data.prices.cab_from ?? null;
  const count =
    (data.prices.hotel_count ?? 0) +
    (data.prices.tour_count ?? 0) +
    (data.prices.vehicle_count ?? 0);
  if (low == null || !count) return null;
  return { lowPrice: low, offerCount: count };
}

export default function LandingPageView({ data }: { data: LandingBundle }) {
  const jsonLd = buildJsonLd(data);

  return (
    <>
      {jsonLd.map((node, i) => (
        <JsonLd key={i} data={node} />
      ))}

      <LandingHero data={data} />

      {data.page_type === "CITY_HUB" && (
        <ServiceTypeSelector siblings={data.siblings} scopeName={data.scope.display_name} />
      )}

      {data.blocks.map((block, i) => (
        <LandingBlockRenderer key={`${block.type}-${i}`} block={block} data={data} />
      ))}

      <StickyCtaBar data={data} />
      {/* keep the mobile sticky bar from covering the footer's last row */}
      <div className="h-16 md:hidden" aria-hidden />
    </>
  );
}
