import Link from "next/link";
import { ArrowUpRight, BedDouble, Car, MapPinned } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { API_BASE } from "@/lib/apiBase";
import { getAvailability, serviceVisible, type ServiceKey } from "@/lib/availability";
import { getLandingRefs } from "@/lib/landingIndex";
import type { BandTone } from "@/types/cms";

/* ============================================================
   CoverageBand — the cities WayTero can actually serve today.

   Three verticals, one fetch each, and a city only appears when that
   vertical's own feed counts supply there. Every chip is also a hand-off:
   a hotel city opens its results, a tour city opens the filtered listing,
   and a cab city opens its published landing page when one exists so the
   visitor lands on content instead of a bare search form.

   Used by /about, /contact and /partner, which are not availability-gated
   themselves — so each column is dropped when its vertical is hidden, and
   the whole band disappears when nothing is live.

   Doc Ref: public_hotel_api.py (cities), public_cab_api.py (cities),
            tour/api.py (popular-destinations), public_availability.py
   ============================================================ */

interface CityRow {
  id?: number;
  city_id?: number;
  name?: string;
  hotel_count?: number;
  vehicle_count?: number;
  package_count?: number;
}

interface Chip {
  key: string;
  name: string;
  meta: string | null;
  href: string;
}

interface Column {
  key: ServiceKey;
  icon: typeof Car;
  label: string;
  chips: Chip[];
  allHref: string;
  allLabel: string;
}

const MAX_CHIPS = 10;

async function fetchRows(path: string): Promise<CityRow[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return (Array.isArray(data) ? data : (data as { items?: CityRow[] })?.items ?? []) as CityRow[];
  } catch {
    return [];
  }
}

const id = (c: CityRow) => Number(c.id ?? c.city_id ?? 0);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function CoverageBand({
  bg = "muted",
  pad = "tight",
  eyebrow = "Where we operate",
  title = "Coverage you can check yourself",
  subtitle = "These are the cities with live supply on WayTero right now, read from the catalogue the booking engine actually searches — not the marketing map. Tap any city to see what can be booked there today.",
}: {
  bg?: BandTone;
  pad?: "home" | "tight" | "sm" | "md" | "lg";
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  const [av, cabRaw, hotelRaw, tourRaw, refs] = await Promise.all([
    getAvailability(),
    fetchRows("/public/cab/cities"),
    fetchRows("/public/hotel/cities"),
    fetchRows("/public/tours/popular-destinations"),
    getLandingRefs(),
  ]);

  // Published CITY_CABS landing pages, keyed by the city they are about, so a
  // cab chip can point at real content instead of the generic /cabs form.
  const cabLanding = new Map<string, string>();
  for (const r of refs) {
    if (r.page_type !== "CITY_CABS" || !r.canonical_path) continue;
    cabLanding.set(r.scope.display_name.trim().toLowerCase(), r.canonical_path);
  }

  const columns: Column[] = [];

  if (serviceVisible(av, "CAB")) {
    const cities = cabRaw
      .map((c) => ({ id: id(c), name: (c.name ?? "").trim() }))
      .filter((c) => c.id > 0 && c.name)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (cities.length)
      columns.push({
        key: "CAB",
        icon: Car,
        label: "Cabs",
        allHref: "/cabs",
        allLabel: "All cab cities",
        chips: cities.map((c) => ({
          key: `cab-${c.id}`,
          name: c.name,
          meta: null,
          href: cabLanding.get(c.name.toLowerCase()) ?? "/cabs",
        })),
      });
  }

  if (serviceVisible(av, "HOTEL")) {
    const cities = hotelRaw
      .map((c) => ({ id: id(c), name: (c.name ?? "").trim(), count: Number(c.hotel_count ?? 0) }))
      .filter((c) => c.id > 0 && c.name && c.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    if (cities.length)
      columns.push({
        key: "HOTEL",
        icon: BedDouble,
        label: "Hotels",
        allHref: "/hotels",
        allLabel: "Browse all stays",
        chips: cities.map((c) => ({
          key: `hotel-${c.id}`,
          name: c.name,
          meta: plural(c.count, "stay", "stays"),
          href: `/hotels/results?city_id=${c.id}`,
        })),
      });
  }

  if (serviceVisible(av, "TOUR")) {
    const cities = tourRaw
      .map((c) => ({ id: id(c), name: (c.name ?? "").trim(), count: Number(c.package_count ?? 0) }))
      .filter((c) => c.id > 0 && c.name && c.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    if (cities.length)
      columns.push({
        key: "TOUR",
        icon: MapPinned,
        label: "Tours",
        allHref: "/tours",
        allLabel: "Browse all packages",
        chips: cities.map((c) => ({
          key: `tour-${c.id}`,
          name: c.name,
          meta: plural(c.count, "package", "packages"),
          href: `/tours?city_id=${c.id}&destination=${encodeURIComponent(c.name)}`,
        })),
      });
  }

  if (!columns.length) return null;

  // A pure-white card disappears on a white band and a tinted one looks
  // muddy on muted, so the surface flips with the tone. Both strings are
  // literals — Tailwind never sees a composed class name.
  const cardTone = bg === "white" ? "border-ink-7 bg-ink-9/60" : "border-ink-7 bg-white";
  const chipTone =
    bg === "white"
      ? "border-ink-7 bg-white text-ink-2 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
      : "border-ink-7 bg-ink-9/60 text-ink-2 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700";

  return (
    <Section bg={bg} pad={pad} id="coverage" overlay="dots-faint">
      <Container size="xl">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          accent="primary"
          underline
          animatedEyebrow
          scale={pad === "home" || pad === "tight" ? "home" : "default"}
        />

        <MotionStagger className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {columns.map((col) => {
            const Icon = col.icon;
            const shown = col.chips.slice(0, MAX_CHIPS);
            const rest = col.chips.length - shown.length;
            return (
              <MotionStaggerItem key={col.key} className="h-full">
                <div className={`flex h-full flex-col rounded-2xl border p-5 transition-shadow duration-300 hover:shadow-wt ${cardTone}`}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-sm">
                      <Icon className="h-[17px] w-[17px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-ink">{col.label}</span>
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink-4">
                        {plural(col.chips.length, "city", "cities")} with supply
                      </span>
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {shown.map((c) => (
                      <Link
                        key={c.key}
                        href={c.href}
                        className={`group/chip inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors ${chipTone}`}
                      >
                        {c.name}
                        {c.meta && (
                          <span className="font-semibold text-[10px] text-ink-4 group-hover/chip:text-primary-600">
                            {c.meta}
                          </span>
                        )}
                      </Link>
                    ))}
                    {rest > 0 && (
                      <Link
                        href={col.allHref}
                        className="inline-flex items-center rounded-full border border-dashed border-ink-6/70 px-2.5 py-1 text-xs font-bold text-ink-4 transition-colors hover:border-primary-400 hover:text-primary-700"
                      >
                        +{rest} more
                      </Link>
                    )}
                  </div>

                  <Link
                    href={col.allHref}
                    className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-extrabold text-primary-700 transition-colors hover:text-primary-800"
                  >
                    {col.allLabel}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
