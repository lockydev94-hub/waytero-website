import type { LiveCancellationPolicy } from "@/services/publicCms";

// ============================================================
// The published cancellation ladders, in one place.
//
// /refund renders these as a three-column table and /about renders them
// as a summary; both must describe the same engine. The rules live in
// Backend/app/modules/booking/services/cancellation_policy.py
// (quote_cab_cancellation, quote_tour_cancellation) and the numbers are
// admin-tunable, so every label is built from the live payload rather
// than typed out again.
// ============================================================

export interface LadderRow {
  tier: string;
  charge: string;
  refund: string;
}

type Cab = LiveCancellationPolicy["cab"];
type Tour = LiveCancellationPolicy["tour"];

/** First match wins in the engine, so the rows read as an ordered ladder. */
export function cabLadder(cab: Cab): LadderRow[] {
  return [
    { tier: `${cab.free_hours}+ hours before pickup`, charge: "Free", refund: "100% to wallet" },
    {
      tier: `${cab.tier_1_hours}–${cab.free_hours} hours before`,
      charge: `${100 - cab.tier_1_percent}% of fare`,
      refund: `${cab.tier_1_percent}% to wallet`,
    },
    {
      tier: `${cab.tier_2_hours}–${cab.tier_1_hours} hours before`,
      charge: `${100 - cab.tier_2_percent}% of fare`,
      refund: `${cab.tier_2_percent}% to wallet`,
    },
    {
      tier: `Less than ${cab.tier_2_hours} hours before`,
      charge: `${100 - cab.same_day_percent}% of fare`,
      refund: `${cab.same_day_percent}% to wallet`,
    },
    {
      tier: "After driver assigned",
      charge: `${100 - cab.after_assignment_percent}% of fare`,
      refund: `${cab.after_assignment_percent}% to wallet`,
    },
    { tier: "No-show / after pickup", charge: "100% of fare", refund: "No refund" },
  ];
}

export function tourLadder(tour: Tour): LadderRow[] {
  return [
    { tier: `${tour.free_days}+ days before travel`, charge: "Free", refund: `${tour.tier_1_percent}% to wallet` },
    {
      tier: `${tour.tier_1_days}–${tour.free_days} days before`,
      charge: `${100 - tour.tier_2_percent}% of fare`,
      refund: `${tour.tier_2_percent}% to wallet`,
    },
    {
      tier: `${tour.tier_2_days}–${tour.tier_1_days} days before`,
      charge: `${100 - tour.tier_3_percent}% of fare`,
      refund: `${tour.tier_3_percent}% to wallet`,
    },
    {
      tier: `Less than ${tour.tier_2_days} days before`,
      charge: `${100 - tour.last_minute_percent}% of fare`,
      refund: `${tour.last_minute_percent}% to wallet`,
    },
  ];
}
