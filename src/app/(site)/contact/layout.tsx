import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// The <head> values for this route live here rather than in the page, so the
// page component can stay focused on the bands. DB-first via SEO_PAGE_CONTACT.
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
