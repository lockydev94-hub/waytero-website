/**
 * JsonLd — server-safe structured-data script tag + schema builders.
 *
 * Emits one `<script type="application/ld+json">` with the given object.
 * Used by the prerendered SEO pages (/cabs/{trip}, landing pages, …) so
 * crawlers see the schema in the initial HTML.
 */
import { absoluteImage, absoluteUrl, appUrl } from "@/services/seoService";

export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // An author-controlled string containing "</script>" would otherwise
        // close the tag early and inject markup. Same escape tours/[slug]
        // already does inline.
        __html: JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e"),
      }}
    />
  );
}

/** Build a FAQPage schema node from visible on-page questions/answers. */
export function faqPageSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/* ── Reusable builders for landing pages ────────────────────────────────── */

export function breadcrumbList(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${appUrl()}${it.path}`,
    })),
  };
}

export function itemList(name: string, items: Array<{ name: string; path: string }>) {
  const visible = items.slice(0, 10);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: visible.length,
    itemListElement: visible.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: `${appUrl()}${it.path}`,
    })),
  };
}

export function citySchema(opts: {
  name: string;
  description: string;
  path: string;
  regionName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "City",
    name: opts.name,
    description: opts.description,
    url: `${appUrl()}${opts.path}`,
    ...(opts.regionName
      ? { containedInPlace: { "@type": "State", name: opts.regionName } }
      : {}),
    ...(opts.latitude && opts.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: opts.latitude,
            longitude: opts.longitude,
          },
        }
      : {}),
  };
}

/**
 * Service schema for a city/state × vertical page. `provider` points at the
 * single root Organization node instead of inventing per-city LocalBusiness
 * entities — that per-city-LocalBusiness pattern is a known doorway-schema
 * signal, and we have no physical office to claim in each city.
 */
export function serviceSchema(opts: {
  name: string;
  description: string;
  path: string;
  areaName: string;
  serviceType: string;
  areaType?: "City" | "State" | "Country" | "Place";
  offer?: { lowPrice: number; offerCount: number } | null;
}) {
  const offer = opts.offer
    ? {
        "@type": "AggregateOffer",
        priceCurrency: "INR",
        lowPrice: opts.offer.lowPrice,
        offerCount: opts.offer.offerCount,
        url: `${appUrl()}${opts.path}`,
      }
    : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: `${appUrl()}${opts.path}`,
    serviceType: opts.serviceType,
    areaServed: {
      "@type":
        opts.areaType ??
        (opts.path.startsWith("/tour-packages-in") ? "State" : "City"),
      name: opts.areaName,
    },
    provider: { "@id": `${appUrl()}/#organization` },
    ...(offer ? { offers: offer } : {}),
  };
}

/**
 * Place-level cab page entity: an Airport or TrainStation (schema.org) that
 * the city hub contains, with the quoted fare matrix as an OfferCatalog.
 * Only real coordinates and real fares go in — nothing invented.
 */
export function placeCabSchema(opts: {
  name: string;
  description: string;
  path: string;
  kind: string; // AIRPORT | RAILWAY_STATION
  code?: string | null;
  city_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  fares: Array<{ vehicle_category: string; trip_type: string; estimated_total: number }>;
}) {
  const type = opts.kind === "AIRPORT" ? "Airport" : "TrainStation";
  const byCategory = new Map<string, number>();
  for (const f of opts.fares) {
    const prev = byCategory.get(f.vehicle_category);
    if (prev == null || f.estimated_total < prev) byCategory.set(f.vehicle_category, f.estimated_total);
  }
  const offers = [...byCategory.entries()].map(([category, low]) => ({
    "@type": "Offer",
    priceCurrency: "INR",
    price: low,
    itemOffered: {
      "@type": "Service",
      name: `Cab hire from ${category}`,
      serviceType: "Taxi",
      provider: { "@id": `${appUrl()}/#organization` },
    },
  }));
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: opts.name,
    ...(opts.code ? { alternateName: opts.code } : {}),
    description: opts.description,
    url: `${appUrl()}${opts.path}`,
    ...(opts.latitude && opts.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: opts.latitude,
            longitude: opts.longitude,
          },
        }
      : {}),
    ...(opts.city_name
      ? { containedInPlace: { "@type": "City", name: opts.city_name } }
      : {}),
    ...(offers.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: `Cab fares at ${opts.name}`,
            itemListElement: offers,
          },
        }
      : {}),
  };
}

/**
 * Only emit AggregateRating when both value and count are real — a rating
 * without review count (or vice versa) is the kind of half-truth rich-result
 * parsers punish.
 */
export function aggregateRatingSchema(value: number | null, count: number | null) {
  if (!value || !count) return null;
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    ratingValue: value,
    reviewCount: count,
    bestRating: 5,
  };
}

/**
 * WebPage/CollectionPage node. Every indexable page should carry one: it is
 * how the page connects to the site-wide WebSite entity and how Google reads
 * the page's name/description outside the visual markup.
 */
export function webPageSchema(opts: {
  name: string;
  description: string;
  path: string;
  type?: "WebPage" | "CollectionPage" | "AboutPage" | "ContactPage" | "FAQPage";
  image?: string | null;
}) {
  const url = `${appUrl()}${opts.path}`;
  const image = opts.image ? absoluteImage(opts.image) : null;
  return {
    "@context": "https://schema.org",
    "@type": opts.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: opts.name,
    description: opts.description,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${appUrl()}/#website` },
    ...(image
      ? { primaryImageOfPage: { "@type": "ImageObject", url: image } }
      : {}),
  };
}

/**
 * TouristTrip for a bookable package. This is the entity Google understands
 * as a trip (itinerary + provider + offer); Product is kept alongside it for
 * product rich results, but the trip itself should not be modelled as a
 * generic retail product alone.
 */
export function touristTripSchema(opts: {
  name: string;
  description: string;
  path: string;
  image?: string | null;
  itinerary?: Array<{ day_number: number; title: string; description?: string | null }>;
  offer?: { price: number; priceCurrency?: string; availability?: string } | null;
}) {
  const url = `${appUrl()}${opts.path}`;
  const trips = opts.itinerary ?? [];
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${url}#tourist-trip`,
    name: opts.name,
    description: opts.description,
    url,
    image: absoluteImage(opts.image),
    touristType: "Leisure",
    provider: { "@id": `${appUrl()}/#organization` },
    ...(trips.length
      ? {
          itinerary: {
            "@type": "ItemList",
            numberOfItems: trips.length,
            itemListElement: trips.map((day, i) => ({
              "@type": "ListItem",
              position: day.day_number || i + 1,
              item: {
                "@type": "TouristAttraction",
                name: day.title,
                ...(day.description ? { description: day.description } : {}),
              },
            })),
          },
        }
      : {}),
    ...(opts.offer && opts.offer.price > 0
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: opts.offer.priceCurrency ?? "INR",
            price: opts.offer.price,
            availability:
              opts.offer.availability ?? "https://schema.org/InStock",
            url,
          },
        }
      : {}),
  };
}

/** Absolute URL helper re-exported for page modules that build inline graphs. */
export { absoluteUrl };
