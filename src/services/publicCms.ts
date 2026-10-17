/* ============================================================
   WayTero CMS — public homepage service
   Mirrors backend `GET /public/homepage` → `PublicHomepageOut`.
   No auth required. Endpoint is cacheable at the CDN edge.

   IMPORTANT:
   - NEXT_PUBLIC_API_URL must include /api/v1 (e.g. http://localhost:8000/api/v1)
   - Backend returns the payload RAW — no {success, data} envelope wrapper.
   ============================================================ */
import type { PublicHomepage } from "@/types/cms";
import { BRAND, BRAND_SOCIALS } from "@/lib/brand";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface PlatformProfile {
  logo_url: string;
  favicon_url: string;
  og_image_url: string;
  /** Admin Settings → Platform Details (SUPPORT_PHONE). Empty when unset. */
  support_phone: string;
  /** system_configurations.SUPPORT_EMAIL (brand-master fallback applied below). */
  support_email: string;
  /** system_configurations.OFFICE_ADDRESS, or the primary entry the admin
   *  saved under Settings → Platform when the single key is empty. */
  office_address: string;
  /** system_configurations.PLATFORM_OFFICE_HOURS — the desk hours printed on
   *  the CTA band, contact page and header. BRAND.officeHours when unset. */
  office_hours: string;
  /** system_configurations.PLATFORM_WHATSAPP_PHONE. Deliberately has no
   *  brand-master fallback: callers fall back to support_phone, because a
   *  WhatsApp link to a number the admin never entered is worse than none. */
  whatsapp_phone: string;
  /** system_configurations.PLATFORM_TAGLINE. */
  tagline: string;
  /** Official profile URLs from SOCIAL_* keys (brand-master fallback applied). */
  social_links: Record<string, string>;
}

export interface SiteSeoEntry {
  title: string;
  description: string;
}

export interface LegalSection {
  heading: string;
  body: string;
}

export interface PageFaqEntry {
  question: string;
  answer: string;
}

/**
 * A page body authored in Website → Pages and stored as JSON under
 * `LEGAL_PAGE_{SLUG}`. The namespace predates the editor and is really
 * "published page bodies" — booking-instructions, safety, support, careers
 * and press live in it too.
 */
export interface LegalPage {
  slug: string;
  title: string;
  eyebrow?: string;
  description?: string;
  effective_date?: string;
  updated_at?: string;
  /** Absent means published, so the rows seeded before the editor existed
   *  keep rendering. Website → Pages writes it explicitly. */
  is_published?: boolean;
  /** Optional FAQ for /safety and /support. An empty array omits the band. */
  faq?: PageFaqEntry[];
  sections: LegalSection[];
}

export interface LiveCancellationPolicy {
  cab: {
    free_hours: number;
    tier_1_hours: number;
    tier_1_percent: number;
    tier_2_hours: number;
    tier_2_percent: number;
    same_day_percent: number;
    after_assignment_percent: number;
  };
  tour: {
    free_days: number;
    tier_1_days: number;
    tier_1_percent: number;
    tier_2_days: number;
    tier_2_percent: number;
    tier_3_percent: number;
    last_minute_percent: number;
  };
  hotel: { note: string };
}

/** One hero-slider offer (migration 0077). Server-gated: only live,
 *  published offers with an active backing coupon are returned. */
export interface PublicOfferSlide {
  slug: string;
  title: string;
  service_type: "CAB" | "HOTEL" | "TOUR";
  image_url: string;
  coupon_code: string;
  badge: string;
  /** Admin-authored one-liner under the badge; may be null. */
  short_description: string | null;
  /** YYYY-MM-DD — end of the offer window. */
  valid_to: string;
}

/** Row counts for the homepage bands that fetch their own content. Mirrors
 *  `GET /public/homepage-band-counts`; a zero means the band renders nothing. */
export type HomepageBandCounts = Record<
  | "FEATURED_HOTELS"
  | "POPULAR_DESTINATIONS"
  | "POPULAR_ROUTES"
  | "POPULAR_CITIES"
  | "TOUR_PACKAGES"
  | "BLOG",
  number
>;

