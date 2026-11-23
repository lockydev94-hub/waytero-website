import { Code2 } from "lucide-react";
import PageHero from "@/components/sections/PageHero";
import SitemapIndex from "@/components/sections/SitemapIndex";
import { ButtonLink } from "@/components/ui";
import { pageMetadata, type SeoContent } from "@/services/seoService";
import StaticPageSeo from "@/components/sections/StaticPageSeo";

const META_FALLBACK: SeoContent = {
  title: "Sitemap — WayTero",
  description:
    "Every page on WayTero in one place: services, city and route pages, policies and support.",
  keywords: ["sitemap", "WayTero pages", "site index"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("sitemap", "/sitemap", META_FALLBACK);
}

export default function SitemapPage() {
  return (
    <>
      <StaticPageSeo pageKey="sitemap" path="/sitemap" name="Sitemap" crumb="Sitemap" />
      <PageHero
        eyebrow="Find your way"
        title="Everything on this site, in one list"
        accent="one list"
        description="Services, city and route pages, policies and support. Verticals with no live supply are left out here exactly as they are taken down everywhere else, so nothing in this list is a dead door."
        actions={
          <ButtonLink
            href="/sitemap.xml"
            variant="outline"
            size="md"
            className="border-ink-3/30 text-ink hover:bg-ink-9/40"
            leftIcon={<Code2 className="h-4 w-4" aria-hidden />}
          >
            XML sitemap for search engines
          </ButtonLink>
        }
      />

      <SitemapIndex bg="muted" />
    </>
  );
}
