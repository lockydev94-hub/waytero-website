"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  BadgeCheck,
  Compass,
  Headset,
  MapPin,
  Plane,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Container, MotionFadeIn } from "@/components/ui";
import { pick } from "@/types/cms";
import type { ServiceType } from "@/types/cms";
import type { ServiceKey } from "@/lib/availability";
import HeroSearchForm from "@/components/sections/HeroSearchForm";
import type { PublicOfferSlide } from "@/services/publicCms";

/**
 * HeroSection — the homepage's opening band.
 *
 * Layout and styling follow the shared homepage design: the coastal photo runs
 * as a band over a navy-to-transparent gradient and stops in a soft curve just
 * above the booking card, so the highway stays in view; the copy sits left
 * (badge, headline with the brand word in accent, sub-headline, three trust
 * chips) and the sedan cut-out stands on the road at the band's bottom right,
 * its wheels level with the card's navy tab strip.
 *
 * Every visible string and asset is admin-authored (CMS → Homepage → Hero):
 *   variant_tag        → badge text
 *   headline           → "Explore India with|WayTero" — the part after the pipe
 *                        prints in the accent colour
 *   subheadline        → paragraph under it
 *   cta_text/link      → the strip's second tab (defaults to tour packages)
 *   background_image_url / mobile_image_url → hero photo
 *   accent_color       → accent word, icons, chips
 *   overlay_opacity    → gradient weight over the photo
 *   content.trust_items → the icon chips (label + icon name)
 *
 * Bundled WebP assets under /public/assets/homepage are the fallback, so a
 * fresh database with no CMS rows still renders the designed hero. Nothing
 * here invents the designed copy when the CMS is empty — the copy below is the
 * design's own, and it is replaced the moment an admin saves the variant.
 */

interface HeroSectionProps {
  variant: Record<string, unknown>;
  serviceType?: ServiceType | null;
  /** Verticals hidden site-wide — the hero search drops their tabs. */
  hiddenServices?: ServiceKey[];
  /** Kept in the contract for the homepage bundle; the redesigned hero seats
   *  offers in the OFFERS band instead of a sidebar slider. */
  offers?: PublicOfferSlide[];
}

interface TrustItem {
  icon?: string | null;
  label?: string | null;
}

/** Bundled defaults — the design's own media, converted from the shared PNGs. */
const DEFAULT_BG = "/assets/homepage/01-hero/sunset-coastal-highway-and-temple.webp";
const DEFAULT_CAR = "/assets/homepage/01-hero/glossy-white-sedan-with-waytero-badge.webp";

const DEFAULT_HEADLINE = "Explore India with|WayTero";
const DEFAULT_SUBHEADLINE =
  "Book reliable cabs for every journey and discover handpicked tour packages across India.";
const DEFAULT_EYEBROW = "India's Travel Operating System";
const DEFAULT_ACCENT = "#F05A22";

const DEFAULT_TRUST: TrustItem[] = [
  { icon: "BadgeCheck", label: "Verified Partners" },
  { icon: "ReceiptText", label: "Transparent Pricing" },
  { icon: "Headset", label: "24/7 Support" },
];

const TRUST_ICONS: Record<string, LucideIcon> = {
  BadgeCheck, ReceiptText, Headset, ShieldCheck, Sparkles, Compass,
  Star, MapPin, Wallet, Zap, Plane, Users,
};

/** The design's "Discover Odisha" nudge — a white card with an orange arrow
 *  badge. It hangs off the photo's right edge on desktop and sits compactly at
 *  the top-right of the photo on phones. */
function DiscoverCard({
  href,
  accent,
  className = "",
}: {
  href: string;
  accent: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`absolute z-10 flex flex-col items-center gap-1.5 bg-white/95 text-center shadow-[0_18px_40px_rgba(4,18,40,0.35)] backdrop-blur transition-transform hover:-translate-y-0.5 ${className}`}
    >
      <span
        className="grid h-9 w-9 place-items-center rounded-full text-white shadow-sm"
        style={{ background: accent }}
      >
        <ArrowUpRight className="h-4 w-4" />
      </span>
      <span className="text-[11px] font-extrabold leading-tight text-ink">
        Discover<br />Odisha
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-ink-4">
        Why here?
      </span>
    </Link>
  );
}

/** "Explore India with|WayTero" → lead + accent segment. */
function splitHeadline(raw: string): [string, string] {
  const at = raw.indexOf("|");
  if (at === -1) return [raw.trim(), ""];
  return [raw.slice(0, at).trim(), raw.slice(at + 1).trim()];
}

/** The rim around the photo's bitten-out corner. Only the top-left quarter of
 *  the circle shows, so the stops are placed for that arc. */
function rim(accent: string): string {
  return `conic-gradient(from 250deg, #FFC08A 0deg, ${accent} 30deg, ${accent} 52deg, #FF9A5E 74deg, #FFC08A 94deg)`;
}

