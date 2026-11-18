// ============================================================
// cabPrices — the published rate card, as the website reads it
//
// One fetch of GET /public/cab/cities/{id}/price-list feeds every page that
// quotes a cab price (the price list, trip-type landing pages, the landing
// fare band). Keeping one shape means those pages cannot drift apart, and the
// numbers they show are the card checkout charges from.
// ============================================================

import { API_BASE } from "@/lib/apiBase";

export interface CabPricePackage {
  rental_type: string;
  included_hours: number;
  included_km: number;
  price: string | number;
  extra_hour_rate: string | number;
  extra_km_rate: string | number;
  driver_allowance: string | number;
  midnight_return_charge: string | number;
  toll_included: boolean;
  parking_included: boolean;
  night_halt_included: boolean;
}

export interface CabPriceClass {
  vehicle_class: string;
  vehicle_label: string;
  vehicle_models: string | null;
  seating_capacity: number | null;
  vehicle_category_id: number;
  category_name: string;
  image_url: string | null;
  rate_source: "CITY" | "PLATFORM";
  packages: CabPricePackage[];
}

export interface CabPriceList {
  city_id: number;
  city_name: string;
  currency: string;
  rental_types: string[];
  classes: CabPriceClass[];
}

/** Server-component read of a city's published card. Returns null when the
 *  backend is unreachable, and the caller omits the band or falls back rather
 *  than quoting a made-up price. */
export async function fetchCabPriceList(
  cityId: number,
): Promise<CabPriceList | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/cab/cities/${cityId}/price-list`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as CabPriceList;
  } catch {
    return null;
  }
}

/** Which card product a website trip type is sold as. Mirrors the backend's
 *  `rental_type_for`: airport transfers are a local hire, a one-way drop is
 *  the outstation package, and Cab Rent is the daily product. */
export function rentalTypeForTrip(tripType: string): string {
  const trip = (tripType || "").toUpperCase();
  if (trip === "DAILY" || trip === "RENTAL") return "DAILY";
  if (trip === "OUTSTATION" || trip === "ONE_WAY" || trip === "ROUND_TRIP") {
    return "OUTSTATION";
  }
  return "LOCAL";
}

/** The package a price table quotes for a class. Local cards carry several
 *  duty options (5h/50km … 12h/120km); the standard one is shown in the row
 *  and the rest are listed beside it, so no cheaper or longer option is
 *  hidden. */
export function standardPackage(
  packages: CabPricePackage[],
): CabPricePackage {
  return (
    packages.find((p) => p.included_hours === 8) ??
    packages[Math.min(1, packages.length - 1)] ??
    packages[0]
  );
}

export function inr(value: string | number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
