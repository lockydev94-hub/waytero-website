/* ============================================================
   WayTero — public SEO metadata service
   Mirrors backend `GET /public/service-types` → ServiceTypeSeoOut.

   Every page on the marketing site renders its <title>/description/
   keywords from the DATABASE when the admin has filled them in
   (Settings → Service Types, or per-hotel / per-blog SEO tabs),
   and falls back to the static defaults below when the DB value is
   null/empty or the backend is unreachable.

   Doc Ref: DB Schema Part 2 §8 — service_types (migration 0019)
   ============================================================ */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface ServiceTypeSeo {
  type_code: string; // CAB | HOTEL | TOUR
  label: string;
  description?: string | null;
  icon_url?: string | null;
  image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
}

export interface SeoContent {
  title: string;
  description: string;
  keywords: string[];
  image?: string | null;
}

/* ── Static fallbacks (used when DB has no value / API is down) ────────── */

export const STATIC_SEO: Record<string, SeoContent> = {
  home: {
    title: "WayTero — India's Travel Operating System",
    description:
      "Book cabs, hotels, and tour packages across India. WayTero connects customers, partners, drivers, and hotels on one seamless travel platform.",
    keywords: [
      "travel booking India",
      "cab booking",
      "hotel booking",
      "tour packages",
      "WayTero",
    ],
  },
  CAB: {
    title: "Book a Cab — Outstation & Local Rides",
    description:
      "Book reliable outstation cabs, airport transfers, and local rides across India. Transparent pricing, verified drivers, real-time tracking.",
    keywords: [
      "cab booking India",
      "outstation cab",
      "airport taxi",
      "local taxi",
      "rent a car with driver",
    ],
  },
  HOTEL: {
    title: "Hotels — Stay Anywhere in India",
    description:
      "Book budget to luxury hotels, resorts, and homestays across India with transparent pricing and free cancellation.",
    keywords: [
      "hotel booking India",
      "resorts",
      "homestays",
      "budget hotels",
      "luxury hotels",
    ],
  },
  TOUR: {
    title: "Tour Packages — Explore India",
    description:
      "Handpicked tour packages with verified operators — from weekend getaways to temple circuits and Himalayan treks. Fully managed from booking to return.",
    keywords: [
      "tour packages India",
      "holiday packages",
      "temples and heritage",
      "beaches and nature",
      "custom itineraries",
    ],
  },
  blog: {
    title: "Travel Blog — Stories & Tips for Indian Travelers",
    description:
      "Routes, stays, refund hacks, and behind-the-scenes from the WayTero team — written for how India actually travels.",
    keywords: [
      "travel blog India",
      "travel tips",
      "road trip ideas",
      "hotel stay guides",
    ],
  },
};

/* ── Fetch service-type SEO from the backend (cacheable) ───────────────── */

let cached: Record<string, ServiceTypeSeo> | null = null;

export async function getServiceTypeSeo(): Promise<
  Record<string, ServiceTypeSeo>
> {
  if (cached) return cached;
  try {
    const res = await fetch(`${BASE_URL}/public/service-types`, {
      next: { revalidate: 300 }, // 5 min — admin edits are rare
    });
    if (!res.ok) return {};
    const list = (await res.json()) as ServiceTypeSeo[];
    const byCode: Record<string, ServiceTypeSeo> = {};
    for (const st of list) byCode[st.type_code] = st;
    cached = byCode;
    return byCode;
  } catch {
    return {};
  }
}

/* ── Build a Next.js Metadata object from resolved SEO ─────────────────── */

export function toMetadata(
  seo: SeoContent,
  path: string,
  extra?: Partial<import("next").Metadata>,
): import("next").Metadata {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://waytero.com";
  const canonical = `${appUrl}${path === "/" ? "" : path}`;
  return {
    title: normalizeTitle(seo.title),
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: canonical,
      siteName: "WayTero",
      title: seo.title,
      description: seo.description,
      ...(seo.image ? { images: [{ url: seo.image }] } : {}),
      ...(extra?.openGraph as object | undefined),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      ...(seo.image ? { images: [seo.image] } : {}),
      ...(extra?.twitter as object | undefined),
    },
    ...extra,
  } as import("next").Metadata;
}

/* ── Resolve a page's SEO: DB first, static fallback ───────────────────── */

// The root layout applies a "%s | WayTero" title template, so DB-provided
// titles that already carry a "| WayTero" suffix would render doubled
// ("… | WayTero | WayTero"). Strip any trailing brand suffix here so the
// template appends exactly one.
function normalizeTitle(raw: string): string {
  return raw.replace(/\s*\|\s*WayTero\s*$/i, "").trim();
}

export async function resolveSeo(
  page: "home" | "CAB" | "HOTEL" | "TOUR" | "blog",
  overrides?: Partial<SeoContent>,
): Promise<SeoContent> {
  const fallback = STATIC_SEO[page] ?? STATIC_SEO.home;
  const db = (await getServiceTypeSeo())[page];

  const title = normalizeTitle(
    overrides?.title?.trim() ||
    db?.seo_title?.trim() ||
    fallback.title,
  );
  const description =
    overrides?.description?.trim() ||
    db?.seo_description?.trim() ||
    fallback.description;
  const keywords = [
    ...(overrides?.keywords ?? []),
    ...(db?.seo_keywords
      ? db.seo_keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : []),
    ...(db?.label ? [db.label] : []),
    ...(fallback.keywords ?? []),
  ].filter((k, i, arr) => k && arr.indexOf(k) === i);

  return {
    title,
    description,
    keywords,
    image: overrides?.image ?? db?.image_url ?? null,
  };
}
