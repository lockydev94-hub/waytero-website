import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// <head> values live here, DB-first via SEO_PAGE_PARTNER.
export async function generateMetadata() {
  return pageMetadata("partner", "/partner", {
    title: "Become a Partner",
    description:
      "Join WayTero as a cab operator, hotel, or tour partner — list your services, manage bookings, and get settled against completed bookings.",
    keywords: ["travel partner", "cab partner", "hotel partner", "tour operator", "WayTero partner"],
  });
}

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return children;
}
