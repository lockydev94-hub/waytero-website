"use client";

/**
 * BookingReviewModal — pre-booking summary with optional coupon preview.
 *
 * Shown immediately after BookingAuthGate returns a successful auth. This is
 * the last step before a booking exists, so every field the booking is created
 * with has to be settable here — the customer can:
 *   1. Read / edit the trip: pickup and return date-time, passengers, and
 *      instructions for the driver. Deep links (a route page or a landing
 *      page "Book now") arrive without a schedule, so without this step a
 *      booking would be filed for "right now" with no way to say otherwise.
 *   2. Enter a coupon code (optional). We call /coupons/validate to preview
 *      the discount — the coupon is not yet attached to the booking itself;
 *      that's a follow-up to wire coupon persistence into create-booking.
 *   3. Tap "Confirm & Book" to actually create the booking.
 *
 * The parent owns the trip fields (they drive the fare estimate) and the
 * onConfirm handler that hits createBooking; this component stages edits and
 * hands them back through onTripChange.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  X,
  Tag,
  MapPin,
  Calendar,
  Users,
  Car as CarIcon,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Pencil,
  Info,
} from "lucide-react";
import { cabService } from "@/services/cabService";
import type {
  CreateCabBookingIn,
  FareBreakdownItem,
  CouponApplyOut,
} from "@/services/cabService";
import { COUPON_FUNDING_LABELS } from "@/services/cabService";

export interface BookingReviewModalProps {
  open: boolean;
  onClose: () => void;
  /** Fare card the customer chose on the results page. */
  selected: FareBreakdownItem;
  /** All booking input fields (city, route, time, etc.). The parent owns
   *  the source of truth — we just show a summary and re-call onConfirm. */
  bookingDraft: Omit<CreateCabBookingIn, "vehicle_category_id" | "estimated_distance_km" | "passenger_count">;
  pickupLabel: string;
  dropLabel?: string;
  /** Trip fields the customer sets or edits in this step. "" = not chosen. */
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  /** Round trip / cab rent carry an end, so the schedule needs both ends. */
  needsReturn: boolean;
  passengerCount: number;
  /** Seats in the chosen cab — the passenger count can't exceed it. */
  maxPassengers: number;
  notes: string;
  onTripChange: (next: {
    date: string;
    time: string;
    returnDate: string;
    returnTime: string;
    passengers: number;
    notes: string;
  }) => void;
  submitting: boolean;
  /** Coupon code carried from an offer page (?coupon=) — pre-filled and
   *  auto-validated once per open. Server still re-validates at booking. */
  initialCoupon?: string;
  /** Offer title carried from the offer page — display-only context chip. */
  offerTitle?: string;
  onConfirm: (opts: { coupon_code?: string; discount_amount?: number }) => Promise<void> | void;
}

