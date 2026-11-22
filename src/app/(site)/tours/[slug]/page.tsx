import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import TourDetailPage from "./tour-detail";
import type { PublicTourPackage } from "@/services/tourService";
import { getAvailability, serviceVisible } from "@/lib/availability";
import {
  STATIC_SEO,
  toMetadata,
  appUrl,
  absoluteImage,
  type SeoContent,
} from "@/services/seoService";
import JsonLd, {
  breadcrumbList,
  touristTripSchema,
  webPageSchema,
} from "@/components/sections/JsonLd";

// ── Page-level SEO (SSR) — derived from the package with static fallback ─
// Tour packages have no per-package SEO fields in the DB, so the metadata
// is built from the package name + destination (+ short description) and
// falls back to the static TOUR page when the API is unreachable.
// NOTE: a raw fetch is used here (not tourService) because this runs on the
// server inside generateMetadata — the axios client is browser-only.
const TOUR_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface TourSeoPayload {
  id?: number;
  slug?: string;
  package_code?: string | null;
  package_name: string;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  destination?: string | null;
  city_id?: number | null;
  city_name?: string | null;
  short_description?: string | null;
  description?: string | null;
  duration_days?: number | null;
  duration_nights?: number | null;
  primary_image_url?: string | null;
  starting_price?: number | null;
  media?: Array<{ media_url: string; is_primary?: boolean }> | null;
  minimum_persons?: number | null;
  maximum_persons?: number | null;
  itinerary?: Array<{
    day_number: number;
    title: string;
    description?: string | null;
    activities?: string[];
  }>;
  inclusions?: Array<{ text: string }>;
  exclusions?: Array<{ text: string }>;
}

async function fetchTourPayload(slug: string): Promise<TourSeoPayload | null> {
  try {
    const res = await fetch(
      `${TOUR_API_BASE}/public/tours/packages/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as TourSeoPayload;
  } catch {
    return null;
  }
}

/** Package names carry an editorial subtitle ("Bhitarkanika Wilderness —
 *  Mangroves, Crocodiles & Kingfishers"), which pushed every generated tour
 *  title to 77–92 characters and got it truncated in the SERP. The primary
 *  clause plus "Tour" fits the ~60-char budget the "| WayTero" template leaves.
 *  Admin-authored seo_title still wins. */
function shortTourTitle(name: string): string {
  let primary = name.split(/\s+[—-]\s+/)[0].trim();
  const TITLE_BUDGET = 51; // 60 minus " | WayTero"
  if (primary.length > TITLE_BUDGET) {
    primary = primary.slice(0, TITLE_BUDGET + 1).replace(/\s+\S*$/, "").trim();
  }
  if (/tour$/i.test(primary) || primary.length + 5 > TITLE_BUDGET) return primary;
  return `${primary} Tour`;
}

async function seoForTour(slug: string): Promise<SeoContent> {
  const fallback = STATIC_SEO.TOUR;
  const tour = await fetchTourPayload(slug);
  if (!tour?.package_name) return fallback;
  const generatedKeywords = [
    ...fallback.keywords,
    tour.package_name,
    tour.destination,
    tour.duration_days ? `${tour.duration_days}-day tour` : "",
    tour.city_name ?? "",
  ].filter((k): k is string => Boolean(k));
  return {
    // Admin-curated SEO wins; the generated form is the fallback.
    title: tour.seo_title?.trim() || shortTourTitle(tour.package_name),
    description:
      tour.seo_description?.trim() ||
      tour.short_description?.slice(0, 320) ||
      `Book the ${tour.package_name} tour in ${tour.destination} — ${tour.duration_days} days / ${tour.duration_nights} nights.`,
    keywords: tour.seo_keywords?.trim()
      ? tour.seo_keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : generatedKeywords,
    image: tour.primary_image_url ?? tour.media?.[0]?.media_url ?? "/og-image.png",
  };
}

// ── SSR content ──────────────────────────────────────────────────────────
// Active packages are prerendered at build time (ISR revalidates every 5
// min); unknown slugs return a real 404 instead of an indexable "no tours"
// soft-404. The server-fetched package is passed into the client component
// so the package name, description and JSON-LD are in the initial HTML.
export async function generateStaticParams() {
  try {
    const res = await fetch(`${TOUR_API_BASE}/public/tours/packages?page_size=48`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: Array<{ slug: string }> };
    return (data.items ?? []).map((t) => ({ slug: t.slug }));
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await seoForTour(slug);
  return toMetadata(seo, `/tours/${slug}`);
}

export default async function TourDetailsPage({ params }: Props) {
  const { slug } = await params;
  // Hard availability gate: TOUR hidden site-wide when disabled or the DB
  // has no supply — detail URLs 404 too, not just the listing.
  const av = await getAvailability();
  if (!serviceVisible(av, "TOUR")) notFound();
  const tour = await fetchTourPayload(slug);

  // Legacy code-style slugs (…-tp-20260913-0001) still resolve via the
  // backend's package_code fallback — 301 them to the clean canonical URL
  // so link equity consolidates on the SEO-friendly form.
  if (tour?.slug && tour.slug !== slug) {
    permanentRedirect(`/tours/${tour.slug}`);
  }
  if (!tour?.package_name) notFound();

  // Structured data is server-rendered so crawlers see it in the initial
  // HTML. Product carries the commercial fields Google's product snippets
  // read; image is never omitted — a missing image is a critical merchant
  // listing error, so the site-wide OG asset is the honest fallback when a
  // package has no photo.
  const pageUrl = `${appUrl()}/tours/${slug}`;
  const description =
    tour.short_description ||
    tour.description?.slice(0, 500) ||
    `${tour.package_name} — a ${tour.duration_days}-day tour package from WayTero.`;
  const image = absoluteImage(
    tour.primary_image_url ?? tour.media?.[0]?.media_url,
  );
  const price = Number(tour.starting_price ?? 0);
  const offer =
    price > 0
      ? {
          "@type": "Offer",
          "@id": `${pageUrl}#offer`,
          priceCurrency: "INR",
          price,
          availability: "https://schema.org/InStock",
          url: pageUrl,
          seller: { "@id": `${appUrl()}/#organization` },
        }
      : null;
  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}#product`,
    name: tour.package_name,
    description,
    image: [image],
    url: pageUrl,
    category: "Tour package",
    ...(tour.package_code ? { sku: tour.package_code } : {}),
    brand: { "@type": "Brand", name: "WayTero" },
    ...(offer ? { offers: offer } : {}),
  };
  const tripJsonLd = touristTripSchema({
    name: tour.package_name,
    description,
    path: `/tours/${slug}`,
    image,
    itinerary: tour.itinerary ?? [],
    offer: price > 0 ? { price, priceCurrency: "INR" } : null,
  });
  const crumbs = breadcrumbList([
    { name: "Home", path: "/" },
    { name: "Tours", path: "/tours" },
    { name: tour.package_name, path: `/tours/${slug}` },
  ]);
  const webPage = webPageSchema({
    name: tour.seo_title?.trim() || tour.package_name,
    description,
    path: `/tours/${slug}`,
    image,
  });

  return (
    <>
      <JsonLd data={webPage} />
      <JsonLd data={productJsonLd} />
      <JsonLd data={tripJsonLd} />
      <JsonLd data={crumbs} />
      <Suspense fallback={null}>
        <TourDetailPage initialTour={tour as unknown as PublicTourPackage} />
      </Suspense>
    </>
  );
}
