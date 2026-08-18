/* ============================================================
   WayTero CMS — public homepage service
   Mirrors backend `GET /public/homepage` → `PublicHomepageOut`.
   No auth required. Endpoint is cacheable at the CDN edge.

   IMPORTANT:
   - NEXT_PUBLIC_API_URL must include /api/v1 (e.g. http://localhost:8000/api/v1)
   - Backend returns the payload RAW — no {success, data} envelope wrapper.
   ============================================================ */
import type { PublicHomepage } from "@/types/cms";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface PlatformProfile {
  logo_url: string;
  favicon_url: string;
  og_image_url: string;
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
    const empty: PlatformProfile = { logo_url: "", favicon_url: "", og_image_url: "" };
    try {
      const res = await fetch(`${BASE_URL}/public/platform-profile`, {
        next: { revalidate: 300 }, // 5 min — admin uploads are rare
      });
      if (!res.ok) return empty;
      const json = (await res.json()) as Partial<PlatformProfile>;
      return {
        logo_url: typeof json.logo_url === "string" ? json.logo_url : "",
        favicon_url: typeof json.favicon_url === "string" ? json.favicon_url : "",
        og_image_url: typeof json.og_image_url === "string" ? json.og_image_url : "",
      };
    } catch {
      return empty;
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
