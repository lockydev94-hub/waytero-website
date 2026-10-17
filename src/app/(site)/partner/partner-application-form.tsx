"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card, Input, Select, Textarea, Button, MotionGlow } from "@/components/ui";
import { publicLeadsService } from "@/services/publicLeads";

const initialState = {
  business_name: "",
  business_type: "Cab operator",
  contact_person: "",
  mobile: "",
  email: "",
  city: "",
  details: "",
};

// The application card only — the band around it (heading, mesh background,
// the #apply anchor) is server-rendered so the hero's jump link works from
// the prerendered HTML.
export default function PartnerApplicationCard() {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof typeof initialState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await publicLeadsService.submitPartnerApplication(form);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionGlow color="primary" intensity={0.1} size={500} className="rounded-3xl">
      <Card variant="premium" className="lg:p-8 backdrop-blur-md bg-white/85">
        {submitted ? (
          <div className="text-center py-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white mb-5 shadow-wt-glow-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-ink mb-2">Application received!</h3>
            <p className="text-ink-3 max-w-md mx-auto">
              Thanks, <strong>{form.contact_person}</strong>. Our partnerships team will reach out within 48 hours.
            </p>
            <button
              type="button"
              onClick={() => {
                setForm(initialState);
                setSubmitted(false);
              }}
              className="mt-6 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Submit another application
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Business name" required placeholder="e.g. Sharma Cabs"
                value={form.business_name} onChange={update("business_name")} />
              <Select label="Business type" required value={form.business_type} onChange={update("business_type")}>
                <option>Cab operator</option>
                <option>Hotel / Homestay</option>
                <option>Tour operator</option>
                <option>Other</option>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Contact person" required placeholder="Full name"
                value={form.contact_person} onChange={update("contact_person")} />
              <Input label="Mobile" type="tel" required placeholder="10-digit Indian number"
                value={form.mobile} onChange={update("mobile")} maxLength={10} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Email" type="email" required placeholder="you@business.com"
                value={form.email} onChange={update("email")} />
              <Input label="City" placeholder="Primary city of operation"
                value={form.city} onChange={update("city")} />
            </div>
            <Textarea label="Tell us about your business" rows={4} placeholder="Fleet size / property count / monthly trips..."
              value={form.details} onChange={update("details")} />
            {error && (
              <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger" role="alert">{error}</p>
            )}
            <Button type="submit" variant="gradient-primary" size="lg" fullWidth disabled={submitting} shine>
              {submitting ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</span>
              ) : (
                "Submit application"
              )}
            </Button>
          </form>
        )}
      </Card>
    </MotionGlow>
  );
}
