import { notFound } from "next/navigation";
import { getAvailability, serviceVisible } from "@/lib/availability";
import HotelResultsPage from "./results-view";

// Server wrapper: /hotels/results is a client page, so the availability
// gate lives here — HOTEL disabled or zero supply → 404, same as the
// listing. The client view itself stays untouched.
export default async function HotelResultsRoute() {
  const av = await getAvailability();
  if (!serviceVisible(av, "HOTEL")) notFound();
  return <HotelResultsPage />;
}
