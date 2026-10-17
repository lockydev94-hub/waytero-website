import type { MetadataRoute } from "next";

// ============================================================
// WayTero sitemap — complete canonical URL inventory, all DB-driven.
//
// Families (each only when the DB actually has data):
//   /                        — homepage
//   /cabs, /hotels, /tours, /blog + company pages
//   /cabs/{local,airport,…}  — one page per trip type with active pricing
//   /cabs/routes             — the inter-city corridors hub
//   /cabs/routes/{slug}      — one page per published route
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
import { getPageBody } from "@/lib/pageBody";
import { TRIP_SLUGS } from "@/lib/cabTrips";

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
interface RouteRow {
  slug: string;
}

/** Pages whose body an admin authors in Website → Pages. A slug that has no
 *  published row is not crawled — the URL still serves the built-in copy, but
 *  the admin has not stood behind a body for it. `down` (API unreachable at
 *  build time) is kept, because the page is genuinely up on the copy shipped
 *  with the site. `/security` is absent: its content is code, not a body. */
const BODY_PAGES: { slug: string; path: string; priority: number }[] = [
  { slug: "refund", path: "/refund", priority: 0.6 },
  { slug: "booking-instructions", path: "/booking-instructions", priority: 0.6 },
  { slug: "terms", path: "/terms", priority: 0.5 },
  { slug: "privacy", path: "/privacy", priority: 0.5 },
  { slug: "cookies", path: "/cookies", priority: 0.4 },
  { slug: "safety", path: "/safety", priority: 0.5 },
  { slug: "support", path: "/support", priority: 0.5 },
  { slug: "careers", path: "/careers", priority: 0.4 },
  { slug: "press", path: "/press", priority: 0.4 },
];

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
    { url: `${appUrl}/feedback`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    // Code-authored, so nothing to gate them on: /security is the same four
    // sections on every deploy, and /sitemap is the human-readable index.
    { url: `${appUrl}/security`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/sitemap`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // ── Admin-authored page bodies (see BODY_PAGES) ──
  const bodyEntries = await Promise.all(
    BODY_PAGES.map(async (p) => ({ ...p, state: await getPageBody(p.slug) })),
  );
  const bodyUrls: MetadataRoute.Sitemap = bodyEntries
    .filter((e) => e.state.kind !== "none")
    .map((e) => {
      const state = e.state;
      return {
        url: `${appUrl}${e.path}`,
        lastModified: state.kind === "db" ? day(state.body.updated_at) : now,
        changeFrequency: "monthly" as const,
        priority: e.priority,
      };
    });

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

  // ── Cab route pages — the corridors hub plus one page per published
  // route. The routes list is small and admin-authored, so it is paged
  // through in one-shot 60s rather than a deep crawl.
  const routeRows: RouteRow[] = [];
  if (cabVisible) {
    for (let offset = 0; offset < 300; offset += 60) {
      const data = await fetchJson<{ items: RouteRow[] }>(
        `${API_BASE}/public/routes?limit=60&offset=${offset}`,
      );
      const items = data?.items ?? [];
      routeRows.push(...items);
      if (items.length < 60) break;
    }
  }
  const routeUrls: MetadataRoute.Sitemap = [
    ...(cabVisible
      ? [{ url: `${appUrl}/cabs/routes`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 }]
      : []),
    ...routeRows
      .filter((r) => r.slug)
      .map((r) => ({
        url: `${appUrl}/cabs/routes/${r.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
  ];

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
    ...bodyUrls,
    ...tripUrls,
    ...routeUrls,
    ...landingUrls,
    ...hotelUrls,
    ...tourUrls,
    ...blogUrls,
  ];
}
