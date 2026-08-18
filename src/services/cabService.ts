// ============================================================
// WAYTERO — Public Cab Service (no auth for search/estimate)
// Doc Ref: public_cab_api.py
// ============================================================

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface PublicCity {
  id: number;
  name: string;
  city_code?: string;
  state_name?: string;
  // City-centre coordinates (migration 0046). Populated by
  // GET /public/cab/cities. Used to bias Google Places autocomplete so
  // "Bhubaneswar Airport" doesn't rank "Bihar, India" above it.
  latitude?: number | null;
  longitude?: number | null;
}

export interface PublicVehicleCategory {
  id: number;
  category_name: string;
  seating_capacity?: number;
  luggage_capacity?: number;
  image_url?: string;
  icon_url?: string;
  display_order: number;
}

export interface FareBreakdownItem {
  vehicle_category_id: number;
  category_name: string;
  seating_capacity?: number;
  image_url?: string;
  icon_url?: string;
  base_fare: number;
  minimum_km: number;
  per_km_rate: number;
  driver_allowance: number;
  night_charge_applied: number;
  distance_charge: number;
  is_night: boolean;
  total: number;
  source: string;
  /** Driver-allowance evaluation mode. Migration 0049.
   *  - "PER_TRIP" → flat amount once per trip (legacy default)
   *  - "PER_DAY"  → multiplied by trip_days (multi-day round trips)
   *  - "PER_KM"   → multiplied by billable_km (variable)
   *  - "NONE"     → 0
   */
  driver_allowance_type?: string;
  /** Computed trip-day count for PER_DAY rules (min 1). */
  trip_days?: number;
  /** KM the distance charge was computed against (MAX(actual, minimum) for outstation). */
  billable_km?: number;
  /** Actual trip distance fed into the fare engine. */
  actual_km?: number;
}

export interface FareEstimateOut {
  distance_km: number;
  trip_type: string;
  pickup_datetime?: string;
  return_datetime?: string;
  categories: FareBreakdownItem[];
}

export interface CreateCabBookingIn {
  city_id: number;
  trip_type: string;
  vehicle_category_id: number;
  pickup_location: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  drop_location?: string;
  drop_latitude?: number;
  drop_longitude?: number;
  pickup_datetime: string;
  /** Return date for ROUND_TRIP. ISO datetime. */
  return_datetime?: string;
  estimated_distance_km?: number;
  passenger_count?: number;
  special_instructions?: string;
  /** Upfront fare (pre-GST) from /public/cab/fare-estimate. Treated as a
   *  hint — the server recomputes via calculate_fare() and returns the
   *  canonical value (with a warning if they differ). See public_cab_api.py
   *  create_cab_booking for the recompute logic. */
  estimated_amount?: number;
  /** Coupon code the customer applied during the review step. The server
   *  re-validates it against the recomputed amount and, if valid, persists
   *  the discount to cab_bookings + coupon_usages so close-trip + invoice
   *  math picks it up. */
  coupon_code?: string;
  /** Coupon id at preview time. Optional — server re-derives from coupon_code
   *  if not provided. */
  coupon_id?: number;
  /** Discount amount (₹) computed during the coupon preview. Best-effort —
   *  the server's re-validation is authoritative. */
  coupon_discount?: number;
}

export interface GoogleMapsKeyOut {
  api_key: string | null;
  map_id: string | null;
  is_active: boolean;
}

export interface PublicTripType {
  code: string;       // LOCAL | AIRPORT | OUTSTATION | ONE_WAY | ROUND_TRIP
  display_name: string;
  description: string;
  icon: string;       // backend-supplied hint; frontend maps to Lucide icon
}

// ── Auth payloads (Doc Ref: 01_AUTH_API.md) ────────────────────────────────
export interface OtpSentOut {
  mobile_number: string;
  message: string;
  expires_in_seconds: number;
  /** Only populated in non-production for dev convenience. */
  dev_otp?: string | null;
}

export interface LoginOut {
  user: {
    id: string;
    mobile: string;
    email?: string | null;
    full_name?: string | null;
    user_type: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
  session_id: string;
}

export interface CouponApplyIn {
  coupon_code: string;
  service_type?: "CAB";
  vehicle_category_id?: number;
  city_id?: number;
  booking_amount: number;
  customer_id: number;
  customer_mobile?: string;
}

export interface CouponApplyOut {
  valid: boolean;
  discount_amount: number;
  final_amount: number;
  message: string;
}

export interface CustomerMeOut {
  id: number;
  uuid: string;
  customer_code: string;
  first_name?: string | null;
  last_name?: string | null;
  mobile_number?: string | null;
  email?: string | null;
  city_id?: number | null;
}

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? json?.detail ?? `${res.status} ${res.statusText}`);
  return json;
}

