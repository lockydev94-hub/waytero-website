import { CtaSection } from "@/components/renderers";
import { PressHero, MediaKitBand } from "@/components/static/PressSection";
import { pageMetadata, type SeoContent } from "@/services/seoService";
import { BRAND } from "@/lib/brand";
import publicCmsService from "@/services/publicCms";

const FALLBACK: SeoContent = {
  title: "Press & Media — WayTero",
  description:
    "Media resources and press enquiries for WayTero — write to our team for data, commentary, and founder interviews.",
  keywords: ["WayTero press", "travel tech India media", "WayTero newsroom"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("press", "/press", FALLBACK);
}

export default async function PressPage() {
  const profile = await publicCmsService.getPlatformProfile();
  return (
    <>
      <PressHero />
      <MediaKitBand />
      <CtaSection
        variant={{
          title: "Covering travel-tech?",
          subtitle: "Our team shares data, commentary, and founder interviews — reach out anytime.",
          cta_text: "Press enquiries",
          cta_link: `mailto:${profile.support_email || BRAND.email}`,
        }}
      />
    </>
  );
}
