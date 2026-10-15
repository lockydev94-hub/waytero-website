"use client";

import { Mail } from "lucide-react";
import { Container, Section, MotionGlow, Button } from "@/components/ui";
import { MotionFadeIn } from "@/components/ui";
import { pick } from "@/types/cms";
import { usePlatformContacts } from "@/hooks/usePlatformContacts";

interface NewsletterSectionProps {
  variant: Record<string, unknown>;
}

// There is no newsletter backend yet, so this renders no fake capture form:
// the band links to the real support email (DB-first via platform profile).
export default function NewsletterSection({ variant }: NewsletterSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "Stay in the loop");
  const title = pick<string>(variant, "headline", "Travel updates from WayTero");
  const subtitle = pick<string>(
    variant,
    "subheadline",
    "Questions, offers, or feedback — write to us and a real person will answer."
  );
  const contacts = usePlatformContacts();

  return (
    <Section bg="ink" pad="md" id="newsletter" className="relative overflow-hidden" overlay="grid">
      {/* Premium floating blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-500/30 blur-3xl animate-blob" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl animate-blob [animation-delay:6s]" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 left-1/4 h-72 w-72 rounded-full bg-primary-400/15 blur-3xl animate-blob [animation-delay:3s]" />

      <Container size="lg" className="relative">
        <MotionFadeIn>
          <MotionGlow color="primary" intensity={0.5} size={520} className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-primary-700/95 via-primary-600/95 to-accent-600/95 px-6 py-12 lg:px-14 lg:py-14 backdrop-blur-md">
            {/* Inner mesh texture */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "26px 26px" }}
            />
            {/* Top hairline */}
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            <div className="relative max-w-3xl mx-auto text-center">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-200 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-300" aria-hidden /> {eyebrow}
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                <span className="text-gradient-ink">{title}</span>
              </h2>
              {subtitle && <p className="mt-4 text-sm sm:text-base text-white/80 leading-relaxed">{subtitle}</p>}

              <div className="mt-8 flex justify-center">
                <a href={`mailto:${contacts.email}?subject=Travel%20updates`}>
                  <Button
                    variant="gradient-accent"
                    size="lg"
                    shine
                    leftIcon={<Mail className="h-4 w-4" />}
                  >
                    Email us
                  </Button>
                </a>
              </div>
            </div>
          </MotionGlow>
        </MotionFadeIn>
      </Container>
    </Section>
  );
}
