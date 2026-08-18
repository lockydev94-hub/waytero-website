import { ArrowRight } from "lucide-react";
import { Container, Section, MotionGlow, ButtonLink } from "@/components/ui";
import { MotionFadeIn } from "@/components/ui";
import { pick } from "@/types/cms";

interface CtaSectionProps {
  variant: Record<string, unknown>;
}

export default function CtaSection({ variant }: CtaSectionProps) {
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Ready for your next journey?"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "Join 50,000+ Indian travelers who book smarter with WayTero."));
  // Backend sends flat cta_text + cta_link — compose object
  const ctaText = pick<string>(variant, "cta_text", "Start Booking");
  const ctaLink = pick<string>(variant, "cta_link", "/cabs");
  const cta = { label: ctaText, href: ctaLink };
  const secondary = { label: "Talk to Us", href: "/contact" };

  return (
    <Section bg="white" pad="lg" id="cta" className="relative">
      <Container size="lg">
        <MotionFadeIn>
          <MotionGlow color="accent" intensity={0.45} size={520} className="relative overflow-hidden rounded-3xl border border-primary-700/20 bg-mesh-primary px-8 py-14 lg:px-16 lg:py-20 text-center text-ink shadow-premium">
            {/* Premium animated mesh blobs */}
            <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-accent-500/40 blur-3xl animate-blob" />
            <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-primary-500/40 blur-3xl animate-blob [animation-delay:5s]" />
            <div aria-hidden className="pointer-events-none absolute top-1/3 right-1/3 h-48 w-48 rounded-full bg-white/30 blur-3xl" />

            {/* Subtle grid texture */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "28px 28px" }}
            />

            {/* Premium content */}
            <div className="relative">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-700 mb-4 px-3 py-1 rounded-full bg-white/60 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden /> Ready when you are
              </p>
              <h2 className="relative text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto text-ink">
                <span className="text-gradient-primary">{title}</span>
              </h2>
              <p className="relative mt-4 text-base lg:text-lg text-ink-2/90 max-w-xl mx-auto leading-relaxed">{subtitle}</p>
              <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink
                  href={cta.href}
                  variant="gradient-accent"
                  size="lg"
                  shine
                  magnetic
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {cta.label}
                </ButtonLink>
                <ButtonLink href={secondary.href} variant="outline" size="lg" className="border-ink-3/30 text-ink hover:bg-ink-9/40">
                  {secondary.label}
                </ButtonLink>
              </div>
              {/* Trust microcopy under CTAs */}
              <p className="relative mt-7 text-xs text-ink-3/80 font-medium">
                No credit card needed · Cancel anytime · 24/7 human support
              </p>
            </div>
          </MotionGlow>
        </MotionFadeIn>
      </Container>
    </Section>
  );
}
