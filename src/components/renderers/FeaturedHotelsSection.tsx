import { Star, MapPin, Wifi, Coffee, Waves } from "lucide-react";
import { Container, Section, SectionHeader, MotionGlow, MotionTilt } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";

interface FeaturedHotelsSectionProps {
  variant: Record<string, unknown>;
}

interface Hotel {
  name: string;
  city: string;
  rating: number;
  reviews: number;
  price: number;
  old_price?: number;
  amenities?: string[];
  image?: string;
  image_url?: string;
  link?: string;
  tag?: string;
}

const PLACEHOLDER: Hotel[] = [
  { name: "The Leela Palace", city: "New Delhi", rating: 4.9, reviews: 2103, price: 18500, old_price: 22000, amenities: ["Wifi", "Pool", "Breakfast"], tag: "Editor's Pick" },
  { name: "Taj Lake Palace", city: "Udaipur", rating: 4.9, reviews: 1542, price: 32500, amenities: ["Wifi", "Lake View", "Spa"] },
  { name: "Radisson Blu", city: "Bengaluru", rating: 4.6, reviews: 982, price: 9500, amenities: ["Wifi", "Breakfast", "Gym"] },
  { name: "Marriott Resort", city: "Goa", rating: 4.7, reviews: 1847, price: 14999, old_price: 17999, amenities: ["Beach", "Pool", "Wifi"], tag: "Beachfront" },
];

export default function FeaturedHotelsSection({ variant }: FeaturedHotelsSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", pick<string>(variant, "eyebrow", "Where to stay"));
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Featured Hotels"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "Top-rated stays handpicked by our travel team."));
  const hotels = pick<Hotel[]>(variant, "hotels", PLACEHOLDER);

  return (
    <Section bg="muted" pad="lg" id="hotels" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {hotels.map((h) => (
            <MotionStaggerItem key={h.name} className="h-full">
              <MotionGlow color="accent" intensity={0.18} size={300} className="h-full rounded-2xl">
                <MotionTilt max={3} className="h-full">
                  <a
                    href={h.link || "#"}
                    className="group relative flex h-full flex-col bg-white rounded-2xl overflow-hidden border border-ink-7 hover:border-primary-200 hover:shadow-wt-xl transition-all duration-300 ease-[var(--ease-wt)]"
                  >
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-accent-100 via-accent-50 to-primary-50 overflow-hidden">
                      {h.image_url || h.image ? (
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: `url(${h.image_url || h.image})` }}
                        />
                      ) : (
                        <div aria-hidden className="absolute inset-0 flex items-center justify-center text-primary-300 group-hover:scale-125 group-hover:text-primary-400 transition-transform duration-500">
                          <Waves className="h-10 w-10 opacity-60" />
                        </div>
                      )}
                      {h.tag && (
                        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur text-primary-700 shadow-wt-sm">
                          {h.tag}
                        </span>
                      )}
                      <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur text-ink shadow-wt-sm">
                        <Star className="h-3 w-3 fill-accent-500 text-accent-500" /> {h.rating}
                      </div>
                      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-primary-500/0 to-transparent group-hover:from-primary-500/15 transition-all duration-500" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-base font-bold text-ink mb-1.5 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {h.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-ink-4 mb-4">
                        <MapPin className="h-3.5 w-3.5" /> {h.city} · {h.reviews} reviews
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(h.amenities ?? []).map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink-9 text-[10px] font-semibold uppercase tracking-wider text-ink-3"
                          >
                            {a === "Wifi" && <Wifi className="h-3 w-3" />}
                            {a === "Breakfast" && <Coffee className="h-3 w-3" />}
                            {a === "Lake View" && <Waves className="h-3 w-3" />}
                            {a === "Beach" && <Waves className="h-3 w-3" />}
                            {a}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-baseline gap-2 pt-3 border-t border-ink-7 mt-auto">
                        <span className="text-lg font-extrabold text-gradient-primary">₹{h.price.toLocaleString()}</span>
                        {h.old_price && <span className="text-xs text-ink-4 line-through">₹{h.old_price.toLocaleString()}</span>}
                        <span className="text-xs text-ink-4 ml-auto">/night</span>
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
