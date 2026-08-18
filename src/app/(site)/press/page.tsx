import { CtaSection } from "@/components/renderers";
import {
  PressHero,
  PressReleaseList,
  MediaKitBand,
} from "@/components/static/PressSection";

export const metadata = {
  title: "Press & Media — WayTero",
  description: "Latest news, announcements, and media resources from WayTero — India's travel operating system.",
};

export default function PressPage() {
  return (
    <>
      <PressHero />
      <PressReleaseList />
      <MediaKitBand />
      <CtaSection
        variant={{
          title: "Covering travel-tech in India?",
          subtitle: "Our press team shares data, commentary, and founder interviews — reach out anytime.",
          cta_text: "Press enquiries",
          cta_link: "mailto:press@waytero.com",
        }}
      />
    </>
  );
}
