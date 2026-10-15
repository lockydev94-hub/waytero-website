import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// Client page — cannot export metadata; <head> values live here,
// DB-first via SEO_PAGE_CONTACT.
export async function generateMetadata() {
  return pageMetadata("contact", "/contact", {
    title: "Contact Us",
    description:
      "Reach WayTero — phone, WhatsApp, and email for bookings and support, plus our Bhubaneswar office address.",
    keywords: ["contact WayTero", "travel support", "cab support", "WayTero phone"],
  });
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