export default function BookingReviewModal({
  open,
  onClose,
  selected,
  bookingDraft,
  pickupLabel,
  dropLabel,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  needsReturn,
  passengerCount,
  maxPassengers,
  notes,
  onTripChange,
  submitting,
  initialCoupon,
  offerTitle,
  onConfirm,
}: BookingReviewModalProps) {
  const [coupon, setCoupon] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponApplyOut | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // ── Trip detail editing ──────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [dDate, setDDate] = useState(pickupDate);
  const [dTime, setDTime] = useState(pickupTime);
  const [dReturnDate, setDReturnDate] = useState(returnDate);
  const [dReturnTime, setDReturnTime] = useState(returnTime);
  const [dPax, setDPax] = useState(passengerCount);
  const [dNotes, setDNotes] = useState(notes);
  const [editError, setEditError] = useState<string | null>(null);
  const scheduled = Boolean(pickupDate && pickupTime);

  // A closed editor follows the parent's values (the fare is re-quoted after a
  // save, and the trip can also change from the results page behind us).
  useEffect(() => {
    if (editing) return;
    setDDate(pickupDate);
    setDTime(pickupTime);
    setDReturnDate(returnDate);
    setDReturnTime(returnTime);
    setDPax(passengerCount);
    setDNotes(notes);
    setEditError(null);
  }, [open, editing, pickupDate, pickupTime, returnDate, returnTime, passengerCount, notes]);

  const startEditing = () => {
    setDDate(pickupDate);
    setDTime(pickupTime);
    setDReturnDate(returnDate);
    setDReturnTime(returnTime);
    setDPax(passengerCount);
    setDNotes(notes);
    setEditError(null);
    setEditing(true);
  };

  /** Local ISO date (not UTC) — the customer picks a wall-clock day. */
  const todayISO = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")}`;
  };

  const saveTripDetails = () => {
    if (!dDate || !dTime) {
      setEditError("Choose when the cab should pick you up.");
      return;
    }
    const start = new Date(`${dDate}T${dTime}`);
    if (!Number.isFinite(start.getTime())) {
      setEditError("That pickup time isn't valid.");
      return;
    }
    // A minute of slack so "now" isn't rejected while the customer types.
    if (start.getTime() < Date.now() - 60_000) {
      setEditError("Pickup can't be in the past.");
      return;
    }
    if (needsReturn) {
      if (!dReturnDate || !dReturnTime) {
        setEditError(
          needsReturn && bookingDraft.trip_type === "ROUND_TRIP"
            ? "A round trip needs a return date and time."
            : "Say when the rental ends.",
        );
        return;
      }
      const end = new Date(`${dReturnDate}T${dReturnTime}`);
      if (!Number.isFinite(end.getTime()) || end <= start) {
        setEditError("The return must be after the pickup.");
        return;
      }
    }
    onTripChange({
      date: dDate,
      time: dTime,
      returnDate: needsReturn ? dReturnDate : "",
      returnTime: needsReturn ? dReturnTime : "",
      passengers: dPax,
      notes: dNotes.trim(),
    });
    setEditing(false);
    setEditError(null);
  };

  const couponRequest = useRef(0);
  const bookingKey = JSON.stringify([bookingDraft, passengerCount, selected.vehicle_category_id, selected.total]);
  // A changed trip invalidates both the preview and any in-flight response.
  useEffect(() => {
    couponRequest.current += 1;
    setCoupon("");
    setCouponResult(null);
    setCouponError(null);
    setApplyingCoupon(false);
    return () => { couponRequest.current += 1; };
  }, [open, bookingKey]);

  const subtotal = useMemo(() => Number(selected.total ?? 0), [selected.total]);
  const discount = couponResult?.valid ? Number(couponResult.discount_amount) : 0;
  // Server owns the payable total — booking creation re-validates with the
  // same rules, so never recompute the discount client-side.
  const finalAmount = couponResult?.valid
    ? Math.max(0, Number(couponResult.final_amount))
    : subtotal;

  const applyCouponCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;
    const request = ++couponRequest.current;
    setApplyingCoupon(true);
    setCouponResult(null);
    setCouponError(null);
    try {
      const res = await cabService.applyCoupon({
        coupon_code: code,
        service_type: "CAB",
        vehicle_category_id: selected.vehicle_category_id,
        city_id: bookingDraft.city_id,
        pickup_datetime: bookingDraft.pickup_datetime,
        return_datetime: bookingDraft.return_datetime,
        booking_amount: subtotal,
      });
      if (request !== couponRequest.current) return;
      if (res.valid) {
        setCouponResult(res);
        toast.success(`Coupon applied — you save ${INR(res.discount_amount)}`);
      } else {
        setCouponError(res.message || "Coupon not valid for this booking");
      }
    } catch (e) {
      if (request === couponRequest.current) {
        setCouponError(e instanceof Error ? e.message : "Couldn't apply coupon");
      }
    } finally {
      if (request === couponRequest.current) setApplyingCoupon(false);
    }
  };

  // Offer ride-through: seed + auto-validate the carried coupon once per
  // open. An invalid code surfaces through the normal inline error — never
  // silently dropped.
  const seeded = useRef(false);
  useEffect(() => {
    if (!open) {
      seeded.current = false;
      return;
    }
    if (initialCoupon && !seeded.current) {
      seeded.current = true;
      setCoupon(initialCoupon.toUpperCase());
      void applyCouponCode(initialCoupon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCoupon]);

  if (!open) return null;

  const handleApplyCoupon = () => applyCouponCode(coupon);

  const handleRemoveCoupon = () => {
    setCoupon("");
    setCouponResult(null);
    setCouponError(null);
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center sm:p-4 bg-[#0B1B3B]/60 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_24px_80px_rgba(11,27,59,0.35)] w-full sm:max-w-md md:max-w-lg max-h-[92dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-5 sm:px-7 pt-6 sm:pt-7 pb-5 border-b border-ink-8 flex-shrink-0">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="absolute right-4 top-4 h-9 w-9 rounded-xl hover:bg-ink-9 flex items-center justify-center text-ink-4 hover:text-ink transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-xl font-extrabold text-ink tracking-tight">Review your booking</h3>
          <p className="mt-1 text-sm text-ink-3">Confirm the trip details and apply any coupon before booking.</p>
        </div>

        <div className="px-5 sm:px-7 py-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {/* ── Trip summary + editor ─────────────────────── */}
          <div className="rounded-2xl border border-ink-7 bg-ink-9/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-4">
                Trip details
              </span>
              <button
                type="button"
                onClick={() => (editing ? setEditing(false) : startEditing())}
                disabled={submitting}
                className="inline-flex items-center gap-1 rounded-lg border border-ink-7 bg-white px-2.5 py-1 text-[11px] font-bold text-ink-2 hover:border-primary-600 hover:text-primary-700 disabled:opacity-60"
              >
                {editing ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                {editing ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-ink-4">Pickup</div>
                <div className="text-sm font-semibold text-ink truncate">{pickupLabel || "—"}</div>
              </div>
            </div>
            {dropLabel && (
              <div className="flex items-start gap-3">
                <ArrowRight className="h-4 w-4 text-ink-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-4">Drop</div>
                  <div className="text-sm font-semibold text-ink truncate">{dropLabel}</div>
                </div>
              </div>
            )}

            {editing ? (
              <div className="space-y-3 rounded-xl border border-ink-7 bg-white p-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-4">
                    Pickup date &amp; time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dDate}
                      min={todayISO()}
                      onChange={(e) => {
                        setDDate(e.target.value);
                        setEditError(null);
                      }}
                      className="h-10 w-full rounded-xl border border-ink-7 bg-white px-3 text-sm font-semibold text-ink focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/15"
                      disabled={submitting}
                    />
                    <input
                      type="time"
                      value={dTime}
                      onChange={(e) => {
                        setDTime(e.target.value);
                        setEditError(null);
                      }}
                      className="h-10 w-full rounded-xl border border-ink-7 bg-white px-3 text-sm font-semibold text-ink focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/15"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {needsReturn && (
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-4">
                      {bookingDraft.trip_type === "ROUND_TRIP" ? "Return date & time" : "Rental ends"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={dReturnDate}
                        min={dDate || todayISO()}
                        onChange={(e) => {
                          setDReturnDate(e.target.value);
                          setEditError(null);
                        }}
                        className="h-10 w-full rounded-xl border border-ink-7 bg-white px-3 text-sm font-semibold text-ink focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/15"
                        disabled={submitting}
                      />
                      <input
                        type="time"
                        value={dReturnTime}
                        onChange={(e) => {
                          setDReturnTime(e.target.value);
                          setEditError(null);
                        }}
                        className="h-10 w-full rounded-xl border border-ink-7 bg-white px-3 text-sm font-semibold text-ink focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/15"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-4">
                    Passengers
                  </label>
                  <select
                    value={dPax}
                    onChange={(e) => setDPax(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-ink-7 bg-white px-3 text-sm font-semibold text-ink focus:border-primary-600 focus:outline-none"
                    disabled={submitting}
                  >
                    {Array.from(
                      { length: Math.max(1, Math.min(maxPassengers, 12)) },
                      (_, i) => i + 1,
                    ).map((n) => (
                      <option key={n} value={n}>
                        {n} passenger{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-4">
                    Note for the driver (optional)
                  </label>
                  <textarea
                    value={dNotes}
                    onChange={(e) => setDNotes(e.target.value.slice(0, 300))}
                    rows={2}
                    placeholder="Landmark, luggage, child seat…"
                    className="w-full rounded-xl border border-ink-7 bg-white px-3 py-2 text-sm text-ink focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/15"
                    disabled={submitting}
                  />
                </div>

                {editError && (
                  <div className="flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={saveTripDetails}
                  disabled={submitting}
                  className="h-10 w-full rounded-xl bg-ink text-sm font-bold text-white hover:bg-ink/90 disabled:opacity-60"
                >
                  Save trip details
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-ink-7">
                <div className="col-span-2 flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-ink-4 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold uppercase tracking-wider text-ink-4">
                      {needsReturn ? "Pickup · return" : "Pickup at"}
                    </div>
                    {scheduled ? (
                      <div className="font-semibold text-ink">
                        {formatDateTime(pickupDate, pickupTime)}
                        {needsReturn && returnDate && returnTime && (
                          <> → {formatDateTime(returnDate, returnTime)}</>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startEditing}
                        className="font-bold text-primary-700 underline underline-offset-2"
                      >
                        Choose pickup date &amp; time
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-ink-4 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold uppercase tracking-wider text-ink-4">Seats</div>
                    <div className="font-semibold text-ink">{passengerCount}</div>
                  </div>
                </div>
              </div>
            )}

            {!editing && notes && (
              <div className="flex items-start gap-2 border-t border-ink-7 pt-3 text-xs text-ink-3">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span className="min-w-0 break-words">{notes}</span>
              </div>
            )}
          </div>

          {!scheduled && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>Pick a pickup date and time so the cab reaches you when you need it.</span>
            </div>
          )}

          {/* ── Cab + fare card ───────────────────────────── */}
          <div className="rounded-2xl border border-ink-7 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 inline-flex items-center justify-center">
                <CarIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold text-ink truncate">
                  {selected.category_name}
                </div>
                <div className="text-xs text-ink-4">
                  {selected.seating_capacity ?? 4} seats · {selected.minimum_km} km included
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Upfront fare</div>
                <div className="text-base font-extrabold text-ink">{INR(subtotal)}</div>
              </div>
            </div>
          </div>

          {/* ── Coupon block ──────────────────────────────── */}
          <div className="rounded-2xl border border-ink-7 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-primary-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
                {offerTitle ? "Coupon from your offer" : "Have a coupon?"}
              </span>
            </div>
            {offerTitle && !couponResult?.valid && (
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-50 border border-primary-600/15 px-2.5 py-1 text-[11px] font-bold text-primary-700">
                <Sparkles className="h-3 w-3" /> Via Offer: {offerTitle}
              </div>
            )}
            {couponResult?.valid ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-800">{coupon.toUpperCase()} applied</div>
                    <div className="text-xs text-emerald-700">{couponResult.message}</div>
                    {couponResult.coupon_type !== "PLATFORM" && (
                      <div className="text-[11px] text-emerald-600/80 mt-0.5">
                        {COUPON_FUNDING_LABELS[couponResult.coupon_type]}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                  disabled={submitting}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    placeholder="Enter coupon code"
                    className="flex-1 h-11 rounded-xl bg-white border border-ink-7 px-4 text-sm font-bold uppercase tracking-wider focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15"
                    disabled={submitting || applyingCoupon}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!coupon.trim() || applyingCoupon || submitting}
                    className="h-11 px-5 rounded-xl bg-ink text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60 hover:bg-ink/90"
                  >
                    {applyingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
                {couponError && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{couponError}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Final total ────────────────────────────────── */}
          <div className="rounded-2xl bg-ink text-white p-5">
            {couponResult?.valid && (
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <span className="text-xs uppercase tracking-wider text-white/60">Subtotal</span>
                <span className="text-sm line-through text-white/60">{INR(subtotal)}</span>
              </div>
            )}
            {couponResult?.valid && (
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <span className="text-xs uppercase tracking-wider text-emerald-300">Coupon discount</span>
                <span className="text-sm font-bold text-emerald-300">− {INR(discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-white/60">
                  {couponResult?.valid ? "Total payable" : "Upfront fare"}
                </div>
                <div className="text-xs text-white/60 mt-1">GST added at trip close</div>
              </div>
              <div className="text-3xl font-extrabold">{INR(finalAmount)}</div>
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-7 pb-6 sm:pb-7 flex-shrink-0 border-t border-ink-8 pt-4 bg-white">
          <button
            type="button"
            onClick={() =>
              onConfirm(
                couponResult?.valid
                  ? { coupon_code: coupon.trim(), discount_amount: discount }
                  : {},
              )
            }
            disabled={submitting || applyingCoupon || editing || !scheduled}
            title={!scheduled ? "Choose a pickup date and time first" : undefined}
            className="w-full h-12 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(240,90,34,0.40)] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {submitting ? "Creating booking…" : "Confirm & Book"}
          </button>
          <p className="mt-3 text-[11px] text-center text-ink-4">
            Your booking is free to cancel before driver acceptance.
          </p>
        </div>
      </div>
    </div>
  );
}

// Local helpers — kept in-file so we don't pull INR into another module
// import just for one number format.
function INR(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/** "2026-11-21" + "09:30" → "21 Nov, 9:30 am" (IST wall clock, as chosen). */
function formatDateTime(date: string, time: string): string {
  const d = new Date(`${date}T${time}`);
  if (Number.isNaN(d.getTime())) return `${date} ${time}`.trim();
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}