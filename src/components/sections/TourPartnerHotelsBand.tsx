import Link from "next/link";
import { Star, BedDouble, ArrowUpRight } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { API_BASE } from "@/lib/apiBase";
import { citySlug } from "@/lib/citySlug";
import type { BandTone } from "@/types/cms";

/* ============================================================
   TourPartnerHotelsBand — the stays in the cities these tours run from.

   The inverse of CabHotelPickups: a guest reading the tour catalogue
   wonders what happens on the nights, so the band names the hotels that are
   live in the same cities the tour packages depart from. Names, stars and
   locality only — no nightly rate, because a price quoted here would go
   stale the moment a rate plan changes and it belongs on /hotels.

   Doc Ref: public_hotel_api.py (search), BRD Part 4 §57-92
   ============================================================ */

interface HotelRow {
  id: number;
  hotel_name: string;
  slug: string | null;
  city_id: number;
  city_name: string;
  star_rating: number | null;
  landmark: string | null;
}

const LIMIT = 12;

export default async function TourPartnerHotelsBand({
  cityIds,
  bg = "white",
}: {
  // The cities the tour catalogue actually runs from — the band only names
  // stays in those places, so it can't claim coverage it doesn't have.
  cityIds: number[];
  // /tours alternates its bands, so the tone comes from the page.
  bg?: BandTone;
}) {
  if (cityIds.length === 0) return null;

  let hotels: HotelRow[] = [];
  try {
    const res = await fetch(`${API_BASE}/public/hotel/search?page_size=${LIMIT}&sort_by=rating`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = (await res.json()) as { items?: HotelRow[] };
      hotels = (data.items ?? []).filter((h) => cityIds.includes(h.city_id));
    }
  } catch {
    hotels = [];
  }

  if (!hotels.length) return null;

  const cities = [...new Set(hotels.map((h) => h.city_name))];

  return (
    <Section bg="white" pad="tight" id="tour-stays">
      <Container size="xl">
        <SectionHeader
          eyebrow="Also on WayTero"
          title={`Stays in ${cities.join(", ")}`}
          subtitle="Tours and hotels run on the same account, the same upfront pricing and the same support — these are the hotels live in the cities our tour packages depart from."
          accent="primary"
          underline
          scale="home"
        />
        <MotionStagger className="mt-5 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((h) => (
            <MotionStaggerItem key={h.id}>
              <Link
                href={
                  h.slug
                    ? `/hotels/${h.slug}`
                    : `/hotels/results?city=${citySlug(h.city_name)}`
                }
                className="group block border-b border-ink-7 py-2.5 transition-colors hover:text-primary-700"
              >
                <span className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink group-hover:text-primary-700">
                    {h.hotel_name}
                  </span>
                  {h.star_rating != null && h.star_rating > 0 && (
                    <span
                      className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-ink-4"
                      aria-label={`${h.star_rating} star`}
                    >
                      <Star className="h-3 w-3 fill-accent-400 text-accent-400" aria-hidden />
                      {h.star_rating}
                    </span>
                  )}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-ink-5 transition-colors group-hover:text-primary-600"
                    aria-hidden
                  />
                </span>
                {h.landmark && (
                  <span className="mt-0.5 block truncate text-xs text-ink-4">
                    {h.city_name} · {h.landmark}
                  </span>
                )}
              </Link>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
        <div className="mt-5">
          <Link
            href="/hotels"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:underline"
          >
            <BedDouble className="h-4 w-4" aria-hidden />
            Browse all stays on WayTero
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
