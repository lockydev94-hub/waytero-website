"use client";

/**
 * HotelBookingReviewModal — pre-booking summary for a hotel stay.
 *
 * Mirrors the cab BookingReviewModal: shows the server-quoted stay (per-night
 * breakdown + taxes), collects the primary guest's name/mobile, offers an
 * optional coupon preview, and hands the confirm action to the parent
 * (which calls POST /public/hotel/create-booking).
 *
 * Presentation-only — the parent owns the quote, dates and the onConfirm
 * handler. Doc Ref: BRD Part 4 §57-92, public_hotel_api.py
 */

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  X, Tag, Calendar, Users, BedDouble, Hotel as HotelIcon, Loader2,
  CheckCircle2, AlertCircle, Info, ShieldCheck,
} from "lucide-react";
import type { HotelQuoteOut } from "@/services/hotelService";

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export interface HotelBookingReviewModalProps {
  open: boolean;
  onClose: () => void;
  hotelName: string;
  categoryName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomsCount: number;
  guests: number;
  /** Server-computed quote for the stay (may be null while loading). */
  quote: HotelQuoteOut | null;
  submitting: boolean;
  onConfirm: (opts: { guest_name: string; guest_mobile?: string; coupon_code?: string; discount_amount?: number }) => Promise<void> | void;
}

