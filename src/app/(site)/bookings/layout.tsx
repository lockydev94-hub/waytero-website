import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// Client page — metadata lives in the route layout. Account pages stay out of
// the index and the sitemap.
export async function generateMetadata() {
  const meta = await pageMetadata("bookings", "/bookings", {
    title: "My Bookings",
    description:
      "WayTero bookings — trip status, refund preview, invoices and itinerary downloads for every cab, hotel and tour.",
    keywords: ["WayTero bookings", "booking status", "trip invoice"],
  });
  return { ...meta, robots: { index: false, follow: false } };
}

export default function BookingsLayout({ children }: { children: ReactNode }) {
  return children;
}
