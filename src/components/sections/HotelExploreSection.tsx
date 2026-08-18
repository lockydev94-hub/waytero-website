"use client";

/**
 * HotelExploreSection — live hotel listing for the /hotels landing page.
 *
 * Everything here comes from the database via the public hotel API
 * (GET /public/hotel/search + GET /public/hotel/cities): real hotels,
 * real primary images, star ratings, guest ratings, amenities and
 * starting nightly prices. City chips filter the grid client-side; cards
 * deep-link to the hotel details page where booking happens.
 *
 * Doc Ref: public_hotel_api.py, BRD Part 4 §57-92
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star, MapPin, Wifi, Coffee, Waves, Building2, BedDouble, ChevronRight } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { hotelService, type PublicHotelSearchItem, type PublicHotelCity } from "@/services/hotelService";

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi,
  "free wifi": Wifi,
  "free wi-fi": Wifi,
  breakfast: Coffee,
  "breakfast included": Coffee,
  pool: Waves,
  "swimming pool": Waves,
  "outdoor pool": Waves,
  beach: Waves,
};

function AmenityChip({ label }: { label: string }) {
  const Icon = AMENITY_ICONS[label.toLowerCase()] ?? null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink-9 text-[10px] font-semibold uppercase tracking-wider text-ink-3">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

function HotelCard({ hotel }: { hotel: PublicHotelSearchItem }) {
  const hasImage = !!hotel.primary_image_url;
  return (
    <Link
      href={`/hotels/${hotel.slug ?? hotel.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-ink-7 hover:border-primary-200 hover:shadow-wt-lg transition-all hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-accent-100 via-accent-50 to-primary-50 overflow-hidden">
        {hasImage ? (
          <img
            src={hotel.primary_image_url!}
            alt={hotel.hotel_name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="h-12 w-12 text-accent-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
          {hotel.is_featured && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-500 text-ink shadow-sm">
              Featured
            </span>
          )}
          {hotel.star_rating != null && hotel.star_rating > 0 && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur text-ink inline-flex items-center gap-0.5">
              {"★".repeat(Math.min(hotel.star_rating, 5))}
              <span className="text-ink-4 font-semibold">{hotel.star_rating}</span>
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur text-ink shadow-sm">
          <Star className="h-3 w-3 fill-accent-500 text-accent-500" />
          {hotel.average_rating > 0 ? hotel.average_rating.toFixed(1) : "New"}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-base font-bold text-ink mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
          {hotel.hotel_name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-ink-4 mb-3">
          <MapPin className="h-3.5 w-3.5" />
          {[hotel.city_name, hotel.state_name].filter(Boolean).join(", ")}
          {hotel.total_reviews > 0 && <span className="ml-1">· {hotel.total_reviews} reviews</span>}
        </div>
        {hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {hotel.amenities.slice(0, 3).map((a) => (
              <AmenityChip key={a} label={a} />
            ))}
          </div>
        )}
        <div className="flex items-baseline gap-2 pt-3 border-t border-ink-7">
          <span className="text-[10px] text-ink-4 uppercase tracking-wider">From</span>
          <span className="text-lg font-extrabold text-ink">{INR(hotel.starting_price)}</span>
          <span className="text-xs text-ink-4">/night</span>
          <span className="ml-auto inline-flex items-center gap-0.5 text-xs font-bold text-primary-600 group-hover:gap-1.5 transition-all">
            View stay <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-7 bg-white overflow-hidden">
      <div className="aspect-[4/3] bg-ink-8 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 bg-ink-8 animate-pulse rounded" />
        <div className="h-3 w-1/2 bg-ink-8 animate-pulse rounded" />
        <div className="h-3 w-2/3 bg-ink-8 animate-pulse rounded" />
        <div className="pt-2 h-5 w-1/3 bg-ink-8 animate-pulse rounded" />
      </div>
    </div>
  );
}

/**
 * HotelPopularCityChips — "Popular right now" city shortcuts under the hero
 * search form. DB-driven (GET /public/hotel/cities), jumps straight into the
 * results page for that city.
 */
