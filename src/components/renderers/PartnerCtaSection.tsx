import Image from "next/image";
import { ArrowRight, Ticket, ThumbsUp, BarChart3, type LucideIcon } from "lucide-react";
import { Container, Section } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";

interface PartnerCtaSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. Defaults to this band's
   *  own literal so every other page that uses it is unchanged. */
  bg?: BandTone;
}

/** The band's three promises. Design furniture rather than editorial copy,
 *  so they stay in the renderer — the CTA variant accepts no content array. */
const BENEFITS: { icon: LucideIcon; label: string }[] = [
  { icon: Ticket, label: "More Bookings" },
  { icon: ThumbsUp, label: "Regular Earnings" },
  { icon: BarChart3, label: "Business Growth" },
];

const SCENIC = "/assets/homepage/08-partner/scenic-waytero-partner-journey.webp";

/**
 * PartnerCtaSection — the closing "Become a WayTero Partner" band.
 *
 * Replaces the generic "Ready for your next journey?" CTA on the homepage
 * only; the ten marketing pages that share that CTA keep CtaSection, because
 * recruiting drivers on /refund or /careers would be out of place.
 *
 * Composition follows the mock: artwork holds the left third, the claim sits
 * on a single line beside it, and the three promises run along the right
 * edge with an orange swoosh closing the bottom corner.
 */
export default function PartnerCtaSection({ variant, bg = "white" }: PartnerCtaSectionProps) {
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Become a WayTero Partner"));
  const subtitle = pick<string>(
    variant,
    "subheadline",
    pick<string>(variant, "subtitle", "Grow your business with Odisha's growing travel platform."),
  );
  const ctaText = pick<string>(variant, "cta_text", "Register as Partner");
  const ctaLink = pick<string>(variant, "cta_link", "/partner");

  return (
    <Section bg={bg} pad="home" id="cta" className="relative">
      <Container size="wide">
        <div className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(96deg,#07203F_0%,#0C3572_46%,#1A5FBE_100%)] shadow-[0_24px_60px_-40px_rgba(7,32,63,0.9)]">
          {/* Photo. In flow on phones (a banner above the copy), absolutely
              placed from `xl` so it can bleed the panel's full height. */}
          <div className="relative h-[150px] w-full overflow-hidden sm:h-[180px] lg:h-[190px] xl:absolute xl:inset-y-0 xl:left-0 xl:h-auto xl:w-[37%]">
            <Image
              src={SCENIC}
              alt="A WayTero partner beside his car on a hill road"
              fill
              sizes="(min-width: 1280px) 37vw, 100vw"
              className="object-cover object-[72%_22%]"
            />
            {/* Fades the artwork into the panel instead of ending on a seam. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[#0A2A55]/90 via-[#0A2A55]/25 to-transparent xl:bg-gradient-to-r xl:from-[#07203F]/50 xl:via-[#0A2A55]/5 xl:to-[#0C3572]"
            />
          </div>

          {/* Orange swoosh tucking into the bottom corner, as in the mock. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-[46px] -right-[22px] hidden h-[84px] w-[156px] rounded-[50%] border-[3px] border-accent-500/70 xl:block"
          />

          <div className="relative flex flex-col gap-6 px-6 py-6 xl:flex-row xl:items-center xl:gap-10 xl:py-7 xl:pl-[37%] xl:pr-8">
            <div className="min-w-0 xl:w-[456px] xl:flex-none">
              <h2 className="text-[24px] font-extrabold leading-[1.15] tracking-[-0.015em] text-white sm:text-[26px]">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 max-w-[358px] text-[12.5px] leading-[1.6] text-white/75">{subtitle}</p>
              )}
              <a
                href={ctaLink}
                className="mt-4 inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-accent-500 px-4 py-2 text-[12.5px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(240,90,34,0.9)] transition-colors hover:bg-accent-600"
              >
                {ctaText}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>

            <ul className="flex shrink-0 items-start gap-6 sm:gap-9 xl:ml-auto xl:gap-8">
              {BENEFITS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex w-[74px] flex-col items-center gap-2 text-center sm:w-auto">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-white/12 ring-1 ring-white/20">
                    <Icon className="h-4 w-4 text-white" strokeWidth={1.9} aria-hidden />
                  </span>
                  <span className="whitespace-nowrap text-[11px] font-semibold leading-tight text-white/90">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
