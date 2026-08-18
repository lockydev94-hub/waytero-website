import apiClient from "@/lib/api";

export interface PublicTourPackage {
  id: number; slug: string; package_code: string; package_name: string; package_type: string; destination: string; city_id: number; city_name?: string;
  duration_days: number; duration_nights: number; minimum_persons: number; maximum_persons?: number | null; short_description?: string | null; description?: string | null;
  terms_and_conditions?: string | null; status: string; partner_name?: string | null; primary_image_url?: string | null; starting_price?: number;
  itinerary: Array<{ day_number: number; title: string; description?: string | null; activities: string[] }>;
  inclusions: Array<{ text: string }>; exclusions: Array<{ text: string }>;
  pricing: Array<{ persons_count: number; package_price: number }>;
  media: Array<{ media_url: string; is_primary: boolean; caption?: string | null }>;
}

export interface PublicTourCity {
  id: number; name: string; state_name?: string; country_name?: string;
}

export interface PublicTourDestination {
  city_id: number; city_name: string; state_name?: string; package_count: number;
  hero_image_url?: string | null; starting_price?: number;
}

/** Lightweight row returned by the hero autocomplete feed. */
export interface PublicTourSuggestion {
  id: number;
  slug: string;
  package_name: string;
  destination: string;
  city_name?: string;
  duration_days: number;
  duration_nights: number;
  starting_price: number;
  primary_image_url?: string | null;
}

export const tourService = {
  /**
   * Basic search. Returns the first page of results based on simple filters.
   * The admin customer-care page also uses this via the public endpoint.
   */
  search: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<{ items: PublicTourPackage[]; total: number; page: number; page_size: number }>(
      "/public/tours/packages",
      { params }
    ).then(r => r.data),

  /**
   * Advanced search with sort, price, and pagination controls.
   * Backed by /public/tours/packages which now supports page/page_size/sort.
   */
  searchAll: (params?: {
    destination?: string;
    city_id?: number;
    duration?: string;
    persons?: number;
    package_type?: string;
    min_price?: number;
    max_price?: number;
    sort?: "recommended" | "price_asc" | "price_desc" | "newest";
    page?: number;
    page_size?: number;
  }) => {
    const out: Record<string, string | number> = {};
    if (params?.destination) out.destination = params.destination;
    if (params?.city_id) out.city_id = params.city_id;
    if (params?.duration) out.duration = params.duration;
    if (params?.persons) out.persons = params.persons;
    if (params?.package_type) out.package_type = params.package_type;
    if (params?.min_price !== undefined) out.min_price = params.min_price;
    if (params?.max_price !== undefined) out.max_price = params.max_price;
    if (params?.sort) out.sort = params.sort;
    if (params?.page) out.page = params.page;
    if (params?.page_size) out.page_size = params.page_size;
    return apiClient.get<{ items: PublicTourPackage[]; total: number; page: number; page_size: number }>(
      "/public/tours/packages",
      { params: out }
    ).then(r => r.data);
  },

  /**
   * Autocomplete feed for the hero Tours search. Matches ACTIVE packages by
   * name, destination, package code or city — typing "puri" or "odisha"
   * surfaces the packages that can actually be booked. Selecting one
   * deep-links straight to its detail page (/tours/{slug}).
   */
  suggest: (q: string, limit = 8) =>
    apiClient
      .get<{ items?: PublicTourSuggestion[] }>("/public/tours/suggestions", {
        params: { q, limit },
      })
      .then(r => (Array.isArray(r.data) ? r.data : (r.data?.items ?? [])))
      .catch(() => [] as PublicTourSuggestion[]),

  get: (slug: string) =>
    apiClient.get<PublicTourPackage>(`/public/tours/packages/${encodeURIComponent(slug)}`).then(r => r.data),

  quote: (packageId: number, persons: number) =>
    apiClient.get(`/public/tours/packages/${packageId}/quote`, { params: { persons } }).then(r => r.data),

  book: (data: any) =>
    apiClient.post("/public/tours/bookings", data).then(r => r.data),

  /**
   * Returns the top destinations (cities) with active tour packages.
   * Used on the homepage grid and the listing page header strip.
   * The backend wraps the payload in `{ items: [...] }`; we unwrap and
   * normalise the `name` field to `city_name` for consumer convenience.
   */
  popularDestinations: () =>
    apiClient
      .get<{ items?: any[] }>("/public/tours/popular-destinations")
      .then(r => {
        const raw = Array.isArray(r.data) ? r.data : (r.data?.items ?? []);
        return raw.map((d: any) => ({
          city_id: d.city_id ?? d.id,
          city_name: d.city_name ?? d.name,
          state_name: d.state_name,
          package_count: d.package_count ?? 0,
          hero_image_url: d.hero_image_url ?? d.image_url ?? null,
          starting_price: d.starting_price ?? null,
        })) as PublicTourDestination[];
      })
      .catch(() => []),

  /**
   * Returns packages that share a city with the given slug, used at the
   * bottom of the detail page to surface "Other tours in {city}".
   * The dedicated endpoint returns a simplified payload — we map it back
   * to the full PublicTourPackage shape so the TourCard renders cleanly.
   * Falls back to a broad search if the dedicated endpoint is unavailable.
   */
  related: (slug: string, cityId?: number) => {
    const toFullShape = (items: any[]): PublicTourPackage[] =>
      items.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        package_code: p.package_code ?? "",
        package_name: p.package_name,
        package_type: p.package_type ?? "FIXED",
        destination: p.destination,
        city_id: p.city_id ?? cityId ?? 0,
        city_name: p.city_name,
        duration_days: p.duration_days,
        duration_nights: p.duration_nights,
        minimum_persons: p.minimum_persons ?? 1,
        maximum_persons: p.maximum_persons ?? null,
        short_description: p.short_description ?? null,
        description: p.description ?? null,
        terms_and_conditions: p.terms_and_conditions ?? null,
        status: "ACTIVE",
        partner_name: p.partner_name ?? null,
        primary_image_url: p.image_url ?? p.primary_image_url ?? null,
        starting_price: p.starting_price ?? 0,
        itinerary: [],
        inclusions: [],
        exclusions: [],
        pricing: p.pricing ?? [],
        media: p.image_url
          ? [{ media_url: p.image_url, is_primary: true, caption: null }]
          : [],
      }));
    return apiClient
      .get<{ items: any[] }>(`/public/tours/packages/${encodeURIComponent(slug)}/related`)
      .then(r => toFullShape(r.data.items ?? []))
      .catch(() =>
        cityId
          ? apiClient
              .get<{ items: PublicTourPackage[] }>("/public/tours/packages", { params: { city_id: cityId, page_size: 6 } })
              .then(r => (r.data.items ?? []).filter(p => p.slug !== slug).slice(0, 6))
              .catch(() => [] as PublicTourPackage[])
          : Promise.resolve([] as PublicTourPackage[])
      );
  },
};
