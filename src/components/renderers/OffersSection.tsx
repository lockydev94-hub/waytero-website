import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgePercent, Car, Hotel, Plane, Ticket, type LucideIcon } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";
import type { PublicOfferSlide } from "@/services/publicCms";
import type { ServiceKey } from "@/lib/availability";

/* ============================================================
   WayTero — homepage offers band (coupon cards)

   Data source: GET /public/offers — live, published, coupon-backed
   offers only. The band is not fed by the legacy `content.offers`
   JSONB any more; the CMS section now owns the header copy alone.

   Clicking a card opens /offers/{slug}, which carries the coupon into
   the booking flow, so the code shown here is the code that applies.
   ============================================================ */

interface OffersSectionProps {
  variant: Record<string, unknown>;
  /** Live offers from the Offers admin page. */
  offers: PublicOfferSlide[];
  /** Verticals hidden site-wide — their cards are dropped, and the band
   *  disappears entirely when nothing is left. */
  hidden?: ServiceKey[];
}

const SERVICE_META: Record<ServiceKey, { icon: LucideIcon; gradient: string; fallback: string; glow: string }> = {
  CAB: {
    icon: Car,
    gradient: "from-primary-700 via-primary-600 to-primary-500",
    fallback: "On cab bookings",
    glow: "bg-primary-400/30",
  },
  HOTEL: {
    icon: Hotel,
    gradient: "from-accent-600 via-accent-500 to-rose-500",
    fallback: "On hotel bookings",
    glow: "bg-accent-400/30",
  },
  TOUR: {
    icon: Plane,
    gradient: "from-ink-800 via-ink-700 to-primary-800",
    fallback: "On tour packages",
    glow: "bg-sky-400/25",
  },
};

/**
 * "FLAT 10% OFF" → ["FLAT ", "10", "% OFF"] so the number can be set larger
 * than its surroundings, the way a coupon face reads.
 */
function badgeRuns(badge: string): { text: string; numeric: boolean }[] {
  return badge
    .split(/([₹]?\d[\d.,]*)/)
    .filter((s) => s !== "")
    .map((s) => ({ text: s, numeric: /^[₹]?\d/.test(s) }));
}

export default function OffersSection({ variant, offers, hidden = [] }: OffersSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "Limited-time deals");
  const title = pick<string>(variant, "headline", "Offers & Deals");
  const subtitle = pick<string>(
    variant,
    "subheadline",
    "Coupon-backed deals — the code on the card is the code that applies at booking.",
  );

  const live = offers.filter((o) => !hidden.includes(o.service_type));
  // No fallback list: a promo the admin hasn't authored is not a real deal
  // (owner rule — nothing on the site that the database can't back up).
  if (live.length === 0) return null;

  return (
    <Section bg="white" pad="lg" id="offers" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />

        {/* Horizontal snap strip — one card at a time on a phone, all of them
            on a desktop that has room, no wrap that breaks the coupon shape. */}
        <MotionStagger className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {live.map((offer) => {
            const meta = SERVICE_META[offer.service_type] ?? SERVICE_META.CAB;
            const Icon = meta.icon;
            return (
              <MotionStaggerItem
                key={offer.slug}
                className="w-[86%] min-w-[280px] snap-start sm:w-[340px]"
              >
                <Link
                  href={`/offers/${offer.slug}`}
                  className={`group relative flex h-full min-h-[190px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-1.5 hover:shadow-wt-xl ${meta.gradient}`}
                >
                  {/* Photo bleeds in from the right behind the gradient. An
                      offer image is a finished marketing flyer with its own
                      lettering, so it stays faint and the copy column is
                      scrimmed — texture, never a second headline. */}
                  {offer.image_url && (
                    <>
                      <Image
                        src={offer.image_url}
                        alt=""
                        aria-hidden
                        fill
                        sizes="340px"
                        className="absolute inset-0 h-full w-full object-cover opacity-[0.16] mix-blend-luminosity transition-transform duration-700 group-hover:scale-110 group-hover:opacity-25"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-tr from-black/30 via-black/10 to-transparent"
                      />
                    </>
                  )}
                  <div aria-hidden className={`pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full blur-2xl ${meta.glow} transition-transform duration-500 group-hover:scale-125`} />
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  {/* Perforated coupon edge */}
                  <span aria-hidden className="pointer-events-none absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white" />
                  <span aria-hidden className="pointer-events-none absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white" />

                  <div className="relative flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                      <Icon className="h-3.5 w-3.5" /> {offer.service_type}
                    </span>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-transform duration-300 group-hover:rotate-12">
                      <BadgePercent className="h-4 w-4" />
                    </span>
                  </div>

                  {/* The card is an <a>, and globals.css sets `a { color: inherit }`
                      outside any cascade layer, which outranks Tailwind's
                      utilities — so `text-white` on the Link never lands. The
                      colour has to sit on an element inside it. */}
                  <div className="relative mt-3 flex-1 text-white">
                    {/* A long badge ("UPTO 10% OFF (₹150 MAX)") has to fit the
                        same 300px column as a short one, so the number shrinks
                        rather than breaking the phrase across three lines. */}
                    <div
                      className={`flex flex-wrap items-baseline gap-x-1.5 leading-none ${
                        offer.badge.length > 18 ? "text-[21px]" : "text-[28px]"
                      }`}
                    >
                      {badgeRuns(offer.badge).map((run, k) =>
                        run.numeric ? (
                          <span key={k} className="font-extrabold tracking-tight drop-shadow-sm">
                            {run.text}
                          </span>
                        ) : (
                          <span key={k} className="text-[13px] font-bold uppercase tracking-wide text-white/90">
                            {run.text}
                          </span>
                        ),
                      )}
                    </div>
                    <h3 className="mt-1.5 text-[15px] font-bold leading-snug">{offer.title}</h3>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-white/85">
                      {offer.short_description?.trim() || meta.fallback}
                    </p>
                  </div>

                  <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-dashed border-white/40 pt-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 font-mono text-[11px] font-bold tracking-wider text-ink shadow-wt-sm">
                      <Ticket className="h-3.5 w-3.5" /> {offer.coupon_code}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-white/90 transition-all group-hover:gap-2 group-hover:text-white">
                      Book now <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
