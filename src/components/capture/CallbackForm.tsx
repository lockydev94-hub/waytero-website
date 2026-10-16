"use client";

// ============================================================
// WAYTERO — REQUEST A CALLBACK (one mobile input)
//
// The owner asked for a single field: a number to ring. No name, no
// message — the admin who picks it up already has the phone.
//
// POST /public/callback-requests refuses a second open request for the same
// number, and the queue tells the admin whether that number already belongs
// to a registered customer, so "mark called" and "book for this customer"
// happen in the existing Customer Care screen rather than in a second
// booking flow built here.
// ============================================================

import { useState } from "react";
import { Loader2, PhoneOutgoing, CheckCircle2 } from "lucide-react";
import publicLeadsService from "@/services/publicLeads";

const MOBILE_REGEX = /^[6-9]\d{9}$/;

export default function CallbackForm() {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!MOBILE_REGEX.test(mobile)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setSending(true);
    try {
      const res = await publicLeadsService.requestCallback({ mobile });
      setDone(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    // The card is mounted on every page for the whole visit, so a dead end
    // here would leave it stuck on the thank-you until a reload.
    return (
      <div className="py-0.5 text-left">
        <p className="flex items-start gap-1.5 text-[13px] font-semibold leading-snug text-green-700">
          <CheckCircle2 className="h-4 w-4 mt-px shrink-0" />
          {done}
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(null);
            setMobile("");
            setError(null);
          }}
          className="mt-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
        >
          Use a different number
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      {/* One row, per the owner's reference: prefix, number and action share a
          line so the card stays slim instead of stacking two full-width rows. */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex h-9 shrink-0 items-center rounded-lg border border-ink-7 bg-ink-9 px-2 text-[13px] font-bold text-ink-3 select-none">
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          aria-label="Mobile number for the call back"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="98765 43210"
          className="h-9 min-w-0 flex-1 rounded-lg border border-ink-7 bg-white px-2.5 text-sm text-ink placeholder:text-ink-5 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15"
        />
        <button
          type="submit"
          disabled={sending}
          aria-label="Request the call back"
          className="h-9 shrink-0 rounded-lg px-2.5 text-white text-[13px] font-bold inline-flex items-center gap-1.5 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
        >
          {sending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PhoneOutgoing className="h-3.5 w-3.5" />
          )}
          Call Me
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
    </form>
  );
}
