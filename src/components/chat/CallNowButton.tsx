"use client";

// ============================================================
// WAYTERO — FLOATING "CALL NOW" BUTTON
//
// Bottom-right cluster is a VERTICAL stack: this circle sits directly above
// the square chat launcher, both flush to the same right edge.
//   [Call circle]   ← bottom-[5.5rem]
//   [Chat square]   ← bottom-5
// Desktop only — below 1024px the call affordance moves into the header, next
// to the logo (see HeaderPro), and the chat launcher keeps the corner to
// itself. The chat panel clears the taller stack with lg:bottom-[10rem].
// Phone number is dynamic — admin Settings → Platform Details (SUPPORT_PHONE)
// via /public/platform-profile — with the site-wide fallback when unset.
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
      className="group fixed bottom-[5.5rem] right-5 z-50 hidden lg:flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-wt-accent ring-1 ring-white/20 transition-transform hover:scale-105"
    >
      <Phone size={24} />
      {/* Hover tooltip — desktop only, alongside the float it describes */}
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-ink-900/90 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 lg:block">
        Call now · {phone}
      </span>
    </a>
  );
}