export function HotelPopularCityChips() {
  const [cities, setCities] = useState<PublicHotelCity[]>([]);

  useEffect(() => {
    hotelService.getCities().then(setCities).catch(() => {});
  }, []);

  const top = cities.slice(0, 6);
  if (top.length === 0) return null;

  // Dark-theme chips — this strip sits on the deep-navy hero that hosts the
  // glass HeroSearchForm (same look as the homepage hero).
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-white/60">Popular:</span>
      {top.map((c) => (
        <Link
          key={c.id}
          href={`/hotels/results?city_id=${c.id}`}
          className="px-3.5 h-8 rounded-full bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 hover:border-white/40 text-xs font-semibold text-white/90 inline-flex items-center gap-1.5 transition-colors"
        >
          <MapPin className="h-3 w-3 text-accent-400" />
          {c.name}
        </Link>
      ))}
    </div>
  );
}


export default function HotelExploreSection() {
  const [cities, setCities] = useState<PublicHotelCity[]>([]);
  const [activeCity, setActiveCity] = useState<number | null>(null);
  const [hotels, setHotels] = useState<PublicHotelSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hotelService.getCities().then(setCities).catch(() => {});
  }, []);

  const fetchHotels = useCallback((cityId: number | null) => {
    setLoading(true);
    setError(null);
    hotelService
      .search({ city_id: cityId ?? undefined, sort_by: "recommended", page_size: 12 })
      .then((res) => {
        setHotels(res.items);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load hotels"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchHotels(activeCity);
  }, [fetchHotels, activeCity]);

  const cityCount = cities.length;

  return (
    <Section bg="muted" pad="lg" id="hotels">
      <Container size="lg">
        <SectionHeader
          eyebrow="Stays across India"
          title={activeCity ? `Hotels in ${cities.find(c => c.id === activeCity)?.name ?? "your city"}` : "Explore hotels"}
          subtitle={`${total} stay${total === 1 ? "" : "s"} available right now${cityCount ? ` across ${cityCount} cities` : ""} — transparent prices, real guest ratings.`}
        />

        {/* City filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCity(null)}
            className={`px-4 h-9 rounded-full text-xs font-bold transition-colors ${
              activeCity === null
                ? "bg-ink text-white"
                : "bg-white border border-ink-7 text-ink-3 hover:border-primary-300 hover:text-primary-600"
            }`}
          >
            All cities
          </button>
          {cities.slice(0, 8).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCity(c.id)}
              className={`px-4 h-9 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                activeCity === c.id
                  ? "bg-ink text-white"
                  : "bg-white border border-ink-7 text-ink-3 hover:border-primary-300 hover:text-primary-600"
              }`}
            >
              <MapPin className="h-3 w-3" />
              {c.name}
              <span className={activeCity === c.id ? "text-white/60" : "text-ink-4"}>
                {c.hotel_count}
              </span>
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-rose-100 bg-rose-50 p-8 text-center">
            <p className="text-sm text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => fetchHotels(activeCity)}
              className="mt-4 px-5 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-ink-7 bg-white p-10 text-center">
            <Building2 className="h-10 w-10 text-ink-4 mx-auto mb-3" />
            <p className="text-sm text-ink-3">No hotels in this city yet — try another one.</p>
          </div>
        ) : (
          <MotionStagger className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {hotels.map((h) => (
              <MotionStaggerItem key={h.id}>
                <HotelCard hotel={h} />
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        )}

        {!loading && !error && hotels.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              href={activeCity ? `/hotels/results?city_id=${activeCity}` : "/hotels/results"}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-wt-primary transition-all hover:-translate-y-0.5"
            >
              <BedDouble className="h-4 w-4" /> View all {total} hotels
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </Container>
    </Section>
  );
}
