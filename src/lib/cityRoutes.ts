// ============================================================
// cityRoutes — canonical, crawlable city URLs.
//
// City filters used to live in query strings (`/cabs/prices?city=…`,
// `/tours?city=…`, `/hotels/results?city=…`). Query parameters are fine for
// a user's search, but they are weak SEO URLs: no keyword in the path, easy
// to duplicate, and often noindexed as a search result. These helpers are
// the single spelling used by every internal link and the sitemap.
//
// Published editorial landing pages still win where they exist; these paths
// are the fallback that keeps a city link crawlable before an admin
// publishes its landing page.
// ============================================================

import { citySlug } from "./citySlug";
import type { LandingPageType, LandingRef } from "./landingIndex";

export function cabPricesPath(city: string | null | undefined): string {
  const slug = citySlug(city);
  return slug ? `/cabs/prices/${slug}` : "/cabs/prices";
}

export function hotelCityPath(city: string | null | undefined): string {
  const slug = citySlug(city);
  return slug ? `/hotels/in/${slug}` : "/hotels";
}

export function tourCityPath(city: string | null | undefined): string {
  const slug = citySlug(city);
  return slug ? `/tours/in/${slug}` : "/tours";
}

/** The published landing page for a city + vertical, if one exists. */
export function cityLanding(
  refs: readonly LandingRef[],
  pageType: LandingPageType,
  city: string | null | undefined,
): LandingRef | undefined {
  const key = citySlug(city);
  if (!key) return undefined;
  return refs.find(
    (r) =>
      r.page_type === pageType &&
      r.scope.kind === "city" &&
      citySlug(r.scope.display_name) === key,
  );
}

/** Landing page when published, otherwise the deterministic fallback path. */
export function cityLandingHref(
  refs: readonly LandingRef[],
  pageType: LandingPageType,
  city: string | null | undefined,
  fallback: string,
): string {
  return cityLanding(refs, pageType, city)?.canonical_path ?? fallback;
}
