import type { MetadataRoute } from "next";

// ============================================================
// WayTero sitemap — complete canonical URL inventory, all DB-driven.
//
// Families (each only when the DB actually has data):
//   /                        — homepage
//   /cabs, /hotels, /tours, /blog + company pages
//   /cabs/{local,airport,…}  — one page per trip type with active pricing
//   /destinations/{city}     — one page per city with active tour packages
//   /hotels/{slug}           — partner-added hotels
//   /tours/{slug}            — partner/admin tour packages (clean slugs)
//   /blog/{slug}             — published articles
//
// Never included: login/register/account/api/track/admin or empty sections.
// ============================================================

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
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
interface DestinationRow {
  city_id: number;
  name: string;
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

  const staticUrls: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/cabs`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/hotels`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/tours`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${appUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${appUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/partner`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${appUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  // ── Cab trip-type pages (only types with ≥1 active pricing rule) ──
  const tripTypes = await fetchJson<TripTypeRow[]>(`${API_BASE}/public/cab/trip-types`);
  const tripUrls: MetadataRoute.Sitemap = (tripTypes ?? [])
    .map((t) => TRIP_SLUGS[t.code])
    .filter(Boolean)
    .map((slug) => ({
      url: `${appUrl}/cabs/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  // ── Destination category pages (cities with active tour packages) ──
  const destinations = await fetchJson<{ items: DestinationRow[] }>(
    `${API_BASE}/public/tours/popular-destinations`,
  );
  const destinationUrls: MetadataRoute.Sitemap = (destinations?.items ?? [])
    .filter((d) => d.name)
    .map((d) => ({
      url: `${appUrl}/destinations/${d.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // ── Hotels (partner-added; page through the search feed) ──
  const hotelRows: HotelRow[] = [];
  for (let page = 1; page <= 10; page++) {
    const data = await fetchJson<{ items: HotelRow[] }>(
      `${API_BASE}/public/hotel/search?page=${page}&page_size=50`,
    );
    const items = data?.items ?? [];
    if (items.length === 0) break;
    hotelRows.push(...items);
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
    fetchJson<{ items: TourRow[] }>(`${API_BASE}/public/tours/packages?page_size=48`).then(
      (data) => data?.items ?? [],
    ),
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

  return [...staticUrls, ...tripUrls, ...destinationUrls, ...hotelUrls, ...tourUrls, ...blogUrls];
}
