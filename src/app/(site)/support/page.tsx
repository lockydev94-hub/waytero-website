import {
  SupportHero,
  HelpCategoryGrid,
  SupportFaq,
  SupportChannels,
} from "@/components/static/SupportSection";
import { pageMetadata } from "@/services/seoService";

export async function generateMetadata() {
  return pageMetadata("support", "/support", {
    title: "Help Center",
    description:
      "WayTero help center — answers for cab, hotel, and tour bookings, payments, wallet, and refunds, with contact channels for every question.",
    keywords: ["help center", "customer support", "WayTero", "booking help"],
  });
}

export default function SupportPage() {
  return (
    <>
      <SupportHero />
      <HelpCategoryGrid />
      <SupportFaq />
      <SupportChannels />
    </>
  );
}
