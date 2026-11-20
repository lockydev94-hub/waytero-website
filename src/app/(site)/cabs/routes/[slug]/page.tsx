import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RouteDetail, { type PublicRoute, type RelatedRoute } from "./route-detail";
import {
  STATIC_SEO,
  toMetadata,
  appUrl,
  absoluteImage,
  type SeoContent,
} from "@/services/seoService";
import JsonLd, {
  breadcrumbList,
  webPageSchema,
} from "@/components/sections/JsonLd";

// ── Server data ────────────────────────────────────────────────────────────
// GET /public/routes/{slug} returns the route plus one priced vehicle per
// linked category, quoted by the fare engine at request time. Inactive or
// unknown slugs 404 — the same contract every other public page keeps.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function fetchRoute(slug: string): Promise<PublicRoute | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/routes/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as PublicRoute;
  } catch {
    return null;
  }
}

async function fetchRelated(slug: string): Promise<RelatedRoute[]> {
  try {
    const res = await fetch(
      `${API_BASE}/public/routes/${encodeURIComponent(slug)}/related`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: RelatedRoute[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

function routeTitle(r: PublicRoute): string {
  return `Cab from ${r.origin_label} to ${r.destination_label}`;
}

function seoForRoute(r: PublicRoute | null): SeoContent {
  if (!r) return STATIC_SEO.home;
  return {
    title: `${routeTitle(r)} — fares, distance and booking | WayTero`,
    description:
      r.description?.trim() ||
      `${routeTitle(r)} is ${Number(r.distance_km).toFixed(0)} km by road. See the distance, the vehicles available and what each one costs under our published fare rules.`,
    keywords: [
      routeTitle(r).toLowerCase(),
      `${r.origin_label} to ${r.destination_label} taxi`,
      `${r.destination_label} cab fare`,
      "WayTero intercity cab",
    ],
    image: r.image_url || "/og-image.png",
  };
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/public/routes?limit=60&offset=0`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: Array<{ slug: string }> };
    return (data.items ?? []).map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const route = await fetchRoute(slug);
  if (!route) return toMetadata(STATIC_SEO.home, "/");
  return toMetadata(seoForRoute(route), `/cabs/routes/${slug}`);
}

export default async function CabRoutePage({ params }: Props) {
  const { slug } = await params;
  const route = await fetchRoute(slug);
  if (!route) notFound();
  const related = await fetchRelated(slug);

  // Route JSON-LD: identity and coverage only. No price is published here —
  // the fare depends on the vehicle and the pickup window, and a stale
  // number in a crawler feed would be a claim the booking flow can't honour.
  const pageUrl = `${appUrl()}/cabs/routes/${route.slug}`;
  const description = seoForRoute(route).description;
  const city = (name: string) => ({ "@type": "City", name });
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    serviceType: "Inter-city cab transfer",
    name: routeTitle(route),
    description,
    url: pageUrl,
    ...(route.image_url ? { image: absoluteImage(route.image_url) } : {}),
    provider: { "@id": `${appUrl()}/#organization` },
    areaServed: [city(route.origin_label), city(route.destination_label)],
  };
  const webPage = webPageSchema({
    name: routeTitle(route),
    description,
    path: `/cabs/routes/${route.slug}`,
    image: route.image_url,
  });
  const crumbs = breadcrumbList([
    { name: "Home", path: "/" },
    { name: "Cabs", path: "/cabs" },
    { name: "Routes", path: "/cabs/routes" },
    { name: routeTitle(route), path: `/cabs/routes/${route.slug}` },
  ]);

  return (
    <>
      <JsonLd data={webPage} />
      <JsonLd data={serviceJsonLd} />
      <JsonLd data={crumbs} />
      <RouteDetail route={route} related={related} />
    </>
  );
}
