// ============================================================
// WAYTERO — Public Hotel Service (no auth for search/quote)
// Doc Ref: public_hotel_api.py, BRD Part 4 §57-92
// ============================================================

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface PublicHotelCity {
  id: number;
  name: string;
  city_code?: string;
  state_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  hotel_count: number;
}

export interface PublicHotelSearchItem {
  id: number;
  uuid: string;
  slug?: string | null;
  hotel_name: string;
  star_rating?: number | null;
  city_id: number;
  city_name: string;
  state_name?: string | null;
  address?: string | null;
  landmark?: string | null;
  is_featured: boolean;
  primary_image_url?: string | null;
  average_rating: number;
  total_reviews: number;
  starting_price: number;
  room_category_count: number;
  amenities: string[];
}

export interface PublicHotelSearchOut {
  items: PublicHotelSearchItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface PublicHotelRoomCategory {
  id: number;
  category_name: string;
  room_type?: string | null;
  description?: string | null;
  base_occupancy: number;
  max_adults: number;
  max_children: number;
  max_occupancy: number;
  bed_type?: string | null;
  room_size_sqft?: number | null;
  view_type?: string | null;
  meal_plan: string;
  is_refundable: boolean;
  base_price: number;
  published_price?: number | null;
  extra_bed_allowed: boolean;
  extra_bed_charge: number;
  extra_adult_charge: number;
  extra_child_charge: number;
  total_rooms: number;
  images: string[];
  /** null = open availability for the requested dates. */
  available_rooms?: number | null;
  stop_sell: boolean;
  /** Resolved per-night rate for the requested stay (rate plans + inventory
   *  overrides applied) — first night's rate. null/absent when no dates sent. */
  nightly_rate?: number | null;
  /** Full per-night rate breakdown for the requested stay [{date, rate}]. */
  nightly_rates?: { date: string; rate: number }[];
}

export interface PublicHotelPolicy {
  check_in_time?: string | null;
  check_out_time?: string | null;
  early_check_in_allowed: boolean;
  late_check_out_allowed: boolean;
  cancellation_free_hours?: number | null;
  refund_percent_tier_1?: number | null;
  cancellation_tier_2_hours?: number | null;
  refund_percent_tier_2?: number | null;
  cancellation_tier_3_hours?: number | null;
  refund_percent_tier_3?: number | null;
  refund_percent_same_day?: number | null;
  couples_allowed: boolean;
  unmarried_couples_allowed: boolean;
  local_id_accepted: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  alcohol_allowed: boolean;
  house_rules?: string | null;
  cancellation_policy_text?: string | null;
}

export interface PublicHotelDetails {
  id: number;
  uuid: string;
  slug?: string | null;
  hotel_name: string;
  /** Per-hotel SEO metadata (admin → hotel → SEO tab). customer-web uses
   *  these for DB-driven meta tags on the hotel detail page. */
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  hotel_type?: string | null;
  star_rating?: number | null;
  description?: string | null;
  short_description?: string | null;
  city_id: number;
  city_name: string;
  state_name?: string | null;
  address?: string | null;
  address_line_2?: string | null;
  landmark?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_featured: boolean;
  average_rating: number;
  total_reviews: number;
  total_rooms: number;
  images: string[];
  amenities: string[];
  room_categories: PublicHotelRoomCategory[];
  policy?: PublicHotelPolicy | null;
}

export interface HotelNightQuote {
  date: string;
  rate: number;
  source: string;
  plan_name?: string | null;
  gst_percent: number;
  gst_amount: number;
  total_with_tax: number;
}

export interface HotelOccupancyBlock {
  base_occupancy: number;
  base_capacity: number;
  adults: number;
  children: number;
  extra_adults: number;
  extra_children: number;
  extra_beds: number;
  extra_adult_charge: number;
  extra_child_charge: number;
  extra_bed_charge: number;
  person_surcharge: number;
  bed_surcharge: number;
  surcharge: number;
  person_charge_basis: string;
  bed_charge_basis: string;
}

export interface HotelQuoteOut {
  success: boolean;
  hotel_id: number;
  hotel_name: string;
  room_category_id: number;
  room_category_name: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  rooms_count: number;
  room_nights: number;
  base_amount: number;
  taxable_amount: number;
  gst_percent: number;
  gst_amount: number;
  is_tax_invoice: boolean;
  total_amount: number;
  platform_commission: number;
  partner_payout: number;
  average_nightly_rate: number;
  nightly: HotelNightQuote[];
  occupancy?: HotelOccupancyBlock;
  availability?: { min_available: number | null; stop_sell: boolean };
}

export interface CreateHotelBookingIn {
  hotel_id: number;
  room_category_id: number;
  check_in_date: string; // YYYY-MM-DD
  check_out_date: string; // YYYY-MM-DD
  rooms_count: number;
  adults_count: number;
  children_count: number;
  extra_beds: number;
  primary_guest_name: string;
  primary_guest_mobile?: string;
  special_requests?: string;
  /** Quoted total (pre-coupon) from /public/hotel/quote — hint only, the
   *  server re-prices via compute_hotel_quote and returns the canonical
   *  amount. */
  estimated_amount?: number;
  coupon_code?: string;
  coupon_id?: number;
}

export interface CreateHotelBookingOut {
  master_booking_number: string;
  hotel_booking_number: string;
  reservation_number: string;
  status: string;
  total_amount: number;
  nights: number;
  rooms_count: number;
}

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.detail ?? `${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail ?? json?.message ?? `${res.status} ${res.statusText}`);
  return json;
}

export const hotelService = {
  /** Active cities that have bookable hotels (drives search form + popular
   *  destinations). */
  getCities: (): Promise<PublicHotelCity[]> => get("/public/hotel/cities"),

  /** City/place based hotel search with starting nightly price. */
  search: (params: {
    city_id?: number;
    q?: string;
    check_in?: string;
    check_out?: string;
    star_rating?: number;
    min_price?: number;
    max_price?: number;
    is_featured?: boolean;
    sort_by?: "recommended" | "price_asc" | "price_desc" | "rating";
    page?: number;
    page_size?: number;
  }): Promise<PublicHotelSearchOut> => get("/public/hotel/search", params as Record<string, string | number>),

  /** Full hotel details (gallery, amenities, room categories, policy).
   *  Pass check_in/check_out to receive per-category availability. */
  getDetails: (
    slug: string,
    dates?: { check_in?: string; check_out?: string },
  ): Promise<PublicHotelDetails> =>
    get(`/public/hotel/${encodeURIComponent(slug)}`, dates as Record<string, string>),

  /** Server-side price for a stay — the customer never computes hotel money. */
  quote: (body: {
    hotel_id: number;
    room_category_id: number;
    check_in_date: string;
    check_out_date: string;
    rooms_count: number;
    adults_count: number;
    children_count: number;
    extra_beds: number;
  }): Promise<HotelQuoteOut> => post("/public/hotel/quote", body),

  /** Auth required — token auto-attached by the apiClient interceptor.
   *  Returns the reservation + master booking numbers and the canonical
   *  server-computed total. */
  createBooking: async (body: CreateHotelBookingIn): Promise<CreateHotelBookingOut> => {
    const { default: api } = await import("@/lib/api");
    const res = await api.post<{ success: boolean; data: CreateHotelBookingOut }>(
      "/public/hotel/create-booking",
      body,
    );
    return res.data.data;
  },
};

export default hotelService;
