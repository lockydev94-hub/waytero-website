"use client";

import Link from "next/link";
import { Compass, X } from "lucide-react";

/**
 * OutOfServiceAreaNotice — honest "we don't serve this area yet" panel.
 * Shown when a picked location (or a fare/hotel search) falls outside
 * every serviced city. Never a fake quote, never a silent empty grid.
 */
export default function OutOfServiceAreaNotice({
  area,
  onDismiss,
  className = "",
}: {
  area?: string | null;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`relative flex items-start gap-3 rounded-2xl border border-accent-200 bg-accent-50/70 px-4 py-3.5 ${className}`}
    >
      <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
        <Compass className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">
          We don&apos;t serve {area ? <span className="text-accent-700">{area}</span> : "this area"}{" "}
          yet
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-3">
          WayTero currently operates in and around the cities we list — you can book
          any of them from anywhere in India. Pick a serviceable city in the city
          selector, or{" "}
          <Link href="/cabs" className="font-semibold text-primary-600 hover:underline">
            see where we operate
          </Link>
          .
        </p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-4 transition-colors hover:bg-accent-100 hover:text-accent-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
