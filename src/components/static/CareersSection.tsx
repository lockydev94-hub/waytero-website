/**
 * CareersSection — building blocks for the /careers page.
 * Each export is a self-contained section; the page composes them.
 *
 * No roles database exists, so this page must not fabricate open
 * positions, perks, or office locations (owner rule, 2026-10-15). It
 * states the honest current state and routes applicants to the real
 * contact channel from system_configurations.
 */

import { Heart, ShieldCheck, Sparkles, Globe, TrendingUp, Coffee, Mail } from "lucide-react";
import { Container, Section, PageHeader, SectionHeader, IconBox, Card, ButtonLink, Badge, MotionGlow } from "@/components/ui";
import publicCmsService from "@/services/publicCms";

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
          subtitle="We're a team based in Bhubaneswar fixing how India travels — cabs, hotels, tours, and payments on one stack. Come build with us."
        />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="#open-roles" variant="gradient-primary" size="lg" shine>Work with us</ButtonLink>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CULTURE.map((c) => {
            const Icon = c.icon;
            const glowColor = ((c.tone === "info" ? "primary" : c.tone) as "primary" | "accent" | "success" | "danger");
            return (
              <MotionGlow key={c.title} color={glowColor} intensity={0.15} size={260} className="h-full rounded-2xl">
                <Card variant="premium" hover lift="sm" className="h-full overflow-hidden">
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <IconBox icon={<Icon />} tone={c.tone} size="md" gradient glow className="mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
                  <h3 className="font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">{c.title}</h3>
                  <p className="text-sm text-ink-3">{c.desc}</p>
                </Card>
              </MotionGlow>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

// ── Open roles (honest empty state — no roles table in the DB) ──────────
export async function OpenPositions() {
  const profile = await publicCmsService.getPlatformProfile();
  return (
    <Section bg="muted" pad="lg" id="open-roles" overlay="grid">
      <Container size="lg">
        <SectionHeader
          eyebrow="Join the team"
          title="Working with WayTero"
          subtitle="Open roles are announced here first. Until then, send your profile and we'll reach out when a fitting position opens."
          accent="primary"
          underline
          animatedEyebrow
        />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card variant="premium" className="p-8 flex flex-col items-start">
            <Badge tone="primary" className="mb-4">Current status</Badge>
            <h3 className="text-lg font-bold text-ink mb-2">No roles listed right now</h3>
            <p className="text-sm text-ink-3 mb-6">
              We publish every opening on this page before anywhere else — no listings here means nothing is open this week. Check back, or introduce yourself below.
            </p>
          </Card>
          <Card variant="premium" className="p-8 flex flex-col items-start">
            <Badge tone="accent" className="mb-4">Introduce yourself</Badge>
            <h3 className="text-lg font-bold text-ink mb-2">Send your profile</h3>
            <p className="text-sm text-ink-3 mb-6">
              Tell us what you build and where you want to grow — engineering, design, operations, partnerships, or support.
            </p>
            <div className="mt-auto">
              <ButtonLink
                href={`mailto:${profile.support_email}?subject=Career%20introduction`}
                variant="gradient-primary"
                size="md"
                shine
                leftIcon={<Mail size={15} />}
              >
                {profile.support_email}
              </ButtonLink>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

// ── Perks ───────────────────────────────────────────────────────────────
// Removed 2026-10-15: the perk band (free meals, MacBook gear, travel &
// wellness stipends) was invented HR copy with no source of truth. If real
// benefits get documented, this section should render them from the CMS.
