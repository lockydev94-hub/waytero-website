// ============================================================
// Service-area check — matchNearestCity returns the NEAREST
// active city for any coordinates in India, so a pick in an
// unserved metro still "matches" Bhubaneswar. The honest UX is:
// a pick farther than SERVICE_AREA_RADIUS_KM from the matched
// city centre is OUT OF AREA → show "we don't serve this area
// yet" instead of quoting another city's fares as if they were
// local. (Owner rule for the Bhubaneswar/Odisha primary market.)
// ============================================================

import type { PublicCity } from "@/services/cabService";

/** Straight-line radius treated as "this pick belongs to that city". */
export const SERVICE_AREA_RADIUS_KM = 120;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** True when the pick is NOT in service range.
 *  has_pricing=false is the decisive signal: matchNearestCity can return a
 *  real city (e.g. New Delhi) that has zero quotable fares, and the pick sits
 *  ~0 km from its centre, so the radius alone would call it "in area".
 *  A match without centre coordinates can't be radius-checked — trusted. */
export function outOfServiceArea(
  city: PublicCity | null | undefined,
  lat: number,
  lng: number,
): boolean {
  if (!city) return true;
  if (city.has_pricing === false) return true;
  if (city.latitude == null || city.longitude == null) return false;
  return haversineKm(city.latitude, city.longitude, lat, lng) > SERVICE_AREA_RADIUS_KM;
}
