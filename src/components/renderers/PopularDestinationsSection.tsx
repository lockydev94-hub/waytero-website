import { MapPin, TrendingUp } from "lucide-react";
import { Container, Section, SectionHeader, MotionGlow, MotionTilt } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";

interface PopularDestinationsSectionProps {
  variant: Record<string, unknown>;
}

interface Destination {
  name: string;
  state: string;
  image?: string;
  trending?: boolean;
  starting_price?: number;
}

const PLACEHOLDER: Destination[] = [
  { name: "Goa", state: "Goa", starting_price: 4999, trending: true },
  { name: "Manali", state: "Himachal Pradesh", starting_price: 6999, trending: true },
  { name: "Jaipur", state: "Rajasthan", starting_price: 4499 },
  { name: "Leh", state: "Ladakh", starting_price: 12999, trending: true },
  { name: "Andaman", state: "Andaman & Nicobar", starting_price: 14999 },
  { name: "Kerala", state: "Kerala", starting_price: 8999, trending: true },
  { name: "Rishikesh", state: "Uttarakhand", starting_price: 3499 },
  { name: "Udaipur", state: "Rajasthan", starting_price: 5499 },
];

export default function PopularDestinationsSection({ variant }: PopularDestinationsSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", pick<string>(variant, "eyebrow", "Where to next"));
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Popular Destinations"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "Trending spots this season — handpicked for every kind of traveler."));
  const items = pick<Destination[]>(variant, "destinations", PLACEHOLDER);

  return (
    <Section bg="white" pad="lg" id="destinations" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((d) => (
            <MotionStaggerItem key={d.name} className="h-full">
              <MotionGlow color="primary" intensity={0.2} size={240} className="h-full rounded-2xl">
                <MotionTilt max={3} className="h-full">
                  <a
                    href={`/tours/${d.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="group relative block h-full aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-200 via-primary-100 to-accent-100 hover:shadow-wt-xl transition-all duration-500 ease-[var(--ease-wt)] border border-ink-7 hover:border-transparent"
                  >
                    {/* Premium gradient overlay that shifts on hover */}
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary-400/0 via-primary-300/40 to-accent-300/60 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/30 to-transparent" />
                    {/* Top hairline gradient that lights on hover */}
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {d.trending && (
                      <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-500 text-ink shadow-wt-accent">
                        <TrendingUp className="h-3 w-3" /> Trending
                      </span>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="text-xs text-white/70 mb-1 inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {d.state}
                      </div>
                      <h3 className="text-lg font-bold mb-1 group-hover:text-accent-200 transition-colors">{d.name}</h3>
                      {d.starting_price !== undefined && (
                        <div className="text-xs text-white/80">
                          From <span className="font-bold text-white">₹{d.starting_price.toLocaleString()}</span>
                        </div>
                      )}
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
