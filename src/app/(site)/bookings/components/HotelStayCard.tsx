import { useState } from "react";
import {
  Hotel, Calendar, Banknote, Receipt, Download, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { customerCancellationService, CustomerBookingDetail } from "@/lib/cancellation";
import { Badge, IconBox } from "@/components/ui";
import StatusBadge from "./StatusBadge";
import { fmtStayStamp, pdfErrorMsg, savePdfBlob } from "./format";

/* ========================================================================
 * HotelStayCard — one expanded card per hotel reservation. Shows the booked
 * window AND the actual check-in/out stamps the property recorded, the full
 * price breakdown, the payment trail, and the invoice download once the
 * stay is billed.
 * ====================================================================== */
export default function HotelStayCard({ h }: { h: CustomerBookingDetail["hotel_bookings"][number] }) {
  const [downloading, setDownloading] = useState(false);

  const title = h.hotel_name || `Hotel · ${h.reservation_number}`;
  const roomLine = [
    h.room_category_name || h.room_type,
    h.nights > 0 ? `${h.nights} night${h.nights > 1 ? "s" : ""}` : null,
    h.rooms_count > 1 ? `${h.rooms_count} rooms` : h.rooms_count === 1 ? "1 room" : null,
    h.adults_count > 0 ? `${h.adults_count} guest${h.adults_count > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const actualIn = h.check_in_at_local || h.actual_check_in_at;
  const actualOut = h.check_out_at_local || h.actual_check_out_at;
  const bookedRange =
    h.check_in_date && h.check_out_date
      ? `${new Date(h.check_in_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} → ${new Date(h.check_out_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
      : null;

  const payStatus: { tone: "success" | "warning" | "danger"; label: string } =
    h.payment_collected_status === "PAID"
      ? { tone: "success", label: "Fully paid" }
      : h.payment_collected_status === "PARTIAL"
        ? { tone: "warning", label: "Partially paid" }
        : { tone: "danger", label: "Payment pending" };
  const canDownload =
    !!h.invoice_number &&
    ["CHECKED_OUT", "COMPLETED", "SETTLED"].includes(h.reservation_status);

  const download = async () => {
    setDownloading(true);
    try {
      await savePdfBlob(
        () => customerCancellationService.downloadHotelInvoice(h.reservation_number),
        `${h.invoice_number || `Invoice_${h.reservation_number}`}.pdf`,
      );
      toast.success("Invoice downloaded.");
    } catch (e) {
      toast.error(await pdfErrorMsg(e));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="group rounded-xl border border-ink-8 bg-white overflow-hidden transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-wt-sm">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <IconBox icon={<Hotel />} tone="info" size="sm" gradient className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold text-sm text-ink truncate">{title}</div>
              <div className="text-[11px] text-ink-4 truncate">{h.reservation_number}</div>
            </div>
            <div className="text-right flex-shrink-0">
              {h.total_amount > 0 && (
                <div className="text-sm font-extrabold text-ink tabular-nums">
                  ₹{h.total_amount.toLocaleString("en-IN")}
                </div>
              )}
              <StatusBadge status={h.reservation_status} compact />
            </div>
          </div>
          {roomLine && <div className="text-xs text-ink-3 mt-1">{roomLine}</div>}
          {h.hotel_confirmation_number && (
            <div className="text-[11px] text-ink-4 mt-0.5">
              Confirmation: <span className="font-semibold text-ink-2">{h.hotel_confirmation_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stay dates: booked vs actual ───────────────── */}
      <div className="mx-4 sm:mx-5 px-3.5 py-3 rounded-xl bg-gradient-to-br from-ink-9/60 to-white border border-ink-8">
        {bookedRange && (
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <Calendar className="h-3.5 w-3.5 text-ink-4 flex-shrink-0" />
            <span>
              Booked: <strong className="text-ink">{bookedRange}</strong>
            </span>
          </div>
        )}
        {actualIn || actualOut ? (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-success-soft/50 border border-success-soft px-2.5 py-1.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-success">
                Actual check-in
              </div>
              <div className="text-xs font-bold text-ink">{fmtStayStamp(actualIn)}</div>
            </div>
            <div className="rounded-lg bg-success-soft/50 border border-success-soft px-2.5 py-1.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-success">
                Actual check-out
              </div>
              <div className="text-xs font-bold text-ink">{fmtStayStamp(actualOut)}</div>
            </div>
            {h.platform_timezone && (
              <div className="text-[10px] text-ink-4 col-span-full">
                Times shown in {h.platform_timezone}
              </div>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-ink-4 mt-1.5">
            Actual check-in / check-out times appear here once the property records them.
          </div>
        )}
      </div>

      {/* ── Payment details + invoice download ─────────── */}
      {(h.advance_payments.length > 0 || h.balance_due > 0 || canDownload) && (
        <div className="px-4 sm:px-5 pt-3 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-3">
              <Banknote className="h-3.5 w-3.5" /> Payment
            </div>
            <Badge tone={payStatus.tone} size="sm">
              {payStatus.label}
            </Badge>
          </div>

          {h.advance_payments.length > 0 && (
            <ul className="mt-2 space-y-1">
              {h.advance_payments.map((ap) => (
                <li
                  key={ap.receipt_number}
                  className="flex items-center justify-between text-xs text-ink-3"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Receipt className="h-3 w-3 text-ink-4 flex-shrink-0" />
                    <span className="truncate">{ap.receipt_number}</span>
                    <span className="text-ink-4">{ap.payment_mode}</span>
                    {ap.collected_at && (
                      <span className="text-[10px] text-ink-4 hidden sm:inline">
                        {new Date(ap.collected_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-ink tabular-nums">
                    ₹{ap.amount.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 pt-2 border-t border-ink-8 space-y-1">
            {h.gst_enabled && h.gst_amount > 0 && (
              <div className="flex justify-between text-xs text-ink-3">
                <span>
                  GST ({h.gst_percent}%)
                </span>
                <span className="tabular-nums">₹{h.gst_amount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-ink">
              <span>Total</span>
              <span className="tabular-nums">₹{h.total_amount.toLocaleString("en-IN")}</span>
            </div>
            {h.total_advance_paid > 0 && (
              <div className="flex justify-between text-xs text-success">
                <span>Advance paid</span>
                <span className="tabular-nums">− ₹{h.total_advance_paid.toLocaleString("en-IN")}</span>
              </div>
            )}
            {h.balance_due > 0 && (
              <div className="flex justify-between text-xs font-bold text-danger">
                <span>Balance due</span>
                <span className="tabular-nums">₹{h.balance_due.toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>

          {canDownload && (
            <button
              type="button"
              onClick={download}
              disabled={downloading}
              className="mt-3 w-full h-10 rounded-xl bg-ink text-white text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-ink-700 disabled:opacity-50 transition-colors"
            >
              {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              Download invoice
              {h.invoice_number && <span className="opacity-70">· {h.invoice_number}</span>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
