import type { Metadata } from "next";
import FeedbackFlow from "@/components/capture/FeedbackFlow";
import { pageMetadata, type SeoContent } from "@/services/seoService";
import StaticPageSeo from "@/components/sections/StaticPageSeo";

const META_FALLBACK: SeoContent = {
  title: "Guest Feedback — WayTero",
  description:
    "Share your experience of a WayTero cab, hotel or tour booking. Enter your booking " +
    "number and registered mobile to leave a rating and review.",
  keywords: ["WayTero feedback", "travel review India", "booking feedback"],
};

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("feedback", "/feedback", META_FALLBACK);
}

export default function FeedbackPage() {
  return (
    <>
      <StaticPageSeo pageKey="feedback" path="/feedback" name="Guest Feedback" crumb="Feedback" />
      <FeedbackFlow />
    </>
  );
}
