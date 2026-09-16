import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, MapPin, Building2, ArrowRight, BedDouble } from "lucide-react";
import { Container, Section, SectionHeader, Breadcrumb } from "@/components/ui";
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from "@/components/ui";
import PageFaq, { type FaqItem } from "@/components/sections/PageFaq";
import JsonLd, { faqPageSchema } from "@/components/sections/JsonLd";
import { hotelService, type PublicHotelSearchItem, type PublicHotelCity } from "@/services/hotelService";

// ============================================================
// /hotels/city/[city] — DB-driven hotel city category pages.
//
// One page per city that has active partner hotels (GET /public/hotel/cities).
// Lists every hotel in the city with real images, ratings and nightly
// prices. No hotels → real 404 (never a fake page). Nested under the
// static `city` segment so /hotels/[slug] keeps handling hotel details.
//
// These URLs are the sitemap's hotel "category" family; hotel detail
// pages remain /hotels/{slug}.
// ============================================================

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function loadCity(citySlug: string) {
  try {
    const res = await fetch(`${API_BASE}/public/hotel/cities`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const cities = (await res.json()) as PublicHotelCity[];
    const match = cities.find((c) => slugify(c.name) === citySlug);
    if (!match) return null;

    const searchRes = await fetch(
      `${API_BASE}/public/hotel/search?city_id=${match.id}&page_size=24`,
      { next: { revalidate: 300 } },
    );
    const searchData = searchRes.ok
      ? ((await searchRes.json()) as { items: PublicHotelSearchItem[] })
      : { items: [] };
    return { city: match, hotels: searchData.items ?? [] };
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/public/hotel/cities`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const cities = (await res.json()) as PublicHotelCity[];
    return cities.filter((c) => c.name).map((c) => ({ city: slugify(c.name) }));
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
    title: `Hotels in ${pretty} — Book Verified Stays Online`,
    description: `Browse verified hotels in ${pretty} with real photos, guest ratings and upfront nightly prices. Book online on WayTero with transparent cancellation.`,
    alternates: { canonical: `/hotels/city/${city}` },
  };
}

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default async function HotelCityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const data = await loadCity(city);
  if (!data || data.hotels.length === 0) notFound();
  const { city: cityInfo, hotels } = data;
  const pretty = cityInfo.name.replace(/\b\w/g, (c) => c.toUpperCase());

  const faqs: FaqItem[] = [
    { question: `How many hotels are listed in ${pretty}?`, answer: `${hotels.length} verified hotel${hotels.length === 1 ? " is" : "s are"} live on WayTero right now, each with document verification and real guest ratings.` },
    { question: `What do hotel prices in ${pretty} include?`, answer: "Each listing shows the starting nightly price for its cheapest room category. Taxes, meal plans and exact inclusions are itemised on the hotel's detail page before you pay." },
    { question: `Can I cancel a ${pretty} hotel booking?`, answer: "Cancellation depends on the room's policy — refundable rooms show the free-cancellation window at checkout, and eligible refunds reach your source or WayTero Wallet within 3–5 business days." },
    { question: `Are ${pretty} hotels verified?`, answer: "Yes. Partner hotels go through document verification, photo audits and ongoing guest-rating review before and after listing." },
  ];

  // JSON-LD — ItemList + FAQPage + BreadcrumbList.
  const jsonLd: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Hotels in ${pretty}`,
      numberOfItems: hotels.length,
      itemListElement: hotels.slice(0, 10).map((h, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://waytero.com/hotels/${h.slug ?? h.id}`,
        name: h.hotel_name,
      })),
    },
    faqPageSchema(faqs),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://waytero.com/" },
        { "@type": "ListItem", position: 2, name: "Hotels", item: "https://waytero.com/hotels" },
        { "@type": "ListItem", position: 3, name: pretty, item: `https://waytero.com/hotels/city/${city}` },
      ],
    },
  ];

  return (
    <>
      {jsonLd.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Section bg="white" pad="lg" className="bg-gradient-to-b from-accent-50/60 via-white to-white">
        <Container size="lg">
          <MotionFadeIn>
            <Breadcrumb
              className="mb-4"
              items={[{ label: "Hotels", href: "/hotels" }, { label: pretty }]}
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-100 bg-accent-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent-600">
              <Building2 className="h-3.5 w-3.5" /> Hotels
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Hotels in <span className="text-primary-600">{pretty}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-3">
              {hotels.length} verified stay{hotels.length === 1 ? "" : "s"} — real
              photos, guest ratings, and upfront nightly pricing with transparent
              cancellation.
            </p>
          </MotionFadeIn>
        </Container>
      </Section>

      {/* ── Hotel grid ───────────────────────────────────────── */}
      <Section bg="muted" pad="lg">
        <Container size="xl">
          <MotionStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {hotels.map((h) => (
              <MotionStaggerItem key={h.id}>
                <Link
                  href={`/hotels/${h.slug ?? h.id}`}
                  className="group block h-full overflow-hidden rounded-2xl border border-ink-7 bg-white transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-wt-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-accent-100 via-accent-50 to-primary-50">
                    {h.primary_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={h.primary_image_url}
                        alt={h.hotel_name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-accent-300" />
                      </div>
                    )}
                    {h.star_rating != null && h.star_rating > 0 && (
                      <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-ink backdrop-blur">
                        {"★".repeat(Math.min(h.star_rating, 5))}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-1 text-base font-bold text-ink transition-colors group-hover:text-primary-600">
                      {h.hotel_name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-ink-4">
                      <MapPin className="h-3.5 w-3.5" />
                      {[h.city_name, h.state_name].filter(Boolean).join(", ")}
                    </div>
                    <div className="mt-3 flex items-end justify-between border-t border-ink-7 pt-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-extrabold text-ink">{INR(h.starting_price)}</span>
                        <span className="text-xs text-ink-4">/night</span>
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-primary-600">
                        <BedDouble className="h-3.5 w-3.5" />
                        {h.room_category_count} room{h.room_category_count === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                </Link>
              </MotionStaggerItem>
            ))}
          </MotionStagger>

          <div className="mt-10 text-center">
            <Link
              href={`/hotels/results?city_id=${cityInfo.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5 hover:bg-primary-700"
            >
              Search all {pretty} hotels with dates <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>

      {/* ── FAQ (visible + FAQPage JSON-LD above) ─────────────── */}
      <PageFaq
        faqs={faqs}
        eyebrow={`${pretty} hotel FAQs`}
        subtitle={`What guests ask before booking a stay in ${pretty}.`}
      />
    </>
  );
}
