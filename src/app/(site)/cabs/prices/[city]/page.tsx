import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchCabCities } from "@/lib/cabCity";
import { citySlug } from "@/lib/citySlug";
import { toMetadata } from "@/services/seoService";
import CabPricesView from "@/components/cabs/CabPricesView";

// /cabs/prices/{city} — the canonical, keyword-bearing URL for a city's
// published rate card. The old ?city= form stays as a working entry point
// but points its canonical here.
export const dynamicParams = true;

export async function generateStaticParams() {
  const cities = await fetchCabCities();
  return cities.map((city) => ({ city: citySlug(city.name) }));
}

async function cityFor(slug: string) {
  const cities = await fetchCabCities();
  return cities.find((c) => citySlug(c.name) === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = await cityFor(slug);
  if (!city) return {};
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
