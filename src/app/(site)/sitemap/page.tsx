import { SitemapHero, SitemapGroups } from "@/components/static/SitemapSection";

export const metadata = {
  title: "Sitemap — WayTero",
  description: "Every page on WayTero, in one place.",
};

export default function SitemapPage() {
  return (
    <>
      <SitemapHero />
      <SitemapGroups />
    </>
  );
}
