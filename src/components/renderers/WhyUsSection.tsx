import {
  Zap,
  ShieldCheck,
  IndianRupee,
  Lock,
  Headphones,
  Tag,
  Phone,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { Container, Section } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";

interface WhyUsSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. Defaults to this band's
   *  own literal so every other page that uses it is unchanged. */
  bg?: BandTone;
}

/** customer-web names an icon; the list is mirrored in the admin editor
 *  (sectionContentSchema.ts WHY_US_ICONS) so a pick is never a no-op. */
const ICONS: Record<string, LucideIcon> = {
  Zap,
  ShieldCheck,
  IndianRupee,
  Lock,
  Headphones,
  // Kept for variants authored before the 2026-11 redesign.
  Tag,
  Phone,
  Smartphone,
};

interface WhyUsItem {
  icon?: string | LucideIcon;
  title: string;
  desc?: string;
  tone?: "primary" | "success" | "accent" | "info" | "warning" | "danger";
}

/** Icon colour per tone — the tint that makes the row scannable comes from
 *  the badge, not from a per-card background. */
const TONE_ICON: Record<string, string> = {
  accent: "text-accent-500",
  success: "text-success",
  warning: "text-[#F2A03D]",
  danger: "text-danger",
  info: "text-primary-600",
  primary: "text-primary-600",
};

const DEFAULT: WhyUsItem[] = [
  { icon: Zap, title: "Instant Booking", desc: "Book in a few simple steps.", tone: "accent" },
  { icon: ShieldCheck, title: "Verified Partners", desc: "Background-checked drivers & operators.", tone: "success" },
  { icon: IndianRupee, title: "Transparent Pricing", desc: "Know your fare upfront.", tone: "warning" },
  { icon: Lock, title: "Secure Payments", desc: "Multiple safe and reliable options.", tone: "danger" },
  { icon: Headphones, title: "24x7 Support", desc: "Get help anytime, anywhere.", tone: "primary" },
];

/**
 * WhyUsSection — the "Why Choose WayTero?" panel.
 *
 * One pastel card: the claim on the left, five proof points on the right.
 * No eyebrow and no centred header — the heading lives inside the panel,
 * which is what gives the band its single-block shape.
 */
export default function WhyUsSection({ variant, bg = "white" }: WhyUsSectionProps) {
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Why Choose WayTero?"));
  const subtitle = pick<string>(
    variant,
    "subheadline",
    pick<string>(variant, "subtitle", "A trusted travel platform for safe, comfortable and hassle-free journeys.")
  );
  const items = pick<WhyUsItem[]>(variant, "items", DEFAULT);

  return (
    <Section bg={bg} pad="none" id="why-us" className="pt-7 pb-7 lg:pt-8 lg:pb-8">
      <Container size="wide">
        <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(100deg,#FBEFEA_0%,#F6F2FB_46%,#EDF3FE_100%)] px-6 py-7 ring-1 ring-white/70 lg:px-9 lg:py-8">
          {/* Side-by-side only from xl: five proof points next to a 260px
              claim need the room, and at lg they were wrapping to three lines. */}
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:gap-10">
            <div className="xl:w-[262px] xl:shrink-0">
              <h2 className="text-[21px] font-extrabold leading-tight tracking-[-0.01em] text-ink sm:text-[23px] lg:text-[24px]">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 max-w-[300px] text-[12.5px] leading-relaxed text-ink-3">{subtitle}</p>
              )}
            </div>

            <ul className="grid flex-1 grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 xl:flex xl:items-start xl:justify-between xl:gap-6">
              {items.map((r) => {
                const Icon = typeof r.icon === "string" ? (ICONS[r.icon] ?? Zap) : r.icon || Zap;
                const tone = TONE_ICON[r.tone ?? "primary"] ? (r.tone as string) : "primary";
                return (
                  <li key={r.title} className="min-w-0 lg:flex-1">
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_2px_10px_rgba(16,24,40,0.10)] ring-1 ring-black/[0.03] ${TONE_ICON[tone]}`}
                    >
                      <Icon className="h-[19px] w-[19px]" aria-hidden />
                    </span>
                    <h3 className="mt-3.5 text-[13.5px] font-bold leading-snug text-ink">{r.title}</h3>
                    {r.desc && (
                      <p className="mt-1 text-[11.5px] leading-snug text-ink-4">{r.desc}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
