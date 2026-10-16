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
      <div className="py-1 text-left">
        <p className="flex items-start gap-2 text-sm font-semibold text-green-700">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          {done}
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(null);
            setMobile("");
            setError(null);
          }}
          className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700"
        >
          Use a different number
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <div className="flex items-stretch gap-2">
        <span className="inline-flex items-center rounded-xl border border-ink-7 bg-ink-9 px-2.5 text-sm font-bold text-ink-3 select-none">
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          aria-label="Mobile number for the call back"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="98765 43210"
          className="h-11 min-w-0 flex-1 rounded-xl border border-ink-7 bg-white px-3 text-sm text-ink placeholder:text-ink-5 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15"
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full h-11 rounded-xl text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PhoneOutgoing className="h-4 w-4" />
        )}
        Call Me
      </button>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </form>
  );
}
