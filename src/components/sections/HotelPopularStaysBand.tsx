import Link from "next/link";
import { BedDouble, MapPin, Star, ArrowUpRight } from "lucide-react";
import { Container, Section, SectionHeader, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { API_BASE } from "@/lib/apiBase";
import type { BandTone } from "@/types/cms";

/* ============================================================
   HotelPopularStaysBand — the cities WayTero actually has stays in.

   One fetch (GET /public/hotel/cities) and every number on a tile is that
   endpoint's own aggregate: how many hotels are live there, the mean guest
   rating across them, and the lowest published starting nightly price. A
   city with no price or no rating published shows the count only — the band
   never paints over a gap with an estimate.

   Doc Ref: public_hotel_api.py (cities), BRD Part 4 §57-92
   ============================================================ */

interface HotelCityRow {
  id: number;
  name: string;
  state_name?: string | null;
  hotel_count: number;
  from_price?: number | null;
  avg_rating?: number | null;
}

const INR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default async function HotelPopularStaysBand({
  bg = "muted",
  pad = "tight",
}: {
  bg?: BandTone;
  pad?: "home" | "tight" | "sm" | "md" | "lg";
}) {
  let cities: HotelCityRow[] = [];
  try {
    const res = await fetch(`${API_BASE}/public/hotel/cities`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = (await res.json()) as unknown;
      cities = (Array.isArray(data) ? data : ((data as { items?: HotelCityRow[] })?.items ?? [])) as HotelCityRow[];
    }
  } catch {
    cities = [];
  }

  // Only cities that actually carry a stay, ranked by how many.
  cities = cities.filter((c) => Number(c.hotel_count ?? 0) > 0);
  if (cities.length === 0) return null;
  cities.sort((a, b) => Number(b.hotel_count) - Number(a.hotel_count));

  return (
    <Section bg={bg} pad={pad} id="stay-cities" overlay="dots-faint">
      <Container size="xl">
        <SectionHeader
          eyebrow="Where the stays are"
          title="Cities you can book a hotel in today"
          subtitle="Every tile below is a city with partner hotels live on WayTero right now — the count, the average guest rating and the lowest published nightly price all come from those listings."
          accent="primary"
          underline
          animatedEyebrow
          scale="home"
        />

        <MotionStagger className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.slice(0, 9).map((c) => {
            const rating = Number(c.avg_rating ?? 0);
            const price = Number(c.from_price ?? 0);
            return (
              <MotionStaggerItem key={c.id}>
                <MotionGlow color="primary" intensity={0.16} size={240} className="rounded-2xl">
                  <Link
                    href={`/hotels/results?city_id=${c.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-ink-7 bg-white p-5 transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-wt-lg"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-sm transition-transform duration-300 group-hover:scale-110">
                        <BedDouble className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-extrabold text-ink group-hover:text-primary-700">
                          {c.name}
                        </span>
                        {c.state_name && (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-ink-4">
                            <MapPin className="h-3 w-3" />
                            {c.state_name}
                          </span>
                        )}
                      </span>
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 text-ink-5 transition-colors group-hover:text-primary-600"
                        aria-hidden
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ink-7 pt-3 text-[13px]">
                      <span className="font-bold text-ink">
                        {c.hotel_count} hotel{c.hotel_count === 1 ? "" : "s"}
                      </span>
                      {rating > 0 && (
                        <span className="inline-flex items-center gap-1 font-semibold text-ink-3">
                          <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" aria-hidden />
                          {rating.toFixed(1)}
                        </span>
                      )}
                      {price > 0 && (
                        <span className="ml-auto text-ink-3">
                          from <b className="font-extrabold text-primary-700">{INR(price)}</b>
                          <span className="text-[11px] text-ink-4">/night</span>
                        </span>
                      )}
                    </div>
                  </Link>
                </MotionGlow>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
