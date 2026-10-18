import { X, AlertTriangle, Info, Clock, Wallet, CheckCircle2, RefreshCw } from "lucide-react";
import {
  CabRefundPreview, HotelRefundPreview, TourRefundPreview,
} from "@/lib/cancellation";
import { Badge, Button, IconBox, Textarea } from "@/components/ui";
import type { CancelTarget } from "./types";

/* ========================================================================
 * CancelConfirmModal — refund preview + reason + confirm.
 * ====================================================================== */
export default function CancelConfirmModal({
  target,
  preview,
  previewLoading,
  reason,
  setReason,
  onConfirm,
  onClose,
  submitting,
}: {
  target: CancelTarget;
  preview: CabRefundPreview | HotelRefundPreview | TourRefundPreview | undefined;
  previewLoading: boolean;
  reason: string;
  setReason: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const tierLabelText = (label: string) =>
    ({
      free_window: "Free cancellation window",
      tier_1: "Tier 1 (early)",
      tier_2: "Tier 2",
      tier_3: "Tier 3",
      same_day: "Same-day (no refund)",
      no_show: "No-show",
      past_pickup: "Past pickup",
      post_assignment: "Post-assignment (partner notified)",
      last_minute: "Last minute",
      no_travel_date: "No travel date set",
    }[label] || label);

  const heading =
    target?.kind === "whole"
      ? "Cancel entire booking"
      : target?.kind === "cab"
        ? "Cancel cab"
        : target?.kind === "hotel"
          ? "Cancel hotel reservation"
          : "Cancel tour booking";

  return (
    <div
      className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center sm:p-4 bg-[#0B1B3B]/60 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-4 border-b border-ink-8 flex-shrink-0">
          <button
            onClick={() => !submitting && onClose()}
            className="absolute right-4 top-4 h-9 w-9 rounded-xl hover:bg-ink-9 inline-flex items-center justify-center text-ink-4 hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <IconBox icon={<AlertTriangle />} tone="danger" size="sm" />
            <h3 className="font-bold text-base text-ink">{heading}</h3>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {previewLoading && (
            <div className="rounded-xl border border-ink-8 bg-ink-9/40 p-4 text-sm text-ink-3 flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" /> Computing refund preview…
            </div>
          )}

          {preview && (
            <div className="rounded-xl bg-gradient-to-br from-ink-9/60 to-white border border-ink-8 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">
                <Info size={14} /> Refund preview
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="info" icon={<Clock size={12} />}>
                  {tierLabelText(preview.tier_label)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="rounded-xl bg-white border border-ink-8 p-3">
                  <div className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">
                    Charge
                  </div>
                  <div className="text-xl font-extrabold text-danger mt-0.5">
                    ₹{preview.charge.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-ink-8 p-3">
                  <div className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">
                    Refund
                  </div>
                  <div className="text-xl font-extrabold text-success mt-0.5">
                    ₹{preview.refund_amount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-ink-4 pt-2 border-t border-ink-8">
                <Wallet size={12} /> Refund is capped at the advance you paid — never out of pocket.
              </div>
            </div>
          )}

          <Textarea
            label="Reason for cancellation"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us why you're cancelling…"
            rows={3}
          />
        </div>

        <div className="px-6 py-4 border-t border-ink-8 flex items-center justify-end gap-2 flex-shrink-0">
          <Button variant="secondary" size="md" onClick={() => !submitting && onClose()}>
            Keep booking
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onConfirm}
            disabled={!reason.trim() || submitting}
            leftIcon={
              submitting ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )
            }
          >
            Confirm &amp; cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
