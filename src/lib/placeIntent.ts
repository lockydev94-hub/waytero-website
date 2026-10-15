// ============================================================
// Place intent — remembers that a customer picked an airport or
// railway station, so the homepage can offer the matching place
// page on their next visit ("Book a cab to the airport?").
//
// Storage contract (all client-side, never sent anywhere):
//   localStorage.wt_intent_place      {slug,name,kind,ts} of the last pick
//   localStorage.wt_intent_dismissed  slug the customer said "no" to
//   sessionStorage.wt_geo_asked       geolocation chip was used this session
// ============================================================

import { API_BASE } from "./apiBase";

export interface PlaceIntent {
  slug: string;
  name: string;
  kind: string;
  ts: number;
}

interface PublicPlace {
  id: number;
  name: string;
  kind: string;
  code: string | null;
  city_id: number;
  city_name: string;
  slug: string;
  latitude: number | string | null;
  longitude: number | string | null;
}

const INTENT_KEY = "wt_intent_place";
const DISMISS_KEY = "wt_intent_dismissed";
const GEO_ASKED_KEY = "wt_geo_asked";
const STALE_MS = 14 * 24 * 60 * 60 * 1000;

// Geocoder types that mean "this pick is a station/airport we may have a page for".
const TRANSPORT_TYPES = new Set([
  "airport",
  "train_station",
  "transit_station",
  "light_rail_station",
  "subway_station",
]);

let placesCache: PublicPlace[] | null = null;

async function loadPlaces(): Promise<PublicPlace[]> {
  if (placesCache) return placesCache;
  try {
    const res = await fetch(`${API_BASE}/public/places`, { cache: "default" });
    if (!res.ok) return [];
    const rows = await res.json();
    placesCache = Array.isArray(rows) ? rows : [];
    return placesCache;
  } catch {
    return [];
  }
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * After a Places pick resolves to coordinates, remember it when the pick is
 * a transport hub AND we actually have a landing page for that exact place
 * (within ~2 km). Fire-and-forget: never blocks or fails the booking flow.
 */
export async function maybeRecordPlaceIntent(
  types: string[] | undefined,
  lat: number,
  lng: number,
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!types?.some((t) => TRANSPORT_TYPES.has(t))) return;
  try {
    const places = await loadPlaces();
    // /public/places only returns places with a published page already.
    const hit = places.find(
      (p) =>
        p.latitude != null &&
        p.longitude != null &&
        distanceKm(lat, lng, Number(p.latitude), Number(p.longitude)) < 2,
    );
    if (!hit) return;
    localStorage.setItem(
      INTENT_KEY,
      JSON.stringify({ slug: hit.slug, name: hit.name, kind: hit.kind, ts: Date.now() }),
    );
  } catch {
    /* intent is a nicety — swallow everything */
  }
}

/** The stored intent, or null when absent / dismissed / stale. */
export function readPlaceIntent(): PlaceIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    const intent = JSON.parse(raw) as PlaceIntent;
    if (!intent?.slug || !intent.name) return null;
    if (Date.now() - intent.ts > STALE_MS) return null;
    if (localStorage.getItem(DISMISS_KEY) === intent.slug) return null;
    return intent;
  } catch {
    return null;
  }
}

export function dismissPlaceIntent(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(INTENT_KEY);
    if (raw) {
      const intent = JSON.parse(raw) as PlaceIntent;
      if (intent?.slug) localStorage.setItem(DISMISS_KEY, intent.slug);
    }
    localStorage.removeItem(INTENT_KEY);
  } catch {
    /* nothing to dismiss */
  }
}

/** True once the customer has used the location chip this session. */
export function markGeoAsked(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(GEO_ASKED_KEY, "1");
  } catch {
    /* private mode etc. */
  }
}
