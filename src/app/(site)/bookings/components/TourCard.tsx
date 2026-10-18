import { useState } from "react";
import {
  MapPin, Calendar, Info, Banknote, Receipt, Download, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { customerCancellationService, CustomerBookingDetail } from "@/lib/cancellation";
import { Badge, IconBox } from "@/components/ui";
import StatusBadge from "./StatusBadge";
import { fmtStayStamp, pdfErrorMsg, savePdfBlob } from "./format";

/* ========================================================================
 * TourCard — one expanded card per tour booking. Package identity, travel
 * window, a status strip (the itinerary/invoice buttons only surface for
 * statuses where each document makes sense), the payment position, and the
 * itinerary + invoice downloads.
 * ====================================================================== */
export default function TourCard({ t }: { t: CustomerBookingDetail["tour_bookings"][number] }) {
  const [busy, setBusy] = useState<string | null>(null);

  const title = t.package_name || `Tour · ${t.booking_number}`;
  const durationLine = [
    t.duration_days > 0 ? `${t.duration_days} days` : null,
    t.duration_nights > 0 ? `${t.duration_nights} nights` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const statusNote =
    t.booking_status === "PENDING_CONFIRMATION"
      ? "Awaiting partner confirmation — we'll notify you once accepted."
      : t.booking_status === "CONFIRMED"
        ? "Confirmed! Your itinerary is ready to download."
        : t.booking_status === "IN_PROGRESS"
          ? "Your tour is on the move."
          : t.booking_status === "COMPLETED"
            ? "Trip completed. Thank you for travelling with WayTero!"
            : t.booking_status === "CANCELLED"
              ? "This tour was cancelled."
              : "Tour booking.";

  const canItinerary = t.itinerary_days > 0 && t.booking_status !== "CANCELLED";
  const canInvoice = !!t.invoice_number && t.booking_status !== "CANCELLED";

  const download = async (kind: "itinerary" | "invoice") => {
    setBusy(kind);
    try {
      if (kind === "itinerary") {
        await savePdfBlob(
          () => customerCancellationService.downloadTourItinerary(t.booking_number),
          `TourItinerary_${t.booking_number}.pdf`,
        );
      } else {
        await savePdfBlob(
          () => customerCancellationService.downloadTourInvoice(t.booking_number),
          `TourInvoice_${t.invoice_number || t.booking_number}.pdf`,
        );
      }
      toast.success(kind === "itinerary" ? "Itinerary downloaded." : "Invoice downloaded.");
    } catch (e) {
      toast.error(await pdfErrorMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const payStatus: { tone: "success" | "warning" | "danger"; label: string } =
    t.balance_due <= 0 && (t.advance_total > 0 || t.payment_status === "PAID")
      ? { tone: "success", label: "Paid" }
      : t.advance_total > 0
        ? { tone: "warning", label: "Advance paid" }
        : { tone: "danger", label: "Payment pending" };

  return (
    <div className="group rounded-xl border border-ink-8 bg-white overflow-hidden transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-wt-sm">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <IconBox icon={<MapPin />} tone="warning" size="sm" gradient className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold text-sm text-ink truncate">{title}</div>
              <div className="text-[11px] text-ink-4 truncate">
                {t.booking_number}
                {t.destination ? ` · ${t.destination}` : ""}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {t.total_amount > 0 && (
                <div className="text-sm font-extrabold text-ink tabular-nums">
                  ₹{t.total_amount.toLocaleString("en-IN")}
                </div>
              )}
              <StatusBadge status={t.booking_status} compact />
            </div>
          </div>

          <div className="text-xs text-ink-3 mt-1 flex items-center gap-1.5 flex-wrap">
            <Calendar className="h-3 w-3 text-ink-4 flex-shrink-0" />
            <span>
              {fmtStayStamp(t.travel_start_date)} → {fmtStayStamp(t.travel_end_date)}
            </span>
            {t.persons_count > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-ink-9 text-ink-4 text-[10px] font-bold uppercase tracking-wider">
                {t.persons_count} pax
              </span>
            )}
            {durationLine && <span className="text-ink-4">{durationLine}</span>}
          </div>

          {t.pickup_location && (
            <div className="text-[11px] text-ink-4 mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" /> Pickup: {t.pickup_location}
              {t.pickup_datetime && ` · ${fmtStayStamp(t.pickup_datetime)}`}
            </div>
          )}

          {/* Status strip */}
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-3">
            <Info className="h-3 w-3 text-ink-4 flex-shrink-0" />
            <span>{statusNote}</span>
          </div>
        </div>
      </div>

      {/* ── Payment + documents ───────────────────────────── */}
      {(t.advance_payments.length > 0 || t.balance_due > 0 || t.charges.length > 0 || canItinerary || canInvoice) && (
        <div className="px-4 sm:px-5 pt-3 pb-4 border-t border-ink-8 bg-gradient-to-b from-ink-9/30 to-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-3">
              <Banknote className="h-3.5 w-3.5" /> Payment
            </div>
            <Badge tone={payStatus.tone} size="sm">
              {payStatus.label}
            </Badge>
          </div>

          {t.advance_payments.length > 0 && (
            <ul className="mt-2 space-y-1">
              {t.advance_payments.map((ap) => (
                <li key={ap.receipt_number} className="flex items-center justify-between text-xs text-ink-3">
                  <span className="flex items-center gap-1.5 truncate">
                    <Receipt className="h-3 w-3 text-ink-4 flex-shrink-0" />
                    <span className="truncate">{ap.receipt_number}</span>
                    <span className="text-ink-4">{ap.payment_mode}</span>
                    {ap.collected_at && (
                      <span className="text-[10px] text-ink-4 hidden sm:inline">
                        {new Date(ap.collected_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-ink tabular-nums">₹{ap.amount.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          )}

          {t.charges.length > 0 && (
            <ul className="mt-2 space-y-1">
              {t.charges.map((ch) => (
                <li key={ch.label + ch.amount} className="flex items-center justify-between text-xs text-ink-3">
                  <span className="truncate">
                    {ch.label}
                    {ch.reason ? <span className="text-ink-4"> · {ch.reason}</span> : null}
                  </span>
                  <span className="font-bold text-ink tabular-nums">₹{ch.amount.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 pt-2 border-t border-ink-8 space-y-1">
            {t.additional_amount > 0 && (
              <div className="flex justify-between text-xs text-ink-3">
                <span>Additional charges</span>
                <span className="tabular-nums">₹{t.additional_amount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-ink">
              <span>Total</span>
              <span className="tabular-nums">₹{t.total_amount.toLocaleString("en-IN")}</span>
            </div>
            {t.advance_total > 0 && (
              <div className="flex justify-between text-xs text-success">
                <span>Advance paid</span>
                <span className="tabular-nums">− ₹{t.advance_total.toLocaleString("en-IN")}</span>
              </div>
            )}
            {t.balance_due > 0 && (
              <div className="flex justify-between text-xs font-bold text-danger">
                <span>Balance due</span>
                <span className="tabular-nums">₹{t.balance_due.toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>

          {(canItinerary || canInvoice) && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {canItinerary && (
                <button
                  type="button"
                  onClick={() => download("itinerary")}
                  disabled={busy !== null}
                  className="h-10 rounded-xl border border-ink-7 text-ink text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-ink-9 hover:border-primary-300 disabled:opacity-50 transition-colors"
                >
                  {busy === "itinerary" ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  Download itinerary
                  {t.itinerary_days > 0 && <span className="opacity-60">· {t.itinerary_days} days</span>}
                </button>
              )}
              {canInvoice && (
                <button
                  type="button"
                  onClick={() => download("invoice")}
                  disabled={busy !== null}
                  className="h-10 rounded-xl bg-ink text-white text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-ink-700 disabled:opacity-50 transition-colors"
                >
                  {busy === "invoice" ? <RefreshCw size={14} className="animate-spin" /> : <Receipt size={14} />}
                  Download invoice
                  {t.invoice_number && <span className="opacity-70">· {t.invoice_number}</span>}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
