"use client";

/**
 * TourFilters — Sidebar with filter controls for the /tours listing.
 * URL is the source of truth; this component reads and writes via
 * useRouter().replace().
 *
 * Doc Ref: BRD_PART_5_TOUR_PACKAGE_MANAGEMENT §6
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, RotateCcw, MapPin, Wallet, Users, Clock3, Star, ArrowDownAZ } from "lucide-react";

export type SortMode = "recommended" | "price_asc" | "price_desc" | "newest";

export interface TourFilterValues {
  destination: string;
  city_id: number | null;
  duration: string;
  package_type: string;
  persons: number;
  min_price: number | "";
  max_price: number | "";
  sort: SortMode;
}

export const DEFAULT_FILTERS: TourFilterValues = {
  destination: "",
  city_id: null,
  duration: "",
  package_type: "",
  persons: 2,
  min_price: "",
  max_price: "",
  sort: "recommended",
};

const DURATION_BUCKETS = [
  { value: "", label: "Any duration" },
  { value: "1-3", label: "1–3 days" },
  { value: "4-6", label: "4–6 days" },
  { value: "7-10", label: "7–10 days" },
  { value: "11-14", label: "11–14 days" },
  { value: "15+", label: "15+ days" },
];

const PACKAGE_TYPES = [
  { value: "", label: "All types" },
  { value: "FIXED", label: "Fixed Departure" },
  { value: "PRIVATE", label: "Private Tour" },
  { value: "GROUP", label: "Group Tour" },
  { value: "PILGRIMAGE", label: "Pilgrimage" },
  { value: "CORPORATE", label: "Corporate" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc", label: "Price: Low to high" },
  { value: "price_desc", label: "Price: High to low" },
  { value: "newest", label: "Newest first" },
];

export function readFiltersFromParams(params: URLSearchParams | null): TourFilterValues {
  if (!params) return DEFAULT_FILTERS;
  return {
    destination: params.get("destination") ?? "",
    city_id: params.get("city_id") ? Number(params.get("city_id")) : null,
    duration: params.get("duration") ?? "",
    package_type: params.get("package_type") ?? "",
    persons: Number(params.get("persons") ?? 2),
    min_price: params.get("min_price") ? Number(params.get("min_price")) : "",
    max_price: params.get("max_price") ? Number(params.get("max_price")) : "",
    sort: (params.get("sort") as SortMode) || "recommended",
  };
}

export function filtersToParams(f: TourFilterValues): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.destination.trim()) sp.set("destination", f.destination.trim());
  if (f.city_id) sp.set("city_id", String(f.city_id));
  if (f.duration) sp.set("duration", f.duration);
  if (f.package_type) sp.set("package_type", f.package_type);
  if (f.persons > 0 && f.persons !== 2) sp.set("persons", String(f.persons));
  if (f.min_price !== "" && f.min_price !== undefined) sp.set("min_price", String(f.min_price));
  if (f.max_price !== "" && f.max_price !== undefined) sp.set("max_price", String(f.max_price));
  if (f.sort && f.sort !== "recommended") sp.set("sort", f.sort);
  return sp;
}

export default function TourFilters({
  cities,
  onChange,
}: {
  cities: { id: number; name: string; state_name?: string }[];
  onChange?: (f: TourFilterValues) => void;
}) {
  const router = useRouter();
  const rawParams = useSearchParams();
  const params = useMemo(() => rawParams ?? new URLSearchParams(), [rawParams]);
  const [filters, setFilters] = useState<TourFilterValues>(() => readFiltersFromParams(params));

  // Sync URL → state when URL changes externally
  useEffect(() => {
    setFilters(readFiltersFromParams(params));
  }, [params]);

  const apply = useCallback(
    (next: TourFilterValues) => {
      setFilters(next);
      const sp = filtersToParams(next);
      const qs = sp.toString();
      router.replace(qs ? `/tours?${qs}` : "/tours", { scroll: false });
      onChange?.(next);
    },
    [onChange, router]
  );

  const update = <K extends keyof TourFilterValues>(key: K, value: TourFilterValues[K]) => {
    apply({ ...filters, [key]: value });
  };

  const reset = () => apply(DEFAULT_FILTERS);

  return (
    <aside className="lg:sticky lg:top-6 self-start rounded-3xl bg-white p-5 shadow-wt border border-ink-7 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary-600" />
          <h3 className="text-sm font-black uppercase tracking-wider text-ink">Filters</h3>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 text-xs font-bold text-ink-3 hover:text-primary-600 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* Destination */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-4 mb-1.5">
          <MapPin className="inline h-3.5 w-3.5 mr-1" /> Destination
        </label>
        <input
          value={filters.destination}
          onChange={e => update("destination", e.target.value)}
          placeholder="e.g. Goa, Manali, Kerala"
          className="w-full rounded-xl border border-ink-7 px-3 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
        />
        {cities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cities.slice(0, 6).map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => update("city_id", filters.city_id === c.id ? null : c.id)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                  filters.city_id === c.id
                    ? "bg-primary-600 text-white"
                    : "bg-ink-9 text-ink-3 hover:bg-primary-50 hover:text-primary-700"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-4 mb-1.5">
          <Clock3 className="inline h-3.5 w-3.5 mr-1" /> Duration
        </label>
        <select
          value={filters.duration}
          onChange={e => update("duration", e.target.value)}
          className="w-full rounded-xl border border-ink-7 px-3 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
        >
          {DURATION_BUCKETS.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Package type */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-4 mb-1.5">
          Package type
        </label>
        <select
          value={filters.package_type}
          onChange={e => update("package_type", e.target.value)}
          className="w-full rounded-xl border border-ink-7 px-3 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
        >
          {PACKAGE_TYPES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Travellers */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-4 mb-1.5">
          <Users className="inline h-3.5 w-3.5 mr-1" /> Travellers
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={filters.persons}
          onChange={e => update("persons", Math.max(1, Number(e.target.value) || 1))}
          className="w-full rounded-xl border border-ink-7 px-3 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
        />
      </div>

      {/* Price */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-4 mb-1.5">
          <Wallet className="inline h-3.5 w-3.5 mr-1" /> Price (₹ per package)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={filters.min_price}
            onChange={e => update("min_price", e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-xl border border-ink-7 px-3 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
          />
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={filters.max_price}
            onChange={e => update("max_price", e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-xl border border-ink-7 px-3 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-4 mb-1.5">
          <ArrowDownAZ className="inline h-3.5 w-3.5 mr-1" /> Sort by
        </label>
        <select
          value={filters.sort}
          onChange={e => update("sort", e.target.value as SortMode)}
          className="w-full rounded-xl border border-ink-7 px-3 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
        >
          {SORT_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </aside>
  );
}
