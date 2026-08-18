"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, Loader2, UserX, ShieldAlert, Clock, FileWarning, Mail, Phone, User,
} from "lucide-react";
import { Container, Section, PageHeader, Card, Input, Textarea, Button, IconBox } from "@/components/ui";
import { accountDeletionService } from "@/services/accountDeletionService";
import { customerProfileService } from "@/services/customerProfileService";
import { useAuth } from "@/hooks/useAuth";

const WARNINGS = [
  {
    icon: UserX,
    title: "Your account will be permanently deleted",
    desc: "Your profile, saved addresses, referral code and preferences are removed forever. This cannot be undone.",
  },
  {
    icon: ShieldAlert,
    title: "Active bookings & wallet are affected",
    desc: "Any pending trips, hotel stays or tour packages cannot be served after deletion, and your wallet balance will be forfeited. Cancel or complete them first.",
  },
  {
    icon: FileWarning,
    title: "Records are kept for legal & tax retention",
    desc: "As required by law, completed booking and payment records are retained in anonymised form — they will no longer be linked to you.",
  },
  {
    icon: Clock,
    title: "Review takes up to 30 days",
    desc: "Your request is verified by our team. Deletion is initiated only after review — you can cancel this request before then by contacting support.",
  },
];

export default function AccountDeletionPage() {
  const { user, accessToken } = useAuth();
  const loggedIn = Boolean(accessToken || user);

  const [form, setForm] = useState({ full_name: "", email: "", mobile: "", reason: "" });
  const [prefilled, setPrefilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ request_id: number; message: string } | null>(null);
  const [confirmTyped, setConfirmTyped] = useState(false);

  // Auto-fetch the logged-in customer's profile so the form is pre-filled.
  useEffect(() => {
    if (!loggedIn || prefilled) return;
    (async () => {
      try {
        const profile = await customerProfileService.getProfile();
        setForm((f) => ({
          ...f,
          full_name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || f.full_name,
          email: profile.email || f.email,
          mobile: profile.mobile_number || f.mobile,
        }));
      } catch {
        // Fall back to the auth store's display user.
        setForm((f) => ({
          ...f,
          full_name: user?.name || f.full_name,
          email: user?.email || f.email,
          mobile: user?.phone || f.mobile,
        }));
      } finally {
        setPrefilled(true);
      }
    })();
  }, [loggedIn, prefilled, user]);

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (loggedIn) {
        const res = await accountDeletionService.submitLoggedInRequest(form.reason);
        setResult({ request_id: res.request_id, message: res.message });
      } else {
        const res = await accountDeletionService.submitPublicRequest({
          full_name: form.full_name || undefined,
          email: form.email || undefined,
          mobile: form.mobile,
          reason: form.reason,
        });
        setResult({
          request_id: res.request_id,
          message: res.account_found === false ? res.message : res.message,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    form.mobile.replace(/\D/g, "").length === 10 &&
    form.reason.trim().length >= 10 &&
    (!loggedIn || form.reason.trim().length >= 10) &&
    confirmTyped;

  return (
    <>
      <Section bg="white" pad="lg" className="bg-gradient-to-br from-danger-50/50 via-white to-white">
        <Container size="lg">
          <PageHeader
            eyebrow={loggedIn ? "Delete my account" : "Account deletion request"}
            title={
              <>
                Request account <span className="text-danger">deletion</span>
              </>
            }
            subtitle="Permanently remove your WayTero account and personal data. Read the consequences carefully before submitting."
          />
        </Container>
      </Section>

      <Section bg="white" pad="lg" overlay="dots">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* ── Consequences ── */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <IconBox icon={<AlertTriangle />} tone="danger" size="lg" gradient glow />
                <div>
                  <h2 className="text-xl font-extrabold text-ink">Before you continue</h2>
                  <p className="text-sm text-ink-3">Please read every point — deletion is irreversible.</p>
                </div>
              </div>
              <div className="space-y-4">
                {WARNINGS.map((w) => {
                  const Icon = w.icon;
                  return (
                    <div
                      key={w.title}
                      className="flex items-start gap-3 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-danger-soft hover:shadow-wt transition-all"
                    >
                      <IconBox icon={<Icon />} tone="danger" size="md" />
                      <div>
                        <div className="text-sm font-bold text-ink">{w.title}</div>
                        <p className="text-sm text-ink-3 mt-0.5 leading-relaxed">{w.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-ink-900 text-white">
                <p className="text-sm leading-relaxed text-white/80">
                  Instead of deleting, you can <Link href="/support" className="font-semibold text-accent-300 underline decoration-accent-400/40 underline-offset-2">contact support</Link>{" "}
                  to deactivate your account temporarily or resolve any issue. Deletion is the last resort.
                </p>
              </div>
            </div>

            {/* ── Form ── */}
            <Card variant="premium" className="p-6 lg:p-8">
              {result ? (
                <div className="text-center py-10">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white mb-5 shadow-wt-glow-primary">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-ink mb-2">Request received</h3>
                  <p className="text-ink-3 max-w-md mx-auto mb-2">{result.message}</p>
                  <p className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200 px-4 py-1.5 text-sm font-bold text-primary-700">
                    Request #{result.request_id}
                  </p>
                  <div className="mt-8">
                    <Link href="/" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                      Back to home
                    </Link>
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="rounded-xl bg-danger-soft/70 border border-danger/20 px-4 py-3 flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-danger leading-relaxed">
                      <strong>Warning:</strong> this permanently deletes your account. In-flight bookings,
                      wallet balance and loyalty benefits are lost. This action cannot be undone.
                    </p>
                  </div>

                  {!loggedIn && (
                    <p className="text-xs text-ink-3 leading-relaxed">
                      Not signed in? Fill your details below. If the number is registered with us we will match it
                      automatically — otherwise <Link href="/login" className="font-semibold text-primary-600">log in</Link>{" "}
                      to submit with your saved profile.
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full name" placeholder="Your name"
                      value={form.full_name} onChange={update("full_name")}
                      leftIcon={<User className="h-4 w-4" />}
                    />
                    <Input
                      label="Email" type="email" placeholder="you@example.com"
                      value={form.email} onChange={update("email")}
                      leftIcon={<Mail className="h-4 w-4" />}
                    />
                  </div>
                  <Input
                    label="Mobile number" type="tel" required
                    placeholder="10-digit mobile number"
                    value={form.mobile} onChange={update("mobile")} maxLength={10}
                    leftIcon={<Phone className="h-4 w-4" />}
                    error={form.mobile && form.mobile.replace(/\D/g, "").length !== 10 ? "Enter a valid 10-digit number" : undefined}
                  />
                  <Textarea
                    label="Reason for deletion" required rows={4}
                    placeholder="Tell us why you want to delete your account (at least 10 characters)…"
                    value={form.reason} onChange={update("reason")}
                    error={form.reason && form.reason.trim().length < 10 ? "Please provide at least 10 characters" : undefined}
                  />

                  <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-danger/30 bg-danger-soft/50 p-4 hover:bg-danger-soft transition-colors">
                    <input
                      type="checkbox"
                      checked={confirmTyped}
                      onChange={(e) => setConfirmTyped(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-danger flex-shrink-0"
                    />
                    <span className="text-sm text-ink leading-relaxed">
                      I understand that deleting my account is <strong>permanent and irreversible</strong>, my wallet
                      and active bookings will be lost, and I have no pending refunds to collect.
                    </span>
                  </label>

                  {error && (
                    <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger" role="alert">{error}</p>
                  )}

                  <Button
                    type="submit"
                    variant="danger"
                    size="lg"
                    fullWidth
                    disabled={submitting || !canSubmit}
                    shine
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting request…</span>
                    ) : (
                      <span className="inline-flex items-center gap-2"><UserX className="h-4 w-4" /> Submit deletion request</span>
                    )}
                  </Button>
                  <p className="text-center text-xs text-ink-3">
                    Our team reviews every request within 30 days. You can withdraw it anytime by contacting support.
                  </p>
                </form>
              )}
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
