"use client";

/**
 * /bookings — every cab, hotel and tour booking on the signed-in account.
 *
 * Layout is one stacked column: a filter/search bar, the booking tiles, then
 * the selected booking's detail at full width beneath them. The detail panel
 * carries the refund preview, the cancellation flow and the invoice /
 * itinerary downloads.
 *
 * GET /me/bookings returns a flat list with no server-side paging or filters,
 * so status filtering and search run client-side over what is already loaded.
 *
 * Cancel UX: there is exactly ONE "Cancel booking" trigger per booking — the
 * master footer button at the bottom of the detail card. If the booking has
 * more than one cancellable service, the confirm dialog opens a chooser so the
 * customer can pick the whole booking or just one service; otherwise the click
 * goes straight to the confirm modal for that single service.
 *
 * Doc Ref: API Doc — customer cancellation endpoints; BRD Part 7 §155 —
 * realtime channel.
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, RefreshCw, CalendarX, LogIn, LayoutDashboard,
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
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotifications";
import PageHero from "@/components/sections/PageHero";
import AccountTabs, { accountTabs } from "@/components/layout/AccountTabs";
import SiteAuthModal from "@/components/auth/SiteAuthModal";
import {
  Badge, Button, ButtonLink, Card, Container, EmptyState, IconBox, Input,
  Section, Skeleton, SkeletonText,
} from "@/components/ui";
import BookingSummaryCard from "./components/BookingSummaryCard";
import BookingDetailCard from "./components/BookingDetailCard";
import CancelChooser from "./components/CancelChooser";
import CancelConfirmModal from "./components/CancelConfirmModal";
import {
  BOOKING_FILTERS, CLOSED_STATUSES, COMPLETED_STATUSES,
  type BookingFilter, type CancelTarget,
} from "./components/types";

/** WS events that mean "this customer's bookings changed" — refetch on each.
 *  Doc Ref: BRD Part 7 §155 — realtime channel. */
const REALTIME_BOOKING_EVENTS = [
  "BOOKING_UPDATED",
  "HOTEL_BOOKING_UPDATED",
  "BOOKING_CANCELLED",
  "CAB_BREAKDOWN_REPORTED",
  "CAB_VEHICLE_SWAPPED",
];

function errorMessage(e: unknown): string {
  const err = e as { response?: { data?: { message?: string; detail?: string } }; message?: string };
  return (
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.message ||
    "Something went wrong"
  );
}

