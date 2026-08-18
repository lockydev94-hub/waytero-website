import { Zap, ShieldCheck, Tag, Phone, Lock, Smartphone, type LucideIcon } from "lucide-react";
import { Container, Section, SectionHeader, IconBox, Card } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";

interface WhyUsSectionProps {
  variant: Record<string, unknown>;
}

const ICONS: Record<string, LucideIcon> = {
  Zap,
  ShieldCheck,
  Tag,
  Phone,
  Lock,
  Smartphone,
};

interface WhyUsItem {
  icon?: string | LucideIcon;
  title: string;
  desc?: string;
  tone?: "primary" | "success" | "accent" | "info" | "warning" | "danger";
}

const DEFAULT: WhyUsItem[] = [
  { icon: Zap, title: "Instant Booking", desc: "Book in under 60 seconds. No long forms, no wait.", tone: "primary" },
  { icon: ShieldCheck, title: "Verified Partners", desc: "Every driver, hotel, and operator is background-checked.", tone: "success" },
  { icon: Tag, title: "Transparent Pricing", desc: "No hidden charges. What you see is what you pay.", tone: "accent" },
  { icon: Phone, title: "24/7 Support", desc: "Real humans available around the clock to help.", tone: "info" },
  { icon: Lock, title: "Secure Payments", desc: "Razorpay-powered with encrypted transactions.", tone: "warning" },
  { icon: Smartphone, title: "Real-Time Tracking", desc: "Know exactly where your cab or package is, always.", tone: "danger" },
];

export default function WhyUsSection({ variant }: WhyUsSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", pick<string>(variant, "eyebrow", "Why choose us"));
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Built for Indian Travelers"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "We understand the nuances of travel across India — and built WayTero to solve them."));
  const items = pick<WhyUsItem[]>(variant, "items", DEFAULT);

  return (
    <Section bg="white" pad="lg" id="why-us" overlay="grid">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {items.map((r) => {
            const Icon = typeof r.icon === "string" && ICONS[r.icon] ? ICONS[r.icon] : r.icon || Zap;
            const tone = (["primary", "success", "accent", "info", "warning", "danger"] as const).includes(r.tone as never) ? (r.tone as never) : "primary";
            return (
              <MotionStaggerItem key={r.title} className="h-full">
                <Card variant="default" hover lift="sm" className="group flex h-full gap-5 items-start border-ink-7/70 hover:border-primary-200 hover:bg-primary-50/20">
                  <div className="flex-shrink-0">
                    <IconBox
                      icon={<Icon />}
                      tone={tone}
                      size="md"
                      gradient
                      glow
                      className="group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">{r.title}</h3>
                    <p className="text-sm text-ink-3 leading-relaxed">{r.desc}</p>
                  </div>
                </Card>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
