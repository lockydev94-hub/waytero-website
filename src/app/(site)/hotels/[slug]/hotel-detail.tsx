"use client";

/**
 * /hotels/[slug] — hotel details page.
 *
 * Shows the property (gallery, description, amenities, policy) plus every
 * active room category with its per-night price and availability for the
 * selected stay. "Book" prices the stay server-side (GET quote), then runs
 * the same flow as cabs: BookingAuthGate → HotelBookingReviewModal →
 * POST /public/hotel/create-booking → /bookings.
 *
 * Doc Ref: BRD Part 4 §57-92, public_hotel_api.py
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  MapPin, Star, Calendar, Users, BedDouble, Building2, Loader2, CheckCircle2,
  ShieldCheck, Clock, Coffee, ChevronLeft, ChevronRight, Wifi, Sparkles, PawPrint,
  Ban, Info, RefreshCw,
} from "lucide-react";
import { Container, Card, MotionGlow, MotionReveal } from "@/components/ui";
import HotelDateRangePicker from "@/components/forms/HotelDateRangePicker";
import BookingAuthGate from "@/components/booking/BookingAuthGate";
import HotelBookingReviewModal from "@/components/booking/HotelBookingReviewModal";
import HotelBookingSuccessModal, {
  type HotelBookingSuccessData,
} from "@/components/booking/HotelBookingSuccessModal";
import {
  hotelService,
  type PublicHotelDetails,
  type PublicHotelRoomCategory,
  type HotelQuoteOut,
} from "@/services/hotelService";
import { useAuth } from "@/hooks/useAuth";

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

const MEAL_LABELS: Record<string, string> = {
  EP: "Room only",
  CP: "Breakfast included",
  MAP: "Breakfast + dinner",
  AP: "All meals included",
};

function HotelContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const auth = useAuth();

  // ── Stay criteria (defaults: today → tomorrow) ────────────────────────
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const [checkIn, setCheckIn] = useState(searchParams.get("check_in") ?? isoDate(today));
  const [checkOut, setCheckOut] = useState(
    searchParams.get("check_out") ?? isoDate(addDays(today, 1)),
  );
  const [guests, setGuests] = useState(Number(searchParams.get("guests") ?? "2"));
  const [roomsCount, setRoomsCount] = useState(Number(searchParams.get("rooms") ?? "1"));

  const [hotel, setHotel] = useState<PublicHotelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // ── Booking flow state ────────────────────────────────────────────────
  const [selectedCat, setSelectedCat] = useState<PublicHotelRoomCategory | null>(null);
  const [quote, setQuote] = useState<HotelQuoteOut | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState<HotelBookingSuccessData | null>(null);

  const fetchHotel = useCallback(() => {
    setLoading(true);
    setError(null);
    hotelService
      .getDetails(slug, { check_in: checkIn, check_out: checkOut })
      .then((h) => {
        setHotel(h);
        setActiveImage((prev) => prev ?? h.images[0] ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load hotel"))
      .finally(() => setLoading(false));
  }, [slug, checkIn, checkOut]);

  useEffect(() => { fetchHotel(); }, [fetchHotel]);

  // ── Apply the stay bar → re-fetch availability + keep URL shareable ────
  const applyStay = useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("check_in", checkIn);
    sp.set("check_out", checkOut);
    sp.set("guests", String(guests));
    sp.set("rooms", String(roomsCount));
    router.replace(`/hotels/${slug}?${sp.toString()}`, { scroll: false });
    setSelectedCat(null);
    setQuote(null);
    setReviewOpen(false);
    fetchHotel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, guests, roomsCount, slug, router]);

  const nights = useMemo(() => {
    const d1 = new Date(`${checkIn}T00:00:00`);
    const d2 = new Date(`${checkOut}T00:00:00`);
    return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000));
  }, [checkIn, checkOut]);

  // ── Book a room category: quote → auth → review → create ─────────────
  const startBooking = useCallback(async (cat: PublicHotelRoomCategory) => {
    setSelectedCat(cat);
    setQuote(null);
    setQuoting(true);
    try {
      const q = await hotelService.quote({
        hotel_id: hotel!.id,
        room_category_id: cat.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        rooms_count: roomsCount,
        adults_count: guests,
        children_count: 0,
        extra_beds: 0,
      });
      setQuote(q);
      if (auth.user) {
        setReviewOpen(true);
      } else {
        setAuthOpen(true);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't quote this stay");
      setSelectedCat(null);
    } finally {
      setQuoting(false);
    }
  }, [auth.user, checkIn, checkOut, guests, roomsCount, hotel]);

  const confirmBooking = useCallback(
    async (opts: { guest_name: string; guest_mobile?: string; coupon_code?: string; discount_amount?: number }) => {
      if (!selectedCat || !quote || !hotel) return;
      setSubmitting(true);
      try {
        const res = await hotelService.createBooking({
          hotel_id: hotel.id,
          room_category_id: selectedCat.id,
          check_in_date: checkIn,
          check_out_date: checkOut,
          rooms_count: roomsCount,
          adults_count: guests,
          children_count: 0,
          extra_beds: 0,
          primary_guest_name: opts.guest_name,
          primary_guest_mobile: opts.guest_mobile,
          estimated_amount: quote.total_amount,
          coupon_code: opts.coupon_code || undefined,
        });
        setReviewOpen(false);
        setSelectedCat(null);
        setQuote(null);
        setSuccessBooking(res);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Booking failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [selectedCat, quote, hotel, checkIn, checkOut, guests, roomsCount],
  );

  const stayDatesValid = checkIn && checkOut && new Date(checkOut) > new Date(checkIn);

  if (loading && !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-sm text-ink-4">Loading hotel…</p>
        </div>
      </div>
    );
  }

  if (error && !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-6">
          <Building2 className="h-12 w-12 text-ink-4 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-ink">Hotel unavailable</h1>
          <p className="text-sm text-ink-4 mt-2">{error}</p>
          <button
            onClick={() => router.push("/hotels")}
            className="mt-6 px-6 h-11 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold inline-flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to hotels
          </button>
        </div>
      </div>
    );
  }

  if (!hotel) return null;

  const images = hotel.images.length > 0 ? hotel.images : [null];
  // The card shows the resolved per-night rate for the selected dates (rate
  // plans / inventory overrides applied) — not the raw base_price — so the
  // price customers see here matches the quote and the bookings page.
  const catRate = (c: PublicHotelRoomCategory): number => {
    const rates = c.nightly_rates;
    if (rates && rates.length > 0) return Math.min(...rates.map((r) => r.rate));
    return c.base_price;
  };
  const cheapest = [...hotel.room_categories].sort((a, b) => catRate(a) - catRate(b))[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent-50/50 via-white to-white">
      {/* ── Header bar ─────────────────────────────────────── */}
      <div className="bg-ink text-white">
        <Container size="xl" className="pt-8 pb-7">
          <nav className="text-xs text-white/60 mb-3">
            <button type="button" onClick={() => router.push("/hotels")} className="hover:text-white transition-colors">
              Book a Hotel
            </button>
            <span className="mx-2">/</span>
            <button
              type="button"
              onClick={() => router.push(`/hotels/results?city_id=${hotel.city_id}`)}
              className="hover:text-white transition-colors"
            >
              {hotel.city_name}
            </button>
            <span className="mx-2">/</span>
            <span className="text-white/90">{hotel.hotel_name}</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{hotel.hotel_name}</h1>
                {hotel.is_featured && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-500 text-ink">
                    Featured
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                  {hotel.average_rating > 0 ? hotel.average_rating.toFixed(1) : "New"}
                  {hotel.total_reviews > 0 && <span className="text-white/60">({hotel.total_reviews})</span>}
                </span>
                {hotel.star_rating != null && hotel.star_rating > 0 && (
                  <span className="text-amber-400 text-xs">{"★".repeat(hotel.star_rating)}</span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {[hotel.landmark, hotel.city_name, hotel.state_name].filter(Boolean).join(", ")}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60 uppercase tracking-wider">Starts from</div>
              <div className="text-2xl font-extrabold text-accent-400">
                {cheapest ? INR(catRate(cheapest)) : "—"}
                <span className="text-sm text-white/60 font-semibold"> /night</span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container size="xl" className="py-8 lg:py-10">
        {/* ── Stay bar ─────────────────────────────────────── */}
        <div className="bg-white border border-ink-7 rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-4 mb-1">Stay dates</label>
            <div className="h-10 flex items-center rounded-lg border border-ink-7 bg-ink-9 px-3">
              <HotelDateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                minDate={isoDate(today)}
                onChange={(range) => {
                  setCheckIn(range.checkIn);
                  setCheckOut(range.checkOut);
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-4 mb-1">Guests</label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="h-10 rounded-lg border border-ink-7 bg-ink-9 px-3 text-sm focus:outline-none focus:border-primary-600"
            >
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <option key={g} value={g}>{g} {g === 1 ? "guest" : "guests"}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-4 mb-1">Rooms</label>
            <select
              value={roomsCount}
              onChange={(e) => setRoomsCount(Number(e.target.value))}
              className="h-10 rounded-lg border border-ink-7 bg-ink-9 px-3 text-sm focus:outline-none focus:border-primary-600"
            >
              {[1, 2, 3].map((r) => (
                <option key={r} value={r}>{r} {r === 1 ? "room" : "rooms"}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={applyStay}
            disabled={!stayDatesValid}
            className="h-10 px-5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Update
          </button>
          {nights > 0 && (
            <span className="ml-auto text-xs text-ink-4 font-medium">
              {nights} night{nights > 1 ? "s" : ""} · {roomsCount} room{roomsCount > 1 ? "s" : ""} · {guests} guest{guests > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* ── Left column: gallery + info ─────────────────── */}
          <div className="space-y-6 min-w-0">
            {/* Gallery */}
            <div className="bg-white border border-ink-7 rounded-2xl overflow-hidden">
              <div className="relative aspect-[16/9] bg-gradient-to-br from-accent-100 via-accent-50 to-primary-50">
                {activeImage ? (
                  <img src={activeImage} alt={hotel.hotel_name} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-accent-300" />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => img && setActiveImage(img)}
                      className={`relative h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                        activeImage === img ? "border-primary-600" : "border-transparent hover:border-primary-300"
                      }`}
                    >
                      {img ? (
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-ink-8 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-ink-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {hotel.description && (
              <section className="bg-white border border-ink-7 rounded-2xl p-6">
                <h2 className="text-lg font-extrabold text-ink mb-3">About this property</h2>
                <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line">{hotel.description}</p>
              </section>
            )}

            {/* Amenities */}
            {hotel.amenities.length > 0 && (
              <section className="bg-white border border-ink-7 rounded-2xl p-6">
                <h2 className="text-lg font-extrabold text-ink mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {hotel.amenities.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-9 text-xs font-semibold text-ink-2"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {a}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Policy */}
            {hotel.policy && (
              <section className="bg-white border border-ink-7 rounded-2xl p-6">
                <h2 className="text-lg font-extrabold text-ink mb-4">Good to know</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <PolicyRow icon={<Clock className="h-4 w-4" />} label="Check-in" value={hotel.policy.check_in_time ?? "12:00"} />
                  <PolicyRow icon={<Clock className="h-4 w-4" />} label="Check-out" value={hotel.policy.check_out_time ?? "11:00"} />
                  <PolicyRow
                    icon={<Coffee className="h-4 w-4" />}
                    label="Cancellation"
                    value={
                      hotel.policy.cancellation_free_hours != null
                        ? `Free up to ${hotel.policy.cancellation_free_hours} hrs before check-in`
                        : "See hotel policy"
                    }
                  />
                  <PolicyRow
                    icon={<Users className="h-4 w-4" />}
                    label="Couples"
                    value={hotel.policy.couples_allowed ? "Allowed" : "Not allowed"}
                  />
                  <PolicyRow
                    icon={<PawPrint className="h-4 w-4" />}
                    label="Pets"
                    value={hotel.policy.pets_allowed ? "Allowed" : "Not allowed"}
                  />
                  <PolicyRow
                    icon={<Wifi className="h-4 w-4" />}
                    label="Local ID"
                    value={hotel.policy.local_id_accepted ? "Accepted" : "Not accepted"}
                  />
                </div>
                {hotel.policy.cancellation_policy_text && (
                  <p className="mt-4 text-xs text-ink-4 leading-relaxed">{hotel.policy.cancellation_policy_text}</p>
                )}
                {hotel.policy.house_rules && (
                  <p className="mt-2 text-xs text-ink-4 leading-relaxed">House rules: {hotel.policy.house_rules}</p>
                )}
              </section>
            )}
          </div>

          {/* ── Right column: room categories ───────────────── */}
          <aside className="space-y-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {hotel.room_categories.length === 0 && (
                <div className="bg-white border border-ink-7 rounded-2xl p-8 text-center">
                  <Info className="h-8 w-8 text-ink-4 mx-auto mb-3" />
                  <p className="text-sm text-ink-3">No rooms available to book right now.</p>
                </div>
              )}
              {hotel.room_categories.map((cat) => {
                const soldOut = cat.stop_sell || (cat.available_rooms != null && cat.available_rooms < roomsCount);
                const catImg = cat.images[0];
                const nightlyRates = cat.nightly_rates && cat.nightly_rates.length > 0 ? cat.nightly_rates : null;
                const displayRate = nightlyRates
                  ? Math.min(...nightlyRates.map((n) => n.rate))
                  : cat.base_price;
                const ratesVary = !!nightlyRates && new Set(nightlyRates.map((n) => n.rate)).size > 1;
                return (
                  <Card key={cat.id} variant="premium" hover lift="sm" className="group overflow-hidden">
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {catImg && (
                      <div className="relative h-40 bg-gradient-to-br from-primary-100 to-accent-100 overflow-hidden">
                        <img src={catImg} alt={cat.category_name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-ink">{cat.category_name}</h3>
                          <div className="text-xs text-ink-4 mt-0.5">
                            {[cat.bed_type, cat.view_type, cat.room_size_sqft ? `${cat.room_size_sqft} sq.ft` : null]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </div>
                        {soldOut ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
                            Sold out
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                            Available
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {cat.max_occupancy} guests
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5" /> {MEAL_LABELS[cat.meal_plan] ?? cat.meal_plan}
                        </span>
                        {cat.extra_bed_allowed && (
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" /> Extra bed ₹{INR(cat.extra_bed_charge)}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-ink-8 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] text-ink-4 uppercase tracking-wider">
                            {nightlyRates ? (ratesVary ? "From · per night" : "Per night · your dates") : "Per night"}
                          </div>
                          <div className="text-xl font-extrabold text-gradient-primary">{INR(displayRate)}</div>
                          {cat.published_price != null && cat.published_price > displayRate && (
                            <div className="text-xs text-ink-4 line-through">{INR(cat.published_price)}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={soldOut || quoting}
                          onClick={() => startBooking(cat)}
                          className="h-11 px-6 rounded-xl text-white text-sm font-bold inline-flex items-center gap-2 shadow-wt-primary hover:shadow-wt-glow-primary transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                          style={{ background: "linear-gradient(135deg,#1A56DB,#0E3FA0)" }}
                        >
                          {quoting && selectedCat?.id === cat.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <BedDouble className="h-4 w-4" />
                          )}
                          Book now
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}

              <MotionGlow color="primary" intensity={0.1} size={420} className="rounded-2xl">
              <div className="bg-gradient-to-br from-ink via-primary-900 to-ink text-white rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-2 text-sm font-bold mb-1.5">
                  <ShieldCheck className="h-4 w-4 text-accent-400" /> Book with confidence
                </div>
                <ul className="text-xs text-white/80 space-y-1.5">
                  <li>• Transparent pricing — GST shown at checkout</li>
                  <li>• Free cancellation up to the hotel's window</li>
                  <li>• Refunds credited straight to your wallet</li>
                </ul>
              </div>
              </MotionGlow>
            </div>
          </aside>
        </div>
      </Container>

      {/* ── Booking flow: auth gate → review modal ─────────── */}
      <BookingAuthGate
        open={authOpen}
        onClose={() => { setAuthOpen(false); setSelectedCat(null); setQuote(null); }}
        onAuthenticated={() => { setAuthOpen(false); setReviewOpen(true); }}
        heading="Sign in to book your stay"
        subheading="We'll keep your reservation safe under your account."
      />
      <HotelBookingReviewModal
        open={reviewOpen}
        onClose={() => { setReviewOpen(false); setSelectedCat(null); setQuote(null); }}
        hotelName={hotel.hotel_name}
        categoryName={selectedCat?.category_name ?? ""}
        checkIn={checkIn}
        checkOut={checkOut}
        nights={quote?.nights ?? nights}
        roomsCount={quote?.rooms_count ?? roomsCount}
        guests={guests}
        quote={quote}
        submitting={submitting}
        onConfirm={confirmBooking}
      />
      <HotelBookingSuccessModal
        open={!!successBooking}
        booking={successBooking}
        hotelName={hotel.hotel_name}
        categoryName={selectedCat?.category_name ?? ""}
        checkIn={checkIn}
        checkOut={checkOut}
        onViewBookings={() => { setSuccessBooking(null); router.push("/bookings"); }}
        onBrowseMore={() => { setSuccessBooking(null); router.push("/hotels"); }}
      />
    </div>
  );
}

function PolicyRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-ink-9/50 border border-ink-8 px-3.5 py-3">
      <span className="text-primary-600 mt-0.5">{icon}</span>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">{label}</div>
        <div className="text-sm font-semibold text-ink mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export default function HotelDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    }>
      <HotelContent />
    </Suspense>
  );
}
