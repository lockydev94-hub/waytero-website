import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight, CalendarClock, Car, Check, Info, MapPin, Route, Settings2,
} from "lucide-react";
import { Container, Section, SectionHeader, Breadcrumb } from "@/components/ui";
import JsonLd, {
  breadcrumbList,
  serviceSchema,
  webPageSchema,
} from "@/components/sections/JsonLd";
import { fetchCabCities, pickCabCity, type CabCityRow } from "@/lib/cabCity";
import { citySlug } from "@/lib/citySlug";
import { fetchCabPriceList } from "@/lib/cabPrices";
import CabCitySwitcher from "@/components/sections/CabCitySwitcher";
import CabRateTable from "@/components/sections/CabRateTable";
import { getAvailability, serviceVisible } from "@/lib/availability";
import { inr, standardPackage } from "@/lib/cabPrices";
import { BRAND } from "@/lib/brand";

// ============================================================
// /cabs/prices — the published cab price list, by city and vehicle class.
//
// This is not a marketing table with invented numbers: every row is read from
// the same rate card that `create-booking` charges from (GET
// /public/cab/cities/{id}/price-list), so a price on this page and the price at
// checkout are the same sheet. The city is part of the URL, which makes each
// city's list shareable and indexable.
//
// Doc Ref: SUPPLIER_CAB_PRICE_MASTER_V1 §4.6, BRD §35–36.
// ============================================================

/** Resolve the city path segment — legacy numeric ids are still accepted so
 *  old `?city=5` bookmarks keep working after the path migration. */
function requestedCity(cities: CabCityRow[], raw: string | undefined): CabCityRow | null {
  if (!raw) return null;
  const bySlug = cities.find((c) => citySlug(c.name) === raw.toLowerCase());
  if (bySlug) return bySlug;
  const id = Number(raw);
  return Number.isFinite(id) ? cities.find((c) => c.id === id) ?? null : null;
}

const RENTAL_META: Record<
  string,
  { label: string; title: string; blurb: string; Icon: typeof Car; bookTripType: string }
> = {
  LOCAL: {
    label: "Local",
    title: "Local cab packages",
    blurb:
      "Within-city hire with a driver, priced by the hours and kilometres included. Extra use is billed per km and per hour at the rates beside each class.",
    Icon: Car,
    bookTripType: "LOCAL",
  },
  OUTSTATION: {
    label: "Outstation",
    title: "Outstation cab packages",
    blurb:
      "One-way inter-city trips: a fixed package price with the included hours and kilometres, driver allowance and night halt stated on the card.",
    Icon: Route,
    bookTripType: "OUTSTATION",
  },
  DAILY: {
    label: "Cab Rent",
    title: "Cab rent — daily packages",
    blurb:
      "A car with driver for a duration, not a route: 12 hours and 100 km per day, night halt included. The clock starts when the car is handed over.",
    Icon: CalendarClock,
    bookTripType: "DAILY",
  },
};

const RENTAL_ORDER = ["LOCAL", "OUTSTATION", "DAILY"];

