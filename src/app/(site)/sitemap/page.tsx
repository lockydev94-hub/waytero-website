import { SitemapHero, SitemapGroups } from "@/components/static/SitemapSection";
import { pageMetadata } from "@/services/seoService";

export async function generateMetadata() {
  return pageMetadata("sitemap", "/sitemap", {
    title: "Sitemap",
    description: "Every page on WayTero — services, policies, and city pages — in one place.",
    keywords: ["sitemap", "WayTero pages", "site index"],
  });
}

export default function SitemapPage() {
  return (
    <>
      <SitemapHero />
      <SitemapGroups />
    </>
  );
}
