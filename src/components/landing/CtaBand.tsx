import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, MotionShine } from "@/components/ui";
import type { LandingBundle } from "@/lib/landingIndex";

// ============================================================
// CtaBand — the closing conversion block. Uses the page's own
// derived CTA (never a made-up offer). MotionShine sweeps once on
// scroll-into-view for the premium feel.
// ============================================================

export default function CtaBand({ data }: { data: LandingBundle }) {
  const { cta } = data;
  if (!cta.text || !cta.link) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 py-14 text-white lg:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5) 0, transparent 40%), radial-gradient(circle at 80% 90%, rgba(255,255,255,0.35) 0, transparent 45%)",
        }}
      />
      <Container size="lg">
        <MotionShine trigger="view" className="relative">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {cta.text}
              </h2>
              {data.hero.subheadline && (
                <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
                  {data.hero.subheadline}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={cta.link}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-700 shadow-wt transition-all hover:-translate-y-0.5 hover:bg-white/90"
              >
                Book now <ArrowRight className="h-4 w-4" />
              </Link>
              {cta.text2 && cta.link2 && (
                <Link
                  href={cta.link2}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/50 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
                >
                  {cta.text2}
                </Link>
              )}
            </div>
          </div>
        </MotionShine>
      </Container>
    </section>
  );
}
