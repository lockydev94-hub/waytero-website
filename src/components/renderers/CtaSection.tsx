import { ArrowRight } from "lucide-react";
import { Container, Section, MotionGlow, ButtonLink } from "@/components/ui";
import { MotionFadeIn } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";

interface CtaSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. Defaults to this band's
   *  own literal so every other page that uses it is unchanged. */
  bg?: BandTone;
  /** This band is shared. The homepage stacks 16 of them and passes `home`,
   *  which keeps the roomy card; every other page gets `lg`/`md` and the
   *  compact card, because the roomy one doubled the band's own padding. */
  pad?: "lg" | "md" | "home";
}

export default function CtaSection({ variant, bg = "white", pad = "lg" }: CtaSectionProps) {
  // The homepage passes `pad="home"` and was tuned against it, so it keeps the
  // roomy card exactly as it renders today. Every other page used to pay that
  // card padding on top of `pad="lg"` band padding — ~192px of it above and
  // below the headline — which is why the band read as three screens tall.
  const roomy = pad === "home";
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Ready for your next journey?"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "Book cabs, hotels and tours with upfront, GST-inclusive pricing."));
  // Backend sends flat cta_text + cta_link — compose object
  const ctaText = pick<string>(variant, "cta_text", "Start Booking");
  const ctaLink = pick<string>(variant, "cta_link", "/cabs");
  const cta = { label: ctaText, href: ctaLink };
  const secondary = { label: "Talk to Us", href: "/contact" };

  return (
    <Section bg={bg} pad={pad} id="cta" className="relative">
      <Container size="lg">
        <MotionFadeIn>
          <MotionGlow color="accent" intensity={0.45} size={520} className={`relative overflow-hidden rounded-3xl border border-primary-700/20 bg-mesh-primary text-center text-ink shadow-premium ${roomy ? "px-8 py-14 lg:px-16 lg:py-20" : "px-6 py-8 lg:px-10 lg:py-10"}`}>
            {/* Premium animated mesh blobs */}
            <div aria-hidden className={`pointer-events-none absolute -top-32 -right-24 rounded-full bg-accent-500/40 blur-3xl animate-blob ${roomy ? "h-80 w-80" : "h-56 w-56"}`} />
            <div aria-hidden className={`pointer-events-none absolute -bottom-32 -left-24 rounded-full bg-primary-500/40 blur-3xl animate-blob [animation-delay:5s] ${roomy ? "h-80 w-80" : "h-56 w-56"}`} />
            {roomy && (
              <div aria-hidden className="pointer-events-none absolute top-1/3 right-1/3 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
            )}

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
              <h2 className={`relative font-extrabold tracking-tight max-w-2xl mx-auto text-ink ${roomy ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl sm:text-3xl lg:text-4xl"}`}>
                <span className="text-gradient-primary">{title}</span>
              </h2>
              <p className={`relative mt-4 text-ink-2/90 max-w-xl mx-auto leading-relaxed ${roomy ? "text-base lg:text-lg" : "text-sm lg:text-base"}`}>{subtitle}</p>
              <div className={`relative flex flex-wrap items-center justify-center gap-3 ${roomy ? "mt-9" : "mt-6"}`}>
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
              <p className={`relative text-xs text-ink-3/80 font-medium ${roomy ? "mt-7" : "mt-5"}`}>
                No credit card needed · Cancel anytime · 24/7 human support
              </p>
            </div>
          </MotionGlow>
        </MotionFadeIn>
      </Container>
    </Section>
  );
}
