import type { Metadata } from "next";
import { Suspense } from "react";
import HotelDetailPage from "./hotel-detail";
import { hotelService } from "@/services/hotelService";
import { STATIC_SEO, toMetadata, type SeoContent } from "@/services/seoService";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────
// Uses the hotel's own seo_title/seo_description/seo_keywords (admin →
// hotel → SEO tab). When the admin hasn't set them (or the API is down),
// falls back to the hotel name + city and finally the static HOTEL page.
async function seoForHotel(slug: string): Promise<SeoContent> {
  const fallback = STATIC_SEO.HOTEL;
  try {
    const hotel = await hotelService.getDetails(slug);
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
  } catch {
    return fallback;
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await seoForHotel(slug);
  return toMetadata(seo, `/hotels/${slug}`);
}

export default function HotelDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <span className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
        </div>
      }
    >
      <HotelDetailPage />
    </Suspense>
  );
}