export default function HotelBookingReviewModal({
  open,
  onClose,
  hotelName,
  categoryName,
  checkIn,
  checkOut,
  nights,
  roomsCount,
  guests,
  quote,
  submitting,
  onConfirm,
}: HotelBookingReviewModalProps) {
  const [coupon, setCoupon] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<
    { valid: boolean; discount_amount: number; final_amount: number; message: string } | null
  >(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestMobile, setGuestMobile] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCoupon("");
      setCouponResult(null);
      setCouponError(null);
      setGuestError(null);
    }
  }, [open, quote?.room_category_id]);

  const subtotal = quote?.total_amount ?? 0;
  const discount = couponResult?.valid ? Number(couponResult.discount_amount) : 0;
  const finalAmount = Math.max(0, subtotal - discount);

  if (!open) return null;

  const handleApplyCoupon = async () => {
    const code = coupon.trim();
    if (!code || !quote) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/public/coupon/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupon_code: code,
          service_type: "HOTEL",
          booking_amount: subtotal,
          customer_id: 0,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCouponResult(null);
        setCouponError(json?.detail ?? "Couldn't apply coupon");
      } else if (json.valid) {
        setCouponResult(json);
        toast.success(`Coupon applied — you save ₹${json.discount_amount}`);
      } else {
        setCouponResult(null);
        setCouponError(json.message || "Coupon not valid for this booking");
      }
    } catch (e) {
      setCouponResult(null);
      setCouponError(e instanceof Error ? e.message : "Couldn't apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleConfirm = () => {
    if (!guestName.trim()) {
      setGuestError("Primary guest name is required");
      return;
    }
    onConfirm({
      guest_name: guestName.trim(),
      guest_mobile: guestMobile.trim() || undefined,
      coupon_code: couponResult?.valid ? coupon : undefined,
      discount_amount: couponResult?.valid ? couponResult.discount_amount : undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center sm:p-4 bg-[#0B1B3B]/60 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="relative px-6 pt-6 pb-4 border-b border-ink-8 flex-shrink-0">
          <button
            onClick={() => !submitting && onClose()}
            className="absolute right-4 top-4 h-9 w-9 rounded-xl hover:bg-ink-9 inline-flex items-center justify-center text-ink-4 hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 inline-flex items-center justify-center">
              <HotelIcon size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink">Confirm your stay</h3>
              <p className="text-xs text-ink-4">{hotelName}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Stay summary */}
          <div className="rounded-xl border border-ink-8 bg-ink-9/40 p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Room</div>
              <div className="font-bold text-ink mt-0.5 truncate">{categoryName || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Dates</div>
              <div className="font-bold text-ink mt-0.5">
                {checkIn} → {checkOut}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Nights</div>
              <div className="font-bold text-ink mt-0.5 inline-flex items-center gap-1">
                <Calendar size={13} /> {nights}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Rooms · Guests</div>
              <div className="font-bold text-ink mt-0.5 inline-flex items-center gap-1">
                <BedDouble size={13} /> {roomsCount} · <Users size={13} /> {guests}
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          {quote && (
            <div className="rounded-xl bg-gradient-to-br from-ink-9/60 to-white border border-ink-8 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">
                <Info size={14} /> Price breakdown
              </div>
              {(quote.nightly ?? []).map((n) => (
                <div key={n.date} className="flex items-center justify-between text-xs text-ink-3">
                  <span>
                    {new Date(n.date + "T00:00:00").toLocaleDateString(undefined, {
                      weekday: "short", day: "2-digit", month: "short",
                    })}
                    {n.plan_name ? ` · ${n.plan_name}` : ""}
                  </span>
                  <span className="font-semibold text-ink tabular-nums">{INR(n.total_with_tax)}</span>
                </div>
              ))}
              <div className="border-t border-ink-8 pt-2 space-y-1 text-xs">
                {quote.base_amount > 0 && (
                  <div className="flex items-center justify-between text-ink-3">
                    <span>Room total {quote.rooms_count > 1 ? `(${quote.rooms_count} rooms)` : ""}</span>
                    <span className="tabular-nums">{INR(quote.base_amount)}</span>
                  </div>
                )}
                {quote.gst_amount > 0 && (
                  <div className="flex items-center justify-between text-ink-3">
                    <span>GST {quote.gst_percent > 0 ? `(${Number(quote.gst_percent).toFixed(1)}%)` : ""}</span>
                    <span className="tabular-nums">{INR(quote.gst_amount)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-semibold">
                    <span>Coupon discount</span>
                    <span className="tabular-nums">−{INR(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="font-bold text-ink">Total</span>
                  <span className="font-extrabold text-ink tabular-nums">{INR(finalAmount)}</span>
                </div>
                {quote.is_tax_invoice && (
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-4 pt-1">
                    <ShieldCheck size={12} className="text-emerald-500" /> Tax invoice issued — includes GST.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coupon */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1.5">
              Coupon (optional)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                <input
                  value={coupon}
                  onChange={(e) => { setCoupon(e.target.value); setCouponResult(null); setCouponError(null); }}
                  placeholder="Enter coupon code"
                  disabled={!!couponResult?.valid}
                  className="w-full h-10 rounded-xl border border-ink-7 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 disabled:bg-ink-9"
                />
              </div>
              {couponResult?.valid ? (
                <button
                  type="button"
                  onClick={() => { setCoupon(""); setCouponResult(null); }}
                  className="h-10 px-4 rounded-xl border border-ink-7 text-xs font-bold text-ink-3 hover:bg-ink-9"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!coupon.trim() || applyingCoupon}
                  className="h-10 px-4 rounded-xl bg-ink text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  {applyingCoupon && <Loader2 size={13} className="animate-spin" />}
                  Apply
                </button>
              )}
            </div>
            {couponError && <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {couponError}</p>}
            {couponResult?.valid && (
              <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                <CheckCircle2 size={12} /> You save {INR(couponResult.discount_amount)}!
              </p>
            )}
          </div>

          {/* Guest details */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1.5 block">
                Primary guest name *
              </span>
              <input
                value={guestName}
                onChange={(e) => { setGuestName(e.target.value); setGuestError(null); }}
                placeholder="Full name as per ID"
                className="w-full h-10 rounded-xl border border-ink-7 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600"
              />
              {guestError && <span className="text-xs text-rose-600 mt-1 block">{guestError}</span>}
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1.5 block">
                Mobile (optional)
              </span>
              <input
                value={guestMobile}
                onChange={(e) => setGuestMobile(e.target.value)}
                placeholder="For check-in updates"
                inputMode="tel"
                className="w-full h-10 rounded-xl border border-ink-7 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600"
              />
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-ink-8 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={() => !submitting && onClose()}
            className="px-4 h-11 rounded-xl border border-ink-7 text-ink-2 hover:bg-ink-9 font-semibold text-sm"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-6 h-11 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-white text-sm font-bold inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            Confirm &amp; book
          </button>
        </div>
      </div>
    </div>
  );
}
