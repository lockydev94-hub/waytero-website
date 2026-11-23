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

import { publicCmsService } from "@/services/publicCms";
import { BRAND } from "@/lib/brand";

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
    // The homepage targets the ONE thing the business can deliver: cabs in
    // Bhubaneswar. The tagline stays as the brand line in the header, not as
    // the <title> — "Explore More. Travel Better." ranks for nothing.
    title: "Cab & Tour Booking in Bhubaneswar",
    description:
      "Book local, airport and outstation cabs in Bhubaneswar with upfront fares, verified drivers and a local support desk. Odisha tours and hotels on one platform.",
    keywords: [
      "cab booking Bhubaneswar",
      "Bhubaneswar taxi service",
      "airport cab Bhubaneswar",
      "outstation cab Bhubaneswar",
      "Odisha tour packages",
    ],
  },
  CAB: {
    title: "Cab Booking in Bhubaneswar",
    description:
      "Book local, airport and outstation cabs in Bhubaneswar with upfront fares, verified drivers and driver details on every assigned trip, day or night.",
    keywords: [
      "cab booking Bhubaneswar",
      "Bhubaneswar taxi",
      "airport cab Bhubaneswar",
      "outstation cab Bhubaneswar",
      "local cab Bhubaneswar",
      "rent a car with driver Bhubaneswar",
    ],
  },
  HOTEL: {
    title: "Hotels in Bhubaneswar & Odisha",
    description:
      "Book verified hotels, resorts and homestays in Bhubaneswar and across Odisha, with transparent pricing and free cancellation.",
    keywords: [
      "hotels in Bhubaneswar",
      "hotel booking Odisha",
      "resorts in Odisha",
      "homestays Bhubaneswar",
      "budget hotels Bhubaneswar",
    ],
  },
  TOUR: {
    title: "Tour Packages in Odisha",
    description:
      "Odisha tour packages with real itineraries and pricing — Puri and Konark temple circuits, Chilika, Bhitarkanika and the tribal belt, departing from Bhubaneswar.",
    keywords: [
      "Odisha tour packages",
      "Bhubaneswar tour packages",
      "Puri Konark tour",
      "Chilika tour package",
      "Odisha holiday packages",
    ],
  },
  blog: {
    title: "Odisha Travel Blog — Guides & Itineraries",
    description:
      "Odisha travel guides from the WayTero team — Puri darshan, Konark, Chilika, Bhitarkanika and Bhubaneswar, with routes, seasons, budgets and practical tips.",
    keywords: [
      "Odisha travel blog",
      "Bhubaneswar travel guide",
      "Puri travel tips",
      "Odisha itinerary",
    ],
  },
};

/* ── Fetch service-type SEO from the backend (cacheable) ───────────────── */

export async function getServiceTypeSeo(): Promise<
  Record<string, ServiceTypeSeo>
> {
  try {
    const res = await fetch(`${BASE_URL}/public/service-types`, {
      next: { revalidate: 300 }, // 5 min — admin edits are rare
    });
    if (!res.ok) return {};
    const list = (await res.json()) as ServiceTypeSeo[];
    const byCode: Record<string, ServiceTypeSeo> = {};
    for (const st of list) byCode[st.type_code] = st;
    return byCode;
  } catch {
    return {};
  }
}

/* ── Build a Next.js Metadata object from resolved SEO ─────────────────── */

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://waytero.com";
}

/** Absolute URL for JSON-LD and canonical fields. Schema.org consumers do not
 *  resolve relative image URLs the way Next's metadataBase does, so every
 *  image that enters structured data must pass through here. */
export function absoluteUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value, appUrl()).toString();
  } catch {
    return undefined;
  }
}

/** The site-wide social image, guaranteed absolute. Use this when a page or
 *  entity has no image of its own — Google's Product/Merchant listings mark
 *  an absent image as a critical error, not an optional field. */
export function absoluteImage(
  value?: string | null,
  fallback = "/og-image.png",
): string {
  return absoluteUrl(value) ?? absoluteUrl(fallback) ?? `${appUrl()}${fallback}`;
}

export function toMetadata(
  seo: SeoContent,
  path: string,
  extra?: Partial<import("next").Metadata>,
): import("next").Metadata {
  const canonical = `${appUrl()}${path === "/" ? "" : path}`;
  const { alternates: extraAlternates, ...rest } = extra ?? {};
  // Always emit an image. A page-level `openGraph` object replaces the root
  // layout's outright, so a page that had no photo of its own shipped with no
  // og:image at all — 25 of 94 URLs were in that state, and a shared link to
  // any of them rendered bare. Fall back to the site-wide card instead.
  const socialImage = absoluteImage(seo.image);
  return {
    title: normalizeTitle(seo.title),
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical,
      languages: { "en-in": canonical, en: canonical, "x-default": canonical },
      ...(extraAlternates as object | undefined),
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: canonical,
      siteName: "WayTero",
      title: seo.title,
      description: seo.description,
      images: [{ url: socialImage, width: 1200, height: 630, alt: seo.title }],
      ...(extra?.openGraph as object | undefined),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [socialImage],
      ...(extra?.twitter as object | undefined),
    },
    ...rest,
  } as import("next").Metadata;
}

/* ── Resolve a page's SEO: DB first, static fallback ───────────────────── */

// The root layout applies a "%s | WayTero" title template, so DB-provided
// titles that already carry a "— WayTero"/"| WayTero" suffix would render
// doubled ("… | WayTero | WayTero"). Strip any trailing brand suffix here
// so the template appends exactly one.
function normalizeTitle(raw: string): string {
  return raw.replace(/\s*(?:[-–—|·:]\s*)?WayTero\s*$/i, "").trim();
}

/* ── Static-page <head> metadata from system_configurations ────────────── */

export interface SiteSeoRow {
  title?: string;
  description?: string;
}

export async function getSiteSeoMap(): Promise<Record<string, SiteSeoRow>> {
  return publicCmsService.getSiteSeo();
}

/** DB-first metadata for a static page: SEO_PAGE_<KEY> row, else fallback. */
export async function pageMetadata(
  key: string,
  path: string,
  fallback: SeoContent,
): Promise<import("next").Metadata> {
  const [pages, profile] = await Promise.all([
    getSiteSeoMap(),
    publicCmsService.getPlatformProfile(),
  ]);
  const db = pages[key.replace(/-/g, "_")];
  return toMetadata(
    {
      title: db?.title?.trim() || fallback.title,
      description: db?.description?.trim() || fallback.description,
      keywords: fallback.keywords,
      image: fallback.image || profile.og_image_url || "/og-image.png",
    },
    path,
  );
}

export async function resolveSeo(
  page: "home" | "CAB" | "HOTEL" | "TOUR" | "blog",
  overrides?: Partial<SeoContent>,
): Promise<SeoContent> {
  const fallback = STATIC_SEO[page] ?? STATIC_SEO.home;
  const [services, pages, profile] = await Promise.all([
    getServiceTypeSeo(),
    getSiteSeoMap(),
    publicCmsService.getPlatformProfile(),
  ]);
  const db = services[page];
  const pageSeo = pages[page.toLowerCase()];

  const title = normalizeTitle(
    overrides?.title?.trim() ||
    pageSeo?.title?.trim() ||
    db?.seo_title?.trim() ||
    fallback.title,
  );
  const description =
    overrides?.description?.trim() ||
    pageSeo?.description?.trim() ||
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
    image: overrides?.image || db?.image_url || profile.og_image_url || "/og-image.png",
  };
}
