import { Smartphone, PlayCircle, QrCode } from "lucide-react";
import { Container, Section, SectionHeader, MotionGlow, ButtonLink } from "@/components/ui";
import { MotionFadeIn } from "@/components/ui";
import { pick } from "@/types/cms";

interface AppDownloadSectionProps {
  variant: Record<string, unknown>;
}

export default function AppDownloadSection({ variant }: AppDownloadSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "On the go");
  const title = pick<string>(variant, "headline", "Travel Smarter with the WayTero App");
  const subtitle = pick<string>(variant, "subheadline", "Book, track and manage trips on the go — available on iOS and Android.");
  const ctaText = pick<string | null>(variant, "cta_text", null);
  const ctaLink = pick<string | null>(variant, "cta_link", null);

  return (
    <Section bg="white" pad="lg" id="app" className="relative overflow-hidden" overlay="dots">
      {/* Decorative blob background */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-100/60 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent-100/40 blur-3xl" />

      <Container size="lg" className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <MotionFadeIn>
            <SectionHeader align="left" eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow className="mb-8" />
            <ul className="space-y-3 mb-8 text-ink-3 text-sm">
              {["Instant cab booking with live tracking", "Verified hotels & curated tour packages", "Secure in-app wallet & offers", "24/7 chat support with real humans"].map((point, i) => (
                <li key={point} className="flex items-start gap-2.5 group">
                  <span className="mt-1 h-5 w-5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-wt-primary group-hover:scale-110 transition-transform" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="group-hover:text-ink-2 transition-colors">{point}</span>
                </li>
              ))}
            </ul>
            {ctaText && ctaLink && (
              <ButtonLink
                href={ctaLink}
                variant="gradient-primary"
                size="lg"
                shine
                leftIcon={<Smartphone className="h-5 w-5" />}
              >
                {ctaText}
              </ButtonLink>
            )}
          </MotionFadeIn>

          <MotionFadeIn delay={0.15} className="hidden lg:flex justify-center">
            <MotionGlow color="primary" intensity={0.5} size={460} className="rounded-[2.4rem]">
              <div className="relative mx-auto w-64 aspect-[9/19] rounded-[2.2rem] bg-gradient-to-br from-primary-700 via-primary-600 to-accent-500 shadow-premium overflow-hidden animate-float border-[6px] border-white/10">
                <div aria-hidden className="absolute inset-x-0 top-4 mx-auto h-5 w-24 rounded-full bg-white/20" />
                <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl animate-blob" />
                <div aria-hidden className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-accent-300/30 blur-2xl animate-blob [animation-delay:4s]" />
                <div className="absolute inset-x-4 top-14 bottom-4 rounded-2xl bg-ink-900 overflow-hidden flex flex-col items-center justify-center text-white gap-3">
                  <PlayCircle className="h-12 w-12 text-accent-400 drop-shadow-[0_0_12px_rgba(240,90,34,0.5)]" />
                  <div className="px-4 text-center">
                    <div className="text-lg font-extrabold tracking-tight">WayTero App</div>
                    <div className="text-xs text-white/60 mt-1">Book. Track. Travel.</div>
                  </div>
                  <div className="h-24 w-24 rounded-lg bg-white flex items-center justify-center shadow-lg">
                    <QrCode className="h-16 w-16 text-ink" />
                  </div>
                </div>
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              </div>
            </MotionGlow>
          </MotionFadeIn>
        </div>
      </Container>
    </Section>
  );
}
