"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card, Input, Textarea, Button, MotionGlow } from "@/components/ui";
import { publicLeadsService } from "@/services/publicLeads";

// ============================================================
// The contact form island. Kept client-side on purpose: the page around it
// is prerendered, and only this card needs state. The 24-hour reply it
// promises is the backend's own lead SLA (public_leads_api.py).
// ============================================================

const initialForm = { name: "", email: "", mobile: "", subject: "", message: "" };

export default function ContactFormCard() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await publicLeadsService.submitContactMessage(form);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionGlow color="primary" intensity={0.12} size={420} className="rounded-3xl">
      <Card variant="premium" className="lg:p-8 relative overflow-visible">
        {submitted ? (
          <div className="text-center py-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white mb-5 shadow-wt-glow-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-ink mb-2">Message sent!</h3>
            <p className="text-ink-3 max-w-md mx-auto">
              Thanks, <strong>{form.name}</strong>. Our team will get back to you within 24 hours.
            </p>
            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setSubmitted(false);
              }}
              className="mt-6 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Your name" placeholder="Full name" required
                value={form.name} onChange={update("name")} />
              <Input label="Email" type="email" placeholder="you@example.com" required
                value={form.email} onChange={update("email")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Mobile" type="tel" placeholder="10-digit number"
                value={form.mobile} onChange={update("mobile")} maxLength={10} />
              <Input label="Subject" placeholder="How can we help?" required
                value={form.subject} onChange={update("subject")} />
            </div>
            <Textarea label="Message" placeholder="Tell us what's on your mind…" rows={5} required
              value={form.message} onChange={update("message")} />
            {error && (
              <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger" role="alert">{error}</p>
            )}
            <Button type="submit" variant="gradient-primary" size="lg" fullWidth disabled={submitting} shine>
              {submitting ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending…</span>
              ) : (
                "Send message"
              )}
            </Button>
          </form>
        )}
      </Card>
    </MotionGlow>
  );
}
