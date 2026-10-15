import { CtaSection } from "@/components/renderers";
import {
  CareersHero,
  CultureGrid,
  OpenPositions,
} from "@/components/static/CareersSection";
import { pageMetadata, type SeoContent } from "@/services/seoService";
import publicCmsService from "@/services/publicCms";

const FALLBACK: SeoContent = {
  title: "Careers — WayTero",
  description:
    "Work with WayTero in Bhubaneswar. Open roles are announced on this page first — send your profile any time.",
  keywords: ["WayTero careers", "jobs Bhubaneswar", "travel tech jobs"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("careers", "/careers", FALLBACK);
}

export default async function CareersPage() {
  const profile = await publicCmsService.getPlatformProfile();
  return (
    <>
      <CareersHero />
      <CultureGrid />
      <OpenPositions />
      {/* Application-questions FAQ removed 2026-10-15: interview-process and
          perks claims were invented HR copy with no source of truth. */}
      <CtaSection
        variant={{
          title: "Want to build travel tech?",
          subtitle: "Send us your profile — we'll reach out when a fitting role opens.",
          cta_text: "Email us",
          cta_link: `mailto:${profile.support_email}?subject=Career%20introduction`,
        }}
      />
    </>
  );
}
