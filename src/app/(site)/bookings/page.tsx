"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X, Wallet, Info, AlertTriangle, RefreshCw, Clock, CheckCircle2,
  Car, Hotel, MapPin, Calendar, ChevronRight, Banknote, Download, Receipt,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  customerCancellationService,
  CustomerBookingSummary,
  CustomerBookingDetail,
  CabRefundPreview,
  HotelRefundPreview,
  TourRefundPreview,
} from "@/lib/cancellation";
import { useRealtime } from "@/hooks/useRealtime";
import { Card, Button, MotionGlow, MotionStagger, MotionStaggerItem, MotionFadeIn } from "@/components/ui";

/** WS events that mean "this customer's bookings changed" — refetch on each.
 *  Doc Ref: BRD Part 7 §155 — realtime channel. */
const REALTIME_BOOKING_EVENTS = [
  "BOOKING_UPDATED",
  "HOTEL_BOOKING_UPDATED",
  "BOOKING_CANCELLED",
  "CAB_BREAKDOWN_REPORTED",
  "CAB_VEHICLE_SWAPPED",
];

type CancelTarget =
  | { kind: "whole"; bookingNumber: string }
  | { kind: "cab"; cabBookingNumber: string }
  | { kind: "hotel"; reservationNumber: string }
  | { kind: "tour"; tourBookingNumber: string }
  | null;

/** Format a stay stamp (ISO) as date + time. Property-recorded check-in/out
 *  stamps carry a time, while the booked window is date-only. */
