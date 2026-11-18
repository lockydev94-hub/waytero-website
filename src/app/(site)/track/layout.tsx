import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// <head> values live here, DB-first via SEO_PAGE_TRACK.
export async function generateMetadata() {
  const meta = await pageMetadata("track", "/track", {
    title: "Track Your Booking",
    description:
      "Check a WayTero booking with its number and registered mobile — status, driver or property details, dates and amount. No sign-in.",
    keywords: ["booking status", "track booking", "WayTero booking", "trip status"],
  });
  return { ...meta, robots: { index: false, follow: false } };
}

export default function TrackLayout({ children }: { children: ReactNode }) {
  return children;
}
