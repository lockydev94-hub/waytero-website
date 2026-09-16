import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Car, Plane, MapPin, ArrowRight, Repeat2, ShieldCheck, Wallet, Clock,
} from "lucide-react";
import { Container, Section, SectionHeader, Card, IconBox, Badge } from "@/components/ui";
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from "@/components/ui";

// ============================================================
// /cabs/[trip] — DB-driven cab trip-type landing pages.
//
// Every trip type that has at least one ACTIVE pricing rule in
// vehicle_pricing_rules / default_vehicle_pricing_rules gets a real,
// crawlable page: /cabs/local, /cabs/airport, /cabs/outstation,
// /cabs/round-trip, /cabs/one-way …
//
// Content is 100% DB-driven (the sitemap links these URLs, so they must
// exist and show genuine, current pricing). If the DB has no data for the
// trip type, the page 404s — nothing is faked.
//
// Doc Ref: BRD Part 3 §35-36 (fare engine, city pricing)
// ============================================================

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const TRIP_META: Record<
  string,
  { slug: string; name: string; h1: string; blurb: string; Icon: typeof Car; bullets: string[] }
> = {
  LOCAL: {
    slug: "local",
    name: "Local",
    h1: "Local Cab Booking",
    blurb:
      "Hourly and full-day local cabs in your city — station transfers, shopping trips, or a full day of errands with a verified driver.",
    Icon: Car,
    bullets: [
      "Transparent per-km pricing from the live fare engine",
      "Verified, background-checked drivers",
      "Book in under a minute — no calls, no haggling",
    ],
  },
  AIRPORT: {
    slug: "airport",
    name: "Airport",
    h1: "Airport Transfer Cabs",
    blurb:
      "On-time airport pickups and drops with upfront fares, flight-friendly waiting charges, and drivers who know the terminal routes.",
    Icon: Plane,
    bullets: [
      "Upfront fare — no surge, no hidden charges",
      "Generous luggage space across categories",
      "24×7 support on every airport trip",
    ],
  },
  OUTSTATION: {
    slug: "outstation",
    name: "Outstation",
    h1: "Outstation Cab Booking",
    blurb:
      "One-way inter-city drops at honest one-way pricing. Pay for the distance you travel, not the driver's return journey.",
    Icon: MapPin,
    bullets: [
      "One-way pricing on select routes",
      "Night-charge rules applied transparently",
      "Live trip tracking shared with family",
    ],
  },
  ONE_WAY: {
    slug: "one-way",
    name: "One Way",
    h1: "One-Way Cab Booking",
    blurb:
      "Point-to-point drops between cities — pay only for your leg of the journey with a clear per-km breakdown.",
    Icon: ArrowRight,
    bullets: [
      "True one-way fare engine",
      "Door-to-door pickup and drop",
      "Cancellation policy shown before you pay",
    ],
  },
  ROUND_TRIP: {
    slug: "round-trip",
    name: "Round Trip",
    h1: "Round Trip Cabs",
    blurb:
      "Return journeys with the same vehicle and driver — ideal for temple circuits, weekend trips, and multi-stop itineraries.",
    Icon: Repeat2,
    bullets: [
      "Same cab for the whole itinerary",
      "Per-day driver allowance shown upfront",
      "Multi-day trips fully supported",
    ],
  },
};

const SLUG_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(TRIP_META).map(([code, m]) => [m.slug, code]),
);

interface CategoryRow {
  vehicle_category_id: number;
  category_name: string;
  seating_capacity: number | null;
  image_url: string | null;
  icon_url: string | null;
  base_fare: string | number;
  minimum_km: number | null;
  per_km_rate: string | number;
  driver_allowance: string | number;
}

async function loadTripPage(code: string) {
  // Trip type exists (has ≥1 active rule)?
  let tripTypes: Array<{ code: string; display_name: string }> = [];
  try {
    const res = await fetch(`${API_BASE}/public/cab/trip-types`, {
      next: { revalidate: 300 },
    });
    if (res.ok) tripTypes = await res.json();
  } catch {
    tripTypes = [];
  }
  if (!tripTypes.some((t) => t.code === code)) return null;

  // Cities + per-category default pricing for the pricing table.
  const [citiesRes, catsRes] = await Promise.all([
    fetch(`${API_BASE}/public/cab/cities`, { next: { revalidate: 300 } }),
    fetch(
      `${API_BASE}/public/cab/fare-estimate?city_id=1&distance_km=10&trip_type=${code}`,
      { next: { revalidate: 300 } },
    ).catch(() => null),
  ]);

  let cities: Array<{ id: number; name: string; state_name: string | null }> = [];
  if (citiesRes.ok) cities = await citiesRes.json();

  let categories: CategoryRow[] = [];
  if (catsRes && catsRes.ok) {
    const data = await catsRes.json();
    categories = (data.categories ?? []) as CategoryRow[];
  }

  return { cities, categories };
}

