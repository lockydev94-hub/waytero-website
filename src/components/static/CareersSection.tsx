/**
 * CareersSection — building blocks for the /careers page.
 * Each export is a self-contained section; the page composes them.
 */

import { Heart, ShieldCheck, Sparkles, Globe, TrendingUp, Coffee, GraduationCap, Plane, Dumbbell, Laptop2, BadgeCheck, MapPin, Clock } from "lucide-react";
import { Container, Section, PageHeader, SectionHeader, IconBox, Card, ButtonLink, Badge, MotionStagger, MotionStaggerItem, MotionGlow } from "@/components/ui";

// ── Hero ────────────────────────────────────────────────────────────────
export function CareersHero() {
  return (
    <Section bg="white" pad="lg" className="bg-gradient-to-br from-primary-50/60 via-white to-accent-50/40 relative overflow-hidden" overlay="dots">
      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-100/50 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-100/40 blur-3xl" />
      <Container size="lg" className="relative">
        <PageHeader
          eyebrow="Careers at WayTero"
          title={
            <>
              Build <span className="text-gradient-primary">India&apos;s Travel OS</span>
            </>
          }
          subtitle="We're a small, sharp team in Bhubaneswar and Bengaluru fixing how India travels — cabs, hotels, tours, and payments on one stack. Come build with us."
        />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="#open-roles" variant="gradient-primary" size="lg" shine>See open roles</ButtonLink>
          <ButtonLink href="/about" variant="outline" size="lg">About WayTero</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}

// ── Culture values ──────────────────────────────────────────────────────
const CULTURE = [
  { icon: Heart, title: "Customers come first", desc: "Every decision starts with: is this better for the traveler?", tone: "primary" as const },
  { icon: ShieldCheck, title: "Trust over shortcuts", desc: "Verified partners, transparent pricing, honest comms.", tone: "success" as const },
  { icon: Sparkles, title: "Craft over chaos", desc: "We ship polished software — the details are the product.", tone: "accent" as const },
  { icon: Globe, title: "Built for Bharat", desc: "Small-town outstation trips matter as much as metro airport runs.", tone: "info" as const },
  { icon: TrendingUp, title: "Own your outcome", desc: "Flat team, real ownership, measurable impact.", tone: "primary" as const },
  { icon: Coffee, title: "Sustainable pace", desc: "We work hard and recharge harder. No burnout theatre.", tone: "accent" as const },
];

export function CultureGrid() {
  return (
    <Section bg="white" pad="lg" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow="How we work" title="Our culture" accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CULTURE.map((c) => {
            const Icon = c.icon;
            const glowColor = ((c.tone === "info" ? "primary" : c.tone) as "primary" | "accent" | "success" | "danger");
            return (
              <MotionStaggerItem key={c.title} className="h-full">
                <MotionGlow color={glowColor} intensity={0.15} size={260} className="h-full rounded-2xl">
                  <Card variant="premium" hover lift="sm" className="h-full overflow-hidden">
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <IconBox icon={<Icon />} tone={c.tone} size="md" gradient glow className="mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
                    <h3 className="font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">{c.title}</h3>
                    <p className="text-sm text-ink-3">{c.desc}</p>
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

// ── Open roles ──────────────────────────────────────────────────────────
const ROLES = [
  { title: "Senior Backend Engineer — FastAPI", dept: "Engineering", location: "Bhubaneswar / Remote", type: "Full-time", tag: "Hot" },
  { title: "Product Designer — Travel", dept: "Design", location: "Bengaluru", type: "Full-time", tag: null },
  { title: "Mobile Engineer — Flutter", dept: "Engineering", location: "Bhubaneswar / Remote", type: "Full-time", tag: null },
  { title: "Partnerships Manager — Hotels", dept: "Growth", location: "Remote (India)", type: "Full-time", tag: null },
  { title: "Customer Success Specialist", dept: "Support", location: "Bhubaneswar", type: "Full-time", tag: null },
  { title: "Data Analyst — Operations", dept: "Operations", location: "Bengaluru", type: "Contract", tag: null },
];

export function OpenPositions() {
  return (
    <Section bg="muted" pad="lg" id="open-roles" overlay="grid">
      <Container size="lg">
        <SectionHeader
          eyebrow="Join the team"
          title="Open positions"
          subtitle="Don't see your role? Email careers@waytero.com — we always hire exceptional people."
          accent="primary"
          underline
          animatedEyebrow
        />
        <MotionStagger className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROLES.map((r) => (
            <MotionStaggerItem key={r.title} className="h-full">
              <Card variant="premium" hover lift="md" hoverTint="primary" className="group h-full flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge tone="primary">{r.dept}</Badge>
                  {r.tag && <Badge tone="accent">{r.tag}</Badge>}
                </div>
                <h3 className="font-bold text-ink leading-snug group-hover:text-primary-700 transition-colors">{r.title}</h3>
                <div className="mt-3 space-y-1.5 text-xs text-ink-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} /> {r.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} /> {r.type}
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <ButtonLink href="/contact" variant="outline" size="sm" fullWidth className="group-hover:border-primary-400 group-hover:bg-primary-50/60">
                    Apply now
                  </ButtonLink>
                </div>
              </Card>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}

// ── Perks band ──────────────────────────────────────────────────────────
const PERKS = [
  { icon: GraduationCap, label: "Learning budget" },
  { icon: Plane, label: "Travel allowance" },
  { icon: Dumbbell, label: "Wellness stipend" },
  { icon: Laptop2, label: "MacBook + gear" },
  { icon: Coffee, label: "Free meals & snacks" },
  { icon: BadgeCheck, label: "Health insurance" },
];

export function PerksBand() {
  return (
    <Section bg="white" pad="md" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow="The good stuff" title="Benefits & perks" accent="primary" underline animatedEyebrow />
        <MotionStagger className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PERKS.map((p) => {
            const Icon = p.icon;
            return (
              <MotionStaggerItem key={p.label} className="h-full">
                <div className="group h-full rounded-2xl border border-ink-7 bg-gradient-to-br from-ink-9/40 to-ink-9/20 p-4 text-center transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-1 hover:shadow-wt hover:border-primary-200">
                  <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500/15 to-accent-500/15 flex items-center justify-center mb-2 group-hover:from-primary-500/25 group-hover:to-accent-500/25 transition-colors">
                    <Icon className="h-5 w-5 text-primary-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-xs font-bold text-ink">{p.label}</div>
                </div>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
