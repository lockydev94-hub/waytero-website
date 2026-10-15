import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import HotelDetailPage from "./hotel-detail";
import type { PublicHotelDetails } from "@/services/hotelService";
import { getAvailability, serviceVisible } from "@/lib/availability";
import { STATIC_SEO, toMetadata, appUrl, type SeoContent } from "@/services/seoService";

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
      `Book ${hotel.hotel_name} in ${hotel.city_name} — live rates and availability on WayTero.`,
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
  // Hard availability gate: HOTEL hidden site-wide when disabled or the DB
  // has no supply — detail URLs 404 too, not just the listing.
  const av = await getAvailability();
  if (!serviceVisible(av, "HOTEL")) notFound();
  const hotel = await loadHotel(slug);
  if (!hotel) notFound();

  // schema.org Hotel — rich results (star rating, price range, geo, rating)
  const minPrice = Math.min(
    ...hotel.room_categories.map((r) => r.base_price).filter((p) => p > 0),
    Number.POSITIVE_INFINITY,
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.hotel_name,
    description: hotel.short_description || hotel.description || undefined,
    url: `${appUrl()}/hotels/${slug}`,
    image: hotel.images.length ? hotel.images : undefined,
    starRating: hotel.star_rating
      ? { "@type": "Rating", ratingValue: hotel.star_rating, bestRating: 5 }
      : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: hotel.address || undefined,
      addressLocality: hotel.city_name,
      addressRegion: hotel.state_name || undefined,
      postalCode: hotel.postal_code || undefined,
      addressCountry: "IN",
    },
    geo:
      hotel.latitude != null && hotel.longitude != null
        ? { "@type": "GeoCoordinates", latitude: hotel.latitude, longitude: hotel.longitude }
        : undefined,
    amenities: hotel.amenities.length ? hotel.amenities : undefined,
    priceRange:
      Number.isFinite(minPrice) ? `₹${Math.round(minPrice)}+ per night` : undefined,
    aggregateRating:
      hotel.total_reviews > 0 && hotel.average_rating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: hotel.average_rating,
            reviewCount: hotel.total_reviews,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c").replace(/>/g, "\\u003e"),
        }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <span className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          </div>
        }
      >
        <HotelDetailPage initialHotel={hotel} />
      </Suspense>
    </>
  );
}
