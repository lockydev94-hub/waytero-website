"use client";

/**
 * TourBookingSuccessModal — post-booking confirmation for a tour package.
 *
 * Shown after POST /public/tours/bookings succeeds. Displays the booking
 * number + amount + trip dates, then auto-redirects to /bookings after a few
 * seconds (or immediately on "View my bookings"). Mirrors the hotel success
 * modal. Doc Ref: BRD_PART_5_TOUR_PACKAGE_MANAGEMENT §6, tour/api.py
 */

import { useEffect, useState } from "react";
import {
  CheckCircle2, CalendarRange, Users, MapPin, ArrowRight, PartyPopper,
} from "lucide-react";

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export interface TourBookingSuccessData {
  booking_number: string;
  master_booking_number?: string;
  total_amount?: number;
  package_name?: string;
  travel_start_date?: string;
  travel_end_date?: string;
  persons_count?: number;
  booking_status?: string;
}

export interface TourBookingSuccessModalProps {
  open: boolean;
  booking: TourBookingSuccessData | null;
  packageName: string;
  destination: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  pax: number;
  onViewBookings: () => void;
  onBrowseMore: () => void;
}

const AUTO_REDIRECT_SECONDS = 6;

export default function TourBookingSuccessModal({
  open,
  booking,
  packageName,
  destination,
  startDate,
  endDate,
  pax,
  onViewBookings,
  onBrowseMore,
}: TourBookingSuccessModalProps) {
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);

  useEffect(() => {
    if (!open || !booking) return;
    setCountdown(AUTO_REDIRECT_SECONDS);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          onViewBookings();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking?.booking_number]);

  if (!open || !booking) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-[#0B1B3B]/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Success banner */}
        <div className="relative bg-gradient-to-br from-violet-500 to-violet-700 px-8 pt-10 pb-8 text-center text-white overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative inline-flex h-20 w-20 rounded-full bg-white/20 items-center justify-center border-4 border-white/30">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="relative mt-4 text-2xl font-extrabold tracking-tight">Booking confirmed!</h2>
          <p className="relative mt-1 text-sm text-white/85">
            Your {packageName || "tour"} is reserved pending confirmation.
          </p>
        </div>

        {/* Details */}
        <div className="px-7 py-6 space-y-4">
          <div className="rounded-2xl border border-ink-8 bg-ink-9/50 p-4 space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-ink">
              <MapPin size={15} className="text-violet-600 flex-shrink-0" />
              <span className="font-bold truncate">{destination || packageName}</span>
            </div>
            {startDate && (
              <div className="flex items-center gap-2 text-ink-3">
                <CalendarRange size={15} className="text-violet-600 flex-shrink-0" />
                <span>{fmtDay(startDate)}{endDate ? ` → ${fmtDay(endDate)}` : ""}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-ink-3">
              <Users size={15} className="text-violet-600 flex-shrink-0" />
              <span>{pax} traveller{pax > 1 ? "s" : ""}</span>
            </div>
            {booking.total_amount != null && booking.total_amount > 0 && (
              <div className="border-t border-ink-8 pt-2.5 mt-1 flex items-center justify-between">
                <span className="text-ink-3">Amount payable</span>
                <span className="font-extrabold text-ink text-lg tabular-nums">{INR(booking.total_amount)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-violet-50 border border-violet-100 px-4 py-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Booking no.</div>
              <div className="font-mono text-sm font-bold text-ink mt-0.5">{booking.booking_number}</div>
            </div>
            <PartyPopper className="h-5 w-5 text-violet-600" />
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onViewBookings}
              className="h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 transition-all"
            >
              View my bookings
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={onBrowseMore}
              className="h-11 rounded-xl border border-ink-7 text-ink-2 hover:bg-ink-9 font-semibold text-sm"
            >
              Keep browsing tours
            </button>
          </div>

          <p className="text-center text-xs text-ink-4">
            Redirecting to your bookings in {countdown}s…
          </p>
        </div>
      </div>
    </div>
  );
}
