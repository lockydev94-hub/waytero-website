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
import { Filter, RotateCcw, MapPin, Wallet, Users, Clock3, Star, ArrowDownAZ, Check, Info } from "lucide-react";

export type SortMode = "recommended" | "price_asc" | "price_desc" | "newest";

/** One line from a package's own inclusion list, plus how many packages
 *  declare it. Counted server-side and handed down — see tours/page.tsx. */
export interface InclusionLine {
  text: string;
  count: number;
}

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

// Structural facts about how a WayTero tour is priced and run — no numbers
// that belong to a package or a policy the sidebar can't see. Each one is
// backed by the fields the listing itself renders.
const GOOD_TO_KNOW = [
  {
    title: "Price is per package, not per person",
    text: "Partners set one price per traveller slab, so the total moves with your group size — the package page lists every slab.",
  },
  {
    title: "Minimum travellers are enforced",
    text: "A tour confirms once it has the party size it was priced for, so the range on each card is a real limit, not a suggestion.",
  },
  {
    title: "Cancellations are counted in days",
    text: "Refunds step down the closer you get to departure, and a package can set its own ladder. The one that applies is printed at checkout.",
  },
  {
    title: "Itineraries are day-by-day",
    text: "Each package carries its own schedule with what is included and what is not, so you can read your total against the plan it pays for.",
  },
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
  inclusions = [],
  tourCount,
  goodToKnow = GOOD_TO_KNOW,
}: {
  cities: { id: number; name: string; state_name?: string }[];
  onChange?: (f: TourFilterValues) => void;
  // Counted from the live packages in page.tsx — the sidebar states what a
  // tour covers without a second fetch. Empty list → the card is omitted.
  inclusions?: InclusionLine[];
  // Packages currently matching, for the header line of the inclusion card.
  tourCount?: number;
  goodToKnow?: { title: string; text: string }[];
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

      {/* What's included — counted from the live packages, so this states what
          the catalogue actually declares rather than a generic promise. */}
      {inclusions.length > 0 && (
        <div className="rounded-2xl border border-ink-7 bg-ink-9/60 p-4">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-ink">
            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            Usually included
            {typeof tourCount === "number" && tourCount > 0 && (
              <span className="ml-auto text-[10px] font-bold text-ink-4">of {tourCount} tours</span>
            )}
          </h4>
          <ul className="mt-3 space-y-2">
            {inclusions.slice(0, 5).map((line) => (
              <li key={line.text} className="flex items-start gap-2 text-xs leading-relaxed text-ink-3">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                <span className="min-w-0 flex-1">{line.text}</span>
                <span className="shrink-0 text-[10px] font-bold text-ink-4">{line.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Good to know — structural facts about how tours are priced/run. */}
      {goodToKnow.length > 0 && (
        <div className="rounded-2xl border border-ink-7 bg-white p-4">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-ink">
            <Info className="h-3.5 w-3.5 text-primary-600" aria-hidden />
            Good to know
          </h4>
          <ul className="mt-3 space-y-3">
            {goodToKnow.map((f) => (
              <li key={f.title}>
                <p className="text-xs font-bold text-ink">{f.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-3">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
