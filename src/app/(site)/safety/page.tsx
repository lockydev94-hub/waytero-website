import { SafetyHero, SafetyPillars, EmergencyBand, SafetyFaq } from "@/components/static/SafetySection";

export const metadata = {
  title: "Safety — WayTero",
  description: "How WayTero keeps travelers safe — verified partners, live tracking, payment protection, and 24/7 support.",
};

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
