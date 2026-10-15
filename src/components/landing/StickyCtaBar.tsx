"use client";

// ============================================================
// StickyCtaBar — the mobile-only conversion dock. Hidden at md+
// (the hero carries the CTAs there). Sits above the chat/call
// launchers: z-40 with an inner right padding that clears the
// z-50 floating buttons so the two never overlap.
// ============================================================

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LandingBundle } from "@/lib/landingIndex";

export default function StickyCtaBar({ data }: { data: LandingBundle }) {
  const { cta } = data;
  if (!cta.text || !cta.link) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-7 bg-white/95 backdrop-blur md:hidden">
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
      >
        {/* pr clears the chat/call launchers (z-50) on the right */}
        <div className="min-w-0 flex-1 pr-[8.5rem]">
          <div className="truncate text-sm font-bold text-ink">{cta.text}</div>
          {data.prices.cab_from != null && (
            <div className="text-xs text-ink-4">
              from ₹{Math.round(data.prices.cab_from).toLocaleString("en-IN")}
            </div>
          )}
        </div>
        <Link
          href={cta.link}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-wt-primary"
        >
          Book <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
