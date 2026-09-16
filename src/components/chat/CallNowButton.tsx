"use client";

// ============================================================
// WAYTERO — FLOATING "CALL NOW" BUTTON
//
// Sits in the same bottom-right cluster as the ChatWidget launcher but
// stacked to its LEFT (right-[5.25rem] vs right-5) and never overlaps:
//   [Call] [Chat]   ← both fixed at bottom-5, 56px circles
// The chat panel opens above the pair (bottom-24), so it clears the
// call button too. Phone number is dynamic — admin Settings → Platform
// Details (SUPPORT_PHONE) via /public/platform-profile — with the
// site-wide fallback when unset.
// ============================================================

import { Phone } from "lucide-react";
import { useSupportPhone } from "@/hooks/useSupportPhone";
import { telHref } from "@/lib/supportPhone";

export default function CallNowButton() {
  const phone = useSupportPhone();

  return (
    <a
      href={telHref(phone)}
      aria-label={`Call now — ${phone}`}
      title={`Call now — ${phone}`}
      className="group fixed bottom-5 right-[5.25rem] z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-500 text-white shadow-lg shadow-green-600/30 transition-transform hover:scale-105"
    >
      <Phone size={24} />
      {/* Hover tooltip — desktop only */}
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-ink-900/90 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 md:block">
        Call now · {phone}
      </span>
    </a>
  );
}
