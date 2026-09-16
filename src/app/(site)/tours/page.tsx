import type { Metadata } from "next";
import { Suspense } from "react";
import ToursListingPage from "./tours-listing";
import { resolveSeo, toMetadata, getServiceTypeSeo } from "@/services/seoService";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────
// Reads the TOUR service type's seo_title/seo_description/seo_keywords
// from the backend; falls back to bundled static values.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo("TOUR");
  return toMetadata(seo, "/tours");
}

export default async function ToursPage() {
  // Hero/banner image configured by the admin (Settings → Service Types → TOUR).
  const serviceSeo = await getServiceTypeSeo();
  const heroImage = serviceSeo.TOUR?.image_url ?? null;

  // Server-side catalogue check: when the DB has no active packages the
  // listing renders a "Coming soon" state instead of an empty results
  // grid (customer-web restriction: only DB content is ever shown).
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  let catalogueEmpty = false;
  try {
    const res = await fetch(`${API_BASE}/public/tours/packages?page_size=1`, {
      next: { revalidate: 120 },
    });
    if (res.ok) {
      const data = (await res.json()) as { items?: unknown[] };
      catalogueEmpty = (data.items ?? []).length === 0;
    } else {
      catalogueEmpty = true;
    }
  } catch {
    catalogueEmpty = true;
  }

  return (
    <Suspense fallback={null}>
      <ToursListingPage heroImage={heroImage} catalogueEmpty={catalogueEmpty} />
    </Suspense>
  );
}
