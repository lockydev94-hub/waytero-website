import { Container, Section, MotionFadeIn, MotionStagger, MotionStaggerItem } from "@/components/ui";
import StatValue from "./StatValue";
import type { LandingStat } from "@/lib/landingIndex";
import type { BandTone } from "@/types/cms";

// ============================================================
// LandingStatsStrip — the honest numbers row.
//
// Laid out like the homepage's STATS band: a centred heading with accent
// dashes and an auto-fitting row capped at ~900px, so three stats fill the
// band instead of leaving a hole in a fixed four-column grid. The count is
// the content, so the card stays quiet — navy figure, one label, soft ring.
// ============================================================

export default function LandingStatsStrip({
  stats,
  title,
  bg = "white",
  pad = "sm",
}: {
  stats: LandingStat[];
  title?: string | null;
  bg?: BandTone;
  pad?: "home" | "tight" | "sm" | "md" | "lg";
}) {
  if (!stats.length) return null;

  return (
    <Section bg={bg} pad={pad}>
      <Container size="wide">
        {title && (
          <MotionFadeIn>
            <h2 className="flex items-center justify-center gap-2.5 text-center text-[21px] font-extrabold tracking-[-0.01em] text-ink sm:text-[23px] lg:text-[25px]">
              <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
              <span>{title}</span>
              <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
            </h2>
          </MotionFadeIn>
        )}
        <MotionStagger
          className={`mx-auto mt-5 grid max-w-[900px] gap-3 sm:gap-4 grid-cols-2 ${
            stats.length === 3
              ? "sm:grid-cols-3"
              : stats.length >= 5
                ? "sm:grid-cols-3 lg:grid-cols-5"
                : "sm:grid-cols-4"
          }`}
        >
          {stats.map((s, i) => (
            <MotionStaggerItem key={i}>
              <div className="h-full rounded-2xl bg-white p-5 text-center shadow-[0_10px_30px_-22px_rgba(16,24,40,0.45)] ring-1 ring-black/[0.05]">
                <div className="text-[30px] font-extrabold leading-none tracking-[-0.02em] tabular-nums text-ink">
                  <StatValue stat={s} />
                </div>
                <div className="mt-1.5 text-[12.5px] font-medium text-ink-4">
                  {s.label}
                </div>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}
