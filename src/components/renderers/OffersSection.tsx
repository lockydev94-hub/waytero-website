import { ArrowRight, BadgePercent } from "lucide-react";
import { Container, Section, SectionHeader, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";

interface OffersSectionProps {
  variant: Record<string, unknown>;
}

interface Offer {
  title: string;
  description: string;
  badge?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  image_url?: string | null;
}

const PLACEHOLDER: Offer[] = [
  { title: "Flat ₹300 Off on Airport Rides", description: "Book any outstation airport cab this week and save ₹300 instantly.", badge: "Limited time", cta_text: "Book a cab", cta_link: "/cabs" },
  { title: "Up to 25% Off on Weekend Stays", description: "Enjoy discounted rates at 1,200+ partner hotels across India.", badge: "Weekend special", cta_text: "Explore hotels", cta_link: "/hotels" },
  { title: "Free Pickup on Tour Packages", description: "Book any 5-day tour package and get complimentary hotel pickup.", badge: "Popular", cta_text: "See packages", cta_link: "/tours" },
];

const CARD_BG = [
  "bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500",
  "bg-gradient-to-br from-accent-500 via-accent-600 to-rose-600",
  "bg-gradient-to-br from-ink-800 via-ink-700 to-primary-800",
];

export default function OffersSection({ variant }: OffersSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "Limited-time deals");
  const title = pick<string>(variant, "headline", "Offers & Deals");
  const subtitle = pick<string>(variant, "subheadline", "Grab these limited-time deals on cabs, hotels and tour packages.");
  const offers = pick<Offer[]>(variant, "offers", PLACEHOLDER);

  return (
    <Section bg="white" pad="lg" id="offers" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {offers.map((offer, i) => (
            <MotionStaggerItem key={offer.title} className="h-full">
              <MotionGlow color={i === 0 ? "primary" : i === 1 ? "accent" : "danger"} intensity={0.3} size={300} className="h-full rounded-2xl">
                <div className={`group relative overflow-hidden rounded-2xl p-6 text-white h-full flex flex-col transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-1.5 hover:shadow-wt-xl ${CARD_BG[i % CARD_BG.length]}`}>
                  {/* Premium blob and shine */}
                  <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 blur-2xl group-hover:scale-125 transition-transform duration-500" />
                  <span aria-hidden className="pointer-events-none absolute inset-y-0 w-1/3 bg-white/15 blur-md animate-shine" />
                  {/* Top hairline */}
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                  {offer.badge && (
                    <span className="inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur mb-4 shadow-wt-sm">
                      <BadgePercent className="h-3 w-3" /> {offer.badge}
                    </span>
                  )}
                  <h3 className="text-lg font-bold mb-2 leading-snug">{offer.title}</h3>
                  <p className="text-sm text-white/85 leading-relaxed mb-5 flex-1">{offer.description}</p>
                  {offer.cta_text && offer.cta_link && (
                    <a
                      href={offer.cta_link}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-white group-hover:gap-2.5 transition-all"
                    >
                      {offer.cta_text}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  )}
                </div>
              </MotionGlow>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}
