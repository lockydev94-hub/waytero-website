import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, MapPin, Users, ArrowRight, Compass } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/ui";
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from "@/components/ui";
import TourCard from "@/components/tours/TourCard";
import type { PublicTourPackage } from "@/services/tourService";

// ============================================================
// /destinations/[city] — DB-driven destination category pages.
//
// One page per city that has active tour packages (the same feed that
// powers the homepage Popular Destinations grid). Shows every active
// package for the city with real names, images, durations and prices.
// No packages for the city → real 404 (never a fake page).
//
// These URLs are what the sitemap exposes as "category" pages for tours,
// replacing the old dead /tours/goa-style links.
// ============================================================

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface DestinationRow {
  city_id: number;
  name: string;
  package_count: number;
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function loadDestination(citySlug: string) {
  try {
    const res = await fetch(`${API_BASE}/public/tours/popular-destinations`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rows = (Array.isArray(data) ? data : (data.items ?? [])) as DestinationRow[];
    const match = rows.find((r) => slugify(r.name ?? "") === citySlug);
    if (!match) return null;

    // All active packages for this city.
    const pkgRes = await fetch(
      `${API_BASE}/public/tours/packages?destination=${encodeURIComponent(match.name)}&page_size=24`,
      { next: { revalidate: 300 } },
    );
    const pkgData = pkgRes.ok ? await pkgRes.json() : { items: [] };
    return { destination: match, packages: (pkgData.items ?? []) as PublicTourPackage[] };
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/public/tours/popular-destinations`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rows = (Array.isArray(data) ? data : (data.items ?? [])) as DestinationRow[];
    return rows
      .filter((r) => r.name)
      .map((r) => ({ city: slugify(r.name as string) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const pretty = city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${pretty} Tour Packages — Itineraries, Prices & Booking`,
    description: `Browse verified tour packages in ${pretty} with real itineraries, durations and upfront per-person pricing. Book online on WayTero.`,
    alternates: { canonical: `/destinations/${city}` },
  };
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const data = await loadDestination(city);
  if (!data || data.packages.length === 0) notFound();
  const { destination, packages } = data;
  const name = destination.name;
  const pretty = name.replace(/\b\w/g, (c) => c.toUpperCase());

  // JSON-LD — ItemList of real, visible packages (SEO audit §4).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${pretty} Tour Packages`,
    numberOfItems: packages.length,
    itemListElement: packages.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://waytero.com/tours/${p.slug}`,
      name: p.package_name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Section bg="white" pad="lg" className="bg-gradient-to-b from-accent-50/60 via-white to-white">
        <Container size="lg">
          <MotionFadeIn>
            <nav className="mb-4 text-xs text-ink-4">
              <Link href="/tours" className="hover:text-primary-600">Tours</Link>
              <span className="mx-1.5">/</span>
              <span className="text-ink-3">{pretty}</span>
            </nav>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-100 bg-accent-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent-600">
              <Compass className="h-3.5 w-3.5" /> Destination
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Tour Packages in <span className="text-primary-600">{pretty}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-3">
              {packages.length} verified package{packages.length === 1 ? "" : "s"} — real
              itineraries, upfront per-person pricing, and managed booking from
              start to finish.
            </p>
          </MotionFadeIn>
        </Container>
      </Section>

      {/* ── Package grid ─────────────────────────────────────── */}
      <Section bg="muted" pad="lg">
        <Container size="xl">
          <MotionStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {packages.map((p) => (
              <MotionStaggerItem key={p.id}>
                <TourCard tour={p} />
              </MotionStaggerItem>
            ))}
          </MotionStagger>

          <div className="mt-10 text-center">
            <Link
              href={`/tours?destination=${encodeURIComponent(name)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-7 bg-white px-6 py-3 text-sm font-bold text-ink-2 transition-all hover:border-primary-300 hover:text-primary-700"
            >
              Refine in tour search <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