export const cabService = {
  getCities: (): Promise<PublicCity[]> =>
    get("/public/cab/cities"),

  /** Nearest active city to a (lat, lng) — used to derive city_id after a
   *  Google Places pick. Returns null if no active city has coords yet. */
  matchNearestCity: (lat: number, lng: number): Promise<PublicCity | null> => {
    const url = new URL(`${BASE}/public/cab/cities/match`);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lng", String(lng));
    return fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        // Empty body = null match
        return (json && Object.keys(json).length > 0) ? json as PublicCity : null;
      });
  },

  /** Active cab trip types (driven by the backend's default + city rules). */
  getTripTypes: (): Promise<PublicTripType[]> =>
    get("/public/cab/trip-types"),

  getVehicleCategories: (): Promise<PublicVehicleCategory[]> =>
    get("/public/cab/vehicle-categories"),

  getFareEstimate: (
    city_id: number,
    distance_km: number,
    trip_type: string,
    pickup_datetime?: string,
    return_datetime?: string,
  ): Promise<FareEstimateOut> =>
    get("/public/cab/fare-estimate", {
      city_id,
      distance_km,
      trip_type,
      ...(pickup_datetime ? { pickup_datetime } : {}),
      ...(return_datetime ? { return_datetime } : {}),
    }),

  /** Returns the admin-configured Google Maps API key (or null if not set). */
  getGoogleMapsKey: (): Promise<GoogleMapsKeyOut> =>
    get("/public/cab/google-maps-key"),

  /** Auth capabilities — whether mobile-OTP login is available. Requires an
   *  active SMS provider (MSG91) in admin Settings → API Integrations; without
   *  one the web auth modal hides the mobile/OTP UI and Google sign-in saves
   *  mobiles as UNVERIFIED. */
  getAuthConfig: (): Promise<{ sms_configured: boolean; mobile_login_enabled: boolean }> =>
    get<{ data?: { sms_configured: boolean; mobile_login_enabled: boolean } }>("/auth/config").then(
      (json) => json?.data ?? { sms_configured: false, mobile_login_enabled: false },
    ),

  /** Save a mobile WITHOUT OTP verification — stored as UNVERIFIED. Used after
   *  Google sign-in when no SMS provider is integrated; when SMS is active use
   *  sendOtp + attachMobile instead. */
  saveMobile: (mobile: string) =>
    import("@/lib/api").then(({ default: api }) =>
      api.patch<CustomerMeOut>("/customers/me/mobile", { mobile_number: mobile }).then((r) => r.data),
    ),

  // ── OTP login (backend issues the tokens; dev_otp returned in non-prod) ──
  /** purpose defaults to LOGIN; pass "MOBILE_ATTACH" when the OTP is for
   *  attaching a new mobile to an existing (Google) account so it can't
   *  collide with a login OTP for the same number. */
  sendOtp: (mobile: string, purpose: "LOGIN" | "MOBILE_ATTACH" = "LOGIN"): Promise<OtpSentOut> =>
    post("/auth/send-otp", { mobile, purpose }),

  verifyOtp: (mobile: string, otp: string): Promise<LoginOut> =>
    post("/auth/verify-otp", { mobile, otp }),

  /** Firebase/Google sign-in. The web client gets an ID token from
   *  signInWithPopup(GoogleAuthProvider), then we exchange it with the
   *  backend for our own JWT pair (same envelope as verifyOtp). */
  signInWithFirebase: (id_token: string): Promise<LoginOut> =>
    post("/auth/firebase-sign-in", { id_token }),

  // ── Coupon preview (re-checks eligibility + returns discount) ──
  applyCoupon: async (body: CouponApplyIn): Promise<CouponApplyOut> => {
    const { default: api } = await import("@/lib/api");
    const res = await api.post<CouponApplyOut>("/public/coupon/validate", body);
    return res.data;
  },

  // ── Customer profile (auth required — uses apiClient for token attach) ──
  getCustomerMe: () =>
    import("@/lib/api").then(({ default: api }) =>
      api.get<CustomerMeOut>("/customers/me").then((r) => r.data),
    ),

  /** Verify the MOBILE_ATTACH OTP and attach the mobile to the current
   *  account. Unlike /auth/verify-otp this never creates a new customer —
   *  the Google user keeps their identity and gains a real mobile. */
  attachMobile: (mobile: string, otp: string) =>
    import("@/lib/api").then(({ default: api }) =>
      api
        .post<CustomerMeOut>("/customers/me/mobile/verify-otp", { mobile_number: mobile, otp })
        .then((r) => r.data),
    ),

  /** Attach / update the email on the current account (mobile-OTP login flow). */
  updateEmail: (email: string) =>
    import("@/lib/api").then(({ default: api }) =>
      api.patch<CustomerMeOut>("/customers/me/email", { email }).then((r) => r.data),
    ),

  /** Auth required — token auto-attached by the apiClient interceptor.
   *
   *  The response includes the server-recomputed `estimated_amount`, the
   *  persisted coupon snapshot, and a `warning` string when the FE hint
   *  differed from the server total (or no pricing rule was found). The FE
   *  should surface that warning to the customer so they know why the
   *  total might differ from the quote step. */
  createBooking: async (body: CreateCabBookingIn) => {
    const { default: api } = await import("@/lib/api");
    const res = await api.post<{
      success: boolean;
      data: {
        master_booking_number: string;
        cab_booking_number: string;
        status: string;
        estimated_amount: number;
        coupon_code: string | null;
        coupon_discount: number;
        warning: string | null;
      };
    }>(
      "/public/cab/create-booking",
      body,
    );
    return res.data.data;
  },
};

export default cabService;
