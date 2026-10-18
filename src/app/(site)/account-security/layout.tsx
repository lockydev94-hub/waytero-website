import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// Client page — metadata lives in the route layout. Account pages stay out of
// the index and the sitemap.
export async function generateMetadata() {
  const meta = await pageMetadata("account-security", "/account-security", {
    title: "Account Security",
    description:
      "WayTero account security — the devices signed in to your account and your password.",
    keywords: ["WayTero account security", "signed-in devices", "change password"],
  });
  return { ...meta, robots: { index: false, follow: false } };
}

export default function AccountSecurityLayout({ children }: { children: ReactNode }) {
  return children;
}
