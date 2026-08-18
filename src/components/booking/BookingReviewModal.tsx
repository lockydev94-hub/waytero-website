"use client";

/**
 * BookingReviewModal — pre-booking summary with optional coupon preview.
 *
 * Shown immediately after BookingAuthGate returns a successful auth. The
 * customer can:
 *   1. Read the trip summary (route, time, distance, fare breakdown).
 *   2. Enter a coupon code (optional). We call /coupons/validate to preview
 *      the discount — the coupon is not yet attached to the booking itself;
 *      that's a follow-up to wire coupon persistence into create-booking.
 *   3. Tap "Confirm & Book" to actually create the booking.
 *
 * This component is presentation-only; parent owns selected fare + token +
 * coupon state and the onConfirm handler that hits createBooking.
 */

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { cabService } from "@/services/cabService";
import type {
  CreateCabBookingIn,
  FareBreakdownItem,
} from "@/services/cabService";

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
  pickupDateLabel?: string;
  pickupTimeLabel?: string;
  passengerCount: number;
  submitting: boolean;
  onConfirm: (opts: { coupon_code?: string; discount_amount?: number }) => Promise<void> | void;
}

export default function BookingReviewModal({
  open,
  onClose,
  selected,
  bookingDraft,
  pickupLabel,
  dropLabel,
  pickupDateLabel,
  pickupTimeLabel,
  passengerCount,
  submitting,
  onConfirm,
}: BookingReviewModalProps) {
  const [coupon, setCoupon] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<
    { valid: boolean; discount_amount: number; final_amount: number; message: string } | null
  >(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Reset coupon state whenever we re-open with a different selection.
  useEffect(() => {
    if (open) {
      setCoupon("");
      setCouponResult(null);
      setCouponError(null);
    }
  }, [open, selected.vehicle_category_id]);

  const subtotal = useMemo(() => Number(selected.total ?? 0), [selected.total]);
  const discount = couponResult?.valid ? Number(couponResult.discount_amount) : 0;
  const finalAmount = Math.max(0, subtotal - discount);

  if (!open) return null;

  const handleApplyCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      // /coupons/validate needs customer_id. For new Firebase accounts we
      // won't have a customer row yet — it's lazily created on first
      // booking creation. Use 0 as a sentinel; the backend treats it as
      // "no per-customer limit to check" for new accounts. (If admin later
      // requires whitelist enforcement we can swap to the real id once the
      // booking has been created and the parent passes the new id in.)
      const res = await cabService.applyCoupon({
        coupon_code: code,
        service_type: "CAB",
        vehicle_category_id: selected.vehicle_category_id,
        city_id: bookingDraft.city_id,
        booking_amount: subtotal,
        customer_id: 0,
      });
      if (res.valid) {
        setCouponResult(res);
        toast.success(`Coupon applied — you save ₹${res.discount_amount}`);
      } else {
        setCouponResult(null);
        setCouponError(res.message || "Coupon not valid for this booking");
      }
    } catch (e) {
      setCouponError(e instanceof Error ? e.message : "Couldn't apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

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
          {/* ── Trip summary card ─────────────────────────── */}
          <div className="rounded-2xl border border-ink-7 bg-ink-9/30 p-4 space-y-3">
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
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-ink-7">
              {(pickupDateLabel || pickupTimeLabel) && (
                <div className="col-span-2 flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-ink-4 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold uppercase tracking-wider text-ink-4">Pickup at</div>
                    <div className="font-semibold text-ink">
                      {pickupDateLabel ?? ""}
                      {pickupDateLabel && pickupTimeLabel ? " · " : ""}
                      {pickupTimeLabel ?? ""}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-ink-4 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-bold uppercase tracking-wider text-ink-4">Seats</div>
                  <div className="font-semibold text-ink">{passengerCount}</div>
                </div>
              </div>
            </div>
          </div>

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
                Have a coupon?
              </span>
            </div>
            {couponResult?.valid ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-800">{coupon.toUpperCase()} applied</div>
                    <div className="text-xs text-emerald-700">{couponResult.message}</div>
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
            disabled={submitting}
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