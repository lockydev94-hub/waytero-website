import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, Compass, MapPin } from "lucide-react";
import { Container, Section, Breadcrumb } from "@/components/ui";
import JsonLd, {
  breadcrumbList,
  faqPageSchema,
  itemList,
  serviceSchema,
  webPageSchema,
} from "@/components/sections/JsonLd";
import TourCard from "@/components/tours/TourCard";
import { API_BASE } from "@/lib/apiBase";
import { getAvailability, serviceVisible } from "@/lib/availability";
import { citySlug } from "@/lib/citySlug";
import { cityTourContent } from "@/lib/cityTourContent";
import {
  cabPricesPath,
  cityLanding,
  hotelCityPath,
  tourCityPath,
} from "@/lib/cityRoutes";
import { getLandingRefs } from "@/lib/landingIndex";
import type { PublicTourPackage } from "@/services/tourService";
import { absoluteImage, toMetadata } from "@/services/seoService";

// ============================================================
// /tours/in/{city} — a crawlable city tour page.
//
// `/tours?city=…` is an interactive search result (noindex). This route
// renders the same live packages in the initial HTML with a city title,
// canonical, breadcrumb and ItemList. A published CITY_TOURS landing page
// still wins and receives a 308 from here.
// ============================================================

export const dynamicParams = true;

interface DestinationRow {
  city_id: number;
  name?: string;
  city_name?: string;
  state_name?: string | null;
  package_count?: number;
  hero_image_url?: string | null;
  image_url?: string | null;
  from_price?: number | null;
  starting_price?: number | null;
}

interface TourRow extends Partial<PublicTourPackage> {
  id: number;
  slug: string;
  package_name: string;
}

