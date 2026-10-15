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
  /** system_configurations.OFFICE_ADDRESS. */
  office_address: string;
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

export interface LegalPage {
  slug: string;
  title: string;
  eyebrow?: string;
  description?: string;
  effective_date?: string;
  updated_at?: string;
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
   * Fetch a seeded legal page (privacy / terms / refund / cookies /
   * booking-instructions). Returns null on failure so callers fall back
   * to the bundled static content.
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
   * Fetch the LIVE cancellation ladders (cab + tour) the engine actually
   * enforces, so the Refund Policy page always matches admin edits.
   * Returns null on failure — callers fall back to the BRD defaults.
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