export function generateStaticParams() {
  // Prerender the canonical set; the page 404s at request time for codes
  // without active pricing rules.
  return [
    { trip: "local" },
    { trip: "airport" },
    { trip: "outstation" },
    { trip: "round-trip" },
    { trip: "one-way" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trip: string }>;
}): Promise<Metadata> {
  const { trip } = await params;
  const code = SLUG_TO_CODE[trip];
  const meta = code ? TRIP_META[code] : null;
  if (!meta) return { title: "Cab Booking" };
  return {
    title: `${meta.h1} in India — Upfront Fares`,
    description: meta.blurb.slice(0, 300),
    alternates: { canonical: `/cabs/${meta.slug}` },
  };
}

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default async function CabTripPage({
  params,
}: {
  params: Promise<{ trip: string }>;
}) {
  const { trip } = await params;
  const code = SLUG_TO_CODE[trip];
  const meta = code ? TRIP_META[code] : null;
  if (!meta) notFound();

  const data = await loadTripPage(code);
  if (!data) notFound(); // no active pricing rules → nothing to sell yet
  const { cities, categories } = data;

  const Icon = meta.Icon;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <Section bg="white" pad="lg" className="bg-gradient-to-b from-primary-50/60 via-white to-white">
        <Container size="lg">
          <MotionFadeIn>
            <nav className="mb-4 text-xs text-ink-4">
              <Link href="/cabs" className="hover:text-primary-600">Cabs</Link>
              <span className="mx-1.5">/</span>
              <span className="text-ink-3">{meta.name}</span>
            </nav>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-700">
              <Icon className="h-3.5 w-3.5" /> Cab booking
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              {meta.h1} <span className="text-primary-600">across India</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-3">{meta.blurb}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/cabs?trip_type=${code}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 px-6 py-3.5 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5"
              >
                Book a {meta.name.toLowerCase()} cab <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/cabs"
                className="inline-flex items-center gap-2 rounded-xl border border-ink-7 bg-white px-6 py-3.5 text-sm font-bold text-ink-2 transition-all hover:border-primary-300 hover:text-primary-700"
              >
                Compare all trip types
              </Link>
            </div>
          </MotionFadeIn>
        </Container>
      </Section>

      {/* ── Why this trip type ───────────────────────────────── */}
      <Section bg="muted" pad="md">
        <Container size="lg">
          <MotionStagger className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {meta.bullets.map((b, i) => {
              const icons = [ShieldCheck, Wallet, Clock];
              const IIcon = icons[i % icons.length];
              return (
                <MotionStaggerItem key={b}>
                  <Card variant="premium" hover lift="sm" className="flex h-full items-start gap-3">
                    <IconBox icon={<IIcon className="h-5 w-5" />} tone="primary" size="md" />
                    <p className="text-sm font-medium leading-relaxed text-ink-2">{b}</p>
                  </Card>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
        </Container>
      </Section>

      {/* ── Live pricing table (DB-driven, 10 km sample) ──────── */}
      {categories.length > 0 && (
        <Section bg="white" pad="lg">
          <Container size="lg">
            <SectionHeader
              eyebrow="Upfront pricing"
              title="Sample fares across vehicle categories"
              subtitle="Indicative 10 km fares from the live fare engine. Your exact quote is calculated for your route, date, and night timing before you pay."
            />
            <div className="overflow-hidden rounded-2xl border border-ink-7 bg-white shadow-wt-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-7 bg-ink-9/60 text-xs font-bold uppercase tracking-wider text-ink-3">
                    <th className="px-5 py-3.5">Vehicle</th>
                    <th className="px-5 py-3.5">Seats</th>
                    <th className="px-5 py-3.5">Base fare</th>
                    <th className="hidden px-5 py-3.5 sm:table-cell">Per km</th>
                    <th className="hidden px-5 py-3.5 md:table-cell">Included km</th>
                    <th className="px-5 py-3.5 text-right">10 km ≈</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.vehicle_category_id} className="border-b border-ink-8 last:border-0">
                      <td className="px-5 py-3.5 font-bold text-ink">
                        {c.category_name.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-3.5 text-ink-3">{c.seating_capacity ?? "—"}</td>
                      <td className="px-5 py-3.5 text-ink-2">{INR(c.base_fare)}</td>
                      <td className="hidden px-5 py-3.5 text-ink-2 sm:table-cell">{INR(c.per_km_rate)}</td>
                      <td className="hidden px-5 py-3.5 text-ink-3 md:table-cell">{c.minimum_km ?? "—"} km</td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-primary-700">
                        {INR(
                          Number(c.base_fare) +
                            Math.max(0, 10 - (c.minimum_km ?? 0)) * Number(c.per_km_rate) +
                            Number(c.driver_allowance ?? 0),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-4">
              Fares exclude GST and tolls where applicable. City-specific pricing
              may differ — the exact amount is always shown before booking.
            </p>
          </Container>
        </Section>
      )}

      {/* ── Cities with active pricing ────────────────────────── */}
      {cities.length > 0 && (
        <Section bg="muted" pad="lg">
          <Container size="lg">
            <SectionHeader
              eyebrow="Service area"
              title={`Book ${meta.name.toLowerCase()} cabs in these cities`}
            />
            <div className="flex flex-wrap gap-2.5">
              {cities.map((c) => (
                <Link
                  key={c.id}
                  href={`/cabs?city_id=${c.id}&trip_type=${code}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-7 bg-white px-4 py-2 text-sm font-semibold text-ink-2 transition-all hover:border-primary-300 hover:text-primary-700"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary-500" />
                  {c.name}
                  {c.state_name ? <span className="text-xs font-normal text-ink-4">· {c.state_name}</span> : null}
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── Other trip types ──────────────────────────────────── */}
      <Section bg="white" pad="lg">
        <Container size="lg">
          <SectionHeader eyebrow="More ways to ride" title="Other cab booking types" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(TRIP_META)
              .filter(([c]) => c !== code)
              .map(([c, m]) => (
                <Link
                  key={c}
                  href={`/cabs/${m.slug}`}
                  className="group rounded-2xl border border-ink-7 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-wt-lg"
                >
                  <m.Icon className="h-6 w-6 text-primary-600 transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="mt-3 font-bold text-ink group-hover:text-primary-700">{m.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-3">{m.blurb}</p>
                </Link>
              ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
