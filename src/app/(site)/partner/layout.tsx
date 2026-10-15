import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// The page itself is a client component and cannot export metadata —
// <head> values live here instead, DB-first via SEO_PAGE_PARTNER.
export async function generateMetadata() {
  return pageMetadata("partner", "/partner", {
    title: "Become a Partner",
    description:
      "Join WayTero as a cab operator, hotel, or tour partner — list your services, manage bookings, and get paid on time.",
    keywords: ["travel partner", "cab partner", "hotel partner", "tour operator", "WayTero partner"],
  });
}

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return children;
}
