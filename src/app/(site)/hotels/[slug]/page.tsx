import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import HotelDetailPage from "./hotel-detail";
import type { PublicHotelDetails } from "@/services/hotelService";
import { STATIC_SEO, toMetadata, type SeoContent } from "@/services/seoService";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────
// Uses the hotel's own seo_title/seo_description/seo_keywords (admin →
// hotel → SEO tab). When the admin hasn't set them (or the API is down),
// falls back to the hotel name + city and finally the static HOTEL page.
//
// Raw fetch with ISR caching — hotelService.getDetails is `no-store`, and
// a no-store fetch on an on-demand static page triggers Next 15's
// static-to-dynamic runtime error (observed as a 500 in production).
// 60s revalidation is plenty for name/photos/room metadata; live
// availability for chosen dates is fetched client-side anyway.
async function loadHotel(slug: string): Promise<PublicHotelDetails | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/hotel/${encodeURIComponent(slug)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null; // 404/4xx/5xx → no bookable hotel → hard 404
    return (await res.json()) as PublicHotelDetails;
  } catch {
    return null;
  }
}

async function seoForHotel(hotel: PublicHotelDetails | null): Promise<SeoContent> {
  const fallback = STATIC_SEO.HOTEL;
  if (!hotel) return fallback;
  return {
    title: hotel.seo_title?.trim() || `${hotel.hotel_name} — Book Your Stay`,
    description:
      hotel.seo_description?.trim() ||
      hotel.short_description?.trim() ||
      hotel.description?.slice(0, 320) ||
      `Book ${hotel.hotel_name} in ${hotel.city_name} at the best price with free cancellation.`,
    keywords: hotel.seo_keywords
      ? hotel.seo_keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : [...fallback.keywords, hotel.hotel_name, hotel.city_name],
    image: hotel.images[0] ?? null,
  };
}

export async function generateStaticParams() {
  // Page through the active hotel inventory (same cap as the sitemap).
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  const slugs: Array<{ slug: string }> = [];
  try {
    for (let page = 1; page <= 10; page++) {
      const res = await fetch(
        `${API_BASE}/public/hotel/search?page=${page}&page_size=50`,
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) break;
      const data = (await res.json()) as { items?: Array<{ slug?: string | null }> };
      const rows = data.items ?? [];
      if (rows.length === 0) break;
      for (const r of rows) if (r.slug) slugs.push({ slug: r.slug });
    }
  } catch {
    // API unreachable at build time → pages render on demand instead.
  }
  return slugs;
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await loadHotel(slug);
  const seo = await seoForHotel(hotel);
  return toMetadata(seo, `/hotels/${slug}`);
}

export default async function HotelDetailsPage({ params }: Props) {
  const { slug } = await params;
  const hotel = await loadHotel(slug);
  if (!hotel) notFound();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <span className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
        </div>
      }
    >
      <HotelDetailPage initialHotel={hotel} />
    </Suspense>
  );
}
