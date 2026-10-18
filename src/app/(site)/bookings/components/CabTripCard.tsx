import { useState } from "react";
import {
  Car, MapPin, Calendar, ChevronRight, Banknote, Receipt, Download, RefreshCw, Clock, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { customerCancellationService, CustomerBookingDetail } from "@/lib/cancellation";
import { Badge, IconBox } from "@/components/ui";
import StatusBadge from "./StatusBadge";
import { fmtStayStamp, pdfErrorMsg, savePdfBlob } from "./format";

/* ========================================================================
 * CabTripCard — one expanded card per cab booking: route + scheduled vs
 * actual trip stamps, the advance/payment position, and the invoice
 * download once the trip is paid and completed.
 * ====================================================================== */
export default function CabTripCard({ c }: { c: CustomerBookingDetail["cab_bookings"][number] }) {
  const [downloading, setDownloading] = useState(false);

  const amount = c.final_amount || c.estimated_amount || 0;
  const canDownload =
    !!c.invoice_number &&
    ["COMPLETED", "SETTLEMENT_PENDING", "SETTLED"].includes(c.booking_status);

  const payStatus: { tone: "success" | "warning" | "danger"; label: string } =
    c.advance_paid_total > 0 && c.balance_due <= 0
      ? { tone: "success", label: "Paid" }
      : c.advance_paid_total > 0
        ? { tone: "warning", label: "Advance paid" }
        : { tone: "danger", label: "Payment pending" };

  const download = async () => {
    setDownloading(true);
    try {
      await savePdfBlob(
        () => customerCancellationService.downloadCabInvoice(c.booking_number),
        `${c.invoice_number || `Invoice_${c.booking_number}`}.pdf`,
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
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <IconBox icon={<Car />} tone="primary" size="sm" gradient className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold text-sm text-ink truncate">{c.booking_number}</div>
              {c.trip_type && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary-600 mt-0.5">
                  {c.trip_type}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {amount > 0 && (
                <div className="text-sm font-extrabold text-ink tabular-nums">
                  ₹{amount.toLocaleString("en-IN")}
                </div>
              )}
              <StatusBadge status={c.booking_status} compact />
            </div>
          </div>
          <div className="text-xs text-ink-3 mt-1 flex items-center gap-1.5 flex-wrap">
            <MapPin className="h-3 w-3 text-ink-4 flex-shrink-0" />
            <span className="truncate">{c.pickup_location || "—"}</span>
            <ChevronRight className="h-3 w-3 text-ink-4 flex-shrink-0" />
            <span className="truncate">{c.drop_location || "—"}</span>
          </div>
          <div className="text-[11px] text-ink-4 mt-1 flex items-center gap-1.5 flex-wrap">
            {c.pickup_datetime && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Scheduled {fmtStayStamp(c.pickup_datetime)}
              </span>
            )}
            {c.trip_started_at && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> Started {fmtStayStamp(c.trip_started_at)}
              </span>
            )}
            {c.trip_ended_at && (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Ended {fmtStayStamp(c.trip_ended_at)}
              </span>
            )}
            {c.actual_distance != null && (
              <span>{c.actual_distance.toLocaleString("en-IN", { maximumFractionDigits: 1 })} km</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Payment + invoice ─────────────────────────────── */}
      {(c.advance_payments.length > 0 || c.balance_due > 0 || canDownload) && (
        <div className="px-4 sm:px-5 pt-3 pb-4 border-t border-ink-8 bg-gradient-to-b from-ink-9/30 to-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-3">
              <Banknote className="h-3.5 w-3.5" /> Payment
            </div>
            <Badge tone={payStatus.tone} size="sm">
              {payStatus.label}
            </Badge>
          </div>

          {c.advance_payments.length > 0 && (
            <ul className="mt-2 space-y-1">
              {c.advance_payments.map((ap) => (
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

          <div className="mt-2 pt-2 border-t border-ink-8 space-y-1">
            {c.gst_amount > 0 && (
              <div className="flex justify-between text-xs text-ink-3">
                <span>GST ({c.gst_rate}%)</span>
                <span className="tabular-nums">₹{c.gst_amount.toLocaleString("en-IN")}</span>
              </div>
            )}
            {c.coupon_discount > 0 && (
              <div className="flex justify-between text-xs text-success">
                <span>Coupon {c.coupon_code || ""}</span>
                <span className="tabular-nums">− ₹{c.coupon_discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-ink">
              <span>Total</span>
              <span className="tabular-nums">₹{amount.toLocaleString("en-IN")}</span>
            </div>
            {c.advance_paid_total > 0 && (
              <div className="flex justify-between text-xs text-success">
                <span>Advance paid</span>
                <span className="tabular-nums">− ₹{c.advance_paid_total.toLocaleString("en-IN")}</span>
              </div>
            )}
            {c.balance_due > 0 && (
              <div className="flex justify-between text-xs font-bold text-danger">
                <span>Balance due</span>
                <span className="tabular-nums">₹{c.balance_due.toLocaleString("en-IN")}</span>
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
              {c.invoice_number && <span className="opacity-70">· {c.invoice_number}</span>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
