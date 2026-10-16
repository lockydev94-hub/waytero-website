"use client";

// ============================================================
// WAYTERO — "REQUEST A CALLBACK" CARD (bottom-left, desktop)
//
// The reference the owner sent puts this card in the bottom-left corner
// with a single number field. Bottom-right is already taken by the chat
// launcher and the Call Now button, so the card stays on the left and one
// step behind them in z-order (z-40 vs z-50) — it never covers support.
// ============================================================

import CallbackForm from "@/components/capture/CallbackForm";

export default function CallbackCard() {
  return (
    <aside className="pointer-events-auto fixed bottom-5 left-5 z-40 hidden lg:block w-[248px] rounded-2xl bg-white shadow-[0_18px_50px_rgba(11,27,59,0.18)] ring-1 ring-ink-7 p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary-600">
        Request a callback
      </p>
      <p className="mt-1 mb-3 text-xs leading-relaxed text-ink-3">
        Leave your number and our team will call you with options and prices.
      </p>
      <CallbackForm />
    </aside>
  );
}
