"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Container, Card, Input, Button, MotionGlow } from "@/components/ui";
import apiClient from "@/lib/api";

type Step = "identifier" | "otp" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [channel, setChannel] = useState<"email" | "sms" | null>(null);
  const [maskedId, setMaskedId] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmail = identifier.includes("@");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError("Enter your email address or mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/forgot-password", {
        identifier: identifier.trim(),
      });
      const data = res.data?.data ?? res.data;
      if (!data?.channel) {
        // Generic success — account may not exist, don't reveal
        setStep("success");
        setChannel(null);
        return;
      }
      setResetToken(data.reset_token);
      setChannel(data.channel);
      setMaskedId(data.masked_identifier || "");
      setDevOtp(data.dev_otp ?? null);
      setStep("otp");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Failed to send OTP. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        reset_token: resetToken,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setStep("success");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Failed to reset password. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fieldCls =
    "w-full h-11 rounded-xl bg-white border border-ink-7 px-4 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15";

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-primary-50/60 via-white to-accent-50/40 py-12 lg:py-16">
      <Container size="sm">
        <MotionGlow color="primary" intensity={0.15} size={500} className="rounded-3xl">
          <Card variant="premium" className="p-8 group relative backdrop-blur-md bg-white/85">
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-ink-4 hover:text-primary-600 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>

            {/* ── Step 1: Enter email or mobile ── */}
            {step === "identifier" && (
              <>
                <h1 className="text-2xl font-extrabold text-ink tracking-tight">
                  Reset your <span className="text-gradient-primary">password</span>
                </h1>
                <p className="mt-2 text-ink-3">
                  Enter your email or mobile number. We&apos;ll send a one-time password (OTP).
                </p>

                {error && (
                  <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleRequestOtp} className="mt-7 space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="text"
                      placeholder="Email or 10-digit mobile"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setError(null);
                      }}
                      className={fieldCls}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4">
                      {isEmail ? (
                        <Mail className="h-4 w-4" />
                      ) : identifier.length > 0 ? (
                        <Phone className="h-4 w-4" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                    </span>
                  </div>
                  <Button
                    type="submit"
                    variant="gradient-primary"
                    size="lg"
                    fullWidth
                    shine
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...
                      </span>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* ── Step 2: Enter OTP + new password ── */}
            {step === "otp" && (
              <>
                <h1 className="text-2xl font-extrabold text-ink tracking-tight">
                  Enter <span className="text-gradient-primary">OTP</span>
                </h1>
                <p className="mt-2 text-ink-3">
                  {channel === "email"
                    ? `We sent a 6-digit OTP to ${maskedId}`
                    : `We sent a 6-digit OTP to +91 ${maskedId}`}
                </p>

                {devOtp && (
                  <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-emerald-800">
                      Dev OTP: <b className="tracking-widest">{devOtp}</b>
                    </span>
                  </div>
                )}

                {error && (
                  <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="mt-7 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
                      OTP Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit code"
                      className={`${fieldCls} tracking-widest text-center font-mono text-lg`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 12 characters"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={fieldCls}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="gradient-primary"
                    size="lg"
                    fullWidth
                    shine
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Resetting...
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* ── Step 3: Success ── */}
            {step === "success" && (
              <div className="text-center py-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white mb-4 shadow-wt-glow-primary">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-extrabold text-ink">
                  {channel ? "Password reset!" : "Check your inbox"}
                </h2>
                <p className="mt-2 text-ink-3">
                  {channel
                    ? "Your password has been updated. Please log in with your new password."
                    : "If an account exists with that email or mobile, we've sent a password reset OTP."}
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </Link>
              </div>
            )}
          </Card>
        </MotionGlow>
      </Container>
    </div>
  );
}
