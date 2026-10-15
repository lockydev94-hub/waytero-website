"use client";

// ============================================================
// IntentBanner — the homepage nudge after a customer picked an
// airport/station in a search form. Dismissible inline banner
// (owner decision: inline, not a modal). Reads the local intent
// written by placeIntent.ts; dismissal is remembered per place
// so it never nags twice for the same page.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plane, TrainFront, X } from "lucide-react";
import { Container } from "@/components/ui";
import { dismissPlaceIntent, readPlaceIntent, type PlaceIntent } from "@/lib/placeIntent";

export default function IntentBanner() {
  const [intent, setIntent] = useState<PlaceIntent | null>(null);

  // Client-only read: localStorage doesn't exist during SSR/prerender, and
  // showing a stale server-rendered banner would hydrate-mismatch.
  useEffect(() => {
    setIntent(readPlaceIntent());
  }, []);

  if (!intent) return null;

  const Icon = intent.kind === "AIRPORT" ? Plane : TrainFront;
  const label = intent.kind === "AIRPORT" ? "airport cab" : "station pickup";

  return (
    <Container size="xl" className="px-4 sm:px-6 mt-4 sm:mt-6">
      <div
        role="note"
        className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/80 px-4 py-3 shadow-wt"
      >
        <span className="hidden sm:flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink truncate">
            Booking a cab near {intent.name}?
          </p>
          <p className="text-xs text-ink-4">
            See live {label} fares and book directly from the {intent.kind === "AIRPORT" ? "airport" : "station"} page.
          </p>
        </div>
        <Link
          href={`/${intent.slug}`}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5 hover:bg-primary-700"
        >
          View {label} page
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            dismissPlaceIntent();
            setIntent(null);
          }}
          className="flex-shrink-0 rounded-full p-1.5 text-ink-4 hover:bg-white hover:text-ink transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Container>
  );
}
