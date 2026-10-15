// ============================================================
// WAYTERO — BRAND MASTER (owner-approved, 2026-10-15)
//
// Single source of FALLBACK brand facts. The database is the primary
// source: system_configurations (SUPPORT_PHONE, SUPPORT_EMAIL,
// OFFICE_ADDRESS, PLATFORM_TAGLINE, SOCIAL_*, SEO_PAGE_*) is exposed via
// GET /public/platform-profile and GET /public/site-seo, and the CMS
// header/footer singletons feed /public/homepage. These constants are
// only used when a DB value is empty or the API is unreachable — they
// are the owner-supplied facts (WAYTERO-PROJECT-MASTER), not demo data.
// Never add invented stats, testimonials or unverified claims here.
// ============================================================

export const BRAND = {
  name: "WayTero",
  tagline: "Explore More. Travel Better.",
  website: "waytero.com",
  phone: "7978322649",
  email: "support@waytero.com",
  officeAddress: "Avinue Appartment, Gothapatana, Bhubaneswar - 751003",
} as const;

/** Official social profiles — exactly the ones the owner confirmed. */
export const BRAND_SOCIALS: Record<string, string> = {
  youtube: "https://www.youtube.com/@WayTero",
  instagram: "https://www.instagram.com/waytero.official/",
  facebook: "https://www.facebook.com/WayTero",
};

/** wa.me link for the owner-approved phone (fallback when DB empty). */
export function waHref(phoneDigits: string | null | undefined): string {
  const digits = (phoneDigits ?? "").replace(/\D/g, "") || BRAND.phone;
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}
