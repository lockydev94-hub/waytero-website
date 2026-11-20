import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, BedDouble, MapPin, Star } from "lucide-react";
import { Container, Section, Breadcrumb } from "@/components/ui";
import JsonLd, {
  breadcrumbList,
  itemList,
  serviceSchema,
  webPageSchema,
} from "@/components/sections/JsonLd";
import LandingHotelGrid from "@/components/landing/LandingHotelGrid";
import { API_BASE } from "@/lib/apiBase";
import { getAvailability, serviceVisible } from "@/lib/availability";
import { citySlug } from "@/lib/citySlug";
import { cityLanding, hotelCityPath } from "@/lib/cityRoutes";
import { getLandingRefs, type LandingHotel } from "@/lib/landingIndex";
import { toMetadata, absoluteImage } from "@/services/seoService";

// ============================================================
// /hotels/in/{city} — a crawlable city hotel page.
//
// The old city link was `/hotels/results?city=…`, a noindexed search URL.
// This route renders the same real inventory in the initial HTML, with its
// own title, canonical, breadcrumb and ItemList. If the admin has published
// the editorial CITY_HOTELS landing page, that page wins and this URL
// redirects to it so the two never compete.
// ============================================================

export const dynamicParams = true;

interface HotelCityRow {
  id: number;
  name: string;
  state_name?: string | null;
  hotel_count?: number;
  from_price?: number | null;
  avg_rating?: number | null;
}

interface HotelRow {
  id: number;
  slug?: string | null;
  hotel_name: string;
  star_rating?: number | null;
  city_name: string;
  state_name?: string | null;
  primary_image_url?: string | null;
  average_rating: number;
  total_reviews: number;
  starting_price: number;
  is_featured: boolean;
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

async function loadCity(slug: string): Promise<HotelCityRow | null> {
  const data = await fetchJson<HotelCityRow[] | { items?: HotelCityRow[] }>(
    `${API_BASE}/public/hotel/cities`,
  );
  const rows = Array.isArray(data) ? data : data?.items ?? [];
  return rows.find((c) => citySlug(c.name) === slug) ?? null;
}

async function loadHotels(cityId: number): Promise<HotelRow[]> {
  const data = await fetchJson<{ items?: HotelRow[] }>(
    `${API_BASE}/public/hotel/search?city_id=${cityId}&page_size=24&sort_by=recommended`,
  );
  return data?.items ?? [];
}

export async function generateStaticParams() {
  const data = await fetchJson<HotelCityRow[] | { items?: HotelCityRow[] }>(
    `${API_BASE}/public/hotel/cities`,
  );
  const rows = Array.isArray(data) ? data : data?.items ?? [];
  return rows
    .filter((c) => Number(c.hotel_count ?? 0) > 0)
    .map((c) => ({ city: citySlug(c.name) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const [city, refs] = await Promise.all([loadCity(slug), getLandingRefs()]);
  if (!city) return {};
  const landing = cityLanding(refs, "CITY_HOTELS", city.name);
  const path = landing?.canonical_path ?? hotelCityPath(city.name);
  return toMetadata(
    {
      title: `Hotels in ${city.name} — Book Stays with Upfront Prices`,
      description: `Browse ${city.hotel_count ?? "live"} verified hotels in ${city.name}${city.state_name ? `, ${city.state_name}` : ""}. Compare real guest ratings and starting nightly prices, then book on WayTero.`,
      keywords: [
        `hotels in ${city.name}`,
        `${city.name} hotel booking`,
        `budget hotels ${city.name}`,
        `hotels near ${city.name}`,
      ],
    },
    path,
  );
}

export default async function HotelsInCityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const av = await getAvailability();
  if (!serviceVisible(av, "HOTEL")) notFound();

  const { city: slug } = await params;
  const [city, refs] = await Promise.all([loadCity(slug), getLandingRefs()]);
  if (!city || Number(city.hotel_count ?? 0) === 0) notFound();

  const landing = cityLanding(refs, "CITY_HOTELS", city.name);
  if (landing) permanentRedirect(landing.canonical_path);

  const hotels = await loadHotels(city.id);
  if (hotels.length === 0) notFound();

  const path = hotelCityPath(city.name);
  const lowest = hotels
    .map((h) => Number(h.starting_price ?? 0))
    .filter((n) => n > 0)
    .sort((a, b) => a - b)[0];
  const cover = hotels.find((h) => h.primary_image_url)?.primary_image_url;
  const pageTitle = `Hotels in ${city.name}`;
  const pageDescription = `Verified hotels in ${city.name}${city.state_name ? `, ${city.state_name}` : ""} with real guest ratings and upfront nightly prices. Book on WayTero.`;

  const landingHotels: LandingHotel[] = hotels.map((h) => ({
    id: h.id,
    slug: h.slug ?? null,
    hotel_name: h.hotel_name,
    star_rating: h.star_rating ?? null,
    city_name: h.city_name,
    starting_price: Number(h.starting_price ?? 0),
    primary_image_url: h.primary_image_url ?? null,
    average_rating: Number(h.average_rating ?? 0),
    total_reviews: Number(h.total_reviews ?? 0),
    is_featured: Boolean(h.is_featured),
  }));

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
          name: `Hotel booking in ${city.name}`,
          description: pageDescription,
          path,
          areaName: city.name,
          areaType: "City",
          serviceType: "Hotel",
          offer:
            lowest && hotels.length
              ? { lowPrice: lowest, offerCount: hotels.length }
              : null,
        })}
      />
      <JsonLd
        data={itemList(
          `Hotels in ${city.name}`,
          hotels.map((h) => ({
            name: h.hotel_name,
            path: `/hotels/${h.slug ?? h.id}`,
          })),
        )}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Hotels", path: "/hotels" },
          { name: city.name, path },
        ])}
      />

      <Section
        bg="white"
        pad="lg"
        className="bg-gradient-to-b from-primary-50/60 via-white to-white"
      >
        <Container size="lg">
          <Breadcrumb
            className="mb-4"
            items={[{ label: "Hotels", href: "/hotels" }, { label: city.name }]}
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-700">
            <BedDouble className="h-3.5 w-3.5" /> Stays in {city.name}
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Hotels in <span className="text-primary-600">{city.name}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-3">
            {hotels.length} verified {hotels.length === 1 ? "stay" : "stays"}
            {city.state_name ? ` in ${city.state_name}` : ""} with real guest
            ratings and published nightly prices. Every hotel below is live on
            WayTero right now.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/hotels/results?city=${citySlug(city.name)}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 px-6 py-3.5 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5"
            >
              Search with your dates <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-7 bg-white px-6 py-3.5 text-sm font-bold text-ink-2 transition-all hover:border-primary-300 hover:text-primary-700"
            >
              All hotel cities
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary-500" />
              {city.name}
            </span>
            {Number(city.avg_rating ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
                {Number(city.avg_rating).toFixed(1)} average guest rating
              </span>
            )}
            {lowest && (
              <span>
                From ₹{lowest.toLocaleString("en-IN")} per night
              </span>
            )}
          </div>
        </Container>
      </Section>

      <LandingHotelGrid
        hotels={landingHotels}
        title={`Available stays in ${city.name}`}
        cityName={city.name}
      />

      <Section bg="white" pad="md">
        <Container size="lg">
          <Link
            href={`/hotels/results?city=${citySlug(city.name)}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:underline"
          >
            Check live availability in {city.name} <ArrowRight className="h-4 w-4" />
          </Link>
        </Container>
      </Section>
    </>
  );
}
