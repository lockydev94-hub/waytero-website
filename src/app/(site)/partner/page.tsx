"use client";

import { useState } from "react";
import { TrendingUp, Wallet, Users, Award, Hotel, Car, Map, CheckCircle2, Loader2 } from "lucide-react";
import { Container, Section, PageHeader, IconBox, Card, ButtonLink, Input, Textarea, Select, Button, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { CtaSection } from "@/components/renderers";
import { publicLeadsService } from "@/services/publicLeads";

const PERKS = [
  { icon: Users, title: "50K+ travelers", desc: "Reach customers actively booking across India.", tone: "primary" as const },
  { icon: TrendingUp, title: "Up to 3× revenue", desc: "Partners see meaningful revenue growth in 90 days.", tone: "success" as const },
  { icon: Wallet, title: "Instant payouts", desc: "Daily settlements straight to your bank — no delays.", tone: "accent" as const },
  { icon: Award, title: "Zero lock-in", desc: "Pause anytime. No contracts, no minimums.", tone: "info" as const },
];

const TYPES = [
  { icon: Car, title: "Cab operators", desc: "Add your fleet, get bookings, pay only when you earn.", cta: { label: "Apply as Cab Partner", href: "#apply" } },
  { icon: Hotel, title: "Hotels & homestays", desc: "List rooms, manage inventory, accept direct + corporate bookings.", cta: { label: "List your Property", href: "#apply" } },
  { icon: Map, title: "Tour operators", desc: "Publish curated packages, get matched with travelers.", cta: { label: "Become a Tour Partner", href: "#apply" } },
];

const initialState = {
  business_name: "",
  business_type: "Cab operator",
  contact_person: "",
  mobile: "",
  email: "",
  city: "",
  details: "",
};

export default function PartnerPage() {
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
    <>
      <Section bg="white" pad="lg" className="bg-gradient-to-br from-accent-50/60 via-white to-primary-50/40">
        <Container size="lg">
          <PageHeader
            eyebrow="Partner Program"
            title={
              <>
                List your business on <span className="text-gradient-primary">WayTero</span>
              </>
            }
            subtitle="Reach 50,000+ Indian travelers, get instant payouts, and grow without lock-in. Cabs, hotels, and tour operators welcome."
          />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="#apply" variant="gradient-primary" size="lg" shine>Apply now</ButtonLink>
            <ButtonLink href="/contact" variant="outline-glow" size="lg" shine>Talk to partnerships</ButtonLink>
          </div>
        </Container>
      </Section>

      <Section bg="white" pad="lg" overlay="dots">
        <Container size="lg">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-ink tracking-tight">
              Why partners love <span className="text-gradient-primary">WayTero</span>
            </h2>
          </div>
          <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERKS.map((p) => {
              const Icon = p.icon;
              const glowColor = ((p.tone as string) === "info" ? "primary" : p.tone) as "primary" | "accent" | "success" | "danger";
              return (
                <MotionStaggerItem key={p.title} className="h-full">
                  <MotionGlow color={glowColor} intensity={0.18} size={260} className="h-full rounded-2xl">
                    <Card variant="premium" hover lift="md" hoverTint="primary" className="group h-full">
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <IconBox
                        icon={<Icon />}
                        tone={p.tone}
                        size="md"
                        gradient
                        glow
                        className="mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                      <h3 className="font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-sm text-ink-3 leading-relaxed">{p.desc}</p>
                    </Card>
                  </MotionGlow>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
        </Container>
      </Section>

      <Section bg="muted" pad="lg" overlay="grid">
        <Container size="lg">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-ink tracking-tight">
              Choose your <span className="text-gradient-accent">business type</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {TYPES.map((t, idx) => {
              const Icon = t.icon;
              const glowColor = (["primary", "accent", "success"] as const)[idx % 3];
              return (
                <MotionGlow key={t.title} color={glowColor} intensity={0.15} size={300} className="rounded-2xl h-full">
                  <Card variant="premium" hover lift="lg" hoverTint="primary" className="group h-full text-center">
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="inline-flex">
                      <IconBox
                        icon={<Icon />}
                        tone="primary"
                        size="xl"
                        gradient
                        glow
                        className="group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-ink mt-5 mb-2 group-hover:text-primary-700 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-sm text-ink-3 mb-6 leading-relaxed">{t.desc}</p>
                    <ButtonLink href={t.cta.href} variant="gradient-primary" size="md" fullWidth shine>
                      {t.cta.label}
                    </ButtonLink>
                  </Card>
                </MotionGlow>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section bg="white" pad="lg" id="apply" className="bg-mesh-primary">
        <Container size="md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-ink tracking-tight">
              Apply to become a <span className="text-gradient-primary">partner</span>
            </h2>
            <p className="mt-2 text-ink-3">Tell us about your business. Our team will reach out within 48 hours.</p>
          </div>
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
        </Container>
      </Section>

      <CtaSection variant={{ title: "Questions about partnering?", subtitle: "Our partnerships team is happy to walk you through it." }} />
    </>
  );
}
