/**
 * Public homepage payload — mirrors `PublicHomepageOut` from the backend CMS.
 * Variant shape is intentionally loose (Record<string, unknown>) so the
 * front-end can tolerate CMS additions without redeploying.
 */
export type ServiceType = "CAB" | "HOTEL" | "TOUR";

export type SectionKey =
  | "HERO"
  | "SERVICES"
  | "WHY_US"
  | "TOUR_PACKAGES"
  | "TESTIMONIALS"
  | "STATS"
  | "PARTNERS"
  | "CTA"
  | "POPULAR_DESTINATIONS"
  | "FEATURED_HOTELS"
  | "HOW_IT_WORKS"
  | "OFFERS"
  | "FAQ"
  | "NEWSLETTER"
  | "APP_DOWNLOAD"
  | "BLOG";

export interface HomepageSection {
  id: number;
  section_key: SectionKey;
  display_order: number;
  is_active: boolean;
  service_type: ServiceType | null;
  variant: Record<string, unknown>;
}

/** Mirrors backend SiteHeaderOut */
export interface SiteHeaderData {
  id: number;
  logo_url: string | null;
  logo_alt_text: string | null;
  tagline: string | null;
  show_search_bar: boolean;
  show_login_button: boolean;
  cta_text: string | null;
  cta_link: string | null;
  support_phone: string | null;
  contact_email: string | null;
  nav_links: Array<{ label: string; href: string; icon?: string }>;
  social_links: Record<string, string>;
  background_color: string | null;
  text_color: string | null;
  is_active: boolean;
  updated_at: string;
}

/** Mirrors backend SiteFooterOut */
export interface SiteFooterData {
  id: number;
  logo_url: string | null;
  description: string | null;
  copyright_text: string | null;
  company_address: string | null;
  support_phone: string | null;
  contact_email: string | null;
  quick_links: Array<{ label: string; href: string }>;
  legal_links: Array<{ label: string; href: string }>;
  social_links: Record<string, string>;
  payment_icons: Array<{ label: string; image_url: string }>;
  app_store_links: { android?: string; ios?: string };
  background_color: string | null;
  text_color: string | null;
  is_active: boolean;
  updated_at: string;
}

/** Legacy shape kept for backward compat with old homepage renderers */
export interface HomepageHeader {
  brand_name: string;
  tagline: string;
  logo_url: string | null;
  announcement: string | null;
  nav_links: Array<{ label: string; href: string }>;
}

export interface HomepageFooter {
  columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
  social_links: Array<{ platform: string; href: string }>;
  copyright: string;
}

export interface PublicHomepage {
  header: SiteHeaderData;
  footer: SiteFooterData;
  sections: HomepageSection[];
}

/* ── Helper: safely pluck a typed value from a loose variant. ─── */
export function pick<T>(variant: Record<string, unknown>, key: string, fallback: T): T {
  const v = variant?.[key];
  return (v === undefined || v === null ? fallback : (v as T));
}