interface HotelCityRow {
  name: string;
  hotel_count?: number;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function loadCity(slug: string): Promise<DestinationRow | null> {
  const data = await fetchJson<
    DestinationRow[] | { items?: DestinationRow[] }
  >(`${API_BASE}/public/tours/popular-destinations`);
  const rows = Array.isArray(data) ? data : data?.items ?? [];
  return (
    rows.find(
      (d) => citySlug(d.city_name ?? d.name ?? "") === slug,
    ) ?? null
  );
}

function normalizeTour(t: TourRow): PublicTourPackage {
  const primary = t.primary_image_url ?? t.media?.[0]?.media_url ?? null;
  return {
    ...(t as PublicTourPackage),
    itinerary: t.itinerary ?? [],
    inclusions: t.inclusions ?? [],
    exclusions: t.exclusions ?? [],
    pricing: t.pricing ?? [],
    media:
      t.media ??
      (primary
        ? [{ media_url: primary, is_primary: true, caption: null }]
        : []),
  };
}

async function loadTours(cityId: number): Promise<PublicTourPackage[]> {
  const data = await fetchJson<{ items?: TourRow[] }>(
    `${API_BASE}/public/tours/packages?city_id=${cityId}&page_size=24&sort=recommended`,
  );
  return (data?.items ?? []).map(normalizeTour);
}

async function loadHotelCities(): Promise<HotelCityRow[]> {
  const data = await fetchJson<HotelCityRow[] | { items?: HotelCityRow[] }>(
    `${API_BASE}/public/hotel/cities`,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function generateStaticParams() {
  const data = await fetchJson<
    DestinationRow[] | { items?: DestinationRow[] }
  >(`${API_BASE}/public/tours/popular-destinations`);
  const rows = Array.isArray(data) ? data : data?.items ?? [];
  return rows
    .filter((d) => Number(d.package_count ?? 0) > 0)
    .map((d) => ({ city: citySlug(d.city_name ?? d.name ?? "") }))
    .filter((p) => p.city);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const [city, refs] = await Promise.all([loadCity(slug), getLandingRefs()]);
  if (!city) return {};
  const name = city.city_name ?? city.name ?? "";
  const landing = cityLanding(refs, "CITY_TOURS", name);
  const path = landing?.canonical_path ?? tourCityPath(name);
  return toMetadata(
    {
      title: `Tour Packages in ${name} — Itineraries & Prices`,
      description: `Explore ${city.package_count ?? "live"} tour packages in ${name}${city.state_name ? `, ${city.state_name}` : ""}. Day-by-day itineraries, clear inclusions and upfront per-package prices on WayTero.`,
      keywords: [
        `tour packages ${name}`,
        `${name} tours`,
        `holiday packages ${name}`,
        `${name} sightseeing package`,
      ],
    },
    path,
    // A city page with no editorial copy is a card grid and a headline: it
    // competes with the package pages it links to and loses. Those stay
    // crawlable but out of the index until someone writes the copy.
    cityTourContent(slug) ? undefined : { robots: { index: false, follow: true } },
  );
}

export default async function ToursInCityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const av = await getAvailability();
  if (!serviceVisible(av, "TOUR")) notFound();

  const { city: slug } = await params;
  const [city, refs] = await Promise.all([loadCity(slug), getLandingRefs()]);
  if (!city || Number(city.package_count ?? 0) === 0) notFound();

  const name = city.city_name ?? city.name ?? "";
  const landing = cityLanding(refs, "CITY_TOURS", name);
  if (landing) permanentRedirect(landing.canonical_path);

  const [tours, hotelCities] = await Promise.all([
    loadTours(city.city_id),
    loadHotelCities(),
  ]);
  if (tours.length === 0) notFound();

  const path = tourCityPath(name);
  // Only link a hotel city path when that city actually has hotel supply;
  // an empty city page would be a soft 404 and a broken internal link.
  const hotelLanding = cityLanding(refs, "CITY_HOTELS", name);
  const hasHotelSupply = hotelCities.some(
    (c) => citySlug(c.name) === citySlug(name) && Number(c.hotel_count ?? 0) > 0,
  );
  const hotelHref =
    hotelLanding?.canonical_path ?? (hasHotelSupply ? hotelCityPath(name) : null);
  const lowest = tours
    .map((t) => Number(t.starting_price ?? 0))
    .filter((n) => n > 0)
    .sort((a, b) => a - b)[0];
  const cover =
    tours.find((t) => t.primary_image_url)?.primary_image_url ??
    city.hero_image_url ??
    city.image_url ??
    null;
  const pageTitle = `Tour packages in ${name}`;
  const pageDescription = `Day-by-day itineraries, clear inclusions and upfront per-package prices for tours in ${name}${city.state_name ? `, ${city.state_name}` : ""}.`;
  const content = cityTourContent(slug);

  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: pageTitle,
          description: pageDescription,
          path,
          type: "CollectionPage",
          image: absoluteImage(cover),
        })}
      />
      <JsonLd
        data={serviceSchema({
          name: `Tour packages in ${name}`,
          description: pageDescription,
          path,
          areaName: name,
          areaType: "City",
          serviceType: "Tour",
          offer:
            lowest && tours.length
              ? { lowPrice: lowest, offerCount: tours.length }
              : null,
        })}
      />
      <JsonLd
        data={itemList(
          `Tour packages in ${name}`,
          tours.map((t) => ({
            name: t.package_name,
            path: `/tours/${t.slug}`,
          })),
        )}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Tours", path: "/tours" },
          { name: name, path },
        ])}
      />
      {content && <JsonLd data={faqPageSchema(content.faqs)} />}

      <Section
        bg="white"
        pad="lg"
        className="bg-gradient-to-b from-accent-50/60 via-white to-white"
      >
        <Container size="lg">
          <Breadcrumb
            className="mb-4"
            items={[{ label: "Tours", href: "/tours" }, { label: name }]}
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-100 bg-accent-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent-700">
            <Compass className="h-3.5 w-3.5" /> Curated in {name}
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Tour packages in <span className="text-primary-600">{name}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-3">
            {tours.length} live {tours.length === 1 ? "package" : "packages"}
            {city.state_name ? ` across ${city.state_name}` : ""} with real
            day-by-day itineraries, stated inclusions and one upfront package
            price.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 px-6 py-3.5 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5"
            >
              Browse all tours <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/tours?city=${citySlug(name)}&destination=${encodeURIComponent(name)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-7 bg-white px-6 py-3.5 text-sm font-bold text-ink-2 transition-all hover:border-primary-300 hover:text-primary-700"
            >
              Filter by dates & budget
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary-500" />
              {name}
            </span>
            {lowest && (
              <span>From ₹{lowest.toLocaleString("en-IN")} per package</span>
            )}
          </div>
        </Container>
      </Section>

      {content && (
        <Section bg="white" pad="lg">
          <Container size="lg">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <div className="space-y-4 text-base leading-relaxed text-ink-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                  Visiting {name}
                </h2>
                {content.intro.map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
              </div>
              <ul className="space-y-3">
                {content.highlights.map((h) => (
                  <li
                    key={h.title}
                    className="rounded-2xl border border-ink-7 bg-accent-50/50 p-5"
                  >
                    <p className="text-sm font-extrabold text-ink">{h.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-3">
                      {h.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>
      )}

      <Section bg="white" pad="md">
        <Container size="xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">
            Available tour packages
          </h2>
          <p className="mt-1 text-sm text-ink-3">
            Every package below is live and bookable on WayTero right now.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((t) => (
              <TourCard key={t.id} tour={t} />
            ))}
          </div>
        </Container>
      </Section>

      {content && (
        <Section bg="white" pad="md">
          <Container size="lg">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">
              {name} tours — questions travellers ask
            </h2>
            <dl className="mt-5 divide-y divide-ink-7 border-y border-ink-7">
              {content.faqs.map((f) => (
                <div key={f.question} className="py-4">
                  <dt className="text-sm font-extrabold text-ink">{f.question}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-ink-3">
                    {f.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>
      )}

      <Section bg="muted" pad="md">
        <Container size="lg">
          <h2 className="text-xl font-extrabold text-ink">
            Plan the rest of your trip to {name}
          </h2>
          <div className={`mt-4 grid gap-3 ${hotelHref ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
            {hotelHref && (
              <Link
                href={hotelHref}
                className="rounded-2xl border border-ink-7 bg-white p-5 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-700"
              >
                Hotels in {name} <ArrowRight className="ml-1 inline h-4 w-4" />
              </Link>
            )}
            <Link
              href={cabPricesPath(name)}
              className="rounded-2xl border border-ink-7 bg-white p-5 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-700"
            >
              Cab prices in {name} <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
