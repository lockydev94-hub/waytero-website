import { Briefcase, Car, MapPin, Users, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui";
import { pick } from "@/types/cms";

/**
 * HeroStatsStrip — the slim proof band that sits directly under the hero.
 *
 * Design: four icon + number + label cells on a near-white blue wash, split
 * by hairline dividers, with the icon colour alternating blue / logo orange.
 * Server component (no state, no client JS).
 *
 * CMS → Homepage → Hero → `stats` may override the cells (each
 * `{ icon, value, label }`, icon by lucide name). With no admin rows the
 * design's own figures render, the same way the hero's copy and photo fall
 * back to the bundled design assets.
 */

interface HeroStat {
  icon?: string | null;
  value?: string | null;
  label?: string | null;
}

const DEFAULT_STATS: HeroStat[] = [
  { icon: "Car", value: "5,000+", label: "Verified Drivers" },
  { icon: "Briefcase", value: "200+", label: "Tour Packages" },
  { icon: "MapPin", value: "50+", label: "Popular Destinations" },
  { icon: "Users", value: "10,000+", label: "Happy Travelers" },
];

const ICONS: Record<string, LucideIcon> = { Car, Briefcase, MapPin, Users };

export default function HeroStatsStrip({ variant }: { variant: Record<string, unknown> }) {
  const cms = pick<HeroStat[]>(variant, "stats", []);
  const rows = (Array.isArray(cms) ? cms : []).filter((s) => !!s?.value?.trim() || !!s?.label?.trim());
  const items = rows.length > 0 ? rows : DEFAULT_STATS;

  return (
    <section
      aria-label="WayTero in numbers"
      className="border-y border-ink-7 bg-gradient-to-r from-white via-primary-50/70 to-white"
    >
      <Container size="wide">
        <ul className="grid grid-cols-2 sm:grid-cols-4">
          {items.map((stat, i) => {
            const Icon = (stat.icon && ICONS[stat.icon]) || Car;
            // The design keeps every glyph blue except the tour-package case.
            const tone = stat.icon === "Briefcase" || (!stat.icon && i === 1)
              ? "text-accent-500"
              : "text-primary-600";
            return (
              <li
                key={`${stat.label}-${i}`}
                className={`flex items-center justify-center gap-2.5 py-4 sm:gap-3 lg:py-5
                  ${i % 2 === 1 ? "border-l border-ink-7" : ""}
                  ${i > 0 ? "sm:border-l sm:border-ink-7" : ""}`}
              >
                <Icon className={`h-7 w-7 shrink-0 sm:h-8 sm:w-8 ${tone}`} strokeWidth={1.5} aria-hidden />
                <div className="min-w-0">
                  <p className="text-[15px] font-extrabold leading-tight tracking-tight text-ink sm:text-[17px]">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-ink-4 sm:text-xs">{stat.label}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
