import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ToursListingPage from "./tours-listing";
import { resolveSeo, toMetadata, getServiceTypeSeo } from "@/services/seoService";
import { getAvailability, serviceVisible } from "@/lib/availability";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────
// Reads the TOUR service type's seo_title/seo_description/seo_keywords
// from the backend; falls back to bundled static values.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo("TOUR");
  return toMetadata(seo, "/tours");
}

export default async function ToursPage() {
  // Hard availability gate (owner decision): TOUR disabled or zero real
  // supply in the DB → the page 404s site-wide, no "coming soon" fakery.
  const av = await getAvailability();
  if (!serviceVisible(av, "TOUR")) notFound();

  // Hero/banner image configured by the admin (Settings → Service Types → TOUR).
  const serviceSeo = await getServiceTypeSeo();
  const heroImage = serviceSeo.TOUR?.image_url ?? null;

  return (
    <Suspense fallback={null}>
      <ToursListingPage heroImage={heroImage} />
    </Suspense>
  );
}
