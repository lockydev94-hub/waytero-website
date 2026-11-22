import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchCabCities } from "@/lib/cabCity";
import { toMetadata } from "@/services/seoService";
import CabPricesView from "@/components/cabs/CabPricesView";

// /cabs/prices is the rate-card hub. Each serviced city has its own canonical
// path (/cabs/prices/bhubaneswar); the `?city=` form is retired because it
// produced a second URL for the same document.
//
// NOTE: no `searchParams` in generateMetadata — see the note in
// /cabs/routes/page.tsx. Awaiting searchParams streams the metadata into the
// body, where it stops being the document's title.
const PAGE_PATH = "/cabs/prices";

export async function generateMetadata(): Promise<Metadata> {
  return toMetadata(
    {
      title: "Cab Prices in Bhubaneswar — Fare List",
      description:
        "Published cab prices in Bhubaneswar by vehicle class — local packages, outstation trips and daily rentals, with included hours, kilometres and extra charges shown.",
      keywords: [
        "cab prices Bhubaneswar",
        "Bhubaneswar taxi fare list",
        "local cab package Bhubaneswar",
        "outstation cab fare Bhubaneswar",
      ],
    },
    PAGE_PATH,
  );
}

export default async function CabPricesPage() {
  const cities = await fetchCabCities();
  if (cities.length === 0) notFound();
  return <CabPricesView path={PAGE_PATH} />;
}
