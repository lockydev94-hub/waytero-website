import { Car, Hotel, Map, MapPin, ArrowRight, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Car,
  Hotel,
  Map,
  MapPin,
};

interface ServiceItem {
  icon?: string | LucideIcon;
  title: string;
  desc?: string;
  link?: string;
  tone?: "primary" | "accent" | "success" | "info";
}
import { Container, Section, SectionHeader, IconBox, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";

interface ServicesSectionProps {
  variant: Record<string, unknown>;
}

const DEFAULT: ServiceItem[] = [
  { icon: Car, title: "Cab Booking", desc: "Instant city rides and outstation cabs.", link: "/cabs", tone: "primary" },
  { icon: Hotel, title: "Hotel Booking", desc: "Handpicked hotels & homestays with transparent pricing.", link: "/hotels", tone: "accent" },
  { icon: Map, title: "Tour Packages", desc: "Curated tour packages — fully managed, stress-free.", link: "/tours", tone: "success" },
  { icon: MapPin, title: "Live Tracking", desc: "Track your cab, driver, and booking in real-time.", link: "/track", tone: "info" },
];

export default function ServicesSection({ variant }: ServicesSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", pick<string>(variant, "eyebrow", "What we offer"));
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Everything for Your Journey"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "One platform for every travel need — from your first mile to your last check-out."));
  const items = pick<ServiceItem[]>(variant, "items", DEFAULT);

  return (
    <Section bg="muted" pad="lg" id="services" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />

        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((s) => {
            const Icon = typeof s.icon === "string" && ICONS[s.icon] ? ICONS[s.icon] : s.icon || Car;
            const tone = (["primary", "accent", "success", "info"] as const).includes(s.tone as never) ? (s.tone as never) : "primary";
            return (
              <MotionStaggerItem key={s.title} className="h-full">
                <MotionGlow color={((tone as string) === "info" ? "primary" : tone) as "primary" | "accent" | "success" | "danger"} intensity={0.18} size={260} className="h-full rounded-2xl">
                  <a
                    href={s.link}
                    className="group relative block h-full rounded-2xl bg-white p-6 overflow-hidden transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-1.5 hover:shadow-wt-lg border border-ink-7 hover:border-primary-200"
                  >
                    {/* Top accent bar reveals on hover */}
                    <span aria-hidden className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 via-primary-400 to-accent-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
                    {/* Bottom-right corner glow on hover */}
                    <div aria-hidden className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-primary-500/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <IconBox
                      icon={<Icon />}
                      tone={tone}
                      size="lg"
                      gradient
                      glow
                      className="mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                    />
                    <h3 className="text-lg font-bold text-ink mb-2 group-hover:text-primary-700 transition-colors">{s.title}</h3>
                    <p className="text-sm text-ink-3 leading-relaxed mb-5">{s.desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-2.5 transition-all">
                      Learn more <ArrowRight className="h-4 w-4" />
                    </span>
                  </a>
                </MotionGlow>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
