"use client";

import { useEffect, useState } from "react";
import { Clock, Star, MapPin } from "lucide-react";
import { Container, Section, SectionHeader, MotionTilt, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";
import { tourService, PublicTourPackage } from "@/services/tourService";

interface TourPackagesSectionProps {
  variant: Record<string, unknown>;
}

interface Tour {
  title: string;
  location: string;
  duration: string;
  price: number;
  old_price?: number;
  rating?: number;
  image?: string;
  link?: string;
  tag?: string;
}

const PLACEHOLDER_TOURS: Tour[] = [
  { title: "Kerala Backwaters Cruise", location: "Kerala", duration: "5N/6D", price: 14999, old_price: 18999, rating: 4.8, tag: "Bestseller", link: "/tours/kerala" },
  { title: "Royal Rajasthan Heritage", location: "Rajasthan", duration: "7N/8D", price: 22499, old_price: 27999, rating: 4.7, tag: "Premium", link: "/tours/rajasthan" },
  { title: "Goa Beach Escape", location: "Goa", duration: "4N/5D", price: 9999, rating: 4.6, link: "/tours/goa" },
  { title: "Himalayan Adventure Trek", location: "Himachal", duration: "6N/7D", price: 18499, old_price: 22999, rating: 4.9, tag: "Adventure", link: "/tours/himalaya" },
  { title: "Andaman Island Hopping", location: "Andaman", duration: "5N/6D", price: 21999, rating: 4.7, link: "/tours/andaman" },
  { title: "Golden Triangle Tour", location: "Delhi-Agra-Jaipur", duration: "4N/5D", price: 12999, old_price: 15999, rating: 4.5, tag: "Top Pick", link: "/tours/golden-triangle" },
];

export default function TourPackagesSection({ variant }: TourPackagesSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", pick<string>(variant, "eyebrow", "Curated experiences"));
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Tour Packages Loved by Travelers"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "Handpicked itineraries with verified partners — fully managed from booking to return."));
  const fallbackTours = pick<Tour[]>(variant, "tours", PLACEHOLDER_TOURS);
  const [liveTours, setLiveTours] = useState<PublicTourPackage[]>([]);
  useEffect(() => {
    const params = typeof window !== "undefined" ? Object.fromEntries(new URLSearchParams(window.location.search).entries()) : {};
    tourService.search({ destination: params.destination || undefined, persons: params.pax ? Number(params.pax) : undefined, duration: params.duration || undefined }).then((data) => setLiveTours(data.items ?? [])).catch(() => setLiveTours([]));
  }, []);
  const tours: Tour[] = liveTours.length > 0 ? liveTours.map((t) => ({ title: t.package_name, location: t.destination, duration: `${t.duration_days}D/${t.duration_nights}N`, price: t.starting_price ?? 0, image: t.primary_image_url ?? undefined, link: `/tours/${t.slug}`, tag: t.package_type === "GROUP" ? "Group tour" : "Verified" })) : fallbackTours;

  return (
    <Section bg="muted" pad="lg" id="tours" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((t) => (
            <MotionStaggerItem key={t.title} className="h-full">
              <MotionGlow color="primary" intensity={0.2} size={300} className="h-full rounded-2xl">
                <MotionTilt max={4} className="h-full">
                  <a
                    href={t.link || "#"}
                    className="group relative flex h-full flex-col bg-white rounded-2xl overflow-hidden border border-ink-7 hover:border-primary-200 hover:shadow-wt-xl transition-all duration-300 ease-[var(--ease-wt)]"
                  >
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-primary-100 via-primary-50 to-accent-50 overflow-hidden">
                      {t.image ? <img src={t.image} alt={t.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" /> : null}
                      {t.tag && (
                        <span className="absolute top-3 left-3 z-10 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur text-primary-700 shadow-wt-sm">
                          {t.tag}
                        </span>
                      )}
                      {!t.image && <div className="absolute inset-0 flex items-center justify-center text-primary-300 group-hover:scale-110 group-hover:text-primary-400 transition-all duration-500">
                        <MapPin className="h-12 w-12" />
                      </div>}
                      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-ink-4 mb-2">
                        <MapPin className="h-3.5 w-3.5" /> {t.location}
                        <span>·</span>
                        <Clock className="h-3.5 w-3.5" /> {t.duration}
                      </div>
                      <h3 className="text-base font-bold text-ink mb-3 line-clamp-1 group-hover:text-primary-600 transition-colors">
                        {t.title}
                      </h3>
                      <div className="flex items-end justify-between mt-auto">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-extrabold text-gradient-primary">₹{t.price.toLocaleString()}</span>
                            {t.old_price && (
                              <span className="text-xs text-ink-4 line-through">₹{t.old_price.toLocaleString()}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-ink-4">per person</div>
                        </div>
                        {t.rating !== undefined && (
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-ink-2">
                            <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" /> {t.rating}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                </MotionTilt>
              </MotionGlow>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}
