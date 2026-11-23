import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Car, Plane, MapPin, ArrowRight, Repeat2, ShieldCheck, Wallet, Clock,
  Search, ListChecks, BadgeCheck, Route,
} from "lucide-react";
import { Container, Section, SectionHeader, Card, IconBox, Breadcrumb } from "@/components/ui";
import CabRateTable from "@/components/sections/CabRateTable";
import { pickCabCity, type CabCityRow } from "@/lib/cabCity";
import {
  fetchCabPriceList,
  rentalTypeForTrip,
  type CabPriceClass,
} from "@/lib/cabPrices";
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from "@/components/ui";
import PageFaq, { type FaqItem } from "@/components/sections/PageFaq";
import JsonLd, {
  breadcrumbList,
  faqPageSchema,
  serviceSchema,
  webPageSchema,
} from "@/components/sections/JsonLd";
import { enumLabel } from "@/components/landing/format";
import { API_BASE } from "@/lib/apiBase";
import { toMetadata } from "@/services/seoService";
import { getAvailability, serviceVisible } from "@/lib/availability";
import { cabPricesPath } from "@/lib/cityRoutes";
import { getLandingRefs } from "@/lib/landingIndex";
import { BRAND } from "@/lib/brand";

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
      "Package prices from the published rate card, shown before you book",
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
      "Night pickups quoted with the night charge shown up front",
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

interface FareMatrixRow {
  vehicle_category_id: number;
  vehicle_category: string;
  seats: number | null;
  trip_type: string;
  base_fare: number;
  per_km_rate: number;
  minimum_km: number;
  estimated_total: number;
  source: string;
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

  // The city must be the one the rest of the site quotes — the one with its
  // own fare rules — not `cities[0]`, which is alphabetical (Ahmedabad) and
  // has no card of its own.
  let cities: CabCityRow[] = [];
  try {
    const res = await fetch(`${API_BASE}/public/cab/cities`, {
      next: { revalidate: 300 },
    });
    if (res.ok) cities = (await res.json()) as CabCityRow[];
  } catch {
    cities = [];
  }
  const city = pickCabCity(cities);

  // The card is what bookable searches are quoted from, so it is the page's
  // primary price source. `rows` (the per-km fare sheet) is only the
  // fallback for a city with no card at all.
  const priceList = city ? await fetchCabPriceList(city.id) : null;
  const classes: CabPriceClass[] = priceList?.classes ?? [];
  const rentalType = rentalTypeForTrip(code);
  const hasCard = classes.some((c) =>
    c.packages.some((p) => p.rental_type === rentalType),
  );

  let rows: FareMatrixRow[] = [];
  if (!hasCard && city) {
    try {
      const res = await fetch(
        `${API_BASE}/public/cab/cities/${city.id}/fare-matrix?distance_km=10`,
        { next: { revalidate: 300 } },
      );
      if (res.ok) {
        const data = await res.json();
        rows = ((data.rows ?? []) as FareMatrixRow[]).filter(
          (r) => r.trip_type === code,
        );
      }
    } catch {
      rows = [];
    }
  }

  return {
    cities,
    rows,
    cityName: priceList?.city_name ?? city?.name ?? null,
    cityId: city?.id ?? null,
    classes,
    rentalType,
    hasCard,
  };
}

// ── SERP helpers ───────────────────────────────────────────────────────────

const DESC_BUDGET = 158;

/**
 * Keep the DB blurb, but never ship a description far under the ~155
 * characters a SERP snippet can use. The OUTSTATION blurb is 117 characters
 * on its own, so those pages were showing half an empty snippet.
 */
