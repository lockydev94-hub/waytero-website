import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchCabCities } from "@/lib/cabCity";
import { citySlug } from "@/lib/citySlug";
import { fetchCabPriceList } from "@/lib/cabPrices";
import { toMetadata } from "@/services/seoService";
import CabPricesView from "@/components/cabs/CabPricesView";

// /cabs/prices/{city} — the canonical, keyword-bearing URL for a city's
// published rate card.
export const dynamicParams = true;

export async function generateStaticParams() {
  const cities = await fetchCabCities();
  return cities.map((city) => ({ city: citySlug(city.name) }));
}

async function cityFor(slug: string) {
  const cities = await fetchCabCities();
  return cities.find((c) => citySlug(c.name) === slug) ?? null;
}

/** True only when the city has its own rate card. Cities that only inherit
 *  the platform default card would all render the same table with the city
 *  name swapped in — five near-identical URLs competing with each other, none
 *  of which Google has ever indexed. They stay reachable for humans but are
 *  kept out of the index and out of the sitemap (see sitemap.ts). */
async function hasOwnRateCard(cityId: number): Promise<boolean> {
  const card = await fetchCabPriceList(cityId);
  return Boolean(card?.classes.some((c) => c.rate_source === "CITY"));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = await cityFor(slug);
  if (!city) return {};
  const ownCard = await hasOwnRateCard(city.id);
  return toMetadata(
    {
      title: `Cab Prices in ${city.name} — Fare List`,
      description: `Published cab prices in ${city.name} by vehicle class — local packages, outstation trips and daily rentals, with included hours, kilometres and extra charges shown.`,
      keywords: [
        `cab prices ${city.name}`,
        `${city.name} taxi fare`,
        `local cab ${city.name}`,
        `outstation cab ${city.name}`,
      ],
    },
    `/cabs/prices/${slug}`,
    ownCard
      ? undefined
      : { robots: { index: false, follow: true } },
  );
}

export default async function CabPricesCityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = await cityFor(slug);
  if (!city) notFound();
  return <CabPricesView cityParam={slug} path={`/cabs/prices/${slug}`} />;
}
