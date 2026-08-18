"use client";

/**
 * /cabs/results — shows every active vehicle category with an upfront fare
 * breakdown for the searched route. "Book Now" opens the BookingAuthGate;
 * once authenticated the user confirms and POST /public/cab/create-booking
 * files the master + cab booking, then redirects to /bookings.
 *
 * Sidebar: booking-type chip switcher (LOCAL / OUTSTATION / AIRPORT /
 * ROUND_TRIP) — re-fetches the fare estimate under the new
 * trip_type — cab category checkboxes, distance override, and advance
 * filter (sort, min seats, price range).
 *
 * Fare breakdown rows show exactly what the backend returned:
 *   total = base_fare
 *         + max(0, distance - minimum_km) * per_km_rate
 *         + driver_allowance
 *         + (night_charge if is_night else 0)
 * `minimum_km` is km *included* in base fare, NOT a minimum-charge
 * threshold (Doc Ref: migration 0022_pricing_formula_fix). The total is
 * pre-tax; GST is added at trip close.
 *
 * Doc Ref: BRD Part 3 §35 (fare engine), API Doc §7 (create cab booking)
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Car, Users, Luggage, MapPin, Navigation, Calendar, Clock,
  Info, ChevronRight, ChevronDown, Loader2, ShieldCheck, CheckCircle2,
  SearchX, ListFilter, RotateCcw, X, ArrowRight,
} from "lucide-react";
import { Container, MotionStagger, MotionStaggerItem, Card, MotionGlow } from "@/components/ui";
import Badge from "@/components/ui/Badge";
import BookingAuthGate from "@/components/booking/BookingAuthGate";
import BookingReviewModal from "@/components/booking/BookingReviewModal";
import ProfileCompletionModal from "@/components/auth/ProfileCompletionModal";
import { cabService, type FareBreakdownItem, type FareEstimateOut, type PublicCity } from "@/services/cabService";
import { useAuth } from "@/hooks/useAuth";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const TRIP_LABELS: Record<string, string> = {
  LOCAL: "Local",
  OUTSTATION: "Outstation",
  AIRPORT: "Airport Transfer",
  ROUND_TRIP: "Round Trip",
};

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// ── Filter helper (pure, client-side) ─────────────────────────────────────
type SortMode = "recommended" | "price_asc" | "price_desc";
interface FilterState {
  selected: Set<number>;       // empty set = "all visible"
  minSeats: number;
  priceMin: number | "";       // "" = open-ended
  priceMax: number | "";
  sort: SortMode;
}

function applyFilters(
  cats: FareBreakdownItem[],
  f: FilterState,
): FareBreakdownItem[] {
  const out = cats.filter(c => {
    // Category visibility: empty set means "all visible"; otherwise
    // a category must be explicitly selected to show.
    if (f.selected.size > 0 && !f.selected.has(c.vehicle_category_id)) return false;
    const seats = c.seating_capacity ?? 1;
    if (seats < f.minSeats) return false;
    const total = Number(c.total);
    if (f.priceMin !== "" && total < Number(f.priceMin)) return false;
    if (f.priceMax !== "" && total > Number(f.priceMax)) return false;
    return true;
  });
  if (f.sort === "price_asc")  return [...out].sort((a, b) => Number(a.total) - Number(b.total));
  if (f.sort === "price_desc") return [...out].sort((a, b) => Number(b.total) - Number(a.total));
  // "recommended" = backend order (vehicle_categories.display_order, then id)
  return out;
}

// Booking-type tab codes. Kept in sync with the search form (HeroSearchForm / CabSearchForm).
const BOOKING_TYPES = ["LOCAL", "OUTSTATION", "AIRPORT", "ROUND_TRIP"] as const;
type BookingType = (typeof BOOKING_TYPES)[number];

function ResultsContent() {
  const router = useRouter();
  const rawParams = useSearchParams();
  const params = useMemo(() => rawParams ?? new URLSearchParams(), [rawParams]);

  const pickup = params.get("pickup") ?? "";
  const drop = params.get("drop") ?? "";
  const plat = params.get("plat");
  const plng = params.get("plng");
  const dlat = params.get("dlat");
  const dlng = params.get("dlng");
  const cityParam = params.get("city_id");
  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";
  const returnDate = params.get("return_date") ?? "";
  const returnTime = params.get("return_time") ?? "";
  const pax = Number(params.get("pax") ?? "1");
  const distanceParam = params.get("distance_km");

  // Trip type lives in state, mirrored to the URL so deep-links still work
  // and the back button stays sane. One-shot mount-effect keeps them in sync.
  // Default to LOCAL — the most common cab booking type in India. The search
  // forms always include trip_type in the URL, so this only affects bare
  // deep-links.
  const [tripType, setTripType] = useState<string>(params.get("trip_type") ?? "LOCAL");

  const [cities, setCities] = useState<PublicCity[]>([]);
  const [cityId, setCityId] = useState<number | null>(cityParam ? Number(cityParam) : null);
  // Distance starts from URL; the trip-type fallback kicks in below in an
  // effect when it's missing — needed because LOCAL / ROUND_TRIP
  // searches don't have a drop location to derive distance from.
  const [distanceKm, setDistanceKm] = useState<number | null>(
    distanceParam ? Number(distanceParam) : null,
  );
  const [manualDistance, setManualDistance] = useState("");
  const [estimate, setEstimate] = useState<FareEstimateOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking flow state
  const [selected, setSelected] = useState<FareBreakdownItem | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ master_booking_number: string; cab_booking_number: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const auth = useAuth();

  // ── Sidebar filter state ─────────────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [minSeats, setMinSeats] = useState<number>(1);
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [showAdvance, setShowAdvance] = useState<boolean>(false);

  // Load cities for fallback city picker
  useEffect(() => {
    cabService.getCities().then(setCities).catch(() => {});
  }, []);

  // Resolve distance when:
  //   (a) both ends have coords → haversine * 1.25
  //   (b) neither coord nor distance is in the URL → fall back to a
  //       trip-type-aware default so the fetch never hangs.
  // Trip types without a drop (LOCAL / ROUND_TRIP without drop)
  // can't derive distance from coords, so the default is what unblocks
  // the fare-estimate call.
  useEffect(() => {
    if (distanceKm != null) return;
    if (plat && plng && dlat && dlng) {
      const straight = haversineKm(Number(plat), Number(plng), Number(dlat), Number(dlng));
      setDistanceKm(Math.round(straight * 1.25 * 10) / 10);
      return;
    }
    // Trip-type defaults — keep in sync with the search forms.
    let defaultKm = 30;
    if (tripType === "LOCAL") defaultKm = 10;
    else if (tripType === "ROUND_TRIP") defaultKm = 50;
    else if (tripType === "OUTSTATION" || tripType === "ONE_WAY" || tripType === "AIRPORT") defaultKm = 30;
    setDistanceKm(defaultKm);
  }, [distanceKm, plat, plng, dlat, dlng, tripType]);

  // If we arrived without a city_id (e.g. user picked via Google Places on
  // the hero and the form's nearest-city call hadn't resolved yet), derive
  // it from pickup coords so the fare-estimate call doesn't 400.
  useEffect(() => {
    if (cityId != null) return;
    if (!plat || !plng) return;
    cabService.matchNearestCity(Number(plat), Number(plng))
      .then((c) => { if (c) setCityId(c.id); })
      .catch(() => {});
  }, [cityId, plat, plng]);

  // ── URL ↔ tripType sync (one-shot on mount) ──────────────────────────────
  // If a back-button / deep-link changes the URL's trip_type after we've
  // already mounted, pull it into state. Guarded with a ref so we don't loop.
  const urlSynced = useRef(false);
  useEffect(() => {
    if (urlSynced.current) return;
    urlSynced.current = true;
    const fromUrl = params.get("trip_type");
    if (fromUrl && fromUrl !== tripType) setTripType(fromUrl);
    // We intentionally do not depend on params/tripType — single sync only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Seed: as a new estimate returns, add any new category ids to the
  //    visible set. Existing selections are preserved so the user's intent
  //    carries across trip-type switches. An empty set means "all visible".
  useEffect(() => {
    if (!estimate) return;
    const ids = new Set(estimate.categories.map(c => c.vehicle_category_id));
    setSelectedCategories(prev => {
      if (prev.size === 0) return prev; // still "all visible" — keep that
      const merged = new Set(prev);
      let changed = false;
      ids.forEach(id => { if (!merged.has(id)) { merged.add(id); changed = true; } });
      return changed ? merged : prev;
    });
  }, [estimate]);

  // Fetch the fare estimate whenever we have city + distance.
  useEffect(() => {
    if (cityId == null || distanceKm == null) return;
    setLoading(true);
    setError(null);
    const pickupDatetime = date && time ? `${date}T${time}` : undefined;
    const returnDatetime = returnDate && returnTime ? `${returnDate}T${returnTime}` : undefined;
    cabService
      .getFareEstimate(cityId, distanceKm, tripType, pickupDatetime, returnDatetime)
      .then((res) => {
        setEstimate(res);
        if (res.categories.length === 0) {
          setError("No fare configured for this route yet. Contact support.");
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load fares"))
      .finally(() => setLoading(false));
  }, [cityId, distanceKm, tripType, date, time, returnDate, returnTime]);

  const effectiveDistance = manualDistance ? Number(manualDistance) : distanceKm;
  const effectiveCityId = cityId;

  // ── Sidebar: filtered + sorted category list ────────────────────────────
  const filterState: FilterState = {
    selected: selectedCategories,
    minSeats,
    priceMin,
    priceMax,
    sort: sortMode,
  };
  const filteredCategories = useMemo(
    () => (estimate ? applyFilters(estimate.categories, filterState) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estimate, selectedCategories, minSeats, priceMin, priceMax, sortMode],
  );

  // Max seats across the current estimate, used to bound the seats slider.
  const maxSeats = useMemo(() => {
    if (!estimate || estimate.categories.length === 0) return 7;
    return Math.max(1, ...estimate.categories.map(c => c.seating_capacity ?? 1));
  }, [estimate]);

  // ── Trip-type switcher (booking type tab) ───────────────────────────────
  const changeTripType = useCallback((code: string) => {
    if (code === tripType) return;
    setTripType(code);
    // Close any open booking modal so the user doesn't confirm a card
    // that's about to disappear from the list.
    setAuthOpen(false);
    setReviewOpen(false);
    setSelected(null);
    setCreated(null);
    // Reflect in URL so deep-links + share still work, but use `replace`
    // so the back button returns to /cabs, not a chain of trip-type tabs.
    const sp = new URLSearchParams(params.toString());
    sp.set("trip_type", code);
    router.replace(`/cabs/results?${sp.toString()}`, { scroll: false });
  }, [tripType, params, router]);

  // Reset filters to defaults (does NOT touch trip-type, city, or distance).
  const resetFilters = useCallback(() => {
    setSelectedCategories(new Set());
    setSortMode("recommended");
    setMinSeats(1);
    setPriceMin("");
    setPriceMax("");
  }, []);

  const submitBooking = async (
    token: string,
    coupon_code?: string,
    discount_amount?: number,
  ) => {
    if (!selected || !effectiveCityId || !distanceKm) return;
    setSubmitting(true);
    try {
      const res = await cabService.createBooking({
        city_id: effectiveCityId,
        trip_type: tripType,
        vehicle_category_id: selected.vehicle_category_id,
        pickup_location: pickup,
        pickup_latitude: plat ? Number(plat) : undefined,
        pickup_longitude: plng ? Number(plng) : undefined,
        drop_location: drop || undefined,
        drop_latitude: dlat ? Number(dlat) : undefined,
        drop_longitude: dlng ? Number(dlng) : undefined,
        pickup_datetime: date && time ? `${date}T${time}:00` : new Date().toISOString(),
        return_datetime: returnDate && returnTime ? `${returnDate}T${returnTime}:00` : undefined,
        estimated_distance_km: distanceKm,
        passenger_count: pax,
        estimated_amount: Number(selected.total) || 0,
        coupon_code: coupon_code || undefined,
        coupon_discount:
          coupon_code && discount_amount && discount_amount > 0
            ? discount_amount
            : undefined,
      });
      setCreated(res);
      setReviewOpen(false);
      if (coupon_code && discount_amount && discount_amount > 0) {
        toast.success(
          `Booking ${res.master_booking_number} created — saved ₹${discount_amount} with ${coupon_code}`,
        );
      } else {
        toast.success(`Booking ${res.master_booking_number} created!`);
      }
      // The success overlay below offers explicit “View my bookings” and
      // close actions — no fragile auto-redirect (it raced the dev-server
      // route compile and left customers stuck on the overlay).
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const heading = `Cabs · ${TRIP_LABELS[tripType] ?? tripType}`;
  const sub = [pickup, drop].filter(Boolean).join(" → ") || "Pick a route";

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/50 via-white to-white">
      {/* Header bar */}
      <div className="bg-ink text-white">
        <Container size="xl" className="pt-8 pb-7">
          <nav className="text-xs text-white/60 mb-3">
            <button type="button" onClick={() => router.push("/cabs")} className="hover:text-white transition-colors">
              Book a Cab
            </button>
            <span className="mx-2">/</span>
            <span className="text-white/90">Search Results</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{heading}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {pickup || "Pickup"}
                </span>
                {drop && (
                  <span className="inline-flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5" /> {drop}
                  </span>
                )}
                {date && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> {date}
                    <Clock className="h-3.5 w-3.5 ml-1" /> {time}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {pax} pax
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60 uppercase tracking-wider">Trip distance</div>
              <div className="text-xl font-bold text-accent-400">
                {effectiveDistance != null ? `${effectiveDistance} km` : "—"}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container size="xl" className="py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* ── Sidebar: filters + booking type + advance ───────────────── */}
          <MotionGlow color="primary" intensity={0.06} size={420} className="rounded-2xl h-fit lg:sticky lg:top-24">
          <aside className="bg-white/85 backdrop-blur-md border border-ink-7 rounded-2xl p-5 space-y-5 shadow-wt-sm">
            {/* Title */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-ink flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center shadow-wt-accent">
                  <ListFilter className="h-3.5 w-3.5" />
                </span>
                Filters
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-bold uppercase tracking-wider text-ink-4 hover:text-primary-600 transition-colors"
              >
                Reset
              </button>
            </div>

            {/* ── Booking type switcher ─────────────────────────── */}
            <section>
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-3 mb-2">
                Booking type
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {BOOKING_TYPES.map((code) => {
                  const active = code === tripType;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => changeTripType(code)}
                      className={`h-9 px-2.5 text-[11px] font-semibold uppercase tracking-wider rounded-lg border transition-colors ${
                        active
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-ink-9 text-ink-2 border-ink-7 hover:border-primary-300"
                      }`}
                    >
                      {TRIP_LABELS[code] ?? code}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[10px] text-ink-4 leading-snug">
                Switches fare rules &amp; city pricing.
              </p>
            </section>

            {/* ── Cab category checkboxes ───────────────────────── */}
            {estimate && estimate.categories.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-3">
                    Cab category
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCategories.size === 0) {
                        // currently "all visible" → clear (hide all)
                        setSelectedCategories(new Set());
                      } else {
                        setSelectedCategories(new Set());
                      }
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-ink-4 hover:text-primary-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {estimate.categories.map((c) => {
                    const isAll = selectedCategories.size === 0;
                    const checked = isAll || selectedCategories.has(c.vehicle_category_id);
                    return (
                      <li key={c.vehicle_category_id}>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedCategories((prev) => {
                                // prev.size === 0 means "all visible". The first
                                // explicit click seeds the set with everything
                                // *except* the just-toggled one if it was on,
                                // so that toggling individual items stays
                                // intuitive.
                                if (prev.size === 0) {
                                  const all = new Set(estimate.categories.map(cc => cc.vehicle_category_id));
                                  if (!e.target.checked) all.delete(c.vehicle_category_id);
                                  return all;
                                }
                                const next = new Set(prev);
                                if (e.target.checked) next.add(c.vehicle_category_id);
                                else next.delete(c.vehicle_category_id);
                                return next;
                              });
                            }}
                            className="h-4 w-4 rounded border-ink-7 text-primary-600 focus:ring-primary-600/20 accent-[#F05A22]"
                          />
                          <span className="flex-1 text-xs text-ink-2 group-hover:text-ink truncate">
                            {c.category_name}
                            {c.seating_capacity != null && (
                              <span className="text-ink-4"> · {c.seating_capacity} seats</span>
                            )}
                          </span>
                          <span className="text-[11px] font-semibold text-ink-3 tabular-nums">
                            {INR(c.total)}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* ── Where / distance ──────────────────────────────── */}
            <section>
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-3 mb-2">
                Where
              </h3>
              <select
                value={effectiveCityId ?? ""}
                onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 rounded-lg border border-ink-7 bg-ink-9 px-2.5 text-xs text-ink focus:outline-none focus:border-primary-600"
              >
                <option value="">Select city</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </section>

            <section>
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-3 mb-2">
                Distance (km)
                {distanceKm != null && !manualDistance && (
                  <span className="ml-1 text-ink-4 normal-case font-medium">· auto</span>
                )}
              </h3>
              <input
                type="number"
                min={1}
                value={manualDistance}
                placeholder={distanceKm != null ? `${distanceKm}` : "Enter distance"}
                onChange={(e) => setManualDistance(e.target.value)}
                className="w-full h-9 rounded-lg border border-ink-7 bg-ink-9 px-2.5 text-xs text-ink focus:outline-none focus:border-primary-600 placeholder:text-ink-5"
              />
              <p className="mt-1 text-[10px] text-ink-4 leading-snug">
                Manual distance only changes the on-screen breakdown — the server quote uses the auto distance.
              </p>
            </section>

            {/* ── Advance filter (collapsible) ──────────────────── */}
            <section className="border-t border-ink-8 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvance(v => !v)}
                aria-expanded={showAdvance}
                className="w-full flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-3"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5" /> Advance filter
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showAdvance ? "rotate-180" : ""}`}
                />
              </button>

              {showAdvance && (
                <div className="mt-3 space-y-4">
                  {/* Sort */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4 mb-1.5">
                      Sort by
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        ["recommended", "Recommended"],
                        ["price_asc",  "Price ↑"],
                        ["price_desc", "Price ↓"],
                      ] as const).map(([value, label]) => {
                        const active = sortMode === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSortMode(value)}
                            className={`h-8 rounded-md text-[11px] font-semibold transition-colors ${
                              active
                                ? "bg-ink text-white"
                                : "bg-ink-9 text-ink-3 hover:bg-ink-8"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Min seats */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">
                        Seats
                      </span>
                      <span className="text-[11px] font-semibold text-ink-2 tabular-nums">
                        ≥ {minSeats}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={maxSeats}
                      value={minSeats}
                      onChange={(e) => setMinSeats(Number(e.target.value))}
                      className="w-full accent-[#F05A22]"
                    />
                    <div className="flex justify-between text-[10px] text-ink-4">
                      <span>1</span>
                      <span>{maxSeats}</span>
                    </div>
                  </div>

                  {/* Price range */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4 mb-1.5">
                      Price range (₹)
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Min"
                        className="h-9 rounded-lg border border-ink-7 bg-ink-9 px-2.5 text-xs text-ink focus:outline-none focus:border-primary-600 placeholder:text-ink-5"
                      />
                      <input
                        type="number"
                        min={0}
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Max"
                        className="h-9 rounded-lg border border-ink-7 bg-ink-9 px-2.5 text-xs text-ink focus:outline-none focus:border-primary-600 placeholder:text-ink-5"
                      />
                    </div>
                    {(priceMin !== "" || priceMax !== "") && (
                      <p className="mt-1 text-[10px] text-ink-4 tabular-nums">
                        {priceMin === "" ? "Any" : INR(priceMin)} – {priceMax === "" ? "Any" : INR(priceMax)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* ── Edit search ────────────────────────────────────── */}
            <button
              type="button"
              onClick={() => router.push("/cabs")}
              className="w-full h-9 rounded-lg border border-ink-7 text-xs font-semibold text-ink-2 hover:bg-ink-9 transition-colors"
            >
              ← Edit search
            </button>
          </aside>
          </MotionGlow>

          {/* ── Results ─────────────────────────────────────── */}
          <main>
            {error && !estimate && (
              <div className="bg-white border border-ink-7 rounded-2xl p-10 text-center">
                <SearchX className="h-10 w-10 text-ink-4 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-ink">{error}</h3>
                <p className="mt-2 text-sm text-ink-3">
                  {effectiveCityId == null
                    ? "Pick a city from the sidebar to see fares."
                    : effectiveDistance == null
                      ? "Enter a distance to see fares."
                      : "No cab category has pricing for this route yet."}
                </p>
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-ink-7 rounded-2xl p-6 animate-pulse">
                    <div className="h-5 w-40 bg-ink-8 rounded-lg mb-4" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-4 bg-ink-8 rounded" />
                      <div className="h-4 bg-ink-8 rounded" />
                      <div className="h-4 bg-ink-8 rounded" />
                    </div>
                    <div className="h-9 w-28 bg-ink-8 rounded-xl mt-5 ml-auto" />
                  </div>
                ))}
              </div>
            )}

            {!loading && estimate && filteredCategories.length === 0 && (
              <div className="bg-white border border-ink-7 rounded-2xl p-10 text-center">
                <SearchX className="h-10 w-10 text-ink-4 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-ink">No cabs match your filters</h3>
                <p className="mt-2 text-sm text-ink-3">
                  Try clearing a category, lowering the seat count, or widening the price range.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-xl text-white text-sm font-bold shadow-[0_4px_20px_rgba(240,90,34,0.40)]"
                  style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
                >
                  <RotateCcw className="h-4 w-4" /> Reset filters
                </button>
              </div>
            )}

            {filteredCategories.map((cat) => (
              <CabCard
                key={cat.vehicle_category_id}
                cat={cat}
                distanceKm={effectiveDistance ?? 0}
                onBook={() => {
                  setSelected(cat);
                  if (auth.user) {
                    // Already signed in — skip the auth modal. Jump straight
                    // to profile completion (if still needed) or the review
                    // step, keeping `selected` so the review modal renders.
                    void auth.checkProfileCompletion().then(() => {
                      if (useAuth.getState().hasCompleteProfile) {
                        setReviewOpen(true);
                      } else {
                        setProfileOpen(true);
                      }
                    });
                  } else {
                    setAuthOpen(true);
                  }
                }}
              />
            ))}
          </main>
        </div>
      </Container>

      {/* ── Auth gate ─────────────────────────────────────── */}
      <BookingAuthGate
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setSelected(null);
        }}
        onAuthenticated={async () => {
          // After auth, check if the profile needs completion (mobile or name).
          // If yes, show ProfileCompletionModal before the review modal so
          // the user can finish registration before booking.
          setAuthOpen(false);
          await auth.checkProfileCompletion();
          // Read the freshly-computed flag from the store — the closure's
          // `auth` snapshot predates the checkProfileCompletion await, so a
          // direct read here would see the pre-check value.
          if (!useAuth.getState().hasCompleteProfile) {
            setProfileOpen(true);
            return;
          }
          setReviewOpen(true);
        }}
        heading="Confirm your booking"
        subheading={
          selected
            ? `${selected.category_name} · ${INR(selected.total)} for ${effectiveDistance ?? "—"} km`
            : undefined
        }
      />

      {/* ── Profile completion (mobile / name) ────────────── */}
      <ProfileCompletionModal
        open={profileOpen}
        onClose={() => {
          setProfileOpen(false);
          setSelected(null);
        }}
        initialEmail={auth.user?.email}
        initialMobile={auth.user?.phone}
        initialName={auth.user?.name}
        onComplete={() => {
          // Profile saved — close this modal and continue to the review
          // step. Do NOT clear `selected` here (that's an abort action in
          // onClose): the review modal only renders while `selected` is set.
          setProfileOpen(false);
          setReviewOpen(true);
        }}
      />

      {/* ── Review + coupon + book ────────────────────────── */}
      {selected && effectiveCityId && (
        <BookingReviewModal
          open={reviewOpen}
          onClose={() => {
            setReviewOpen(false);
            setSelected(null);
          }}
          selected={selected}
          bookingDraft={{
            city_id: effectiveCityId,
            trip_type: tripType,
            pickup_location: pickup,
            pickup_latitude: plat ? Number(plat) : undefined,
            pickup_longitude: plng ? Number(plng) : undefined,
            drop_location: drop || undefined,
            drop_latitude: dlat ? Number(dlat) : undefined,
            drop_longitude: dlng ? Number(dlng) : undefined,
            pickup_datetime:
              date && time ? `${date}T${time}:00` : new Date().toISOString(),
          }}
          pickupLabel={pickup}
          dropLabel={drop || undefined}
          pickupDateLabel={date || undefined}
          pickupTimeLabel={time || undefined}
          passengerCount={pax}
          submitting={submitting}
          onConfirm={async ({ coupon_code, discount_amount }) => {
            // Coupon preview is wired to the server: create-booking
            // re-validates against the recomputed amount and persists
            // coupon_code / coupon_discount + a coupon_usages row, so
            // close-trip + invoice math picks it up.
            const token = localStorage.getItem("wt_customer_access") ?? "";
            if (!token) {
              toast.error("Your session expired. Please sign in again.");
              setReviewOpen(false);
              setAuthOpen(true);
              return;
            }
            await submitBooking(token, coupon_code, discount_amount);
          }}
        />
      )}

      {/* ── Success overlay ───────────────────────────────── */}
      {created && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-[#0B1B3B]/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative">
            <button
              type="button"
              onClick={() => setCreated(null)}
              className="absolute right-4 top-4 h-9 w-9 rounded-xl hover:bg-ink-9 flex items-center justify-center text-ink-4 hover:text-ink transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <h3 className="text-xl font-extrabold text-ink">Booking created!</h3>
            <p className="mt-2 text-sm text-ink-3">
              Your cab request is with our team — track it from your bookings page.
            </p>
            <div className="mt-4 rounded-xl bg-ink-9 border border-ink-7 p-4 text-left space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-ink-4">Booking</span>
                <span className="font-semibold text-ink">{created.master_booking_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-4">Cab</span>
                <span className="font-semibold text-ink">{created.cab_booking_number}</span>
              </div>
            </div>
            {submitting && (
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-ink-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Confirming payment…
              </span>
            )}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => router.push("/bookings")}
                className="w-full h-12 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(240,90,34,0.40)]"
                style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
              >
                <ArrowRight className="h-4 w-4" /> View my bookings
              </button>
              <button
                type="button"
                onClick={() => setCreated(null)}
                className="w-full text-sm text-ink-4 hover:text-ink-2 font-medium"
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cab card ───────────────────────────────────────────────────────────────
function CabCard({
  cat, distanceKm, onBook,
}: {
  cat: FareBreakdownItem;
  distanceKm: number;
  onBook: () => void;
}) {
  // Per migration 0049 — the distance-charge line is shaped by the
  // pricing rule's driver_allowance_type and the trip's trip_type:
  //
  //   - LOCAL / AIRPORT (package-style): the first ``minimum_km`` km are
  //     included in the base fare; only km above that are billed per km.
  //   - OUTSTATION / ONE_WAY / ROUND_TRIP (billable-minimum): the per-km
  //     rate applies to MAX(actual_km, minimum_km) — a 65 km trip on a
  //     100 km minimum still bills 100 km.
  //
  // The backend is the source of truth (single calculate_fare function),
  // but we render the matching breakdown rows so the customer sees the
  // same math the backend ran.
  const actualKm = Math.max(0, distanceKm);

  // Migration-0049 fields are now typed on FareBreakdownItem, with safe
  // fallbacks for pre-migration breakdowns that predate the columns.
  const daType = cat.driver_allowance_type ?? "PER_TRIP";
  const tripDays = cat.trip_days ?? 1;
  // Heuristic for OUTSTATION-family trips: PER_DAY / PER_KM allowance
  // types are typically only used for OUTSTATION / ROUND_TRIP in the
  // BRD, and a multi-day trip is by definition ROUND_TRIP. This matches
  // the legacy rule where PER_TRIP + 1-day = LOCAL/AIRPORT.
  const isOutstation = daType !== "PER_TRIP" || tripDays > 1;

  // The package-style "extra km" is the km above the minimum — only
  // meaningful for LOCAL / AIRPORT.
  const extraKm = Math.max(0, actualKm - cat.minimum_km);
  // The billable_km is what the backend used for the distance line.
  const billableKm = cat.billable_km ?? (
    isOutstation ? Math.max(actualKm, cat.minimum_km) : extraKm
  );

  // Show rows exactly as the backend computes them. Frontend does NOT
  // recompute the fare — single source of truth is `calculate_fare_breakdown`.
  const rows: { label: ReactNode; value: ReactNode }[] = [];

  rows.push({ label: "Base fare", value: INR(cat.base_fare) });

  if (isOutstation) {
    // OUTSTATION / ONE_WAY / ROUND_TRIP: "Billable distance" rows.
    rows.push({
      label: "Billable distance",
      value: (
        <span className="text-ink-4 font-medium">
          {INR(cat.per_km_rate)}/km
        </span>
      ),
    });
    if (actualKm < cat.minimum_km) {
      // Customer travelled UNDER the minimum — minimum wins, the actual
      // figure is informational.
      rows.push({
        label: (
          <>
            Actual <span className="text-ink-4 font-normal">({actualKm.toFixed(0)} km)</span>
          </>
        ),
        value: (
          <span className="text-ink-4 font-medium">—</span>
        ),
      });
      rows.push({
        label: (
          <>
            Minimum <span className="text-ink-4 font-normal">({cat.minimum_km} km)</span>
          </>
        ),
        value: INR(cat.per_km_rate * cat.minimum_km),
      });
    } else {
      rows.push({
        label: (
          <>
            Actual <span className="text-ink-4 font-normal">({actualKm.toFixed(0)} km)</span>
          </>
        ),
        value: INR(cat.per_km_rate * billableKm),
      });
    }
  } else {
    // LOCAL / AIRPORT: legacy "First N km included" + "Per extra km".
    rows.push({
      label: `First ${cat.minimum_km} km`,
      value: <span className="text-ink-4 font-medium">Included</span>,
    });
    rows.push({
      label: (
        <>
          Per extra km
          {extraKm > 0 && (
            <span className="text-ink-4 font-normal">
              {" "}({INR(cat.per_km_rate)}/km × {extraKm} km)
            </span>
          )}
        </>
      ),
      value: extraKm > 0
        ? INR(cat.distance_charge)
        : <span className="text-ink-4 font-medium">—</span>,
    });
  }

  // Driver-allowance row: label varies by ``driver_allowance_type``.
  if (daType === "NONE") {
    // Allowance is suppressed — show an "Included" badge so the customer
    // knows the line exists but is zero for this rule.
    rows.push({
      label: "Driver allowance",
      value: <span className="text-ink-4 font-medium">Included</span>,
    });
  } else if (daType === "PER_DAY") {
    rows.push({
      label: (
        <>
          Driver allowance
          {tripDays > 1 && (
            <span className="text-ink-4 font-normal">
              {" "}({INR(Number(cat.driver_allowance) / tripDays)}/day × {tripDays} days)
            </span>
          )}
        </>
      ),
      value: Number(cat.driver_allowance) > 0
        ? INR(cat.driver_allowance)
        : <span className="text-ink-4 font-medium">Included</span>,
    });
  } else if (daType === "PER_KM") {
    rows.push({
      label: (
        <>
          Driver allowance
          {billableKm > 0 && (
            <span className="text-ink-4 font-normal">
              {" "}({INR(Number(cat.driver_allowance) / billableKm)}/km × {billableKm} km)
            </span>
          )}
        </>
      ),
      value: Number(cat.driver_allowance) > 0
        ? INR(cat.driver_allowance)
        : <span className="text-ink-4 font-medium">Included</span>,
    });
  } else {
    // PER_TRIP (legacy default).
    rows.push({
      label: "Driver allowance",
      value: Number(cat.driver_allowance) > 0
        ? INR(cat.driver_allowance)
        : <span className="text-ink-4 font-medium">Included</span>,
    });
  }

  if (Number(cat.night_charge_applied) > 0) {
    rows.push({
      label: "Night charge",
      value: INR(cat.night_charge_applied),
    });
  }

  const isCityPrice = cat.source === "city_specific";

  return (
    <Card variant="premium" hover lift="sm" className="group mb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left: cab identity */}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center flex-shrink-0 shadow-wt-primary group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
            <Car className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink group-hover:text-primary-700 transition-colors">{cat.category_name}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-4">
              {cat.seating_capacity != null && (
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {cat.seating_capacity} seats</span>
              )}
              <span className="inline-flex items-center gap-1"><Luggage className="h-3.5 w-3.5" /> {cat.minimum_km} km included</span>
              {isCityPrice ? (
                <Badge tone="success" size="sm" icon={<ShieldCheck className="h-3 w-3" />}>
                  City price
                </Badge>
              ) : (
                <span title="This city has no custom pricing configured; the system default is being used.">
                  <Badge tone="neutral" size="sm" icon={<Info className="h-3 w-3" />}>
                    Default price
                  </Badge>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: price */}
        <div className="text-right">
          <div className="text-3xl font-extrabold text-gradient-primary tracking-tight tabular-nums">{INR(cat.total)}</div>
          <div className="text-[11px] text-ink-4 mt-1">Upfront fare · GST added at trip close</div>
        </div>
      </div>

      {/* Fare breakdown */}
      <div className="mt-5 rounded-xl bg-ink-9/70 backdrop-blur-sm border border-ink-8 divide-y divide-ink-8">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm gap-3">
            <span className="text-ink-3">{row.label}</span>
            <span className="font-semibold text-ink tabular-nums flex-shrink-0">{row.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-50/40 to-accent-50/30">
          <span className="text-sm font-bold text-ink">Estimated total</span>
          <span className="text-lg font-extrabold text-gradient-primary tabular-nums">{INR(cat.total)}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-ink-4">
          <Info className="h-3.5 w-3.5" /> Exact fare confirmed by the driver/partner at pickup.
        </div>
        <button
          type="button"
          onClick={onBook}
          className="inline-flex items-center gap-1.5 h-11 px-6 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-wt-accent hover:shadow-wt-glow-accent"
          style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
        >
          Book now <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

export default function CabResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ResultsContent />
    </Suspense>
  );
}
