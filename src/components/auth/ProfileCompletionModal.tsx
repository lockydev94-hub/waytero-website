"use client";

/**
 * ProfileCompletionModal — prompts the customer to fill in missing profile
 * fields immediately after login:
 *
 *   1. Google user, no real mobile (Firebase users start with `fb_<hash>`)
 *      → ask mobile, verify a MOBILE_ATTACH OTP, attach it
 *   2. OTP user, default name = "Customer" → ask first/last name
 *   3. OTP user with no email on file → offer email as an OPTIONAL step
 *      (Save or Skip — the account works either way)
 *
 * On submit we call:
 *   - POST /customers/me/mobile/verify-otp  (OTP-verified mobile attach)
 *   - PATCH /customers/me                   (set first_name / last_name)
 *   - PATCH /customers/me/email             (attach email, optional)
 *
 * The caller passes an `onComplete` so the booking flow can resume once the
 * profile is saved (e.g. submit the pending cab booking).
 */

import { useState, useEffect } from "react";
import { X, Phone, User, Mail, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { cabService } from "@/services/cabService";

export interface ProfileCompletionModalProps {
  open: boolean;
  onClose: () => void;
  /** Defaults pre-fill from auth store (e.g. email, current mobile). */
  initialEmail?: string | null;
  initialMobile?: string | null;
  initialName?: string | null;
  /** Called after a successful save so the caller can resume (e.g. create booking). */
  onComplete?: () => void;
}

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Step = "mobile" | "name" | "email";

export default function ProfileCompletionModal({
  open,
  onClose,
  initialEmail,
  initialMobile,
  initialName,
  onComplete,
}: ProfileCompletionModalProps) {
  const auth = useAuth();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMobile(initialMobile && !initialMobile.startsWith("fb_") ? initialMobile : "");
    setFirstName(initialName && initialName !== "Customer" ? initialName : "");
    setLastName("");
    setEmail(initialEmail ?? "");
    setOtp("");
    setOtpSent(false);
    setDevOtp(null);
    setResendIn(0);
    // Decide first step based on what is missing (mobile → name → email).
    const needsMobile = !initialMobile || initialMobile.startsWith("fb_");
    const needsName = !initialName || initialName === "Customer";
    const needsEmail = !initialEmail;
    if (needsMobile) setStep("mobile");
    else if (needsName) setStep("name");
    else if (needsEmail) setStep("email");
    setError(null);
  }, [open, initialMobile, initialName, initialEmail]);

  // Auth capabilities — the mobile step only verifies an OTP when an SMS
  // provider (MSG91) is integrated; otherwise the number is saved directly
  // as UNVERIFIED so the customer can register/book right away.
  useEffect(() => {
    if (open) void useAuth.getState().fetchAuthConfig();
  }, [open]);

  const smsEnabled = auth.authConfig?.smsConfigured === true;

  if (!open) return null;

  const finish = () => {
    if (onComplete) onComplete();
    else onClose();
  };

  const nextStepAfterMobile = () => {
    const needsName = !initialName || initialName === "Customer";
    const needsEmail = !initialEmail;
    if (needsName) setStep("name");
    else if (needsEmail) setStep("email");
    else finish();
  };

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
      const data = await cabService.sendOtp(mobile, "MOBILE_ATTACH");
      setDevOtp(data?.dev_otp ?? null);
      setOtpSent(true);
      startResendCountdown();
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
      await auth.attachMobile(mobile, otp);
      toast.success("Mobile number verified");
      nextStepAfterMobile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // No-SMS path: save the mobile directly (UNVERIFIED) — no OTP step.
  const handleSaveMobileDirect = async () => {
    setError(null);
    if (!MOBILE_REGEX.test(mobile)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      await auth.saveMobile(mobile);
      toast.success("Mobile number saved");
      nextStepAfterMobile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save mobile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitName = async () => {
    setError(null);
    if (!firstName.trim()) {
      setError("Enter your first name");
      return;
    }
    setLoading(true);
    try {
      const { default: api } = await import("@/lib/api");
      await api.patch("/customers/me", {
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
      });
      await auth.checkProfileCompletion();
      toast.success("Profile updated");
      if (!initialEmail) setStep("email");
      else finish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    setError(null);
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      await auth.updateEmail(email.trim());
      toast.success("Email saved — booking updates will reach you there");
      finish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save email");
    } finally {
      setLoading(false);
    }
  };

  const fieldCls =
    "w-full h-11 rounded-xl bg-white border border-ink-7 px-4 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15";

  const stepTitle =
    step === "mobile"
      ? otpSent
        ? "Verify your mobile number"
        : "Add your mobile number"
      : step === "name"
        ? "Tell us your name"
        : "Add your email (optional)";

  const stepSub =
    step === "mobile"
      ? otpSent
        ? `Enter the 6-digit code sent to +91 ${mobile.slice(0, 2)}••••${mobile.slice(-2)}`
        : "We need a real mobile number to confirm your bookings and share trip updates."
      : step === "name"
        ? "We need your name so drivers and partners can address you correctly."
        : "We'll send booking confirmations and updates here. You can skip this — mobile OTP works too.";

  return (
    <div
      className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center sm:p-4 bg-[#0B1B3B]/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Complete your profile"
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_24px_80px_rgba(11,27,59,0.35)] w-full sm:max-w-md md:max-w-lg max-h-[92dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
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
          <h3 className="text-xl font-extrabold text-ink tracking-tight">{stepTitle}</h3>
          <p className="mt-1 text-sm text-ink-3">{stepSub}</p>
        </div>

        <div className="px-5 sm:px-7 py-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === "mobile" && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
                  Mobile number
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  disabled={otpSent}
                  placeholder="10-digit Indian number"
                  className={`${fieldCls} ${otpSent ? "bg-ink-9 text-ink-4" : ""}`}
                  autoFocus
                />
                {initialEmail && (
                  <p className="mt-2 text-xs text-ink-4">
                    Signed in as <b>{initialEmail}</b>
                  </p>
                )}
              </div>

              {smsEnabled ? (
                <>
                  {otpSent && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-ink-3">
                          Enter OTP
                        </label>
                        <span className="text-xs text-ink-4">6-digit code</span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="••••••"
                        className={`${fieldCls} tracking-widest text-center font-mono`}
                        autoFocus
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
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Verify & continue
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
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                      Send OTP
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-ink-4 -mt-1">
                    SMS isn't configured yet — your number is saved without OTP
                    verification and can be verified later.
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveMobileDirect}
                    disabled={loading}
                    className="w-full h-12 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(240,90,34,0.40)] disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                    Save & continue
                  </button>
                </>
              )}
            </>
          )}

          {step === "name" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className={fieldCls}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className={fieldCls}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmitName}
                disabled={loading}
                className="w-full h-12 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(240,90,34,0.40)] disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                Save & continue
              </button>
            </>
          )}

          {step === "email" && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={fieldCls}
                  autoFocus
                />
                <p className="mt-2 text-xs text-ink-4">
                  Used for booking confirmations, invoices and refund updates.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveEmail}
                disabled={loading}
                className="w-full h-12 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(240,90,34,0.40)] disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Save email
              </button>
              <button
                type="button"
                onClick={finish}
                disabled={loading}
                className="w-full text-sm text-ink-4 hover:text-ink-2 font-medium"
              >
                Skip for now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
