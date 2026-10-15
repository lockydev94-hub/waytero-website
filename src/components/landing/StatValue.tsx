"use client";

// Counts numbers up on scroll; backend-formatted strings (₹ prices) are
// already display-ready and stay static.

import { MotionScrollCounter } from "@/components/ui";
import type { LandingStat } from "@/lib/landingIndex";

export default function StatValue({ stat }: { stat: LandingStat }) {
  if (typeof stat.value === "number") {
    return (
      <MotionScrollCounter
        value={stat.value}
        suffix={stat.suffix ?? ""}
        className="tabular-nums"
      />
    );
  }
  return (
    <>
      {stat.value}
      {stat.suffix}
    </>
  );
}
