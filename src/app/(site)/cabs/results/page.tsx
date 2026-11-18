import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAvailability, serviceVisible } from "@/lib/availability";
import CabResultsPage from "./results-view";

// Transactional search results: useful to the person searching, duplicate
// thin content to a crawler (route/date coordinates multiply endlessly).
// Keep the links followable so equity reaches the fare pages, but canonicalise
// to the cab hub and keep the query combinations out of the index.
export const metadata: Metadata = {
  title: "Cab Search Results",
  description:
    "Live cab fares for your route, vehicle category and pickup time. Compare upfront prices and book a verified driver on WayTero.",
  alternates: { canonical: "/cabs" },
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

// Server wrapper: /cabs/results is a client page, so the availability
// gate lives here — CAB disabled or zero priced supply → 404.
export default async function CabResultsRoute() {
  const av = await getAvailability();
  if (!serviceVisible(av, "CAB")) notFound();
  return <CabResultsPage />;
}
