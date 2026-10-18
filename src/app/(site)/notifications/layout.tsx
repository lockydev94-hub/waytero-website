import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// Client page — metadata lives in the route layout. Account pages stay out of
// the index and the sitemap.
export async function generateMetadata() {
  const meta = await pageMetadata("notifications", "/notifications", {
    title: "My Notifications",
    description:
      "WayTero notifications — booking confirmations, refunds, invoices and trip updates for your account.",
    keywords: ["WayTero notifications", "booking updates", "refund status"],
  });
  return { ...meta, robots: { index: false, follow: false } };
}

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return children;
}
