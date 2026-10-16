"use client";

// ============================================================
// WAYTERO — LEFT-EDGE CAPTURE RAIL
//
// Two tabs the owner asked for on the left edge of every public page:
//   ENQUIRY NOW → the Get-in-Touch modal (POST /public/enquiries)
//   FEEDBACK    → /feedback, which verifies a booking before collecting
// One more on phones, where the bottom-left callback card has no room:
//   CALLBACK    → the same form, in a sheet
//
// z-40 on purpose: the chat launcher and Call Now float sit at z-50 and the
// chat panel above them, so support always stays reachable.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { MessageSquareText, Star, PhoneOutgoing } from "lucide-react";
import Dialog from "@/components/capture/Dialog";
import EnquiryModal from "@/components/capture/EnquiryModal";
import CallbackForm from "@/components/capture/CallbackForm";

const TAB =
  "flex items-center justify-center gap-1.5 font-extrabold uppercase tracking-[0.12em] " +
  "shadow-[0_10px_28px_rgba(11,27,59,0.20)] transition-transform " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600";

// The desktop pair is flush with the viewport edge, so only its right corners
// are round and it nudges outward on hover; the phone bar floats, so it is
// rounded all the way round.
const EDGE = "rounded-r-xl hover:translate-x-0.5";
const FLOAT = "rounded-xl";

const VERTICAL = "[writing-mode:vertical-rl] rotate-180";

// globals.css resets `a { color: inherit }` outside any cascade layer, which
// outranks an ordinary `text-white` utility. The important modifier is the
// only way a link's own colour wins without touching the site-wide reset.
const ON_DARK = "text-white!";

export default function CaptureRail() {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  return (
    <>
      {/* Desktop — edge tabs with the label written along the tab */}
      <nav
        aria-label="Quick actions"
        className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 lg:flex lg:flex-col lg:gap-2"
      >
        <button
          type="button"
          onClick={() => setEnquiryOpen(true)}
          className={`${TAB} ${EDGE} ${VERTICAL} h-auto w-[42px] py-5 text-[11px] text-white bg-gradient-to-b from-accent-500 to-accent-600`}
        >
          <MessageSquareText className="h-3.5 w-3.5 rotate-90" />
          Enquiry Now
        </button>
        <Link
          href="/feedback"
          className={`${TAB} ${EDGE} ${ON_DARK} ${VERTICAL} h-auto w-[42px] py-5 text-[11px] bg-ink-900 hover:bg-ink-800`}
        >
          <Star className="h-3.5 w-3.5 rotate-90" />
          Feedback
        </Link>
      </nav>

      {/* Phones and tablets — the same three actions as a compact bar,
          docked bottom-left above the chat and call floats. An edge tab at
          this width would sit on top of the hero form and the footer links;
          the floats already taught users to expect furniture here. */}
      <nav
        aria-label="Quick actions"
        className="fixed bottom-[4.5rem] left-3 z-40 flex gap-2 lg:hidden"
      >
        <button
          type="button"
          onClick={() => setEnquiryOpen(true)}
          aria-label="Make an enquiry"
          className={`${TAB} ${FLOAT} h-10 w-10 text-white bg-gradient-to-b from-accent-500 to-accent-600`}
        >
          <MessageSquareText className="h-5 w-5" />
        </button>
        <Link
          href="/feedback"
          aria-label="Share feedback on a booking"
          className={`${TAB} ${FLOAT} ${ON_DARK} h-10 w-10 bg-ink-900`}
        >
          <Star className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={() => setCallbackOpen(true)}
          aria-label="Request a call back"
          className={`${TAB} ${FLOAT} h-10 w-10 text-white bg-green-600`}
        >
          <PhoneOutgoing className="h-5 w-5" />
        </button>
      </nav>

      <EnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} />

      <Dialog
        open={callbackOpen}
        onClose={() => setCallbackOpen(false)}
        label="Request a callback"
        title="Request a callback"
        subtitle="Drop your number and we'll call you with options and prices."
        variant="sheet"
      >
        <CallbackForm />
      </Dialog>
    </>
  );
}
