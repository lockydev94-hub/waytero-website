import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import TourDetailPage from "./tour-detail";
import type { PublicTourPackage } from "@/services/tourService";
import { STATIC_SEO, toMetadata, type SeoContent } from "@/services/seoService";

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

async function seoForTour(slug: string): Promise<SeoContent> {
  const fallback = STATIC_SEO.TOUR;
  const tour = await fetchTourPayload(slug);
  if (!tour?.package_name) return fallback;
  const title = `${tour.package_name} — Tour Package`;
  return {
    title,
    description:
      tour.short_description?.slice(0, 320) ||
      `Book the ${tour.package_name} tour in ${tour.destination} — ${tour.duration_days} days / ${tour.duration_nights} nights.`,
    keywords: [
      ...fallback.keywords,
      tour.package_name,
      tour.destination,
      tour.duration_days ? `${tour.duration_days}-day tour` : "",
      tour.city_name ?? "",
    ].filter((k): k is string => Boolean(k)),
    image: tour.primary_image_url ?? tour.media?.[0]?.media_url ?? null,
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
  const tour = await fetchTourPayload(slug);
  if (!tour?.package_name) notFound();

  // Product JSON-LD — server-rendered, only with real price data (never
  // mark up placeholders; SEO audit §4).
  const price = Number(tour.starting_price ?? 0);
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tour.package_name,
    description: tour.short_description || undefined,
    image: tour.primary_image_url ?? tour.media?.[0]?.media_url ?? undefined,
    brand: { "@type": "Brand", name: "WayTero" },
    ...(price > 0
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price,
            availability: "https://schema.org/InStock",
            url: `https://waytero.com/tours/${slug}`,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <TourDetailPage initialTour={tour as unknown as PublicTourPackage} />
      </Suspense>
    </>
  );
}
