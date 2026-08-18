"use client";

/**
 * SiteAuthModal — site-wide auth modal opened from the header.
 *
 * The customer-web auth flow has two surfaces:
 *   1. Booking flow → /cabs/results "Book Now" → uses BookingAuthGate, which
 *      wraps this same content but pipes the fresh token back to the booking
 *      handler so the next API call can carry it immediately.
 *   2. Header / general site → SiteAuthModal. Auth state is read from the
 *      global `useAuth()` zustand store, so a successful sign-in here flips
 *      the header to the profile dropdown in the same tick. No callback
 *      hop needed.
 *
 * Tabs: Mobile OTP (primary dev path) and Google via Firebase. Email/password
 * sign-in is intentionally not exposed in the header modal — the standalone
 * /login page keeps that flow for accounts that already exist.
 */

import { useState, useEffect } from "react";
import { X, Mail, Phone, ShieldCheck, Loader2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { publicCmsService } from "@/services/publicCms";
import ProfileCompletionModal from "@/components/auth/ProfileCompletionModal";

export interface SiteAuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional heading override (e.g. "Sign in to continue your booking"). */
  heading?: string;
  /** Optional subheading override. */
  subheading?: string;
  /** Called when the user has just been authenticated — useful for flows
   *  that need to react immediately (e.g. auto-submit a pending booking). */
  onAuthenticated?: () => void;
}

type Tab = "mobile" | "email";

const MOBILE_REGEX = /^[6-9]\d{9}$/;

