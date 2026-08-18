/**
 * SafetySection — building blocks for the /safety page.
 * Each export is a self-contained section; the page composes them.
 */

import { ShieldCheck, BadgeCheck, MapPin, CreditCard, Headphones, Siren, Phone } from "lucide-react";
import { Container, Section, PageHeader, SectionHeader, IconBox, Card, ButtonLink, MotionGlow, MotionStagger, MotionStaggerItem } from "@/components/ui";
import FaqAccordion, { type FaqItem } from "@/components/static/FaqAccordion";

// ── Hero ────────────────────────────────────────────────────────────────
export function SafetyHero() {
  return (
    <Section bg="white" pad="lg" className="bg-gradient-to-br from-emerald-50/60 via-white to-primary-50/40 relative overflow-hidden" overlay="dots">
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-100/40 blur-3xl" />
      <Container size="lg" className="relative">
        <PageHeader
          eyebrow="Trust & Safety"
          title={
            <>
              Travel with <span className="text-gradient-primary">confidence</span>
            </>
          }
          subtitle="Every partner is verified, every trip is traceable, and every payment is protected. Here's how we keep you safe."
        />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/support" variant="gradient-primary" size="lg" shine>Get help</ButtonLink>
          <ButtonLink href="/about" variant="outline" size="lg">About WayTero</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}

// ── Safety pillars ──────────────────────────────────────────────────────
const PILLARS = [
  { icon: BadgeCheck, title: "Verified partners", desc: "Hotels and drivers clear document, background, and quality checks before going live — and are re-checked on a schedule.", tone: "success" as const },
  { icon: MapPin, title: "Live trip tracking", desc: "Share your trip with family and let support watch the route in real time from pickup to drop.", tone: "primary" as const },
  { icon: CreditCard, title: "Payment protection", desc: "Payments are processed by PCI-DSS compliant gateways. We never store your card details.", tone: "accent" as const },
  { icon: ShieldCheck, title: "Review-backed quality", desc: "Every completed trip earns a review — low-rated partners are suspended automatically.", tone: "info" as const },
  { icon: Headphones, title: "24/7 human support", desc: "Real people on phone and WhatsApp, before, during, and after your trip.", tone: "primary" as const },
  { icon: Siren, title: "Emergency response", desc: "One tap in the app connects you to our 24/7 safety desk in an emergency.", tone: "success" as const },
];

export function SafetyPillars() {
  return (
    <Section bg="white" pad="lg" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow="How we protect you" title="Safety, by design" accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            const glowColor = ((p.tone === "info" ? "primary" : p.tone) as "primary" | "accent" | "success" | "danger");
            return (
              <MotionStaggerItem key={p.title} className="h-full">
                <MotionGlow color={glowColor} intensity={0.15} size={260} className="h-full rounded-2xl">
                  <Card variant="premium" hover lift="sm" hoverTint="primary" className="h-full">
                    <IconBox icon={<Icon />} tone={p.tone} size="md" gradient glow className="mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
                    <h3 className="font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">{p.title}</h3>
                    <p className="text-sm text-ink-3 leading-relaxed">{p.desc}</p>
                  </Card>
                </MotionGlow>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}

// ── Emergency band ──────────────────────────────────────────────────────
export function EmergencyBand() {
  return (
    <Section bg="muted" pad="lg" overlay="grid">
      <Container size="lg">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-ink-800 to-primary-900 text-white px-8 py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center shadow-premium">
          {/* Premium animated glow */}
          <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-red-500/30 blur-3xl animate-blob" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-primary-500/30 blur-3xl animate-blob [animation-delay:5s]" />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="flex items-start gap-4 relative">
            <div className="h-12 w-12 rounded-2xl bg-red-500/90 text-white inline-flex items-center justify-center flex-shrink-0 shadow-wt-accent">
              <Siren className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight">Need help during a trip?</h2>
              <p className="mt-1.5 text-sm text-white/75 max-w-lg">
                Our safety desk is staffed around the clock. For medical or police emergencies,
                first call the local emergency number, then reach us for trip support.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 relative">
            <a
              href="tel:1800WAYTERO"
              className="group/cta inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-accent-500 hover:bg-accent-600 text-ink font-bold transition-all duration-300 ease-[var(--ease-wt)] shadow-wt-accent hover:-translate-y-0.5 hover:shadow-wt-accent overflow-hidden relative"
            >
              <span aria-hidden className="pointer-events-none absolute inset-y-0 w-1/3 bg-white/25 blur-md animate-shine" />
              <Phone className="h-4 w-4 relative" /> <span className="relative">1800-WAYTERO</span>
            </a>
            <ButtonLink href="/support" variant="ghost" size="lg" className="text-white border-white/25 hover:bg-white/10">
              Help center
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How are hotels and drivers verified?",
    answer: "Partners submit government IDs, business licenses, and property/fleet photos. Our verification team checks each document, and ongoing ratings keep quality high — repeat offenders are removed.",
  },
  {
    question: "What if something goes wrong during my trip?",
    answer: "Call 1800-WAYTERO — our 24/7 desk can reassign a cab, move your booking, or escalate to emergency services. Every trip has a support thread from pickup to drop.",
  },
  {
    question: "Is my payment data safe?",
    answer: "Yes. Card payments go directly through PCI-DSS compliant gateways and we never store card numbers on our servers.",
  },
  {
    question: "Can I share my trip location with family?",
    answer: "Yes — the trip share feature sends a live link so your family can follow the route in real time.",
  },
];

export function SafetyFaq() {
  return (
    <FaqAccordion
      id="safety-faq"
      items={FAQ_ITEMS}
      eyebrow="Questions"
      title="Safety questions, answered"
    />
  );
}
