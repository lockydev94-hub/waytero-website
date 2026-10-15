// ============================================================
// The landing engine — ONE route for every DB-driven city/state
// page. The slug IS the whole path segment (/bhubaneswar,
// /cab-booking-in-bhubaneswar, /tour-packages-in-odisha), so no
// string parsing happens here: guards, then an indexed lookup.
//
// Rules this file must keep:
//  - raw fetch only (via landingIndex) — hotelService/cabService
//    are no-store and would turn these pages into prod 500s
//    (see hotels/[slug]/page.tsx's warning);
//  - dynamicParams stays true: publishing from the admin must go
//    live without a redeploy;
//  - guards run BEFORE any fetch so scanner traffic never reaches
//    the backend;
//  - a 404 from the API is a real notFound() — Next caches it, so
//    junk slugs cost one cached lookup, not a DB storm.
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getLandingBundle,
  getLandingRefs,
  isReservedLandingSlug,
  isSafeLandingSlug,
} from "@/lib/landingIndex";
import { toMetadata } from "@/services/seoService";
import LandingPageView from "@/components/landing/LandingPageView";

export const revalidate = 300;
export const dynamicParams = true;

function claimable(slug: string): boolean {
  return isSafeLandingSlug(slug) && !isReservedLandingSlug(slug);
}

export async function generateStaticParams() {
  const refs = await getLandingRefs();
  // A rogue reserved slug in the DB must never break the build or
  // shadow a real route at prerender time.
  return refs.filter((r) => claimable(r.slug)).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!claimable(slug)) return {};
  const data = await getLandingBundle(slug);
  if (!data) return {};
  return toMetadata(
    {
      title: data.seo.title,
      description: data.seo.description,
      keywords: data.seo.keywords,
      image: data.seo.og_image_url ?? data.hero.image_url ?? undefined,
    },
    data.seo.canonical_path,
  );
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!claimable(slug)) notFound();
  const data = await getLandingBundle(slug);
  if (!data) notFound();
  return <LandingPageView data={data} />;
}
