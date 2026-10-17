// ============================================================
// WAYTERO — BOOKING STATUS VOCABULARY
//
// The status strings a booking can carry and how the public tracker
// should dress them. Lives here rather than inside /track's page file
// because the lookup island and the status legend both read it, and the
// two must never disagree about what a status looks like.
//
// Keys are the values booking/services/booking_lookup.py resolves;
// anything unmapped falls back to the raw string with a neutral badge,
// so a new backend status still shows up instead of disappearing.
// ============================================================

export type StatusTone =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export const STATUS_TONE: Record<string, StatusTone> = {
  PENDING_ASSIGNMENT: "warning",
  PENDING_PARTNER_ACCEPTANCE: "warning",
  ASSIGNED: "primary",
  DRIVER_ASSIGNED: "primary",
  ACCEPTED: "primary",
  STARTED: "info",
  COMPLETED: "success",
  SETTLEMENT_PENDING: "success",
  SETTLED: "success",
  CANCELLED: "danger",
  NO_SHOW: "danger",
  BREAKDOWN_REPORTED: "danger",
  PENDING_PAYMENT: "warning",
  AWAITING_HOTEL_CONFIRMATION: "warning",
  PENDING_CONFIRMATION: "warning",
  CONFIRMED: "primary",
  CHECKED_IN: "info",
  IN_HOUSE: "info",
  CHECKED_OUT: "success",
  REJECTED: "danger",
  IN_PROGRESS: "info",
  CLOSED: "success",
};

export const STATUS_LABEL: Record<string, string> = {
  PENDING_ASSIGNMENT: "Awaiting driver assignment",
  PENDING_PARTNER_ACCEPTANCE: "Driver being assigned",
  ASSIGNED: "Driver assigned",
  DRIVER_ASSIGNED: "Driver assigned",
  ACCEPTED: "Trip accepted",
  STARTED: "On the way / trip in progress",
  COMPLETED: "Trip completed",
  SETTLEMENT_PENDING: "Trip completed",
  SETTLED: "Trip completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "Marked no-show",
  BREAKDOWN_REPORTED: "Breakdown reported — help being arranged",
  PENDING_PAYMENT: "Awaiting payment",
  AWAITING_HOTEL_CONFIRMATION: "Awaiting hotel confirmation",
  PENDING_CONFIRMATION: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  IN_HOUSE: "In-house",
  CHECKED_OUT: "Checked out",
  REJECTED: "Rejected",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed",
};

export function statusTone(status: string | undefined | null): StatusTone {
  return (status && STATUS_TONE[status]) || "neutral";
}

export function statusLabel(status: string | undefined | null): string {
  if (!status) return "";
  return STATUS_LABEL[status] ?? status;
}
