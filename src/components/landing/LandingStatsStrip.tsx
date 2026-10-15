import { Container, Section, MotionFadeIn, MotionStagger, MotionStaggerItem } from "@/components/ui";
import StatValue from "./StatValue";
import type { LandingStat } from "@/lib/landingIndex";

// ============================================================
// LandingStatsStrip — the honest numbers row.
// <640: grid-cols-2 · sm: up to 4 · lg: 4 (5 when 5 items)
// Numeric values count up via MotionScrollCounter; pre-formatted
// strings (₹ prices from the backend) render as-is.
// ============================================================

export default function LandingStatsStrip({
  stats,
  title,
}: {
  stats: LandingStat[];
  title?: string | null;
}) {
  if (!stats.length) return null;

  return (
    <Section bg="white" pad="sm">
      <Container size="xl">
        {title && (
          <MotionFadeIn>
            <h2 className="mb-5 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              {title}
            </h2>
          </MotionFadeIn>
        )}
        <MotionStagger
          className={`grid gap-3 sm:gap-4 grid-cols-2 ${
            stats.length >= 5 ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-4 lg:grid-cols-4"
          }`}
        >
          {stats.map((s, i) => (
            <MotionStaggerItem key={i}>
              <div className="h-full rounded-2xl border border-ink-7 bg-gradient-to-b from-white to-ink-1/40 p-4 text-center sm:p-5">
                <div className="text-xl font-extrabold text-primary-600 sm:text-2xl lg:text-3xl">
                  <StatValue stat={s} />
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-4 sm:text-xs">
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