export default function SiteAuthModal({
  open,
  onClose,
  heading = "Login or Sign Up",
  subheading = "Sign in to manage your bookings, wallet, and trip preferences.",
  onAuthenticated,
}: SiteAuthModalProps) {
  const auth = useAuth();
  const [tab, setTab] = useState<Tab>("mobile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  // Promotion images for the left-side slider (admin CMS → Auth Modal tab).
  const [promoImages, setPromoImages] = useState<string[]>([]);
  // Opened when the just-signed-in customer is missing profile fields
  // (real mobile / name / email) — see the auth.user effect below.
  const [completionOpen, setCompletionOpen] = useState(false);

  // Reset transient state every time the modal is re-opened so the previous
  // OTP step doesn't bleed across sessions.
  useEffect(() => {
    if (!open) {
      setMobile("");
      setOtp("");
      setOtpSent(false);
      setDevOtp(null);
      setResendIn(0);
      setError(null);
      setTab("mobile");
      setLoading(false);
      setCompletionOpen(false);
    }
  }, [open]);

  // Load admin-configured promotion images for the left-side slider each
  // time the modal opens. Empty list → the modal renders form-only.
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    publicCmsService
      .getAuthModalImages(ctrl.signal)
      .then(setPromoImages)
      .catch(() => setPromoImages([]));
    return () => ctrl.abort();
  }, [open]);

  // Auth capabilities from the backend: mobile-OTP login is only shown when
  // an SMS provider (MSG91) is integrated in admin Settings → API Integrations.
  // Without one, only Google sign-in is offered and mobiles are saved as
  // UNVERIFIED (no OTP) in the post-login profile step.
  useEffect(() => {
    if (open) void useAuth.getState().fetchAuthConfig();
  }, [open]);

  const mobileAllowed = auth.authConfig?.mobileLoginEnabled !== false;

  // If the mobile tab isn't available, make sure the Google tab is active.
  useEffect(() => {
    if (open && !mobileAllowed && tab !== "email") setTab("email");
  }, [open, mobileAllowed, tab]);

  // Once the user is signed in, decide the next step instead of closing
  // blindly:
  //   · Google user without a real mobile (Firebase seeds `fb_...`) or an OTP
  //     user with the placeholder name "Customer" → ProfileCompletionModal
  //     (mobile OTP attach + name).
  //   · Account with no email on file → ProfileCompletionModal email step
  //     (optional, skippable).
  //   · Complete profile → finish: the `onAuthenticated` handler owns closing
  //     (booking flows), otherwise close here so the modal doesn't linger.
  useEffect(() => {
    if (!open || !auth.user) return;
    const u = auth.user;
    const needsMobile = !u.phone || u.phone.startsWith("fb_");
    const needsName = !u.name || u.name === "Customer";
    const needsEmail = !u.email;
    if (needsMobile || needsName || needsEmail) {
      setCompletionOpen(true);
      return;
    }
    if (onAuthenticated) onAuthenticated();
    else onClose();
  }, [open, auth.user, onAuthenticated, onClose]);

  if (!open) return null;

  const startResendCountdown = () => {
    setResendIn(30);
    const t = setInterval(() => {
      setResendIn((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    setError(null);
    if (!MOBILE_REGEX.test(mobile)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      const dev = await auth.sendMobileOtp(mobile);
      setDevOtp(dev);
      setOtpSent(true);
      startResendCountdown();
      if (dev) toast.success("OTP sent — check the dev code below");
      else toast.success("OTP sent to your mobile");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await auth.verifyMobileOtp(mobile, otp);
      toast.success("Signed in");
      // Next step is decided by the auth.user effect — ProfileCompletionModal
      // if the account is missing email, close/proceed otherwise.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await auth.signInWithFirebase();
      toast.success("Signed in with Google");
      // Next step is decided by the auth.user effect — ProfileCompletionModal
      // (mobile OTP attach) for Google accounts without a real mobile,
      // close/proceed otherwise.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const fieldCls =
    "w-full h-11 rounded-xl bg-white border border-ink-7 px-4 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15";

  const hasImages = promoImages.length > 0;

  return (
    <>
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center sm:p-4 bg-[#0B1B3B]/60 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={heading}
    >
      <div
        className={`bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_24px_80px_rgba(11,27,59,0.35)] w-full max-h-[92dvh] flex flex-col overflow-hidden ${
          hasImages ? "sm:max-w-3xl sm:flex-row" : "sm:max-w-md md:max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left — portrait promotion slider (admin CMS → Auth Modal tab) */}
        {hasImages && (
          <div className="hidden sm:block sm:w-[42%] sm:min-w-[260px] sm:flex-shrink-0" aria-hidden="true">
            <AuthImageSlider images={promoImages} />
          </div>
        )}

        {/* Right — heading + login form */}
        <div className={`flex flex-col min-w-0 ${hasImages ? "sm:w-[58%]" : "w-full"}`}>
        <div className="relative px-5 sm:px-7 pt-6 sm:pt-7 pb-5 border-b border-ink-8 flex-shrink-0">
          <button
            type="button"
            onClick={() => !loading && onClose()}
            className="absolute right-4 top-4 h-9 w-9 rounded-xl hover:bg-ink-9 flex items-center justify-center text-ink-4 hover:text-ink transition-colors"
            aria-label="Close"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-xl font-extrabold text-ink tracking-tight">{heading}</h3>
          <p className="mt-1 text-sm text-ink-3">{subheading}</p>
        </div>

        <div className="px-5 sm:px-7 py-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-1 rounded-xl bg-ink-9 p-1">
            {mobileAllowed && (
              <button
                type="button"
                onClick={() => { setTab("mobile"); setError(null); }}
                className={`flex-1 h-10 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all ${
                  tab === "mobile" ? "bg-white text-primary-600 shadow-sm" : "text-ink-4 hover:text-ink-2"
                }`}
              >
                <Phone className="h-4 w-4" /> Mobile
              </button>
            )}
            <button
              type="button"
              onClick={() => { setTab("email"); setError(null); }}
              className={`flex-1 h-10 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all ${
                tab === "email" ? "bg-white text-primary-600 shadow-sm" : "text-ink-4 hover:text-ink-2"
              }`}
            >
              <Mail className="h-4 w-4" /> Google
            </button>
          </div>
          {!mobileAllowed && (
            <p className="text-xs text-ink-4 text-center -mt-2">
              Mobile OTP login is unavailable right now — sign in with Google to continue.
            </p>
          )}

          {tab === "mobile" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">Mobile number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  disabled={otpSent}
                  placeholder="10-digit Indian number"
                  className={`${fieldCls} ${otpSent ? "bg-ink-9 text-ink-4" : ""}`}
                />
              </div>

              {otpSent && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-3">Enter OTP</label>
                    <span className="text-xs text-ink-4">
                      Sent to +91 {mobile.slice(0, 2)}••••{mobile.slice(-2)}
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    className={`${fieldCls} tracking-widest text-center font-mono`}
                  />
                  {devOtp && (
                    <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-emerald-800">
                        Dev OTP: <b className="tracking-widest">{devOtp}</b> (shown in non-production)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {otpSent ? (
                <>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="w-full h-12 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(240,90,34,0.40)] disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Verify & Continue
                  </button>
                  <button
                    type="button"
                    onClick={resendIn === 0 ? handleSendOtp : undefined}
                    disabled={resendIn > 0}
                    className="w-full text-sm text-primary-600 hover:text-primary-700 disabled:text-ink-4 disabled:cursor-not-allowed font-medium"
                  >
                    {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(240,90,34,0.40)] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Send OTP
                </button>
              )}
            </div>
          )}

          {tab === "email" && (
            <div className="space-y-4">
              <p className="text-sm text-ink-3">
                Continue with your Google account. We don't ask for a password —
                Google handles authentication and we receive only your name and
                email address.
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-white border border-ink-7 text-ink font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all hover:bg-ink-9 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleGlyph />
                )}
                Continue with Google
              </button>
              <p className="text-xs text-ink-4 text-center">
                By continuing you agree to WayTero's terms of service and privacy policy.
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>

    {/* ── Post-login profile completion (missing mobile / name / email) ── */}
    <ProfileCompletionModal
      open={completionOpen}
      onClose={() => {
        setCompletionOpen(false);
        onClose();
      }}
      initialEmail={auth.user?.email}
      initialMobile={auth.user?.phone}
      initialName={auth.user?.name}
      onComplete={() => {
        setCompletionOpen(false);
        // Profile is complete now — the caller's onAuthenticated handler owns
        // closing + resuming (booking flows); otherwise close here.
        if (onAuthenticated) onAuthenticated();
        else onClose();
      }}
    />
    </>
  );
}

/**
 * AuthImageSlider — the portrait promotion panel on the left of the auth
 * modal. Images are 3:4 travel posters uploaded by the admin (CMS → Auth
 * Modal). Crossfades automatically every 5s with manual arrows + dots.
 */
function AuthImageSlider({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const count = images.length;

  // Auto-advance; restart whenever the image list changes.
  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;
  const active = Math.min(idx, count - 1);

  return (
    <div className="relative h-full w-full min-h-[460px] bg-[#0B1B3B] overflow-hidden">
      {/* Stacked crossfade layers — keep every image mounted for smooth fades */}
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* Soft gradient so dots/arrows stay legible on bright artwork */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIdx((active - 1 + count) % count)}
            aria-label="Previous image"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/25 hover:bg-white/45 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIdx((active + 1) % count)}
            aria-label="Next image"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/25 hover:bg-white/45 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-5 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Inline Google "G" glyph so we don't pull in another image dependency. */
function GoogleGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A10.99 10.99 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
