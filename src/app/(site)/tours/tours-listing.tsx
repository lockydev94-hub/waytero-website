"use client";

/**
 * /tours — Real-world tour package listing.
 *
 * URL is the source of truth: destination, duration, persons, package_type,
 * price range, sort. Results are queried from /public/tours/packages.
 * The page also surfaces a "popular destinations" strip on top (lazy).
 *
 * Doc Ref: BRD_PART_5_TOUR_PACKAGE_MANAGEMENT §6
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui";
import { CtaSection } from "@/components/renderers";
import TourFilters, { readFiltersFromParams } from "@/components/tours/TourFilters";
import TourCard from "@/components/tours/TourCard";
import { Loader2, MapPin, Sparkles, SearchX, Search as SearchIcon, RefreshCcw, Filter } from "lucide-react";
import { tourService, type PublicTourPackage, type PublicTourDestination } from "@/services/tourService";

export default function ToursListingPage({ heroImage }: { heroImage?: string | null }) {
  const router = useRouter();
  const rawParams = useSearchParams();
  const params = useMemo(() => rawParams ?? new URLSearchParams(), [rawParams]);
  const filters = useMemo(() => readFiltersFromParams(params), [params]);

  const [items, setItems] = useState<PublicTourPackage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(params.get("page") ?? 1));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<PublicTourDestination[]>([]);

  // Popular destinations (top of page)
  useEffect(() => {
    tourService.popularDestinations().then(setDestinations).catch(() => {});
  }, []);

  // Main results
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPage(1); // reset to first page on filter change
    tourService
      .searchAll({
        destination: filters.destination || undefined,
        city_id: filters.city_id ?? undefined,
        duration: filters.duration || undefined,
        package_type: filters.package_type || undefined,
        persons: filters.persons || undefined,
        min_price: filters.min_price === "" ? undefined : Number(filters.min_price),
        max_price: filters.max_price === "" ? undefined : Number(filters.max_price),
        sort: filters.sort,
        page: 1,
        page_size: 12,
      })
      .then(res => {
        setItems(res.items);
        setTotal(res.total);
        if (res.items.length === 0 && !filters.destination) {
          setError("No tours match your filters yet. Try widening the price range or removing a filter.");
        } else if (res.items.length === 0) {
          setError(`No tours match "${filters.destination}". Try a different destination.`);
        }
      })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load tours"))
      .finally(() => setLoading(false));
  }, [filters]);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoading(true);
    tourService
      .searchAll({
        destination: filters.destination || undefined,
        city_id: filters.city_id ?? undefined,
        duration: filters.duration || undefined,
        package_type: filters.package_type || undefined,
        persons: filters.persons || undefined,
        min_price: filters.min_price === "" ? undefined : Number(filters.min_price),
        max_price: filters.max_price === "" ? undefined : Number(filters.max_price),
        sort: filters.sort,
        page: nextPage,
        page_size: 12,
      })
      .then(res => {
        setItems(prev => [...prev, ...res.items]);
        setPage(nextPage);
      })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load more tours"))
      .finally(() => setLoading(false));
  };

  const hasMore = items.length < total;

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent-50/50 via-white to-white">
      {/* ── Header strip ─────────────────────────────────────── */}
      <div className="relative bg-ink text-white overflow-hidden">
        {/* Admin banner image (Settings → Service Types → TOUR) with overlay */}
        {heroImage && (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${heroImage}")` }}
          />
        )}
        {heroImage && <div aria-hidden className="absolute inset-0 bg-ink/75" />}
        <Container size="xl" className="relative pt-8 pb-7">
          <nav className="text-xs text-white/60 mb-3">
            <button type="button" onClick={() => router.push("/")} className="hover:text-white transition-colors">
              Home
            </button>
            <span className="mx-2">/</span>
            <span className="text-white/90">Tours</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-accent-300">
                <Sparkles className="h-3.5 w-3.5" /> Curated experiences
              </span>
              <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Tour packages,{" "}
                <span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">
                  stress-free
                </span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Handpicked itineraries with verified operators — from weekend getaways to Himalayan treks. Fully managed from booking to return.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60 uppercase tracking-wider">Tours found</div>
              <div className="text-xl font-bold text-accent-400">{total}</div>
            </div>
          </div>
        </Container>
      </div>

      {/* ── Popular destinations strip (when no filter) ────── */}
      {destinations.length > 0 && !filters.destination && !filters.city_id && (
        <Container size="xl" className="py-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-ink">Popular destinations</h2>
              <p className="text-sm text-ink-3">Trending this season</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {destinations.slice(0, 6).map(d => (
              <button
                key={d.city_id}
                type="button"
                onClick={() => {
                  const sp = new URLSearchParams();
                  sp.set("city_id", String(d.city_id));
                  sp.set("destination", d.city_name);
                  router.push(`/tours?${sp.toString()}`);
                }}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-wt aspect-[4/5] hover:shadow-wt-lg transition-all"
              >
                {d.hero_image_url ? (
                  <img
                    src={d.hero_image_url}
                    alt={d.city_name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-700 to-accent-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-left text-white">
                  <div className="text-sm font-extrabold leading-tight">{d.city_name}</div>
                  <div className="text-[10px] text-white/80 mt-0.5">
                    {d.package_count} tour{d.package_count === 1 ? "" : "s"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Container>
      )}

      {/* ── Filter sidebar + Results grid ───────────────────── */}
      <Container size="xl" className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar */}
          <TourFilters cities={destinations.map(d => ({ id: d.city_id, name: d.city_name, state_name: d.state_name }))} />

          {/* Results */}
          <div>
            {loading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
                <p className="text-sm text-ink-3">Finding the best tours for you…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-3xl bg-white shadow-wt p-10 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-ink-9 grid place-items-center mb-4">
                  <SearchX className="h-7 w-7 text-ink-4" />
                </div>
                <h3 className="text-lg font-extrabold text-ink">No tours match your filters</h3>
                <p className="mt-1 text-sm text-ink-3 max-w-md mx-auto">{error}</p>
                <div className="mt-5 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => router.replace("/tours")}
                    className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Reset filters
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="inline-flex items-center gap-2 rounded-full border border-ink-7 px-4 py-2 text-sm font-bold text-ink-3 hover:bg-ink-9"
                  >
                    Back to home
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Results summary bar */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-3">
                    <b className="text-ink">{total}</b> tour{total === 1 ? "" : "s"} found
                    {filters.destination && (
                      <> for <b className="text-ink">"{filters.destination}"</b></>
                    )}
                  </p>
                  {items.length < total && (
                    <p className="text-xs text-ink-4">
                      Showing {items.length} of {total}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {items.map(tour => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-full border border-ink-7 bg-white px-6 py-3 text-sm font-bold text-ink-2 shadow-wt hover:bg-ink-9 disabled:opacity-60"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SearchIcon className="h-4 w-4" />
                      )}
                      Load more tours
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>

      <CtaSection
        variant={{
          title: "Not finding the perfect tour?",
          subtitle: "Tell us where you want to go and we'll plan it for you.",
          primary_cta: { label: "Plan a custom tour", href: "/contact" },
        }}
      />
    </div>
  );
}
