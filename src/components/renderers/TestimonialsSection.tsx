import { Star, Quote } from "lucide-react";
import { Container, Section, SectionHeader, Avatar, MotionGlow, Card } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";

interface TestimonialsSectionProps {
  variant: Record<string, unknown>;
}

interface Testimonial {
  name: string;
  role?: string;
  city?: string;
  text: string;
  rating?: number;
  avatar?: string;
}

const PLACEHOLDER: Testimonial[] = [
  { name: "Priya Sharma", role: "Marketing Manager", city: "Bengaluru", rating: 5, text: "Booked a Kerala package through WayTero — every transfer, hotel and tour was flawless. The transparency on pricing won me over." },
  { name: "Arjun Mehta", role: "Founder", city: "Mumbai", rating: 5, text: "Outstation cab booking in 30 seconds, driver assigned in 2 minutes, real-time tracking worked perfectly. Best cab experience I've had in India." },
  { name: "Riya Patel", role: "Software Engineer", city: "Hyderabad", rating: 5, text: "Used WayTero for our Goa honeymoon. Hotels were exactly as shown, tour operator was polite, and support replied on WhatsApp within minutes." },
  { name: "Karan Singh", role: "Photographer", city: "Delhi", rating: 4, text: "Loved the wallet credit feature when my plans changed — refund was in my wallet before I'd even reached home." },
];

export default function TestimonialsSection({ variant }: TestimonialsSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", pick<string>(variant, "eyebrow", "Loved by travelers"));
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "What Our Customers Say"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "4.8 / 5 average rating across 50,000+ verified reviews."));
  const items = pick<Testimonial[]>(variant, "testimonials", PLACEHOLDER);

  return (
    <Section bg="muted" pad="lg" id="testimonials" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((t) => (
            <MotionStaggerItem key={t.name}>
              <MotionGlow color="primary" intensity={0.18} size={300} className="h-full rounded-2xl">
                <Card variant="glass-strong" hover lift="md" hoverTint="primary" className="relative h-full border-gradient-primary">
                  <Quote className="absolute top-5 right-5 h-7 w-7 text-primary-200 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary-400" />
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < (t.rating ?? 5) ? "fill-accent-500 text-accent-500" : "text-ink-6"}`}
                      />
                    ))}
                  </div>
                  <p className="text-base text-ink-2 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-5 border-t border-ink-7">
                    <Avatar name={t.name} src={t.avatar} size="md" />
                    <div>
                      <div className="text-sm font-bold text-ink">{t.name}</div>
                      <div className="text-xs text-ink-4">
                        {[t.role, t.city].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                </Card>
              </MotionGlow>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}
