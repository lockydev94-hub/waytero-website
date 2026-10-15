import { Heart, ShieldCheck, Sparkles, Award } from "lucide-react";
import { Container, Section, PageHeader, IconBox, SectionHeader, Card, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { CtaSection } from "@/components/renderers";
import { pageMetadata, type SeoContent } from "@/services/seoService";

const FALLBACK: SeoContent = {
  title: "About Us — WayTero",
  description:
    "WayTero is India's Travel Operating System — connecting customers, partners, drivers, and hotels on one seamless travel platform.",
  keywords: ["about WayTero", "travel platform Bhubaneswar", "cabs hotels tours India"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("about", "/about", FALLBACK);
}

const VALUES = [
  { icon: Heart, title: "Customer first", desc: "Every decision starts with one question: is this better for the traveler?", tone: "primary" as const },
  { icon: ShieldCheck, title: "Trust over shortcuts", desc: "Verified partners, transparent pricing, and support that actually answers.", tone: "success" as const },
  { icon: Sparkles, title: "Built for India", desc: "From small-town outstation trips to metro airport runs — we get it.", tone: "accent" as const },
  { icon: Award, title: "Quality, not volume", desc: "We measure success by trips delivered well, not by sign-ups.", tone: "info" as const },
];

// "Our journey" timeline removed 2026-10-15: the milestone dates and
// numbers ("First 1,000 partners across 12 cities", "Travel Wallet
// launched 2025") were invented history with no source of truth in the DB.

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
            subtitle="Connecting customers, partners, drivers, hotels, and tour operators on one seamless platform — so booking cabs, hotels and tours is simple, transparent, and reliable."
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

      {/* Fabricated scale stats removed 2026-10-15 (owner rule: nothing the
          database can't back up). Real counters live in the CMS STATS
          section on the homepage once the admin authors them. */}

      <CtaSection variant={{ title: "Travel with WayTero", subtitle: "Book your next trip with WayTero — cabs, hotels and tours with upfront, GST-inclusive pricing." }} />
    </>
  );
}
