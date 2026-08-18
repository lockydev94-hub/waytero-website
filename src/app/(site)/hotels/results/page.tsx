"use client";

/**
 * /hotels/results — city/place based hotel list with starting nightly prices.
 *
 * Reads the search from the URL (city_id, q, check_in, check_out, guests,
 * rooms) and queries GET /public/hotel/search. Each card links to the hotel
 * details page (/hotels/{slug}) carrying the stay dates forward so the room
 * categories render with availability + server-side quotes.
 *
 * Doc Ref: BRD Part 4 §57-92, public_hotel_api.py
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MapPin, Star, Calendar, Users, BedDouble, SearchX, Loader2,
  ListFilter, Building2, ChevronRight, RotateCcw, Search,
} from "lucide-react";
import { Container, Card, MotionGlow } from "@/components/ui";
import { hotelService, type PublicHotelCity, type PublicHotelSearchItem } from "@/services/hotelService";

type SortMode = "recommended" | "price_asc" | "price_desc" | "rating";

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function ResultsContent() {
  const router = useRouter();
  const params = useSearchParams() ?? new URLSearchParams();

  const cityParam = params.get("city_id");
  const qParam = params.get("q") ?? "";
  const checkIn = params.get("check_in") ?? "";
  const checkOut = params.get("check_out") ?? "";
  const guests = Number(params.get("guests") ?? "2");
  const rooms = Number(params.get("rooms") ?? "1");

  // ── State ─────────────────────────────────────────────────────────────
  const [cities, setCities] = useState<PublicHotelCity[]>([]);
  const [cityId, setCityId] = useState<number | null>(cityParam ? Number(cityParam) : null);
  const [query, setQuery] = useState(qParam);
  const [items, setItems] = useState<PublicHotelSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters (client-side re-query through the same endpoint)
  const [starRating, setStarRating] = useState<number | "">("");
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [showAdvance, setShowAdvance] = useState(false);

  useEffect(() => {
    hotelService.getCities().then(setCities).catch(() => {});
  }, []);

  // ── Fetch results whenever the search criteria change ─────────────────
  useEffect(() => {
    if (cityId == null && !query.trim()) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      setError("Pick a city or search by place to see hotels.");
      return;
    }
    setLoading(true);
    setError(null);
    hotelService
      .search({
        city_id: cityId ?? undefined,
        q: query.trim() || undefined,
        check_in: checkIn || undefined,
        check_out: checkOut || undefined,
        star_rating: starRating === "" ? undefined : Number(starRating),
        min_price: priceMin === "" ? undefined : Number(priceMin),
        max_price: priceMax === "" ? undefined : Number(priceMax),
        sort_by: sortMode,
        page_size: 50,
      })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        if (res.items.length === 0) {
          setError("No hotels found for this search. Try a different city or relax the filters.");
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load hotels"))
      .finally(() => setLoading(false));
  }, [cityId, query, checkIn, checkOut, starRating, priceMin, priceMax, sortMode]);

  // ── Apply a new search (edit search from sidebar / enter) ─────────────
  const runSearch = useCallback((nextCity: number | null, nextQuery: string) => {
    const sp = new URLSearchParams();
    if (nextCity) sp.set("city_id", String(nextCity));
    if (nextQuery.trim()) sp.set("q", nextQuery.trim());
    if (checkIn) sp.set("check_in", checkIn);
    if (checkOut) sp.set("check_out", checkOut);
    sp.set("guests", String(guests));
    sp.set("rooms", String(rooms));
    router.push(`/hotels/results?${sp.toString()}`);
  }, [checkIn, checkOut, guests, rooms, router]);

  const cityName = cities.find((c) => c.id === cityId)?.name ?? (query || "India");

  const resetFilters = useCallback(() => {
    setStarRating("");
    setPriceMin("");
    setPriceMax("");
    setSortMode("recommended");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent-50/50 via-white to-white">
      {/* ── Header bar ─────────────────────────────────────── */}
      <div className="bg-ink text-white">
        <Container size="xl" className="pt-8 pb-7">
          <nav className="text-xs text-white/60 mb-3">
            <button type="button" onClick={() => router.push("/hotels")} className="hover:text-white transition-colors">
              Book a Hotel
            </button>
            <span className="mx-2">/</span>
            <span className="text-white/90">Search Results</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Hotels · {cityName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {cityName}
                </span>
                {checkIn && checkOut && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> {checkIn} → {checkOut}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {guests} guests
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BedDouble className="h-3.5 w-3.5" /> {rooms} room{rooms > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60 uppercase tracking-wider">Hotels found</div>
              <div className="text-xl font-bold text-accent-400">{total}</div>
            </div>
          </div>
        </Container>
      </div>

      <Container size="xl" className="py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* ── Sidebar: search + filters ───────────────────── */}
          <MotionGlow color="primary" intensity={0.06} size={420} className="rounded-2xl h-fit lg:sticky lg:top-24">
          <aside className="bg-white/85 backdrop-blur-md border border-ink-7 rounded-2xl p-5 space-y-5 shadow-wt-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-ink flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center shadow-wt-accent">
                  <ListFilter className="h-3.5 w-3.5" />
                </span>
                Refine search
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-bold uppercase tracking-wider text-ink-4 hover:text-primary-600 transition-colors"
              >
                Reset
              </button>
            </div>

            {/* ── City / place search ───────────────────────── */}
            <section>
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-3 mb-2">
                City or place
              </h3>
              <div className="space-y-2">
                <select
                  value={cityId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCityId(v ? Number(v) : null);
                    if (v) setQuery("");
                  }}
                  className="w-full h-9 rounded-lg border border-ink-7 bg-ink-9 px-2.5 text-xs text-ink focus:outline-none focus:border-primary-600"
                >
                  <option value="">Any city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.state_name ? `, ${c.state_name}` : ""} ({c.hotel_count})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value) setCityId(null);
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") runSearch(cityId, query); }}
                  placeholder="Search by place, landmark, hotel…"
                  className="w-full h-9 rounded-lg border border-ink-7 bg-ink-9 px-2.5 text-xs text-ink focus:outline-none focus:border-primary-600 placeholder:text-ink-5"
                />
                <button
                  type="button"
                  onClick={() => runSearch(cityId, query)}
                  className="w-full h-9 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Search className="h-3.5 w-3.5" /> Search
                </button>
              </div>
            </section>

            {/* ── Star rating ───────────────────────────────── */}
            <section>
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-3 mb-2">
                Star rating
              </h3>
              <div className="grid grid-cols-4 gap-1">
                {(["", 3, 4, 5] as const).map((star) => (
                  <button
                    key={String(star)}
                    type="button"
                    onClick={() => setStarRating(star === "" ? "" : Number(star) as number | "")}
                    className={`h-8 rounded-md text-[11px] font-semibold transition-colors ${
                      (starRating === "" && star === "") || starRating === star
                        ? "bg-ink text-white"
                        : "bg-ink-9 text-ink-3 hover:bg-ink-8"
                    }`}
                  >
                    {star === "" ? "All" : `${star}★`}
                  </button>
                ))}
              </div>
            </section>

            {/* ── Price range ───────────────────────────────── */}
            <section>
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-3 mb-2">
                Price per night (₹)
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="number"
                  min={0}
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Min"
                  className="h-9 rounded-lg border border-ink-7 bg-ink-9 px-2.5 text-xs text-ink focus:outline-none focus:border-primary-600 placeholder:text-ink-5"
                />
                <input
                  type="number"
                  min={0}
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Max"
                  className="h-9 rounded-lg border border-ink-7 bg-ink-9 px-2.5 text-xs text-ink focus:outline-none focus:border-primary-600 placeholder:text-ink-5"
                />
              </div>
            </section>

            {/* ── Sort ──────────────────────────────────────── */}
            <section className="border-t border-ink-8 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvance((v) => !v)}
                aria-expanded={showAdvance}
                className="w-full flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-3"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5" /> Sort &amp; more
                </span>
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform ${showAdvance ? "rotate-90" : ""}`}
                />
              </button>
              {showAdvance && (
                <div className="mt-3 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4 mb-1.5">
                    Sort by
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {([
                      ["recommended", "Recommended"],
                      ["price_asc", "Price ↑"],
                      ["price_desc", "Price ↓"],
                      ["rating", "Top rated"],
                    ] as const).map(([value, label]) => {
                      const active = sortMode === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSortMode(value)}
                          className={`h-8 rounded-md text-[11px] font-semibold transition-colors ${
                            active ? "bg-ink text-white" : "bg-ink-9 text-ink-3 hover:bg-ink-8"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* ── Edit search ───────────────────────────────── */}
            <button
              type="button"
              onClick={() => router.push("/hotels")}
              className="w-full h-9 rounded-lg border border-ink-7 text-xs font-semibold text-ink-2 hover:bg-ink-9 transition-colors"
            >
              ← Edit search
            </button>
          </aside>
          </MotionGlow>

          {/* ── Results ─────────────────────────────────────── */}
          <main>
            {error && !loading && (
              <div className="bg-white border border-ink-7 rounded-2xl p-10 text-center">
                <SearchX className="h-10 w-10 text-ink-4 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-ink">{error}</h3>
                <p className="text-sm text-ink-4 mt-2 max-w-md mx-auto">
                  Try searching by city name, or a landmark / area inside the city.
                </p>
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-ink-7 rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-44 bg-ink-8" />
                    <div className="p-5 space-y-2">
                      <div className="h-4 w-1/3 bg-ink-8 rounded" />
                      <div className="h-3 w-1/2 bg-ink-8 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && items.length > 0 && (
              <div className="space-y-4">
                {items.map((h) => {
                  const href = `/hotels/${h.slug ?? h.id}?${new URLSearchParams({
                    ...(checkIn ? { check_in: checkIn } : {}),
                    ...(checkOut ? { check_out: checkOut } : {}),
                    guests: String(guests),
                    rooms: String(rooms),
                  }).toString()}`;
                  return (
                    <a key={h.id} href={href} className="block group">
                    <Card variant="premium" hover lift="sm" padded={false} className="overflow-hidden">
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
                        {/* Image */}
                        <div className="relative h-44 md:h-full bg-gradient-to-br from-accent-100 via-accent-50 to-primary-50 overflow-hidden">
                          {h.primary_image_url ? (
                            <img
                              src={h.primary_image_url}
                              alt={h.hotel_name}
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Building2 className="h-12 w-12 text-accent-300" />
                            </div>
                          )}
                          {h.is_featured && (
                            <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur text-primary-700">
                              Featured
                            </span>
                          )}
                          <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur text-ink">
                            <Star className="h-3 w-3 fill-accent-500 text-accent-500" />
                            {h.average_rating > 0 ? h.average_rating.toFixed(1) : "New"}
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex flex-col">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-ink group-hover:text-primary-600 transition-colors truncate">
                                {h.hotel_name}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-ink-4 mt-1">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">
                                  {h.landmark ? `${h.landmark}, ` : ""}
                                  {h.city_name}
                                  {h.state_name ? `, ${h.state_name}` : ""}
                                </span>
                              </div>
                              {h.star_rating != null && h.star_rating > 0 && (
                                <div className="mt-1.5 text-amber-500 text-xs" aria-label={`${h.star_rating} star hotel`}>
                                  {"★".repeat(h.star_rating)}
                                  <span className="text-ink-5 ml-1.5">
                                    {h.total_reviews > 0 ? `${h.total_reviews} reviews` : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-[10px] text-ink-4 uppercase tracking-wider">Starts from</div>
                              <div className="text-xl font-extrabold text-gradient-primary">
                                {h.starting_price > 0 ? INR(h.starting_price) : "—"}
                              </div>
                              <div className="text-[10px] text-ink-4">per night</div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {(h.amenities ?? []).slice(0, 4).map((a) => (
                              <span
                                key={a}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-ink-9 text-[10px] font-semibold uppercase tracking-wider text-ink-3"
                              >
                                {a}
                              </span>
                            ))}
                            {h.room_category_count > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 text-[10px] font-semibold uppercase tracking-wider text-primary-600">
                                {h.room_category_count} room type{h.room_category_count > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>

                          <div className="mt-auto pt-4 flex items-center justify-between">
                            <span className="text-xs text-ink-4">{h.address || h.city_name}</span>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 group-hover:gap-2 transition-all">
                              View rooms <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                    </a>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
}

export default function HotelResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
