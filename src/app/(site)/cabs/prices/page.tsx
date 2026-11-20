import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchCabCities, type CabCityRow } from "@/lib/cabCity";
import { citySlug } from "@/lib/citySlug";
import { toMetadata } from "@/services/seoService";
import CabPricesView from "@/components/cabs/CabPricesView";

// /cabs/prices is the national list. A city-specific list has a real path
// (/cabs/prices/bhubaneswar); this page keeps the old ?city= entry point for
// bookmarks and canonicalises it to the path, but never advertises the query
// URL as its canonical.
const PAGE_PATH = "/cabs/prices";

function cityFromParam(cities: CabCityRow[], raw?: string): CabCityRow | null {
  if (!raw) return null;
  const bySlug = cities.find((c) => citySlug(c.name) === raw.toLowerCase());
  if (bySlug) return bySlug;
  const id = Number(raw);
  return Number.isFinite(id) ? cities.find((c) => c.id === id) ?? null : null;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}): Promise<Metadata> {
  const { city: cityParam } = await searchParams;
  const cities = await fetchCabCities();
  const selected = cityFromParam(cities, cityParam);
  const path = selected
    ? `${PAGE_PATH}/${citySlug(selected.name)}`
    : PAGE_PATH;
  return toMetadata(
    {
      title: selected
        ? `Cab Prices in ${selected.name} — Fare List`
        : "Cab Prices & Fare List",
      description: selected
        ? `Published cab prices in ${selected.name} by vehicle class — local packages, outstation trips and daily rentals, with included hours, kilometres and extra charges shown.`
        : "City-wise cab prices by vehicle class — local packages, outstation trips and daily rentals, with included hours, kilometres and extra charges shown. The same rate card that prices your booking.",
      keywords: [
        selected ? `cab prices ${selected.name}` : "cab prices India",
        "taxi fare list",
        "local cab package",
        "outstation cab fare",
      ],
    },
    path,
  );
}

export default async function CabPricesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city: cityParam } = await searchParams;
  const cities = await fetchCabCities();
  if (cities.length === 0) notFound();
  const selected = cityFromParam(cities, cityParam);
  const path = selected ? `${PAGE_PATH}/${citySlug(selected.name)}` : PAGE_PATH;
  return <CabPricesView cityParam={selected ? citySlug(selected.name) : undefined} path={path} />;
}
