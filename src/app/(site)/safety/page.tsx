import { SafetyHero, SafetyPillars, EmergencyBand, SafetyFaq } from "@/components/static/SafetySection";
import { pageMetadata } from "@/services/seoService";

export async function generateMetadata() {
  return pageMetadata("safety", "/safety", {
    title: "Safety",
    description:
      "How WayTero keeps travelers safe — verified partners, live trip tracking, payment protection, and support channels that reach real people.",
    keywords: ["travel safety", "verified drivers", "live tracking", "WayTero"],
  });
}

export default function SafetyPage() {
  return (
    <>
      <SafetyHero />
      <SafetyPillars />
      <EmergencyBand />
      <SafetyFaq />
    </>
  );
}
