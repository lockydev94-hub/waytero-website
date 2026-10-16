import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RouteDetail, { type PublicRoute, type RelatedRoute } from "./route-detail";
import { STATIC_SEO, toMetadata, appUrl, type SeoContent } from "@/services/seoService";

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
    image: r.image_url || null,
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Inter-city cab transfer",
    name: routeTitle(route),
    description: seoForRoute(route).description,
    url: `${appUrl()}/cabs/routes/${route.slug}`,
    provider: { "@type": "Organization", name: "WayTero" },
    areaServed: [route.origin_label, route.destination_label],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c").replace(/>/g, "\\u003e"),
        }}
      />
      <RouteDetail route={route} related={related} />
    </>
  );
}
