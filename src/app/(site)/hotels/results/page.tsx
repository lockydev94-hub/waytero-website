import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAvailability, serviceVisible } from "@/lib/availability";
import HotelResultsPage from "./results-view";

// Transactional search results: indexable variants would multiply for every
// city/date/guest combination. Follow the hotel links, but canonicalise to the
// hotel hub and keep the result pages themselves out of the index.
export const metadata: Metadata = {
  title: "Hotel Search Results",
  description:
    "Live hotel availability and starting nightly prices for your city and dates. Compare verified stays and book on WayTero.",
  alternates: { canonical: "/hotels" },
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

// Server wrapper: /hotels/results is a client page, so the availability
// gate lives here — HOTEL disabled or zero supply → 404, same as the
// listing. The client view itself stays untouched.
export default async function HotelResultsRoute() {
  const av = await getAvailability();
  if (!serviceVisible(av, "HOTEL")) notFound();
  return <HotelResultsPage />;
}
