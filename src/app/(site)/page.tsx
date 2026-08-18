import type { Metadata } from "next";
import HomepageServer from "@/components/renderers/HomepageServer";

// ── Page-level SEO (SSR) ─────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "WayTero — India's Travel Operating System",
  description:
    "Book cabs, hotels, and tour packages instantly. WayTero is India's complete travel platform — connecting you to drivers, hotels, and tour operators seamlessly.",
  alternates: {
    canonical: "https://waytero.com",
  },
};

// Server-rendered for SEO — CMS payload fetched server-side with a
// 60s revalidate window; falls back to bundled defaults if the CMS is down.
export const revalidate = 60;

export default function HomePage() {
  return <HomepageServer />;
}