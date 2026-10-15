import { notFound } from "next/navigation";
import { getAvailability, serviceVisible } from "@/lib/availability";
import CabResultsPage from "./results-view";

// Server wrapper: /cabs/results is a client page, so the availability
// gate lives here — CAB disabled or zero priced supply → 404.
export default async function CabResultsRoute() {
  const av = await getAvailability();
  if (!serviceVisible(av, "CAB")) notFound();
  return <CabResultsPage />;
}