function serpDescription(blurb: string, filler: string): string {
  const base = blurb.trim();
  const full = base.length >= 140 ? base : `${base.replace(/[.\s]+$/, ".")} ${filler}`;
  if (full.length <= DESC_BUDGET) return full;
  const cut = full.slice(0, DESC_BUDGET - 1);
  const at = cut.lastIndexOf(" ");
  const head = at > DESC_BUDGET * 0.6 ? cut.slice(0, at) : cut;
  return `${head.replace(/[,;:.\s]+$/, "")}…`;
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
  // CAB hidden site-wide when disabled / no supply — trip pages 404 cleanly.
  const av = await getAvailability();
  if (!serviceVisible(av, "CAB")) notFound();
  const code = SLUG_TO_CODE[trip];
  const meta = code ? TRIP_META[code] : null;
  if (!meta) return { title: "Cab Booking" };
  return toMetadata(
    {
      // "in India" made these pages compete nationally on a service we sell
      // in one city. The service area is the ranking term that also converts.
      title: `${meta.h1} in ${BRAND.primaryCity}`,
      description: serpDescription(
        meta.blurb,
        `Published fares, verified drivers and driver details on every ${BRAND.primaryCity} trip.`,
      ),
      keywords: [
        `${meta.name.toLowerCase()} cab booking ${BRAND.primaryCity}`,
        `${meta.name.toLowerCase()} taxi ${BRAND.primaryCity}`,
        `${meta.name.toLowerCase()} cab ${BRAND.primaryState}`,
        "cab booking",
        "upfront fares",
        "verified drivers",
      ],
    },
    `/cabs/${meta.slug}`,
  );
}

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// Per-trip-type FAQ — rendered visibly on the page AND emitted as FAQPage
// JSON-LD (both required for eligibility; SEO audit §4).
const TRIP_FAQS: Record<string, FaqItem[]> = {
  LOCAL: [
    { question: "How is local cab fare calculated?", answer: "Your city's rate card sells local hire as packages — for example 8 hours and 80 km at a set price. Use beyond the included hours or kilometres is billed at the card's extra-hour and extra-km rates, and anything not included is itemised before you pay. No surge, no hidden charges." },
    { question: "Can I book a cab for a full day?", answer: "Yes. Choose Local in the booking form and set your pickup time — full-day packages are priced by the same transparent fare engine, and the total is always shown upfront." },
    { question: "Are the drivers verified?", answer: "Every WayTero driver is background-checked with ID and licence on file, and vehicles carry valid documents verified by our team before going live." },
    { question: "What payment methods can I use?", answer: "UPI, debit/credit cards, net-banking, and WayTero Wallet. Wallet refunds land instantly when a booking is cancelled per policy." },
  ],
  AIRPORT: [
    { question: "Will the driver wait if my flight is late?", answer: "Airport bookings include a free waiting window at pickup. Waiting beyond it is charged at the transparent per-hour rate shown in the fare rules — never a surprise." },
    { question: "How much luggage fits in an airport cab?", answer: "Each category lists its luggage capacity — hatchbacks carry 1–2 bags, sedans 2–3, SUVs and MUVs 3–5, and tempo travellers more. Pick the category that matches your group." },
    { question: "Do you offer one-way airport drops?", answer: "Yes — airport transfers are priced as point-to-point trips, so you pay for your ride, not the driver's return journey." },
    { question: "Can I book an airport cab at night?", answer: "Yes. Cabs are available 24×7. Night-timing pickups carry a clearly displayed night charge that's included in your upfront quote." },
  ],
  OUTSTATION: [
    { question: "What does outstation fare include?", answer: "An outstation package: included hours and kilometres, the driver allowance, and the extra-km rate for distance beyond the package. Night charges and tolls (where applicable) are shown separately in your quote before booking." },
    { question: "Is GST included in the shown fare?", answer: "The quoted fare is pre-tax. GST is added at trip close and itemised on your invoice — the estimate you see is always honest about this." },
    { question: "Can I book a one-way outstation drop?", answer: "Yes — one-way pricing is the whole point of WayTero outstation cabs. Choose One Way in the booking form and pay only for your leg." },
    { question: "How do I track my outstation trip?", answer: "Open the Track page with your booking number. Once a driver is assigned it shows the status, the driver's name and contact and the vehicle — there is no live map." },
  ],
  ONE_WAY: [
    { question: "How is one-way pricing different?", answer: "You pay only for the distance of your own journey — the driver's return leg isn't billed to you. Your quote uses the outstation package, and any distance beyond its included kilometres is billed at the card's extra-km rate." },
    { question: "Is there a minimum distance for one-way trips?", answer: "The outstation package includes a set number of kilometres. A shorter trip simply costs the package price — nothing extra is added." },
    { question: "Can I add stops along the way?", answer: "Add special instructions when booking — the driver and support team see them. Long detours may be repriced transparently before you confirm." },
    { question: "What if I need to cancel?", answer: "The charge follows the ladder in force at the moment you cancel, and the refund preview shows the exact amount before you commit. Approved refunds land in your WayTero wallet, which you can spend on any future booking." },
  ],
  ROUND_TRIP: [
    { question: "How do round-trip fares work?", answer: "Round trips use the same upfront fare engine with per-day driver allowance for multi-day itineraries — every component is itemised before you pay." },
    { question: "Do I get the same cab for the whole trip?", answer: "Yes — round trips keep the same vehicle and driver for the entire itinerary, including multi-day temple circuits and weekend plans." },
    { question: "Can I change my return date?", answer: "Return dates are set at booking so the fare can be computed correctly. Changes are supported by customer care and may adjust the driver-allowance component transparently." },
    { question: "Is the driver's night halt charged separately?", answer: "Driver allowance covering night halts is part of your upfront quote — shown as its own line in the fare breakdown, never added later." },
  ],
};

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
  const { cities, rows, cityName, classes, rentalType, hasCard } = data;
  // A city with a published CITY_CABS page gets that editorial URL; the rest
  // fall back to the filtered booking form using a readable slug, never an id.
  const refs = await getLandingRefs();
  const cityLanding = new Map(
    refs
      .filter((r) => r.page_type === "CITY_CABS" && r.canonical_path)
      .map((r) => [r.scope.display_name.trim().toLowerCase(), r.canonical_path]),
  );

  const Icon = meta.Icon;

  const faqs = TRIP_FAQS[code] ?? [];

  // FAQPage + Service + BreadcrumbList + WebPage — prerendered into the
  // initial HTML so the trip page is understood as a bookable service, not
  // just a set of FAQ snippets.
  const allPrices = classes.flatMap((c) =>
    c.packages
      .map((p) => Number(p.price))
      .filter((n) => Number.isFinite(n) && n > 0),
  );
  const lowPrice = allPrices.length ? Math.min(...allPrices) : null;
  const offerCount = classes.reduce((n, c) => n + c.packages.length, 0);
  const schemas: Array<Record<string, unknown>> = [
    webPageSchema({
      name: `${meta.h1} in ${cityName ?? BRAND.primaryCity}`,
      description: meta.blurb,
      path: `/cabs/${meta.slug}`,
    }),
    serviceSchema({
      name: `${meta.h1} in ${cityName ?? BRAND.primaryCity}`,
      description: meta.blurb,
      path: `/cabs/${meta.slug}`,
      areaName: cityName ?? BRAND.primaryCity,
      areaType: "City",
      serviceType: "Taxi",
      offer:
        lowPrice != null && offerCount > 0
          ? { lowPrice, offerCount }
          : null,
    }),
    faqPageSchema(faqs),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Cabs", path: "/cabs" },
      { name: meta.h1, path: `/cabs/${meta.slug}` },
    ]),
  ];

  return (
    <>
      {schemas.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Section bg="white" pad="lg" className="bg-gradient-to-b from-primary-50/60 via-white to-white">
        <Container size="lg">
          <MotionFadeIn>
            <Breadcrumb
              className="mb-4"
              items={[{ label: "Cabs", href: "/cabs" }, { label: meta.name }]}
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-700">
              <Icon className="h-3.5 w-3.5" /> Cab booking
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              {meta.h1} <span className="text-primary-600">in {cityName ?? BRAND.primaryCity}</span>
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

      {/* ── Published prices (rate card, per vehicle class) ───── */}
      {hasCard && (
        <Section bg="white" pad="lg" id="trip-prices">
          <Container size="lg">
            <SectionHeader
              eyebrow={`Upfront pricing${cityName ? ` · ${cityName}` : ""}`}
              title={
                cityName
                  ? `${meta.name} cab prices in ${cityName}`
                  : `${meta.name} cab prices`
              }
              subtitle="Package prices from the published rate card — the same sheet your booking is charged from. Your exact quote is calculated for your route, date and pickup time before you pay."
            />
            <CabRateTable
              classes={classes}
              rentalType={rentalType}
              cityName={cityName}
              tripType={code}
            />
            <p className="mt-3 text-xs leading-relaxed text-ink-4">
              Prices exclude GST and tolls unless a row says otherwise. Extra
              kilometres and hours beyond the package are billed at the rates
              above; a night pickup adds the night charge the fare rules define.{" "}
              {rentalType === "LOCAL" && code !== "LOCAL"
                ? "Airport transfers are priced as a same-city local package. "
                : ""}
              {code === "ROUND_TRIP"
                ? "A round trip spanning several days is charged the Cab Rent daily package. "
                : ""}
              <Link href="/cabs/prices" className="font-bold text-primary-700 hover:underline">
                See the full price list for every city
              </Link>
              .
            </p>
          </Container>
        </Section>
      )}

      {/* Fallback: a city with no rate card falls back to the per-km fare
          sheet, which is what the booking flow quotes there too. */}
      {rows.length > 0 && (
        <Section bg="white" pad="lg">
          <Container size="lg">
            <SectionHeader
              eyebrow="Upfront pricing"
              title={
                cityName
                  ? `Sample ${meta.name.toLowerCase()} fares in ${cityName}`
                  : "Sample fares across vehicle categories"
              }
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
                  {rows.map((r) => (
                    <tr key={r.vehicle_category_id} className="border-b border-ink-8 last:border-0">
                      <td className="px-5 py-3.5 font-bold text-ink">
                        {enumLabel(r.vehicle_category)}
                        {r.source === "default" ? "*" : ""}
                      </td>
                      <td className="px-5 py-3.5 text-ink-3">{r.seats ?? "—"}</td>
                      <td className="px-5 py-3.5 text-ink-2">{INR(r.base_fare)}</td>
                      <td className="hidden px-5 py-3.5 text-ink-2 sm:table-cell">{INR(r.per_km_rate)}</td>
                      <td className="hidden px-5 py-3.5 text-ink-3 md:table-cell">{r.minimum_km ?? "—"} km</td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-primary-700">
                        {INR(r.estimated_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-4">
              Fares exclude GST and tolls where applicable.{" "}
              {rows.some((r) => r.source === "default")
                ? "Rows marked * follow platform-standard pricing — this city has no custom rule yet. "
                : ""}
              City-specific pricing may differ — the exact amount is always shown before booking.
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
                  href={cityLanding.get(c.name.toLowerCase()) ?? cabPricesPath(c.name)}
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

      {/* ── How booking works ─────────────────────────────────── */}
      <Section bg="muted" pad="lg">
        <Container size="lg">
          <SectionHeader
            eyebrow="Simple process"
            title={`How ${meta.name.toLowerCase()} booking works`}
            accent="primary"
            underline
            animatedEyebrow
          />
          <MotionStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Search, title: "1. Enter your route", desc: `Pickup, drop (if needed), date and time — the ${meta.name.toLowerCase()} form only asks for what this trip type requires.` },
              { icon: ListChecks, title: "2. Compare fares", desc: "Every vehicle category with an upfront, itemised fare for your route — base, per-km, allowance — before you choose." },
              { icon: BadgeCheck, title: "3. Confirm booking", desc: "Sign in, review the fare breakdown, and confirm. Your booking is filed and its status updates as the trip moves." },
              { icon: Route, title: "4. Ride & track", desc: "A verified driver is assigned; the Track page shows the status, the driver and the vehicle." },
            ].map((s) => (
              <MotionStaggerItem key={s.title}>
                <Card variant="premium" hover lift="sm" className="h-full">
                  <IconBox icon={<s.icon className="h-5 w-5" />} tone="accent" size="md" glow />
                  <h3 className="mt-3 font-bold text-ink">{s.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-3">{s.desc}</p>
                </Card>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </Container>
      </Section>

      {/* ── FAQ (visible + FAQPage JSON-LD above) ─────────────── */}
      <PageFaq
        faqs={faqs}
        eyebrow={`${meta.name} cab FAQs`}
        subtitle={`Straight answers about ${meta.name.toLowerCase()} cab booking on WayTero.`}
      />

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
