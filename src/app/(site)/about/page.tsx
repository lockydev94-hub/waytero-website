import { Heart, ShieldCheck, Sparkles, Award } from "lucide-react";
import { Container, Section, PageHeader, IconBox, SectionHeader, Card, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { CtaSection } from "@/components/renderers";

export const metadata = {
  title: "About Us — WayTero",
  description: "WayTero is India's Travel Operating System — connecting customers, partners, drivers, and hotels on one seamless travel platform.",
};

const VALUES = [
  { icon: Heart, title: "Customer first", desc: "Every decision starts with one question: is this better for the traveler?", tone: "primary" as const },
  { icon: ShieldCheck, title: "Trust over shortcuts", desc: "Verified partners, transparent pricing, and support that actually answers.", tone: "success" as const },
  { icon: Sparkles, title: "Built for India", desc: "From small-town outstation trips to metro airport runs — we get it.", tone: "accent" as const },
  { icon: Award, title: "Quality, not volume", desc: "We measure success by trips delivered well, not by sign-ups.", tone: "info" as const },
];

const TIMELINE = [
  { year: "2023", title: "Founded in Bhubaneswar", desc: "WayTero launched with a single idea: India's travel deserved a single, reliable platform." },
  { year: "2024", title: "First 1,000 partners", desc: "Crossed 1,000 verified hotels, drivers, and operators across 12 cities." },
  { year: "2025", title: "Travel Wallet launched", desc: "Instant refunds and platform-wide wallet become the new norm." },
  { year: "2026", title: "Travel Operating System", desc: "Today, WayTero handles cabs, hotels, tours, and partner ops on one stack." },
];

export default function AboutPage() {
  return (
    <>
      <Section bg="white" pad="lg" className="bg-gradient-to-br from-primary-50/60 via-white to-accent-50/40">
        <Container size="lg">
          <PageHeader
            eyebrow="About WayTero"
            title={
              <>
                We&apos;re building <span className="text-gradient-primary">India&apos;s Travel Operating System</span>
              </>
            }
            subtitle="Connecting customers, partners, drivers, hotels, and tour operators on one seamless platform — so travel across India is finally simple, transparent, and reliable."
          />
        </Container>
      </Section>

      <Section bg="white" pad="lg" overlay="dots">
        <Container size="lg">
          <SectionHeader
            eyebrow="What we stand for"
            title="Our values"
            accent="primary"
            underline
            animatedEyebrow
          />
          <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => {
              const Icon = v.icon;
              const glowColor = ((v.tone as string) === "info" ? "primary" : v.tone) as "primary" | "accent" | "success" | "danger";
              return (
                <MotionStaggerItem key={v.title} className="h-full">
                  <MotionGlow color={glowColor} intensity={0.18} size={260} className="h-full rounded-2xl">
                    <Card variant="premium" hover lift="md" hoverTint="primary" className="group h-full">
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <IconBox
                        icon={<Icon />}
                        tone={v.tone}
                        size="md"
                        gradient
                        glow
                        className="mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                      <h3 className="font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-sm text-ink-3 leading-relaxed">{v.desc}</p>
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
          <SectionHeader
            eyebrow="Our journey"
            title="From Bhubaneswar to all of India"
            accent="accent"
            underline
            animatedEyebrow
          />
          <div className="relative">
            <div className="absolute left-4 lg:left-1/2 lg:-translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary-300/60 via-primary-500/40 to-accent-400/40" aria-hidden />
            <MotionStagger className="space-y-10">
              {TIMELINE.map((t, i) => (
                <MotionStaggerItem key={t.year}>
                  <div className={`relative pl-12 lg:grid lg:grid-cols-2 lg:gap-12 lg:pl-0 ${i % 2 === 0 ? "" : "lg:[&>div:first-child]:order-2"}`}>
                    <div className="absolute left-2 lg:left-1/2 lg:-translate-x-1/2 top-1 h-4 w-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 border-4 border-white shadow-wt-primary [animation:var(--animate-pulse-soft)]" />
                    <div className={`bg-white/80 backdrop-blur-md rounded-2xl border border-ink-7/70 p-6 transition-all hover:shadow-wt-lg hover:-translate-y-0.5 ${i % 2 === 0 ? "lg:mr-6" : "lg:ml-6"}`}>
                      <div className="inline-flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-gradient-primary">{t.year}</span>
                        <span className="h-px w-8 bg-gradient-to-r from-primary-500/60 to-transparent" aria-hidden />
                      </div>
                      <h3 className="text-lg font-bold text-ink mb-2">{t.title}</h3>
                      <p className="text-sm text-ink-3 leading-relaxed">{t.desc}</p>
                    </div>
                  </div>
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          </div>
        </Container>
      </Section>

      <Section bg="white" pad="md" className="bg-mesh-primary">
        <Container size="lg">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { value: "50K+", label: "Happy travelers" },
              { value: "30+", label: "Cities" },
              { value: "1,200+", label: "Partner hotels" },
              { value: "800+", label: "Verified drivers" },
            ].map((s) => (
              <div key={s.label} className="group">
                <div className="text-3xl lg:text-4xl font-extrabold text-gradient-primary tracking-tight group-hover:scale-105 transition-transform duration-300">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-ink-3">{s.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CtaSection variant={{ title: "Travel with WayTero", subtitle: "Book your next trip with India's fastest-growing travel platform." }} />
    </>
  );
}