/** rgba() for the navy wash, with the CMS opacity clamped to a legible range. */
function navy(alpha: number): string {
  return `rgba(6, 23, 48, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

export default function HeroSection({ variant, hiddenServices = [] }: HeroSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "") || DEFAULT_EYEBROW;
  const headline = pick<string>(variant, "headline", "") || DEFAULT_HEADLINE;
  const subline = pick<string>(variant, "subheadline", "") || DEFAULT_SUBHEADLINE;

  const accent = pick<string>(variant, "accent_color", "") || DEFAULT_ACCENT;
  const overlayRaw = pick<number | null>(variant, "overlay_opacity", null);
  // 0.55 is the design's wash; the column keeps copy readable without
  // flattening the photo the way a full-bleed dark scrim would.
  const overlay = typeof overlayRaw === "number" ? overlayRaw : 0.55;

  const bgImage = pick<string | null>(variant, "background_image_url", null) || DEFAULT_BG;
  const mobileImage = pick<string | null>(variant, "mobile_image_url", null) || bgImage;
  const bgVideo = pick<string | null>(variant, "background_video_url", null);

  // CTA doubles as the strip's second tab — the design's "Explore Tour
  // Packages" pill; no CTA means only the cab tab shows.
  const ctaText = pick<string | null>(variant, "cta_text", null);
  const ctaLink = pick<string | null>(variant, "cta_link", null);

  const trust = pick<TrustItem[]>(variant, "trust_items", []);
  const trustItems = (Array.isArray(trust) ? trust : []).filter((t) => !!t?.label?.trim());
  const trustSource = trustItems.length > 0 ? trustItems : DEFAULT_TRUST;

  const [lead, accentWord] = splitHeadline(headline);

  return (
    <section className="relative isolate overflow-hidden bg-ink-900 text-white lg:flex lg:flex-1 lg:flex-col">
      {/* ── Photo ───────────────────────────────────────────────────────
          Edge to edge behind everything and running right down past the
          booking card's bottom, exactly as the design layers it: the card
          floats on the photo, and the photo's bottom-right corner is bitten
          out in navy with an orange gradient rim. */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        {bgVideo ? (
          <video
            className="h-full w-full object-cover"
            src={bgVideo}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <>
            {/* Portrait crop for phones — the temple and coastline sit right of
                centre in the source, so the mobile layer is shifted there. */}
            <div className="absolute inset-0 lg:hidden">
              <Image
                src={mobileImage}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-[68%_center]"
              />
            </div>
            {/* Desktop: the photo's bottom edge lands exactly on the card's
                top line, the way the design frames it. That matters because
                the source's bottom band *is* the near highway — so anchoring
                the frame to the bottom puts asphalt under the sedan's wheels
                instead of the hedge it used to stand on. The 248px offset is
                the card's height plus the section's bottom padding, which is
                what sits between the card's top and the section's bottom. */}
            <div className="absolute inset-x-0 bottom-[260px] top-0 hidden overflow-hidden lg:block">
              <Image
                src={bgImage}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-bottom"
              />
            </div>
          </>
        )}

        {/* Desktop: copy-side navy wash. It has to fall away quickly — the
            design keeps the sunset, the surf and the highway readable from
            about a third of the way across, so only the copy column is
            shaded. */}
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background: `linear-gradient(90deg, ${navy(overlay + 0.35)} 0%, ${navy(overlay + 0.17)} 26%, ${navy(overlay - 0.12)} 44%, ${navy(overlay * 0.32)} 62%, ${navy(overlay * 0.1)} 80%, ${navy(0.02)} 100%)`,
          }}
        />
        {/* Mobile: top-to-bottom wash so the stacked card stays readable. */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background: `linear-gradient(180deg, ${navy(overlay + 0.32)} 0%, ${navy(overlay * 0.8)} 34%, ${navy(overlay + 0.28)} 78%, ${navy(overlay + 0.42)} 100%)`,
          }}
        />
        {/* Seats the band's bottom edge into the section — light, so the
            highway the sedan stands on still reads. */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/4"
          style={{ background: `linear-gradient(180deg, ${navy(0)} 0%, ${navy(overlay * 0.5)} 100%)` }}
        />
        {/* The design's corner: a wide navy bite out of the photo's
            bottom-right, edged with an orange gradient rim — light where it
            meets the edge, hot where it sweeps past the car. Two stacked
            circles centred on the corner: the ring, then navy inside it. */}
        <div
          className="absolute -bottom-[218px] -right-[290px] h-[400px] w-[580px] rounded-[50%]
            lg:-bottom-[330px] lg:-right-[430px] lg:h-[600px] lg:w-[860px]"
          style={{ background: rim(accent) }}
        />
        <div
          className="absolute -bottom-[202px] -right-[274px] h-[368px] w-[548px] rounded-[50%] bg-ink-900
            lg:-bottom-[308px] lg:-right-[408px] lg:h-[556px] lg:w-[816px]"
        />
      </div>

        {/* ── Discover card — flush with the photo's right edge on desktop, ─
               compact at the top-right of the photo on phones ──────────── */}
        <DiscoverCard
          href={ctaLink || "/tours"}
          accent={accent}
          className="right-0 top-[26%] z-20 hidden w-[104px] rounded-l-2xl border border-r-0 border-white/50 p-3.5 min-[1366px]:flex"
        />
        {/* Phones only, and hidden under 380px where it would collide with the
            eyebrow pill. */}
        <div className="absolute right-0 top-[6px] z-20 hidden min-[380px]:block min-[1366px]:hidden">
          <DiscoverCard
            href={ctaLink || "/tours"}
            accent={accent}
            className="right-0 top-0 w-[70px] rounded-l-xl border border-r-0 border-white/50 px-1 py-2"
          />
        </div>

        {/* ── Copy ────────────────────────────────────────────────────── */}
        <Container size="wide" className="relative z-10 pb-4 pt-14 sm:pt-16 lg:pt-16 [@media(max-height:840px)]:lg:pt-8">
          <div className="max-w-[620px]">
            {/* Eyebrow badge */}
            <MotionFadeIn>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-md sm:text-[11px]">
                <Compass className="h-3.5 w-3.5" style={{ color: accent }} aria-hidden />
                {eyebrow}
              </span>
            </MotionFadeIn>

            {/* Headline — second segment prints in the accent colour */}
            <MotionFadeIn delay={0.08}>
              <h1
                className="mt-4 text-balance text-[33px] font-extrabold leading-[1.04] tracking-[-0.025em] sm:mt-5 sm:text-[44px] lg:text-[54px] xl:text-[60px] [@media(max-height:840px)]:lg:text-[46px] [@media(max-height:740px)]:lg:text-[40px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {lead}
                {accentWord && (
                  <>
                    {" "}
                    <span style={{ color: accent }}>{accentWord}</span>
                  </>
                )}
              </h1>
            </MotionFadeIn>

            <MotionFadeIn delay={0.14}>
              <p className="mt-4 max-w-[520px] text-[13.5px] leading-relaxed text-white/85 sm:text-[15px]">
                {subline}
              </p>
            </MotionFadeIn>

            {/* Trust chips */}
            <MotionFadeIn delay={0.2}>
              <ul className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-2 sm:gap-x-6 sm:gap-y-2.5 drop-shadow-[0_1px_6px_rgba(4,18,40,0.55)]">
                {trustSource.map((item, i) => {
                  const Icon = (item.icon && TRUST_ICONS[item.icon]) || ShieldCheck;
                  return (
                    <li
                      key={`${item.label}-${i}`}
                      className="flex items-center gap-1.5 text-[10px] font-semibold text-white sm:gap-2 sm:text-[13px]"
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/45 sm:h-7 sm:w-7">
                        <Icon className="h-3 w-3 text-white/90 sm:h-3.5 sm:w-3.5" aria-hidden />
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </li>
                  );
                })}
              </ul>
            </MotionFadeIn>

          </div>
        </Container>

        {/* The card is wider than the copy column — in the design it runs to
            roughly 5% of the viewport either side while the headline sits at
            9%, so it cannot share the 1280px content container. */}
        {/* The gap below the copy is what exposes the photo's lower band: the
            desktop image is pinned to the card's top, so every pixel of gap
            shows another pixel of highway above the sedan. 176px is what it
            takes for the full temple and the road under the wheels to be in
            frame together. */}
        <div className="relative z-20 mx-auto w-full px-4 pb-6 sm:px-6 lg:mt-auto lg:px-[4.5%] lg:pb-12">
          {/* ── Booking card — floating on the photo's bottom edge, the way
                 the design layers it ────────────────────────────────────── */}
          <MotionFadeIn delay={0.24} className="relative mt-4 lg:mt-6">
            {/* The sedan — it belongs to the card, so its wheels stay level
                with the navy tab strip at every width. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-full z-30 hidden -translate-y-[14px] lg:block"
            >
              <Image
                src={DEFAULT_CAR}
                alt=""
                width={1774}
                height={887}
                sizes="(min-width: 1440px) 460px, 34vw"
                className="ml-auto mr-[2%] h-auto w-[36%] drop-shadow-[0_26px_44px_rgba(4,18,40,0.5)]"
              />
            </div>

            <HeroSearchForm
              hiddenServices={hiddenServices}
              appearance="light"
              secondaryTabLabel={ctaText || "Explore Tour Packages"}
            />
          </MotionFadeIn>
        </div>
    </section>
  );
}
