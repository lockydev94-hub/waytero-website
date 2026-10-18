import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// Client page — metadata lives in the route layout. Account pages stay out of
// the index and the sitemap.
export async function generateMetadata() {
  const meta = await pageMetadata("profile", "/profile", {
    title: "My Profile",
    description:
      "WayTero account profile — personal details, contact information and saved addresses.",
    keywords: ["WayTero profile", "account details", "saved addresses"],
  });
  return { ...meta, robots: { index: false, follow: false } };
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
