import Image from "next/image";
import Link from "next/link";
import { MapPin, BedDouble, Building2, Star } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { INR } from "./format";
import type { LandingHotel } from "@/lib/landingIndex";

// ============================================================
// LandingHotelGrid — hand-rolled from the landing payload (same
// card as the retired /hotels/city page) rather than the
// self-fetching HotelExploreSection, so it stays server-rendered
// and shares the page's single fetch.
// ============================================================

export default function LandingHotelGrid({
  hotels,
  title,
  cityId,
}: {
  hotels: LandingHotel[];
  title?: string | null;
  cityId?: number | null;
}) {
  if (!hotels.length) return null;

  return (
    <Section bg="muted" pad="md">
      <Container size="xl">
        <SectionHeader
          eyebrow="Stays"
          title={title ?? "Where to stay"}
          subtitle="Verified hotels with real photos, guest ratings and upfront nightly prices."
        />
        <MotionStagger className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {hotels.map((h) => (
            <MotionStaggerItem key={h.id}>
              <Link
                href={`/hotels/${h.slug ?? h.id}`}
                className="group block h-full overflow-hidden rounded-2xl border border-ink-7 bg-white transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-wt-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-accent-100 via-accent-50 to-primary-50">
                  {h.primary_image_url ? (
                    <Image
                      src={h.primary_image_url}
                      alt={h.hotel_name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                    {h.city_name}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-ink-3">
                    {h.average_rating > 0 && (
                      <>
                        <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                        {h.average_rating.toFixed(1)}
                        <span className="font-normal text-ink-4">
                          ({h.total_reviews.toLocaleString("en-IN")})
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mt-3 flex items-end justify-between border-t border-ink-7 pt-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-ink">
                        {INR(h.starting_price)}
                      </span>
                      <span className="text-xs text-ink-4">/night</span>
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-primary-600">
                      <BedDouble className="h-3.5 w-3.5" />
                      View
                    </div>
                  </div>
                </div>
              </Link>
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        {cityId ? (
          <div className="mt-10 text-center">
            <Link
              href={`/hotels/results?city_id=${cityId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-6 py-3 text-sm font-bold text-primary-700 transition-all hover:-translate-y-0.5 hover:bg-primary-50"
            >
              Search all stays with dates
            </Link>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