export default async function CabPricesView({
  cityParam,
  path = "/cabs/prices",
}: {
  cityParam?: string;
  /** Canonical path for this view — `/cabs/prices` or `/cabs/prices/{city}`. */
  path?: string;
}) {
  // The cab vertical can be switched off site-wide (or have no supply); the
  // price page must disappear with it rather than advertise a product that
  // cannot be booked.
  const av = await getAvailability();
  if (!serviceVisible(av, "CAB")) notFound();

  const cities = await fetchCabCities();
  if (cities.length === 0) notFound();

  const city: CabCityRow | null = requestedCity(cities, cityParam) ?? pickCabCity(cities);

  const priceList = city ? await fetchCabPriceList(city.id) : null;
  const classes = priceList?.classes ?? [];

  // Only the rental types this city actually sells, in the card's own order.
  const rentalTypes = RENTAL_ORDER.filter((t) =>
    classes.some((c) => c.packages.some((p) => p.rental_type === t)),
  );

  const cityName = priceList?.city_name ?? city?.name ?? "";
  const allPrices = classes.flatMap((c) =>
    c.packages
      .map((p) => Number(p.price))
      .filter((n) => Number.isFinite(n) && n > 0),
  );
  const lowPrice = allPrices.length ? Math.min(...allPrices) : null;
  const offerCount = classes.reduce((n, c) => n + c.packages.length, 0);
  const pageTitle = cityName
    ? `Cab prices in ${cityName}`
    : "Cab prices and fare list";
  const pageDescription = cityName
    ? `Published cab prices in ${cityName} by vehicle class — local packages, outstation trips and daily rentals, with included hours, kilometres and extra charges shown.`
    : "City-wise cab prices by vehicle class — local packages, outstation trips and daily rentals, with included hours, kilometres and extra charges shown.";

  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: pageTitle,
          description: pageDescription,
          path,
          type: "CollectionPage",
        })}
      />
      <JsonLd
        data={serviceSchema({
          name: `Cab booking in ${cityName || BRAND.primaryCity}`,
          description: pageDescription,
          path,
          areaName: cityName || BRAND.primaryCity,
          areaType: "City",
          serviceType: "Taxi",
          offer:
            lowPrice != null && offerCount > 0
              ? { lowPrice, offerCount }
              : null,
        })}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Cabs", path: "/cabs" },
          { name: "Cab prices", path },
        ])}
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Section bg="white" pad="lg" className="bg-gradient-to-b from-primary-50/60 via-white to-white">
        <Container size="lg">
          <Breadcrumb
            className="mb-4"
            items={[{ label: "Cabs", href: "/cabs" }, { label: "Cab Prices" }]}
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-700">
            <Info className="h-3.5 w-3.5" /> Published price list
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Cab prices{" "}
            <span className="text-primary-600">
              {cityName ? `in ${cityName}` : "by city"}
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-3">
            Every vehicle class we sell, with the hours and kilometres included,
            the extra charges and what comes with the fare. These are the card
            prices your booking is charged from — your final quote is calculated
            for your own route, date and pickup time before you pay.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <CabCitySwitcher
              cities={cities}
              cityName={city?.name ?? null}
              basePath="/cabs/prices"
            />
            <Link
              href="/cabs"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 px-5 py-3 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5"
            >
              Check your route <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {rentalTypes.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {rentalTypes.map((t) => (
                <a
                  key={t}
                  href={`#${t.toLowerCase()}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-7 bg-white px-3.5 py-1.5 text-xs font-bold text-ink-2 transition-colors hover:border-primary-300 hover:text-primary-700"
                >
                  {RENTAL_META[t]?.label ?? t}
                </a>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {classes.length === 0 && (
        <Section bg="white" pad="lg">
          <Container size="lg">
            <div className="rounded-3xl border border-ink-7 bg-white p-10 text-center">
              <MapPin className="mx-auto mb-4 h-10 w-10 text-ink-4" />
              <h2 className="text-xl font-bold text-ink">
                Prices for {cityName || "this city"} are being finalised
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-ink-3">
                We publish a price list only when the rate card is live for the
                city. Choose another city above, or check your route for a quote.
              </p>
              <Link
                href="/cabs"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-ink-7 bg-white px-5 py-3 text-sm font-bold text-ink-2 hover:border-primary-300 hover:text-primary-700"
              >
                Search cabs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Container>
        </Section>
      )}

      {/* ── One section per rental type ──────────────────────── */}
      {rentalTypes.map((rentalType, index) => {
        const meta = RENTAL_META[rentalType] ?? {
          label: rentalType,
          title: `${rentalType} cab packages`,
          blurb: "",
          Icon: Car,
          bookTripType: rentalType,
        };
        const Icon = meta.Icon;

        return (
          <Section
            key={rentalType}
            id={rentalType.toLowerCase()}
            bg={index % 2 === 0 ? "muted" : "white"}
            pad="lg"
          >
            <Container size="lg">
              <SectionHeader
                eyebrow={`${cityName || "City"} · ${meta.label}`}
                title={meta.title}
                subtitle={meta.blurb}
              />

              <CabRateTable
                classes={classes}
                rentalType={rentalType}
                cityName={city?.name ?? null}
                tripType={meta.bookTripType}
              />

              <div className="mt-4 flex flex-wrap items-start gap-2 text-[11.5px] leading-relaxed text-ink-4">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p className="max-w-3xl">
                  Prices are pre-tax and per vehicle, not per passenger. Toll,
                  parking and night charges are included only where the row says
                  so; anything not included is billed at the rate shown. A trip
                  priced on the standard card is not a city rate — the class says
                  &ldquo;Standard card&rdquo; when the platform sheet applies.
                </p>
              </div>
            </Container>
          </Section>
        );
      })}

      {/* ── Closing note ─────────────────────────────────────── */}
      {classes.length > 0 && (
        <Section bg="white" pad="md">
          <Container size="lg">
            <div className="rounded-3xl border border-ink-7 bg-ink-9/40 p-6 sm:p-8">
              <h2 className="text-lg font-extrabold text-ink">
                How these prices become your fare
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-3">
                The package price is the base. Beyond the included kilometres and
                hours, the extra-km and extra-hour rates above apply, and the
                pickup time decides whether a night charge is due. Add stops and
                the extra legs are measured and priced rather than waved through.
                The results page shows each line before you confirm.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/cabs"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 px-5 py-3 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5"
                >
                  Get a route quote <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/cabs/local"
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-7 bg-white px-5 py-3 text-sm font-bold text-ink-2 hover:border-primary-300 hover:text-primary-700"
                >
                  Explore local cabs
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
