"use client";

/**
 * TourBookingReviewModal — pre-booking summary for a tour package.
 *
 * Shows the package + trip summary (dates, travellers, price), collects the
 * primary traveller's name/mobile, and hands the confirm action to the parent
 * (which calls POST /public/tours/bookings). Mirrors the hotel review modal:
 * bottom-sheet on mobile, centered card on desktop, scrollable body.
 *
 * Presentation-only — the parent owns the quote, dates and onConfirm.
 * Doc Ref: BRD_PART_5_TOUR_PACKAGE_MANAGEMENT §6, tour/api.py
 */

import { useEffect, useState } from "react";
import {
  X, CalendarRange, Users, MapPin, Sparkles, Loader2,
  CheckCircle2, AlertCircle, Info,
} from "lucide-react";

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export interface TourBookingReviewModalProps {
  open: boolean;
  onClose: () => void;
  packageName: string;
  destination: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD (derived from start + duration) */
  endDate: string;
  durationDays: number;
  durationNights: number;
  pax: number;
  /** Server-computed quote (may be null while loading). */
  quote: { total_amount: number; commission_percent?: number } | null;
  submitting: boolean;
  onConfirm: (opts: { traveller_name: string; traveller_mobile?: string }) => Promise<void> | void;
}

export default function TourBookingReviewModal({
  open,
  onClose,
  packageName,
  destination,
  startDate,
  endDate,
  durationDays,
  durationNights,
  pax,
  quote,
  submitting,
  onConfirm,
}: TourBookingReviewModalProps) {
  const [travellerName, setTravellerName] = useState("");
  const [travellerMobile, setTravellerMobile] = useState("");
  const [travellerError, setTravellerError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTravellerError(null);
    }
  }, [open]);

  if (!open) return null;

  const total = quote?.total_amount ?? 0;
  const perPerson = total > 0 && pax > 0 ? Math.round(total / pax) : 0;

  const handleConfirm = () => {
    if (!travellerName.trim()) {
      setTravellerError("Primary traveller name is required");
      return;
    }
    onConfirm({
      traveller_name: travellerName.trim(),
      traveller_mobile: travellerMobile.trim() || undefined,
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
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink">Confirm your tour</h3>
              <p className="text-xs text-ink-4 truncate">{packageName}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Trip summary */}
          <div className="rounded-xl border border-ink-8 bg-ink-9/40 p-4 grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Route</div>
              <div className="font-bold text-ink mt-0.5 inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-violet-500" /> {destination}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Dates</div>
              <div className="font-bold text-ink mt-0.5 inline-flex items-center gap-1">
                <CalendarRange size={13} /> {fmtDay(startDate)} → {fmtDay(endDate)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Duration</div>
              <div className="font-bold text-ink mt-0.5">{durationDays}D / {durationNights}N</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Travellers</div>
              <div className="font-bold text-ink mt-0.5 inline-flex items-center gap-1">
                <Users size={13} /> {pax} traveller{pax > 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          {quote && (
            <div className="rounded-xl bg-gradient-to-br from-ink-9/60 to-white border border-ink-8 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">
                <Info size={14} /> Price breakdown
              </div>
              {perPerson > 0 && (
                <div className="flex items-center justify-between text-xs text-ink-3">
                  <span>Package rate</span>
                  <span className="font-semibold text-ink tabular-nums">{INR(perPerson)} / traveller</span>
                </div>
              )}
              <div className="border-t border-ink-8 pt-2 space-y-1 text-xs">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-ink">Total ({pax} travellers)</span>
                  <span className="font-extrabold text-ink tabular-nums">{INR(total)}</span>
                </div>
                {quote.commission_percent != null && (
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-4 pt-1">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Platform service & support included ({quote.commission_percent}%)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Primary traveller details */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1.5 block">
                Primary traveller name *
              </span>
              <input
                value={travellerName}
                onChange={(e) => { setTravellerName(e.target.value); setTravellerError(null); }}
                placeholder="Full name as per ID"
                className="w-full h-10 rounded-xl border border-ink-7 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600"
              />
              {travellerError && <span className="text-xs text-rose-600 mt-1 block">{travellerError}</span>}
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1.5 block">
                Mobile (optional)
              </span>
              <input
                value={travellerMobile}
                onChange={(e) => setTravellerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="For trip updates"
                inputMode="tel"
                className="w-full h-10 rounded-xl border border-ink-7 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600"
              />
            </label>
          </div>

          <p className="flex items-start gap-1.5 text-[11px] text-ink-4">
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            No payment is captured in this step. Admin confirms the itinerary and advance amount next.
          </p>
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
            Confirm & book
          </button>
        </div>
      </div>
    </div>
  );
}
