import { Users, Hotel, Car, MapPin, Route, Package, type LucideIcon } from "lucide-react";
import { Container, Section } from "@/components/ui";
import { MotionFadeIn, MotionScrollCounter } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";

interface StatsSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. */
  bg?: BandTone;
}

interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

/** Icon and pastel tone per label, so a new stat the admin adds still gets a
 *  sensible chip instead of repeating the first one in the list. */
const LABEL_ICONS: { match: RegExp; icon: LucideIcon; tone: string }[] = [
  { match: /cit(y|ies)|destination/i, icon: MapPin, tone: "bg-primary-50 text-primary-600" },
  { match: /tour|package/i, icon: Package, tone: "bg-accent-50 text-accent-600" },
  { match: /route/i, icon: Route, tone: "bg-success-soft text-emerald-600" },
  { match: /hotel|stay|room/i, icon: Hotel, tone: "bg-rose-50 text-rose-500" },
  { match: /cab|ride|driver|car/i, icon: Car, tone: "bg-info-soft text-sky-600" },
  { match: /travel|customer|user|partner/i, icon: Users, tone: "bg-violet-50 text-violet-600" },
];

function chipFor(label: string, index: number) {
  const hit = LABEL_ICONS.find((l) => l.match.test(label));
  if (hit) return hit;
  const fallback = LABEL_ICONS[index % LABEL_ICONS.length];
  return { icon: fallback.icon, tone: fallback.tone };
}

/**
 * StatsSection — "Numbers that speak".
 *
 * A light band of plain number cards: the count is the content, so the card
 * stays quiet (pastel icon chip, navy figure, one label) and the row is a
 * grid that fills whatever the admin seeds into `content.stats` — the old
 * fixed four-column grid left holes with three stats and put the band on a
 * navy slab that fought the rest of the page.
 *
 * No fallback numbers: an invented "50,000+ travellers" is exactly the fake
 * data the owner ruled out, so an empty list hides the band.
 */
export default function StatsSection({ variant, bg = "white" }: StatsSectionProps) {
  const headline = pick<string>(variant, "headline", "Numbers that speak");
  const subtitle = pick<string>(variant, "subheadline", "");
  const stats = pick<Stat[]>(variant, "stats", []);
  if (stats.length === 0) return null;

  return (
    <Section bg={bg} pad="none" id="stats" className="relative overflow-hidden pt-7 pb-8 lg:pt-8 lg:pb-10">
      <Container size="wide">
        <div className="text-center">
          <h2 className="flex items-center justify-center gap-2.5 text-[21px] font-extrabold tracking-[-0.01em] text-ink sm:text-[23px] lg:text-[25px]">
            <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
            <span>{headline}</span>
            <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
          </h2>
          {subtitle && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-4">{subtitle}</p>}
        </div>

        {/* Capped and centred: three stats spread across a 1328px band read as
            stretched, and the row is only as wide as its content needs. */}
        <div
          className="mx-auto mt-5 grid max-w-[900px] gap-3 sm:gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}
        >
          {stats.map((stat, i) => {
            const { icon: Icon, tone } = chipFor(stat.label, i);
            return (
              <MotionFadeIn key={stat.label} delay={Math.min(i, 4) * 0.06}>
                <div className="h-full rounded-2xl bg-white p-5 text-center shadow-[0_10px_30px_-22px_rgba(16,24,40,0.45)] ring-1 ring-black/[0.05]">
                  <span className={`mx-auto grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="mt-2.5 text-[30px] font-extrabold leading-none tracking-[-0.02em] tabular-nums text-ink">
                    <MotionScrollCounter value={stat.value} duration={1.4} />
                    {stat.suffix ?? ""}
                  </div>
                  <div className="mt-1.5 text-[12.5px] font-medium text-ink-4">{stat.label}</div>
                </div>
              </MotionFadeIn>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
