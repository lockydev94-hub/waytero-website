"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Container, Section, MotionGlow, Button } from "@/components/ui";
import { MotionFadeIn } from "@/components/ui";
import { pick } from "@/types/cms";

interface NewsletterSectionProps {
  variant: Record<string, unknown>;
}

export default function NewsletterSection({ variant }: NewsletterSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "Stay in the loop");
  const title = pick<string>(variant, "headline", "Get travel deals in your inbox");
  const subtitle = pick<string>(variant, "subheadline", "Subscribe for weekly offers, new destinations and booking tips. No spam — unsubscribe anytime.");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

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

              {done ? (
                <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur px-5 py-3 text-white font-semibold border border-white/10">
                  <CheckCircle2 className="h-5 w-5 text-accent-300" /> Thanks for subscribing — see you in the inbox!
                </div>
              ) : (
                <form
                  className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (email.trim()) setDone(true);
                  }}
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 h-12 px-4 rounded-xl bg-white text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-accent-400 shadow-wt"
                  />
                  <Button
                    type="submit"
                    variant="gradient-accent"
                    size="lg"
                    shine
                    rightIcon={<Send className="h-4 w-4" />}
                  >
                    Subscribe
                  </Button>
                </form>
              )}
              <p className="mt-4 text-xs text-white/60">Join 12,000+ subscribers · Weekly digest only</p>
            </div>
          </MotionGlow>
        </MotionFadeIn>
      </Container>
    </Section>
  );
}
