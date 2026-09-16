import { Container, Section, SectionHeader, ButtonLink, Card } from "@/components/ui";
import { MotionFadeIn } from "@/components/ui";
import { pick } from "@/types/cms";

interface PartnersSectionProps {
  variant: Record<string, unknown>;
}

const DEFAULT_PARTNERS: string[] = [];

export default function PartnersSection({ variant }: PartnersSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", pick<string>(variant, "eyebrow", "Trusted partners"));
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Backed by India's Best"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "We work with the brands you trust — hotels, banks, and payment partners."));
  // Only partner brands configured by the admin (CMS → partners variant) are
  // shown. The old hardcoded brand wall (OYO/Taj/Marriott/Radisson…) implied
  // partnerships that don't exist — the section stays hidden until the admin
  // adds real partners.
  const partners = pick<string[]>(variant, "partners", DEFAULT_PARTNERS);
  if (partners.length === 0) return null;
  const cta = pick<{ label: string; href: string }>(variant, "cta", { label: "Become a Partner", href: "/partner" });

  const strip = [...partners, ...partners];

  return (
    <Section bg="muted" pad="md" id="partners" overlay="grid">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />

        {/* Infinite marquee — premium auto-scroll strip with gradient mask */}
        <MotionFadeIn>
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused] py-2">
              {strip.map((p, i) => (
                <Card
                  key={`${p}-${i}`}
                  variant="flat-elev"
                  hover
                  lift="sm"
                  hoverTint="primary"
                  className="h-20 min-w-[10rem] px-6 flex items-center justify-center text-ink-4 font-bold text-lg tracking-wide hover:text-primary-700 hover:border-primary-300"
                >
                  {p}
                </Card>
              ))}
            </div>
          </div>
        </MotionFadeIn>

        <div className="text-center mt-10">
          <ButtonLink href={cta.href} variant="outline-glow" size="md" shine>
            {cta.label}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