function fmtStayStamp(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const hasTime = v.includes("T");
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/**
 * /bookings — premium redesign.
 *
 * Lives under (site)/ so the global Header + Footer wrap it. Layout:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ HERO  · My Bookings                                          │
 *   │ one-liner policy blurb                                       │
 *   ├────────────┬─────────────────────────────────────────────────┤
 *   │ Sidebar    │ Selected booking                                  │
 *   │ (cards)    │  ┌─ Trip summary chips (date, route, amount) ─┐  │
 *   │            │  ├─ Service cards (cab, hotel…)              │  │
 *   │            │  └─ One "Cancel booking" button per booking  │  │
 *   └────────────┴─────────────────────────────────────────────────┘
 *
 * Cancel UX: there is exactly ONE "Cancel booking" trigger per booking —
 * the master footer button at the bottom of the detail card. If the booking
 * has more than one cancellable service, the confirm dialog opens a chooser
 * so the customer can pick the whole booking or just one service; otherwise
 * the click goes straight to the confirm modal for that single service. The
 * per-service rows no longer carry their own "Cancel cab"/"Cancel hotel"
 * buttons — they were redundant with the master trigger.
 */
export default function MyBookingsPage() {
  const qc = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CancelTarget>(null);
  const [reason, setReason] = useState("");

  // Realtime: connect to /ws while logged in and refetch bookings whenever
  // the backend pushes a lifecycle change for this customer (status, payment,
  // invoice availability, breakdown/swap). Guests stay on REST polling.
  const { status: wsStatus, subscribe } = useRealtime();
  useEffect(() => {
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ["customer-bookings"] });
      qc.invalidateQueries({ queryKey: ["customer-booking"] });
    };
    const unsubs = REALTIME_BOOKING_EVENTS.map((ev) => subscribe(ev, refresh));
    return () => unsubs.forEach((u) => u());
  }, [qc, subscribe]);

  const list = useQuery<CustomerBookingSummary[]>({
    queryKey: ["customer-bookings"],
    queryFn: () => customerCancellationService.listBookings(),
  });

  const detail = useQuery<CustomerBookingDetail>({
    queryKey: ["customer-booking", selectedBooking],
    queryFn: () => customerCancellationService.getBooking(selectedBooking!),
    enabled: !!selectedBooking,
  });

  const cabPreview = useQuery<CabRefundPreview>({
    queryKey: ["customer-cab-preview", cancelTarget?.kind === "cab" ? cancelTarget.cabBookingNumber : null],
    queryFn: () =>
      customerCancellationService.previewCab((cancelTarget as { kind: "cab"; cabBookingNumber: string }).cabBookingNumber),
    enabled: cancelTarget?.kind === "cab",
  });
  const hotelPreview = useQuery<HotelRefundPreview>({
    queryKey: ["customer-hotel-preview", cancelTarget?.kind === "hotel" ? cancelTarget.reservationNumber : null],
    queryFn: () =>
      customerCancellationService.previewHotel((cancelTarget as { kind: "hotel"; reservationNumber: string }).reservationNumber),
    enabled: cancelTarget?.kind === "hotel",
  });
  const tourPreview = useQuery<TourRefundPreview>({
    queryKey: ["customer-tour-preview", cancelTarget?.kind === "tour" ? cancelTarget.tourBookingNumber : null],
    queryFn: () =>
      customerCancellationService.previewTour((cancelTarget as { kind: "tour"; tourBookingNumber: string }).tourBookingNumber),
    enabled: cancelTarget?.kind === "tour",
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancelTarget) throw new Error("No target");
      if (cancelTarget.kind === "whole") return customerCancellationService.cancelBooking(cancelTarget.bookingNumber, reason);
      if (cancelTarget.kind === "cab") return customerCancellationService.cancelCab(cancelTarget.cabBookingNumber, reason);
      if (cancelTarget.kind === "hotel") return customerCancellationService.cancelHotel(cancelTarget.reservationNumber, reason);
      return customerCancellationService.cancelTour(cancelTarget.tourBookingNumber, reason);
    },
    onSuccess: (res: any) => {
      const refunded = res?.total_refund ?? res?.refund_amount ?? 0;
      toast.success(`Cancelled. Refund of ₹${Number(refunded).toLocaleString()} credited to your wallet.`);
      qc.invalidateQueries({ queryKey: ["customer-bookings"] });
      qc.invalidateQueries({ queryKey: ["customer-booking"] });
      setCancelTarget(null);
      setReason("");
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.detail ?? "Cancellation failed");
    },
  });

  useEffect(() => {
    if (!list.data || list.data.length === 0) return;
    if (!selectedBooking) setSelectedBooking(list.data[0].booking_number);
  }, [list.data, selectedBooking]);

  const activeDetail = detail.data;
  const preview = cabPreview.data || hotelPreview.data || tourPreview.data;

  // Cancellable services — drives the "Cancel" chooser + footer copy.
  const cancellableCabs = useMemo(
    () =>
      (activeDetail?.cab_bookings ?? []).filter(
        (c) =>
          !["IN_PROGRESS", "STARTED", "COMPLETED", "SETTLEMENT_PENDING", "SETTLED", "CANCELLED"].includes(
            c.booking_status,
          ),
      ),
    [activeDetail],
  );
  const cancellableHotels = useMemo(
    () =>
      (activeDetail?.hotel_bookings ?? []).filter(
        (h) =>
          !["CHECKED_IN", "IN_HOUSE", "CHECKED_OUT", "COMPLETED", "SETTLED", "CANCELLED", "REJECTED"].includes(
            h.reservation_status,
          ),
      ),
    [activeDetail],
  );
  const cancellableTours = useMemo(
    () =>
      (activeDetail?.tour_bookings ?? []).filter(
        (t) =>
          !["IN_PROGRESS", "COMPLETED", "SETTLEMENT_PENDING", "SETTLED", "CANCELLED"].includes(
            t.booking_status,
          ),
      ),
    [activeDetail],
  );

  const bookingIsCancellable =
    !!activeDetail &&
    !["CANCELLED", "COMPLETED"].includes(activeDetail.booking_status) &&
    (cancellableCabs.length > 0 || cancellableHotels.length > 0 || cancellableTours.length > 0);

  /**
   * Master "Cancel booking" handler. If only one cancellable service
   * exists, cancel it directly. If 2+, open the chooser dialog so the
   * customer can pick a target. If the master is itself cancellable (whole
   * booking can be cancelled) we still go through the chooser — covers
   * the multi-service case cleanly.
   */
  const handleCancelClick = () => {
    if (!activeDetail) return;
    const totalCancellable = cancellableCabs.length + cancellableHotels.length + cancellableTours.length;
    if (totalCancellable === 1) {
      if (cancellableCabs.length === 1) {
        setCancelTarget({ kind: "cab", cabBookingNumber: cancellableCabs[0].booking_number });
      } else if (cancellableHotels.length === 1) {
        setCancelTarget({ kind: "hotel", reservationNumber: cancellableHotels[0].reservation_number });
      } else if (cancellableTours.length === 1) {
        setCancelTarget({ kind: "tour", tourBookingNumber: cancellableTours[0].booking_number });
      } else {
        setCancelTarget({ kind: "whole", bookingNumber: activeDetail.booking_number });
      }
      return;
    }
    // 2+ cancellable rows — open chooser. Whole-booking is the default pick.
    setCancelTarget({ kind: "whole", bookingNumber: activeDetail.booking_number });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/40 via-white to-accent-50/20">
      {/* ── Hero ───────────────────────────────────────────── */}
      <div className="relative bg-ink text-white overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent-500/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold tracking-wider uppercase mb-4">
            <Wallet className="h-3.5 w-3.5" /> Wallet refunds
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            My <span className="text-gradient-primary">Bookings</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/70 max-w-2xl">
            Track every active trip and reservation. Cancel anytime before the partner
            picks up the job — refunds are auto-computed against the policy and credited
            straight to your wallet.
          </p>
        </div>
      </div>

      {/* ── Body grid ────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 pb-12">
        <div className="grid md:grid-cols-[320px_1fr] gap-5 sm:gap-6">
          {/* ── Sidebar list ──────────────────────────────── */}
          <MotionGlow color="primary" intensity={0.06} size={420}>
          <Card variant="premium" padded={false} className="overflow-hidden md:sticky md:top-24 self-start">
            <div className="px-4 py-3 border-b border-ink-8 bg-gradient-to-r from-primary-50/40 via-white to-accent-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white inline-flex items-center justify-center shadow-wt-sm">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-3">Recent</span>
              </div>
              <div className="flex items-center gap-1.5">
                {wsStatus === "open" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700" title="Live updates on">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    </span>
                    Live
                  </span>
                )}
                <button
                  onClick={() => list.refetch()}
                  className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-ink-4 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  aria-label="Refresh"
                >
                  <RefreshCw size={14} className={list.isFetching ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
            {list.isLoading && (
              <div className="p-4 text-sm text-ink-4">Loading bookings…</div>
            )}
            {!list.isLoading && (list.data?.length ?? 0) === 0 && (
              <div className="p-8 text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white inline-flex items-center justify-center mb-3 shadow-wt-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-ink">No bookings yet</div>
                <p className="text-xs text-ink-4 mt-1">Search a cab or hotel to get started.</p>
              </div>
            )}
            <ul className="divide-y divide-ink-8">
              {list.data?.map((b) => {
                const active = selectedBooking === b.booking_number;
                return (
                  <li key={b.id}>
                    <button
                      onClick={() => setSelectedBooking(b.booking_number)}
                      className={`group w-full text-left px-4 py-4 transition-all duration-200 ${
                        active
                          ? "bg-gradient-to-r from-primary-50/60 to-accent-50/30 border-l-2 border-primary-600"
                          : "hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent border-l-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-bold text-sm text-ink truncate">
                          {b.booking_number}
                        </div>
                        <StatusBadge status={b.booking_status} compact />
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {b.services.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md bg-ink-9 text-ink-3 text-[10px] font-bold uppercase tracking-wider"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-base font-extrabold text-gradient-primary tabular-nums">
                          ₹{b.total_amount.toLocaleString()}
                        </span>
                        {b.journey_start_date && (
                          <span className="text-[11px] text-ink-4">
                            {new Date(b.journey_start_date).toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
          </MotionGlow>

          {/* ── Detail ───────────────────────────────────── */}
          <main className="space-y-5">
            {detail.isLoading && (
              <Card variant="premium" className="p-6 text-ink-4 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" /> Loading booking…
              </Card>
            )}
            {!detail.isLoading && !activeDetail && (
              <Card variant="premium" className="p-12 text-center relative overflow-hidden">
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
                <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white inline-flex items-center justify-center mb-3 shadow-wt-sm">
                  <ChevronRight className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-ink">Select a booking</div>
                <p className="text-xs text-ink-4 mt-1">Pick one from the list on the left.</p>
              </Card>
            )}
            {activeDetail && (
              <BookingDetailCard
                detail={activeDetail}
                cancellableCount={cancellableCabs.length + cancellableHotels.length + cancellableTours.length}
                onCancel={bookingIsCancellable ? handleCancelClick : null}
              />
            )}
          </main>
        </div>
      </div>

      {/* ── Cancel chooser (only when >1 cancellable row) ── */}
      {cancelTarget &&
        cancelTarget.kind === "whole" &&
        activeDetail &&
        cancellableCabs.length + cancellableHotels.length + cancellableTours.length > 1 && (
          <CancelChooser
            cancellableCabs={cancellableCabs}
            cancellableHotels={cancellableHotels}
            cancellableTours={cancellableTours}
            bookingNumber={activeDetail.booking_number}
            onPick={(target) => setCancelTarget(target)}
            onClose={() => setCancelTarget(null)}
          />
        )}

      {/* ── Reason + refund preview + confirm ──────────────── */}
      {cancelTarget &&
        (cancelTarget.kind !== "whole" ||
          cancellableCabs.length + cancellableHotels.length + cancellableTours.length <= 1) && (
          <CancelConfirmModal
            target={cancelTarget}
            preview={preview}
            previewLoading={cabPreview.isLoading || hotelPreview.isLoading || tourPreview.isLoading}
            reason={reason}
            setReason={setReason}
            onConfirm={() => cancelMutation.mutate()}
            onClose={() => setCancelTarget(null)}
            submitting={cancelMutation.isPending}
          />
        )}
    </div>
  );
}

/* ========================================================================
 * BookingDetailCard — premium summary card for the selected booking.
 * Header chips show amount / pickup / drop / pickup time so the user can
 * read everything at a glance without scrolling. Each service row is read
 * only (icon + title + badge + amount). Cancel is a single master button
 * at the bottom of the card.
 * ====================================================================== */
function BookingDetailCard({
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
          <Button
            onClick={onCancel}
            variant="primary"
            size="md"
            leftIcon={<X size={16} />}
            className="!bg-gradient-to-br !from-rose-500 !to-rose-600 hover:!shadow-wt-primary"
          >
            Cancel booking
          </Button>
        )}
      </footer>
    </Card>
  );
}

/* ========================================================================
 * PDF download helpers — save a blob under a filename and translate the
 * backend's {detail} error envelope (streamed as a JSON blob) into a
 * human-readable toast message.
 * ====================================================================== */
async function savePdfBlob(fn: () => Promise<Blob>, filename: string): Promise<void> {
  const blob = await fn();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function pdfErrorMsg(e: unknown): Promise<string> {
  const body = (e as any)?.response?.data;
  if (body instanceof Blob) {
    try {
      const parsed = JSON.parse(await body.text());
      return parsed.detail || parsed.message || "Couldn't download the document.";
    } catch {
      /* non-JSON blob — keep the default message */
    }
  }
  return "Couldn't download the document.";
}

/* ========================================================================
 * CabTripCard — one expanded card per cab booking: route + scheduled vs
 * actual trip stamps, the advance/payment position, and the invoice
 * download once the trip is paid and completed.
 * ====================================================================== */
function CabTripCard({ c }: { c: CustomerBookingDetail["cab_bookings"][number] }) {
  const [downloading, setDownloading] = useState(false);

  const amount = c.final_amount || c.estimated_amount || 0;
  const canDownload =
    !!c.invoice_number &&
    ["COMPLETED", "SETTLEMENT_PENDING", "SETTLED"].includes(c.booking_status);

  const payStatus =
    c.advance_paid_total > 0 && c.balance_due <= 0
      ? { label: "Paid", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" }
      : c.advance_paid_total > 0
        ? { label: "Advance paid", cls: "border-amber-200 bg-amber-50 text-amber-700" }
        : { label: "Payment pending", cls: "border-rose-200 bg-rose-50 text-rose-700" };

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
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex-shrink-0 inline-flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-wt-sm">
          <Car className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
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
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${payStatus.cls}`}>
              {payStatus.label}
            </span>
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
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Coupon {c.coupon_code || ""}</span>
                <span className="tabular-nums">− ₹{c.coupon_discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-ink">
              <span>Total</span>
              <span className="tabular-nums">₹{amount.toLocaleString("en-IN")}</span>
            </div>
            {c.advance_paid_total > 0 && (
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Advance paid</span>
                <span className="tabular-nums">− ₹{c.advance_paid_total.toLocaleString("en-IN")}</span>
              </div>
            )}
            {c.balance_due > 0 && (
              <div className="flex justify-between text-xs font-bold text-rose-600">
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

/* ========================================================================
 * TourCard — one expanded card per tour booking. Package identity, travel
 * window, a status strip (the itinerary/invoice buttons only surface for
 * statuses where each document makes sense), the payment position, and the
 * itinerary + invoice downloads.
 * ====================================================================== */
function TourCard({ t }: { t: CustomerBookingDetail["tour_bookings"][number] }) {
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

  const payStatus =
    t.balance_due <= 0 && (t.advance_total > 0 || t.payment_status === "PAID")
      ? { label: "Paid", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" }
      : t.advance_total > 0
        ? { label: "Advance paid", cls: "border-amber-200 bg-amber-50 text-amber-700" }
        : { label: "Payment pending", cls: "border-rose-200 bg-rose-50 text-rose-700" };

  return (
    <div className="group rounded-xl border border-ink-8 bg-white overflow-hidden transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-wt-sm">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex-shrink-0 inline-flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-wt-sm">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
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
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${payStatus.cls}`}>
              {payStatus.label}
            </span>
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
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Advance paid</span>
                <span className="tabular-nums">− ₹{t.advance_total.toLocaleString("en-IN")}</span>
              </div>
            )}
            {t.balance_due > 0 && (
              <div className="flex justify-between text-xs font-bold text-rose-600">
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

/* ========================================================================
 * SummaryStat — pill-shaped stat tile used in the booking header.
 * ====================================================================== */
function SummaryStat({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "primary";
}) {
  return (
    <div
      className={`group rounded-xl px-3 py-2.5 border transition-all duration-200 ${
        tone === "primary"
          ? "bg-gradient-to-br from-primary-50 to-accent-50/30 border-primary-200 hover:border-primary-300 hover:shadow-wt-sm"
          : "bg-white border-ink-8 hover:border-primary-200 hover:shadow-wt-sm"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-4">
        <span className={tone === "primary" ? "text-primary-600" : "text-ink-4"}>{icon}</span>
        {label}
      </div>
      <div
        className={`mt-1 text-sm font-extrabold truncate ${
          tone === "primary" ? "text-gradient-primary" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* ========================================================================
 * HotelStayCard — one expanded card per hotel reservation. Shows the booked
 * window AND the actual check-in/out stamps the property recorded, the full
 * price breakdown, the payment trail, and the invoice download once the
 * stay is billed.
 * ====================================================================== */
function HotelStayCard({ h }: { h: CustomerBookingDetail["hotel_bookings"][number] }) {
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

  const payStatusLabel =
    h.payment_collected_status === "PAID"
      ? "Fully paid"
      : h.payment_collected_status === "PARTIAL"
        ? "Partially paid"
        : "Payment pending";
  const payStatusTone =
    h.payment_collected_status === "PAID"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : h.payment_collected_status === "PARTIAL"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";
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
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex-shrink-0 inline-flex items-center justify-center bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-wt-sm">
          <Hotel className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
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
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                Actual check-in
              </div>
              <div className="text-xs font-bold text-emerald-800">{fmtStayStamp(actualIn)}</div>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                Actual check-out
              </div>
              <div className="text-xs font-bold text-emerald-800">{fmtStayStamp(actualOut)}</div>
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
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${payStatusTone}`}
            >
              {payStatusLabel}
            </span>
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
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Advance paid</span>
                <span className="tabular-nums">− ₹{h.total_advance_paid.toLocaleString("en-IN")}</span>
              </div>
            )}
            {h.balance_due > 0 && (
              <div className="flex justify-between text-xs font-bold text-rose-600">
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

/* ========================================================================
 * CancelChooser — modal that surfaces per-service cancel targets when the
 * user clicks Cancel on a booking that has more than one cancellable row.
 * ====================================================================== */
function CancelChooser({
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
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <h3 className="font-bold text-base">What would you like to cancel?</h3>
          </div>
          <p className="text-xs text-ink-4 mt-1.5">
            You can cancel the entire booking, or just one service. Refunds differ.
          </p>
        </div>
        <div className="px-6 py-5 space-y-2.5 overflow-y-auto flex-1">
          <button
            onClick={() => onPick({ kind: "whole", bookingNumber })}
            className="w-full text-left rounded-xl border border-ink-7 p-4 hover:border-rose-300 hover:bg-rose-50/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-ink text-white inline-flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
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
              className="w-full text-left rounded-xl border border-ink-7 p-4 hover:border-rose-300 hover:bg-rose-50/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary-50 text-primary-600 inline-flex items-center justify-center">
                  <Car className="h-4 w-4" />
                </div>
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
              onClick={() =>
                onPick({ kind: "hotel", reservationNumber: h.reservation_number })
              }
              className="w-full text-left rounded-xl border border-ink-7 p-4 hover:border-rose-300 hover:bg-rose-50/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 inline-flex items-center justify-center">
                  <Hotel className="h-4 w-4" />
                </div>
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
              onClick={() =>
                onPick({ kind: "tour", tourBookingNumber: t.booking_number })
              }
              className="w-full text-left rounded-xl border border-ink-7 p-4 hover:border-rose-300 hover:bg-rose-50/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 inline-flex items-center justify-center">
                  <MapPin className="h-4 w-4" />
                </div>
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
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl border border-ink-7 text-ink-2 hover:bg-ink-9 font-semibold text-sm"
          >
            Keep booking
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
 * CancelConfirmModal — refund preview + reason + confirm.
 * ====================================================================== */
function CancelConfirmModal({
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
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-600 inline-flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  <Clock size={12} /> {tierLabelText(preview.tier_label)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="rounded-xl bg-white border border-ink-8 p-3">
                  <div className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">
                    Charge
                  </div>
                  <div className="text-xl font-extrabold text-rose-600 mt-0.5">
                    ₹{preview.charge.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-ink-8 p-3">
                  <div className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">
                    Refund
                  </div>
                  <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
                    ₹{preview.refund_amount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-ink-4 pt-2 border-t border-ink-8">
                <Wallet size={12} /> Refund is capped at the advance you paid — never out of pocket.
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1.5">
              Reason for cancellation
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us why you're cancelling…"
              rows={3}
              className="w-full rounded-xl border border-ink-7 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-ink-8 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={() => !submitting && onClose()}
            className="px-4 h-11 rounded-xl border border-ink-7 text-ink-2 hover:bg-ink-9 font-semibold text-sm"
          >
            Keep booking
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim() || submitting}
            className="px-5 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2 shadow-sm"
          >
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Confirm & cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
 * StatusBadge — premium pill with a coloured gradient background per state.
 * ====================================================================== */
function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const palette: Record<string, string> = {
    CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
    PENDING_ASSIGNMENT: "bg-amber-100 text-amber-700 border-amber-200",
    PENDING_PARTNER_ACCEPTANCE: "bg-amber-100 text-amber-700 border-amber-200",
    PENDING_CONFIRMATION: "bg-amber-100 text-amber-700 border-amber-200",
    PENDING_PAYMENT: "bg-amber-100 text-amber-700 border-amber-200",
    ASSIGNED: "bg-blue-100 text-blue-700 border-blue-200",
    DRIVER_ASSIGNED: "bg-violet-100 text-violet-700 border-violet-200",
    STARTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    IN_PROGRESS: "bg-emerald-100 text-emerald-700 border-emerald-200",
    SETTLEMENT_PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    SETTLED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    NO_SHOW: "bg-rose-100 text-rose-700 border-rose-200",
    REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
    CHECKED_IN: "bg-blue-100 text-blue-700 border-blue-200",
    IN_HOUSE: "bg-blue-100 text-blue-700 border-blue-200",
    CHECKED_OUT: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const cls = palette[status] || "bg-ink-9 text-ink-3 border-ink-8";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold ${
        compact ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
      } uppercase tracking-wider ${cls}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
