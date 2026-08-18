"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, Clock, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { Container, Section, PageHeader, Card, IconBox, Input, Textarea, Button, MotionGlow } from "@/components/ui";
import { publicLeadsService } from "@/services/publicLeads";

const CHANNELS = [
  { icon: Phone, title: "Phone support", value: "1800-WAYTERO", desc: "Toll-free, 24/7 — real humans, no IVR maze.", tone: "primary" as const },
  { icon: Mail, title: "Email", value: "support@waytero.com", desc: "We reply within 4 hours.", tone: "accent" as const },
  { icon: MessageCircle, title: "WhatsApp", value: "+91 90000 00001", desc: "Fastest channel for trip changes.", tone: "success" as const },
  { icon: Building2, title: "Head office", value: "Bhubaneswar, Odisha", desc: "Mon–Sat, 10am–7pm IST.", tone: "info" as const },
];

const initialForm = { name: "", email: "", mobile: "", subject: "", message: "" };

export default function ContactPage() {
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
    <>
      <Section bg="white" pad="lg" className="bg-gradient-to-br from-primary-50/60 via-white to-white">
        <Container size="lg">
          <PageHeader
            eyebrow="We&apos;re here to help"
            title={
              <>
                Contact <span className="text-gradient-primary">WayTero</span>
              </>
            }
            subtitle="24/7 human support across phone, email, and WhatsApp. We're here before, during, and after your trip."
          />
        </Container>
      </Section>

      <Section bg="white" pad="lg" overlay="dots">
        <Container size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CHANNELS.map((c) => {
              const Icon = c.icon;
              const glowColor = ((c.tone as string) === "info" ? "primary" : c.tone) as "primary" | "accent" | "success" | "danger";
              return (
                <MotionGlow key={c.title} color={glowColor} intensity={0.15} size={320} className="rounded-2xl">
                  <Card variant="premium" hover lift="md" hoverTint="primary" className="group h-full">
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-start gap-4">
                      <IconBox
                        icon={<Icon />}
                        tone={c.tone}
                        size="lg"
                        gradient
                        glow
                        className="group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                      <div>
                        <h3 className="text-base font-bold text-ink mb-1 group-hover:text-primary-700 transition-colors">
                          {c.title}
                        </h3>
                        <div className="text-gradient-primary font-semibold mb-1">{c.value}</div>
                        <p className="text-sm text-ink-3">{c.desc}</p>
                      </div>
                    </div>
                  </Card>
                </MotionGlow>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section bg="muted" pad="lg" overlay="grid">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-3xl font-extrabold text-ink tracking-tight mb-3">
                Send us a <span className="text-gradient-primary">message</span>
              </h2>
              <p className="text-ink-3 mb-8 max-w-md">
                For non-urgent requests, partnerships, or press — fill out the form. We&apos;ll get back within 24 hours.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-ink-7/60 hover:shadow-wt transition-all">
                  <IconBox icon={<MapPin />} tone="primary" size="md" gradient />
                  <div>
                    <div className="text-sm font-bold text-ink">Head office</div>
                    <div className="text-sm text-ink-3">Plot 14, Tech Corridor, Bhubaneswar, Odisha 751024</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-ink-7/60 hover:shadow-wt transition-all">
                  <IconBox icon={<Clock />} tone="accent" size="md" gradient />
                  <div>
                    <div className="text-sm font-bold text-ink">Office hours</div>
                    <div className="text-sm text-ink-3">Mon–Sat, 10:00 AM – 7:00 PM IST</div>
                  </div>
                </div>
              </div>
            </div>

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
          </div>
        </Container>
      </Section>
    </>
  );
}
