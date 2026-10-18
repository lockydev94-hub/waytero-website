import { ChevronRight } from "lucide-react";
import type { CustomerBookingSummary } from "@/lib/cancellation";
import StatusBadge from "./StatusBadge";

/**
 * BookingSummaryCard — one selectable tile in the bookings grid.
 */
export default function BookingSummaryCard({
  booking,
  selected,
  onSelect,
}: {
  booking: CustomerBookingSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group w-full text-left rounded-2xl border bg-white p-4 transition-all duration-200 ease-[var(--ease-wt)] hover:-translate-y-0.5 hover:shadow-wt-sm ${
        selected
          ? "border-primary-500 ring-2 ring-primary-600/15"
          : "border-ink-7 hover:border-primary-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-bold text-sm text-ink truncate">{booking.booking_number}</span>
        <StatusBadge status={booking.booking_status} compact />
      </div>

      <div className="mt-2.5 flex gap-1 flex-wrap">
        {booking.services.map((s) => (
          <span
            key={s}
            className="px-2 py-0.5 rounded-md bg-ink-9 text-ink-3 text-[10px] font-bold uppercase tracking-wider"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <div className="text-base font-extrabold text-gradient-primary tabular-nums">
            ₹{booking.total_amount.toLocaleString("en-IN")}
          </div>
          {booking.journey_start_date && (
            <div className="text-[11px] text-ink-4">
              {new Date(booking.journey_start_date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700">
          Details
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
