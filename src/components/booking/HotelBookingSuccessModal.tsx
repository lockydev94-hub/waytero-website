"use client";

/**
 * HotelBookingSuccessModal — post-booking confirmation.
 *
 * Shown after POST /public/hotel/create-booking succeeds. Displays the
 * reservation number + amount, then auto-redirects to /bookings after a few
 * seconds (or immediately on "View my bookings").
 *
 * Doc Ref: BRD Part 4 §57-92, public_hotel_api.py
 */

import { useEffect, useState } from "react";
import { CheckCircle2, Calendar, BedDouble, Hotel as HotelIcon, ArrowRight, PartyPopper } from "lucide-react";

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export interface HotelBookingSuccessData {
  master_booking_number: string;
  hotel_booking_number: string;
  reservation_number: string;
  status: string;
  total_amount: number;
  nights: number;
  rooms_count: number;
}

export interface HotelBookingSuccessModalProps {
  open: boolean;
  booking: HotelBookingSuccessData | null;
  hotelName: string;
  categoryName: string;
  checkIn: string;
  checkOut: string;
  onViewBookings: () => void;
  onBrowseMore: () => void;
}

const AUTO_REDIRECT_SECONDS = 6;

export default function HotelBookingSuccessModal({
  open,
  booking,
  hotelName,
  categoryName,
  checkIn,
  checkOut,
  onViewBookings,
  onBrowseMore,
}: HotelBookingSuccessModalProps) {
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
  }, [open, booking?.reservation_number]);

  if (!open || !booking) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-[#0B1B3B]/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Success banner */}
        <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 px-8 pt-10 pb-8 text-center text-white overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative inline-flex h-20 w-20 rounded-full bg-white/20 items-center justify-center border-4 border-white/30">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="relative mt-4 text-2xl font-extrabold tracking-tight">Booking confirmed!</h2>
          <p className="relative mt-1 text-sm text-white/85">
            Your stay at {hotelName} is reserved.
          </p>
        </div>

        {/* Details */}
        <div className="px-7 py-6 space-y-4">
          <div className="rounded-2xl border border-ink-8 bg-ink-9/50 p-4 space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-ink">
              <HotelIcon size={15} className="text-primary-600 flex-shrink-0" />
              <span className="font-bold truncate">{hotelName}</span>
            </div>
            <div className="flex items-center gap-2 text-ink-3">
              <BedDouble size={15} className="text-primary-600 flex-shrink-0" />
              <span>{categoryName || "Room"} · {booking.rooms_count} room{booking.rooms_count > 1 ? "s" : ""} · {booking.nights} night{booking.nights > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-ink-3">
              <Calendar size={15} className="text-primary-600 flex-shrink-0" />
              <span>{checkIn} → {checkOut}</span>
            </div>
            <div className="border-t border-ink-8 pt-2.5 mt-1 flex items-center justify-between">
              <span className="text-ink-3">Amount payable</span>
              <span className="font-extrabold text-ink text-lg tabular-nums">{INR(booking.total_amount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-primary-50 border border-primary-100 px-4 py-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Reservation no.</div>
              <div className="font-mono text-sm font-bold text-ink mt-0.5">{booking.reservation_number}</div>
            </div>
            <PartyPopper className="h-5 w-5 text-primary-600" />
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
              Keep browsing hotels
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
