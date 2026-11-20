// ============================================================
// citySlug — one canonical spelling for city names in public URLs.
//
// Public city pages use `/hotels/in/bhubaneswar` and
// `/cabs/prices/bhubaneswar` instead of `?city_id=5`: a path with the city
// name is readable, shareable and indexable, while the numeric id stays an
// internal API detail. Interactive search results still use `?city=` for
// their filter state, but their links are not the canonical city URLs.
//
// Must stay stable: renaming a slug breaks any shared link. Only
// ASCII letters/digits and single hyphens survive.
// ============================================================

export function citySlug(name: string | null | undefined): string {
  return (name ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Resolve a `?city=` slug back to its row from a public city feed. */
export function findCityBySlug<T extends { name: string }>(
  cities: readonly T[],
  slug: string | null | undefined,
): T | undefined {
  const target = (slug ?? "").trim().toLowerCase();
  if (!target) return undefined;
  return cities.find((c) => citySlug(c.name) === target);
}
