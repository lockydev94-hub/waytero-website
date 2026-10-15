import type { MetadataRoute } from "next";

// ============================================================
// WayTero sitemap — complete canonical URL inventory, all DB-driven.
//
// Families (each only when the DB actually has data):
//   /                        — homepage
//   /cabs, /hotels, /tours, /blog + company pages
//   /cabs/{local,airport,…}  — one page per trip type with active pricing
//   /{landing slug}          — city hubs + city/state service pages
//                              (the [slug] engine's published rows)
//   /hotels/{slug}           — partner-added hotels
//   /tours/{slug}            — partner/admin tour packages (clean slugs)
//   /blog/{slug}             — published articles
//
// Never included: login/register/account/api/track/admin or empty sections.
// The retired /destinations/{city} and /hotels/city/{city} families are gone —
// they 301 to the landing slugs now (next.config.ts), and 301s in a sitemap
// are a crawl smell.
// ============================================================

import { API_BASE } from "@/lib/apiBase";
import { getLandingRefs } from "@/lib/landingIndex";
import { getAvailability, serviceVisible } from "@/lib/availability";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://waytero.com";

interface HotelRow {
  slug?: string | null;
  updated_at?: string | null;
}
interface TourRow {
  slug: string;
  updated_at?: string | null;
}
interface BlogRow {
  slug: string;
  updated_at?: string | null;
  published_at?: string | null;
}
interface TripTypeRow {
  code: string;
}

const TRIP_SLUGS: Record<string, string> = {
  LOCAL: "local",
  AIRPORT: "airport",
  OUTSTATION: "outstation",
  ONE_WAY: "one-way",
  ROUND_TRIP: "round-trip",
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const day = (d?: string | null) => (d ? new Date(d) : new Date());

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Hidden verticals (disabled or zero supply) are 404 site-wide, so they
  // must not appear in the sitemap either — a crawled 404 wastes budget and
  // re-teaches Google URLs we no longer serve.
  const av = await getAvailability();
  const cabVisible = serviceVisible(av, "CAB");
  const hotelVisible = serviceVisible(av, "HOTEL");
  const tourVisible = serviceVisible(av, "TOUR");

  const staticUrls: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...(cabVisible ? [{ url: `${appUrl}/cabs`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 }] : []),
    ...(hotelVisible ? [{ url: `${appUrl}/hotels`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 }] : []),
    ...(tourVisible ? [{ url: `${appUrl}/tours`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 }] : []),
    { url: `${appUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${appUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/partner`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${appUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  // ── Cab trip-type pages (only types with ≥1 active pricing rule) ──
  const tripTypes = cabVisible
    ? await fetchJson<TripTypeRow[]>(`${API_BASE}/public/cab/trip-types`)
    : null;
  const tripUrls: MetadataRoute.Sitemap = (tripTypes ?? [])
    .map((t) => TRIP_SLUGS[t.code])
    .filter(Boolean)
    .map((slug) => ({
      url: `${appUrl}/cabs/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  // ── Landing pages — city hubs (0.85), place cab pages (0.82), vertical
  // pages (0.8). The refs endpoint already filters to published, in-window
  // rows; pages of hidden verticals are dropped here. ──
  const landingRefs = await getLandingRefs();
  const landingUrls: MetadataRoute.Sitemap = landingRefs
    .filter((r) =>
      r.page_type === "PLACE_CABS"
        ? cabVisible
        : r.service_type === "CAB"
          ? cabVisible
          : r.service_type === "HOTEL"
            ? hotelVisible
            : r.service_type === "TOUR"
              ? tourVisible
              : true,
    )
    .map((r) => ({
      url: `${appUrl}/${r.slug}`,
      lastModified: day(r.updated_at),
      changeFrequency: "weekly" as const,
      priority:
        r.page_type === "CITY_HUB" ? 0.85 : r.page_type === "PLACE_CABS" ? 0.82 : 0.8,
    }));

  // ── Hotels (partner-added; page through the search feed) ──
  const hotelRows: HotelRow[] = [];
  if (hotelVisible) {
    for (let page = 1; page <= 10; page++) {
      const data = await fetchJson<{ items: HotelRow[] }>(
        `${API_BASE}/public/hotel/search?page=${page}&page_size=50`,
      );
      const items = data?.items ?? [];
      if (items.length === 0) break;
      hotelRows.push(...items);
    }
  }
  const hotelUrls: MetadataRoute.Sitemap = hotelRows
    .filter((h) => h.slug)
    .map((h) => ({
      url: `${appUrl}/hotels/${h.slug}`,
      lastModified: day(h.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // ── Tour packages (clean SEO slugs) + blog posts ──
  const [tours, blogs] = await Promise.all([
    tourVisible
      ? fetchJson<{ items: TourRow[] }>(`${API_BASE}/public/tours/packages?page_size=48`).then(
          (data) => data?.items ?? [],
        )
      : Promise.resolve([] as TourRow[]),
    fetchJson<{ data: BlogRow[] }>(`${API_BASE}/public/blog?per_page=50`).then(
      (data) => data?.data ?? [],
    ),
  ]);

  const tourUrls: MetadataRoute.Sitemap = tours
    .filter((t) => t.slug)
    .map((t) => ({
      url: `${appUrl}/tours/${t.slug}`,
      lastModified: day(t.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const blogUrls: MetadataRoute.Sitemap = blogs
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${appUrl}/blog/${b.slug}`,
      lastModified: day(b.updated_at ?? b.published_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [
    ...staticUrls,
    ...tripUrls,
    ...landingUrls,
    ...hotelUrls,
    ...tourUrls,
    ...blogUrls,
  ];
}
