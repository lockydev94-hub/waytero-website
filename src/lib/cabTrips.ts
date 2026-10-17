// ============================================================
// Cab trip-type pages that exist right now.
//
// /cabs/{local,airport,…} only answers while its trip type has at least one
// ACTIVE pricing rule — the page 404s itself otherwise. Anything that links
// to one therefore asks the fare engine rather than keeping its own list, or
// it offers a dead door the moment admin changes pricing.
//
// The slugs here must match TRIP_META in app/(site)/cabs/[trip]/page.tsx:
// that file owns the page, this one owns the link.
// ============================================================

import { cache } from "react";
import { API_BASE } from "./apiBase";

export const TRIP_SLUGS: Record<string, string> = {
  LOCAL: "local",
  AIRPORT: "airport",
  OUTSTATION: "outstation",
  ONE_WAY: "one-way",
  ROUND_TRIP: "round-trip",
};

export interface TripLink {
  href: string;
  label: string;
}

/** Empty when the API is unreachable — a missing group beats invented links. */
export const getTripLinks = cache(async (): Promise<TripLink[]> => {
  let rows: Array<{ code: string; display_name: string }> = [];
  try {
    const res = await fetch(`${API_BASE}/public/cab/trip-types`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    rows = await res.json();
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) return [];
  return rows
    .map((t) => {
      const slug = TRIP_SLUGS[t.code];
      if (!slug) return null;
      const name = (t.display_name || slug).trim();
      return { href: `/cabs/${slug}`, label: `${name.charAt(0).toUpperCase()}${name.slice(1)} cabs` };
    })
    .filter((x): x is TripLink => x !== null)
    .sort((a, b) => a.href.localeCompare(b.href));
});
