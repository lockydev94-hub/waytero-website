import { X, MapPin, Calendar, ChevronRight, Banknote } from "lucide-react";
import { CustomerBookingDetail } from "@/lib/cancellation";
import { Button, Card } from "@/components/ui";
import StatusBadge from "./StatusBadge";
import SummaryStat from "./SummaryStat";
import CabTripCard from "./CabTripCard";
import HotelStayCard from "./HotelStayCard";
import TourCard from "./TourCard";
import { fmtStayStamp } from "./format";

/* ========================================================================
 * BookingDetailCard — summary card for the selected booking.
 * Header chips show amount / pickup / drop / pickup time so the user can
 * read everything at a glance without scrolling. Each service row is read
 * only (icon + title + badge + amount). Cancel is a single master button
 * at the bottom of the card.
 * ====================================================================== */
export default function BookingDetailCard({
  detail,
  cancellableCount,
  onCancel,
}: {
  detail: CustomerBookingDetail;
  cancellableCount: number;
  onCancel: (() => void) | null;
}) {
  const cab = detail.cab_bookings[0];
  const hotel = detail.hotel_bookings[0];
  const total = detail.total_amount;
  const pickup = cab?.pickup_location || null;
  const drop = cab?.drop_location || null;
  // Prefer the property-recorded actual stamps; fall back to the booked window.
  const checkIn = hotel?.check_in_at_local || hotel?.actual_check_in_at || hotel?.check_in_date || null;
  const checkOut = hotel?.check_out_at_local || hotel?.actual_check_out_at || hotel?.check_out_date || null;

  return (
    <Card variant="premium" padded={false} className="overflow-hidden">
      <header className="relative px-5 sm:px-7 pt-6 pb-5 border-b border-ink-8 bg-gradient-to-r from-primary-50/40 via-white to-accent-50/30 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gradient-primary">Booking</div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-ink mt-1 truncate">
              {detail.booking_number}
            </h2>
            {detail.created_at && (
              <div className="text-xs text-ink-4 mt-1">
                Booked on {new Date(detail.created_at).toLocaleString()}
              </div>
            )}
          </div>
          <div className="text-right">
            <StatusBadge status={detail.booking_status} />
            <div className="text-[11px] text-ink-4 mt-2">
              Paid ₹{detail.total_paid_amount.toLocaleString()}
              {detail.total_refund_amount > 0 && (
                <> · Refunded ₹{detail.total_refund_amount.toLocaleString()}</>
              )}
            </div>
          </div>
        </div>

        {/* Summary chips */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <SummaryStat
            icon={<Banknote className="h-4 w-4" />}
            label="Total"
            value={`₹${total.toLocaleString()}`}
            tone="primary"
          />
          {pickup && (
            <SummaryStat
              icon={<MapPin className="h-4 w-4" />}
              label="Pickup"
              value={pickup.length > 28 ? pickup.slice(0, 28) + "…" : pickup}
            />
          )}
          {drop && (
            <SummaryStat
              icon={<ChevronRight className="h-4 w-4" />}
              label="Drop"
              value={drop.length > 28 ? drop.slice(0, 28) + "…" : drop}
            />
          )}
          {cab?.pickup_datetime && (
            <SummaryStat
              icon={<Calendar className="h-4 w-4" />}
              label="Pickup at"
              value={new Date(cab.pickup_datetime).toLocaleString(undefined, {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          )}
          {!cab && checkIn && (
            <SummaryStat
              icon={<Calendar className="h-4 w-4" />}
              label="Check-in"
              value={fmtStayStamp(checkIn)}
            />
          )}
          {!cab && checkOut && (
            <SummaryStat
              icon={<Calendar className="h-4 w-4" />}
              label="Check-out"
              value={fmtStayStamp(checkOut)}
            />
          )}
        </div>
      </header>

      {/* ── Service cards ───────────────────────────────── */}
      <div className="px-5 sm:px-7 py-5 sm:py-6 space-y-4">
        {detail.cab_bookings.map((c) => (
          <CabTripCard key={c.id} c={c} />
        ))}

        {detail.hotel_bookings.map((h) => (
          <HotelStayCard key={h.id} h={h} />
        ))}

        {detail.tour_bookings.map((t) => (
          <TourCard key={t.id} t={t} />
        ))}

        {detail.cab_bookings.length === 0 &&
          detail.hotel_bookings.length === 0 &&
          detail.tour_bookings.length === 0 && (
          <div className="rounded-xl bg-gradient-to-br from-ink-9/30 to-white border border-ink-8 p-4 text-sm text-ink-4">
            No services attached to this booking yet.
          </div>
        )}
      </div>

      {/* ── Single master "Cancel booking" footer ───────── */}
      <footer className="px-5 sm:px-7 py-5 border-t border-ink-8 bg-gradient-to-r from-ink-9/30 to-white flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-ink-4">
          {cancellableCount === 0 ? (
            <>This booking is no longer cancellable.</>
          ) : cancellableCount === 1 ? (
            <>One service can still be cancelled.</>
          ) : (
            <>{cancellableCount} services can still be cancelled — together or individually.</>
          )}
        </div>
        {onCancel && (
          <Button onClick={onCancel} variant="danger" size="md" leftIcon={<X size={16} />}>
            Cancel booking
          </Button>
        )}
      </footer>
    </Card>
  );
}
