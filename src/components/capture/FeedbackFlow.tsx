"use client";

// ============================================================
// WAYTERO — GUEST FEEDBACK (public, no login)
//
// Two steps, matching the reference the owner sent:
//   1. booking number + the mobile it was booked on → Verify Booking
//   2. the masked booking summary, then rating + comments → Submit
//
// Step 1 asks for the mobile as well as the reference on purpose. Booking
// numbers are sequential and guessable, so a reference alone would let
// anyone confirm that a booking exists and read part of it. A wrong mobile
// and an unknown number return the same 404, and this page shows the same
// one message for both — the wording is shared with /track for that reason.
//
// Nothing is published from here. Every submission lands as PENDING in the
// admin's feedback queue, where a person verifies it against the full
// booking before approving.
// ============================================================

import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Search,
  Star,
} from "lucide-react";
import {
  Button,
  Card,
  Container,
  Input,
  MotionGlow,
  PageHeader,
  Section,
  Textarea,
} from "@/components/ui";
import publicLeadsService, {
  type FeedbackBooking,
} from "@/services/publicLeads";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const SERVICE_LABEL: Record<string, string> = {
  CAB: "Cab booking",
  HOTEL: "Hotel stay",
  TOUR: "Tour package",
  TRIP: "Trip",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function FeedbackFlow() {
  const [step, setStep] = useState<1 | 2>(1);
  const [bookingNumber, setBookingNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [booking, setBooking] = useState<FeedbackBooking | null>(null);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [errors, setErrors] = useState<{
    rating?: string;
    guest_name?: string;
    guest_email?: string;
  }>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    if (!bookingNumber.trim()) {
      setLookupError("Enter your booking number");
      return;
    }
    if (!MOBILE_REGEX.test(mobile)) {
      setLookupError("Enter the 10-digit mobile number the booking was made on");
      return;
    }
    setVerifying(true);
    try {
      const res = await publicLeadsService.feedbackLookup(
        bookingNumber.trim().toUpperCase(),
        mobile,
      );
      setBooking(res.data);
      setStep(2);
    } catch (err) {
      setLookupError(
        err instanceof Error
          ? err.message
          : "We couldn't find that booking. Please check the details.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const found: typeof errors = {};
    if (!rating) found.rating = "Pick a rating";
    if (guestName.trim().length < 2) found.guest_name = "Enter your name";
    if (guestEmail.trim() && !EMAIL_REGEX.test(guestEmail.trim()))
      found.guest_email = "Enter a valid email address";
    setErrors(found);
    if (Object.keys(found).length || !booking) return;

    setSending(true);
    try {
      const res = await publicLeadsService.submitFeedback({
        booking_number: booking.booking_number,
        mobile,
        rating,
        review: review.trim() || undefined,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim() || undefined,
      });
      setDone(res.message);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  const startOver = () => {
    // `done` gates the thank-you card, so it has to be cleared here or the
    // "another booking" link appears to do nothing.
    setDone(null);
    setLookupError(null);
    setBooking(null);
    setRating(0);
    setReview("");
    setErrors({});
    setSubmitError(null);
    setStep(1);
  };

  return (
    <Section bg="white" pad="lg" className="min-h-[calc(100vh-200px)]">
      <Container size="md">
        <PageHeader
          eyebrow="Guest feedback"
          title={
            <>
              Share <span className="text-gradient-primary">your experience</span>
            </>
          }
          subtitle="Tell us how the trip went. It takes a minute, and a real person on our team reads every note."
        />

        {/* Step dots — the reference's two-step indicator */}
        <div className="mt-8 mb-5 flex items-center justify-center gap-2" aria-hidden>
          {[1, 2].map((n) => (
            <span
              key={n}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === n || done ? "w-8 bg-accent-500" : "w-2 bg-ink-6"
              }`}
            />
          ))}
        </div>

        {done ? (
          <Card variant="premium" className="text-center">
            <div className="py-8">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <h3 className="mt-4 text-xl font-extrabold text-ink">Thank you</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-3">{done}</p>
              <button
                type="button"
                onClick={startOver}
                className="mt-6 text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Share feedback on another booking
              </button>
            </div>
          </Card>
        ) : step === 1 ? (
          <MotionGlow color="primary" intensity={0.12} size={500} className="mt-2 rounded-3xl">
            <Card variant="premium" className="group relative">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent"
              />
              <form className="space-y-4" onSubmit={verify}>
                <Input
                  label="Booking reference no."
                  required
                  placeholder="e.g. WT-CAB-2026-000123"
                  value={bookingNumber}
                  onChange={(e) => setBookingNumber(e.target.value)}
                  maxLength={100}
                />
                <Input
                  label="Registered mobile number"
                  required
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit number on the booking"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
                {lookupError && (
                  <p
                    className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
                    role="alert"
                  >
                    {lookupError}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="gradient-primary"
                  size="lg"
                  fullWidth
                  disabled={verifying}
                  leftIcon={
                    verifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )
                  }
                  shine
                >
                  {verifying ? "Checking…" : "Verify Booking"}
                </Button>
                <p className="text-xs text-ink-4">
                  We ask for the mobile on the booking so nobody else can leave
                  feedback against your reference.
                </p>
              </form>
            </Card>
          </MotionGlow>
        ) : (
          <Card variant="premium" className="mt-2">
            {booking && (
              <div className="border-b border-ink-7 px-6 py-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-4">
                  {SERVICE_LABEL[booking.service_type] ?? "Booking"} ·{" "}
                  {booking.booking_number}
                </p>
                <p className="mt-1 text-base font-extrabold text-ink">
                  {booking.summary}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-3">
                  {booking.journey_date && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(booking.journey_date)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {booking.amount.toLocaleString("en-IN")}
                  </span>
                  <span>
                    {booking.customer_name} · {booking.customer_mobile}
                  </span>
                </div>
              </div>
            )}

            <form className="space-y-5 px-6 py-6" onSubmit={submit}>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
                  Your rating<span className="text-danger ml-0.5">*</span>
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      aria-pressed={rating === n}
                      className="rounded-lg p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          n <= rating
                            ? "fill-accent-500 text-accent-500"
                            : "text-ink-5"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {errors.rating && (
                  <p className="mt-1.5 text-xs font-medium text-danger">
                    {errors.rating}
                  </p>
                )}
              </div>

              <Textarea
                label="Your comments"
                placeholder="What was good, what should change?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                maxLength={2000}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your name"
                  required
                  value={guestName}
                  error={errors.guest_name}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Name we can show with your feedback"
                  maxLength={150}
                />
                <Input
                  label="Email (optional)"
                  type="email"
                  value={guestEmail}
                  error={errors.guest_email}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {submitError && (
                <p
                  className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
                  role="alert"
                >
                  {submitError}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  variant="gradient-primary"
                  size="lg"
                  disabled={sending}
                  leftIcon={
                    sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )
                  }
                  shine
                >
                  {sending ? "Sending…" : "Submit feedback"}
                </Button>
                <button
                  type="button"
                  onClick={startOver}
                  className="text-sm font-semibold text-ink-4 hover:text-ink"
                >
                  Not the right booking? Start over
                </button>
              </div>
            </form>
          </Card>
        )}
      </Container>
    </Section>
  );
}
