"use client";

// ============================================================
// WAYTERO — "REQUEST A CALLBACK" CARD (bottom-left, desktop)
//
// The owner asked for this card to sit bottom-left with one number field.
// Bottom-right is already taken by the chat launcher and the Call Now
// button, so the card stays on the left and one step behind them in
// z-order (z-40 vs z-50) — it never covers support.
//
// Dismissal is component state on purpose: the card comes back on the next
// page load, so hiding it can never leave the owner wondering how to get it
// again. The green call float and the enquiry modal stay available either way.
// ============================================================

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PhoneOutgoing, X } from "lucide-react";
import CallbackForm from "@/components/capture/CallbackForm";

/**
 * Lead capture for people who have not booked yet. The card is fixed to the
 * bottom-left corner, so on a page whose form reaches the left edge of the
 * container it covers live controls — everywhere a signed-in customer manages
 * their own account, and on the sign-in / password flows, it is in the way and
 * asking someone who already has an account to leave a number.
 */
const SUPPRESSED_PREFIXES = [
  "/profile",
  "/bookings",
  "/wallet",
  "/notifications",
  "/account-security",
  "/account-deletion",
  "/feedback",
  "/login",
  "/register",
  "/forgot-password",
];

export default function CallbackCard() {
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  if (dismissed) return null;
  if (SUPPRESSED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Request a callback"
      className="pointer-events-auto fixed bottom-5 left-5 z-40 hidden lg:block w-[300px] rounded-2xl bg-white shadow-[0_18px_50px_rgba(11,27,59,0.18)] ring-1 ring-ink-7 p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          aria-hidden
          className="h-7 w-7 shrink-0 rounded-full bg-accent-50 text-accent-600 inline-flex items-center justify-center"
        >
          <PhoneOutgoing className="h-3.5 w-3.5" />
        </span>
        <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-primary-600 leading-none">
          Request a callback
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Hide the callback request"
          className="-mr-1.5 -mt-1.5 ml-auto h-6 w-6 shrink-0 rounded-full bg-accent-600 text-white inline-flex items-center justify-center transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <CallbackForm />
    </aside>
  );
}
