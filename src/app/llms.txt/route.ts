import { NextResponse } from "next/server";
import { getLandingRefs, type LandingPageType } from "@/lib/landingIndex";
import { getAvailability, serviceVisible } from "@/lib/availability";

// ── llms.txt (https://llmstxt.org) — AI-crawler companion to robots.txt/sitemap.
//    Static map of the site + live DB-driven key pages, served at /llms.txt. ──
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";

const LANDING_LABEL: Record<LandingPageType, string> = {
  CITY_HUB: "all services",
  CITY_CABS: "cab booking",
  CITY_HOTELS: "hotel booking",
  CITY_TOURS: "tour packages",
  STATE_HOTELS: "hotel booking",
  STATE_TOURS: "tour packages",
  PLACE_CABS: "airport & station cabs",
};

export const revalidate = 3600;

async function fetchJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: unknown };
    return json?.success ? json.data : json;
  } catch {
    return null;
  }
}

// best-effort array extraction across envelope/raw + list/paged shapes
function asRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const k of ["items", "data", "results", "packages", "posts"]) {
      if (Array.isArray(o[k])) return o[k] as Record<string, unknown>[];
    }
  }
  return [];
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function GET() {
  // Hidden verticals (disabled or zero supply) 404 site-wide — llms.txt
  // must describe the site as it actually serves, not as it once did.
  const av = await getAvailability();
  const cabVisible = serviceVisible(av, "CAB");
  const hotelVisible = serviceVisible(av, "HOTEL");
  const tourVisible = serviceVisible(av, "TOUR");

  const [tours, hotels, blogs] = await Promise.all([
    tourVisible
      ? fetchJson(`${API}/public/tours/packages?page=1&page_size=20`)
      : Promise.resolve(null),
    hotelVisible
      ? fetchJson(`${API}/public/hotel/search?page=1&page_size=20`)
      : Promise.resolve(null),
    fetchJson(`${API}/public/blog?per_page=20`),
  ]);

  const lines: string[] = [
    `# WayTero`,
    ``,
    `> WayTero is an India travel operating system: one platform to book outstation and local cabs,`,
    `> airport transfers, hotels, and partner-operated tour packages, with verified drivers,`,
    `> transparent GST-inclusive pricing, and wallet/settlement support for partners.`,
    `> Company: WayTero (Bhubaneswar, Odisha, India). Language: en-IN. Currency: INR.`,
    ``,
    `## Key pages`,
    `- [Home](${SITE}/): overview of all services`,
    ...(cabVisible
      ? [`- [Book a Cab](${SITE}/cabs): cab booking with fare estimates by trip type (outstation, local, airport)`]
      : []),
    ...(hotelVisible
      ? [`- [Hotels](${SITE}/hotels): hotel search in the cities WayTero serves`]
      : []),
    ...(tourVisible
      ? [`- [Tour Packages](${SITE}/tours): curated multi-day tour packages`]
      : []),
    `- [Blog](${SITE}/blog): India travel guides and tips`,
    `- [Become a Partner](${SITE}/partner): register as driver/hotel/tour partner`,
    `- [Track Booking](${SITE}/track): live booking status`,
    `- [Sitemap XML](${SITE}/sitemap.xml) | [RSS feed](${SITE}/feed) | [robots.txt](${SITE}/robots.txt)`,
  ];

  const tourRows = asRows(tours);
  if (tourRows.length) {
    lines.push(``, `## Tour packages`);
    for (const t of tourRows.slice(0, 15)) {
      const slug = str(t.slug) || str(t.package_code);
      const name = str(t.package_name) || str(t.title);
      if (slug && name) lines.push(`- [${name}](${SITE}/tours/${slug}): ${str(t.short_description).slice(0, 140)}`);
    }
  }

  const hotelRows = asRows(hotels);
  if (hotelRows.length) {
    lines.push(``, `## Hotels`);
    for (const h of hotelRows.slice(0, 15)) {
      const slug = str(h.slug);
      const name = str(h.hotel_name) || str(h.name);
      if (slug && name) lines.push(`- [${name}](${SITE}/hotels/${slug}): ${str(h.city_name ?? h.location ?? "").slice(0, 80)}`);
    }
  }

  const blogRows = asRows(blogs);
  if (blogRows.length) {
    lines.push(``, `## Latest blog posts`);
    for (const b of blogRows.slice(0, 15)) {
      const slug = str(b.slug);
      const title = str(b.title);
      if (slug && title) lines.push(`- [${title}](${SITE}/blog/${slug}): ${str(b.excerpt).slice(0, 140)}`);
    }
  }

  // City/state/place landing pages — real links, not a prose city list. The
  // refs endpoint only returns published, in-window rows, so this never
  // advertises a 404 (the old /destinations advert did).
  const landingRefs = await getLandingRefs();
  const visibleRefs = landingRefs.filter((r) =>
    r.page_type === "PLACE_CABS"
      ? cabVisible
      : r.service_type === "CAB"
        ? cabVisible
        : r.service_type === "HOTEL"
          ? hotelVisible
          : r.service_type === "TOUR"
            ? tourVisible
            : true,
  );
  if (visibleRefs.length) {
    lines.push(``, `## City, service & place pages`);
    for (const r of visibleRefs.slice(0, 60)) {
      lines.push(
        `- [${r.scope.display_name} — ${LANDING_LABEL[r.page_type] ?? r.page_type}](${SITE}${r.canonical_path})`,
      );
    }
  }

  lines.push(
    ``,
    `## Conventions`,
    `- All prices are in INR and GST-inclusive where applicable.`,
    `- Canonical URLs: ${SITE}/<path> (no trailing slash).`,
    `- Content is published for the India market (en-IN).`,
    ``,
  );

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
