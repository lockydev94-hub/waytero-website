import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OfferDetail, { type PublicOfferDetail } from "./offer-detail";
import { STATIC_SEO, toMetadata, appUrl, type SeoContent } from "@/services/seoService";

// ── Server data ────────────────────────────────────────────────────────────
// Raw fetch (not axios) — this runs in generateMetadata/generateStaticParams
// on the server. The backend returns the payload RAW. A lapsed-but-known
// slug still returns 200 with is_available:false (the page shows an honest
// paused state); unknown slugs 404.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function fetchOffer(slug: string): Promise<PublicOfferDetail | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/offers/${encodeURIComponent(slug)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as PublicOfferDetail;
  } catch {
    return null;
  }
}

function seoForOffer(offer: PublicOfferDetail | null): SeoContent {
  if (!offer?.title) return STATIC_SEO.home;
  return {
    title: `${offer.title} — ${offer.badge}`,
    description:
      offer.short_description?.slice(0, 320) ||
      `${offer.badge} on ${offer.title}. Use coupon code ${offer.coupon.code} at checkout. Valid till ${offer.valid_to}.`,
    keywords: [
      "WayTero offer",
      offer.title,
      `${offer.service_type.toLowerCase()} offer`,
      `coupon ${offer.coupon.code}`,
    ],
    image: offer.image_url || null,
  };
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/public/offers`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const items = (await res.json()) as Array<{ slug: string }>;
    return Array.isArray(items) ? items.map((o) => ({ slug: o.slug })) : [];
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const offer = await fetchOffer(slug);
  if (!offer?.title) return toMetadata(STATIC_SEO.home, "/");
  return toMetadata(seoForOffer(offer), `/offers/${slug}`);
}

export default async function OfferDetailPage({ params }: Props) {
  const { slug } = await params;
  const offer = await fetchOffer(slug);
  if (!offer?.title) notFound();

  // Product + Offer JSON-LD — only factual fields the DB backs (no price:
  // coupon discounts have no fixed price; no aggregateRating: no reviews).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: offer.title,
    description: offer.short_description || undefined,
    image: offer.image_url || undefined,
    brand: { "@type": "Brand", name: "WayTero" },
    offers: {
      "@type": "Offer",
      url: `${appUrl()}/offers/${offer.slug}`,
      availability: offer.is_available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      validFrom: offer.valid_from,
      validThrough: offer.valid_to,
      name: offer.badge,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c").replace(/>/g, "\\u003e"),
        }}
      />
      <OfferDetail offer={offer} />
    </>
  );
}
