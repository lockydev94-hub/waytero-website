// ============================================================
// Landing-page index — the single source the [slug] engine,
// sitemap and llms.txt all read from, so a published page appears
// in the same places for crawlers as it does for visitors.
// Mirrors Backend/app/modules/admin/constants/landing_pages.py
// (RESERVED_LANDING_SLUGS / PREFIXES) — keep both lists in step.
// File: src/lib/landingIndex.ts
// ============================================================

import { cache } from "react";
import { API_BASE } from "./apiBase";
import { appUrl } from "@/services/seoService";

export type LandingPageType =
  | "CITY_HUB"
  | "CITY_CABS"
  | "CITY_HOTELS"
  | "CITY_TOURS"
  | "STATE_HOTELS"
  | "STATE_TOURS"
  | "PLACE_CABS";

export type LandingImageSource = "admin" | "curated" | "gradient";

export type LandingBlockType =
  | "prose"
  | "highlights"
  | "stats"
  | "gallery"
  | "faq"
  | "fare_matrix"
  | "vehicle_grid"
  | "hotel_grid"
  | "tour_grid"
  | "steps"
  | "cta_band"
  | "internal_links";

export interface LandingBlock {
  type: LandingBlockType;
  title?: string | null;
  limit?: number;
  body?: string;
}

export interface LandingRef {
  slug: string;
  page_type: LandingPageType;
  service_type: string | null;
  scope: { kind: "city" | "state" | "place"; display_name: string; city_name?: string | null };
  canonical_path: string;
  updated_at: string | null;
}

export interface LandingHero {
  eyebrow: string | null;
  headline: string;
  subheadline: string | null;
  body_text: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
  video_url: string | null;
  alt_text: string | null;
  overlay_opacity: number;
  image_source: LandingImageSource;
}

export interface LandingStat {
  value: number | string;
  suffix?: string;
  label: string;
}

export interface LandingHighlight {
  title: string;
  text?: string | null;
  icon_url?: string | null;
}

export interface LandingGalleryTile {
  image_url: string;
  alt_text?: string | null;
  caption?: string | null;
}

export interface LandingFaq {
  question: string;
  answer: string;
}

export interface LandingHotel {
  id: number;
  slug: string | null;
  hotel_name: string;
  star_rating: number | null;
  city_name: string;
  starting_price: number;
  primary_image_url: string | null;
  average_rating: number;
  total_reviews: number;
  is_featured: boolean;
}

export interface LandingTour {
  id: number;
  slug: string | null;
  package_name: string;
  destination: string | null;
  city_name: string;
  duration_days: number | null;
  duration_nights: number | null;
  short_description: string | null;
  primary_image_url: string | null;
  starting_price: number | null;
}

export interface LandingVehicle {
  id: number;
  category_name: string;
  seating_capacity: number | null;
  luggage_capacity: number | null;
  image_url: string | null;
  icon_url: string | null;
}

export interface LandingFareRow {
  vehicle_category_id: number;
  vehicle_category: string;
  seats: number | null;
  luggage: number | null;
  image_url: string | null;
  icon_url: string | null;
  trip_type: string;
  base_fare: number;
  per_km_rate: number;
  minimum_km: number;
  sample_distance_km: number;
  estimated_total: number;
  source: "city_specific" | "default";
}

export interface LandingPrices {
  hotel_from: number | null;
  tour_from: number | null;
  cab_from: number | null;
  hotel_count: number | null;
  tour_count: number | null;
  vehicle_count: number | null;
  avg_hotel_rating: number | null;
  currency: string;
}

export interface LandingLink {
  slug: string;
  page_type?: LandingPageType;
  label: string;
  href: string;
  relation?: string;
}

export interface LandingBundle {
  slug: string;
  page_type: LandingPageType;
  service_type: string | null;
  scope: {
    kind: "city" | "state" | "place";
    id: number;
    name: string;
    display_name: string;
    state_id: number | null;
    state_name: string | null;
    latitude?: number | null;
    longitude?: number | null;
    // Place pages (PLACE_CABS): the place itself plus the city its fares
    // resolve through — a place page is always scoped to one city.
    place?: { id: number; name: string; code: string | null; kind: string } | null;
    city_id?: number | null;
    city_name?: string | null;
  };
  hero: LandingHero;
  blocks: LandingBlock[];
  highlights: LandingHighlight[];
  gallery: LandingGalleryTile[];
  faqs: LandingFaq[];
  stats: LandingStat[];
  cta: { text: string | null; link: string | null; text2: string | null; link2: string | null };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    canonical_path: string;
    og_image_url: string | null;
  };
  prices: LandingPrices;
  cab_fares: LandingFareRow[];
  gst: { enabled: boolean; rate_pct: number };
  hotels: LandingHotel[];
  tours: LandingTour[];
  vehicles: LandingVehicle[];
  siblings: LandingLink[];
  nearby: LandingLink[];
  meta: {
    updated_at: string | null;
    revalidate: number;
    image_source: LandingImageSource;
    sample_distance_km: number;
  };
}

const RESERVED_LANDING_SLUGS = new Set([
  "about",
  "account-deletion",
  "booking-instructions",
  "bookings",
  "careers",
  "contact",
  "cookies",
  "forgot-password",
  "login",
  "partner",
  "press",
  "privacy",
  "profile",
  "refund",
  "register",
  "safety",
  "security",
  "support",
  "terms",
  "track",
  "wallet",
  "sitemap",
  "blog",
  "cabs",
  "hotels",
  "tours",
  "destinations",
  "api",
  "admin",
  "auth",
  "health",
  "docs",
  "redocs",
  "openapi.json",
  "robots.txt",
  "llms.txt",
  "sitemap.xml",
  "favicon.ico",
  "feed",
  "rss.xml",
  "_next",
  "static",
  "assets",
  "images",
]);

const RESERVED_LANDING_PREFIXES = new Set([
  "blog",
  "cabs",
  "hotels",
  "tours",
  "destinations",
  "api",
  "admin",
  "_next",
]);

/** True when a slug would collide with a real website route. */
export function isReservedLandingSlug(slug: string): boolean {
  const value = (slug || "").trim().toLowerCase();
  if (!value) return false;
  if (RESERVED_LANDING_SLUGS.has(value)) return true;
  return RESERVED_LANDING_PREFIXES.has(value.split("-", 1)[0]);
}

/** Shape every landing URL must have before a fetch is even attempted. */
export function isSafeLandingSlug(slug: string): boolean {
  return /^[a-z0-9-]{1,100}$/.test(slug) && !slug.includes("--");
}

export function landingUrl(slug: string): string {
  return `${appUrl()}/${slug}`;
}

/**
 * Slim refs for every published landing page. Cached per request so the
 * engine, sitemap and llms.txt share one lookup; silent [] on failure —
 * crawl surfaces omit these pages rather than 500.
 */
export const getLandingRefs = cache(async (): Promise<LandingRef[]> => {
  try {
    const res = await fetch(`${API_BASE}/public/landing-pages`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as LandingRef[];
    return Array.isArray(rows) ? rows.filter((r) => r && r.slug) : [];
  } catch {
    return [];
  }
});

/**
 * Full page bundle, or null when unpublished/unknown. React.cache dedupes
 * generateMetadata + body into one fetch per render.
 */
export const getLandingBundle = cache(async (slug: string): Promise<LandingBundle | null> => {
  try {
    const res = await fetch(`${API_BASE}/public/landing-pages/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as LandingBundle;
  } catch {
    return null;
  }
});
