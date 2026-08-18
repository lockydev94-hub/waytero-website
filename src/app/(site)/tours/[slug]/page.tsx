import type { Metadata } from "next";
import { Suspense } from "react";
import TourDetailPage from "./tour-detail";
import { STATIC_SEO, toMetadata, type SeoContent } from "@/services/seoService";

// ── Page-level SEO (SSR) — derived from the package with static fallback ─
// Tour packages have no per-package SEO fields in the DB, so the metadata
// is built from the package name + destination (+ short description) and
// falls back to the static TOUR page when the API is unreachable.
// NOTE: a raw fetch is used here (not tourService) because this runs on the
// server inside generateMetadata — the axios client is browser-only.
const TOUR_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function seoForTour(slug: string): Promise<SeoContent> {
  const fallback = STATIC_SEO.TOUR;
  try {
    const res = await fetch(
      `${TOUR_API_BASE}/public/tours/packages/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return fallback;
    const tour = await res.json();
    if (!tour?.package_name) return fallback;
    const title = `${tour.package_name} — Tour Package`;
    return {
      title,
      description:
        tour.short_description?.slice(0, 320) ||
        tour.description?.slice(0, 320) ||
        `Book the ${tour.package_name} tour in ${tour.destination} — ${tour.duration_days} days / ${tour.duration_nights} nights.`,
      keywords: [
        ...fallback.keywords,
        tour.package_name,
        tour.destination,
        tour.duration_days ? `${tour.duration_days}-day tour` : "",
        tour.city_name ?? "",
      ].filter(Boolean),
      image: tour.primary_image_url ?? tour.media?.[0]?.media_url ?? null,
    };
  } catch {
    return fallback;
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await seoForTour(slug);
  return toMetadata(seo, `/tours/${slug}`);
}

export default function TourDetailsPage() {
  return (
    <Suspense fallback={null}>
      <TourDetailPage />
    </Suspense>
  );
}
