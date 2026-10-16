import Link from "next/link";
import { Star, ArrowUpRight } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { API_BASE } from "@/lib/apiBase";
import type { CabCityRow } from "@/lib/cabCity";

/* ============================================================
   CabHotelPickups — hotel NAMES on the cab page, no cards.

   The cab buyer picks a city first and then wonders what happens at the
   other end, so the page names the stays that are live in the same city.
   Names only by owner request: no images, no nightly rates, no "from ₹" —
   those belong on /hotels, and a price quoted here would go stale the
   moment a rate plan changes.
   ============================================================ */

interface HotelRow {
  id: number;
  hotel_name: string;
  slug: string | null;
  city_id: number;
  star_rating: number | null;
  landmark: string | null;
  city_name: string;
}

const LIMIT = 12;

export default async function CabHotelPickups({
  city,
}: {
  city: CabCityRow | null;
}) {
  if (!city) return null;

  let hotels: HotelRow[] = [];
  try {
    const res = await fetch(
      `${API_BASE}/public/hotel/search?city_id=${city.id}&page_size=${LIMIT}&sort_by=rating`,
      { next: { revalidate: 300 } },
    );
    if (res.ok) {
      const data = (await res.json()) as { items?: HotelRow[] };
      hotels = data.items ?? [];
    }
  } catch {
    hotels = [];
  }

  // No live stay in the city the cab bands are quoting → omit the band.
  if (!hotels.length) return null;

  return (
    <Section bg="white" pad="md">
      <Container size="xl">
        <SectionHeader
          eyebrow="Also in this city"
          title={`Stays in ${city.name} you can book on WayTero`}
          subtitle="Cabs and hotels run on the same account, the same upfront pricing and the same support — here is what is live in this city right now."
          accent="primary"
          underline
        />
        <MotionStagger className="mt-7 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((h) => (
            <MotionStaggerItem key={h.id}>
              <Link
                href={h.slug ? `/hotels/${h.slug}` : `/hotels/results?city_id=${h.city_id}`}
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
                {/* The locality goes on its own line — inline it ate the width
                    the name needs and every long name came out truncated. */}
                {h.landmark && (
                  <span className="mt-0.5 block truncate text-xs text-ink-4">{h.landmark}</span>
                )}
              </Link>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
        <div className="mt-6">
          <Link
            href={`/hotels/results?city_id=${city.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:underline"
          >
            See all stays in {city.name}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