export default function MyBookingsPage() {
  const auth = useAuth();
  const { count: unread } = useUnreadNotificationCount();
  const qc = useQueryClient();
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CancelTarget>(null);
  const [reason, setReason] = useState("");
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [query, setQuery] = useState("");
  const [deepLink, setDeepLink] = useState<string | null>(null);

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
    enabled: !!auth.user,
  });

  const detail = useQuery<CustomerBookingDetail>({
    queryKey: ["customer-booking", selectedBooking],
    queryFn: () => customerCancellationService.getBooking(selectedBooking!),
    enabled: !!selectedBooking && !!auth.user,
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
    onSuccess: (res) => {
      const refunded = res?.total_refund ?? res?.refund_amount ?? 0;
      toast.success(`Cancelled. Refund of ₹${Number(refunded).toLocaleString()} credited to your wallet.`);
      qc.invalidateQueries({ queryKey: ["customer-bookings"] });
      qc.invalidateQueries({ queryKey: ["customer-booking"] });
      setCancelTarget(null);
      setReason("");
    },
    onError: (e) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail ?? "Cancellation failed");
    },
  });

  // A notification row links here as /bookings?booking=<id>. Read after mount
  // rather than through useSearchParams(), which would force a Suspense
  // boundary around a page that is never prerendered anyway.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("booking");
    if (raw) setDeepLink(raw);
  }, []);

  useEffect(() => {
    const all = list.data;
    if (!all || all.length === 0) return;
    if (deepLink) {
      const hit = all.find((b) => String(b.id) === deepLink || b.booking_number === deepLink);
      if (hit) {
        setSelectedBooking(hit.booking_number);
        setDeepLink(null);
        return;
      }
    }
    if (selectedBooking && all.some((b) => b.booking_number === selectedBooking)) return;
    setSelectedBooking(all[0].booking_number);
  }, [list.data, deepLink, selectedBooking]);

  const bookings = useMemo(() => list.data ?? [], [list.data]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (filter === "cancelled" && b.booking_status !== "CANCELLED") return false;
      if (filter === "completed" && !COMPLETED_STATUSES.includes(b.booking_status)) return false;
      if (filter === "active" && CLOSED_STATUSES.includes(b.booking_status)) return false;
      if (!needle) return true;
      return (
        b.booking_number.toLowerCase().includes(needle) ||
        b.services.some((s) => s.toLowerCase().includes(needle))
      );
    });
  }, [bookings, filter, query]);

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

  // ── Not signed in → sign-in prompt ─────────────────────────
  if (!auth.user) {
    return (
      <Section bg="gradient" pad="md">
        <Container size="sm">
          <Card variant="premium" className="p-8 text-center">
            <IconBox icon={<LayoutDashboard />} tone="primary" size="xl" gradient glow className="mx-auto mb-4" />
            <h1 className="text-2xl font-extrabold text-ink tracking-tight">
              Sign in to view your bookings
            </h1>
            <p className="mt-2 text-sm text-ink-3">
              Cabs, hotels and tours you have booked, with their invoices and cancellations.
            </p>
            <Button
              variant="gradient-accent"
              size="lg"
              fullWidth
              shine
              className="mt-6"
              leftIcon={<LogIn className="h-4 w-4" />}
              onClick={() => setAuthOpen(true)}
            >
              Login / Sign Up
            </Button>
          </Card>
        </Container>
        <SiteAuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          heading="Login or Sign Up"
          subheading="Sign in to see your bookings, refunds and invoices."
        />
      </Section>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="My Bookings"
        accent="Bookings"
        description="Every cab, hotel and tour on your account, with the refund preview and the documents for each one."
        bg="muted"
        overlay="dots-faint"
      />
      <AccountTabs items={accountTabs(unread)} active="/bookings" />

      <Section bg="white" pad="sm">
        <Container size="lg">
          {/* ── Filter + search ──────────────────────────────────── */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Filter bookings by status"
              className="flex items-center gap-1 rounded-xl bg-ink-9 p-1 overflow-x-auto"
            >
              {BOOKING_FILTERS.map((f) => {
                const on = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilter(f.key)}
                    className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                      on ? "bg-white text-primary-700 shadow-wt-sm" : "text-ink-3 hover:text-ink"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-end gap-2">
              <Input
                aria-label="Search bookings"
                placeholder="Booking number or service"
                leftIcon={<Search className="h-4 w-4" />}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                wrapperClassName="flex-1 lg:w-72 lg:flex-none"
              />
              {wsStatus === "open" && (
                <Badge tone="success" size="sm" dot className="mb-3" title="Live updates on">
                  Live
                </Badge>
              )}
              <button
                type="button"
                onClick={() => list.refetch()}
                aria-label="Refresh bookings"
                className="h-11 w-11 flex-shrink-0 rounded-xl border border-ink-7 inline-flex items-center justify-center text-ink-4 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <RefreshCw size={16} className={list.isFetching ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* ── Booking tiles ────────────────────────────────────── */}
          {list.isLoading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Card key={i} variant="premium" className="p-4">
                  <Skeleton className="h-4 w-1/2" />
                  <SkeletonText lines={3} className="mt-3" />
                </Card>
              ))}
            </div>
          ) : list.isError ? (
            <EmptyState
              className="mt-6"
              icon={<RefreshCw />}
              title="Couldn't load your bookings"
              description={
                <>
                  {errorMessage(list.error)}
                  <span className="mt-1 block text-ink-4">
                    If your session expired, sign in again.
                  </span>
                </>
              }
              action={
                <Button variant="gradient-primary" size="md" shine onClick={() => list.refetch()}>
                  Retry
                </Button>
              }
            />
          ) : bookings.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon={<CalendarX />}
              title="No bookings yet"
              description="Cabs, hotels and tours you book appear here with their invoices and refund status."
              action={
                <ButtonLink href="/cabs" variant="gradient-primary" size="md" shine>
                  Find a ride
                </ButtonLink>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon={<Search />}
              title="No bookings match"
              description="Try another status, or clear the search."
              action={
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <p className="mt-6 text-xs text-ink-4">
                {filtered.length === bookings.length
                  ? `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`
                  : `${filtered.length} of ${bookings.length} bookings`}
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((b) => (
                  <BookingSummaryCard
                    key={b.id}
                    booking={b}
                    selected={selectedBooking === b.booking_number}
                    onSelect={() => setSelectedBooking(b.booking_number)}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Selected booking detail ──────────────────────────── */}
          {detail.isLoading && (
            <Card variant="premium" className="mt-6 p-6">
              <Skeleton className="h-5 w-40" />
              <SkeletonText lines={6} className="mt-4" />
            </Card>
          )}
          {!detail.isLoading && detail.isError && (
            <EmptyState
              className="mt-6"
              icon={<RefreshCw />}
              title="Couldn't load this booking"
              description={errorMessage(detail.error)}
              action={
                <Button variant="gradient-primary" size="md" shine onClick={() => detail.refetch()}>
                  Retry
                </Button>
              }
            />
          )}
          {activeDetail && !detail.isLoading && (
            <div className="mt-6">
              <BookingDetailCard
                detail={activeDetail}
                cancellableCount={
                  cancellableCabs.length + cancellableHotels.length + cancellableTours.length
                }
                onCancel={bookingIsCancellable ? handleCancelClick : null}
              />
            </div>
          )}
        </Container>
      </Section>

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
    </>
  );
}
