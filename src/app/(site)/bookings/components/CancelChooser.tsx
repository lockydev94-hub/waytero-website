import { AlertTriangle, Wallet, Car, Hotel, MapPin } from "lucide-react";
import { CustomerBookingDetail } from "@/lib/cancellation";
import { Button, IconBox } from "@/components/ui";
import type { CancelTarget } from "./types";

/* ========================================================================
 * CancelChooser — modal that surfaces per-service cancel targets when the
 * user clicks Cancel on a booking that has more than one cancellable row.
 * ====================================================================== */
export default function CancelChooser({
  cancellableCabs,
  cancellableHotels,
  cancellableTours,
  bookingNumber,
  onPick,
  onClose,
}: {
  cancellableCabs: CustomerBookingDetail["cab_bookings"];
  cancellableHotels: CustomerBookingDetail["hotel_bookings"];
  cancellableTours: CustomerBookingDetail["tour_bookings"];
  bookingNumber: string;
  onPick: (target: CancelTarget) => void;
  onClose: () => void;
}) {
  const rowCls =
    "w-full text-left rounded-xl border border-ink-7 p-4 hover:border-danger/30 hover:bg-danger-soft/40 transition-colors";

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center sm:p-4 bg-[#0B1B3B]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-ink-8 flex-shrink-0">
          <div className="flex items-center gap-2 text-ink">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <h3 className="font-bold text-base">What would you like to cancel?</h3>
          </div>
          <p className="text-xs text-ink-4 mt-1.5">
            You can cancel the entire booking, or just one service. Refunds differ.
          </p>
        </div>
        <div className="px-6 py-5 space-y-2.5 overflow-y-auto flex-1">
          <button onClick={() => onPick({ kind: "whole", bookingNumber })} className={rowCls}>
            <div className="flex items-center gap-3">
              <IconBox icon={<Wallet />} tone="ink" size="sm" />
              <div className="min-w-0">
                <div className="font-bold text-sm text-ink">Entire booking</div>
                <div className="text-xs text-ink-4 truncate">
                  Cancel everything — all services refunded per policy.
                </div>
              </div>
            </div>
          </button>
          {cancellableCabs.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick({ kind: "cab", cabBookingNumber: c.booking_number })}
              className={rowCls}
            >
              <div className="flex items-center gap-3">
                <IconBox icon={<Car />} tone="primary" size="sm" />
                <div className="min-w-0">
                  <div className="font-bold text-sm text-ink truncate">
                    Cab · {c.booking_number}
                  </div>
                  <div className="text-xs text-ink-4 truncate">
                    {c.pickup_location} → {c.drop_location}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {cancellableHotels.map((h) => (
            <button
              key={h.id}
              onClick={() => onPick({ kind: "hotel", reservationNumber: h.reservation_number })}
              className={rowCls}
            >
              <div className="flex items-center gap-3">
                <IconBox icon={<Hotel />} tone="info" size="sm" />
                <div className="min-w-0">
                  <div className="font-bold text-sm text-ink truncate">
                    Hotel · {h.reservation_number}
                  </div>
                  <div className="text-xs text-ink-4 truncate">
                    {h.check_in_date} → {h.check_out_date}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {cancellableTours.map((t) => (
            <button
              key={t.id}
              onClick={() => onPick({ kind: "tour", tourBookingNumber: t.booking_number })}
              className={rowCls}
            >
              <div className="flex items-center gap-3">
                <IconBox icon={<MapPin />} tone="warning" size="sm" />
                <div className="min-w-0">
                  <div className="font-bold text-sm text-ink truncate">
                    Tour · {t.booking_number}
                  </div>
                  <div className="text-xs text-ink-4 truncate">
                    {t.package_name || t.destination || "Tour package"} · {t.travel_start_date}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-ink-8 flex-shrink-0">
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            Keep booking
          </Button>
        </div>
      </div>
    </div>
  );
}
