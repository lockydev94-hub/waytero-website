import {
  SupportHero,
  HelpCategoryGrid,
  SupportFaq,
  SupportChannels,
} from "@/components/static/SupportSection";

export const metadata = {
  title: "Help Center — WayTero",
  description: "WayTero help center — answers for cab, hotel, and tour bookings, payments, wallet, and refunds. 24/7 human support.",
};

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
