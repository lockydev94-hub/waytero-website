import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import CallNowButton from "@/components/chat/CallNowButton";
import { publicCmsService } from "@/services/publicCms";
import type { SiteHeaderData, SiteFooterData } from "@/types/cms";

/**
 * Layout shared by every public marketing/utility page under (site).
 * Fetches the CMS header + footer on the server so the nav is SEO-friendly
 * and reflects whatever the admin configured in the CMS panel.
 *
 * heroHasMedia: true when the homepage hero actually has a background
 * image/video. The Header is a client component and combines this flag
 * with its own usePathname() so the transparent over-hero variant only
 * applies on the homepage (`/`); everywhere else it stays solid white so
 * the nav stays legible on dark page sections (e.g. /bookings has a navy
 * banner). Computing the pathname client-side means we don't need an edge
 * middleware just to read the URL in a server component.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const cms = await publicCmsService.getHomepage();

  // Determine if the hero section has media. /bookings has its own dark hero
  // block, but it lives below the global header — the header should stay
  // solid white there (that's handled in the Header via the path check).
  const heroSection = (cms?.sections ?? []).find((s) => s.section_key === "HERO");
  const heroVariant = (heroSection?.variant ?? {}) as Record<string, unknown>;
  const heroHasMedia =
    !!(heroVariant.background_image_url as string | null | undefined) ||
    !!(heroVariant.background_video_url as string | null | undefined);

  return (
    <>
      <Header cmsData={cms?.header ?? null} heroHasMedia={heroHasMedia} />
      <main>{children}</main>
      <Footer cmsData={cms?.footer ?? null} />
      {/* Live support chat — smart-routed to online admin agents */}
      <ChatWidget />
      {/* Floating Call Now — stacked left of the chat launcher, no overlap */}
      <CallNowButton />
    </>
  );
}
