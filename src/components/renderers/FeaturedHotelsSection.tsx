import Link from "next/link";
import { Star, MapPin, Waves, Clock, ChevronRight } from "lucide-react";
import { Container, Section, SectionHeader, MotionGlow, MotionTilt } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";
import type { PublicHotelSearchItem } from "@/services/hotelService";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface FeaturedHotelsSectionProps {
  variant: Record<string, unknown>;
}

/**
 * FeaturedHotelsSection — homepage hotels strip.
 *
 * Fully DB-driven: shows only hotels that admin/partners actually added
 * (GET /public/hotel/search, is_featured first). No hardcoded placeholder
 * hotels — when the catalogue is empty the whole section becomes an honest
 * "Coming soon" state. As soon as the first hotel is added, the cards
 * render automatically.
 */
export default async function FeaturedHotelsSection({ variant }: FeaturedHotelsSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", pick<string>(variant, "eyebrow", "Where to stay"));
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Featured Hotels"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "Top-rated stays handpicked by our travel team."));

  let hotels: PublicHotelSearchItem[] = [];
  try {
    // Raw fetch (not hotelService) — this runs on the server and the axios
    // client is browser-only; revalidate keeps the homepage ISR-cacheable.
    const res = await fetch(
      `${API_BASE}/public/hotel/search?sort_by=recommended&page_size=8`,
      { next: { revalidate: 120 } },
    );
    if (res.ok) {
      const data = (await res.json()) as { items?: PublicHotelSearchItem[] };
      hotels = data.items ?? [];
    }
  } catch {
    hotels = [];
  }

  // Empty catalogue → Coming Soon (no fake hotels, ever).
  if (hotels.length === 0) {
    return (
      <Section bg="muted" pad="lg" id="hotels" overlay="dots">
        <Container size="lg">
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            accent="primary"
            underline
            animatedEyebrow
          />
          <div className="relative overflow-hidden rounded-3xl border border-ink-7 bg-white p-10 text-center shadow-wt-sm">
            <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-accent-500/10 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent-600">
                <Clock className="h-3.5 w-3.5" /> Coming soon
              </span>
              <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-ink">
                Hotel bookings are coming soon
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-3">
                Our team is onboarding verified hotels right now. Once partners add
                their properties, you'll be able to book them here directly.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section bg="muted" pad="lg" id="hotels" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {hotels.map((h) => (
            <MotionStaggerItem key={h.id} className="h-full">
              <MotionGlow color="accent" intensity={0.18} size={300} className="h-full rounded-2xl">
                <MotionTilt max={3} className="h-full">
                  <Link
                    href={`/hotels/${h.slug ?? h.id}`}
                    className="group relative flex h-full flex-col bg-white rounded-2xl overflow-hidden border border-ink-7 hover:border-primary-200 hover:shadow-wt-xl transition-all duration-300 ease-[var(--ease-wt)]"
                  >
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-accent-100 via-accent-50 to-primary-50 overflow-hidden">
                      {h.primary_image_url ? (
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: `url(${h.primary_image_url})` }}
                        />
                      ) : (
                        <div aria-hidden className="absolute inset-0 flex items-center justify-center text-primary-300 group-hover:scale-125 group-hover:text-primary-400 transition-transform duration-500">
                          <Waves className="h-10 w-10 opacity-60" />
                        </div>
                      )}
                      {h.is_featured && (
                        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-500 text-ink shadow-wt-accent">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-1.5 text-xs text-ink-4 mb-2">
                        <MapPin className="h-3 w-3" /> {[h.city_name, h.state_name].filter(Boolean).join(", ")}
                      </div>
                      <h3 className="text-base font-bold text-ink leading-snug group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
                        {h.hotel_name}
                      </h3>
                      {h.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {h.amenities.slice(0, 2).map((a) => (
                            <span key={a} className="px-2 py-0.5 rounded-md bg-ink-9 text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-auto pt-3 border-t border-ink-7 flex items-end justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-extrabold text-gradient-primary">
                              ₹{Number(h.starting_price).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-ink-4 uppercase tracking-wider">/night</span>
                          </div>
                        </div>
                        {Number(h.average_rating) > 0 && (
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-ink-2">
                            <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
                            {Number(h.average_rating).toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </MotionTilt>
              </MotionGlow>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
        <div className="mt-8 text-center">
          <Link
            href="/hotels"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all hotels <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
