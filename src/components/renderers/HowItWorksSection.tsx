import { Search, CalendarCheck, ShieldCheck, Plane, Car, MapPin, Wallet, Smartphone, CreditCard, Star, Users, Gift, HandHeart, type LucideIcon } from "lucide-react";
import { Container, Section, SectionHeader, IconBox, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";

interface HowItWorksSectionProps {
  variant: Record<string, unknown>;
}

interface Step {
  title: string;
  description: string;
  icon?: string;
}

const ICONS: Record<string, LucideIcon> = {
  Search,
  CalendarCheck,
  ShieldCheck,
  Plane,
  Car,
  MapPin,
  Wallet,
  Smartphone,
  CreditCard,
  Star,
  Users,
  Gift,
  HandHeart,
};

const PLACEHOLDER: Step[] = [
  { title: "Search & Compare", description: "Browse cabs, hotels and tour packages across 30+ cities and compare the best options in one place.", icon: "Search" },
  { title: "Choose Your Trip", description: "Pick the ride, stay or package that fits your budget and dates — with transparent pricing upfront.", icon: "CalendarCheck" },
  { title: "Pay Securely", description: "Pay online via wallet, UPI, cards or net-banking with 100% secure, GST-compliant billing.", icon: "ShieldCheck" },
  { title: "Travel with Ease", description: "Track your cab live, check in with a tap and get 24/7 support from start to finish.", icon: "Plane" },
];

export default function HowItWorksSection({ variant }: HowItWorksSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "Simple & transparent");
  const title = pick<string>(variant, "headline", "How WayTero Works");
  const subtitle = pick<string>(variant, "subheadline", "Book your entire trip in four simple steps.");
  const steps = pick<Step[]>(variant, "steps", PLACEHOLDER);

  return (
    <Section bg="muted" pad="lg" id="how-it-works" overlay="grid">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {/* Connector gradient line (lg only) */}
          <div aria-hidden className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-primary-300 to-transparent" />
          {steps.map((step, i) => {
            const Icon = (step.icon && ICONS[step.icon]) || MapPin;
            const tones = ["primary", "accent", "success", "info"] as const;
            const tone = tones[i % tones.length];
            const glowColor = (tone === "info" ? "primary" : tone) as "primary" | "accent" | "success" | "danger";
            return (
              <MotionStaggerItem key={step.title} className="h-full">
                <MotionGlow color={glowColor} intensity={0.18} size={260} className="h-full rounded-2xl">
                  <div className="group relative h-full rounded-2xl bg-white border border-ink-7 p-6 hover:border-primary-200 hover:shadow-wt-lg hover:-translate-y-1.5 transition-all duration-300 ease-[var(--ease-wt)] overflow-hidden">
                    {/* Top hairline gradient on hover */}
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <span className="absolute top-5 right-5 text-4xl font-extrabold text-ink-9 select-none group-hover:text-primary-100 transition-colors" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="relative mb-4">
                      <IconBox
                        icon={<Icon className="h-6 w-6" />}
                        tone={tone as "primary" | "accent" | "success" | "info"}
                        size="md"
                        gradient
                        glow
                        className="group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="text-base font-bold text-ink mb-2 group-hover:text-primary-700 transition-colors">{step.title}</h3>
                    <p className="text-sm text-ink-3 leading-relaxed">{step.description}</p>
                  </div>
                </MotionGlow>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
