/** Which unit a cancellation applies to: the whole booking, or one service. */
export type CancelTarget =
  | { kind: "whole"; bookingNumber: string }
  | { kind: "cab"; cabBookingNumber: string }
  | { kind: "hotel"; reservationNumber: string }
  | { kind: "tour"; tourBookingNumber: string }
  | null;

/**
 * Terminal master-booking statuses. The status machine is
 * PENDING_PAYMENT → CONFIRMED → IN_PROGRESS → COMPLETED → CLOSED (with
 * CANCELLED reachable earlier), so CLOSED is a finished trip, not an active
 * one — see Backend/app/modules/admin/booking_api.py.
 */
export const CLOSED_STATUSES = ["COMPLETED", "CANCELLED", "CLOSED"];

/** Finished trips, whether they ran to completion or were closed after. */
export const COMPLETED_STATUSES = ["COMPLETED", "CLOSED"];

export type BookingFilter = "all" | "active" | "completed" | "cancelled";

export const BOOKING_FILTERS: { key: BookingFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];
