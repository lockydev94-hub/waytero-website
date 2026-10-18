import { Badge } from "@/components/ui";

/**
 * StatusBadge — one status pill for the whole page.
 *
 * Cab, hotel, tour and master-booking statuses share a vocabulary, so a single
 * tone map covers every call site. A status the map has never seen renders
 * neutral rather than being guessed at.
 */
const TONE: Record<string, "success" | "warning" | "danger" | "info"> = {
  CANCELLED: "danger",
  NO_SHOW: "danger",
  REJECTED: "danger",
  COMPLETED: "success",
  SETTLED: "success",
  CHECKED_OUT: "success",
  STARTED: "success",
  IN_PROGRESS: "success",
  CONFIRMED: "info",
  ASSIGNED: "info",
  DRIVER_ASSIGNED: "info",
  CHECKED_IN: "info",
  IN_HOUSE: "info",
  PENDING_ASSIGNMENT: "warning",
  PENDING_PARTNER_ACCEPTANCE: "warning",
  PENDING_CONFIRMATION: "warning",
  PENDING_PAYMENT: "warning",
  SETTLEMENT_PENDING: "warning",
};

export default function StatusBadge({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  return (
    <Badge tone={TONE[status] ?? "neutral"} size={compact ? "sm" : "md"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
