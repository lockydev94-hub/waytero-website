import { CarFront, Plane, MoveRight, CircleUserRound, RefreshCw, type LucideIcon } from "lucide-react";
import { Container, Section, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";

interface RideTypeItem {
  icon?: string;
  title: string;
  desc?: string;
  /** Optional destination. Every card goes to the cab search by default. */
  href?: string;
}

/**
 * Icon name → glyph + colour, mirroring the shared design: the local cab, the
 * one-way arrow and the round-trip loop are orange, the airport plane is
 * blue, the outstation pin-avatar is purple. The CMS stores only the name.
 */
const ICONS: Record<string, { Icon: LucideIcon; color: string }> = {
  CarFront: { Icon: CarFront, color: "text-accent-500" },
  Plane: { Icon: Plane, color: "text-primary-600" },
  MoveRight: { Icon: MoveRight, color: "text-accent-500" },
  CircleUserRound: { Icon: CircleUserRound, color: "text-[#7C3AED]" },
  RefreshCw: { Icon: RefreshCw, color: "text-accent-500" },
};

const DEFAULT: RideTypeItem[] = [
  { icon: "CarFront", title: "Local Cab", desc: "Travel within your city" },
  { icon: "Plane", title: "Airport Transfer", desc: "Hassle-free airport pickup & drop" },
  { icon: "MoveRight", title: "One Way", desc: "Simple and affordable rides" },
  { icon: "CircleUserRound", title: "Outstation", desc: "Travel to nearby cities with ease" },
  { icon: "RefreshCw", title: "Round Trip", desc: "Go, explore and return comfortably" },
];

interface RideTypesSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. */
  bg?: BandTone;
}

/**
 * RideTypesSection — "Choose Your Ride Type": the five cab trip types, as one
 * row of icon cards under the services band.
 *
 * The heading is deliberately not a SectionHeader: the design centres a navy
 * headline between two short orange dashes, with the subtitle tucked directly
 * under it and no eyebrow, underline or accent gradient.
 *
 * The first card carries the design's peach fill; the rest are white with a
 * hairline ring. On phones the row becomes a snap scroller — five cards of
 * ~165px (or two 50% columns with an orphaned fifth) are both worse than a
 * single swipeable row.
 */
export default function RideTypesSection({ variant, bg = "white" }: RideTypesSectionProps) {
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Choose Your Ride Type"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "Flexible cab options for every travel need."));
  const items = pick<RideTypeItem[]>(variant, "items", DEFAULT);
  if (items.length === 0) return null;

  return (
    <Section bg={bg} pad="none" id="ride-types" className="pt-7 pb-8 lg:pt-9 lg:pb-10">
      <Container size="wide">
        <div className="mb-5 text-center lg:mb-6">
          <h2 className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[21px] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink sm:text-[25px] lg:text-[28px]">
            <span className="h-[3px] w-6 shrink-0 rounded-full bg-accent-500 sm:w-7" aria-hidden />
            <span>{title}</span>
            <span className="h-[3px] w-6 shrink-0 rounded-full bg-accent-500 sm:w-7" aria-hidden />
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3 sm:text-sm">{subtitle}</p>
          )}
        </div>

        {/* `scroll-pl-4` matches the padding: without it the mandatory snap
            aligns the first card to the padding edge and scrolls the gutter
            away on load, leaving the card flush with the screen. */}
        <MotionStagger className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:gap-3.5 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-5">
          {items.map((r, i) => {
            const glyph = ICONS[r.icon ?? ""] ?? ICONS.CarFront;
            const Icon = glyph.Icon;
            return (
              <MotionStaggerItem
                key={`${r.title}-${i}`}
                className="w-[46%] min-w-[152px] shrink-0 snap-start md:w-auto md:min-w-0"
              >
                <a
                  href={r.href?.trim() || "/cabs"}
                  className={`group flex h-full flex-col items-center rounded-[16px] px-3.5 py-5 text-center transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-1 ${
                    i === 0
                      ? "bg-[#FDF1E6] ring-1 ring-[#FBE3CE] hover:shadow-[0_12px_26px_-14px_rgba(240,90,34,0.5)]"
                      : "bg-white ring-1 ring-ink-7/70 shadow-[0_2px_10px_rgba(11,27,59,0.05)] hover:ring-primary-200 hover:shadow-wt-md"
                  }`}
                >
                  <Icon className={`h-[34px] w-[34px] ${glyph.color}`} strokeWidth={1.8} aria-hidden />
                  <h3 className="mt-3 text-[15px] font-bold leading-tight text-ink">{r.title}</h3>
                  {r.desc && (
                    <p className="mt-1.5 max-w-[172px] text-[12.5px] leading-[1.5] text-ink-3">{r.desc}</p>
                  )}
                </a>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