export const publicCmsService = {
  /**
   * Server-side helper: the admin-configured support phone
   * (Settings → Platform Details → SUPPORT_PHONE) with the site-wide
   * fallback applied. Used by server components (safety/support pages,
   * footer). ISR-cached via getPlatformProfile (5 min).
   */
  async getSupportPhone(): Promise<string> {
    const { displayPhone } = await import("@/lib/supportPhone");
    try {
      const profile = await this.getPlatformProfile();
      return displayPhone(profile.support_phone);
    } catch {
      return displayPhone("");
    }
  },

  /**
   * Fetch the public homepage payload (header + footer + ordered sections).
   * Returns `null` on failure so callers fall back to hardcoded defaults.
   */
  async getHomepage(): Promise<PublicHomepage | null> {
    try {
      const res = await fetch(`${BASE_URL}/public/homepage`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return null;

      // Backend returns raw PublicHomepageOut — NOT wrapped in {success, data}
      const json = (await res.json()) as PublicHomepage;
      if (!json || !json.header || !json.footer) return null;
      return json;
    } catch {
      return null;
    }
  },

  /**
   * How many rows each data-driven homepage band will actually find.
   * The homepage needs this before it renders, because the light bands
   * alternate white / off-white and an omitted band must not leave two of
   * the same tone side by side. Returns null if the API is unreachable —
   * the caller then falls back to the renderers' own literals.
   */
  async getHomepageBandCounts(): Promise<HomepageBandCounts | null> {
    try {
      const res = await fetch(`${BASE_URL}/public/homepage-band-counts`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return null;
      return (await res.json()) as HomepageBandCounts;
    } catch {
      return null;
    }
  },

  /**
   * Fetch the platform branding media (logo / favicon / OG image) uploaded
   * by the admin under Settings → Platform Profile. Mirrors backend
   * `GET /public/platform-profile`. Returns empty strings when nothing is
   * configured or the API is unreachable, so callers fall back to the
   * bundled static assets.
   */
  async getPlatformProfile(): Promise<PlatformProfile> {
    const fallback: PlatformProfile = {
      logo_url: "",
      favicon_url: "",
      og_image_url: "",
      support_phone: "",
      support_email: BRAND.email,
      office_address: BRAND.officeAddress,
      office_hours: BRAND.officeHours,
      whatsapp_phone: "",
      tagline: BRAND.tagline,
      social_links: BRAND_SOCIALS,
    };
    try {
      const res = await fetch(`${BASE_URL}/public/platform-profile`, {
        next: { revalidate: 300 }, // 5 min — admin uploads are rare
      });
      if (!res.ok) return fallback;
      const json = (await res.json()) as Partial<PlatformProfile>;
      const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
      const socials =
        json.social_links && typeof json.social_links === "object"
          ? Object.fromEntries(
              Object.entries(json.social_links).filter(
                ([, v]) => typeof v === "string" && v.trim() !== ""
              )
            )
          : {};
      return {
        logo_url: str(json.logo_url),
        favicon_url: str(json.favicon_url),
        og_image_url: str(json.og_image_url),
        support_phone: str(json.support_phone),
        support_email: str(json.support_email) || BRAND.email,
        office_address: str(json.office_address) || BRAND.officeAddress,
        office_hours: str(json.office_hours) || BRAND.officeHours,
        whatsapp_phone: str(json.whatsapp_phone),
        tagline: str(json.tagline) || BRAND.tagline,
        social_links: Object.keys(socials).length ? socials : BRAND_SOCIALS,
      };
    } catch {
      return fallback;
    }
  },

  /**
   * Per-page <head> metadata authored in system_configurations
   * (SEO_PAGE_* keys). Mirrors backend `GET /public/site-seo`.
   * Returns {} on failure — callers use their brand-master fallback.
   */
  async getSiteSeo(): Promise<Record<string, SiteSeoEntry>> {
    try {
      const res = await fetch(`${BASE_URL}/public/site-seo`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return {};
      const json = (await res.json()) as Record<string, SiteSeoEntry>;
      if (!json || typeof json !== "object") return {};
      return json;
    } catch {
      return {};
    }
  },

  /**
   * Fetch the promotion images for the login/auth modal (left-side slider).
   * Mirrors backend `GET /public/auth-modal-images` → { images: string[] }.
   * Returns an empty array when nothing is configured or on any error, so
   * the auth modal simply renders without the image panel.
   */
  /**
   * Fetch an authored page body. Returns null BOTH when the row does not
   * exist and when the API is unreachable, which is fine for a link check
   * and not fine for a page that must never go blank — pages use
   * `@/lib/pageBody`, which keeps those two states apart.
   */
  async getLegalPage(slug: string): Promise<LegalPage | null> {
    try {
      const res = await fetch(`${BASE_URL}/public/legal/${slug}`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as LegalPage;
      if (!json || !Array.isArray(json.sections)) return null;
      return json;
    } catch {
      return null;
    }
  },

  /**
   * Which page bodies actually exist in the database right now
   * (GET /public/legal lists every LEGAL_PAGE_* key). /sitemap and the XML
   * sitemap read it so a page with no authored body is not advertised.
   * Returns [] when the API is unreachable.
   */
  async listLegalSlugs(): Promise<string[]> {
    try {
      const res = await fetch(`${BASE_URL}/public/legal`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return [];
      const json = (await res.json()) as { slugs?: unknown };
      if (!Array.isArray(json?.slugs)) return [];
      return json.slugs.filter((s): s is string => typeof s === "string" && s.trim() !== "");
    } catch {
      return [];
    }
  },

  /**
   * Fetch the LIVE cancellation ladders (cab + tour) the engine actually
   * enforces, so the Refund Policy page always matches admin edits.
   * Returns null on failure — a ladder band then omits itself rather than
   * printing numbers the engine may not be using.
   */
  async getCancellationPolicy(): Promise<LiveCancellationPolicy | null> {
    try {
      const res = await fetch(`${BASE_URL}/public/cancellation-policy`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as LiveCancellationPolicy;
      if (!json || !json.cab || !json.tour) return null;
      return json;
    } catch {
      return null;
    }
  },

  /**
   * Live coupon-backed offers for the hero slider. Mirrors backend
   * `GET /public/offers` (raw array). Returns [] on failure so the hero
   * keeps its zero-offer design unchanged.
   */
  async getOffers(): Promise<PublicOfferSlide[]> {
    try {
      const res = await fetch(`${BASE_URL}/public/offers`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return [];
      const json = (await res.json()) as unknown;
      if (!Array.isArray(json)) return [];
      return json.filter(
        (o): o is PublicOfferSlide =>
          !!o && typeof (o as PublicOfferSlide).slug === "string",
      );
    } catch {
      return [];
    }
  },

  async getAuthModalImages(signal?: AbortSignal): Promise<string[]> {
    try {
      const res = await fetch(`${BASE_URL}/public/auth-modal-images`, { signal });
      if (!res.ok) return [];
      const json = (await res.json()) as { images?: unknown };
      if (!Array.isArray(json?.images)) return [];
      return json.images.filter((u): u is string => typeof u === "string" && u.trim() !== "");
    } catch {
      return [];
    }
  },
};

export default publicCmsService;
