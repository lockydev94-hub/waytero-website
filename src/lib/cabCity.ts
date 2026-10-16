// ============================================================
// cabCity — one answer to "which city does this marketing page quote?"
//
// GET /public/cab/cities comes back ORDER BY c.name, so cities[0] is
// alphabetical and may have no rules at all. Every band that shows a price
// or a city-scoped list takes its city from here so two bands on the same
// page can never disagree about which city they are talking about.
// ============================================================

import { API_BASE } from "@/lib/apiBase";

export interface CabCityRow {
  id: number;
  name: string;
  city_code?: string | null;
  state_name?: string | null;
  vehicle_count?: number;
  has_pricing?: boolean;
  /** city_specific = the city has its own rules; default = priced on
   *  platform-standard rates; none = nothing is bookable there. */
  pricing_source?: "city_specific" | "default" | "none";
}

/** Prefer a city with its own fare rules, then the platform's home city
 *  (the one the hero copy names and the search card preselects), then any
 *  city with a pricable vehicle, then whatever came back — the list is
 *  alphabetical, so "whatever came back" is Ahmedabad. Returns null when
 *  the list is empty. */
export function pickCabCity<T extends CabCityRow>(cities: T[]): T | null {
  if (!cities.length) return null;
  const priced = (c: T) => Number(c.vehicle_count ?? 0) > 0 || c.has_pricing === true;
  return (
    cities.find((c) => c.pricing_source === "city_specific") ??
    cities.find((c) => c.city_code === "BBS" && priced(c)) ??
    cities.find(priced) ??
    cities[0] ??
    null
  );
}

/**
 * Server-component city list. Raw fetch with revalidate — the client-side
 * `cabService` helpers are `cache: "no-store"` and would turn an ISR page
 * dynamic on every request. Unreachable backend yields [] so the caller
 * omits its band instead of erroring the page.
 */
export async function fetchCabCities(): Promise<CabCityRow[]> {
  try {
    const res = await fetch(`${API_BASE}/public/cab/cities`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as CabCityRow[];
  } catch {
    return [];
  }
}
