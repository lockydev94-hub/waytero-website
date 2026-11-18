import Image from "next/image";
import {
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
  CheckCircle2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Container, Section } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";

interface HowItWorksSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. Defaults to this band's
   *  own literal so every other page that uses it is unchanged. */
  bg?: BandTone;
}

interface Step {
  title: string;
  description: string;
  icon?: string;
}

/** Mirrored in the admin editor (sectionContentSchema.ts
 *  HOW_IT_WORKS_ICONS). */
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
  CheckCircle2,
};

/**
 * HowItWorksSection — the four-step strip under the why-us panel.
 *
 * Steps are admin-authored only (`content.steps`) — there is no invented
 * fallback, so a section with no steps paints nothing. Each card carries the
 * step number as a badge on its icon, and the row is joined by arrows on
 * desktop; the pale landscape behind keeps the band from reading as another
 * white grid.
 */
export default function HowItWorksSection({ variant, bg = "muted" }: HowItWorksSectionProps) {
  const title = pick<string>(variant, "headline", "How It Works");
  const subtitle = pick<string>(variant, "subheadline", "Book your cab or tour package in just a few simple steps.");
  const steps = pick<Step[]>(variant, "steps", []);
  if (steps.length === 0) return null;

  return (
    <Section
      bg={bg}
      pad="none"
      id="how-it-works"
      className="relative overflow-hidden pt-7 pb-9 lg:pt-8 lg:pb-11"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/assets/homepage/08-partner/wanderlust-how-it-works-landscape.webp"
          alt=""
          fill
          sizes="100vw"
          className="scale-105 object-cover object-[42%_72%] opacity-30 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-white/80 to-white/90" />
      </div>

      {/* `relative` is load-bearing: the backdrop above is absolutely
          positioned, and an abs-positioned sibling paints over static
          content — without this the heading sits under the white veil. */}
      <Container size="wide" className="relative">
        <div className="text-center">
          <h2 className="flex items-center justify-center gap-2.5 text-[21px] font-extrabold tracking-[-0.01em] text-ink sm:text-[23px] lg:text-[25px]">
            <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
            <span>{title}</span>
            <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
          </h2>
          {subtitle && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-4">{subtitle}</p>}
        </div>

        <div className="relative mt-5 lg:mt-6">
          {/* Joins the cards on desktop. The offset is half the gap, so the
              arrow sits in the gutter rather than on a card edge. */}
          {steps.length > 1 &&
            steps.slice(1).map((_, i) => (
              <span
                key={i}
                aria-hidden
                className="pointer-events-none absolute top-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-primary-500 lg:block"
                style={{ left: `calc(${((i + 1) / steps.length) * 100}% - 4px)` }}
              >
                <ArrowRight className="h-4 w-4" />
              </span>
            ))}

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = (step.icon && ICONS[step.icon]) || MapPin;
              return (
                <li
                  key={step.title}
                  className="relative rounded-2xl bg-white/85 p-5 shadow-[0_8px_28px_-16px_rgba(16,24,40,0.35)] ring-1 ring-white/70 backdrop-blur-sm"
                >
                  <div className="flex justify-center">
                    <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
                      <Icon className="h-5 w-5" aria-hidden />
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-accent-500 text-[10px] font-extrabold text-white ring-2 ring-white">
                        {i + 1}
                      </span>
                    </span>
                  </div>
                  <h3 className="mt-3 text-center text-[14px] font-bold leading-snug text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-center text-[12px] leading-snug text-ink-4">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
